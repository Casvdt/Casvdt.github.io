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
    const COOLDOWN_MS = 8000; // 8 seconden tussen berichten
    let lastSubmitAt = 0;

    // Functie om te checken of bericht een link bevat
    function containsUrl(text) {
        const urlRegex = /(https?:\/\/|www\.)/i;
        return urlRegex.test(text);
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

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

            const nameVal = nameInput.value.trim();
            const emailVal = emailInput.value.trim();
            const messageVal = messageInput.value.trim();

            // Eenvoudige controles
            const nameOk = /^[A-Za-zÀ-ÖØ-öø-ÿ'\- ]{2,60}$/.test(nameVal);
            const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailVal);
            const messageOk = messageVal.length >= 10 && messageVal.length <= 2000;

            if (!nameOk) {
                showToast('Vul een geldige naam in.', 'error');
                return;
            }
            if (!emailOk) {
                showToast('Vul een geldig e-mailadres in.', 'error');
                return;
            }
            if (!messageOk) {
                showToast('Bericht moet tussen 10 en 2000 tekens zijn.', 'error');
                return;
            }
            if (containsUrl(messageVal)) {
                showToast('Verwijder links uit het bericht.', 'error');
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
});
