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
app.use(express.static(path.join(__dirname)));

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
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ── Utkarsh's Profile Data for Booglu AI ──
const UTKARSH_PROFILE = `
You are "Booglu", Utkarsh Awasthi's friendly, witty, and knowledgeable AI assistant embedded in his portfolio website. 
You speak in a warm, approachable tone with a hint of tech enthusiasm. Use emojis occasionally to keep it fun.

Here is everything you know about Utkarsh:

## Personal Info
- Full Name: Utkarsh Awasthi
- Email: awasthiutk13@gmail.com
- LinkedIn: www.linkedin.com/in/utkarsh-awasthi-276a92367
- Location: Vijayawada, Andhra Pradesh, India (hometown connection to Lucknow, UP)
- Current Status: 2nd Year B.Tech student

## Education
- B.Tech in Electronics and Communication Engineering (ECE) at SRM University, AP (August 2024 — August 2028) — Currently Pursuing
- Intermediate — Science (Maths) from S.R. Public School (April 2022 — May 2023) — Completed
- High School from Rani Laxmi Bai Memorial School (R.L.B.) — Completed

## Work Experience
1. Internal Affairs Lead at HackShastra SRMAP (December 2025 — Present)
   - Leading internal affairs operations
   - Coordinating team activities
   - Managing communication channels between departments for hackathon events at SRM AP
   - Skills: Leadership, Event Management, Team Coordination

2. Fundraiser at NayePankh Foundation (August 2025 — December 2025)
   - Worked as a fundraising intern
   - Strengthened interpersonal and team skills
   - Contributed to meaningful social impact initiatives over 5 months
   - Location: New Delhi, India
   - Skills: Fundraising, Social Impact, Team Skills

## Skills
- Simulink — Advanced
- Generative AI — Advanced
- AI Driven Tools — Advanced
- Programming & AI — Intermediate
- IoT & Embedded Systems — Intermediate
- Full Stack Development — Learning

## Certifications
1. Master Generative AI & Get the Gen Z Edge
2. Technology Job Simulation — Deloitte Australia
3. Oracle Fusion AI Agent Studio — Oracle University
4. AI for Business Professionals
5. Prompt Engineering with GitHub Copilot — GitHub / Microsoft

## Interests & Passions
- Artificial Intelligence and Machine Learning
- Internet of Things (IoT)
- Embedded Systems
- Full Stack Web Development
- Hackathons and Tech Events
- Open to collaborations and new opportunities

## Personality
- Curious and always learning
- Team player with leadership abilities
- Passionate about tech with social impact
- Oracle Certified professional

IMPORTANT RULES:
1. Always stay in character as Booglu — Utkarsh's AI assistant
2. Be helpful, friendly, and informative
3. If asked about something you don't know about Utkarsh, say so honestly but suggest they reach out to him directly
4. You can also have general conversations about technology, AI, coding, etc.
5. If someone asks how to contact Utkarsh, provide his email and LinkedIn
6. Keep responses concise but informative (2-4 sentences typically)
7. Never make up information about Utkarsh that isn't provided above
8. If someone is rude, stay professional and redirect the conversation
9. You can help with general tech questions too since you're an AI assistant
`;

// ── API Routes ──

