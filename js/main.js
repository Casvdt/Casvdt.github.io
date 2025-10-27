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
// Eenvoudige Nederlandse toelichting:
// Dit bestand bestuurt de interactieve onderdelen van de site.
// Korte samenvatting van onderdelen (NL):
// - Offline controle en redirect naar 404 als er geen netwerk is.
// - Scroll progress bar (bovenaan de pagina).
// - Word cloud animatie in de skills-sectie.
// - Mobiel hamburger-menu en smooth scrolling naar secties.
// - Kleine toast-meldingen voor succes/fouten.
// - Contactformulier: live-validatie, anti-spam en EmailJS-verzending.
// - Thema wissel (licht / donker / retro) inclusief kleine ster-animatie.
// - Extra visuele effecten: 3D-achtergrond, matrix-overlay, custom cursor.

(function earlyOfflineRedirect(){
    try {
        // Controleer of er een debug-parameter in de URL staat waarmee we
        // de offline-redirect tijdelijk kunnen omzeilen tijdens debuggen.
        // Dit voorkomt dat iedere developer meteen naar 404 gaat als de
        // machine offline is tijdens ontwikkeling.
        const debugBypass = /(?:[?&])debugOnline=1\b/.test(location.search);

        // Als navigator.onLine beschikbaar is, gebruiken we die waarde om te
        // beslissen of we de gebruiker direct naar de 404-pagina moeten sturen.
        // Dit voorkomt dat de cached site wordt getoond wanneer er écht geen
        // netwerk is (behaviour desired for this portfolio).
        if (!debugBypass && typeof navigator !== 'undefined' && 'onLine' in navigator) {
            if (!navigator.onLine) {
                // Redirect naar lokale 404 als offline — dit is een UX keuze.
                location.replace('/404.html');
                return;
            }
        }
    } catch {}
})();

// Scroll progress removed: UI element and JS handling were removed.

