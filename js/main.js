// Main JavaScript for Framework Real Estate Solutions Website

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Property inquiry buttons
document.querySelectorAll('.property-inquire').forEach(button => {
    button.addEventListener('click', function() {
        const propertyAddress = this.getAttribute('data-property');
        const message = `Hi, I'm interested in the property at ${propertyAddress}. Please provide more information.`;
        const whatsappUrl = `https://wa.me/1313XXXXXXX?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    });
});

// Contact form handling
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            message: formData.get('message')
        };
        
        // In a real implementation, this would send to a server
        // For now, we'll create a mailto link
        const subject = 'New Inquiry from Framework Real Estate Website';
        const body = `Name: ${data.name}%0D%0AEmail: ${data.email}%0D%0APhone: ${data.phone || 'Not provided'}%0D%0A%0D%0AMessage:%0D%0A${data.message}`;
        const mailtoLink = `mailto:info@frameworkdetroit.com?subject=${encodeURIComponent(subject)}&body=${body}`;
        
        // Open email client
        window.location.href = mailtoLink;
        
        // Show success message (in production, this would be after actual submission)
        alert('Thank you for your message! We will get back to you soon.');
        contactForm.reset();
    });
}

// Privacy Policy and Fair Housing links
document.getElementById('privacyLink')?.addEventListener('click', function(e) {
    e.preventDefault();
    alert('Privacy Policy page would be displayed here. This would typically link to a separate page with full privacy policy details.');
});

document.getElementById('fairHousingLink')?.addEventListener('click', function(e) {
    e.preventDefault();
    alert('Fair Housing information would be displayed here. This would typically link to a page explaining Fair Housing Act compliance and equal opportunity housing policies.');
});

// Add loading state for images
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('.property-image');
    
    images.forEach(img => {
        // Add loading class
        img.classList.add('loading');
        
        // Remove loading class when image loads
        img.addEventListener('load', function() {
            this.classList.remove('loading');
        });
        
        // Handle error state
        img.addEventListener('error', function() {
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5OTkiPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPg==';
            this.alt = 'Property image not available';
        });
    });
});

// Accessibility: Handle keyboard navigation for buttons
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.click();
        }
    });
});

// Performance: Lazy load images when they come into view
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    });
    
    // Apply to all images with data-src attribute
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Mobile menu toggle (if needed in future)
function setupMobileMenu() {
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const navigation = document.querySelector('.navigation');
    
    if (mobileMenuButton && navigation) {
        mobileMenuButton.addEventListener('click', function() {
            navigation.classList.toggle('active');
            this.setAttribute('aria-expanded', 
                this.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'
            );
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('Framework Real Estate Solutions website loaded');
    setupMobileMenu();
});