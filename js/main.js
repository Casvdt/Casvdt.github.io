document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu functionality
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    let isMenuOpen = false;

    hamburger.addEventListener('click', () => {
        isMenuOpen = !isMenuOpen;
        if (isMenuOpen) {
            navLinks.style.display = 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '100%';
            navLinks.style.left = '0';
            navLinks.style.right = '0';
            navLinks.style.background = 'white';
            navLinks.style.padding = '1rem';
            navLinks.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            navLinks.style.display = 'none';
        }
    });

    // Smooth scrolling for navigation links using class-based targets
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const hash = this.getAttribute('href'); // e.g., #home
            const className = hash.replace('#', '.'); // -> .home
            const target = document.querySelector(className);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                if (isMenuOpen) {
                    isMenuOpen = false;
                    navLinks.style.display = 'none';
                }
            }
        });
    });

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);

    // Show toast message
    function showToast(message, type) {
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Form submission with validation and cooldown
    const contactForm = document.querySelector('.contact-form');
    const COOLDOWN_MS = 8000;
    let lastSubmitAt = 0;

    function containsUrl(text) {
        const urlRegex = /(https?:\/\/|www\.)/i;
        return urlRegex.test(text);
    }

    // Removed language-specific profanity list per request

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const now = Date.now();
            if (now - lastSubmitAt < COOLDOWN_MS) {
                showToast('Please wait a few seconds before sending again.', 'error');
                return;
            }

            const companyField = contactForm.querySelector('#company');
            if (companyField && companyField.value.trim() !== '') {
                // Honeypot triggered: silently ignore
                showToast('Submission blocked.', 'error');
                return;
            }

            const nameInput = contactForm.querySelector('#name');
            const emailInput = contactForm.querySelector('#email');
            const messageInput = contactForm.querySelector('#message');

            const nameVal = nameInput.value.trim();
            const emailVal = emailInput.value.trim();
            const messageVal = messageInput.value.trim();

            // Basic validations
            const nameOk = /^[A-Za-zÀ-ÖØ-öø-ÿ'\- ]{2,60}$/.test(nameVal);
            const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailVal);
            const messageOk = messageVal.length >= 10 && messageVal.length <= 2000;

            if (!nameOk) {
                showToast('Please enter a valid name.', 'error');
                return;
            }
            if (!emailOk) {
                showToast('Please enter a valid email.', 'error');
                return;
            }
            if (!messageOk) {
                showToast('Message must be 10-2000 characters.', 'error');
                return;
            }
            if (containsUrl(messageVal)) {
                showToast('Please remove links from the message.', 'error');
                return;
            }
            // Optional: language-specific moderation can be added here if desired

            const buttonText = contactForm.querySelector('.button-text');
            const buttonLoader = contactForm.querySelector('.button-loader');
            buttonText.classList.add('hide');
            buttonLoader.classList.add('show');

            try {
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
                showToast('Message sent successfully!', 'success');
                contactForm.reset();
            } catch (error) {
                console.error('Error:', error);
                showToast('Failed to send message. Please try again.', 'error');
            } finally {
                buttonText.classList.remove('hide');
                buttonLoader.classList.remove('show');
            }
        });
    }

    // Scroll-reveal animations
    const revealElements = document.querySelectorAll('.reveal');
    const staggerContainers = document.querySelectorAll('.stagger');

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            } else {
                entry.target.classList.remove('in-view');
            }
        });
    }, { threshold: 0.2 });

    revealElements.forEach(el => io.observe(el));
    staggerContainers.forEach(container => {
        io.observe(container);
        const children = Array.from(container.children);
        children.forEach((child, index) => {
            child.style.transitionDelay = `${index * 90}ms`;
        });
    });
}); 