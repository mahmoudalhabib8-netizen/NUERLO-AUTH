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

// Helper function to check if we're in course.html context
// CRITICAL: This must be reliable on page refresh
// CRITICAL: Single-segment routes like /progress or /overview are ALWAYS dashboard routes
// unless we're explicitly in course context (course.html, body attribute, or two-segment route)
function isInCourseContext() {
    const pathname = window.location.pathname;
    
    // Priority 1: Check if URL is in course route format: /{courseId}/{section} (two segments)
    // This is the most reliable indicator - if URL has two segments and section is a course section, it's a course route
    const courseRouteMatch = pathname.match(/^\/([^\/]+)\/([^\/]+)$/);
    if (courseRouteMatch && courseRouteMatch[1] && courseRouteMatch[2]) {
        const potentialCourseId = courseRouteMatch[1];
        const potentialSection = courseRouteMatch[2];
        const courseSections = ['details', 'lessons', 'resources', 'discussions', 'analytics', 'assignments', 'notes'];
        const dashboardSections = ['programs', 'resources', 'marketplace', 
                                  'tasks', 'notes', 'profile', 'settings', 'payment', 'help',
                                  'dashboard', 'login', 'register', 'course'];
        
        // If the section is a course section and the first part is not a dashboard section, it's a course route
        if (courseSections.includes(potentialSection) && !dashboardSections.includes(potentialCourseId)) {
            return true;
        }
    }
    
    // Priority 2: Check if body has course-related attributes (explicit course context)
    if (document.body && document.body.hasAttribute('data-course-id')) {
        return true;
    }
    
    // Priority 3: Check window global (explicit course context)
    if (window.currentCourseId) {
        return true;
    }
    
    // Priority 4: Check if we're on course.html page (explicit course context)
    if (pathname.includes('course.html')) {
        return true;
    }
    
    // Priority 5: Check if URL is a course-only section (never in dashboard)
    const courseOnlySections = ['lessons', 'resources', 'discussions', 'assignments', 'notes'];
    const directSectionMatch = pathname.match(/^\/([^\/]+)$/);
    if (directSectionMatch && courseOnlySections.includes(directSectionMatch[1])) {
        return true;
    }
    
    // Course sections now use unique names (details, analytics)
    // So single-segment routes like /overview and /progress are ALWAYS dashboard routes
    // Course routes are always two-segment: /{courseId}/details, /{courseId}/analytics
    
    return false;
}

// Helper function to get course ID from various sources
function getCurrentCourseId() {
    // First check sessionStorage (most reliable for course context)
    const storedCourseId = sessionStorage.getItem('currentCourseId');
    if (storedCourseId) {
        return storedCourseId;
    }
    
    // Check body attribute
    if (document.body && document.body.hasAttribute('data-course-id')) {
        return document.body.getAttribute('data-course-id');
    }
    
    // Check window global
    if (window.currentCourseId) {
        return window.currentCourseId;
    }
    
    // Try to extract from URL: /{courseId}/{section} format
    const pathname = window.location.pathname;
    const courseSectionMatch = pathname.match(/^\/([^\/]+)\/([^\/]+)$/);
    if (courseSectionMatch && courseSectionMatch[1] && courseSectionMatch[2]) {
        const potentialCourseId = courseSectionMatch[1];
        const potentialSection = courseSectionMatch[2];
        const courseSections = ['details', 'lessons', 'resources', 'discussions', 'analytics', 'assignments', 'notes'];
        const dashboardSections = ['programs', 'resources', 'marketplace', 
                                  'tasks', 'notes', 'profile', 'settings', 'payment', 'help',
                                  'dashboard', 'login', 'register', 'course'];
        
        // If the section is a course section and the first part is not a dashboard section, it's a course
        if (courseSections.includes(potentialSection) && !dashboardSections.includes(potentialCourseId)) {
            // Store it in sessionStorage for future use
            sessionStorage.setItem('currentCourseId', potentialCourseId);
            return potentialCourseId;
        }
    }
    
    return null;
}

