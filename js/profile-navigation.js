// Profile Navigation Module
// Handles profile section navigation, panel collapse/expand, and state management

document.addEventListener('DOMContentLoaded', function() {
    const profileNavItems = document.querySelectorAll('.profile-nav-item');
    const profileSubsections = document.querySelectorAll('.profile-subsection');
    
    // Handle profile navigation item clicks
    profileNavItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetSection = this.getAttribute('data-section');
            
            // Remove active class from all nav items
            profileNavItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Hide all subsections
            profileSubsections.forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active');
            });
            
            // Show target subsection
            const target = document.getElementById(targetSection);
            if (target) {
                target.style.display = 'block';
                target.classList.add('active');
            }
        });
    });
    
    // Profile Panel Collapse/Expand Toggle
    const profilePanelToggle = document.getElementById('profilePanelToggle');
    const profileRightPanel = document.getElementById('profileRightPanel');
    const profileSection = document.getElementById('profile');
    
    // Function to update profile section margin
    function updateProfileSectionMargin(isCollapsed) {
        if (profileSection) {
            const sidebarWidth = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width');
            const collapsedWidth = '64px';
            profileSection.style.marginRight = isCollapsed ? collapsedWidth : sidebarWidth;
        }
    }
    
    if (profilePanelToggle && profileRightPanel) {
        profilePanelToggle.addEventListener('click', function() {
            const isCollapsed = profileRightPanel.classList.toggle('collapsed');
            
            // Update button title
            profilePanelToggle.title = isCollapsed ? 'Expand panel' : 'Collapse panel';
            
            // Update profile section margin based on collapse state
            updateProfileSectionMargin(isCollapsed);
            
            // Save state to localStorage
            try {
                localStorage.setItem('profilePanelCollapsed', isCollapsed);
            } catch (error) {
                console.error('Error saving profile panel state:', error);
            }
        });
    }
    
    // Initialize profile panel collapse state from localStorage
    try {
        const panelCollapsed = localStorage.getItem('profilePanelCollapsed');
        if (panelCollapsed === 'true' && profileRightPanel && profileSection) {
            profileRightPanel.classList.add('collapsed');
            updateProfileSectionMargin(true);
            if (profilePanelToggle) {
                profilePanelToggle.title = 'Expand panel';
            }
        } else if (profileSection) {
            // Set initial margin when not collapsed
            updateProfileSectionMargin(false);
        }
    } catch (error) {
        console.error('Error loading profile panel state:', error);
    }
});

