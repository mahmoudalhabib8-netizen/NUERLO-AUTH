// Setup Guide - Tracks user visits to each dashboard section
// Similar to Stripe's onboarding flow

// TOGGLE: Set to false to disable the setup guide (keeps all code intact for easy re-enabling)
const SETUP_GUIDE_ENABLED = false;

const SETUP_GUIDE_STORAGE_KEY = 'nuerlo_setup_guide_visited_sections';
const SETUP_GUIDE_COMPLETED_KEY = 'nuerlo_setup_guide_completed';
const SETUP_GUIDE_COLLAPSED_KEY = 'nuerlo_setup_guide_collapsed';
const SETUP_GUIDE_MINIMIZED_KEY = 'nuerlo_setup_guide_minimized';

// Define all sections that should be visited with icons
const SETUP_GUIDE_SECTIONS = [
    { id: 'overview', name: 'Overview', icon: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>' },
    { id: 'programs', name: 'My Programs', icon: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>' },
    { id: 'progress', name: 'Progress', icon: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>' },
    { id: 'credentials', name: 'Credentials', icon: '<circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>' },
    { id: 'marketplace', name: 'Marketplace', icon: '<circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>' },
    { id: 'tasks', name: 'Tasks', icon: '<path d="M9 11l3 3 8-8"></path><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"></path>' },
    { id: 'community', name: 'Community', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>' },
    { id: 'profile', name: 'Profile', icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>' },
    { id: 'settings', name: 'Settings', icon: '<circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"></path>' },
    { id: 'subscriptions', name: 'Payment', icon: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line>' },
    { id: 'help', name: 'Help', icon: '<circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line>' }
];

// Initialize setup guide
function initializeSetupGuide() {
    // Check if guide is already completed
    const isCompleted = localStorage.getItem(SETUP_GUIDE_COMPLETED_KEY) === 'true';
    if (isCompleted) {
        // Don't show anything if already completed
        return;
    }

    // Create setup guide UI
    createSetupGuideUI();
    
    // Load visited sections from localStorage
    const visitedSections = getVisitedSections();
    
    // Update UI based on visited sections with animation
    setTimeout(() => {
        updateSetupGuideUI(visitedSections, true);
    }, 200);
    
    // Initial update for next section
    const nextSection = getNextUnvisitedSection(visitedSections);
    const nextSectionName = document.getElementById('setupGuideNextName');
    if (nextSectionName) {
        if (nextSection) {
            nextSectionName.textContent = nextSection.name;
        } else {
            nextSectionName.textContent = 'Complete!';
        }
    }
    
    // Listen for section changes (only from guide clicks)
    setupSectionTracking();
    
    // Restore collapse state
    restoreCollapseState();
    
    // Restore minimized state
    restoreMinimizedState();
}

// Get visited sections from localStorage
function getVisitedSections() {
    try {
        const stored = localStorage.getItem(SETUP_GUIDE_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Error reading visited sections:', e);
        return [];
    }
}

// Save visited sections to localStorage
function saveVisitedSections(visitedSections) {
    try {
        localStorage.setItem(SETUP_GUIDE_STORAGE_KEY, JSON.stringify(visitedSections));
    } catch (e) {
        console.error('Error saving visited sections:', e);
    }
}

// Mark section as visited
function markSectionAsVisited(sectionId) {
    const visitedSections = getVisitedSections();
    if (!visitedSections.includes(sectionId)) {
        visitedSections.push(sectionId);
        saveVisitedSections(visitedSections);
        updateSetupGuideUI(visitedSections);
        
        // Check if all sections are visited
        checkCompletion(visitedSections);
    }
}

// Setup section tracking - only track clicks from setup guide items
function setupSectionTracking() {
    // Listen for clicks on setup guide items only
    document.addEventListener('click', (e) => {
        const guideItem = e.target.closest('.setup-guide-item[data-section]');
        if (guideItem) {
            const sectionId = guideItem.getAttribute('data-section');
            // Navigate to section and mark as visited
            if (window.navigateToSection && typeof window.navigateToSection === 'function') {
                window.navigateToSection(sectionId);
            }
            markSectionAsVisited(sectionId);
        }
    });
}

// Check if all sections are completed
function checkCompletion(visitedSections) {
    const allSections = SETUP_GUIDE_SECTIONS.map(s => s.id);
    const allVisited = allSections.every(id => visitedSections.includes(id));
    
    if (allVisited) {
        // Mark as completed
        localStorage.setItem(SETUP_GUIDE_COMPLETED_KEY, 'true');
        
        // Show completion message
        showCompletionMessage();
        
        // Permanently hide guide and progress circle after a delay
        setTimeout(() => {
            permanentlyHideSetupGuide();
        }, 2000);
    }
}

// Create setup guide UI
function createSetupGuideUI() {
    // Check if already exists
    if (document.getElementById('setupGuide')) {
        return;
    }
    
    const guideContainer = document.createElement('div');
    guideContainer.id = 'setupGuide';
    guideContainer.className = 'setup-guide-container';
    
    guideContainer.innerHTML = `
        <div class="setup-guide-header">
            <div class="setup-guide-header-content">
                <h3 class="setup-guide-title">Getting Started</h3>
                <div class="setup-guide-progress-bar-container">
                    <div class="setup-guide-progress-bar" id="setupGuideProgressBar">
                        <div class="setup-guide-progress-bar-fill" id="setupGuideProgressBarFill" style="width: 0%;"></div>
                    </div>
                </div>
                <div class="setup-guide-next-section" id="setupGuideNextSection">
                    <span class="setup-guide-next-label">Next:</span>
                    <span class="setup-guide-next-name" id="setupGuideNextName">-</span>
                </div>
            </div>
            <div class="setup-guide-actions">
                <button class="setup-guide-toggle" id="setupGuideToggle" aria-label="Toggle getting started">
                    <svg class="setup-guide-expand-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
                        <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                    <svg class="setup-guide-collapse-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
                <button class="setup-guide-close" id="setupGuideClose" aria-label="Close getting started">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
        <div class="setup-guide-content" id="setupGuideContent">
            <ul class="setup-guide-list" id="setupGuideList">
                ${SETUP_GUIDE_SECTIONS.map(section => `
                    <li class="setup-guide-item" data-section="${section.id}">
                        <span class="setup-guide-item-name">${section.name}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
    
    document.body.appendChild(guideContainer);
    
    // Add close button handler
    const closeBtn = document.getElementById('setupGuideClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideSetupGuide();
        });
    }
    
    // Add toggle button handler
    const toggleBtn = document.getElementById('setupGuideToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            toggleSetupGuide();
        });
    }
    
    // Show guide with animation
    setTimeout(() => {
        guideContainer.classList.add('show');
    }, 100);
}

// Get next unvisited section
function getNextUnvisitedSection(visitedSections) {
    for (const section of SETUP_GUIDE_SECTIONS) {
        if (!visitedSections.includes(section.id)) {
            return section;
        }
    }
    return null; // All sections visited
}

// Animate progress bar from 0 to target
function animateProgressBar(targetPercent) {
    const progressBarFill = document.getElementById('setupGuideProgressBarFill');
    if (!progressBarFill) return;
    
    // Reset to 0
    progressBarFill.style.width = '0%';
    progressBarFill.style.transition = 'none';
    
    // Force reflow
    progressBarFill.offsetHeight;
    
    // Animate to target
    requestAnimationFrame(() => {
        progressBarFill.style.transition = 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        progressBarFill.style.width = `${targetPercent}%`;
    });
}

// Animate progress wheel from 0 to target
function animateProgressWheel(targetPercent) {
    const progressCircle = document.getElementById('setupGuideProgressCircle');
    if (!progressCircle) return;
    
    const progressElement = progressCircle.querySelector('.setup-guide-circle-progress');
    if (!progressElement) return;
    
    // Reset to 0
    progressElement.setAttribute('stroke-dasharray', '0, 100.53');
    progressElement.style.transition = 'none';
    
    // Force reflow
    progressElement.offsetHeight;
    
    // Animate to target
    requestAnimationFrame(() => {
        progressElement.style.transition = 'stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        progressElement.setAttribute('stroke-dasharray', `${targetPercent * 100.53 / 100}, 100.53`);
    });
}

// Update setup guide UI
function updateSetupGuideUI(visitedSections, animate = false) {
    const guideList = document.getElementById('setupGuideList');
    const progressBarFill = document.getElementById('setupGuideProgressBarFill');
    const nextSectionName = document.getElementById('setupGuideNextName');
    
    if (!guideList || !progressBarFill) return;
    
    // Update each item
    SETUP_GUIDE_SECTIONS.forEach(section => {
        const item = guideList.querySelector(`[data-section="${section.id}"]`);
        if (item) {
            const wasVisited = item.classList.contains('visited');
            const isNowVisited = visitedSections.includes(section.id);
            
            if (isNowVisited && !wasVisited) {
                // Animate when newly visited
                item.classList.add('visited', 'just-visited');
                setTimeout(() => {
                    item.classList.remove('just-visited');
                }, 600);
            } else if (isNowVisited) {
                item.classList.add('visited');
            } else {
                item.classList.remove('visited', 'just-visited');
            }
        }
    });
    
    // Update progress bar
    const visitedCount = visitedSections.length;
    const totalCount = SETUP_GUIDE_SECTIONS.length;
    const progressPercent = (visitedCount / totalCount) * 100;
    
    if (animate) {
        animateProgressBar(progressPercent);
    } else {
        progressBarFill.style.width = `${progressPercent}%`;
    }
    
    // Update next section
    const nextSection = getNextUnvisitedSection(visitedSections);
    if (nextSectionName) {
        if (nextSection) {
            nextSectionName.textContent = nextSection.name;
        } else {
            nextSectionName.textContent = 'Complete!';
        }
    }
    
    // Update progress circle if it exists
    updateProgressCircle(animate);
}

// Toggle setup guide expand/collapse
function toggleSetupGuide() {
    const guideContainer = document.getElementById('setupGuide');
    const guideContent = document.getElementById('setupGuideContent');
    const expandIcon = guideContainer?.querySelector('.setup-guide-expand-icon');
    const collapseIcon = guideContainer?.querySelector('.setup-guide-collapse-icon');
    
    if (!guideContainer || !guideContent) return;
    
    const isCollapsed = guideContainer.classList.contains('collapsed');
    
    if (isCollapsed) {
        // Expand: show content, hide expand icon, show collapse icon
        guideContainer.classList.remove('collapsed');
        if (expandIcon) expandIcon.style.display = 'none';
        if (collapseIcon) collapseIcon.style.display = 'block';
        localStorage.setItem(SETUP_GUIDE_COLLAPSED_KEY, 'false');
    } else {
        // Collapse: hide content, show expand icon, hide collapse icon
        guideContainer.classList.add('collapsed');
        if (expandIcon) expandIcon.style.display = 'block';
        if (collapseIcon) collapseIcon.style.display = 'none';
        localStorage.setItem(SETUP_GUIDE_COLLAPSED_KEY, 'true');
    }
}

// Restore collapse state from localStorage
function restoreCollapseState() {
    const isCollapsed = localStorage.getItem(SETUP_GUIDE_COLLAPSED_KEY) === 'true';
    const guideContainer = document.getElementById('setupGuide');
    
    if (guideContainer && isCollapsed) {
        const expandIcon = guideContainer.querySelector('.setup-guide-expand-icon');
        const collapseIcon = guideContainer.querySelector('.setup-guide-collapse-icon');
        
        guideContainer.classList.add('collapsed');
        if (expandIcon) expandIcon.style.display = 'block';
        if (collapseIcon) collapseIcon.style.display = 'none';
    }
}

// Restore minimized state from localStorage
function restoreMinimizedState() {
    const isMinimized = localStorage.getItem(SETUP_GUIDE_MINIMIZED_KEY) === 'true';
    
    if (isMinimized) {
        const guideContainer = document.getElementById('setupGuide');
        if (guideContainer) {
            guideContainer.classList.add('minimized');
        }
        showProgressCircle();
    }
}

// Show completion message
function showCompletionMessage() {
    const guideContainer = document.getElementById('setupGuide');
    if (!guideContainer) return;
    
    guideContainer.classList.add('completed');
    
    const header = guideContainer.querySelector('.setup-guide-header-content');
    if (header) {
        header.innerHTML = `
            <h3 class="setup-guide-title">All Set!</h3>
            <p class="setup-guide-subtitle">You've explored all sections</p>
            <div class="setup-guide-progress-bar-container">
                <div class="setup-guide-progress-bar" id="setupGuideProgressBar">
                    <div class="setup-guide-progress-bar-fill completed" id="setupGuideProgressBarFill"></div>
                </div>
            </div>
        `;
    }
}

// Hide setup guide (minimize to progress circle)
function hideSetupGuide() {
    // Don't minimize if completed
    const isCompleted = localStorage.getItem(SETUP_GUIDE_COMPLETED_KEY) === 'true';
    if (isCompleted) {
        permanentlyHideSetupGuide();
        return;
    }
    
    const guideContainer = document.getElementById('setupGuide');
    if (guideContainer) {
        guideContainer.classList.add('minimized');
        // Save minimized state
        localStorage.setItem(SETUP_GUIDE_MINIMIZED_KEY, 'true');
        // Show progress circle
        showProgressCircle();
    }
}

// Show progress circle (badge)
function showProgressCircle() {
    // Don't show progress circle if completed
    const isCompleted = localStorage.getItem(SETUP_GUIDE_COMPLETED_KEY) === 'true';
    if (isCompleted) {
        return;
    }
    
    let progressCircle = document.getElementById('setupGuideProgressCircle');
    
    if (!progressCircle) {
        // Create progress badge
        progressCircle = document.createElement('div');
        progressCircle.id = 'setupGuideProgressCircle';
        progressCircle.className = 'setup-guide-progress-badge';
        
        const visitedSections = getVisitedSections();
        const visitedCount = visitedSections.length;
        const totalCount = SETUP_GUIDE_SECTIONS.length;
        const progressPercent = (visitedCount / totalCount) * 100;
        
        progressCircle.innerHTML = `
            <div class="setup-guide-badge-content">
                <span class="setup-guide-badge-text">Get Started</span>
                <div class="setup-guide-badge-progress-wrapper">
                    <svg class="setup-guide-circle-svg" viewBox="0 0 36 36">
                        <circle class="setup-guide-circle-bg" cx="18" cy="18" r="16"></circle>
                        <circle class="setup-guide-circle-progress" cx="18" cy="18" r="16" 
                                stroke-dasharray="0, 100.53"></circle>
                    </svg>
                </div>
            </div>
        `;
        
        progressCircle.addEventListener('click', () => {
            restoreSetupGuide();
        });
        
        document.body.appendChild(progressCircle);
        
        // Animate in
        setTimeout(() => {
            progressCircle.classList.add('show');
            // Animate progress wheel after badge appears
            setTimeout(() => {
                animateProgressWheel(progressPercent);
            }, 150);
        }, 100);
    } else {
        // Update existing badge with animation
        progressCircle.classList.add('show');
        setTimeout(() => {
            updateProgressCircle(true);
        }, 150);
    }
}

// Update progress circle/badge
function updateProgressCircle(animate = false) {
    const progressBadge = document.getElementById('setupGuideProgressCircle');
    if (!progressBadge) return;
    
    const visitedSections = getVisitedSections();
    const visitedCount = visitedSections.length;
    const totalCount = SETUP_GUIDE_SECTIONS.length;
    const progressPercent = (visitedCount / totalCount) * 100;
    
    if (animate) {
        animateProgressWheel(progressPercent);
    } else {
        const progressCircleElement = progressBadge.querySelector('.setup-guide-circle-progress');
        if (progressCircleElement) {
            progressCircleElement.setAttribute('stroke-dasharray', `${progressPercent * 100.53 / 100}, 100.53`);
        }
    }
}

// Permanently hide setup guide (when completed)
function permanentlyHideSetupGuide() {
    const guideContainer = document.getElementById('setupGuide');
    const progressCircle = document.getElementById('setupGuideProgressCircle');
    
    // Hide guide container
    if (guideContainer) {
        guideContainer.classList.remove('show');
        guideContainer.classList.add('minimized');
        setTimeout(() => {
            if (guideContainer.parentNode) {
                guideContainer.remove();
            }
        }, 300);
    }
    
    // Hide progress circle
    if (progressCircle) {
        progressCircle.classList.remove('show');
        setTimeout(() => {
            if (progressCircle.parentNode) {
                progressCircle.remove();
            }
        }, 300);
    }
}

// Restore setup guide from minimized state
function restoreSetupGuide() {
    // Don't restore if completed
    const isCompleted = localStorage.getItem(SETUP_GUIDE_COMPLETED_KEY) === 'true';
    if (isCompleted) {
        return;
    }
    
    const guideContainer = document.getElementById('setupGuide');
    const progressCircle = document.getElementById('setupGuideProgressCircle');
    
    if (guideContainer) {
        guideContainer.classList.remove('minimized');
        guideContainer.classList.add('show');
        // Clear minimized state
        localStorage.setItem(SETUP_GUIDE_MINIMIZED_KEY, 'false');
        
        // Animate progress bar when restoring
        const visitedSections = getVisitedSections();
        const visitedCount = visitedSections.length;
        const totalCount = SETUP_GUIDE_SECTIONS.length;
        const progressPercent = (visitedCount / totalCount) * 100;
        
        setTimeout(() => {
            animateProgressBar(progressPercent);
        }, 200);
    }
    
    if (progressCircle) {
        progressCircle.classList.remove('show');
        setTimeout(() => {
            if (progressCircle.parentNode) {
                progressCircle.remove();
            }
        }, 300);
    }
}

// Reset setup guide (for testing or if user wants to restart)
function resetSetupGuide() {
    localStorage.removeItem(SETUP_GUIDE_STORAGE_KEY);
    localStorage.removeItem(SETUP_GUIDE_COMPLETED_KEY);
    localStorage.removeItem(SETUP_GUIDE_COLLAPSED_KEY);
    localStorage.removeItem(SETUP_GUIDE_MINIMIZED_KEY);
    const guideContainer = document.getElementById('setupGuide');
    const progressCircle = document.getElementById('setupGuideProgressCircle');
    if (guideContainer) {
        guideContainer.remove();
    }
    if (progressCircle) {
        progressCircle.remove();
    }
    initializeSetupGuide();
}

// Make functions available globally
window.initializeSetupGuide = initializeSetupGuide;
window.resetSetupGuide = resetSetupGuide;
window.toggleSetupGuide = toggleSetupGuide;

// Auto-initialize when DOM is ready
function autoInitializeSetupGuide() {
    // Check if setup guide is enabled
    if (!SETUP_GUIDE_ENABLED) {
        return; // Exit early if disabled
    }
    
    // Wait for dashboard to be fully initialized
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Wait for dashboard initialization
            const checkDashboard = setInterval(() => {
                if (document.querySelector('.content-section') && window.navigateToSection) {
                    clearInterval(checkDashboard);
                    setTimeout(initializeSetupGuide, 500);
                }
            }, 100);
            
            // Safety timeout
            setTimeout(() => {
                clearInterval(checkDashboard);
                initializeSetupGuide();
            }, 5000);
        });
    } else {
        // DOM already loaded, check for dashboard
        const checkDashboard = setInterval(() => {
            if (document.querySelector('.content-section') && window.navigateToSection) {
                clearInterval(checkDashboard);
                setTimeout(initializeSetupGuide, 500);
            }
        }, 100);
        
        // Safety timeout
        setTimeout(() => {
            clearInterval(checkDashboard);
            initializeSetupGuide();
        }, 5000);
    }
}

// Start auto-initialization
autoInitializeSetupGuide();