class CourseRouter {
    constructor() {
        this.currentCourseId = null;
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
        if (!user) {
            // Not logged in - redirect to login
            const path = window.location.pathname;
            const courseSections = ['details', 'lessons', 'resources', 'discussions', 'analytics', 'assignments', 'notes'];
            const directSectionMatch = path.match(/^\/([^\/]+)$/);
            if (directSectionMatch && courseSections.includes(directSectionMatch[1])) {
                window.location.href = '/login';
            }
            return;
        }

        // Get course ID from storage or URL
        const courseId = getCurrentCourseId();
        if (!courseId) {
            console.log('[CourseRouter] No course ID found, cannot handle route');
            return;
        }

        this.currentCourseId = courseId;
        
        // Store course ID in sessionStorage for persistence
        sessionStorage.setItem('currentCourseId', courseId);

        const path = window.location.pathname;
        const courseSections = ['details', 'lessons', 'resources', 'discussions', 'analytics', 'assignments', 'notes'];

        // If we're on course.html, redirect to /{courseId}/details
        if (path.includes('course.html')) {
            console.log('[CourseRouter] On course.html, redirecting to /{courseId}/details');
            window.history.replaceState(null, '', `/${courseId}/details`);
            return;
        }

        // Handle course routes with courseId: /{courseId}/{section}
        const courseRouteMatch = path.match(/^\/([^\/]+)\/([^\/]+)$/);
        if (courseRouteMatch && courseRouteMatch[1] && courseRouteMatch[2]) {
            const urlCourseId = courseRouteMatch[1];
            const section = courseRouteMatch[2];
            
            // If this matches our courseId and is a valid course section, let course.html handle it
            if (urlCourseId === courseId && courseSections.includes(section)) {
                console.log('[CourseRouter] Course route detected:', path, '- let course.html handle it');
                return;
            }
            
            // If URL has different courseId, update it to current courseId
            if (courseSections.includes(section) && urlCourseId !== courseId) {
                console.log('[CourseRouter] Updating courseId in URL from', urlCourseId, 'to', courseId);
                window.history.replaceState(null, '', `/${courseId}/${section}`);
                return;
            }
        }

        // CRITICAL: Course sections now use unique names (details, analytics)
        // So single-segment routes are never course routes - they're always dashboard routes
        // Only handle course sections that are in two-segment format: /{courseId}/{section}
        const directSectionMatch = path.match(/^\/([^\/]+)$/);
        if (directSectionMatch && courseSections.includes(directSectionMatch[1])) {
            // This shouldn't happen since course sections use unique names, but handle it just in case
            const section = directSectionMatch[1];
            console.log('[CourseRouter] Single-segment course section detected (unexpected), redirecting to /{courseId}/{section}:', path, '->', `/${courseId}/${section}`);
            window.history.replaceState(null, '', `/${courseId}/${section}`);
            return;
        }

        // Handle account-prefixed course URLs: /acct_xxx/{courseId}/{section} -> /{courseId}/{section}
        const accountCourseMatch = path.match(/^\/acct_[^\/]+\/([^\/]+)\/([^\/]+)$/);
        if (accountCourseMatch && accountCourseMatch[1] && accountCourseMatch[2]) {
            const potentialCourseId = accountCourseMatch[1];
            const potentialSection = accountCourseMatch[2];
            
            if (courseSections.includes(potentialSection)) {
                // Remove account prefix, keep courseId
                console.log('[CourseRouter] Removing account prefix from course URL:', path, '->', `/${potentialCourseId}/${potentialSection}`);
                window.history.replaceState(null, '', `/${potentialCourseId}/${potentialSection}`);
                return;
            }
        }

        // Legacy: /course/{courseId} or /{courseId}/course -> /{courseId}/details
        if (path.match(/\/course\//) || path.match(/\/course$/)) {
            console.log('[CourseRouter] Redirecting legacy course URL to /{courseId}/details');
            window.history.replaceState(null, '', `/${courseId}/details`);
            return;
        }
    }

    async checkCurrentRoute() {
        // Similar logic to handleAuthStateChange but for initial load
        const courseId = getCurrentCourseId();
        if (!courseId) {
            return;
        }

        this.currentCourseId = courseId;
        sessionStorage.setItem('currentCourseId', courseId);

        const path = window.location.pathname;
        const courseSections = ['details', 'lessons', 'resources', 'discussions', 'analytics', 'assignments', 'notes'];

        // If we're on course.html, redirect to /{courseId}/details
        if (path.includes('course.html')) {
            console.log('[CourseRouter] checkCurrentRoute - On course.html, redirecting to /{courseId}/details');
            window.history.replaceState(null, '', `/${courseId}/details`);
            return;
        }

        // Handle course routes with courseId: /{courseId}/{section}
        const courseRouteMatch = path.match(/^\/([^\/]+)\/([^\/]+)$/);
        if (courseRouteMatch && courseRouteMatch[1] && courseRouteMatch[2]) {
            const urlCourseId = courseRouteMatch[1];
            const section = courseRouteMatch[2];
            
            // If this matches our courseId and is a valid course section, it's correct
            if (urlCourseId === courseId && courseSections.includes(section)) {
                console.log('[CourseRouter] checkCurrentRoute - Course route detected:', path);
                return;
            }
            
            // If URL has different courseId, update it
            if (courseSections.includes(section) && urlCourseId !== courseId) {
                window.history.replaceState(null, '', `/${courseId}/${section}`);
                return;
            }
        }

        // CRITICAL: Course sections now use unique names (details, analytics)
        // So single-segment routes are never course routes - they're always dashboard routes
        // Only handle course sections that are in two-segment format: /{courseId}/{section}
        const directSectionMatch = path.match(/^\/([^\/]+)$/);
        if (directSectionMatch && courseSections.includes(directSectionMatch[1])) {
            // This shouldn't happen since course sections use unique names, but handle it just in case
            const section = directSectionMatch[1];
            console.log('[CourseRouter] checkCurrentRoute - Single-segment course section detected (unexpected), redirecting to /{courseId}/{section}:', path, '->', `/${courseId}/${section}`);
            window.history.replaceState(null, '', `/${courseId}/${section}`);
            return;
        }
    }

    cleanup() {
        if (this.authUnsubscribe) {
            this.authUnsubscribe();
            this.authUnsubscribe = null;
        }
    }
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
            
            // CRITICAL: If we're in course context, don't handle ANY routes - let CourseRouter handle them
            // This includes shared routes like /progress and /overview
            if (isInCourseContext()) {
                console.log('[DashboardRouter] In course context, skipping ALL route handling (including shared routes)');
                return;
            }
            
            // Check if we're on dashboard page or course page
            const path = window.location.pathname;
            console.log('[routing.js] handleAuthStateChange - path:', path);
            
            // Define valid dashboard sections
            const validSections = ['overview', 'programs', 'progress', 'resources', 'marketplace', 
                                  'tasks', 'community', 'profile', 'settings', 'payment', 'help'];
            const courseSections = ['details', 'lessons', 'resources', 'discussions', 'analytics', 'assignments', 'notes'];
            const dashboardSections = ['programs', 'resources', 'marketplace', 
                                      'tasks', 'notes', 'profile', 'settings', 'payment', 'help',
                                      'dashboard', 'login', 'register', 'course'];
            
            // CRITICAL: Single-segment routes like /progress or /overview are ALWAYS dashboard routes
            // Two-segment routes like /{courseId}/progress are course routes
            // Check if this is a two-segment course route first
            const courseRouteMatch = path.match(/^\/([^\/]+)\/([^\/]+)$/);
            if (courseRouteMatch && courseRouteMatch[1] && courseRouteMatch[2]) {
                const potentialCourseId = courseRouteMatch[1];
                const potentialSection = courseRouteMatch[2];
                const dashboardSections = ['programs', 'resources', 'marketplace', 
                                          'tasks', 'notes', 'profile', 'settings', 'payment', 'help',
                                          'dashboard', 'login', 'register', 'course'];
                
                // If the section is a course section and the first part is not a dashboard section, it's a course route
                if (courseSections.includes(potentialSection) && !dashboardSections.includes(potentialCourseId)) {
                    console.log('[DashboardRouter] Two-segment course route detected, skipping');
                    return;
                }
            }
            
            // Single-segment routes are dashboard routes - handle them normally
            
            // CRITICAL: Check for course URLs FIRST (before dashboard sections) to avoid conflicts
            // Check for NEW clean format: /{courseId}/{section} (e.g., /advanced-ai/lessons or /advanced-ai/overview)
            const cleanCourseSectionMatch = path.match(/^\/([^\/]+)\/([^\/]+)$/);
            if (cleanCourseSectionMatch && cleanCourseSectionMatch[1] && cleanCourseSectionMatch[2]) {
                const potentialCourseId = cleanCourseSectionMatch[1];
                const potentialSection = cleanCourseSectionMatch[2];
                
                // If the section is a course section (including overview) and the first part is not a dashboard section, it's a course
                if (courseSections.includes(potentialSection) && !dashboardSections.includes(potentialCourseId)) {
                    console.log('[routing.js] Clean course section URL detected:', path, '- let course.js handle it');
                    this.updateTabTitle(user.uid);
                    return; // EXIT EARLY - don't process dashboard routing logic
                }
            }
            
            // Check for account-prefixed clean format: /acct_xxx/{courseId}/{section}
            const accountCleanCourseSectionMatch = path.match(/^\/acct_([^\/]+)\/([^\/]+)\/([^\/]+)$/);
            if (accountCleanCourseSectionMatch && accountCleanCourseSectionMatch[2] && accountCleanCourseSectionMatch[3]) {
                const potentialCourseId = accountCleanCourseSectionMatch[2];
                const potentialSection = accountCleanCourseSectionMatch[3];
                
                // If the section is a course section (including overview) and the course ID is not a dashboard section, remove account prefix
                if (courseSections.includes(potentialSection) && !dashboardSections.includes(potentialCourseId)) {
                    console.log('[routing.js] Account-prefixed clean course section URL detected, removing account prefix');
                    window.history.replaceState(null, '', `/${potentialCourseId}/${potentialSection}`);
                    this.updateTabTitle(user.uid);
                    return; // EXIT EARLY
                }
            }
            
            // Legacy support: Check for course overview: /{courseId}/course (redirect to /{courseId}/details)
            const courseOverviewMatch = path.match(/^\/([^\/]+)\/course\/?$/);
            if (courseOverviewMatch && courseOverviewMatch[1] && !dashboardSections.includes(courseOverviewMatch[1])) {
                console.log('[routing.js] Legacy course overview URL detected, redirecting to /details format');
                window.history.replaceState(null, '', `/${courseOverviewMatch[1]}/details`);
                this.updateTabTitle(user.uid);
                return; // EXIT EARLY
            }
            
            // CRITICAL: Check for dashboard section URLs AFTER course URLs
            // Let dashboard.js handle all section navigation - routing.js should NOT touch section URLs
            const accountSectionMatch = path.match(/^\/acct_([^\/]+)\/([^\/]+)$/);
            const directSectionMatch = path.match(/^\/([^\/]+)$/);
            
            // Check if we're on a section URL (with or without account prefix)
            // NOTE: Course URLs (two segments like /{courseId}/overview) are already handled above
            // So this only handles single-segment dashboard URLs like /overview
            let isSectionUrl = false;
            if (accountSectionMatch && accountSectionMatch[2]) {
                const routeSection = accountSectionMatch[2];
                // Include overview now - course URLs are already filtered out above
                if (validSections.includes(routeSection)) {
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
                // Include overview now - course URLs are already filtered out above
                if (validSections.includes(section)) {
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
            
            // Legacy: Redirect /dashboard to /overview (only if not a course URL)
            if (path === '/dashboard' || path === '/dashboard/') {
                console.log('[routing.js] Legacy /dashboard URL detected, redirecting to /overview');
                if (!isLocalDev) {
                    const shortId = getShortUserId(user.uid);
                    window.history.replaceState(null, '', `/acct_${shortId}/overview`);
                } else {
                    window.history.replaceState(null, '', '/overview');
                }
                this.updateTabTitle(user.uid);
                return;
            }
            
            // Legacy: Redirect /acct_xxx/dashboard to /acct_xxx/overview
            const accountDashboardMatch = path.match(/^\/acct_([^\/]+)\/dashboard\/?$/);
            if (accountDashboardMatch) {
                const routeShortId = accountDashboardMatch[1];
                if (matchesShortUserId(user.uid, routeShortId)) {
                    console.log('[routing.js] Legacy account dashboard URL detected, redirecting to /overview');
                    window.history.replaceState(null, '', `/acct_${routeShortId}/overview`);
                    this.updateTabTitle(user.uid);
                    return;
                }
            }
            
            // Handle course routes with /course in URL - ALWAYS strip account ID from course URLs
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
                    // Build clean URL without account ID and without /course in the middle
                    // NEW FORMAT: /{courseId}/{section} (e.g., /advanced-ai/lessons or /advanced-ai/details)
                    let cleanUrl;
                    if (!section || section === '/') {
                        // Overview: /{id}/details (not /course)
                        cleanUrl = `/${courseId}/details`;
                    } else {
                        // Section: /{courseId}/{section} (remove /course, just like dashboard sections)
                        const sectionName = section.startsWith('/course/') ? section.replace('/course/', '') : 
                                         section.startsWith('/') ? section.substring(1) : section;
                        // Map old section names to new ones
                        if (sectionName === 'overview' || sectionName === 'courseoverview') {
                            cleanUrl = `/${courseId}/details`;
                        } else if (sectionName === 'progress' || sectionName === 'courseprogress') {
                            cleanUrl = `/${courseId}/analytics`;
                        } else {
                            cleanUrl = `/${courseId}/${sectionName}`;
                        }
                    }
                    
                    if (path !== cleanUrl) {
                        console.log('[routing.js] Updating course URL from', path, 'to', cleanUrl);
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
            
            // CRITICAL: Don't redirect section URLs immediately - wait a bit for auth to initialize
            // This prevents redirects during page refresh when auth is still initializing
            // Dashboard.js handles its own auth checks, so we should let it handle section URLs
            const path = window.location.pathname;
            const validSections = ['overview', 'programs', 'progress', 'resources', 'marketplace', 
                                  'tasks', 'community', 'profile', 'settings', 'payment', 'help'];
            
            // Check if it's a direct section URL
            const directSectionMatch = path.match(/^\/([^\/]+)$/);
            const isSectionUrl = directSectionMatch && validSections.includes(directSectionMatch[1]);
            const isAccountSectionUrl = path.match(/^\/acct_[^\/]+\/([^\/]+)$/) && 
                                       (() => {
                                           const match = path.match(/^\/acct_[^\/]+\/([^\/]+)$/);
                                           return match && validSections.includes(match[1]);
                                       })();
            
            // If it's a section URL, don't redirect - let dashboard.js handle it
            // Dashboard.js will redirect to login if user is actually not authenticated
            if (isSectionUrl || isAccountSectionUrl) {
                console.log('[routing.js] Section URL detected - letting dashboard.js handle auth check, skipping redirect');
                return;
            }
            
            // For non-section URLs (like /dashboard), redirect to login
            if (path.startsWith('/dashboard') || 
                (!isLocalDev && path.match(/^\/acct_[^\/]+\/dashboard/)) ||
                path.startsWith('/course/') ||
                path.match(/^\/acct_[^\/]+\/course\//)) {
                window.location.href = '/login';
            }
        }
    }

    async checkCurrentRoute() {
        // CRITICAL: If we're in course context, don't handle ANY routes - let CourseRouter handle them
        // This includes shared routes like /progress and /overview
        if (isInCourseContext()) {
            console.log('[DashboardRouter] checkCurrentRoute - In course context, skipping ALL routes');
            return;
        }
        
        const path = window.location.pathname;
        const validSections = ['overview', 'programs', 'progress', 'credentials', 'marketplace', 
                              'tasks', 'community', 'profile', 'settings', 'payment', 'help'];
        const courseSections = ['details', 'lessons', 'resources', 'discussions', 'analytics', 'assignments', 'notes'];
        const dashboardSections = ['programs', 'resources', 'marketplace', 
                                  'tasks', 'notes', 'profile', 'settings', 'payment', 'help',
                                  'dashboard', 'login', 'register', 'course'];
        
        console.log('[routing.js] checkCurrentRoute - path:', path);
        
        // CRITICAL: Single-segment routes like /progress or /overview are ALWAYS dashboard routes
        // Two-segment routes like /{courseId}/progress are course routes
        // Check if this is a two-segment course route first
        const courseRouteMatch = path.match(/^\/([^\/]+)\/([^\/]+)$/);
        if (courseRouteMatch && courseRouteMatch[1] && courseRouteMatch[2]) {
            const potentialCourseId = courseRouteMatch[1];
            const potentialSection = courseRouteMatch[2];
            const dashboardSections = ['programs', 'resources', 'marketplace', 
                                      'tasks', 'notes', 'profile', 'settings', 'payment', 'help',
                                      'dashboard', 'login', 'register', 'course'];
            
            // If the section is a course section and the first part is not a dashboard section, it's a course route
            if (courseSections.includes(potentialSection) && !dashboardSections.includes(potentialCourseId)) {
                console.log('[DashboardRouter] checkCurrentRoute - Two-segment course route detected, skipping');
                return;
            }
        }
        
        // Single-segment routes are dashboard routes - handle them normally
        
        // CRITICAL: Check for course URLs FIRST (before dashboard sections) to avoid conflicts
        // Check for NEW clean format: /{courseId}/{section} (e.g., /advanced-ai/lessons or /advanced-ai/overview)
        const cleanCourseSectionMatch = path.match(/^\/([^\/]+)\/([^\/]+)$/);
        if (cleanCourseSectionMatch && cleanCourseSectionMatch[1] && cleanCourseSectionMatch[2]) {
            const potentialCourseId = cleanCourseSectionMatch[1];
            const potentialSection = cleanCourseSectionMatch[2];
            
            // If the section is a course section (including overview) and the first part is not a dashboard section, it's a course
            if (courseSections.includes(potentialSection) && !dashboardSections.includes(potentialCourseId)) {
                console.log('[routing.js] checkCurrentRoute - Course URL detected:', path, '- let course.js handle it');
                return; // Don't process dashboard routing
            }
        }
        
        // Check for account-prefixed course URLs: /acct_xxx/{courseId}/{section}
        const accountCleanCourseSectionMatch = path.match(/^\/acct_([^\/]+)\/([^\/]+)\/([^\/]+)$/);
        if (accountCleanCourseSectionMatch && accountCleanCourseSectionMatch[2] && accountCleanCourseSectionMatch[3]) {
            const potentialCourseId = accountCleanCourseSectionMatch[2];
            const potentialSection = accountCleanCourseSectionMatch[3];
            
            if (courseSections.includes(potentialSection) && !dashboardSections.includes(potentialCourseId)) {
                console.log('[routing.js] checkCurrentRoute - Account-prefixed course URL detected, removing account prefix');
                window.history.replaceState(null, '', `/${potentialCourseId}/${potentialSection}`);
                return;
            }
        }
        
        // Legacy: Check for course overview: /{courseId}/course (redirect to /{courseId}/details)
        const courseOverviewMatch = path.match(/^\/([^\/]+)\/course\/?$/);
        if (courseOverviewMatch && courseOverviewMatch[1] && !dashboardSections.includes(courseOverviewMatch[1])) {
            console.log('[routing.js] checkCurrentRoute - Legacy course overview URL detected, redirecting to /details format');
            window.history.replaceState(null, '', `/${courseOverviewMatch[1]}/details`);
            return;
        }
        
        // Now check for dashboard section URLs (after course URLs are handled)
        const directSectionMatch = path.match(/^\/([^\/]+)$/);
        if (directSectionMatch && validSections.includes(directSectionMatch[1])) {
            // This is a valid section URL (including overview) - don't redirect, let dashboard.js handle navigation
            console.log('[routing.js] checkCurrentRoute - Section URL detected, skipping (let dashboard.js handle)');
            return;
        }
        
        // Check for /acct_xxx/<section> pattern (production)
        const accountSectionMatch = path.match(/^\/acct_([^\/]+)\/([^\/]+)$/);
        if (accountSectionMatch && validSections.includes(accountSectionMatch[2])) {
            // This is a valid section URL (including overview) - don't redirect, let dashboard.js handle navigation
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
                              'tasks', 'community', 'profile', 'settings', 'payment', 'help'];
        
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
let courseRouter = null;

document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    
    // CRITICAL: Single-segment routes like /progress or /overview are ALWAYS dashboard routes
    // Two-segment routes like /{courseId}/progress are course routes
    // This is the PRIMARY way to distinguish between dashboard and course routes
    
    const directSectionMatch = path.match(/^\/([^\/]+)$/);
    const isSingleSegmentRoute = !!directSectionMatch;
    
    // Check if URL is /{courseId}/{section} format (course route - two segments)
    const courseRouteMatch = path.match(/^\/([^\/]+)\/([^\/]+)$/);
    let isCourseRouteFormat = false;
    
    if (courseRouteMatch && courseRouteMatch[1] && courseRouteMatch[2]) {
        const urlCourseId = courseRouteMatch[1];
        const urlSection = courseRouteMatch[2];
        const courseSections = ['details', 'lessons', 'resources', 'discussions', 'analytics', 'assignments', 'notes'];
        const dashboardSections = ['programs', 'resources', 'marketplace', 
                                  'tasks', 'notes', 'profile', 'settings', 'payment', 'help',
                                  'dashboard', 'login', 'register', 'course'];
        
        // If the section is a course section and the first part is not a dashboard section, it's a course route
        if (courseSections.includes(urlSection) && !dashboardSections.includes(urlCourseId)) {
            isCourseRouteFormat = true;
            // Store the courseId from URL if we don't have it in sessionStorage
            const storedCourseId = sessionStorage.getItem('currentCourseId');
            if (!storedCourseId) {
                sessionStorage.setItem('currentCourseId', urlCourseId);
                console.log('[routing.js] Extracted and stored courseId from URL:', urlCourseId);
            }
        }
    }
    
    // Course-only sections (never appear in dashboard) - these can be single-segment course routes
    const courseOnlySections = ['lessons', 'resources', 'discussions', 'assignments', 'notes'];
    const currentSection = directSectionMatch ? directSectionMatch[1] : null;
    const isCourseOnlySection = currentSection && courseOnlySections.includes(currentSection);
    
    // Dashboard sections (course sections now use unique names, so no overlap)
    const dashboardOnlySections = ['overview', 'progress'];
    const isDashboardOnlySection = currentSection && dashboardOnlySections.includes(currentSection);
    
    // Check for explicit course context indicators (only used for course.html page or body attributes)
    const hasCourseAttribute = document.body && document.body.hasAttribute('data-course-id');
    const hasWindowCourseId = window.currentCourseId;
    const isCourseHtmlPage = path.includes('course.html');
    const isExplicitCourseContext = hasCourseAttribute || hasWindowCourseId || isCourseHtmlPage;
    
    // CRITICAL: Determine course context based on URL format FIRST, then explicit indicators
    // 1. Two-segment route with courseId: /{courseId}/{section} = COURSE
    // 2. Single-segment course-only section: /lessons, /resources, etc. = COURSE
    // 3. Single-segment dashboard-only section: /progress, /overview = DASHBOARD (always!)
    // 4. Explicit course context (course.html, body attribute) = COURSE
    
    // If it's a single-segment dashboard-only route, it's ALWAYS dashboard
    if (isSingleSegmentRoute && isDashboardOnlySection) {
        // Clear any courseId from sessionStorage to ensure dashboard context
        sessionStorage.removeItem('currentCourseId');
        console.log('[routing.js] Single-segment dashboard-only route detected - forcing dashboard context:', path);
        // Initialize dashboard router
        const validSections = ['overview', 'programs', 'progress', 'credentials', 'marketplace', 
                              'tasks', 'community', 'profile', 'settings', 'payment', 'help'];
        const isSectionUrl = directSectionMatch && validSections.includes(directSectionMatch[1]);
        const isAccountSectionUrl = path.match(/^\/acct_[^\/]+\/([^\/]+)$/) && 
                                   (() => {
                                       const match = path.match(/^\/acct_[^\/]+\/([^\/]+)$/);
                                       return match && validSections.includes(match[1]);
                                   })();
        
        if (path.startsWith('/dashboard') || 
            path.match(/^\/acct_[^\/]+\/dashboard/) ||
            isSectionUrl ||
            isAccountSectionUrl) {
            console.log('[routing.js] Dashboard context detected - Initializing DashboardRouter for path:', path);
            dashboardRouter = new DashboardRouter();
        }
        return; // Exit early - don't initialize CourseRouter
    }
    
    // Determine if we're in course context (only for two-segment routes or course-only sections)
    const isInCourseContext = isCourseRouteFormat || // Two-segment route: /{courseId}/{section}
                               isCourseOnlySection || // Course-only section: /lessons, /resources, etc.
                               (isExplicitCourseContext && !isSingleSegmentRoute); // Explicit context but not single-segment route
    
    if (isInCourseContext) {
        console.log('[routing.js] Course context detected - Initializing CourseRouter for path:', path);
        console.log('[routing.js] Course context indicators:', {
            isCourseRouteFormat,
            hasCourseAttribute,
            hasWindowCourseId,
            isCourseHtmlPage,
            isCourseOnlySection,
            isExplicitCourseContext,
            isSingleSegmentRoute
        });
        courseRouter = new CourseRouter();
        // DO NOT initialize DashboardRouter if we're in course context
        return;
    }
    
    // Not in course context - initialize dashboard router
    const validSections = ['overview', 'programs', 'progress', 'credentials', 'marketplace', 
                          'tasks', 'community', 'profile', 'settings', 'payment', 'help'];
    
    const isSectionUrl = directSectionMatch && validSections.includes(directSectionMatch[1]);
    const isAccountSectionUrl = path.match(/^\/acct_[^\/]+\/([^\/]+)$/) && 
                               (() => {
                                   const match = path.match(/^\/acct_[^\/]+\/([^\/]+)$/);
                                   return match && validSections.includes(match[1]);
                               })();
    
    if (path.startsWith('/dashboard') || 
        path.match(/^\/acct_[^\/]+\/dashboard/) ||
        isSectionUrl ||
        isAccountSectionUrl) {
        console.log('[routing.js] Dashboard context detected - Initializing DashboardRouter for path:', path);
        dashboardRouter = new DashboardRouter();
    }
});

// Make routers available globally for manual access if needed
window.DashboardRouter = DashboardRouter;
window.CourseRouter = CourseRouter;
window.isInCourseContext = isInCourseContext;
window.getCurrentCourseId = getCurrentCourseId;

// Make helper functions available globally
window.getShortUserId = getShortUserId;
window.matchesShortUserId = matchesShortUserId;

// Helper function to get course URL (without account ID - courses are universal)
window.getCourseUrl = function(courseId) {
    if (!courseId) return null;
    // Course URLs are universal, not tied to specific users
    return `/course/${courseId}`;
};

