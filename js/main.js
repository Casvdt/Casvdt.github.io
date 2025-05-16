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

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
                // Close mobile menu if open
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

    // Form submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const buttonText = contactForm.querySelector('.button-text');
            const buttonLoader = contactForm.querySelector('.button-loader');
            
            // Show loading state
            buttonText.classList.add('hide');
            buttonLoader.classList.add('show');

            try {
                const templateParams = {
                    to_email: 'casvandertoorn1@gmail.com',
                    from_name: contactForm.from_name.value,
                    from_email: contactForm.from_email.value,
                    message: contactForm.message.value
                };

                await emailjs.send(
                    'service_xsfgcac',
                    'template_tj3pqzf',
                    templateParams
                );

                showToast('Message sent successfully!', 'success');
                contactForm.reset();
            } catch (error) {
                console.error('Error:', error);
                showToast('Failed to send message. Please try again.', 'error');
            } finally {
                // Hide loading state
                buttonText.classList.remove('hide');
                buttonLoader.classList.remove('show');
            }
        });
    }
}); 