// Marketplace Filter Dropdown Module
// Handles marketplace filter dropdown, chip selection, and underline animation

function toggleFilters() {
    const dropdown = document.getElementById('marketplaceFilterDropdown');
    if (dropdown) {
        if (dropdown.style.display === 'none' || !dropdown.style.display) {
            dropdown.style.display = 'block';
            // Force a reflow
            void dropdown.offsetHeight;
            
            // Function to initialize underlines
            const initUnderlinesNow = () => {
                const activeChips = dropdown.querySelectorAll('.filter-chip.active');
                if (activeChips.length > 0) {
                activeChips.forEach(chip => {
                    if (window.moveUnderline) {
                        window.moveUnderline(chip);
                    }
                });
                } else {
                    // If no active chips, activate the first "all" chip in each group
                    const filterGroups = dropdown.querySelectorAll('.filter-options');
                    filterGroups.forEach(group => {
                        const allChip = group.querySelector('.filter-chip[data-value="all"]');
                        if (allChip) {
                            if (!allChip.classList.contains('active')) {
                                allChip.classList.add('active');
                            }
                            if (window.moveUnderline) {
                                window.moveUnderline(allChip);
                            }
                        }
                    });
                }
            };
            
            // Try multiple times to ensure it works
            initUnderlinesNow();
            setTimeout(initUnderlinesNow, 50);
            setTimeout(initUnderlinesNow, 200);
            setTimeout(initUnderlinesNow, 400);
        } else {
            dropdown.style.display = 'none';
        }
    }
}

// Expose toggleFilters globally
window.toggleFilters = toggleFilters;

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('marketplaceFilterDropdown');
    const filterBtn = document.getElementById('marketplaceFilterToggle');
    
    if (dropdown && filterBtn) {
        if (!dropdown.contains(e.target) && !filterBtn.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    }
});

