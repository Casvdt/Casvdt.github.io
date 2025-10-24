/*
 * Hoofdsite JavaScript (NL)
 * Overzicht functies:
 * - Vroege offline-detectie: direct naar 404 bij geen internet (voorkomt cached pagina).
 * - Mobiel menu (hamburger): open/dicht en klik buiten om te sluiten.
 * - Smooth scroll naar secties (door #hash te mappen naar .class).
 * - Toast meldingen helper (success/error).
 * - Contactformulier: validatie, eenvoudige anti-spam, cooldown en EmailJS-verzending.
 * - Scroll-reveal animaties en staggered children.
 * - Scroll-to-top knop.
 * - Taalwissel (NL/EN) en thema (licht/donker) met opslag van voorkeur.
 * - Hero effecten: canvas code-regen en Three.js "coding nebula".
 */
(function earlyOfflineRedirect(){
    try {
        const debugBypass = /(?:[?&])debugOnline=1\b/.test(location.search);
        if (!debugBypass && typeof navigator !== 'undefined' && 'onLine' in navigator) {
            if (!navigator.onLine) {
                location.replace('/404.html');
                return;
            }
        }
    } catch {}
})();

// Scroll Progress Indicator
function updateScrollProgress() {
    const winScroll = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = (winScroll / height) * 100;
    document.querySelector('.scroll-progress-bar').style.width = scrolled + '%';
}

window.addEventListener('scroll', updateScrollProgress);
window.addEventListener('resize', updateScrollProgress);

