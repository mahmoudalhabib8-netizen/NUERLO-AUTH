// Theme & Sidebar Module
// Handles theme initialization, theme toggle, sidebar collapse/expand
// Shared functionality for both dashboard.html and course.html

// Initialize theme immediately to prevent flash
(function() {
    let themeMode = 'dark'; // Default to dark mode
    
    try {
        // Check for TEMPORARY theme preference (from header toggle) - expires after 24 hours
        const tempTheme = localStorage.getItem('temporaryTheme');
        const tempThemeTimestamp = localStorage.getItem('temporaryThemeTimestamp');
        
        if (tempTheme && tempThemeTimestamp) {
            const timestamp = parseInt(tempThemeTimestamp);
            const now = Date.now();
            const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
            
            // If temporary theme is still valid (less than 24 hours old)
            if (now - timestamp < twentyFourHours) {
                themeMode = tempTheme;
                console.log('Using temporary theme preference:', tempTheme);
            } else {
                // Temporary preference expired, remove it and use permanent setting
                localStorage.removeItem('temporaryTheme');
                localStorage.removeItem('temporaryThemeTimestamp');
                console.log('Temporary theme preference expired, using permanent setting');
                
                // Fall through to check permanent settings below
                const storedSettings = localStorage.getItem('dashboardSettings');
                if (storedSettings) {
                    const settings = JSON.parse(storedSettings);
                    if (settings.alwaysLightMode) {
                        themeMode = 'light';
                    } else if (settings.themeMode) {
                        themeMode = settings.themeMode;
                    }
                }
            }
        } else {
            // No temporary preference, check PERMANENT settings
            const storedSettings = localStorage.getItem('dashboardSettings');
            if (storedSettings) {
                const settings = JSON.parse(storedSettings);
                if (settings.alwaysLightMode) {
                    themeMode = 'light';
                } else if (settings.themeMode) {
                    themeMode = settings.themeMode;
                }
            }
        }
    } catch (e) {
        console.error('Error loading theme preferences:', e);
    }
    
    const body = document.body;
    const themeMeta = document.getElementById('themeColorMeta');
    
    if (themeMode === 'light') {
        body.classList.add('light-mode');
        body.setAttribute('data-theme', 'light');
        if (themeMeta) themeMeta.content = '#ffffff';
    } else {
        // Default to dark mode
        body.classList.add('dark-mode');
        body.setAttribute('data-theme', 'dark');
        if (themeMeta) themeMeta.content = '#0a0a0a';
    }
})();

// Theme toggle functionality
function toggleTheme() {
    const body = document.body;
    const themeMeta = document.getElementById('themeColorMeta');
    const sunIcon = document.querySelector('.theme-icon-sun');
    const moonIcon = document.querySelector('.theme-icon-moon');
    const isDark = body.classList.contains('dark-mode') || (!body.classList.contains('light-mode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    let newThemeMode;
    if (isDark) {
        // Switch to light mode
        newThemeMode = 'light';
    } else {
        // Switch to dark mode
        newThemeMode = 'dark';
    }
    
    // Apply theme and save as TEMPORARY preference (24 hours)
    applyThemeMode(newThemeMode);
    
    // Save temporary theme with timestamp
    localStorage.setItem('temporaryTheme', newThemeMode);
    localStorage.setItem('temporaryThemeTimestamp', Date.now().toString());
    console.log('Temporary theme saved:', newThemeMode, 'Expires in 24 hours');
}

// Helper function to apply theme (also used by saveThemePreference)
function applyThemeMode(themeMode) {
    const body = document.body;
    const themeMeta = document.getElementById('themeColorMeta');
    const sunIcon = document.querySelector('.theme-icon-sun');
    const moonIcon = document.querySelector('.theme-icon-moon');
    
    // Add transitioning class to enable smooth transitions
    body.classList.add('theme-transitioning');
    
    // Apply all changes simultaneously
    if (themeMode === 'light') {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        body.setAttribute('data-theme', 'light');
        if (themeMeta) themeMeta.content = '#ffffff';
        if (sunIcon) sunIcon.setAttribute('stroke', '#171717');
        if (moonIcon) moonIcon.setAttribute('stroke', '#171717');
    } else if (themeMode === 'dark') {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        body.setAttribute('data-theme', 'dark');
        if (themeMeta) themeMeta.content = '#0a0a0a';
        if (sunIcon) sunIcon.setAttribute('stroke', '#fafafa');
        if (moonIcon) moonIcon.setAttribute('stroke', '#fafafa');
    }
    
    // Remove transitioning class after transition completes
    setTimeout(() => {
        body.classList.remove('theme-transitioning');
    }, 250);
    
    // Dispatch custom event so other pages can update theme in same tab
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { themeMode } }));
}

