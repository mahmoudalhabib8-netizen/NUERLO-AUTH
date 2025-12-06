// Shared Navigation Functionality for Non-Auth Users
// This file contains all navigation functions (desktop & mobile) that are shared across pages

// Suppress Firebase init.json 404 errors BEFORE any Firebase code runs
(function() {
    // Suppress network requests for Firebase init.json (harmless 404)
    if (!window._firebaseFetchSuppressed) {
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const url = args[0];
            if (typeof url === 'string' && (url.includes('init.json') || url.includes('firebaseapp.com/__/firebase'))) {
                // Return a rejected promise that we'll catch silently
                return Promise.reject(new Error('Suppressed Firebase init.json request'));
            }
            return originalFetch.apply(this, args);
        };
        window._firebaseFetchSuppressed = true;
    }
})();

function toggleMenu(element) {
    element.classList.toggle('active');
    const mobileMenu = document.getElementById('mobileMenuOverlay');
    if (mobileMenu) {
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    }
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(e) {
    const mobileMenu = document.getElementById('mobileMenuOverlay');
    const hamburger = document.querySelector('.hamburger');
    
    if (mobileMenu && mobileMenu.classList.contains('active')) {
        if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
            mobileMenu.classList.remove('active');
            hamburger.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
});

// Close mobile menu when pressing escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const mobileMenu = document.getElementById('mobileMenuOverlay');
        const hamburger = document.querySelector('.hamburger');
        
        if (mobileMenu && mobileMenu.classList.contains('active')) {
            mobileMenu.classList.remove('active');
            hamburger.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
});

// Theme toggle functionality
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const themeText = document.querySelector('.mobile-theme-text');
    if (themeText) {
        themeText.textContent = document.body.classList.contains('light-mode') ? 'Light Mode' : 'Dark Mode';
    }
    
    // Change logo based on theme
    const logo = document.querySelector('.nav-logo img');
    if (logo) {
        if (document.body.classList.contains('light-mode')) {
            logo.src = 'assets/images/LOGO.png';
        } else {
            logo.src = 'assets/images/LOGOWHITE.png';
        }
    }
    
    // Save theme preference
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

// Load saved theme
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        const themeText = document.querySelector('.mobile-theme-text');
        if (themeText) {
            themeText.textContent = 'Light Mode';
        }
        
        // Change logo to light version
        const logo = document.querySelector('.nav-logo img');
        if (logo) {
            logo.src = 'assets/images/LOGO.png';
        }
    }
}

// Auth Modal Functions
function openAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function switchAuthTab(tab) {
    // Remove active class from all tabs and forms
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    // Add active class to selected tab and form
    if (tab === 'login') {
        document.querySelector('.auth-tab:first-child').classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.querySelector('.auth-tab:last-child').classList.add('active');
        document.getElementById('signupForm').classList.add('active');
    }
}

// FAQ functionality (for pages that have it)
function toggleFAQ(element) {
    const faqItem = element.parentElement;
    const answer = faqItem.querySelector('.faq-answer');
    const icon = element.querySelector('.faq-icon');
    
    // Close all other FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        if (item !== faqItem) {
            item.classList.remove('active');
            item.querySelector('.faq-answer').style.maxHeight = null;
            item.querySelector('.faq-icon').textContent = '+';
        }
    });
    
    // Toggle current FAQ item
    faqItem.classList.toggle('active');
    
    if (faqItem.classList.contains('active')) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
        icon.textContent = '−';
    } else {
        answer.style.maxHeight = null;
        icon.textContent = '+';
    }
}

// Lazy Load Fade-in Effect
function initFadeIn() {
    const elements = document.querySelectorAll('.fade-in');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(element => {
        observer.observe(element);
    });
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    initFadeIn();
    loadTheme();
    
    // Add event listeners for mobile menu
    const themeToggle = document.querySelector('.mobile-theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Close mobile menu when clicking on menu links
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link[href]');
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', function() {
            const mobileMenu = document.getElementById('mobileMenuOverlay');
            const hamburger = document.querySelector('.hamburger');
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
                hamburger.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
});
