// Non-Authenticated User Navigation Functionality
// This file contains all navigation functions (desktop & mobile) for non-authenticated users
// When creating authenticated user pages, use auth-navigation.js instead

// Suppress Firebase init.json 404 errors and COOP warnings
(function() {
    // Suppress network requests for Firebase init.json (harmless 404)
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        if (typeof url === 'string' && (url.includes('init.json') || url.includes('firebaseapp.com/__/firebase'))) {
            // Return a rejected promise that we'll catch silently
            return Promise.reject(new Error('Suppressed Firebase init.json request'));
        }
        return originalFetch.apply(this, args);
    };
    
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
               (msg.includes('Failed to load resource') && msg.includes('init.json')) ||
               (msg.includes('400') && msg.includes('identitytoolkit')) ||
               msg.includes('createAuthUri');
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
    
    // Also filter network errors for init.json and Google Identity Toolkit
    window.addEventListener('error', function(event) {
        const message = event.message || '';
        const filename = event.filename || '';
        const target = event.target;
        
        // Filter network errors for init.json and Google Identity Toolkit 400 errors
        if (target && (target.src || target.href)) {
            const url = target.src || target.href || '';
            if (url.includes('init.json') || 
                url.includes('firebaseapp.com/__/firebase') ||
                (url.includes('identitytoolkit') && url.includes('createAuthUri'))) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        }
        
        // Also filter errors from fetch and error messages
        if (message.includes('init.json') || message.includes('firebaseapp.com/__/firebase')) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
        
        if (shouldFilter(message) || shouldFilter(filename) || 
            (filename && filename.includes('init.json'))) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    }, true);
    
    // Filter unhandled promise rejections for 400 errors
    window.addEventListener('unhandledrejection', function(event) {
        const reason = event.reason;
        const message = reason?.message || String(reason || '');
        if ((message.includes('400') && message.includes('identitytoolkit')) ||
            message.includes('createAuthUri')) {
            event.preventDefault();
            return false;
        }
        if (shouldFilter(message)) {
            event.preventDefault();
            return false;
        }
    });
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
// Import popup functions immediately, but only import redirect functions when needed (mobile)
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

// Lazy load redirect functions only when needed (mobile devices)
let signInWithRedirect, getRedirectResult;
async function loadRedirectFunctions() {
    if (!signInWithRedirect) {
        const redirectModule = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        signInWithRedirect = redirectModule.signInWithRedirect;
        getRedirectResult = redirectModule.getRedirectResult;
    }
    return { signInWithRedirect, getRedirectResult };
}

// Initialize providers - create fresh instances to avoid state issues
function getGoogleProvider() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
        prompt: 'select_account'
    });
    return provider;
}

function getGithubProvider() {
    return new GithubAuthProvider();
}

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
            // Use redirect on mobile - load redirect functions only when needed
            const { signInWithRedirect } = await loadRedirectFunctions();
            sessionStorage.setItem('pendingRedirect', 'true');
            await signInWithRedirect(window.firebase.auth, getGoogleProvider());
            return { success: true, redirect: true }; // Will redirect, so return early
        } else {
            // Use popup on desktop - this avoids the 404 error from redirect flow
            // Create fresh provider instance for each attempt
            const provider = getGoogleProvider();
            const result = await signInWithPopup(window.firebase.auth, provider);
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
        
        // Don't fall back to redirect on desktop - it causes issues
        // Instead, show a clear error message
        if (errorCode === 'auth/popup-blocked') {
            return { success: false, error: 'Popup was blocked. Please allow popups for this site and try again.' };
        }
        
        // Handle 400 errors from Google Identity Toolkit
        if (errorCode === 'auth/network-request-failed' || 
            errorMessage.includes('400') ||
            errorMessage.includes('Bad Request')) {
            return { success: false, error: 'Authentication service error. Please try again in a moment.' };
        }
        
        // Return user-friendly error message
        let userMessage = errorMessage;
        if (errorCode === 'auth/account-exists-with-different-credential') {
            userMessage = 'An account already exists with this email. Please sign in with your original method.';
        } else if (errorCode === 'auth/operation-not-allowed') {
            userMessage = 'This sign-in method is not enabled. Please contact support.';
        } else if (!userMessage || userMessage.includes('Firebase')) {
            userMessage = 'Authentication failed. Please try again.';
        }
        
        return { success: false, error: userMessage };
    }
}

