// Client-side routing for dynamic account URLs
// Handles /acct_{account_id}/dashboard routes similar to Stripe's dashboard
// In local development, uses simple routes (/dashboard) without account ID

// Check if we're in local development
const isLocalDev = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname === '0.0.0.0' ||
                   window.location.hostname === '';

// Helper functions for shortened user ID in URLs
// URLs show shortened version (first 6 chars) but we always use full UID for Firebase operations
function getShortUserId(fullUid) {
    if (!fullUid || typeof fullUid !== 'string') return null;
    return fullUid.substring(0, 6).toUpperCase();
}

function matchesShortUserId(fullUid, shortId) {
    if (!fullUid || !shortId) return false;
    return getShortUserId(fullUid) === shortId.toUpperCase();
}

class DashboardRouter {
    constructor() {
        this.currentAccountId = null;
        this.authUnsubscribe = null;
        this.init();
    }

    init() {
        // Wait for Firebase to be ready
        this.checkFirebaseAndInit();
    }

    async checkFirebaseAndInit() {
        if (window.firebase && window.firebase.auth) {
            await this.setupRouting();
        } else {
            setTimeout(() => this.checkFirebaseAndInit(), 100);
        }
    }

    async setupRouting() {
        const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const auth = getAuth();

        // Listen for auth state changes
        this.authUnsubscribe = onAuthStateChanged(auth, async (user) => {
            await this.handleAuthStateChange(user);
        });

        // Handle initial route check
        this.checkCurrentRoute();
    }

