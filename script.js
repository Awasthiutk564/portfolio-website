/* ================================================
   PORTFOLIO - Page-Based Navigation & Interactions
   ================================================ */

(function () {
    'use strict';

    // ==========================================
    // LOADER
    // ==========================================
    const loader = document.getElementById('loader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('hidden');
            // Trigger initial page animations after loader hides
            setTimeout(() => {
                triggerPageAnimations('home');
            }, 300);
        }, 2200);
    });

    // ==========================================
    // CUSTOM CURSOR
    // ==========================================
    const cursorDot = document.getElementById('cursorDot');
    const cursorOutline = document.getElementById('cursorOutline');
    let cursorX = 0, cursorY = 0;
    let outlineX = 0, outlineY = 0;

    if (cursorDot && cursorOutline) {
        document.addEventListener('mousemove', (e) => {
            cursorX = e.clientX;
            cursorY = e.clientY;
            cursorDot.style.left = cursorX + 'px';
            cursorDot.style.top = cursorY + 'px';
        });

        function animateCursor() {
            outlineX += (cursorX - outlineX) * 0.15;
            outlineY += (cursorY - outlineY) * 0.15;
            cursorOutline.style.left = outlineX + 'px';
            cursorOutline.style.top = outlineY + 'px';
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        // Cursor hover effects
        document.querySelectorAll('a, button, .gallery-item, .contact-card, .cert-card, .edu-card, .info-card').forEach(el => {
            el.addEventListener('mouseenter', () => cursorOutline.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursorOutline.classList.remove('hover'));
        });

        // Hide cursor on touch devices
        if ('ontouchstart' in window) {
            cursorDot.style.display = 'none';
            cursorOutline.style.display = 'none';
        }
    }

    // ==========================================
    // PAGE NAVIGATION
    // ==========================================
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const pages = document.querySelectorAll('.page');
    const sidebar = document.getElementById('sidebar');
    const mobileToggle = document.getElementById('mobileNavToggle');
    let currentPage = 'home';
    let countersAnimated = false;
    let skillBarsAnimated = false;

    function navigateToPage(pageName) {
        if (pageName === currentPage) return;

        // Reset fade-in elements on current page
        const currentPageEl = document.querySelector('.page-active');
        if (currentPageEl) {
            currentPageEl.querySelectorAll('.fade-in').forEach(el => {
                el.style.transition = 'none';
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                // Force reflow
                void el.offsetHeight;
                el.style.transition = '';
            });
            currentPageEl.classList.remove('page-active');
        }

        // Show new page
        const newPage = document.querySelector(`.page[data-page="${pageName}"]`);
        if (newPage) {
            newPage.classList.add('page-active');
            // Scroll to top of new page
            newPage.scrollTop = 0;

            // Trigger animations for new page
            setTimeout(() => {
                triggerPageAnimations(pageName);
            }, 50);
        }

        // Update nav links
        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.page === pageName);
        });

        currentPage = pageName;

        // Close mobile nav
        if (sidebar) sidebar.classList.remove('active');
        if (mobileToggle) mobileToggle.classList.remove('active');
    }

    function triggerPageAnimations(pageName) {
        const page = document.querySelector(`.page[data-page="${pageName}"]`);
        if (!page) return;

        // Re-enable transitions on fade-in elements
        page.querySelectorAll('.fade-in').forEach(el => {
            el.style.opacity = '';
            el.style.transform = '';
        });

        // Page-specific animations
        if (pageName === 'home' && !countersAnimated) {
            animateCounters();
            countersAnimated = true;
        }

        if (pageName === 'skills' && !skillBarsAnimated) {
            setTimeout(() => animateSkillBars(), 300);
            skillBarsAnimated = true;
        }
    }

    // Nav link clicks
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToPage(link.dataset.page);
        });
    });

    // Data-navigate buttons (e.g., hero CTA buttons)
    document.querySelectorAll('[data-navigate]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToPage(btn.dataset.navigate);
        });
    });

    // Mobile nav toggle
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (sidebar && sidebar.classList.contains('active')) {
            if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
                sidebar.classList.remove('active');
                mobileToggle.classList.remove('active');
            }
        }
    });

    // ==========================================
    // TYPING ANIMATION
    // ==========================================
    const typingElement = document.getElementById('typingText');
    const phrases = [
        'Tech Explorer & Innovator',
        'AI & ML Enthusiast',
        'IoT & Embedded Systems',
        'Full Stack Developer',
        'Oracle Certified Professional',
        'ECE Student @ SRM AP'
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeEffect() {
        if (!typingElement) return;
        const currentPhrase = phrases[phraseIndex];

        if (isDeleting) {
            typingElement.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typingElement.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
        }

        let delay = isDeleting ? 40 : 80;

        if (!isDeleting && charIndex === currentPhrase.length) {
            delay = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            delay = 500;
        }

        setTimeout(typeEffect, delay);
    }
    setTimeout(typeEffect, 2800);

    // ==========================================
    // HERO PARTICLES
    // ==========================================
    const particleContainer = document.getElementById('heroParticles');
    if (particleContainer) {
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            const size = Math.random() * 4 + 2;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
            particle.style.animationDelay = (Math.random() * 5) + 's';
            particleContainer.appendChild(particle);
        }
    }

    // ==========================================
    // COUNTER ANIMATION
    // ==========================================
    function animateCounters() {
        document.querySelectorAll('.stat-number').forEach(counter => {
            const target = parseInt(counter.dataset.count);
            const duration = 1500;
            const start = performance.now();

            function updateCounter(timestamp) {
                const elapsed = timestamp - start;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                counter.textContent = Math.round(eased * target);
                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                }
            }
            requestAnimationFrame(updateCounter);
        });
    }

    // ==========================================
    // SKILL BAR ANIMATION
    // ==========================================
    function animateSkillBars() {
        document.querySelectorAll('.skill-bar-fill').forEach(bar => {
            const width = bar.dataset.width;
            bar.style.width = width + '%';
        });
    }

    // ==========================================
    // GALLERY LIGHTBOX
    // ==========================================
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const galleryItems = document.querySelectorAll('.gallery-item');
    let lightboxIndex = 0;

    function openLightbox(index) {
        if (!lightbox || !lightboxImg) return;
        lightboxIndex = index;
        const img = galleryItems[index].querySelector('img');
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.add('active');
    }

    function closeLightbox() {
        if (lightbox) lightbox.classList.remove('active');
    }

    function navigateLightbox(direction) {
        lightboxIndex = (lightboxIndex + direction + galleryItems.length) % galleryItems.length;
        const img = galleryItems[lightboxIndex].querySelector('img');
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
    }

    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => openLightbox(index));
    });

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
    if (lightboxNext) lightboxNext.addEventListener('click', () => navigateLightbox(1));

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
                closeLightbox();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (!lightbox || !lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    });

    // ==========================================
    // CONTACT FORM
    // ==========================================
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('formSubmit');
            const originalText = submitBtn.innerHTML;

            submitBtn.innerHTML = '<span>Sending...</span>';
            submitBtn.disabled = true;

            const formData = {
                name: document.getElementById('formName').value.trim(),
                email: document.getElementById('formEmail').value.trim(),
                subject: document.getElementById('formSubject').value.trim(),
                message: document.getElementById('formMessage').value.trim()
            };

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    submitBtn.innerHTML = '<span>Message Sent! ✓</span>';
                    submitBtn.style.background = '#34d399';
                    contactForm.reset();
                    setTimeout(() => {
                        submitBtn.innerHTML = originalText;
                        submitBtn.style.background = '';
                        submitBtn.disabled = false;
                    }, 3000);
                } else {
                    throw new Error(data.error || 'Failed to send');
                }
            } catch (error) {
                submitBtn.innerHTML = '<span>Error! Try Again</span>';
                submitBtn.style.background = '#ff6b6b';
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.background = '';
                    submitBtn.disabled = false;
                }, 3000);
            }
        });
    }

    // ==========================================
    // BOOGLU AI CHAT
    // ==========================================
    const boogluFab = document.getElementById('boogluFab');
    const boogluChat = document.getElementById('boogluChat');
    const boogluClose = document.getElementById('boogluClose');
    const boogluInput = document.getElementById('boogluInput');
    const boogluSend = document.getElementById('boogluSend');
    const boogluMessages = document.getElementById('boogluMessages');
    const boogluQuickActions = document.getElementById('boogluQuickActions');

    let sessionId = localStorage.getItem('booglu_session') || generateSessionId();
    localStorage.setItem('booglu_session', sessionId);

    function generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    // Toggle chat
    if (boogluFab) {
        boogluFab.addEventListener('click', () => {
            boogluFab.classList.toggle('active');
            boogluChat.classList.toggle('active');
            if (boogluChat.classList.contains('active') && boogluInput) {
                setTimeout(() => boogluInput.focus(), 300);
            }
        });
    }

    if (boogluClose) {
        boogluClose.addEventListener('click', () => {
            boogluFab.classList.remove('active');
            boogluChat.classList.remove('active');
        });
    }

    function addBoogluMessage(text, isBot) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `booglu-message ${isBot ? 'booglu-bot' : 'booglu-user'}`;

        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (isBot) {
            msgDiv.innerHTML = `
                <div class="booglu-message-avatar">
                    <img src="images/booglu-avatar.png" alt="Booglu">
                </div>
                <div class="booglu-message-bubble">
                    <p>${text}</p>
                    <span class="booglu-message-time">${time}</span>
                </div>
            `;
        } else {
            msgDiv.innerHTML = `
                <div class="booglu-message-bubble">
                    <p>${text}</p>
                    <span class="booglu-message-time">${time}</span>
                </div>
            `;
        }

        boogluMessages.appendChild(msgDiv);
        boogluMessages.scrollTop = boogluMessages.scrollHeight;
    }

    function showTypingIndicator() {
        const typing = document.createElement('div');
        typing.className = 'booglu-message booglu-bot booglu-typing';
        typing.id = 'boogluTyping';
        typing.innerHTML = `
            <div class="booglu-message-avatar">
                <img src="images/booglu-avatar.png" alt="Booglu">
            </div>
            <div class="booglu-message-bubble">
                <span></span><span></span><span></span>
            </div>
        `;
        boogluMessages.appendChild(typing);
        boogluMessages.scrollTop = boogluMessages.scrollHeight;
    }

    function removeTypingIndicator() {
        const typing = document.getElementById('boogluTyping');
        if (typing) typing.remove();
    }

    async function sendBoogluMessage(message) {
        addBoogluMessage(message, false);
        showTypingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, sessionId })
            });

            const data = await response.json();
            removeTypingIndicator();

            if (response.ok && data.reply) {
                addBoogluMessage(data.reply, true);
            } else {
                addBoogluMessage("Sorry, I couldn't process that. Try again! 😊", true);
            }
        } catch (error) {
            removeTypingIndicator();
            addBoogluMessage("Oops! Something went wrong. Please try again later. 🔧", true);
        }
    }

    if (boogluSend) {
        boogluSend.addEventListener('click', () => {
            const message = boogluInput.value.trim();
            if (message) {
                sendBoogluMessage(message);
                boogluInput.value = '';
            }
        });
    }

    if (boogluInput) {
        boogluInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const message = boogluInput.value.trim();
                if (message) {
                    sendBoogluMessage(message);
                    boogluInput.value = '';
                }
            }
        });
    }

    // Quick actions
    if (boogluQuickActions) {
        boogluQuickActions.querySelectorAll('.booglu-quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                sendBoogluMessage(btn.dataset.message);
            });
        });
    }

    // ==========================================
    // INITIALIZE LUCIDE ICONS
    // ==========================================
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

})();
