/* ==========================================================================
   Utkarsh Awasthi — Portfolio Website JavaScript
   Interactions, Animations, and Dynamic Behaviours
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // ── Loader ──
    const loader = document.getElementById('loader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 2200);
    });

    // Fallback: hide loader after 3.5s even if load event doesn't fire
    setTimeout(() => {
        loader.classList.add('hidden');
    }, 3500);

    // ── Custom Cursor ──
    const cursorDot = document.getElementById('cursorDot');
    const cursorOutline = document.getElementById('cursorOutline');

    if (window.matchMedia('(pointer: fine)').matches && cursorDot && cursorOutline) {
        let mouseX = 0, mouseY = 0;
        let outlineX = 0, outlineY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.left = mouseX + 'px';
            cursorDot.style.top = mouseY + 'px';
        });

        function animateCursor() {
            outlineX += (mouseX - outlineX) * 0.15;
            outlineY += (mouseY - outlineY) * 0.15;
            cursorOutline.style.left = outlineX + 'px';
            cursorOutline.style.top = outlineY + 'px';
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        // Hover effects for interactive elements
        const hoverElements = document.querySelectorAll('a, button, .gallery-item, .cert-card, .info-card, .contact-card, .edu-card, .timeline-card');
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorDot.classList.add('hovering');
                cursorOutline.classList.add('hovering');
            });
            el.addEventListener('mouseleave', () => {
                cursorDot.classList.remove('hovering');
                cursorOutline.classList.remove('hovering');
            });
        });
    }

    // ── Hero Particles ──
    const particlesContainer = document.getElementById('heroParticles');
    if (particlesContainer) {
        for (let i = 0; i < 40; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            const duration = Math.random() * 15 + 10;
            const delay = Math.random() * 10;
            particle.style.setProperty('--duration', duration + 's');
            particle.style.setProperty('--delay', delay + 's');
            particle.style.width = (Math.random() * 3 + 1) + 'px';
            particle.style.height = particle.style.width;
            const colors = ['#00d4aa', '#6c5ce7', '#4fc3f7', '#f0a500', '#f472b6'];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particlesContainer.appendChild(particle);
        }
    }

    // ── Typing Animation ──
    const typingElement = document.getElementById('typingText');
    if (typingElement) {
        const phrases = [
            'Tech Explorer',
            'ECE Student @ SRM AP',
            'AI & ML Enthusiast',
            'IoT Developer',
            'Oracle Certified',
            'Full Stack Learner'
        ];
        let phraseIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typingSpeed = 80;

        function typeText() {
            const currentPhrase = phrases[phraseIndex];

            if (isDeleting) {
                typingElement.textContent = currentPhrase.substring(0, charIndex - 1);
                charIndex--;
                typingSpeed = 40;
            } else {
                typingElement.textContent = currentPhrase.substring(0, charIndex + 1);
                charIndex++;
                typingSpeed = 80;
            }

            if (!isDeleting && charIndex === currentPhrase.length) {
                isDeleting = true;
                typingSpeed = 2000; // Pause before deleting
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                typingSpeed = 500; // Pause before next phrase
            }

            setTimeout(typeText, typingSpeed);
        }

        setTimeout(typeText, 2500); // Start after loader
    }

    // ── Navbar ──
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const navLinkItems = document.querySelectorAll('.nav-link');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile toggle
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navLinks.classList.toggle('open');
        });
    }

    // Close mobile nav on link click
    navLinkItems.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });

    // Active link on scroll
    const sections = document.querySelectorAll('.section, .hero');
    function updateActiveLink() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        navLinkItems.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === current) {
                link.classList.add('active');
            }
        });
    }
    window.addEventListener('scroll', updateActiveLink);

    // ── Scroll Animations (Intersection Observer) ──
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Animate skill bars if in skills section
                if (entry.target.closest('.skills-column')) {
                    animateSkillBars();
                }

                // Animate counters if in hero section
                if (entry.target.closest('.hero-stats') || entry.target.classList.contains('hero-stats')) {
                    animateCounters();
                }
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });

    // ── Counter Animation ──
    let countersAnimated = false;
    function animateCounters() {
        if (countersAnimated) return;
        countersAnimated = true;

        const counters = document.querySelectorAll('.stat-number');
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-count'));
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;

            function updateCounter() {
                current += increment;
                if (current < target) {
                    counter.textContent = Math.ceil(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            }
            updateCounter();
        });
    }

    // ── Skill Bar Animation ──
    let skillBarsAnimated = false;
    function animateSkillBars() {
        if (skillBarsAnimated) return;
        skillBarsAnimated = true;

        const skillBars = document.querySelectorAll('.skill-bar-fill');
        skillBars.forEach((bar, index) => {
            const width = bar.getAttribute('data-width');
            setTimeout(() => {
                bar.style.width = width + '%';
            }, index * 150);
        });
    }

    // ── Gallery Lightbox ──
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    let currentGalleryIndex = 0;

    const galleryImages = [];
    galleryItems.forEach(item => {
        const img = item.querySelector('img');
        if (img) {
            galleryImages.push({ src: img.src, alt: img.alt });
        }
    });

    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            currentGalleryIndex = index;
            openLightbox(index);
        });
    });

    function openLightbox(index) {
        if (galleryImages[index]) {
            lightboxImg.src = galleryImages[index].src;
            lightboxImg.alt = galleryImages[index].alt;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', () => {
            currentGalleryIndex = (currentGalleryIndex - 1 + galleryImages.length) % galleryImages.length;
            openLightbox(currentGalleryIndex);
        });
    }

    if (lightboxNext) {
        lightboxNext.addEventListener('click', () => {
            currentGalleryIndex = (currentGalleryIndex + 1) % galleryImages.length;
            openLightbox(currentGalleryIndex);
        });
    }

    // Close lightbox with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft' && lightbox.classList.contains('active')) {
            currentGalleryIndex = (currentGalleryIndex - 1 + galleryImages.length) % galleryImages.length;
            openLightbox(currentGalleryIndex);
        }
        if (e.key === 'ArrowRight' && lightbox.classList.contains('active')) {
            currentGalleryIndex = (currentGalleryIndex + 1) % galleryImages.length;
            openLightbox(currentGalleryIndex);
        }
    });

    // Close lightbox clicking outside image
    lightbox.addEventListener('click', (e) => {
    });

    // ── Real Contact Form with Backend API ──
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = document.getElementById('formSubmit');
            const originalText = submitBtn.innerHTML;

            // Get form data
            const formData = {
                name: document.getElementById('formName').value,
                email: document.getElementById('formEmail').value,
                subject: document.getElementById('formSubject').value,
                message: document.getElementById('formMessage').value
            };

            submitBtn.innerHTML = `<span>Sending...</span>`;
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.7';

            try {
                // Send real API request to our backend
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (data.success) {
                    submitBtn.innerHTML = `<span>Message Sent! ✓</span>`;
                    submitBtn.style.background = 'linear-gradient(135deg, #00d4aa, #00b894)';
                    contactForm.reset();
                    console.log('Message sent successfully:', data);
                } else {
                    submitBtn.innerHTML = `<span>Error! ❌</span>`;
                    submitBtn.style.background = 'linear-gradient(135deg, #ff4d4d, #d63031)';
                    console.error('Submission error:', data.error);
                }
            } catch (err) {
                submitBtn.innerHTML = `<span>Failed! ✗</span>`;
                submitBtn.style.background = 'linear-gradient(135deg, #ff4d4d, #d63031)';
                console.error('Fetch error:', err);
            } finally {
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '1';
                    submitBtn.style.background = '';
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }, 3000);
            }
        });
    }

    // ── Booglu AI Chat Logic ──
    const boogluFab = document.getElementById('boogluFab');
    const boogluChat = document.getElementById('boogluChat');
    const boogluClose = document.getElementById('boogluClose');
    const boogluInput = document.getElementById('boogluInput');
    const boogluSend = document.getElementById('boogluSend');
    const boogluMessages = document.getElementById('boogluMessages');
    const boogluQuickActions = document.getElementById('boogluQuickActions');

    let chatSessionId = localStorage.getItem('boogluSessionId') || null;

    // Toggle Chat
    if (boogluFab) {
        boogluFab.addEventListener('click', () => {
            boogluChat.classList.toggle('active');
            boogluFab.classList.toggle('active');
            if (boogluChat.classList.contains('active')) {
                boogluInput.focus();
            }
        });
    }

    if (boogluClose) {
        boogluClose.addEventListener('click', () => {
            boogluChat.classList.remove('active');
            boogluFab.classList.remove('active');
        });
    }

    // Send Message
    async function sendBoogluMessage(text) {
        if (!text.trim()) return;

        // Add user message to UI
        addMessageToUI('user', text);
        boogluInput.value = '';

        // Show typing indicator
        const typingId = 'typing-' + Date.now();
        addTypingIndicator(typingId);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, sessionId: chatSessionId })
            });

            const result = await response.json();
            removeTypingIndicator(typingId);

            if (result.success) {
                if (result.sessionId) {
                    chatSessionId = result.sessionId;
                    localStorage.setItem('boogluSessionId', chatSessionId);
                }
                addMessageToUI('bot', result.reply);
            } else {
                addMessageToUI('bot', "Sorry, I'm having a bit of trouble connecting right now. 😅");
            }
        } catch (err) {
            removeTypingIndicator(typingId);
            addMessageToUI('bot', "Oops! Something went wrong. Can you try that again? 🤖");
            console.error('Chat error:', err);
        }
    }

    function addMessageToUI(role, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `booglu-message booglu-${role}`;

        const avatarHtml = role === 'bot'
            ? `<div class="booglu-message-avatar"><img src="images/booglu-avatar.png" alt="Booglu"></div>`
            : '';

        messageDiv.innerHTML = `
            ${avatarHtml}
            <div class="booglu-message-bubble">
                <p>${formatMessageContent(text)}</p>
                <span class="booglu-message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        `;

        boogluMessages.appendChild(messageDiv);
        boogluMessages.scrollTop = boogluMessages.scrollHeight;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function addTypingIndicator(id) {
        const typingDiv = document.createElement('div');
        typingDiv.className = `booglu-message booglu-bot booglu-typing`;
        typingDiv.id = id;
        typingDiv.innerHTML = `
            <div class="booglu-message-avatar"><img src="images/booglu-avatar.png" alt="Booglu"></div>
            <div class="booglu-message-bubble">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        boogluMessages.appendChild(typingDiv);
        boogluMessages.scrollTop = boogluMessages.scrollHeight;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function formatMessageContent(text) {
        // Basic markdown-like formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    if (boogluSend) {
        boogluSend.addEventListener('click', () => sendBoogluMessage(boogluInput.value));
    }

    if (boogluInput) {
        boogluInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendBoogluMessage(boogluInput.value);
        });
    }

    // Quick Actions
    if (boogluQuickActions) {
        boogluQuickActions.addEventListener('click', (e) => {
            const btn = e.target.closest('.booglu-quick-btn');
            if (btn) {
                const text = btn.getAttribute('data-message');
                sendBoogluMessage(text);
                // Hide quick actions after first use to keep chat clean
                boogluQuickActions.style.display = 'none';
            }
        });
    }

    // ── Back to Top ──
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ── Smooth Scroll for Anchor Links ──
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ── Parallax Lite Effect (hero) ──
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const heroGradient = document.querySelector('.hero-gradient');
        if (heroGradient && scrolled < window.innerHeight) {
            heroGradient.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
    });

    // ── Tilt effect on hero image ──
    const heroImageWrapper = document.querySelector('.hero-image-wrapper');
    if (heroImageWrapper && window.matchMedia('(pointer: fine)').matches) {
        heroImageWrapper.addEventListener('mousemove', (e) => {
            const rect = heroImageWrapper.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            heroImageWrapper.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
        });

        heroImageWrapper.addEventListener('mouseleave', () => {
            heroImageWrapper.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
            heroImageWrapper.style.transition = 'transform 0.5s ease';
            setTimeout(() => {
                heroImageWrapper.style.transition = '';
            }, 500);
        });
    }

    // ── Force trigger animations if loader finishes early ──
    setTimeout(() => {
        const heroAnimations = document.querySelectorAll('.hero .animate-on-scroll');
        heroAnimations.forEach((el, i) => {
            setTimeout(() => {
                el.classList.add('visible');
            }, i * 150);
        });
    }, 2400);
});