    async handleAuthStateChange(user) {
        if (user) {
            this.currentAccountId = user.uid;
            
            // Check if we're on dashboard page or course page
            const path = window.location.pathname;
            console.log('[routing.js] handleAuthStateChange - path:', path);
            
            // Define valid dashboard sections
            const validSections = ['overview', 'programs', 'progress', 'credentials', 'marketplace', 
                                  'tasks', 'community', 'profile', 'settings', 'subscriptions', 'help'];
            
            // CRITICAL: Check for section URLs FIRST and completely skip routing.js logic for them
            // Let dashboard.js handle all section navigation - routing.js should NOT touch section URLs
            const accountSectionMatch = path.match(/^\/acct_([^\/]+)\/([^\/]+)$/);
            const directSectionMatch = path.match(/^\/([^\/]+)$/);
            
            // Check if we're on a section URL (with or without account prefix)
            let isSectionUrl = false;
            if (accountSectionMatch && accountSectionMatch[2]) {
                const routeSection = accountSectionMatch[2];
                if (validSections.includes(routeSection) && routeSection !== 'overview') {
                    isSectionUrl = true;
                    // Only fix account if it's wrong, otherwise do nothing
                    const routeShortId = accountSectionMatch[1];
                    if (!matchesShortUserId(user.uid, routeShortId)) {
                        console.log('[routing.js] Wrong account on section URL, fixing account only');
                        const shortId = getShortUserId(user.uid);
                        window.history.replaceState(null, '', `/acct_${shortId}/${routeSection}`);
                    } else {
                        console.log('[routing.js] Section URL detected, skipping all routing logic - let dashboard.js handle it');
                    }
                    this.updateTabTitle(user.uid);
                    return; // EXIT EARLY - don't process any other routing logic
                }
            }
            
            if (!isSectionUrl && directSectionMatch && directSectionMatch[1]) {
                const section = directSectionMatch[1];
                if (validSections.includes(section) && section !== 'overview') {
                    isSectionUrl = true;
                    console.log('[routing.js] Section URL detected, skipping all routing logic - let dashboard.js handle it');
                    if (!isLocalDev) {
                        // Production: add account prefix but keep the section
                        const shortId = getShortUserId(user.uid);
                        window.history.replaceState(null, '', `/acct_${shortId}/${section}`);
                    }
                    this.updateTabTitle(user.uid);
                    return; // EXIT EARLY - don't process any other routing logic
                }
            }
            
            // Handle course routes - ALWAYS strip account ID from course URLs
            // Course URLs should be universal (not tied to specific users) so multiple people can join
            // New structure: /{id}/course/{section} (course ID first, then /course, then section)
            const accountCourseNewMatch = path.match(/^\/acct_([^\/]+)\/([^\/]+)\/course(\/.*)?$/);
            const simpleCourseNewMatch = path.match(/^\/([^\/]+)\/course(\/.*)?$/);
            const accountCourseOldMatch = path.match(/^\/acct_([^\/]+)\/course\/([^\/]+)(\/.*)?$/);
            const simpleCourseOldMatch = path.match(/^\/course\/([^\/]+)(\/.*)?$/);
            
            if (accountCourseNewMatch || simpleCourseNewMatch || accountCourseOldMatch || simpleCourseOldMatch) {
                // Always strip account ID from course URLs (both local and production)
                let courseId = null;
                let section = null;
                
                if (accountCourseNewMatch) {
                    // New format with account: /acct_xxx/{courseId}/course/{section}
                    courseId = accountCourseNewMatch[2];
                    section = accountCourseNewMatch[3] || '';
                } else if (simpleCourseNewMatch) {
                    // New format: /{courseId}/course/{section}
                    courseId = simpleCourseNewMatch[1];
                    section = simpleCourseNewMatch[2] || '';
                } else if (accountCourseOldMatch) {
                    // Old format with account: /acct_xxx/course/{courseId}/{section}
                    courseId = accountCourseOldMatch[2];
                    section = accountCourseOldMatch[3] || '';
                } else if (simpleCourseOldMatch) {
                    // Old format: /course/{courseId}/{section}
                    courseId = simpleCourseOldMatch[1];
                    section = simpleCourseOldMatch[2] || '';
                }
                
                if (courseId) {
                    // Build clean URL without account ID
                    // Structure: /{id}/course/{section} or /{id}/course (for overview)
                    // Course ID comes first, then /course (the HTML page), then section
                    let cleanUrl;
                    if (!section || section === '/') {
                        // Overview: /{id}/course
                        cleanUrl = `/${courseId}/course`;
                    } else if (section.startsWith('/course')) {
                        // Already in new format: /{id}/course/{section}
                        cleanUrl = `/${courseId}${section}`;
                    } else {
                        // Convert to new format: /{id}/course/{section}
                        cleanUrl = `/${courseId}/course${section}`;
                    }
                    
                    if (path !== cleanUrl) {
                        window.history.replaceState(null, '', cleanUrl);
                    }
                }
                return;
            }
            
            // LOCAL DEV: Use simple routes without account ID
            if (isLocalDev) {
                // First check if we're on a direct section URL - if so, just verify auth and return
                const directSectionMatch = path.match(/^\/([^\/]+)$/);
                if (directSectionMatch && validSections.includes(directSectionMatch[1]) && directSectionMatch[1] !== 'overview') {
                    // This is a valid section URL - don't redirect, just verify auth
                    this.updateTabTitle(user.uid);
                    return;
                }
                
                // If on account-prefixed route in local dev, strip it to simple route
                if (path.match(/^\/acct_/)) {
                    // Check if it's a section URL
                    const accountSectionMatch = path.match(/^\/acct_[^\/]+\/([^\/]+)$/);
                    if (accountSectionMatch && validSections.includes(accountSectionMatch[1]) && accountSectionMatch[1] !== 'overview') {
                        // Redirect to clean section URL: /acct_xxx/marketplace -> /marketplace
                        window.history.replaceState(null, '', `/${accountSectionMatch[1]}`);
                    } else {
                        window.history.replaceState(null, '', '/dashboard');
                    }
                    this.updateTabTitle(user.uid);
                    return;
                }
                // If on old /dashboard/<section> format, redirect to clean /<section> format
                const oldDashboardSectionMatch = path.match(/^\/dashboard\/([^\/]+)$/);
                if (oldDashboardSectionMatch && validSections.includes(oldDashboardSectionMatch[1]) && oldDashboardSectionMatch[1] !== 'overview') {
                    window.history.replaceState(null, '', `/${oldDashboardSectionMatch[1]}`);
                    this.updateTabTitle(user.uid);
                    return;
                }
                // If already on /dashboard, just update title - don't change URL
                if (path === '/dashboard' || path === '/dashboard/') {
                    this.updateTabTitle(user.uid);
                    return;
                }
                if (path.startsWith('/dashboard')) {
                    this.updateTabTitle(user.uid);
                    return;
                }
            } else {
                // PRODUCTION: Use account-prefixed routes
                // CRITICAL: Check for section URLs FIRST before any redirects
                // If we're already on a section URL, don't touch it - let dashboard.js handle it
                const accountSectionCheck = path.match(/^\/acct_([^\/]+)\/([^\/]+)$/);
                if (accountSectionCheck && validSections.includes(accountSectionCheck[2]) && accountSectionCheck[2] !== 'overview') {
                    const routeShortId = accountSectionCheck[1];
                    const routeSection = accountSectionCheck[2];
                    // Verify account matches, but don't redirect if it does
                    if (matchesShortUserId(user.uid, routeShortId)) {
                        console.log('[routing.js] Production: On section URL, account matches, staying put');
                        this.updateTabTitle(user.uid);
                        return;
                    } else {
                        // Wrong account - fix it but keep the section
                        console.log('[routing.js] Production: Wrong account on section URL, fixing account but keeping section');
                        const shortId = getShortUserId(user.uid);
                        window.history.replaceState(null, '', `/acct_${shortId}/${routeSection}`);
                        this.updateTabTitle(user.uid);
                        return;
                    }
                }
                
                // If on /dashboard/ or /dashboard (without account_id), redirect to correct route
                if (path === '/dashboard' || path === '/dashboard/') {
                    this.redirectToAccountDashboard(user.uid);
                    return;
                }
                
                // If on /acct_{id}/dashboard (with optional section), verify it matches current user (compare shortened IDs)
                const newFormatMatch = path.match(/^\/acct_([^\/]+)\/dashboard(\/.*)?$/);
                const oldFormatMatch = path.match(/^\/dashboard\/acct_([^\/]+)\/?$/) || path.match(/^\/dashboard\/([^\/]+)\/?$/);
                
                if (newFormatMatch) {
                    const routeShortId = newFormatMatch[1];
                    
                    // Compare shortened ID in URL with shortened version of current user's UID
                    if (!matchesShortUserId(user.uid, routeShortId)) {
                        // URL doesn't match current user - redirect to correct shortened ID (preserve section if present)
                        const section = newFormatMatch[2] || '';
                        this.redirectToAccountDashboard(user.uid, section);
                        return;
                    }
                    
                    // Account ID matches - update tab title (section routing is handled by dashboard.js)
                    this.updateTabTitle(user.uid);
                } else if (oldFormatMatch) {
                    // Old format detected - redirect to new format with shortened ID
                    const routeAccountId = oldFormatMatch[1];
                    // If it's a full UID, use it; otherwise treat as short ID
                    if (routeAccountId.length > 6) {
                        this.redirectToAccountDashboard(routeAccountId);
                    } else {
                        // Already a short ID, but we need full UID - redirect with current user's short ID
                        this.redirectToAccountDashboard(user.uid);
                    }
                    return;
                } else if (path.startsWith('/dashboard')) {
                    // Any other dashboard route - ensure we have account_id
                    // Extract section if present (e.g., /dashboard/progress -> /progress)
                    const sectionMatch = path.match(/^\/dashboard(\/.*)$/);
                    const section = sectionMatch ? sectionMatch[1] : '';
                    // If it's a section, redirect to clean URL format
                    if (section && section.length > 1) {
                        const sectionName = section.substring(1); // Remove leading /
                        if (validSections.includes(sectionName) && sectionName !== 'overview') {
                            // Redirect to clean URL: /dashboard/marketplace -> /acct_xxx/marketplace
                            const shortId = getShortUserId(user.uid);
                            window.history.replaceState(null, '', `/acct_${shortId}/${sectionName}`);
                            this.updateTabTitle(user.uid);
                            return;
                        }
                    }
                    this.redirectToAccountDashboard(user.uid, section);
                }
            }
        } else {
            // User is not logged in
            this.currentAccountId = null;
            
            // If on dashboard route, account route, section route, or course route, redirect to login
            const path = window.location.pathname;
            const validSections = ['overview', 'programs', 'progress', 'credentials', 'marketplace', 
                                  'tasks', 'community', 'profile', 'settings', 'subscriptions', 'help'];
            
            // Check if it's a direct section URL
            const directSectionMatch = path.match(/^\/([^\/]+)$/);
            const isSectionUrl = directSectionMatch && validSections.includes(directSectionMatch[1]) && directSectionMatch[1] !== 'overview';
            const isAccountSectionUrl = path.match(/^\/acct_[^\/]+\/([^\/]+)$/) && 
                                       (() => {
                                           const match = path.match(/^\/acct_[^\/]+\/([^\/]+)$/);
                                           return match && validSections.includes(match[1]) && match[1] !== 'overview';
                                       })();
            
            if (path.startsWith('/dashboard') || 
                (!isLocalDev && path.match(/^\/acct_[^\/]+\/dashboard/)) ||
                isSectionUrl ||
                isAccountSectionUrl ||
                path.startsWith('/course/') ||
                path.match(/^\/acct_[^\/]+\/course\//)) {
                window.location.href = '/login';
            }
        }
    }

    async checkCurrentRoute() {
        const path = window.location.pathname;
        const validSections = ['overview', 'programs', 'progress', 'credentials', 'marketplace', 
                              'tasks', 'community', 'profile', 'settings', 'subscriptions', 'help'];
        
        console.log('[routing.js] checkCurrentRoute - path:', path);
        
        // First check if we're on a section URL - if so, don't redirect, let dashboard.js handle it
        const directSectionMatch = path.match(/^\/([^\/]+)$/);
        if (directSectionMatch && validSections.includes(directSectionMatch[1]) && directSectionMatch[1] !== 'overview') {
            // This is a valid section URL - don't redirect, let dashboard.js handle navigation
            console.log('[routing.js] checkCurrentRoute - Section URL detected, skipping (let dashboard.js handle)');
            return;
        }
        
        // Check for /acct_xxx/<section> pattern (production)
        const accountSectionMatch = path.match(/^\/acct_([^\/]+)\/([^\/]+)$/);
        if (accountSectionMatch && validSections.includes(accountSectionMatch[2]) && accountSectionMatch[2] !== 'overview') {
            // This is a valid section URL - don't redirect, let dashboard.js handle navigation
            console.log('[routing.js] checkCurrentRoute - Account section URL detected, skipping (let dashboard.js handle)');
            return;
        }
        
        // If on /dashboard/ or /dashboard, wait for auth state to determine redirect
        if (path === '/dashboard' || path === '/dashboard/') {
            // Auth state will handle the redirect
            console.log('[routing.js] checkCurrentRoute - On /dashboard, waiting for auth state');
            return;
        }
        
        // If on /acct_{id}/dashboard (with optional section), verify auth matches
        // Support both formats: /acct_xxx/dashboard and /dashboard/acct_xxx (for backwards compatibility)
        const newFormatMatch = path.match(/^\/acct_([^\/]+)\/dashboard(\/.*)?$/);
        const oldFormatMatch = path.match(/^\/dashboard\/acct_([^\/]+)\/?$/) || path.match(/^\/dashboard\/([^\/]+)\/?$/);
        
        if (newFormatMatch) {
            const routeShortId = newFormatMatch[1];
            
            // Check if user is authenticated
            if (window.firebase && window.firebase.auth) {
                const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
                const auth = getAuth();
                if (auth.currentUser) {
                    // Compare shortened IDs
                    if (matchesShortUserId(auth.currentUser.uid, routeShortId)) {
                        this.updateTabTitle(auth.currentUser.uid);
                    } else {
                        // Mismatch - will be handled by auth state listener
                    }
                }
            }
        } else if (oldFormatMatch) {
            // Old format - will be redirected by auth state listener
        }
    }

    redirectToAccountDashboard(accountId, section = '') {
        const currentPath = window.location.pathname;
        const validSections = ['overview', 'programs', 'progress', 'credentials', 'marketplace', 
                              'tasks', 'community', 'profile', 'settings', 'subscriptions', 'help'];
        
        // IMPORTANT: Don't redirect if we're already on a section URL (clean URLs like /marketplace or /acct_xxx/marketplace)
        const directSectionMatch = currentPath.match(/^\/([^\/]+)$/);
        const isSectionUrl = directSectionMatch && validSections.includes(directSectionMatch[1]) && directSectionMatch[1] !== 'overview';
        const accountSectionMatch = currentPath.match(/^\/acct_[^\/]+\/([^\/]+)$/);
        const isAccountSectionUrl = accountSectionMatch && validSections.includes(accountSectionMatch[1]) && accountSectionMatch[1] !== 'overview';
        
        if (isSectionUrl || isAccountSectionUrl) {
            console.log('DashboardRouter.redirectToAccountDashboard: Already on section URL, skipping redirect');
            return;
        }
        
        // In local dev, use simple route. In production, use account-prefixed route with shortened ID
        const shortId = getShortUserId(accountId);
        const basePath = isLocalDev ? `/dashboard` : `/acct_${shortId}/dashboard`;
        const newPath = basePath + section;
        
        console.log('DashboardRouter.redirectToAccountDashboard called');
        console.log('Current path:', currentPath);
        console.log('New path:', newPath);
        console.log('Section:', section);
        
        // Only redirect if path is different (and we're not just updating a section)
        // Don't redirect if we're already on the correct base path and just changing sections
        const currentBasePath = isLocalDev ? '/dashboard' : `/acct_${shortId}/dashboard`;
        
        // If we're already on the correct base path and just changing sections, don't interfere
        // Let dashboard.js handle section navigation
        if (currentPath.startsWith(currentBasePath) && section) {
            console.log('DashboardRouter: Already on correct base path with section, skipping redirect');
            return;
        }
        
        // Only redirect if we're not on the correct base path
        if (!currentPath.startsWith(currentBasePath)) {
            console.log('DashboardRouter: Using replaceState to update URL to dashboard');
            window.history.replaceState(null, '', newPath);
            // Update tab title (use full UID for title)
            this.updateTabTitle(accountId);
        }
    }

    updateTabTitle(accountId) {
        // Title will be updated by dashboard.js updateDocumentTitle function
        // Don't set a hardcoded title here
    }

    getAccountIdFromRoute() {
        const path = window.location.pathname;
        // Support both formats: /acct_xxx/dashboard and /dashboard/acct_xxx (for backwards compatibility)
        const newFormatMatch = path.match(/^\/acct_([^\/]+)\/dashboard\/?$/);
        const oldFormatMatch = path.match(/^\/dashboard\/acct_([^\/]+)\/?$/) || path.match(/^\/dashboard\/([^\/]+)\/?$/);
        return newFormatMatch ? newFormatMatch[1] : (oldFormatMatch ? oldFormatMatch[1] : null);
    }

    // Helper function to get course URL (without account ID - courses are universal)
    getCourseUrl(courseId) {
        if (!courseId) return null;
        // Course URLs are universal, not tied to specific users
        return `/course/${courseId}`;
    }

    cleanup() {
        if (this.authUnsubscribe) {
            this.authUnsubscribe();
            this.authUnsubscribe = null;
        }
    }
}

// Initialize routers when DOM is ready
let dashboardRouter = null;

document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    
    // Initialize dashboard router for dashboard, section, and course pages
    const validSections = ['overview', 'programs', 'progress', 'credentials', 'marketplace', 
                          'tasks', 'community', 'profile', 'settings', 'subscriptions', 'help'];
    const directSectionMatch = path.match(/^\/([^\/]+)$/);
    const isSectionUrl = directSectionMatch && validSections.includes(directSectionMatch[1]) && directSectionMatch[1] !== 'overview';
    const isAccountSectionUrl = path.match(/^\/acct_[^\/]+\/([^\/]+)$/) && 
                               (() => {
                                   const match = path.match(/^\/acct_[^\/]+\/([^\/]+)$/);
                                   return match && validSections.includes(match[1]) && match[1] !== 'overview';
                               })();
    
    if (path.startsWith('/dashboard') || 
        path.match(/^\/acct_[^\/]+\/dashboard/) ||
        isSectionUrl ||
        isAccountSectionUrl ||
        path.startsWith('/course/') ||
        path.match(/^\/acct_[^\/]+\/course\//)) {
        console.log('Initializing DashboardRouter for path:', path);
        dashboardRouter = new DashboardRouter();
    }
});

// Make routers available globally for manual access if needed
window.DashboardRouter = DashboardRouter;

// Make helper functions available globally
window.getShortUserId = getShortUserId;
window.matchesShortUserId = matchesShortUserId;

// Helper function to get course URL (without account ID - courses are universal)
window.getCourseUrl = function(courseId) {
    if (!courseId) return null;
    // Course URLs are universal, not tied to specific users
    return `/course/${courseId}`;
};