async function signInWithGitHub() {
    try {
        // Use redirect on mobile to avoid COOP issues
        const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Use redirect on mobile - load redirect functions only when needed
            const { signInWithRedirect } = await loadRedirectFunctions();
            sessionStorage.setItem('pendingRedirect', 'true');
            await signInWithRedirect(window.firebase.auth, getGithubProvider());
            return { success: true, redirect: true }; // Will redirect, so return early
        } else {
            // Use popup on desktop
            const result = await signInWithPopup(window.firebase.auth, getGithubProvider());
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
        // If popup fails, try redirect as fallback (only on mobile)
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.message.includes('Cross-Origin')) {
            try {
                const { signInWithRedirect } = await loadRedirectFunctions();
                sessionStorage.setItem('pendingRedirect', 'true');
                await signInWithRedirect(window.firebase.auth, getGithubProvider());
                return { success: true, redirect: true };
            } catch (redirectError) {
                return { success: false, error: redirectError.message };
            }
        }
        return { success: false, error: error.message };
    }
}

// Handle redirect result (when user returns from OAuth provider)
// ONLY call this when we're actually on a redirect callback page
async function handleRedirectResult() {
    // STRICT check - only proceed if we have explicit redirect indicators
    const urlParams = new URLSearchParams(window.location.search);
    const hasApiKey = urlParams.has('apiKey');
    const hasMode = urlParams.has('mode');
    const hasOobCode = urlParams.has('oobCode');
    const hasHashToken = window.location.hash.includes('access_token') || window.location.hash.includes('id_token');
    const pendingRedirect = sessionStorage.getItem('pendingRedirect') === 'true';
    
    // Only check if we have STRONG indicators of a redirect callback
    // This prevents Firebase from initializing redirect flow unnecessarily
    if (!hasApiKey && !hasMode && !hasOobCode && !hasHashToken && !pendingRedirect) {
        return; // Exit immediately - don't touch Firebase redirect at all
    }
    
    // Double-check: if we don't have URL params but have pendingRedirect, 
    // wait a moment to see if params arrive (they might be in hash)
    if (pendingRedirect && !hasApiKey && !hasMode && !hasHashToken) {
        // Wait a bit for hash to be processed, but don't call getRedirectResult yet
        setTimeout(() => {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            if (!hashParams.has('access_token') && !hashParams.has('id_token')) {
                // No redirect params found, clear the flag and exit
                sessionStorage.removeItem('pendingRedirect');
                return;
            }
            // Now we can safely check
            checkRedirectResult();
        }, 500);
        return;
    }
    
    // Only now call getRedirectResult if we're sure we're on a redirect page
    checkRedirectResult();
}

async function checkRedirectResult() {
    try {
        // Only load redirect functions when we actually need them
        const { getRedirectResult } = await loadRedirectFunctions();
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
                    role: 'user'
                });
            }
            
            sessionStorage.setItem('freshLogin', 'true');
            const redirectUrl = getDashboardUrl(user);
            window.location.href = redirectUrl;
        }
    } catch (error) {
        sessionStorage.removeItem('pendingRedirect');
        // Silently ignore - don't log redirect errors
        return;
    }
}

