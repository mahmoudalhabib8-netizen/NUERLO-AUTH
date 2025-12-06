// Non-Authenticated User Navigation Functionality
// This file contains all navigation functions (desktop & mobile) for non-authenticated users
// When creating authenticated user pages, use auth-navigation.js instead

// Suppress Firebase COOP warnings (harmless but noisy)
(function() {
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalLog = console.log;
    
    const shouldFilter = function(message) {
        if (!message) return false;
        const msg = String(message);
        return msg.includes('Cross-Origin-Opener-Policy') || 
               msg.includes('window.closed call') ||
               msg.includes('popup.ts') ||
               msg.includes('init.json') ||
               msg.includes('firebase/init.json') ||
               (msg.includes('404') && msg.includes('firebaseapp.com')) ||
               (msg.includes('Failed to load resource') && msg.includes('init.json'));
    };
    
    console.warn = function(...args) {
        const message = args.join(' ');
        if (shouldFilter(message)) {
            return; // Silently ignore
        }
        originalWarn.apply(console, args);
    };
    
    console.error = function(...args) {
        const message = args.join(' ');
        if (shouldFilter(message)) {
            return; // Silently ignore
        }
        originalError.apply(console, args);
    };
    
    console.log = function(...args) {
        const message = args.join(' ');
        if (shouldFilter(message)) {
            return; // Silently ignore
        }
        originalLog.apply(console, args);
    };
    
    // Also filter network errors for init.json
    window.addEventListener('error', function(event) {
        const message = event.message || '';
        const filename = event.filename || '';
        if (shouldFilter(message) || shouldFilter(filename) || 
            (filename && filename.includes('init.json'))) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    }, true);
})();

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
  signInWithRedirect,
  getRedirectResult,
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

// Helper function to get dashboard URL with account ID
function getDashboardUrl(user) {
    if (user && user.uid) {
        const shortId = user.uid.substring(0, 6).toUpperCase();
        return `/acct_${shortId}/dashboard`;
    }
    return '/dashboard';
}

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
        // Always use popup on desktop to avoid redirect flow issues (404 errors)
        // Only use redirect on mobile devices where popup doesn't work well
        const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Use redirect on mobile - set flag so we know to check for redirect result
            sessionStorage.setItem('pendingRedirect', 'true');
            await signInWithRedirect(window.firebase.auth, googleProvider);
            return { success: true, redirect: true }; // Will redirect, so return early
        } else {
            // Use popup on desktop - this avoids the 404 error from redirect flow
            const result = await signInWithPopup(window.firebase.auth, googleProvider);
            if (!result || !result.user) {
                throw new Error('No user returned from authentication');
            }
            
            const user = result.user;
            
            // Create user document if it doesn't exist
            try {
                if (window.firebase && window.firebase.db) {
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
                }
            } catch (dbError) {
                // If database operation fails, still return success (user is authenticated)
                // Database errors shouldn't prevent login
                console.warn('Failed to create/update user document:', dbError);
            }
            
            return { success: true, user };
        }
    } catch (error) {
        // Check for specific error codes
        const errorCode = error.code || '';
        const errorMessage = error.message || '';
        
        // User cancelled - don't treat as error
        if (errorCode === 'auth/popup-closed-by-user' || 
            errorCode === 'auth/cancelled-popup-request' ||
            errorMessage.includes('cancelled')) {
            return { success: false, error: 'Sign-in cancelled', cancelled: true };
        }
        
        // If popup fails due to COOP or blocking, try redirect as fallback (only on desktop)
        if (errorCode === 'auth/popup-blocked' || 
            errorMessage.includes('Cross-Origin') ||
            (errorMessage.includes('popup') && !isMobile)) {
            try {
                await signInWithRedirect(window.firebase.auth, googleProvider);
                return { success: true, redirect: true };
            } catch (redirectError) {
                return { success: false, error: redirectError.message || 'Authentication failed. Please try again.' };
            }
        }
        
        // Return user-friendly error message
        let userMessage = errorMessage;
        if (errorCode === 'auth/account-exists-with-different-credential') {
            userMessage = 'An account already exists with this email. Please sign in with your original method.';
        } else if (errorCode === 'auth/operation-not-allowed') {
            userMessage = 'This sign-in method is not enabled. Please contact support.';
        } else if (errorCode === 'auth/popup-blocked') {
            userMessage = 'Popup was blocked. Please allow popups and try again.';
        }
        
        return { success: false, error: userMessage };
    }
}

