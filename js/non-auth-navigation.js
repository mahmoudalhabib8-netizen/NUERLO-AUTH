// Non-Authenticated User Navigation Functionality
// This file contains all navigation functions (desktop & mobile) for non-authenticated users
// When creating authenticated user pages, use auth-navigation.js instead

// Custom Notification System for Non-Auth Pages
function showCustomNotification(type, title, message, duration = 5000) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('customNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'customNotification';
        notification.className = 'custom-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22,4 12,14.01 9,11.01"></polyline>
                    </svg>
                </div>
                <div class="notification-text">
                    <div class="notification-title"></div>
                    <div class="notification-message"></div>
                </div>
                <button class="notification-close" onclick="hideCustomNotification()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Add CSS if not already added
        if (!document.getElementById('customNotificationCSS')) {
            const style = document.createElement('style');
            style.id = 'customNotificationCSS';
            style.textContent = `
                .custom-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    transform: translateX(400px);
                    transition: transform 0.3s ease;
                }
                .custom-notification.show {
                    transform: translateX(0);
                }
                .notification-content {
                    background: linear-gradient(145deg, #2c2c2c, #252525);
                    border: 1px solid #3a3a3a;
                    border-radius: 12px;
                    padding: 16px;
                    min-width: 320px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .notification-icon {
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(135deg, #7c3aed, #a855f7);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    flex-shrink: 0;
                }
                .notification-text {
                    flex: 1;
                }
                .notification-title {
                    color: #ffffff;
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                .notification-message {
                    color: #cccccc;
                    font-size: 13px;
                    line-height: 1.4;
                }
                .notification-close {
                    background: transparent;
                    border: none;
                    color: #888888;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                }
                .notification-close:hover {
                    background: #3a3a3a;
                    color: #ffffff;
                }
                .custom-notification.success .notification-icon {
                    background: linear-gradient(135deg, #10b981, #059669);
                }
                .custom-notification.error .notification-icon {
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                }
                .custom-notification.warning .notification-icon {
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                }
                .custom-notification.info .notification-icon {
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    const titleEl = notification.querySelector('.notification-title');
    const messageEl = notification.querySelector('.notification-message');
    
    // Set content
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    // Set type and icon
    notification.className = `custom-notification ${type}`;
    
    // Show notification
    notification.classList.add('show');
    
    // Auto hide after duration
    setTimeout(() => {
        hideCustomNotification();
    }, duration);
}

function hideCustomNotification() {
    const notification = document.getElementById('customNotification');
    if (notification) {
        notification.classList.remove('show');
    }
}

// Override browser alerts
window.alert = function(message) {
    showCustomNotification('info', 'Alert', message);
};

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

function openSignupModal() {
    const modal = document.getElementById('authModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Switch to signup tab
    switchAuthTab('signup');
}

// Make functions available globally
window.openAuthModal = openAuthModal;
window.openSignupModal = openSignupModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthTab = switchAuthTab;
window.toggleMenu = toggleMenu;
window.toggleTheme = toggleTheme;
window.toggleFAQ = toggleFAQ;

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Clear any error messages
    const existingError = document.querySelector('.auth-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Reset forms
    document.getElementById('loginForm').reset();
    document.getElementById('signupForm').reset();
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
    
    // Clear any error messages when switching tabs
    const existingError = document.querySelector('.auth-error');
    if (existingError) {
        existingError.remove();
    }
}

// Firebase Auth Integration
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Initialize providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Authentication functions
async function signUp(email, password, fullName) {
    try {
        const userCredential = await createUserWithEmailAndPassword(window.firebase.auth, email, password);
        const user = userCredential.user;
        
        // Update user profile with display name
        await updateProfile(user, {
            displayName: fullName
        });
        
        // Create user document in Firestore
        await setDoc(doc(window.firebase.db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: fullName,
            createdAt: new Date(),
            enrolledCourses: [],
            progress: {},
            role: 'user' // Default role for all new users
        });
        
        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function signIn(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(window.firebase.auth, email, password);
        const user = userCredential.user;
        
        // Create user document if it doesn't exist
        const userDoc = await getDoc(doc(window.firebase.db, 'users', user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(window.firebase.db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'User',
                photoURL: user.photoURL || null,
                createdAt: new Date(),
                enrolledCourses: [],
                progress: {},
                role: 'user' // Default role for all new users
            });
        }
        
        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(window.firebase.auth, googleProvider);
        const user = result.user;
        
        // Create user document if it doesn't exist
        const userDoc = await getDoc(doc(window.firebase.db, 'users', user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(window.firebase.db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                createdAt: new Date(),
                enrolledCourses: [],
                progress: {},
                role: 'user' // Default role for all new users
            });
        }
        
        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function signInWithGitHub() {
    try {
        const result = await signInWithPopup(window.firebase.auth, githubProvider);
        const user = result.user;
        
        // Create user document if it doesn't exist
        const userDoc = await getDoc(doc(window.firebase.db, 'users', user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(window.firebase.db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                createdAt: new Date(),
                enrolledCourses: [],
                progress: {},
                role: 'user' // Default role for all new users
            });
        }
        
        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Handle form submissions
document.addEventListener('DOMContentLoaded', function() {
    // Add click outside to close modal functionality
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.addEventListener('click', function(e) {
            // Close modal if clicking on the overlay (not the content)
            if (e.target === authModal) {
                closeAuthModal();
            }
        });
    }
    
    // Add escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('authModal');
            if (modal && modal.classList.contains('active')) {
                closeAuthModal();
            }
        }
    });
    
    // Add tab switching functionality
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchAuthTab(tabName);
        });
    });
    
    // Add close button functionality
    const authModalClose = document.getElementById('authModalClose');
    if (authModalClose) {
        authModalClose.addEventListener('click', closeAuthModal);
    }
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            // Show loading state
            const submitBtn = loginForm.querySelector('.auth-submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Signing in...';
            submitBtn.disabled = true;
            
            const result = await signIn(email, password);
            
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            if (result.success) {
                closeAuthModal();
                // Show success message briefly before redirect
                showCustomNotification('success', 'Welcome!', 'Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            } else {
                showAuthError(result.error);
            }
        });
    }
    
    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            
            // Show loading state
            const submitBtn = signupForm.querySelector('.auth-submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating account...';
            submitBtn.disabled = true;
            
            const result = await signUp(email, password, name);
            
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            if (result.success) {
                closeAuthModal();
                // Show success message briefly before redirect
                showCustomNotification('success', 'Account Created!', 'Account created successfully! Redirecting...');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            } else {
                showAuthError(result.error);
            }
        });
    }
    
    // Google sign in
    const googleBtn = document.querySelector('.social-btn[href="#"]:first-of-type');
    if (googleBtn) {
        googleBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Show loading state
            const originalText = googleBtn.textContent;
            googleBtn.textContent = 'Signing in with Google...';
            googleBtn.disabled = true;
            
            const result = await signInWithGoogle();
            
            // Reset button state
            googleBtn.textContent = originalText;
            googleBtn.disabled = false;
            
            if (result.success) {
                closeAuthModal();
                // Show success message briefly before redirect
                showCustomNotification('success', 'Welcome!', 'Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            } else {
                showAuthError(result.error);
            }
        });
    }
    
    // GitHub sign in
    const githubBtn = document.querySelector('.social-btn[href="#"]:last-of-type');
    if (githubBtn) {
        githubBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Show loading state
            const originalText = githubBtn.textContent;
            githubBtn.textContent = 'Signing in with GitHub...';
            githubBtn.disabled = true;
            
            const result = await signInWithGitHub();
            
            // Reset button state
            githubBtn.textContent = originalText;
            githubBtn.disabled = false;
            
            if (result.success) {
                closeAuthModal();
                // Show success message briefly before redirect
                showCustomNotification('success', 'Welcome!', 'Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            } else {
                showAuthError(result.error);
            }
        });
    }
    
    // Listen for auth state changes
    // BUT: Only if we're on login/register pages - don't interfere with dashboard
    const currentPath = window.location.pathname;
    const isOnLoginPage = currentPath === '/login' || currentPath === '/login/' || currentPath === '/register' || currentPath === '/register/';
    const validSections = ['overview', 'programs', 'progress', 'resources', 'marketplace', 
                          'tasks', 'community', 'profile', 'settings', 'payment', 'help'];
    const directSectionMatch = currentPath.match(/^\/([^\/]+)$/);
    const isSectionUrl = directSectionMatch && validSections.includes(directSectionMatch[1]) && directSectionMatch[1] !== 'overview';
    const isAccountSectionUrl = currentPath.match(/^\/acct_[^\/]+\/([^\/]+)$/) && 
                               (() => {
                                   const match = currentPath.match(/^\/acct_[^\/]+\/([^\/]+)$/);
                                   return match && validSections.includes(match[1]) && match[1] !== 'overview';
                               })();
    const isOnDashboard = currentPath.includes('/dashboard') || 
                         currentPath.match(/^\/acct_[^\/]+\/dashboard/) ||
                         isSectionUrl ||
                         isAccountSectionUrl;
    
    // CRITICAL: Don't set up auth listeners on dashboard pages
    // These pages handle their own auth checks
    if (isOnDashboard) {
        console.log('non-auth-navigation: Skipping auth listener setup on protected page:', currentPath);
        return;
    }
    
    if (isOnLoginPage && window.firebase && window.firebase.auth) {
        onAuthStateChanged(window.firebase.auth, (user) => {
            if (user) {
                // If user is already authenticated on login page, redirect to dashboard
                // This handles cases where user refreshes the login page while logged in
                const currentPath = window.location.pathname;
                const isOnLoginPage = currentPath === '/login' || currentPath === '/login/' || currentPath === '/register' || currentPath === '/register/';
                
                // Only redirect if still on login/register page
                if (isOnLoginPage) {
                    window.location.href = '/dashboard';
                }
                updateAuthUI();
            } else {
                updateAuthUI();
            }
        });
    } else {
        // Not on login page - just update UI without redirects
        if (window.firebase && window.firebase.auth) {
            onAuthStateChanged(window.firebase.auth, (user) => {
                updateAuthUI();
            });
        }
    }
});

// Update UI based on auth state
function updateAuthUI() {
    const user = window.firebase.auth.currentUser;
    
    // Keep original button behavior - don't change text or functionality
    // Authentication state is tracked but UI remains the same
    console.log('User authentication state:', user ? 'logged in' : 'logged out');
}

// Show authentication errors
function showAuthError(message) {
    // Remove existing error messages
    const existingError = document.querySelector('.auth-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'auth-error';
    errorDiv.style.cssText = `
        background: #fee2e2;
        color: #dc2626;
        padding: 12px;
        border-radius: 8px;
        margin: 16px 0;
        text-align: center;
        font-size: 14px;
        border: 1px solid #fecaca;
    `;
    errorDiv.textContent = message;
    
    // Insert error message
    const authModal = document.querySelector('.auth-modal-content');
    const authTabs = document.querySelector('.auth-tabs');
    authModal.insertBefore(errorDiv, authTabs);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

// Show success messages
function showSuccessMessage(message) {
    // Remove existing messages
    const existingError = document.querySelector('.auth-error');
    const existingSuccess = document.querySelector('.auth-success');
    if (existingError) existingError.remove();
    if (existingSuccess) existingSuccess.remove();
    
    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className = 'auth-success';
    successDiv.style.cssText = `
        background: #d1fae5;
        color: #059669;
        padding: 12px;
        border-radius: 8px;
        margin: 16px 0;
        text-align: center;
        font-size: 14px;
        border: 1px solid #a7f3d0;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10001;
        min-width: 300px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    `;
    successDiv.textContent = message;
    
    // Insert success message
    document.body.appendChild(successDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
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