// Expose functions globally
window.toggleTheme = toggleTheme;
window.applyThemeMode = applyThemeMode;

// Update icon colors based on current theme
function updateThemeIconColors() {
    const sunIcon = document.querySelector('.theme-icon-sun');
    const moonIcon = document.querySelector('.theme-icon-moon');
    const body = document.body;
    
    if (body.classList.contains('dark-mode')) {
        if (sunIcon) sunIcon.setAttribute('stroke', '#fafafa');
        if (moonIcon) moonIcon.setAttribute('stroke', '#fafafa');
    } else {
        if (sunIcon) sunIcon.setAttribute('stroke', '#171717');
        if (moonIcon) moonIcon.setAttribute('stroke', '#171717');
    }
}

// Sidebar toggle for mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// Sidebar collapse/expand toggle
function toggleSidebarCollapse() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (!sidebar || !sidebarToggle) return;
    
    const isCollapsed = sidebar.classList.toggle('collapsed');
    
    // Update button title
    sidebarToggle.title = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
    
    // Save state to localStorage in both formats for compatibility
    localStorage.setItem('sidebarCollapsed', isCollapsed);
    
    // Also save to unified dashboardSettings
    try {
        const storedSettings = localStorage.getItem('dashboardSettings');
        const settings = storedSettings ? JSON.parse(storedSettings) : {};
        settings.compactSidebar = isCollapsed;
        localStorage.setItem('dashboardSettings', JSON.stringify(settings));
    } catch (error) {
        console.error('Error saving sidebar state:', error);
    }
    
    // Also update the main element if it exists (dashboard-specific)
    const main = document.querySelector('.dashboard-main');
    if (main) {
        if (isCollapsed) {
            main.classList.add('sidebar-collapsed');
        } else {
            main.classList.remove('sidebar-collapsed');
        }
    }
}

// Expose sidebar functions globally
window.toggleSidebar = toggleSidebar;
window.toggleSidebarCollapse = toggleSidebarCollapse;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Update icon colors after DOM is ready
    updateThemeIconColors();
    
    // Theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            toggleTheme();
            // Update icon colors after toggle
            setTimeout(updateThemeIconColors, 10);
        });
    }

    // Initialize sidebar collapse state from localStorage
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    
    // Check both legacy sidebarCollapsed and new compactSidebar setting
    let shouldCollapse = false;
    try {
        const legacyState = localStorage.getItem('sidebarCollapsed');
        const storedSettings = localStorage.getItem('dashboardSettings');
        
        if (storedSettings) {
            const settings = JSON.parse(storedSettings);
            if (settings.compactSidebar !== undefined) {
                shouldCollapse = settings.compactSidebar;
            } else if (legacyState === 'true') {
                shouldCollapse = true;
            }
        } else if (legacyState === 'true') {
            shouldCollapse = true;
        }
    } catch (error) {
        console.error('Error loading sidebar state:', error);
    }
    
    if (shouldCollapse && sidebar) {
        sidebar.classList.add('collapsed');
        const main = document.querySelector('.dashboard-main');
        if (main) {
            main.classList.add('sidebar-collapsed');
        }
        if (sidebarToggle) {
            sidebarToggle.title = 'Expand sidebar';
        }
    }
    
    // Add click handler for collapse button
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebarCollapse);
    }
});

