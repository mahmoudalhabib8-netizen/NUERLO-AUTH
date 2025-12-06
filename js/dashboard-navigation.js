// Dashboard Navigation Module
// Handles dashboard-specific section navigation, URL management, and header updates
// This is dashboard-specific and differs from course.html's navigation

// Helper function to refresh user name in header
async function refreshUserNameInHeader() {
    const userName = document.getElementById('userName');
    if (!userName) return;
    
    // Use cached value immediately if available
    const cachedFirstName = window.cachedUserFirstName || 'Student';
    const currentSection = document.querySelector('.content-section.active');
    const isOverview = currentSection && currentSection.id === 'overview';
    
    if (isOverview && cachedFirstName) {
        userName.textContent = cachedFirstName;
        userName.style.display = 'inline';
    }
    
    // Then update from Firestore in background and update cache
    try {
        const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (user && window.firebase?.db) {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const userDocRef = doc(window.firebase.db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                let firstName = 'Student';
                
                // Prioritize firstName from Firestore
                if (userData.firstName) {
                    firstName = userData.firstName.trim();
                } else if (userData.displayName) {
                    firstName = userData.displayName.split(' ')[0].trim() || 'Student';
                }
                
                if (!firstName || firstName === 'User' || firstName === '' || firstName.toLowerCase() === 'user') {
                    firstName = 'Student';
                }
                
                // Update cache
                window.cachedUserFirstName = firstName;
                
                // Update display if still on overview
                if (isOverview) {
                    userName.textContent = firstName;
                    userName.style.display = 'inline';
                    console.log('Header user name refreshed:', firstName);
                } else {
                    userName.style.display = 'none';
                    userName.textContent = '';
                }
            }
        }
    } catch (error) {
        console.error('Error refreshing user name:', error);
    }
}

