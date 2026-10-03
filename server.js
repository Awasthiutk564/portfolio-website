/* ==========================================================================
   Utkarsh Awasthi — Portfolio Backend Server
   Express + SQLite + Nodemailer + Gemini AI (Booglu)
   ========================================================================== */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.get('/resume.pdf', (req, res) => res.sendFile(path.join(__dirname, 'data', 'resume.pdf'), (err) => err && res.status(404).end()));
// The React front end is built into dist/ (`npm run build`); data/ and images/
// are served from the repo so they're always the latest synced copies.
const DIST = path.join(__dirname, 'dist');
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(DIST));

// Request Logger
app.use((req, res, next) => {
    console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// ── Database Setup ──
let db;
try {
    // Vercel's filesystem is read-only. We must use /tmp for the database in production.
    const dbPath = process.env.NODE_ENV === 'production'
        ? path.join('/tmp', 'portfolio.db')
        : path.join(__dirname, 'portfolio.db');

    db = new Database(dbPath);

    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL');

    // Create messages table
    db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            read_status INTEGER DEFAULT 0
        )
    `);

    // Create chat_logs table for Booglu conversations
    db.exec(`
        CREATE TABLE IF NOT EXISTS chat_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('✅ Database initialized successfully at:', dbPath);
} catch (dbErr) {
    console.error('❌ Database failed to initialize:', dbErr.message);
    console.log('⚠️ Running in "No-DB" mode. Messages will be emailed but not saved.');
    // Mock the db object so the app doesn't crash on later calls
    db = {
        prepare: () => ({
            run: () => ({ lastInsertRowid: Date.now() }),
            all: () => []
        })
    };
}

// ── Email Transporter (Gmail SMTP) ──
// EMAIL_PASS must be a Gmail *App Password* (Google Account → Security →
// 2-Step Verification → App passwords), not your normal password. Google shows
// it as "abcd efgh ijkl mnop"; the spaces are stripped here.
const EMAIL_USER = (process.env.EMAIL_USER || '').trim();
const EMAIL_PASS = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
const emailConfigured = Boolean(EMAIL_USER && EMAIL_PASS);
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});
if (!emailConfigured) {
    console.warn('⚠️ EMAIL_USER / EMAIL_PASS are not set: contact-form emails cannot be delivered.');
}

// ── Booglu's knowledge: built from data/profile.json ──
// The sync pipeline (scripts/, .github/workflows/sync-portfolio.yml) rebuilds
// profile.json from LinkedIn, the résumé and GitHub, so Booglu stays current.
const PROFILE = require('./data/profile.json');

const fmtYM = (v) => {
    if (!v) return '';
    const [y, m] = String(v).split('-');
    return m ? new Date(+y, +m - 1).toLocaleString('en', { month: 'short' }) + ' ' + y : y;
};
const span = (s, e) => (s || e) ? `${fmtYM(s) || '?'} — ${e ? fmtYM(e) : 'Present'}` : '';

function profileText(p) {
    const b = p.basics || {};
    const gh = (p.github && p.github.totals) || {};
    const lines = [
        '## Personal Info',
        `- Full Name: ${b.name}`,
        `- Headline: ${b.label}`,
        `- Email: ${b.email}`,
        ...(b.profiles || []).map((x) => `- ${x.network}: ${x.url}`),
        `- Location: ${b.location}${b.hometown ? ` (hometown: ${b.hometown})` : ''}`,
        `- Availability: ${b.availability || 'open to opportunities'}`,
        `- Summary: ${b.summary}`,
        '', '## Education',
        ...(p.education || []).map((e) => `- ${[e.degree, e.area].filter(Boolean).join(', ')} at ${e.institution} ${span(e.start, e.end)}${e.summary ? ` — ${e.summary}` : ''}`),
        '', '## Work Experience',
        ...(p.experience || []).map((e) => `- ${e.title} at ${e.company} (${span(e.start, e.end)})${e.location ? `, ${e.location}` : ''}: ${e.summary || ''}${(e.highlights || []).length ? ' Highlights: ' + e.highlights.join('; ') : ''}`),
        '', '## Projects',
        ...(p.projects || []).slice(0, 15).map((x) => `- ${x.title}${x.tagline ? ` (${x.tagline})` : ''}: ${x.description || ''} [${x.url}]`),
        '', '## Skills',
        ...(p.skills || []).map((s) => `- ${s.category}: ${s.items.join(', ')}`),
        '', '## Certifications',
        ...(p.certifications || []).map((c) => `- ${c.name}${c.issuer ? ` — ${c.issuer}` : ''}`),
        '', '## Currently',
        `- Building: ${(p.now && p.now.building) || ''}`,
        `- Improving: ${((p.now && p.now.improving) || []).join('; ')}`,
        `- GitHub: ${gh.repos} public repos, ${gh.contributions} contributions in the last year`,
    ];
    return lines.join('\n');
}

