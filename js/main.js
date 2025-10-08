document.addEventListener('DOMContentLoaded', () => {
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
        const qEl = document.getElementById('challenge-q');
        const challengeInput = document.getElementById('challenge');
        const a = Math.floor(2 + Math.random() * 8);
        const b = Math.floor(2 + Math.random() * 8);
        const expected = a + b;
        if (qEl) qEl.textContent = `${a} + ${b} =`;

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
            const nameInput = contactForm.querySelector('#name');
            const emailInput = contactForm.querySelector('#email');
            const messageInput = contactForm.querySelector('#message');
            const confirmProfessional = contactForm.querySelector('#confirmProfessional');

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

    // ===== THEMA TOGGLE (Donker/Licht) =====
    const themeToggleBtn = document.querySelector('.theme-toggle');
    const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('i') : null;

    function applyTheme(theme) {
        const root = document.documentElement;
        // Keep existing light theme for custom CSS, and also apply Tailwind's dark mode class
        root.classList.toggle('light', theme === 'light');
        root.classList.toggle('dark', theme === 'dark');
        if (themeIcon) {
            themeIcon.className = theme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
        try { localStorage.setItem('preferred_theme', theme); } catch {}
    }

    function detectInitialTheme() {
        try {
            const stored = localStorage.getItem('preferred_theme');
            if (stored === 'light' || stored === 'dark') return stored;
        } catch {}
        // Default to dark if no stored preference
        return 'dark';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isLight = document.documentElement.classList.contains('light');
            applyTheme(isLight ? 'dark' : 'light');
        });
        applyTheme(detectInitialTheme());
    }

    // ===== HERO: ANIMATED CODING BACKGROUND (Canvas) =====
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
            const isLight = document.documentElement.classList.contains('light');
            // Slightly different opacities per theme
            return {
                // Use a low alpha so previous frame fades out instead of accumulating
                bg: isLight ? 'rgba(248, 250, 252, 0.06)' : 'rgba(2, 6, 23, 0.08)',
                glyph: isLight ? 'rgba(30, 41, 59, 0.55)' : 'rgba(148, 163, 184, 0.55)',
                head: isLight ? 'rgba(30, 41, 59, 0.85)' : 'rgba(226, 232, 240, 0.85)'
            };
        }

        function resize() {
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

    // ===== HERO: 3D CODE RING (Three.js) =====
    (function initCodeRing3D() {
        const mount = document.getElementById('code-3d');
        if (!mount) return;
        if (typeof THREE === 'undefined') return;

        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;

        let renderer, scene, camera, ring, rafId = null;

        function themeColors() {
            const isLight = document.documentElement.classList.contains('light');
            return {
                bg: 'transparent',
                particle: isLight ? 0x1e293b : 0x93a3b8, // slate-800 (light) vs slate-400 (dark)
                highlight: isLight ? 0x0ea5e9 : 0x22d3ee  // cyan-ish highlights
            };
        }

        function createRenderer(width, height) {
            const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
            r.setSize(width, height, false);
            r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            r.outputColorSpace = THREE.SRGBColorSpace;
            r.setClearColor(0x000000, 0); // transparent
            return r;
        }

        function createScene(width, height) {
            scene = new THREE.Scene();

            const fov = 45;
            const aspect = width / Math.max(1, height);
            const near = 0.1;
            const far = 100;
            camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
            camera.position.set(0, 0, 6);

            // Particles arranged on a torus
            const group = new THREE.Group();
            const colors = themeColors();

            // Main torus points
            const rMajor = 2.4;
            const rMinor = 0.65;
            const tubularSegments = 550;
            const radialSegments = 180;
            const torus = new THREE.TorusGeometry(rMajor, rMinor, radialSegments, tubularSegments);
            torus.deleteAttribute('normal');
            torus.deleteAttribute('uv');
            const ptsGeo = new THREE.BufferGeometry();
            const positions = torus.attributes.position.array;
            ptsGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

            const material = new THREE.PointsMaterial({
                color: colors.particle,
                size: 0.02,
                sizeAttenuation: true,
                transparent: true,
                opacity: 0.7,
                depthWrite: false
            });
            const points = new THREE.Points(ptsGeo, material);
            group.add(points);

            // Sparse highlight particles sprinkled around ring
            const sprinkleCount = 900;
            const sprinkleGeo = new THREE.BufferGeometry();
            const sprinklePositions = new Float32Array(sprinkleCount * 3);
            for (let i = 0; i < sprinkleCount; i++) {
                // Sample near torus surface with slight jitter for depth
                const u = Math.random() * Math.PI * 2;
                const v = Math.random() * Math.PI * 2;
                const jitter = (Math.random() - 0.5) * 0.18;
                const x = (rMajor + (rMinor + jitter) * Math.cos(v)) * Math.cos(u);
                const y = (rMajor + (rMinor + jitter) * Math.cos(v)) * Math.sin(u);
                const z = (rMinor + jitter) * Math.sin(v);
                sprinklePositions[i * 3] = x;
                sprinklePositions[i * 3 + 1] = y;
                sprinklePositions[i * 3 + 2] = z;
            }
            sprinkleGeo.setAttribute('position', new THREE.BufferAttribute(sprinklePositions, 3));
            const sprinkleMat = new THREE.PointsMaterial({
                color: colors.highlight,
                size: 0.028,
                sizeAttenuation: true,
                transparent: true,
                opacity: 0.55,
                depthWrite: false
            });
            const sprinklePts = new THREE.Points(sprinkleGeo, sprinkleMat);
            group.add(sprinklePts);

            ring = group;
            scene.add(group);
        }

        function updateTheme() {
            if (!ring) return;
            const colors = themeColors();
            ring.traverse(obj => {
                if (obj.isPoints && obj.material) {
                    if (obj.material.color) obj.material.color.setHex(obj === ring.children[0] ? colors.particle : colors.highlight);
                    obj.material.needsUpdate = true;
                }
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
            // subtle motion
            if (ring) {
                ring.rotation.x = 0.25 + Math.sin(ts * 0.00015) * 0.08;
                ring.rotation.y += 0.0006;
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

        // Start
        rafId = requestAnimationFrame(animate);

        // Cleanup
        window.addEventListener('beforeunload', () => {
            themeObserver.disconnect();
            if (rafId) cancelAnimationFrame(rafId);
            renderer.dispose();
            // dispose geometries/materials
            if (ring) {
                ring.traverse(obj => {
                    if (obj.geometry) obj.geometry.dispose();
                    if (obj.material) obj.material.dispose?.();
                });
            }
        });
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