// Initialize marketplace filter dropdown
function initMarketplaceFilterDropdown() {
    const dropdown = document.getElementById('marketplaceFilterDropdown');
    const clearBtn = document.getElementById('filterClearBtn');
    const filterChips = dropdown?.querySelectorAll('.filter-chip');

    if (!dropdown) return;

    // Function to move underline
    window.moveUnderline = function(chip) {
        if (!chip) {
            console.log('moveUnderline: No chip provided');
            return;
        }
        
        const filterType = chip.getAttribute('data-filter-type');
        const container = chip.closest('.filter-options');
        if (!container) {
            console.log('moveUnderline: Container not found');
            return;
        }
        
        const underline = container.querySelector('.filter-underline');
        if (!underline) {
            console.warn('moveUnderline: Underline element not found in container');
            return;
        }
        
        console.log('moveUnderline: Positioning underline for', filterType, chip.textContent);
        
        // Wait for next frame to ensure layout is ready
        requestAnimationFrame(() => {
            // Force a reflow
            void container.offsetHeight;
            void chip.offsetHeight;
            
            const chipRect = chip.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            console.log('moveUnderline: Chip rect', chipRect, 'Container rect', containerRect);
            
            if (chipRect.width === 0 || chipRect.height === 0) {
                // Element not visible yet, try again
                console.log('moveUnderline: Element not visible, retrying...');
                setTimeout(() => window.moveUnderline(chip), 50);
                return;
            }
            
            const left = chipRect.left - containerRect.left + container.scrollLeft;
            const width = chipRect.width;
            
            console.log('moveUnderline: Setting underline at left:', left, 'width:', width);
            
            // Set properties individually for better browser compatibility
            underline.style.position = 'absolute';
            underline.style.bottom = window.innerWidth <= 768 ? '2px' : '-4px';
            underline.style.height = '2px';
            underline.style.background = '#a476ff';
            underline.style.left = left + 'px';
            underline.style.width = width + 'px';
            underline.style.opacity = '1';
            underline.style.display = 'block';
            underline.style.visibility = 'visible';
            underline.style.zIndex = '10';
            underline.style.pointerEvents = 'none';
            underline.style.transition = 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
            
            console.log('moveUnderline: Underline styles applied', underline.style.cssText);
            
            // Scroll active chip into view on mobile
            if (window.innerWidth <= 768) {
                chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                // Recalculate after scroll on mobile
                setTimeout(() => {
                    const newChipRect = chip.getBoundingClientRect();
                    const newContainerRect = container.getBoundingClientRect();
                    if (newChipRect.width > 0) {
                        const newLeft = newChipRect.left - newContainerRect.left + container.scrollLeft;
                        const newWidth = newChipRect.width;
                        underline.style.left = newLeft + 'px';
                        underline.style.width = newWidth + 'px';
                        console.log('moveUnderline: Recalculated after scroll', newLeft, newWidth);
                    }
                }, 400);
            }
        });
    }
    
    // Initialize underlines immediately
    function initUnderlines() {
        console.log('initUnderlines: Starting initialization');
        const activeChips = dropdown.querySelectorAll('.filter-chip.active');
        console.log('initUnderlines: Found', activeChips.length, 'active chips');
        
        if (activeChips.length > 0) {
            activeChips.forEach(chip => {
                console.log('initUnderlines: Processing active chip', chip.textContent);
                if (window.moveUnderline) {
                    window.moveUnderline(chip);
                } else {
                    console.error('initUnderlines: moveUnderline function not found!');
        }
            });
        } else {
            console.log('initUnderlines: No active chips, activating "all" chips');
            // If no active chips, find and activate the first "all" chip in each group
            const filterGroups = dropdown.querySelectorAll('.filter-options');
            console.log('initUnderlines: Found', filterGroups.length, 'filter groups');
            filterGroups.forEach((group, index) => {
                const allChip = group.querySelector('.filter-chip[data-value="all"]');
                if (allChip) {
                    console.log('initUnderlines: Activating "all" chip in group', index);
                    allChip.classList.add('active');
                    if (window.moveUnderline) {
                        window.moveUnderline(allChip);
                    }
                } else {
                    console.warn('initUnderlines: No "all" chip found in group', index);
                }
            });
        }
    }
    
    // Always initialize on load
    console.log('initMarketplaceFilterDropdown: Setting up initialization');
    setTimeout(() => {
        console.log('initMarketplaceFilterDropdown: Running initUnderlines');
    initUnderlines();
    }, 100);
    
    // Recalculate underline positions on window resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (dropdown.style.display !== 'none') {
                initUnderlines();
            }
        }, 100);
    });
    
    // Watch for dropdown visibility changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const display = dropdown.style.display;
                if (display === 'block' || display === '') {
                    setTimeout(() => {
                        initUnderlines();
                    }, 50);
                }
            }
        });
    });
    
    observer.observe(dropdown, {
        attributes: true,
        attributeFilter: ['style']
    });
    
    // Recalculate on scroll (for mobile horizontal scroll)
    const filterOptions = dropdown.querySelectorAll('.filter-options');
    filterOptions.forEach(container => {
        container.addEventListener('scroll', function() {
            const activeChip = container.querySelector('.filter-chip.active');
            if (activeChip) {
                window.moveUnderline(activeChip);
            }
        });
    });
    
    // Filter chip clicks
    if (filterChips) {
        filterChips.forEach(chip => {
            chip.addEventListener('click', function() {
                const filterType = this.getAttribute('data-filter-type');
                const value = this.getAttribute('data-value');
                
                // Remove active from siblings of same type
                const siblings = dropdown.querySelectorAll(`[data-filter-type="${filterType}"]`);
                siblings.forEach(sibling => sibling.classList.remove('active'));
                
                // Add active to clicked chip
                this.classList.add('active');
                
                // Move underline to new position - with delay to ensure layout is ready
                setTimeout(() => {
                    if (window.moveUnderline) {
                window.moveUnderline(this);
                    }
                }, 10);
                
                // Apply filter immediately
                if (window.marketplace) {
                    window.marketplace.currentFilters[filterType] = value;
                    window.marketplace.applyFilters();
                }
            });
        });
    }

}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMarketplaceFilterDropdown);
} else {
    initMarketplaceFilterDropdown();
}