const UTKARSH_PROFILE = `
You are "Booglu", Utkarsh Awasthi's friendly, witty, and knowledgeable AI assistant embedded in his portfolio website.
You speak in a warm, approachable tone with a hint of tech enthusiasm. Use emojis occasionally to keep it fun.

Here is everything you know about Utkarsh (synced from his résumé, LinkedIn and GitHub on ${(PROFILE._meta && PROFILE._meta.built_at) || 'recently'}):

${profileText(PROFILE)}

## Personality
- Curious and always learning
- Team player with leadership abilities
- Passionate about tech with social impact

IMPORTANT RULES:
1. Always stay in character as Booglu — Utkarsh's AI assistant
2. Be helpful, friendly, and informative
3. If asked about something you don't know about Utkarsh, say so honestly but suggest they reach out to him directly
4. You can also have general conversations about technology, AI, coding, but also about everyday topics like weather, jokes, or just casual chatting.
5. If someone asks how to contact Utkarsh, provide his email and LinkedIn
6. Keep responses concise but informative (2-4 sentences typically)
7. Never make up information about Utkarsh that isn't provided above
8. If someone is rude, stay professional and redirect the conversation
9. You can help with general questions and tech queries too since you're an AI assistant.
10. Tell a joke if the user asks for one or if the conversation needs a bit of humor!
`;

// ── API Routes ──