// Navigation functionality
// This function handles section navigation AND URL updates
function navigateToSection(sectionName, skipScroll) {
    // If leaving profile section and there are unsaved changes, discard them
    const currentSection = document.querySelector('.content-section.active');
    if (currentSection && currentSection.id === 'profile') {
        // Exit edit mode if active
        if (typeof exitProfileEditMode === 'function') {
            exitProfileEditMode();
        }
        if (typeof hasUnsavedChanges === 'function' && hasUnsavedChanges()) {
            // Discard changes silently when navigating away
            if (typeof cancelProfileChanges === 'function') {
                cancelProfileChanges();
            }
        }
    }
    
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Load recommended courses when overview section is shown
    if (sectionName === 'overview') {
        if (typeof window.loadRecommendedCourses === 'function') {
            window.loadRecommendedCourses();
        }
        
        // Always reload progress data to get latest from Firestore
        if (typeof loadProgressData === 'function') {
            console.log('[NAV] Navigating to Overview - Force refreshing progress data');
            loadProgressData();
        }
    }
    
    // Always reload data when navigating to programs section
    if (sectionName === 'programs') {
        if (typeof loadProgressData === 'function') {
            console.log('[NAV] Navigating to Programs - Force refreshing progress data');
            loadProgressData();
        }
    }
    
    // Show/hide profile right panel
    const profileRightPanel = document.getElementById('profileRightPanel');
    const profileSection = document.getElementById('profile');
    if (profileRightPanel && profileSection) {
        if (sectionName === 'profile') {
            profileRightPanel.style.display = 'flex';
            // Set margin based on collapse state
            const isCollapsed = profileRightPanel.classList.contains('collapsed');
            const sidebarWidth = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width');
            const collapsedWidth = '64px';
            profileSection.style.marginRight = isCollapsed ? collapsedWidth : sidebarWidth;
        } else {
            profileRightPanel.style.display = 'none';
            profileSection.style.marginRight = '0';
        }
    }
    
    // Hide auto-save prompt if not in profile section
    if (sectionName !== 'profile') {
        if (typeof hideAutoSavePrompt === 'function') {
            hideAutoSavePrompt();
        }
    }
    
    // Load social links when navigating to profile section
    if (sectionName === 'profile' && typeof loadSocialLinks === 'function') {
        loadSocialLinks();
    }
    
    // Update nav items
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.parentElement.classList.remove('active');
        if (link.getAttribute('data-section') === sectionName) {
            link.parentElement.classList.add('active');
        }
    });
    
    // Update header title - use the updateHeaderTitle function if available
    // CRITICAL: If on payment section, always keep title as "Payment"
    const paymentSection = document.getElementById('payment');
    const isOnPaymentSection = (paymentSection && paymentSection.classList.contains('active')) || 
                               sectionName === 'payment';
    
    if (typeof updateHeaderTitle === 'function') {
        // Use the centralized function which has protection for payment section
        if (isOnPaymentSection) {
            updateHeaderTitle('payment');
        } else {
            updateHeaderTitle(sectionName);
        }
    } else {
        // Fallback: direct update (shouldn't happen if dashboard.js is loaded)
        const titles = {
            'overview': 'Overview',
            'programs': 'My Programs',
            'progress': 'Progress',
            'resources': 'Resources',
            'marketplace': 'Marketplace',
            'tasks': 'Tasks',
            'notes': 'Notes',
            'payment': 'Payment',
            'subscriptions': 'Payment',
            'help': 'Help',
            'profile': 'Profile',
            'settings': 'Settings'
        };
        
        const titleText = document.getElementById('titleText');
        const userName = document.getElementById('userName');
        
        // If on payment section, force title to "Payment"
        const finalSectionName = isOnPaymentSection ? 'payment' : sectionName;
        
        if (titleText && titles[finalSectionName]) {
            if (finalSectionName === 'overview') {
                // Always show "Welcome, [FirstName]" when on overview section
                titleText.textContent = 'Welcome, ';
                if (userName) {
                    // Use cached first name immediately (no delay)
                    const cachedFirstName = window.cachedUserFirstName || 'Student';
                    userName.textContent = cachedFirstName;
                    userName.style.display = 'inline';
                    // Refresh the user name in background to ensure it's up to date
                    refreshUserNameInHeader();
                }
            } else {
                // For all other sections, set just the section title and hide/clear userName
                titleText.textContent = titles[finalSectionName];
                if (userName) {
                    userName.style.display = 'none';
                    userName.textContent = ''; // Clear the text content to prevent any display issues
                }
            }
        }
    }
    
    // Update URL with section (use helper functions from dashboard.js if available)
    if (window.history && window.history.pushState) {
        let newUrl = null;
        
        // Try to use buildDashboardUrlWithSection from dashboard.js if available
        if (typeof window.buildDashboardUrlWithSection === 'function') {
            newUrl = window.buildDashboardUrlWithSection(sectionName);
        } else {
            // Fallback: build URL manually
            const pathname = window.location.pathname;
            const isLocalDev = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' ||
                             window.location.hostname === '0.0.0.0' ||
                             window.location.hostname === '';
            
            const hasAccountPrefix = pathname.match(/^\/acct_/);
            
            if (hasAccountPrefix && !isLocalDev) {
                const accountMatch = pathname.match(/^(\/acct_[^\/]+)/);
                const accountPrefix = accountMatch ? accountMatch[1] : '';
                if (sectionName === 'overview') {
                    newUrl = `${accountPrefix}/dashboard`;
                } else {
                    newUrl = `${accountPrefix}/dashboard/${sectionName}`;
                }
            } else {
                if (sectionName === 'overview') {
                    newUrl = '/dashboard';
                } else {
                    newUrl = `/dashboard/${sectionName}`;
                }
            }
        }
        
        if (newUrl && newUrl !== window.location.pathname) {
            window.history.pushState({ section: sectionName }, '', newUrl);
            console.log('URL updated to:', newUrl);
        }
        
        // Save to localStorage
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('lastDashboardSection', sectionName);
        }
    }
    
    // Only scroll to top if not navigating from search and skipScroll is not true
    if (!window._isSearchNavigation && !skipScroll) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Close sidebar on mobile when navigating to a section
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
        // Check if we're on mobile (screen width <= 768px)
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
    }
}

// Resume course functionality
function resumeCourse() {
    const continueCourse = document.getElementById('continueCourse');
    if (continueCourse && continueCourse.style.display !== 'none') {
        const courseId = continueCourse.getAttribute('data-course-id');
        if (courseId) {
            // Store courseId in sessionStorage for CourseRouter to detect course context
            sessionStorage.setItem('currentCourseId', courseId);
            // Navigate to course with courseId in URL: /{courseId}/details
            window.location.href = `/${courseId}/details`;
        }
    }
}

// Expose functions globally
window.navigateToSection = navigateToSection;
window.refreshUserNameInHeader = refreshUserNameInHeader;
window.resumeCourse = resumeCourse;

// Initialize navigation handlers
document.addEventListener('DOMContentLoaded', function() {
    // Navigation click handlers
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (section) {
                navigateToSection(section);
            }
        });
    });

    // Filter categories - click handlers (purple line handled by CSS ::after)
    const filterCategories = document.querySelectorAll('.filter-category');
    filterCategories.forEach(btn => {
        btn.addEventListener('click', function() {
            filterCategories.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
});