document.addEventListener('DOMContentLoaded', () => {
    // Scroll progress removed; no initialization needed.

    // ...existing code...

    // ===== MOBIELE MENU FUNCTIE =====
    // Mobile menu: kies de hamburger en de container met links.
    // We gebruiken JavaScript hier omdat op kleine schermen de navigatie
    // anders getoond moet worden dan op desktop.
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
            // Als menu dicht is: verbergen en inline styles verwijderen zodat
            // de originele CSS weer het gedrag bepaalt (belangrijk bij
            // window-resize terug naar desktop).
            navLinks.style.display = 'none';
            navLinks.removeAttribute('style');
        }
    });

    // (NL) Tip: het mobiele menu gebruikt inline styles om de desktop CSS
    // tijdelijk te overrulen wanneer het geopend is. We verwijderen die
    // inline styles weer wanneer het menu gesloten wordt.

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
                // Gebruik setTimeout(0) om de browser een kans te geven de
                // layout en focus te herstellen voordat de smooth scroll start.
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
        // role/status + aria-live zorgt ervoor dat schermlezers het
        // bericht voorlezen zodra het verschijnt; aria-atomic voorkomt
        // dat alleen een deel van de tekst wordt uitgesproken.
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.setAttribute('aria-atomic', 'true');
    } catch {}
    document.body.appendChild(toast);

    // Functie om toast weer te geven
    function showToast(message, type) {
        // Vervang de inhoud en zet de juiste klasse (bepaalt kleur/icoon).
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');
        // Verwijder de zichtbaarheid na 3 seconden zodat de toast verdwijnt.
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
        // Verwijder aria-invalid attributen (gebruik voor accesibility/UX)
        function clearAriaInvalid() {
            ['#name', '#email', '#message', '#challenge'].forEach(sel => {
                const el = contactForm.querySelector(sel);
                if (el) el.removeAttribute('aria-invalid');
            });
        }
        // Markeer een veld als ongeldig en focus het (zonder scrollen)
        function markInvalid(el) {
            if (!el) return;
            try { el.setAttribute('aria-invalid', 'true'); } catch {}
            try { el.focus({ preventScroll: true }); } catch {}
        }
    // Genereer simpele rekenuitdaging (bijv. 3 + 5)
    // Dit blok zorgt ervoor dat bots zonder JS of eenvoudige scrapers
    // moeite hebben met het formulier (lightweight anti-spam).
    // We gebruiken querySelector met fallback naar ID voor robuustheid.
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

        // Zorg dat er een klein helper-element bestaat waar validatieberichten
        // in geplaatst worden. Dit voorkomt dat we telkens DOM-manipulatie
        // met innerHTML doen terwijl de gebruiker typt.
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

        // Zet visuele staat van een veld: valid/invalid/neutral + hulptekst
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

    // Regexes voor snelle client-side validatie. Niets hiervan vervangt
    // server-side checks, maar het verbetert de UX door direct feedback te geven.
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
                // Gebruiker heeft een ongeldige naam ingevoerd (korte of rare tekens)
                showToast('Vul een geldige naam in.', 'error');
                markInvalid(nameInput);
                return;
            }
            if (!emailOk || isDisposableEmail(emailVal)) {
                // Ongeldig e-mailadres of een tijdelijke/disposable provider
                showToast('Vul een geldig e-mailadres in.', 'error');
                markInvalid(emailInput);
                return;
            }
            if (!messageOk) {
                // Te kort of te lang bericht
                showToast('Bericht moet tussen 10 en 2000 tekens zijn.', 'error');
                markInvalid(messageInput);
                return;
            }
            if (containsUrl(messageVal)) {
                // Links zijn niet toegestaan via dit formulier om misbruik te beperken
                showToast('Verwijder links uit het bericht.', 'error');
                markInvalid(messageInput);
                return;
            }
            // Disallow duplicate characters spam (e.g., "!!!!!!!" or very long repeated chars)
            if (/(.)\1{6,}/.test(messageVal)) {
                // Detecteert overmatig herhaalde tekens en blokkeert spam-achtige berichten
                showToast('Gebruik minder herhalende tekens in het bericht.', 'error');
                return;
            }
            // Minimaal aantal woorden voor duidelijk bericht
            const wordCount = messageVal.split(/\s+/).filter(Boolean).length;
            if (wordCount < 4) {
                // Vereist minimaal 4 woorden zodat korte vage berichten niet worden geaccepteerd
                showToast('Schrijf een iets uitgebreider bericht (minimaal 4 woorden).', 'error');
                markInvalid(messageInput);
                return;
            }
            // Terms acceptance required
            if (!confirmOk) {
                // Controleer of de gebruiker de voorwaarden heeft geaccepteerd.
                // De boodschap is taalgevoelig (NL/EN) en voorkomt dat gebruikers
                // per ongeluk iets versturen zonder akkoord.
                const isEnglish = document.documentElement.getAttribute('lang') === 'en';
                showToast(isEnglish ? 'Please accept the terms and conditions.' : 'Accepteer de voorwaarden a.u.b.', 'error');
                return;
            }
            // Controleren rekenuitdaging
            if (!challengeVal || Number(challengeVal) !== expected) {
                // Anti-spam: verkeerde berekening
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

                // EmailJS: externe service aanroepen. Dit is asynchroon en kan
                // mislukken (vandaar de try/catch). De templateParams worden
                // gebruikt door de EmailJS-sjabloon op de server/service.
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

    // Toelichting:
    // - We gebruiken IntersectionObserver omdat het veel efficiënter is dan
    //   scroll-events: de browser roept de callback alleen wanneer nodig.
    // - threshold: 0.2 betekent dat 20% van het element in beeld moet zijn
    //   voordat de in-view klasse wordt toegevoegd — dit zorgt voor
    //   vloeiende reveal-animaties.

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

    // Toelichting scroll-to-top:
    // - We tonen de knop pas na een drempel (300px) omdat hij anders
    //   te veel afleidt op korte pagina's.
    // - window.scrollTo met behavior 'smooth' levert een goede UX op
    //   zonder extra libraries.

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

    // Toelichting taalwissel:
    // - Teksten met class .translatable hebben data-en/data-nl attributen.
    // - applyLanguage vervangt innerHTML, dit maakt vertaling simpel en
    //   voorkomt dat meerdere datasets nodig zijn.

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

        // Toelichting createOverlay:
        // - Bouwt een eenvoudig overlay-element met een panel voor tekst.
        // - Wrapper krijgt .show toegevoegd na een forced reflow zodat
        //   CSS-transities voor in-/uitfaden soepel werken.

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

    // typewriter toelichting:
    // - Simpele type-effect implementatie die tekst in chunks toevoegt.
    // - Gebruikt Promise zodat callers eenvoudig kunnen wachten.

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

        // startMatrix toelichting:
        // - Creëert een canvas met kolommen 'drops' die omlaag schuiven.
        // - Ratelimiting en kleinere font sizes verminderen CPU gebruik.

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

    // Decorative star animation removed — no visual stars on theme switch

    // Toelichting createStar:
    // - Maakt visuele ster-elementen rond de thema-knop bij overschakelen
    //   naar donker thema: puur decoratief, geen functionele impact.

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
            
            // No decorative star animation — keep theme switching snappy and accessible
        }
        
    // Sla voorkeur lokaal op zodat het bij volgende bezoeken hetzelfde blijft
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

    // Toelichting thema:
    // - applyTheme zorgt ervoor dat CSS-klasse op <html> overeenkomt met
    //   gekozen thema; Tailwind gebruikt .dark voor sommige utilities.
    // - We slaan de voorkeur op in localStorage en starten eventueel
    //   retro effecten (matrix) bij retro.

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

    // ...existing code...

    // Toelichting code-regen achtergrond:
    // - We respecteren prefers-reduced-motion en beperken updates naar ~28FPS
    //   om CPU/GPU gebruik te reduceren.
    // - De trail wordt gemaakt door een lichte vulling over het canvas te
    //   tekenen in plaats van het volledig clearen — dit geeft het
    //   'druppel' effect.

    // ...existing code...

    // Toelichting 3D animatie:
    // - animate() bevat alle logica voor het bewegen van sterren, panelen en
    //   wireframes. We roepen requestAnimationFrame recursief aan voor
    //   soepele animatie en kunnen het pauzeren bij tab-switch.

    // ...existing code...

    // ...existing code...

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