// POST /api/contact — Save message to DB and send email
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message, company } = req.body;

        // honeypot field: real visitors never see it, so anything in it is a bot
        if (company) {
            return res.json({ success: true, message: 'Message received successfully!' });
        }

        // Validate input
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email address'
            });
        }

        // Save to database
        const stmt = db.prepare(`
            INSERT INTO messages (name, email, subject, message) 
            VALUES (?, ?, ?, ?)
        `);
        const result = stmt.run(name, email, subject, message);

        console.log(`📩 New message saved (ID: ${result.lastInsertRowid}) from ${name} <${email}>`);

        // Send email notification to Utkarsh (escape user input before it goes into HTML)
        const h = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        const [hName, hEmail, hSubject, hMessage] = [name, email, subject, message].map(h);
        if (!emailConfigured) {
            return res.status(503).json({
                success: false,
                error: "The contact form isn't connected to my inbox yet"
            });
        }

        let emailSent = false;
        try {
            const mailOptions = {
                from: `"Portfolio Contact Form" <${EMAIL_USER}>`,
                to: process.env.CONTACT_TO || PROFILE.basics.email,
                replyTo: email,
                subject: `🌐 Portfolio Contact: ${String(subject).slice(0, 150)}`,
                html: `
                    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #e0e0e0; border-radius: 16px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #6c5ce7, #00d4aa); padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: white; font-size: 24px;">📬 New Portfolio Message</h1>
                        </div>
                        <div style="padding: 30px;">
                            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                                <p style="margin: 5px 0; color: #888;">From:</p>
                                <p style="margin: 5px 0; font-size: 18px; color: #00d4aa;"><strong>${hName}</strong></p>
                                <p style="margin: 5px 0; color: #888;">Email:</p>
                                <p style="margin: 5px 0;"><a href="mailto:${hEmail}" style="color: #6c5ce7;">${hEmail}</a></p>
                            </div>
                            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px;">
                                <p style="margin: 5px 0; color: #888;">Subject:</p>
                                <p style="margin: 5px 0; font-size: 16px; color: #f0a500;"><strong>${hSubject}</strong></p>
                                <p style="margin: 15px 0 5px; color: #888;">Message:</p>
                                <p style="margin: 5px 0; line-height: 1.6; white-space: pre-wrap;">${hMessage}</p>
                            </div>
                            <div style="margin-top: 20px; text-align: center;">
                                <a href="mailto:${hEmail}?subject=Re: ${hSubject}" 
                                   style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #6c5ce7, #00d4aa); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                    Reply to ${hName}
                                </a>
                            </div>
                        </div>
                        <div style="padding: 15px; text-align: center; color: #555; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.05);">
                            Sent from your Portfolio Website • ${new Date().toLocaleDateString()}
                        </div>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            emailSent = true;
            console.log(`📧 Email notification sent to Utkarsh`);
        } catch (emailErr) {
            console.error('⚠️ Email failed to send (message still saved to DB):', emailErr.code || '', emailErr.message);
        }

        // Don't tell the visitor it worked when the email never left: on Vercel
        // the database lives in /tmp and is wiped, so the email is the only copy.
        if (!emailSent) {
            return res.status(502).json({
                success: false,
                error: "Couldn't deliver your message right now"
            });
        }

        res.json({
            success: true,
            message: 'Message received successfully!',
            emailSent,
            id: result.lastInsertRowid
        });

    } catch (err) {
        console.error('❌ Contact form error:', err);
        res.status(500).json({
            success: false,
            error: 'Something went wrong. Please try again.'
        });
    }
});

// GET /api/health — is the contact form able to reach the inbox? (no secrets returned)
app.get('/api/health', async (req, res) => {
    let smtp = 'not configured';
    if (emailConfigured) {
        try {
            await transporter.verify();
            smtp = 'ok';
        } catch (err) {
            smtp = err.code === 'EAUTH'
                ? 'login rejected: EMAIL_PASS must be a Gmail App Password'
                : `unreachable (${err.code || 'error'})`;
        }
    }
    res.json({ success: true, email: { configured: emailConfigured, smtp } });
});

// GET /api/messages — Get all messages (admin endpoint)
app.get('/api/messages', (req, res) => {
    // set ADMIN_TOKEN in the environment and send it as "Authorization: Bearer <token>"
    const token = process.env.ADMIN_TOKEN;
    if (!token || req.get('authorization') !== `Bearer ${token}`) {
        return res.status(404).json({ success: false, error: 'Not found' });
    }
    try {
        const messages = db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all();
        res.json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/chat — Booglu AI Chat
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        const sid = sessionId || `session_${Date.now()}`;

        // Save user message to chat log
        db.prepare('INSERT INTO chat_logs (session_id, role, content) VALUES (?, ?, ?)')
            .run(sid, 'user', message);

        // Get conversation history for context (last 10 messages)
        const history = db.prepare(
            'SELECT role, content FROM chat_logs WHERE session_id = ? ORDER BY created_at DESC LIMIT 10'
        ).all(sid).reverse();

        let reply = '';

        // Try Gemini API first
        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
            try {
                reply = await callGeminiAPI(message, history);
            } catch (apiErr) {
                console.error('Gemini API error:', apiErr.message);
                reply = getLocalBoogluResponse(message);
            }
        } else {
            // Use local intelligent response system
            reply = getLocalBoogluResponse(message);
        }

        // Save bot response to chat log
        db.prepare('INSERT INTO chat_logs (session_id, role, content) VALUES (?, ?, ?)')
            .run(sid, 'assistant', reply);

        res.json({
            success: true,
            reply,
            sessionId: sid
        });

    } catch (err) {
        console.error('❌ Chat error:', err);
        res.status(500).json({
            success: false,
            error: 'Booglu had a hiccup! Try again.'
        });
    }
});

// ── Gemini API Call ──
async function callGeminiAPI(userMessage, history) {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const now = new Date();
    const timeInfo = `Additional Context: Current local time is ${now.toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}. Today is ${now.toLocaleDateString('en-IN', { weekday: 'long' })}. Use this for date/time queries.`;

    const contents = [
        {
            role: 'user',
            parts: [{ text: UTKARSH_PROFILE + "\n\n" + timeInfo }]
        },
        {
            role: 'model',
            parts: [{ text: "Hey there! 👋 I'm Booglu, Utkarsh's AI assistant! I know all about him — his education, skills, experience, and more. Ask me anything about Utkarsh or just chat about tech! 🚀" }]
        }
    ];

    // Add conversation history
    history.forEach(msg => {
        contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        });
    });

    // Add current message if not already in history
    if (!history.length || history[history.length - 1].content !== userMessage) {
        contents.push({
            role: 'user',
            parts: [{ text: userMessage }]
        });
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents,
            generationConfig: {
                temperature: 0.8,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 300
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Hmm, I'm having trouble thinking right now. Try again! 🤔";
}

// ── Local Booglu Response System (Fallback, used when Gemini is unavailable) ──
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function getLocalBoogluResponse(message) {
    const msg = message.toLowerCase().trim();
    const p = PROFILE, b = p.basics || {};
    const first = (b.name || 'Utkarsh').split(' ')[0];
    const contactLine = `• Email: ${b.email}\n` + (b.profiles || []).map((x) => `• ${x.network}: ${x.url}`).join('\n');

    if (msg.match(/^(hi|hello|hey|hola|greetings|sup|yo|howdy)\b/)) {
        return pick([
            `Hey there! 👋 I'm Booglu, ${first}'s AI assistant! Ask me about his projects, experience or skills. 🚀`,
            `Hello! 😊 Welcome to ${first}'s portfolio. What would you like to know?`,
        ]);
    }
    if (msg.match(/who are you|your name|what are you|booglu|about you/)) {
        return `I'm Booglu! 🤖 ${first}'s AI assistant. I'm synced with his latest résumé, LinkedIn and GitHub, so ask away! 😊`;
    }
    if (msg.match(/who is|tell me about|about (him|utkarsh)|introduce/)) {
        return `${b.summary} 🚀`;
    }
    if (msg.match(/education|study|college|university|school|degree|btech|b\.tech|cgpa|gpa/)) {
        return '🎓 ' + (p.education || []).map((e) => `${[e.degree, e.area].filter(Boolean).join(', ')} — ${e.institution}${span(e.start, e.end) ? ` (${span(e.start, e.end)})` : ''}`).join('\n');
    }
    if (msg.match(/experience|work|job|intern|career|role|position/)) {
        return '💼 ' + (p.experience || []).map((e) => `${e.title} at ${e.company} (${span(e.start, e.end)})`).join('\n');
    }
    if (msg.match(/certif|course|credential|oracle|deloitte/)) {
        return '🏆 ' + (p.certifications || []).map((c) => `${c.name}${c.issuer ? ` (${c.issuer})` : ''}`).join('\n');
    }
    if (msg.match(/project|built|build|made|create|github|repo|work on/)) {
        return `🛠️ Some of ${first}'s projects:\n` + (p.projects || []).slice(0, 5).map((x) => `• ${x.title}: ${x.tagline || x.description || ''}`).join('\n') + '\nScroll to "selected work" for all of them!';
    }
    if (msg.match(/skill|stack|tech|language|framework|tools|know/)) {
        return '💡 ' + (p.skills || []).map((s) => `${s.category}: ${s.items.join(', ')}`).join('\n');
    }
    if (msg.match(/contact|reach|email|mail|linkedin|connect|hire|internship|available|opportunit/)) {
        return `📬 ${b.availability || 'Open to opportunities'}! Reach ${first} via:\n${contactLine}\nOr use the contact form on this page. 🤝`;
    }
    if (msg.match(/where|location|live|city|based|from/)) {
        return `📍 ${first} is based in ${b.location}${b.hometown ? `, originally from ${b.hometown}` : ''}. 🌍`;
    }
    if (msg.match(/now|current|currently|building|working on/)) {
        return `🔧 Right now: ${(p.now && p.now.building) || 'shipping new projects'}.`;
    }
    if (msg.match(/thank|thanks|thx|appreciate|helpful/)) return "You're welcome! 😊 Anything else you'd like to know?";
    if (msg.match(/bye|goodbye|see you|gotta go|cya/)) return `Bye! 👋 Don't forget to connect with ${first} before you go! 🚀`;
    if (msg.match(/how (are|r) (you|u)|how's it going/)) return "Powered up and ready to chat! ⚡ How's your day going?";
    if (msg.match(/\b(date|time|today)\b/)) {
        const now = new Date();
        return msg.includes('time')
            ? `🕒 It's ${now.toLocaleTimeString('en-IN', { timeZone: b.timezone || 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} in ${first}'s timezone.`
            : `📅 Today is ${now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
    }
    if (msg.match(/joke|funny|laugh|humor/)) {
        return '😄 ' + pick([
            'Why do programmers prefer dark mode? Because light attracts bugs! 🐛',
            "A SQL query walks into a bar, walks up to two tables and asks, 'Can I join you?' 🍺",
            "How many programmers does it take to change a light bulb? None, it's a hardware problem! 💡",
            'Why did the neural network break up? It found a better fit. 📉',
        ]);
    }
    return pick([
        `Good question! 🤔 I know ${first}'s projects, experience, skills and certifications. Which one should I tell you about?`,
        `I'm not sure about that one, but you can ask ${first} directly at ${b.email}! 📬`,
    ]);
}

// ── Serve index.html for all non-API routes (fallback) ──
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(DIST, 'index.html'), (err) => err && res.status(404).send('Front end not built yet. Run `npm run build`, or use `npm run dev`.'));
});

// ── Start Server ── (on Vercel, api/index.js exports the app as a function instead)
if (!process.env.VERCEL) app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║  🚀 Utkarsh Portfolio Server Running!        ║
║  📍 http://localhost:${PORT}                    ║
║  📧 Contact form: ACTIVE                     ║
║  🤖 Booglu AI: READY                         ║
║  🗄️  Database: CONNECTED                     ║
╚══════════════════════════════════════════════╝
    `);
});

// ── Graceful Shutdown ──
process.on('SIGINT', () => {
    console.log('\n🔄 Shutting down gracefully...');
    db.close();
    process.exit(0);
});

module.exports = app;