// POST /api/contact — Save message to DB and send email
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

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

        // Send email notification to Utkarsh
        let emailSent = false;
        try {
            const mailOptions = {
                from: `"Portfolio Contact Form" <${process.env.EMAIL_USER}>`,
                to: 'awasthiutk13@gmail.com',
                replyTo: email,
                subject: `🌐 Portfolio Contact: ${subject}`,
                html: `
                    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #e0e0e0; border-radius: 16px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #6c5ce7, #00d4aa); padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: white; font-size: 24px;">📬 New Portfolio Message</h1>
                        </div>
                        <div style="padding: 30px;">
                            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                                <p style="margin: 5px 0; color: #888;">From:</p>
                                <p style="margin: 5px 0; font-size: 18px; color: #00d4aa;"><strong>${name}</strong></p>
                                <p style="margin: 5px 0; color: #888;">Email:</p>
                                <p style="margin: 5px 0;"><a href="mailto:${email}" style="color: #6c5ce7;">${email}</a></p>
                            </div>
                            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px;">
                                <p style="margin: 5px 0; color: #888;">Subject:</p>
                                <p style="margin: 5px 0; font-size: 16px; color: #f0a500;"><strong>${subject}</strong></p>
                                <p style="margin: 15px 0 5px; color: #888;">Message:</p>
                                <p style="margin: 5px 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                            </div>
                            <div style="margin-top: 20px; text-align: center;">
                                <a href="mailto:${email}?subject=Re: ${subject}" 
                                   style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #6c5ce7, #00d4aa); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                    Reply to ${name}
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
            console.error('⚠️ Email failed to send (message still saved to DB):', emailErr.message);
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

// GET /api/messages — Get all messages (admin endpoint)
app.get('/api/messages', (req, res) => {
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

    const contents = [
        {
            role: 'user',
            parts: [{ text: UTKARSH_PROFILE }]
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

// ── Local Booglu Response System (Fallback) ──
function getLocalBoogluResponse(message) {
    const msg = message.toLowerCase().trim();

    // Greetings
    if (msg.match(/^(hi|hello|hey|hola|greetings|sup|yo|howdy)/)) {
        const greetings = [
            "Hey there! 👋 I'm Booglu, Utkarsh's AI assistant! How can I help you today? Ask me anything about Utkarsh or just chat! 🚀",
            "Hello! 😊 Welcome to Utkarsh's portfolio! I'm Booglu — your friendly guide here. What would you like to know?",
            "Hi! 👋 Great to meet you! I'm Booglu. I can tell you all about Utkarsh — his skills, experience, education, or we can just have a fun tech chat! What's up?"
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // Who is Utkarsh
    if (msg.match(/who is utkarsh|tell me about utkarsh|about utkarsh|who.*utkarsh/)) {
        return "Utkarsh Awasthi is a passionate 2nd year B.Tech ECE student at SRM University, AP! 🎓 He's deeply into AI, IoT, Embedded Systems, and Full Stack Development. He's currently leading Internal Affairs at HackShastra SRMAP and holds an Oracle AI certification. A true tech explorer! 🚀";
    }

    // Education
    if (msg.match(/education|study|college|university|school|degree|btech|b\.tech/)) {
        return "🎓 Utkarsh is pursuing B.Tech in Electronics & Communication Engineering (ECE) at SRM University, AP (2024-2028). He completed his Intermediate (Science-Maths) from S.R. Public School and did his schooling at Rani Laxmi Bai Memorial School. Solid academic foundation! 📚";
    }

    // Skills
    if (msg.match(/skill|expertise|good at|know|capable|tech stack|technologies/)) {
        return "💡 Utkarsh's skill set is impressive! He's advanced in Simulink, Generative AI, and AI-Driven Tools. He's intermediate in Programming & AI and IoT & Embedded Systems, and actively learning Full Stack Development. A true full-spectrum tech enthusiast! ⚡";
    }

    // Experience
    if (msg.match(/experience|work|job|intern|career|hackshastra|nayepankh/)) {
        return "💼 Utkarsh currently leads Internal Affairs at HackShastra SRMAP (since Dec 2025), coordinating hackathon events. Previously, he was a Fundraising Intern at NayePankh Foundation (Aug-Dec 2025) in New Delhi, where he contributed to social impact initiatives. Leadership + Social Impact! 🌟";
    }

    // Certifications
    if (msg.match(/certif|oracle|deloitte|course|credential/)) {
        return "🏆 Utkarsh has 5 certifications including: Oracle Fusion AI Agent Studio (Oracle University), Technology Job Simulation (Deloitte Australia), Master Generative AI, AI for Business Professionals, and Prompt Engineering with GitHub Copilot (GitHub/Microsoft). Impressive, right? ✨";
    }

    // Contact
    if (msg.match(/contact|reach|email|mail|linkedin|connect|hire/)) {
        return "📬 You can reach Utkarsh via:\n• Email: awasthiutk13@gmail.com\n• LinkedIn: linkedin.com/in/utkarsh-awasthi-276a92367\nOr just use the contact form on this page! He's always open to exciting opportunities and collaborations! 🤝";
    }

    // Location
    if (msg.match(/where|location|live|city|based|from/)) {
        return "📍 Utkarsh is currently based in Vijayawada, Andhra Pradesh, India — where SRM University AP is located. He's originally connected to Lucknow, UP. The beauty of tech is that location doesn't limit collaboration! 🌍";
    }

    // AI / ML
    if (msg.match(/artificial intelligence|machine learning|ai|ml|deep learning|neural/)) {
        return "🤖 Utkarsh is super passionate about AI & ML! He's Oracle-certified in AI Agent Studio, has completed multiple AI courses, and is skilled in Generative AI and AI-driven tools. This field is clearly his sweet spot! 🧠✨";
    }

    // IoT
    if (msg.match(/iot|internet of things|embedded|hardware|sensor|arduino|raspberry/)) {
        return "🔌 IoT & Embedded Systems is one of Utkarsh's core interests! As an ECE student, he bridges the hardware-software gap beautifully. He has intermediate-level skills in this domain and is constantly exploring new possibilities! ⚡";
    }

    // Projects
    if (msg.match(/project|build|made|create|portfolio|github/)) {
        return "🛠️ Utkarsh is always building cool things! His interests span AI, IoT, and Full Stack Development. While I don't have his full project list, you can check his LinkedIn (linkedin.com/in/utkarsh-awasthi-276a92367) for the latest updates, or reach out directly! 💡";
    }

    // Who are you / Booglu
    if (msg.match(/who are you|your name|what are you|booglu|about you/)) {
        return "I'm Booglu! 🤖✨ Utkarsh's personal AI assistant living right here on his portfolio website. I know all about his education, skills, experience, and certifications. I can also chat about tech in general! Think of me as your friendly guide to all things Utkarsh. 😊";
    }

    // Thank you
    if (msg.match(/thank|thanks|thx|appreciate|helpful/)) {
        return "You're welcome! 😊 It was great chatting with you. If you need anything else or want to connect with Utkarsh, just ask! Have an amazing day! 🌟";
    }

    // Bye
    if (msg.match(/bye|goodbye|see you|later|gotta go|cya/)) {
        return "Bye! 👋 It was lovely chatting with you! Don't forget to check out Utkarsh's full portfolio and connect with him if you're interested. See you around! 🚀✨";
    }

    // Fun / Jokes
    if (msg.match(/joke|funny|laugh|humor/)) {
        return "😄 Alright, here's one: Why do programmers prefer dark mode? Because light attracts bugs! 🐛💡 But seriously, want to know something cool about Utkarsh? Just ask! 😊";
    }

    // Hobby / interests
    if (msg.match(/hobb|interest|free time|passion|like to do/)) {
        return "🎯 Utkarsh is passionate about AI, IoT, Embedded Systems, and Full Stack Development. He loves participating in hackathons and tech events. He also has a strong interest in social impact work, as seen from his time at NayePankh Foundation! A well-rounded tech enthusiast! 🌟";
    }

    // Default / General
    const defaults = [
        "That's an interesting question! 🤔 I'm Booglu, and I know a lot about Utkarsh — his education, skills, experience, and certifications. Want me to tell you about any of those? Or we can just chat about tech! 💡",
        "Hmm, I'm not sure about that specifically! 🤔 But I can tell you about Utkarsh's skills, education, work experience, or certifications. What interests you? You can also reach out to him directly at awasthiutk13@gmail.com! 📬",
        "Great question! While I might not have the exact answer, I know everything about Utkarsh's professional profile. Ask me about his skills, certifications, education, or experience! Or just say hi 😊"
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
}

// ── Serve index.html for all non-API routes (fallback) ──
// ── Serve index.html for all non-API routes (fallback) ──
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start Server ──
app.listen(PORT, () => {
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