async function signInWithGitHub() {
    try {
        // Use redirect on mobile to avoid COOP issues
        const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Use redirect on mobile
            await signInWithRedirect(window.firebase.auth, githubProvider);
            return { success: true, redirect: true }; // Will redirect, so return early
        } else {
            // Use popup on desktop
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
        }
    } catch (error) {
        // If popup fails, try redirect as fallback
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.message.includes('Cross-Origin')) {
            try {
                await signInWithRedirect(window.firebase.auth, githubProvider);
                return { success: true, redirect: true };
            } catch (redirectError) {
                return { success: false, error: redirectError.message };
            }
        }
        return { success: false, error: error.message };
    }
}

// Handle redirect result (when user returns from OAuth provider)
async function handleRedirectResult() {
    try {
        // Only check for redirect result if we're on a page that might have a redirect
        // This prevents unnecessary Firebase initialization that causes 404 errors
        const urlParams = new URLSearchParams(window.location.search);
        const hasAuthParams = urlParams.has('apiKey') || urlParams.has('mode') || 
                             window.location.hash.includes('access_token') ||
                             window.location.hash.includes('id_token');
        
        // If no auth-related params, skip redirect result check to avoid 404
        if (!hasAuthParams && !sessionStorage.getItem('pendingRedirect')) {
            return;
        }
        
        const result = await getRedirectResult(window.firebase.auth);
        if (result && result.user) {
            sessionStorage.removeItem('pendingRedirect');
            const user = result.user;
            
            // Get Firebase ID token and set cross-domain cookie
            try {
                const { getIdToken } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
                const token = await getIdToken(user);
                
                // Import and set the auth cookie
                const { setAuthCookie } = await import('./cookie-auth.js');
                setAuthCookie(token);
            } catch (cookieError) {
                console.error('Error setting auth cookie:', cookieError);
            }
            
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
            
            // Set flag to indicate this is a fresh login
            sessionStorage.setItem('freshLogin', 'true');
            
            // Redirect to dashboard with account ID
            const redirectUrl = getDashboardUrl(user);
            window.location.href = redirectUrl;
        }
    } catch (error) {
        sessionStorage.removeItem('pendingRedirect');
        
        // Ignore errors related to missing init.json (404) - these are harmless
        if (error.message?.includes('init.json') || 
            error.message?.includes('404') ||
            error.code === 'auth/operation-not-allowed') {
            return; // Silently ignore
        }
        
        // If there's an error, show it but don't block the page
        if (error.code === 'auth/account-exists-with-different-credential') {
            showAuthError('An account already exists with this email. Please sign in with your original method.');
        } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            // User cancelled - don't show error
            return;
        } else if (error.code && !error.code.includes('init.json')) {
            // Only log non-configuration errors that aren't about init.json
            console.error('Redirect auth error:', error);
        }
    }
}