document.addEventListener('DOMContentLoaded', () => {
    // ===== WORD CLOUD ANIMATION =====
    const wordCloud = document.querySelector('.word-cloud');
    if (wordCloud) {
        const words = [
            'HTML5', 'CSS3', 'JavaScript', 'Node.js', 'PHP', 'SQL',
            'Bootstrap', 'Tailwind', 'Git', 'API', 'REST', 'JSON',
            'Responsive', 'Frontend', 'Backend', 'UX/UI', 'Mobile-First',
            'Performance', 'SEO', 'Security', 'Swift', 'Linux'
        ];

        function createWord(word, x, y, size) {
            const span = document.createElement('span');
            span.textContent = word;
            span.style.left = x + '%';
            span.style.top = y + '%';
            span.style.fontSize = size + 'px';
            return span;
        }

        function updateCloud() {
            wordCloud.innerHTML = '';
            words.forEach((word, i) => {
                const angle = (i / words.length) * Math.PI * 2;
                const radius = 35;
                const x = 50 + Math.cos(angle) * radius;
                const y = 50 + Math.sin(angle) * radius;
                const size = Math.random() * 8 + 14;
                const wordEl = createWord(word, x, y, size);
                wordCloud.appendChild(wordEl);
            });
        }

        function animateCloud() {
            const spans = wordCloud.querySelectorAll('span');
            spans.forEach((span, i) => {
                const angle = (i / spans.length) * Math.PI * 2;
                const radius = 35;
                const time = Date.now() / 3000;
                const x = 50 + Math.cos(angle + time) * radius;
                const y = 50 + Math.sin(angle + time) * radius;
                span.style.left = x + '%';
                span.style.top = y + '%';
            });
            requestAnimationFrame(animateCloud);
        }

        updateCloud();
        animateCloud();
    }

    // ===== MOBIELE MENU FUNCTIE =====
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    let isMenuOpen = false;

    // Klik op hamburger-menu opent of sluit het menu
    hamburger.addEventListener('click', () => {
        isMenuOpen = !isMenuOpen;
        if (isMenuOpen) {
            // Als menu open is: stijl instellen zodat links onder elkaar komen te staan
            navLinks.style.display = 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '100%';
            navLinks.style.left = '0';
            navLinks.style.right = '0';
            navLinks.style.background = 'rgba(2, 6, 23, 0.98)';
            navLinks.style.padding = '1rem';
            navLinks.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.35)';
            navLinks.style.zIndex = '1200';
        } else {
            // Als menu dicht is: verbergen
            navLinks.style.display = 'none';
            navLinks.removeAttribute('style');
        }
    });

    // ===== SOEPEL SCROLLEN NAAR SECTIES =====
    // Als op een link met # geklikt wordt, scrollt de pagina soepel naar de bijbehorende sectie
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const hash = this.getAttribute('href'); // bijv. #home
            const className = hash.replace('#', '.'); // wordt .home
            const target = document.querySelector(className);
            if (target) {
                // Eerst menu sluiten, dan scrollen, om klik-problemen te voorkomen
                if (isMenuOpen) {
                    isMenuOpen = false;
                    navLinks.style.display = 'none';
                    navLinks.removeAttribute('style');
                }
                // Gebruik setTimeout om layout te laten updaten voor scrollen
                setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
            }
        });
    });

    // Zorg dat klikken buiten het menu het menu sluit op mobiel
    document.addEventListener('click', (e) => {
        const clickedHamburger = hamburger.contains(e.target);
        const clickedMenu = navLinks.contains(e.target);
        if (isMenuOpen && !clickedHamburger && !clickedMenu) {
            isMenuOpen = false;
            navLinks.style.display = 'none';
            navLinks.removeAttribute('style');
        }
    }, true);

    // ===== TOAST BERICHTEN (kleine pop-up meldingen) =====
    const toast = document.createElement('div');
    toast.className = 'toast';
    // Accessibility for live messages
    try {
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.setAttribute('aria-atomic', 'true');
    } catch {}
    document.body.appendChild(toast);

    // Functie om toast weer te geven
    function showToast(message, type) {
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000); // verdwijnt na 3 seconden
    }

    // ===== CONTACTFORMULIER MET VALIDATIE EN COOLDOWN =====
    const contactForm = document.querySelector('.contact-form');
    const COOLDOWN_MS = 15000; // 15 seconden tussen berichten
    let lastSubmitAt = 0;
    try {
        const storedLast = sessionStorage.getItem('last_submit_at');
        if (storedLast) lastSubmitAt = parseInt(storedLast, 10) || 0;
    } catch {}

    // Functie om te checken of bericht een link bevat
    function containsUrl(text) {
        const urlRegex = /(https?:\/\/|www\.)/i;
        return urlRegex.test(text);
    }

    // Bekende disposable/wegwerp e-maildomeinen blokkeren
    const DISPOSABLE_DOMAINS = new Set([
        'mailinator.com','mailinator.net','mailinator.org','maildrop.cc','dispostable.com','getnada.com','nada.ltd',
        'tempmail.dev','temp-mail.org','tempmailo.com','tempmail.email','tempmail.plus','tempail.com','moakt.com',
        '10minutemail.com','10minutemail.net','10minemail.com','guerrillamail.com','sharklasers.com','grr.la',
        'yopmail.com','yopmail.fr','yopmail.net','yopmail.org','yopmail.de','cool.fr.nf','jetable.fr.nf',
        'throwawaymail.com','fakemail.net','fakeinbox.com','trashmail.com','trashmail.de','mytrashmail.com',
        'mailcatch.com','mailnesia.com','mintemail.com','spambog.com','spamgourmet.com','mail-temporaire.fr',
        'tempinbox.com','mohmal.com','nowmymail.com','emailondeck.com','burnermail.io','sp disposable.com'
    ]);
    function isDisposableEmail(email) {
        const parts = String(email).toLowerCase().split('@');
        if (parts.length !== 2) return true;
        const domain = parts[1].trim();
        if (!domain) return true;
        // Check exact domain and common subdomains
        if (DISPOSABLE_DOMAINS.has(domain)) return true;
        const base = domain.replace(/^.*?([^\.]+\.[^\.]+)$/,'$1');
        return DISPOSABLE_DOMAINS.has(base);
    }

    if (contactForm) {
        function clearAriaInvalid() {
            ['#name', '#email', '#message', '#challenge'].forEach(sel => {
                const el = contactForm.querySelector(sel);
                if (el) el.removeAttribute('aria-invalid');
            });
        }
        function markInvalid(el) {
            if (!el) return;
            try { el.setAttribute('aria-invalid', 'true'); } catch {}
            try { el.focus({ preventScroll: true }); } catch {}
        }
        // Genereer simpele rekenuitdaging (bijv. 3 + 5)
        // Gebruik klassen waar mogelijk; val terug op IDs voor compatibiliteit
        const qEl = document.querySelector('.challenge-q') || document.getElementById('challenge-q');
        const challengeInput = document.querySelector('.challenge-input') || document.getElementById('challenge');
        const a = Math.floor(2 + Math.random() * 8);
        const b = Math.floor(2 + Math.random() * 8);
        const expected = a + b;
        if (qEl) qEl.textContent = `${a} + ${b} =`;

        // ===== Live validation helpers (real-time feedback) =====
        const nameInput = contactForm.querySelector('.js-name') || contactForm.querySelector('#name');
        const emailInput = contactForm.querySelector('.js-email') || contactForm.querySelector('#email');
        const messageInput = contactForm.querySelector('.js-message') || contactForm.querySelector('#message');
        const submitBtnEl = contactForm.querySelector('.submit-button');

        function ensureValidationEl(el) {
            const parent = el.closest('.form-group') || el.parentNode;
            let msg = parent.querySelector('.validation-message');
            if (!msg) {
                msg = document.createElement('div');
                msg.className = 'validation-message';
                parent.appendChild(msg);
            }
            return msg;
        }

        function setFieldState(el, ok, message) {
            if (!el) return;
            el.classList.remove('valid', 'invalid');
            const msg = ensureValidationEl(el);
            if (ok === true) {
                el.classList.add('valid');
                msg.textContent = message || '';
                msg.classList.remove('error');
                msg.classList.add('success');
            } else if (ok === false) {
                el.classList.add('invalid');
                msg.textContent = message || '';
                msg.classList.remove('success');
                msg.classList.add('error');
            } else {
                msg.textContent = '';
                msg.classList.remove('error', 'success');
            }
        }

        const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ'\- ]{2,60}$/;
        const emailRegex = /^(?!.*\.\.)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/;

        function validateNameField() {
            const v = (nameInput && nameInput.value || '').trim();
            if (v.length === 0) return setFieldState(nameInput, null, '');
            const ok = nameRegex.test(v);
            setFieldState(nameInput, ok, ok ? 'Looks good' : 'Enter a valid name');
        }

        function validateEmailField() {
            const v = (emailInput && emailInput.value || '').trim();
            if (v.length === 0) return setFieldState(emailInput, null, '');
            const ok = emailRegex.test(v) && !isDisposableEmail(v);
            setFieldState(emailInput, ok, ok ? 'Valid email' : 'Enter a valid email');
        }

        function validateMessageField() {
            const v = (messageInput && messageInput.value || '').trim();
            if (v.length === 0) return setFieldState(messageInput, null, '');
            const ok = v.length >= 10 && v.length <= 2000;
            setFieldState(messageInput, ok, ok ? '' : 'Message must be 10+ chars');
        }

        function validateChallengeField() {
            const v = (challengeInput && challengeInput.value || '').trim();
            if (v.length === 0) return setFieldState(challengeInput, null, '');
            const ok = Number(v) === expected;
            setFieldState(challengeInput, ok, ok ? '' : 'Wrong answer');
        }

        // Attach live listeners
        try {
            if (nameInput) nameInput.addEventListener('input', validateNameField);
            if (emailInput) emailInput.addEventListener('input', validateEmailField);
            if (messageInput) messageInput.addEventListener('input', validateMessageField);
            if (challengeInput) challengeInput.addEventListener('input', validateChallengeField);
        } catch (e) {}

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAriaInvalid();

            const now = Date.now();
            // Als er te snel opnieuw verzonden wordt
            if (now - lastSubmitAt < COOLDOWN_MS) {
                showToast('Wacht een paar seconden voordat je opnieuw verzendt.', 'error');
                return;
            }

            // Honeypot veld voor spam-bots
            const companyField = contactForm.querySelector('#company');
            if (companyField && companyField.value.trim() !== '') {
                showToast('Verzending geblokkeerd.', 'error');
                return;
            }

            // Velden ophalen
            const nameInput = contactForm.querySelector('.js-name') || contactForm.querySelector('#name');
            const emailInput = contactForm.querySelector('.js-email') || contactForm.querySelector('#email');
            const messageInput = contactForm.querySelector('.js-message') || contactForm.querySelector('#message');
            const confirmProfessional = contactForm.querySelector('.js-confirm') || contactForm.querySelector('#confirmProfessional');

            const nameVal = nameInput.value.trim();
            const emailVal = emailInput.value.trim();
            const messageVal = messageInput.value.trim();
            const challengeVal = (challengeInput ? challengeInput.value.trim() : '');
            const confirmOk = confirmProfessional ? confirmProfessional.checked : false;

            // Eenvoudige controles
            const nameOk = /^[A-Za-zÀ-ÖØ-öø-ÿ'\- ]{2,60}$/.test(nameVal);
            // Stricter email pattern incl. basic TLD and disallowing consecutive dots
            const emailOk = /^(?!.*\.\.)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/.test(emailVal);
            const messageOk = messageVal.length >= 10 && messageVal.length <= 2000;

            if (!nameOk) {
                showToast('Vul een geldige naam in.', 'error');
                markInvalid(nameInput);
                return;
            }
            if (!emailOk || isDisposableEmail(emailVal)) {
                showToast('Vul een geldig e-mailadres in.', 'error');
                markInvalid(emailInput);
                return;
            }
            if (!messageOk) {
                showToast('Bericht moet tussen 10 en 2000 tekens zijn.', 'error');
                markInvalid(messageInput);
                return;
            }
            if (containsUrl(messageVal)) {
                showToast('Verwijder links uit het bericht.', 'error');
                markInvalid(messageInput);
                return;
            }
            // Disallow duplicate characters spam (e.g., "!!!!!!!" or very long repeated chars)
            if (/(.)\1{6,}/.test(messageVal)) {
                showToast('Gebruik minder herhalende tekens in het bericht.', 'error');
                return;
            }
            // Minimaal aantal woorden voor duidelijk bericht
            const wordCount = messageVal.split(/\s+/).filter(Boolean).length;
            if (wordCount < 4) {
                showToast('Schrijf een iets uitgebreider bericht (minimaal 4 woorden).', 'error');
                markInvalid(messageInput);
                return;
            }
            // Professionele bevestiging vereist
            if (!confirmOk) {
                showToast('Bevestig dat dit een professionele vraag is.', 'error');
                return;
            }
            // Controleren rekenuitdaging
            if (!challengeVal || Number(challengeVal) !== expected) {
                showToast('Rekenuitdaging onjuist. Probeer opnieuw.', 'error');
                markInvalid(challengeInput);
                return;
            }

            // Laad-icoon laten zien op de verzendknop
            const buttonText = contactForm.querySelector('.button-text');
            const buttonLoader = contactForm.querySelector('.button-loader');
            buttonText.classList.add('hide');
            buttonLoader.classList.add('show');

            try {
                // Bericht verzenden via :contentReference[oaicite:0]{index=0}
                const templateParams = {
                    to_email: 'casvandertoorn1@gmail.com',
                    from_name: nameVal,
                    from_email: emailVal,
                    message: messageVal
                };

                await emailjs.send(
                    'service_xsfgcac',
                    'template_tj3pqzf',
                    templateParams
                );

                lastSubmitAt = Date.now();
                try { sessionStorage.setItem('last_submit_at', String(lastSubmitAt)); } catch {}
                clearAriaInvalid();
                showToast('Bericht succesvol verzonden!', 'success');
                contactForm.reset();
                // brief success animation on submit button
                try {
                    if (submitBtnEl) {
                        submitBtnEl.classList.add('sent');
                        setTimeout(() => { submitBtnEl.classList.remove('sent'); }, 1400);
                    }
                } catch (e) {}
            } catch (error) {
                console.error('Error:', error);
                showToast('Verzenden mislukt. Probeer opnieuw.', 'error');
            } finally {
                // Knop herstellen naar normale staat
                buttonText.classList.remove('hide');
                buttonLoader.classList.remove('show');
            }
        });
    }

    // ===== SCROLL-REVEAL ANIMATIES =====
    const revealElements = document.querySelectorAll('.reveal');
    const staggerContainers = document.querySelectorAll('.stagger');

    // IntersectionObserver om te checken of elementen in beeld komen
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view'); // voeg animatie toe
            } else {
                entry.target.classList.remove('in-view'); // verwijder animatie
            }
        });
    }, { threshold: 0.2 });

    revealElements.forEach(el => io.observe(el));
    staggerContainers.forEach(container => {
        io.observe(container);
        const children = Array.from(container.children);
        // Kind-elementen krijgen kleine vertraging voor 'stagger'-effect
        children.forEach((child, index) => {
            child.style.transitionDelay = `${index * 90}ms`;
        });
        // Verwijder de delay na de eerste animatie zodat hover direct reageert
        setTimeout(() => {
            children.forEach((child) => {
                child.style.transitionDelay = '0ms';
            });
        }, 1000);
    });

    // ===== SCROLL NAAR BOVEN KNOP =====
    const scrollBtn = document.querySelector('.scroll-to-top-btn');
    if (scrollBtn) {
        window.addEventListener('scroll', () => {
            // Knop tonen als er meer dan 300px is gescrold
            if (window.scrollY > 300) {
                scrollBtn.classList.add('show');
            } else {
                scrollBtn.classList.remove('show');
            }
        });

        // Klikken scrollt soepel naar boven
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ===== TAAL SWITCHER =====
    const langBtns = document.querySelectorAll('.lang-btn');
    const translatableElems = document.querySelectorAll('.translatable');

    // Functie om taal toe te passen
    function applyLanguage(lang) {
        translatableElems.forEach(el => {
            const value = el.dataset[lang];
            if (value) {
                el.innerHTML = value;
            }
        });
        // Active klasse toevoegen aan juiste knop
        langBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
        try {
            localStorage.setItem('preferred_lang', lang); // taal opslaan
        } catch {}
        try {
            document.documentElement.setAttribute('lang', lang); // HTML lang attribuut zetten
        } catch {}
    }

    if (langBtns.length) {
        langBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang; // 'nl' of 'en'
                applyLanguage(lang);
            });
        });

        // Starttaal ophalen uit localStorage of standaard 'nl'
        let initialLang = 'nl';
        try {
            const stored = localStorage.getItem('preferred_lang');
            if (stored === 'nl' || stored === 'en') initialLang = stored;
        } catch {}
        applyLanguage(initialLang);
    }

    // ===== RETRO FX (intro, boot, matrix overlay) =====
    const RetroFX = (() => {
        let matrix = { canvas: null, ctx: null, rafId: null, cols: 0, drops: [] };
        let hasShownIntro = false; // session flag
        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function createOverlay(cls, lines) {
            const wrap = document.createElement('div');
            wrap.className = cls;
            const panel = document.createElement('div');
            panel.className = 'retro-panel';
            const pre = document.createElement('pre');
            pre.className = 'retro-lines';
            panel.appendChild(pre);
            wrap.appendChild(panel);
            document.body.appendChild(wrap);
            // force reflow to enable transition
            void wrap.offsetWidth;
            wrap.classList.add('show');

            return { wrap, pre };
        }

        function typewriter(el, text, speed = 28) {
            return new Promise((resolve) => {
                let i = 0;
                const caret = document.createElement('span');
                caret.className = 'caret';
                const tick = () => {
                    el.textContent = text.slice(0, i++);
                    el.appendChild(caret);
                    if (i <= text.length) {
                        setTimeout(tick, speed);
                    } else {
                        caret.remove();
                        resolve();
                    }
                };
                tick();
            });
        }

        function gatherIdentity() {
            const name = (document.querySelector('.hero-content h1')?.textContent || 'Cas van der Toorn').trim();
            const title = (document.querySelector('.hero-subtitle')?.textContent || 'Web Developer & Designer').trim();
            return { name, title };
        }

        async function showIntro() {
            if (prefersReduced) return; // keep quiet for accessibility
            const { wrap, pre } = createOverlay('retro-intro', []);
            const { name, title } = gatherIdentity();
            await typewriter(pre, 'Welcome, developer_001. System initializing…', 18);
            pre.append('\n');
            await typewriter(pre, `${name} — ${title}`, 22);
            setTimeout(() => { wrap.classList.add('fade-out'); }, 650);
            setTimeout(() => { wrap.remove(); }, 1200);
        }

        function showBoot() {
            if (prefersReduced) return;
            const { wrap, pre } = createOverlay('retro-boot', []);
            pre.textContent = '> booting portfolio...\n> system online';
            setTimeout(() => { wrap.classList.add('fade-out'); }, 800);
            setTimeout(() => { wrap.remove(); }, 1300);
        }

        function startMatrix() {
            if (prefersReduced || matrix.rafId) return;
            const c = document.createElement('canvas');
            c.className = 'retro-matrix';
            document.body.appendChild(c);
            const ctx = c.getContext('2d');
            matrix.canvas = c; matrix.ctx = ctx;
            const CHARS = '01<>[]{}/*+-=~$#@!%';

            function resize() {
                const dpr = Math.max(1, window.devicePixelRatio || 1);
                c.width = Math.floor(window.innerWidth * dpr);
                c.height = Math.floor(window.innerHeight * dpr);
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                const fontSize = 12; // smaller glyphs for subtler presence
                ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace`;
                matrix.cols = Math.ceil(window.innerWidth / fontSize);
                matrix.drops = new Array(matrix.cols).fill(0).map(() => Math.floor(Math.random() * -20));
            }

            let last = 0; const interval = 1000 / 28;
            function draw(ts) {
                if (!last) last = ts;
                if (ts - last < interval) { matrix.rafId = requestAnimationFrame(draw); return; }
                last = ts;
                const w = c.width; const h = c.height; const fontSize = 12; // keep in sync with resize
                // slightly stronger fade to push further back
                ctx.fillStyle = 'rgba(0,0,0,0.16)';
                ctx.fillRect(0, 0, w, h);
                for (let i = 0; i < matrix.cols; i++) {
                    const ch = CHARS[Math.floor(Math.random() * CHARS.length)] || '0';
                    const x = i * fontSize + 2;
                    const y = matrix.drops[i] * fontSize;
                    ctx.fillStyle = 'rgba(0,255,136,0.35)';
                    ctx.fillText(ch, x, y);
                    if (Math.random() < 0.06) {
                        ctx.fillStyle = 'rgba(154,255,201,0.65)';
                        ctx.fillText(ch, x, y + fontSize);
                    }
                    if (y > h && Math.random() > 0.965) matrix.drops[i] = Math.floor(Math.random() * -10);
                    else matrix.drops[i] += 1;
                }
                matrix.rafId = requestAnimationFrame(draw);
            }
            const onResize = () => resize();
            window.addEventListener('resize', onResize, { passive: true });
            resize();
            matrix.rafId = requestAnimationFrame(draw);
            // cleanup hook on element removal
            c._cleanup = () => { window.removeEventListener('resize', onResize, { passive: true }); };
        }

        function stopMatrix() {
            if (matrix.rafId) cancelAnimationFrame(matrix.rafId);
            matrix.rafId = null;
            if (matrix.canvas) {
                matrix.canvas._cleanup?.();
                matrix.canvas.remove();
            }
            matrix.canvas = null; matrix.ctx = null; matrix.cols = 0; matrix.drops = [];
        }

        function enterRetro({ first = false } = {}) {
            startMatrix();
            if (!hasShownIntro && (first || true)) {
                hasShownIntro = true;
                showIntro();
            } else {
                showBoot();
            }
        }
        function exitRetro() {
            stopMatrix();
        }
        return { enterRetro, exitRetro };
    })();

    // ===== THEMA TOGGLE (Donker/Licht) =====
    const themeToggleBtn = document.querySelector('.theme-toggle');
    const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('i') : null;

    function createStar(x, y) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = x + 'px';
        star.style.top = y + 'px';
        star.innerHTML = '✦';
        star.style.color = '#fbbf24';
        star.style.fontSize = Math.random() * 14 + 8 + 'px';
        document.body.appendChild(star);
        requestAnimationFrame(() => star.classList.add('animate'));
        setTimeout(() => star.remove(), 2000);
    }

    function applyTheme(theme) {
        const root = document.documentElement;
        const prevTheme = root.classList.contains('light') ? 'light' : root.classList.contains('retro') ? 'retro' : 'dark';
        
        // Add transition class
        root.classList.add('theme-transition');
        
        // Remove all theme classes, then add the one selected
        ['light', 'dark', 'retro'].forEach(cls => root.classList.remove(cls));
        root.classList.add(theme);
        
        // Tailwind's dark mode relies on .dark
        root.classList.toggle('dark', theme === 'dark');
        
        if (themeIcon) {
            const icon = theme === 'light' ? 'fa-sun' : theme === 'dark' ? 'fa-moon' : 'fa-terminal';
            themeIcon.className = `fa-solid ${icon}`;
            
            // Add star animation when switching to dark mode
            if (theme === 'dark' && prevTheme !== 'dark') {
                const btn = themeToggleBtn.getBoundingClientRect();
                const centerX = btn.left + btn.width / 2;
                const centerY = btn.top + btn.height / 2;
                
                // Create multiple stars around the button
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const distance = 40;
                    const x = centerX + Math.cos(angle) * distance;
                    const y = centerY + Math.sin(angle) * distance;
                    setTimeout(() => createStar(x, y), i * 100);
                }
            }
        }
        
        try { localStorage.setItem('preferred_theme', theme); } catch {}
        
        // Retro FX hooks
        if (theme === 'retro') RetroFX.enterRetro(); else RetroFX.exitRetro();
        
        // Remove transition class after animation
        setTimeout(() => root.classList.remove('theme-transition'), 500);
    }

    function detectInitialTheme() {
        try {
            const stored = localStorage.getItem('preferred_theme');
            if (stored === 'light' || stored === 'dark' || stored === 'retro') return stored;
        } catch {}
        // Default to dark if no stored preference
        return 'dark';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const root = document.documentElement;
            const isLight = root.classList.contains('light');
            const isDark = root.classList.contains('dark') && !root.classList.contains('light') && !root.classList.contains('retro');
            const isRetro = root.classList.contains('retro');
            const next = isLight ? 'dark' : isDark ? 'retro' : isRetro ? 'light' : 'dark';
            applyTheme(next);
        });
        const initial = detectInitialTheme();
        applyTheme(initial);
        if (initial === 'retro') RetroFX.enterRetro({ first: true });
    }

    // ===== HERO: ANIMATED CODING BACKGROUND (Canvas) =====
    // NL: Lichtgewicht "code regen" effect op een <canvas> achter de hero
    // - Respecteert "prefers-reduced-motion"
    // - Verkleint CPU-gebruik door lagere FPS en frame-fading
    (function initCodeBackground() {
        const canvas = document.getElementById('code-bg');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Respect reduced motion
        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;

        let rafId = null;
        let width = 0, height = 0, dpr = Math.max(1, window.devicePixelRatio || 1);
        let columns = 0;
        let drops = [];

        const CHARS = '01{}[]()<>=+-*/.;:,|&^~%!$#@?ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

        function themeColors() {
            const root = document.documentElement;
            const isLight = root.classList.contains('light');
            const isRetro = root.classList.contains('retro');
            // Slightly different opacities per theme
            if (isRetro) {
                return {
                    bg: 'rgba(0, 0, 0, 0.10)',
                    glyph: 'rgba(64, 255, 160, 0.60)', // matrix green trail
                    head: 'rgba(144, 255, 200, 0.95)'
                };
            }
            return {
                // Use a low alpha so previous frame fades out instead of accumulating
                bg: isLight ? 'rgba(248, 250, 252, 0.06)' : 'rgba(2, 6, 23, 0.08)',
                glyph: isLight ? 'rgba(30, 41, 59, 0.55)' : 'rgba(148, 163, 184, 0.55)',
                head: isLight ? 'rgba(30, 41, 59, 0.85)' : 'rgba(226, 232, 240, 0.85)'
            };
        }

        function resize() {
            // NL: Pas resolutie aan scherm + DPR aan en herbereken kolommen/lettergrootte
            const rect = canvas.getBoundingClientRect();
            width = Math.floor(rect.width * dpr);
            height = Math.floor(rect.height * dpr);
            canvas.width = width;
            canvas.height = height;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const fontSize = Math.max(12, Math.min(24, Math.floor(rect.width / 40)));
            ctx.font = `${fontSize}px 'Poppins', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`;
            columns = Math.ceil(rect.width / fontSize);
            drops = new Array(columns).fill(0).map(() => Math.floor(Math.random() * -20));
        }

        let lastTime = 0;
        const frameInterval = 1000 / 28; // ~28 FPS to save CPU
        let frameCounter = 0; // used for occasional hard clears

        function draw(ts) {
            // NL: Ratelimiter ~28 FPS en trail-effect door met semi-transparant vlak te "wissen"
            if (!lastTime) lastTime = ts;
            const delta = ts - lastTime;
            if (delta < frameInterval) {
                rafId = requestAnimationFrame(draw);
                return;
            }
            lastTime = ts;

            const colors = themeColors();
            const rect = canvas.getBoundingClientRect();
            const fontSize = parseInt(ctx.font, 10) || 16;

            // Fade the entire canvas slightly to create trailing effect
            ctx.fillStyle = colors.bg;
            ctx.fillRect(0, 0, rect.width, rect.height);

            // Occasionally perform a hard clear to avoid very long-term ghosting
            frameCounter++;
            if (frameCounter % 900 === 0) { // roughly every ~32s at 28 FPS
                ctx.clearRect(0, 0, rect.width, rect.height);
            }

            for (let i = 0; i < columns; i++) {
                // NL: Kies willekeurige glyphs en laat kolommen naar beneden "druipen"
                const char = CHARS[Math.floor(Math.random() * CHARS.length)];
                const x = i * fontSize + (fontSize * 0.1);
                const y = drops[i] * fontSize;

                // Draw trail
                ctx.fillStyle = colors.glyph;
                ctx.fillText(char, x, y);

                // Draw brighter head occasionally
                if (Math.random() < 0.08) {
                    ctx.fillStyle = colors.head;
                    ctx.fillText(char, x, y + fontSize);
                }

                // Reset drop randomly when reaching bottom
                // Slightly increase reset rate to keep scene fresh over time
                if (y > rect.height && Math.random() > 0.965) {
                    drops[i] = Math.floor(Math.random() * -10);
                } else {
                    drops[i] += 1;
                }
            }

            rafId = requestAnimationFrame(draw);
        }

        // Handle resize (throttled)
        let resizeTimeout = null;
        function onResize() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                resize();
            }, 150);
        }

        // Pause when tab hidden
        function onVisibility() {
            if (document.hidden) {
                if (rafId) cancelAnimationFrame(rafId);
                rafId = null;
            } else if (!rafId) {
                lastTime = 0;
                rafId = requestAnimationFrame(draw);
            }
        }

        // React to theme changes (repaint immediately)
        const themeObserver = new MutationObserver(() => {
            // NL: Thema-wissel -> forceer repaint door lastTime te resetten
            // Force quick repaint by resetting lastTime
            lastTime = 0;
        });
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        window.addEventListener('resize', onResize, { passive: true });
        document.addEventListener('visibilitychange', onVisibility);

        resize();
        rafId = requestAnimationFrame(draw);

        // Cleanup on unload
        window.addEventListener('beforeunload', () => {
            themeObserver.disconnect();
            if (rafId) cancelAnimationFrame(rafId);
        });
    })();

    // ===== HERO: 3D CODING NEBULA (Three.js) =====
    // NL: 3D-achtergrond met sterrenveld, grid, code-panelen en wireframes
    // - ES Modules van Three worden in index.html geladen en hier als window.THREE gebruikt
    // - Houdt rekening met reduced motion en pauzeert bij tab-wechsel
    (function initCodingNebula3D() {
        const mount = document.querySelector('.code-3d') || document.getElementById('code-3d');
        if (!mount) return;
        if (typeof THREE === 'undefined') return;

        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;

        let renderer, scene, camera, rafId = null;
        let mouseX = 0, mouseY = 0, targetRotX = 0, targetRotY = 0;

        // Scene content holders
        let starfield, starVelocities;
        let grid;
        let codePanels = [];
        let wireframes = [];

        function themeColors() {
            // NL: Kleuren wisselen mee met licht/donker/retro thema
            const root = document.documentElement;
            const isLight = root.classList.contains('light');
            const isRetro = root.classList.contains('retro');
            if (isRetro) {
                return {
                    base: 0x00ff88, // primary green
                    accent: 0x00cc66,
                    accent2: 0x00aa55,
                    fog: 0x000000,
                    glyph: '#9affc9'
                };
            }
            return {
                base: isLight ? 0x0f172a : 0xe2e8f0, // slate-900 vs slate-200
                accent: isLight ? 0x0ea5e9 : 0x22d3ee, // cyan 500 vs cyan 400
                accent2: isLight ? 0x22c55e : 0x84cc16, // green vs lime-ish
                fog: isLight ? 0xf8fafc : 0x020617,
                glyph: isLight ? '#1e293b' : '#93a3b8'
            };
        }

        function createRenderer(width, height) {
            const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
            r.setSize(width, height, false);
            r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            r.outputColorSpace = THREE.SRGBColorSpace;
            r.setClearColor(0x000000, 0);
            return r;
        }

        function makeCodeTexture(lines, color) {
            // NL: Render regels code op een canvas en gebruik dat als texture
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            ctx.fillStyle = 'rgba(0,0,0,0)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = "18px 'Poppins', ui-monospace, Menlo, Consolas, 'Courier New', monospace";
            ctx.textBaseline = 'top';
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = color;
            const lh = 22;
            lines.slice(0, 10).forEach((line, i) => {
                ctx.fillText(line, 16, 16 + i * lh);
            });
            const tex = new THREE.CanvasTexture(canvas);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
            return tex;
        }

        function createCodePanel(textLines, colorHex) {
            const tex = makeCodeTexture(textLines, colorHex);
            const geo = new THREE.PlaneGeometry(2.8, 1.4);
            const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9, depthWrite: false });
            const mesh = new THREE.Mesh(geo, mat);
            // Subtle glow via additive duplicate
            const glowMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
            const glow = new THREE.Mesh(geo.clone(), glowMat);
            glow.scale.set(1.04, 1.06, 1);
            mesh.add(glow);
            return mesh;
        }

        function createWireframe(radius, color) {
            // NL: Eenvoudige icosahedron-wireframe met lichtgevende punten op vertices
            const geo = new THREE.IcosahedronGeometry(radius, 1);
            const mat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.6 });
            const mesh = new THREE.Mesh(geo, mat);
            // vertex glow points
            const verts = geo.attributes.position.array;
            const ptsGeo = new THREE.BufferGeometry();
            ptsGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
            const ptsMat = new THREE.PointsMaterial({ color, size: 0.03, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
            const pts = new THREE.Points(ptsGeo, ptsMat);
            mesh.add(pts);
            return mesh;
        }

        function createScene(width, height) {
            // NL: Camera + mist, sterren (Points), grid, drie "code panelen" en wireframes
            scene = new THREE.Scene();

            const fov = 45;
            const aspect = width / Math.max(1, height);
            camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 150);
            camera.position.set(0, 0.3, 6);

            const colors = themeColors();
            // Subtle fog for depth cohesion
            scene.fog = new THREE.FogExp2(colors.fog, 0.04);

            // Starfield (warp)
            const starCount = 3000;
            const positions = new Float32Array(starCount * 3);
            starVelocities = new Float32Array(starCount);
            for (let i = 0; i < starCount; i++) {
                positions[i * 3] = (Math.random() - 0.5) * 24; // x
                positions[i * 3 + 1] = (Math.random() - 0.5) * 14; // y
                positions[i * 3 + 2] = -Math.random() * 60; // z (towards camera)
                starVelocities[i] = 0.05 + Math.random() * 0.35;
            }
            const starGeo = new THREE.BufferGeometry();
            starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const starMat = new THREE.PointsMaterial({ color: colors.base, size: 0.02, sizeAttenuation: true, transparent: true, opacity: 0.9 });
            starfield = new THREE.Points(starGeo, starMat);
            scene.add(starfield);

            // Holographic grid floor
            grid = new THREE.GridHelper(60, 60, new THREE.Color(colors.accent), new THREE.Color(colors.accent));
            grid.material.transparent = true;
            grid.material.opacity = 0.15;
            grid.position.y = -3;
            grid.rotation.x = Math.PI / 2.6;
            scene.add(grid);

            // Floating code panels
            const codeSnippet1 = [
                'function greet(name) {',
                "  return `Hello, ${name}!`;",
                '}',
                'const user = "Cas";',
                'console.log(greet(user));'
            ];
            const codeSnippet2 = [
                'SELECT name, stars',
                'FROM repos',
                "WHERE language = 'JavaScript'",
                'ORDER BY stars DESC',
                'LIMIT 10;'
            ];
            const codeSnippet3 = [
                'const app = express();',
                "app.get('/', (req, res) => res.send('OK'));",
                'app.listen(3000);'
            ];

            const p1 = createCodePanel(codeSnippet1, themeColors().glyph);
            p1.position.set(-2.2, 1.0, -3);
            p1.rotation.set(0.1, 0.3, -0.05);

            const p2 = createCodePanel(codeSnippet2, themeColors().glyph);
            p2.position.set(2.3, -0.2, -4.5);
            p2.rotation.set(-0.05, -0.25, 0.06);

            const p3 = createCodePanel(codeSnippet3, themeColors().glyph);
            p3.position.set(0.2, 1.6, -6);
            p3.rotation.set(0.12, -0.15, 0);

            codePanels = [p1, p2, p3];
            codePanels.forEach(p => scene.add(p));

            // Wireframe tech nodes
            const w1 = createWireframe(0.9, themeColors().accent);
            w1.position.set(-3.2, -0.6, -5.5);
            const w2 = createWireframe(0.7, themeColors().accent2);
            w2.position.set(3.0, 1.2, -7);
            const w3 = createWireframe(0.55, themeColors().accent);
            w3.position.set(0.0, -1.2, -3.8);
            wireframes = [w1, w2, w3];
            wireframes.forEach(w => scene.add(w));
        }

        function updateTheme() {
            // NL: Herkleur objecten wanneer thema wisselt
            if (!scene) return;
            const colors = themeColors();
            // update fog
            scene.fog.color = new THREE.Color(colors.fog);
            // update grid color/opacity
            if (grid && grid.material) {
                grid.material.opacity = 0.15;
                grid.material.color = new THREE.Color(colors.accent);
            }
            // update star color
            if (starfield && starfield.material) {
                starfield.material.color = new THREE.Color(colors.base);
                starfield.material.needsUpdate = true;
            }
            // refresh code panel textures for contrast
            const snippets = [
                ['function greet(name) {', "  return `Hello, ${name}!`;", '}', 'const user = "Cas";', 'console.log(greet(user));'],
                ['SELECT name, stars', 'FROM repos', "WHERE language = 'JavaScript'", 'ORDER BY stars DESC', 'LIMIT 10;'],
                ['const app = express();', "app.get('/', (req, res) => res.send('OK'));", 'app.listen(3000);']
            ];
            codePanels.forEach((panel, idx) => {
                const newTex = makeCodeTexture(snippets[idx], colors.glyph);
                if (panel.material && newTex) {
                    panel.material.map = newTex; panel.material.needsUpdate = true;
                }
                // child[0] is glow duplicate
                const glow = panel.children[0];
                if (glow && glow.material && newTex) {
                    glow.material.map = newTex; glow.material.needsUpdate = true;
                }
            });
            // wireframe colors
            const wfColors = [colors.accent, colors.accent2, colors.accent];
            wireframes.forEach((w, i) => {
                if (w.material) w.material.color = new THREE.Color(wfColors[i % wfColors.length]);
                if (w.children[0] && w.children[0].material) w.children[0].material.color = new THREE.Color(wfColors[i % wfColors.length]);
            });
        }

        function resize() {
            const rect = mount.getBoundingClientRect();
            const w = Math.max(1, Math.floor(rect.width));
            const h = Math.max(1, Math.floor(rect.height));
            if (!renderer) renderer = createRenderer(w, h);
            renderer.setSize(w, h, false);
            if (camera) {
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
            }
        }

        function animate(ts) {
            // NL: Parallax d.m.v. muis en subtiele rotatie; kleurcycli op highlight-points
            // mouse parallax target
            targetRotX += (mouseY * 0.15 - targetRotX) * 0.05;
            targetRotY += (mouseX * 0.25 - targetRotY) * 0.05;

            // animate starfield (towards camera)
            if (starfield) {
                const pos = starfield.geometry.attributes.position;
                const arr = pos.array;
                for (let i = 0; i < starVelocities.length; i++) {
                    arr[i * 3 + 2] += starVelocities[i];
                    // reset when passing camera
                    if (arr[i * 3 + 2] > 2) {
                        arr[i * 3] = (Math.random() - 0.5) * 24;
                        arr[i * 3 + 1] = (Math.random() - 0.5) * 14;
                        arr[i * 3 + 2] = -60 - Math.random() * 20;
                        starVelocities[i] = 0.05 + Math.random() * 0.35;
                    }
                }
                pos.needsUpdate = true;
                // slow scene parallax based on mouse
                starfield.rotation.x = targetRotX * 0.15;
                starfield.rotation.y = targetRotY * 0.15;
            }

            // panel float + gentle rotation
            codePanels.forEach((p, idx) => {
                p.rotation.y += 0.0025 * (idx % 2 === 0 ? 1 : -1);
                p.position.y += Math.sin(ts * 0.001 + idx) * 0.0008;
                p.rotation.x = (idx === 0 ? 0.1 : idx === 1 ? -0.05 : 0.12) + targetRotX * 0.3;
                p.rotation.z += (idx === 1 ? 0.0006 : -0.0004);
            });

            // wireframe drift
            wireframes.forEach((w, i) => {
                w.rotation.x += 0.003 * (i % 2 ? -1 : 1);
                w.rotation.y += 0.002;
                w.position.y += Math.sin(ts * 0.0012 + i) * 0.0009;
            });

            // grid subtle pulse
            if (grid && grid.material) {
                const base = 0.12;
                grid.material.opacity = base + Math.sin(ts * 0.0015) * 0.03;
            }

            renderer.render(scene, camera);
            rafId = requestAnimationFrame(animate);
        }

        // Initialize
        const rect = mount.getBoundingClientRect();
        renderer = createRenderer(rect.width, rect.height);
        mount.appendChild(renderer.domElement);
        createScene(rect.width, rect.height);
        resize();

        // Theme observer
        const themeObserver = new MutationObserver(() => updateTheme());
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        // Resize + visibility
        const onResize = () => resize();
        window.addEventListener('resize', onResize, { passive: true });
        const onVisibility = () => {
            if (document.hidden) {
                if (rafId) cancelAnimationFrame(rafId);
                rafId = null;
            } else if (!rafId) {
                rafId = requestAnimationFrame(animate);
            }
        };
        document.addEventListener('visibilitychange', onVisibility);

        // Interaction: mouse parallax
        const onPointerMove = (e) => {
            // NL: Normalizeer muispositie binnen de hero naar [-0.5, 0.5]
            const rect2 = mount.getBoundingClientRect();
            const x = (e.clientX - rect2.left) / Math.max(1, rect2.width);
            const y = (e.clientY - rect2.top) / Math.max(1, rect2.height);
            mouseX = (x - 0.5);
            mouseY = (0.5 - y);
        };
        window.addEventListener('pointermove', onPointerMove, { passive: true });

        // Start
        rafId = requestAnimationFrame(animate);

        // Cleanup
        window.addEventListener('beforeunload', () => {
            themeObserver.disconnect();
            if (rafId) cancelAnimationFrame(rafId);
            renderer.dispose();
            if (scene) {
                scene.traverse(obj => {
                    if (obj.geometry) obj.geometry.dispose?.();
                    if (obj.material) {
                        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose?.());
                        else obj.material.dispose?.();
                    }
                });
            }
            window.removeEventListener('pointermove', onPointerMove, { passive: true });
        });
    })();

    // ===== CUSTOM CURSOR (ring + dot) =====
    // NL: Aangepaste cursor (ring + dot) met traagheid (lerp) en hover/klik feedback
    // - Uitgeschakeld voor touch apparaten en reduced motion
    (function initCustomCursor() {
        const cursor = document.querySelector('.custom-cursor');
        if (!cursor) return;
        // Respect reduced motion and coarse (touch) pointers
        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        if (prefersReduced || isCoarse) return;

        const ring = cursor.querySelector('.cursor-ring');
        const dot = cursor.querySelector('.cursor-dot');
        if (!ring || !dot) return;

        let x = window.innerWidth / 2, y = window.innerHeight / 2;
        let tx = x, ty = y; // target
        let rafId = null;

        const lerp = (a, b, t) => a + (b - a) * t; // NL: lineaire interpolatie

        function animate() {
            x = lerp(x, tx, 0.18);
            y = lerp(y, ty, 0.18);
            ring.style.transform = `translate(${x}px, ${y}px)`;
            dot.style.transform = `translate(${tx}px, ${ty}px)`; // dot is more snappy
            rafId = requestAnimationFrame(animate);
        }

        const move = (e) => {
            tx = e.clientX; ty = e.clientY;
        };
        window.addEventListener('pointermove', move, { passive: true });

        // NL: Hover-detectie op interactieve elementen voor ring-animatie
        const hoverSelectors = 'a, button, .cta-button, .skill-card, .project-card, .cert-card, input, textarea, select, .theme-toggle, .lang-btn';
        function addHoverListeners(root) {
            root.querySelectorAll(hoverSelectors).forEach(el => {
                el.addEventListener('pointerenter', () => cursor.classList.add('is-hovering'));
                el.addEventListener('pointerleave', () => cursor.classList.remove('is-hovering'));
            });
        }
        addHoverListeners(document);

        // Click pulse
        window.addEventListener('pointerdown', () => cursor.classList.add('is-active'));
        window.addEventListener('pointerup', () => cursor.classList.remove('is-active'));

        // NL: Pauzeren wanneer tab niet zichtbaar is
        const onVisibility = () => {
            if (document.hidden) {
                if (rafId) cancelAnimationFrame(rafId);
                rafId = null;
            } else if (!rafId) {
                rafId = requestAnimationFrame(animate);
            }
        };
        document.addEventListener('visibilitychange', onVisibility);

        rafId = requestAnimationFrame(animate);

        // Cleanup
        window.addEventListener('beforeunload', () => {
            if (rafId) cancelAnimationFrame(rafId);
            window.removeEventListener('pointermove', move, { passive: true });
        });
    })();

    // ===== PARALLAX SCROLL EFFECTS =====
    // NL: Subtiele translateY op secties afhankelijk van scrollpositie (performant met rAF)
    (function initParallax() {
        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;

        // Targets: light-touch parallax on major blocks
        const targets = [
            '.hero-content',
            '.about-image img',
            '.about-text',
            '.cert-grid',
            '.internship-logo',
            '.skills-grid',
            '.projects-grid',
            '.contact-content'
        ]
        .map(sel => document.querySelector(sel))
        .filter(Boolean);

        if (!targets.length) return;

        // Set will-change for smoother transforms
        targets.forEach(el => { try { el.style.willChange = 'transform'; } catch {} });

        const viewportH = () => Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1); // NL: robuuste viewport-hoogte

        function applyParallax() {
            // NL: Bereken ratio t.o.v. middelpunt van viewport en map dat naar pixels
            const vh = viewportH();
            targets.forEach((el, idx) => {
                const rect = el.getBoundingClientRect();
                const middle = rect.top + rect.height / 2;
                const ratio = (middle - vh / 2) / vh; // -1..1 centered
                const strength = 12 + idx * 2; // slight variance per block
                const translateY = Math.max(-24, Math.min(24, -ratio * strength));
                el.style.transform = `translateY(${translateY}px)`;
            });
        }

        // Throttle with rAF
        let ticking = false;
        function onScroll() {
            // NL: Throttle updates met requestAnimationFrame
            if (!ticking) {
                requestAnimationFrame(() => {
                    applyParallax();
                    ticking = false;
                });
                ticking = true;
            }
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        // Initial
        applyParallax();
    })();

    // ===== NAV LOGO -> SCROLL NAAR BOVEN / TERUG NAAR HOME =====
    const navLogo = document.querySelector('.nav-logo');
    if (navLogo) {
        navLogo.addEventListener('click', (e) => {
            e.preventDefault();
            const path = (location.pathname || '').toLowerCase();
            const onIndex = path.endsWith('/') || path.endsWith('/index.html') || path === '';
            if (onIndex) {
                const homeSection = document.querySelector('.home');
                if (homeSection) {
                    homeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } else {
                window.location.href = 'index.html#home';
            }
        });
    }
});