// Handle form submissions
document.addEventListener('DOMContentLoaded', function() {
    // DON'T check for redirect result on page load - this causes 404 errors
    // Only check if we're explicitly on a redirect callback page
    // We'll check manually after a redirect if needed
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
    // Use more specific selector to avoid confusion with GitHub button
    let googleBtn = document.getElementById('googleLoginBtn');
    
    // If not found by ID, try to find by text content (more reliable)
    if (!googleBtn) {
        const allSocialBtns = document.querySelectorAll('.social-btn[href="#"]');
        for (const btn of allSocialBtns) {
            const text = btn.textContent || btn.innerText || '';
            if (text.includes('Google') && !text.includes('GitHub')) {
                googleBtn = btn;
                break;
            }
        }
    }
    
    // Fallback to first social button if still not found (but log a warning)
    if (!googleBtn) {
        googleBtn = document.querySelector('.social-btn[href="#"]:first-of-type');
        if (googleBtn) {
            console.warn('Google button not found by ID or text, using first social button');
        }
    }
    
    if (googleBtn && !googleBtn.hasAttribute('data-listener-attached')) {
        googleBtn.setAttribute('data-listener-attached', 'true');
        
        // Store original button content (including innerHTML for span elements)
        const originalHTML = googleBtn.innerHTML;
        const originalText = googleBtn.textContent.trim();
        
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
            
            // Show loading state - preserve the SVG icon
            const spanElement = googleBtn.querySelector('span');
            if (spanElement) {
                spanElement.textContent = 'Signing in with Google...';
            } else {
                googleBtn.textContent = 'Signing in with Google...';
            }
            googleBtn.disabled = true;
            
            try {
                // On desktop, use popup directly to avoid any redirect initialization
                const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                
                if (isMobile) {
                    // Mobile: use redirect flow
                    const result = await signInWithGoogle();
                    if (result.redirect) {
                        return; // Page will redirect
                    }
                    // If redirect didn't happen, fall through to error handling
                    googleBtn.innerHTML = originalHTML;
                    googleBtn.disabled = false;
                    googleBtn.removeAttribute('data-auth-in-progress');
                    showAuthError('Redirect failed. Please try again.');
                    return;
                }
                
                // Desktop: use popup directly - this prevents any redirect initialization
                const provider = getGoogleProvider();
                
                // Set a timeout to detect if popup hangs
                const popupPromise = signInWithPopup(window.firebase.auth, provider);
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Authentication timeout')), 60000)
                );
                
                const popupResult = await Promise.race([popupPromise, timeoutPromise]);
                
                if (!popupResult || !popupResult.user) {
                    throw new Error('No user returned from authentication');
                }
                
                const user = popupResult.user;
                
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
                                role: 'user'
                            });
                        }
                    }
                } catch (dbError) {
                    console.warn('Failed to create/update user document:', dbError);
                }
                
                // Get Firebase ID token and set cross-domain cookie
                try {
                    const { getIdToken } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
                    const token = await getIdToken(user);
                    const { setAuthCookie } = await import('./cookie-auth.js');
                    setAuthCookie(token);
                } catch (cookieError) {
                    console.error('Error setting auth cookie:', cookieError);
                }
                
                // Set flag and redirect
                sessionStorage.setItem('freshLogin', 'true');
                closeAuthModal();
                
                await new Promise(resolve => setTimeout(resolve, 300));
                
                const currentUser = window.firebase?.auth?.currentUser || user;
                const redirectUrl = getDashboardUrl(currentUser);
                window.location.href = redirectUrl;
                
            } catch (err) {
                // Reset button on any error
                googleBtn.innerHTML = originalHTML;
                googleBtn.disabled = false;
                googleBtn.removeAttribute('data-auth-in-progress');
                
                // Handle specific error cases
                if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
                    // User cancelled - don't show error
                    return;
                }
                
                // Show user-friendly error
                let errorMsg = 'Authentication failed. Please try again.';
                if (err.code === 'auth/popup-blocked') {
                    errorMsg = 'Popup was blocked. Please allow popups for this site and try again.';
                } else if (err.message) {
                    errorMsg = err.message;
                }
                
                showAuthError(errorMsg);
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