// Handle form submissions
document.addEventListener('DOMContentLoaded', function() {
    // Check for redirect result first
    handleRedirectResult();
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
                // Get user from auth state
                const user = result.user || window.firebase?.auth?.currentUser;
                const redirectUrl = getDashboardUrl(user);
                
                // Show success message briefly before redirect
                showCustomNotification('success', 'Welcome!', 'Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = redirectUrl;
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
                // Get user from auth state if not in result
                const user = result.user || window.firebase?.auth?.currentUser;
                const redirectUrl = getDashboardUrl(user);
                
                // Show success message briefly before redirect
                showCustomNotification('success', 'Account Created!', 'Account created successfully! Redirecting...');
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1000);
            } else {
                showAuthError(result.error);
            }
        });
    }
    
    // Google sign in - handle both modal buttons and standalone login page button
    const googleBtn = document.getElementById('googleLoginBtn') || document.querySelector('.social-btn[href="#"]:first-of-type');
    if (googleBtn && !googleBtn.hasAttribute('data-listener-attached')) {
        googleBtn.setAttribute('data-listener-attached', 'true');
        
        googleBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Prevent multiple simultaneous clicks
            if (googleBtn.disabled || googleBtn.hasAttribute('data-auth-in-progress')) {
                return;
            }
            
            googleBtn.setAttribute('data-auth-in-progress', 'true');
            
            // Hide any error messages
            const errorMessage = document.getElementById('errorMessage');
            if (errorMessage) errorMessage.style.display = 'none';
            
            // Check "Remember me" checkbox for Google sign-in (if on login page)
            const rememberMeCheckbox = document.getElementById('rememberMe');
            let rememberMe = false;
            if (rememberMeCheckbox) {
                rememberMe = rememberMeCheckbox.checked;
                
                // Set persistence based on "Remember me" checkbox
                try {
                    const { setPersistence, browserLocalPersistence, browserSessionPersistence } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
                    if (rememberMe) {
                        await setPersistence(window.firebase.auth, browserLocalPersistence);
                        localStorage.setItem('nuerlo_remember_me', 'true');
                    } else {
                        await setPersistence(window.firebase.auth, browserSessionPersistence);
                        localStorage.removeItem('nuerlo_remember_me');
                    }
                } catch (persistenceError) {
                    console.error('Error setting persistence:', persistenceError);
                }
            }
            
            // Show loading state
            const originalText = googleBtn.textContent;
            googleBtn.textContent = 'Signing in with Google...';
            googleBtn.disabled = true;
            
            try {
                const result = await signInWithGoogle();
                
                // If redirect was used, don't reset button (page will redirect)
                if (result.redirect) {
                    return; // Page will redirect, don't do anything else
                }
                
                // Reset button state
                googleBtn.textContent = originalText;
                googleBtn.disabled = false;
                googleBtn.removeAttribute('data-auth-in-progress');
                
                if (result.success && result.user) {
                    const user = result.user;
                    
                    // Get Firebase ID token and set cross-domain cookie
                    try {
                        const { getIdToken } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
                        const token = await getIdToken(user);
                        
                        // Import and set the auth cookie
                        const { setAuthCookie } = await import('./cookie-auth.js');
                        setAuthCookie(token);
                    } catch (cookieError) {
                        console.error('Error setting auth cookie:', cookieError);
                    }
                    
                    // Set flag to indicate this is a fresh login
                    sessionStorage.setItem('freshLogin', 'true');
                    
                    closeAuthModal();
                    
                    // Wait a moment for auth state to fully update
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    // Double-check user is still authenticated
                    const currentUser = window.firebase?.auth?.currentUser || user;
                    const redirectUrl = getDashboardUrl(currentUser);
                    
                    // Redirect immediately (no notification delay on standalone login page)
                    window.location.href = redirectUrl;
                } else if (result.cancelled) {
                    // User cancelled - don't show error, button already reset
                } else {
                    showAuthError(result.error || 'Authentication failed. Please try again.');
                }
            } catch (err) {
                // Reset button on any error
                googleBtn.textContent = originalText;
                googleBtn.disabled = false;
                googleBtn.removeAttribute('data-auth-in-progress');
                
                // Only show error if it's not a cancellation
                if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
                    showAuthError(err.message || 'An error occurred during sign-in. Please try again.');
                }
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
            
            // If redirect was used, don't reset button (page will redirect)
            if (result.redirect) {
                return; // Page will redirect, don't do anything else
            }
            
            // Reset button state
            githubBtn.textContent = originalText;
            githubBtn.disabled = false;
            
            if (result.success) {
                closeAuthModal();
                // Get user from auth state if not in result
                const user = result.user || window.firebase?.auth?.currentUser;
                const redirectUrl = getDashboardUrl(user);
                
                // Show success message briefly before redirect
                showCustomNotification('success', 'Welcome!', 'Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = redirectUrl;
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
                    const redirectUrl = getDashboardUrl(user);
                    window.location.href = redirectUrl;
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
    // Convert Error objects to strings
    if (message instanceof Error) {
        message = message.message || message.toString();
    }
    
    // Convert to string if not already
    const messageStr = String(message || '');
    const lowerMessage = messageStr.toLowerCase();
    
    // Handle specific Firebase errors that shouldn't be shown to users
    // User cancelled popup - don't show error
    if (lowerMessage.includes('cancelled-popup-request') || 
        lowerMessage.includes('cancelled')) {
        return; // Silently ignore cancelled popups
    }
    
    // Operation not allowed - silently ignore (this is a configuration issue)
    // Check multiple variations and formats
    if (lowerMessage.includes('operation-not-allowed') || 
        lowerMessage.includes('operation not allowed') ||
        lowerMessage.includes('sign-in method is not enabled') ||
        lowerMessage.includes('sign in method is not enabled') ||
        lowerMessage.includes('sign-in method not enabled') ||
        lowerMessage.includes('auth/operation-not-allowed') ||
        messageStr.includes('auth/operation-not-allowed')) {
        // Silently ignore - this is a Firebase configuration issue
        // Don't show to users, don't log to console
        return;
    }
    
    // Use the string version for the rest of the function
    message = messageStr;
    
    // If message is empty, don't show anything
    if (!message || message.trim() === '') {
        return;
    }
    
    // Extract user-friendly message from Firebase error format
    if (message.includes('Firebase: Error')) {
        const match = message.match(/Firebase: Error \((.+?)\)/);
        if (match) {
            const errorCode = match[1];
            // Map common error codes to user-friendly messages
            const errorMessages = {
                'auth/user-not-found': 'No account found with this email.',
                'auth/wrong-password': 'Incorrect password. Please try again.',
                'auth/email-already-in-use': 'This email is already registered.',
                'auth/weak-password': 'Password is too weak. Please use a stronger password.',
                'auth/invalid-email': 'Please enter a valid email address.',
                'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
                'auth/network-request-failed': 'Network error. Please check your connection and try again.'
            };
            
            if (errorMessages[errorCode]) {
                message = errorMessages[errorCode];
            } else {
                // Generic fallback - remove Firebase error prefix
                message = message.replace(/Firebase: Error \([^)]+\)\.?\s*/i, '');
            }
        }
    }
    
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
    
    // Insert error message - check if elements exist first
    const authModal = document.querySelector('.auth-modal-content');
    const authTabs = document.querySelector('.auth-tabs');
    
    if (authModal && authTabs) {
        // Insert before auth tabs if modal exists
        authModal.insertBefore(errorDiv, authTabs);
    } else if (authModal) {
        // If modal exists but no tabs, append to modal
        authModal.insertBefore(errorDiv, authModal.firstChild);
    } else {
        // If no modal, try to find a form or container to show error
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const targetForm = loginForm || signupForm;
        
        if (targetForm) {
            targetForm.insertBefore(errorDiv, targetForm.firstChild);
        } else {
            // Fallback: show as notification if no form found
            // Only log non-cancelled errors, and only if message is not empty
            if (message && message.trim() !== '' &&
                !message.includes('cancelled-popup-request') && 
                !message.includes('operation-not-allowed') &&
                !message.includes('sign-in method is not enabled') &&
                !message.includes('currently unavailable')) {
                console.error('Auth error:', message);
                if (typeof showCustomNotification === 'function') {
                    showCustomNotification('error', 'Authentication Error', message);
                } else {
                    alert('Authentication Error: ' + message);
                }
            }
            return;
        }
    }
    
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

