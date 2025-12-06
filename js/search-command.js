// Header Search Autocomplete Functionality
(function() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        const headerSearchInput = document.getElementById('headerSearchInput');
        const headerSearchDropdown = document.getElementById('headerSearchDropdown');
        const headerSearchSuggestions = document.getElementById('headerSearchSuggestions');
        const headerSearchClear = document.getElementById('headerSearchClear');
        
        if (!headerSearchInput || !headerSearchDropdown || !headerSearchSuggestions) {
            return; // Elements not found, exit early
        }
        
        // Define all searchable items including profile subsections
        const searchItems = [
            // Main Sections
            { title: 'Overview', section: 'overview', type: 'section', icon: 'grid' },
            { title: 'My Programs', section: 'programs', type: 'section', icon: 'book' },
            { title: 'Progress', section: 'progress', type: 'section', icon: 'activity' },
            { title: 'Resources', section: 'resources', type: 'section', icon: 'book' },
            { title: 'Marketplace', section: 'marketplace', type: 'section', icon: 'shopping' },
            { title: 'Tasks', section: 'tasks', type: 'section', icon: 'check' },
            { title: 'Notes', section: 'notes', type: 'section', icon: 'file-text' },
            { title: 'Payment', section: 'payment', type: 'section', icon: 'card' },
            { title: 'Help', section: 'help', type: 'section', icon: 'help' },
            { title: 'Profile', section: 'profile', type: 'section', icon: 'user' },
            { title: 'Settings', section: 'settings', type: 'section', icon: 'settings' },
            
            // Progress Subsections
            { title: 'Progress Chart', section: 'progress', subsection: 'chartSection', type: 'subsection', icon: 'activity', meta: 'Progress' },
            { title: 'Progress Stats', section: 'progress', subsection: 'statsSection', type: 'subsection', icon: 'activity', meta: 'Progress' },
            { title: 'Activity', section: 'progress', subsection: 'activitySection', type: 'subsection', icon: 'activity', meta: 'Progress' },
            
            // Progress Stats Fields
            { title: 'Total Learning Time', section: 'progress', subsection: 'statsSection', type: 'field', icon: 'activity', meta: 'Progress Stats', fieldLabel: 'Total Learning Time' },
            { title: 'Courses Enrolled', section: 'progress', subsection: 'statsSection', type: 'field', icon: 'activity', meta: 'Progress Stats', fieldLabel: 'Courses Enrolled' },
            { title: 'Courses Completed', section: 'progress', subsection: 'statsSection', type: 'field', icon: 'activity', meta: 'Progress Stats', fieldLabel: 'Courses Completed' },
            { title: 'Current Streak', section: 'progress', subsection: 'statsSection', type: 'field', icon: 'activity', meta: 'Progress Stats', fieldLabel: 'Current Streak' },
            { title: 'Last Active', section: 'progress', subsection: 'statsSection', type: 'field', icon: 'activity', meta: 'Progress Stats', fieldLabel: 'Last Active' },
            
            // Programs Subsections
            { title: 'All Programs', section: 'programs', subsection: 'allProgramsSection', type: 'subsection', icon: 'book', meta: 'Programs' },
            { title: 'Not Started', section: 'programs', subsection: 'notStartedSection', type: 'subsection', icon: 'book', meta: 'Programs' },
            { title: 'In Progress', section: 'programs', subsection: 'inProgressSection', type: 'subsection', icon: 'book', meta: 'Programs' },
            { title: 'Completed', section: 'programs', subsection: 'completedSection', type: 'subsection', icon: 'award', meta: 'Programs' },
            
            // Payment Subsections
            { title: 'Subscription', section: 'payment', subsection: 'subscriptionInfoSection', type: 'subsection', icon: 'card', meta: 'Payment' },
            { title: 'Plans', section: 'payment', subsection: 'plansSection', type: 'subsection', icon: 'card', meta: 'Payment' },
            { title: 'Payment Method', section: 'payment', subsection: 'paymentMethodSection', type: 'subsection', icon: 'card', meta: 'Payment' },
            { title: 'Billing History', section: 'payment', subsection: 'billingHistorySection', type: 'subsection', icon: 'card', meta: 'Payment' },
            
            // Profile Subsections
            { title: 'Personal Information', section: 'profile', subsection: 'personalInfoSection', type: 'subsection', icon: 'user', meta: 'Profile' },
            { title: 'Google Account', section: 'profile', subsection: 'googleAccountSection', type: 'subsection', icon: 'user', meta: 'Profile' },
            { title: 'Preferences', section: 'profile', subsection: 'preferencesSection', type: 'subsection', icon: 'sliders', meta: 'Profile' },
            { title: 'Advanced', section: 'profile', subsection: 'advancedSection', type: 'subsection', icon: 'settings', meta: 'Profile' },
            { title: 'Security', section: 'profile', subsection: 'securitySection', type: 'subsection', icon: 'shield', meta: 'Profile' },
            { title: 'Privacy', section: 'profile', subsection: 'privacySection', type: 'subsection', icon: 'lock', meta: 'Profile' },
            { title: 'Active Sessions', section: 'profile', subsection: 'sessionsSection', type: 'subsection', icon: 'monitor', meta: 'Profile' },
            { title: 'Notifications', section: 'profile', subsection: 'notificationsSection', type: 'subsection', icon: 'bell', meta: 'Profile' },
            { title: 'Appearance', section: 'profile', subsection: 'appearanceSection', type: 'subsection', icon: 'eye', meta: 'Profile' },
            
            // Personal Info Fields
            { title: 'Name', section: 'profile', subsection: 'personalInfoSection', type: 'field', icon: 'user', meta: 'Personal Info', fieldLabel: 'Name' },
            { title: 'Email', section: 'profile', subsection: 'personalInfoSection', type: 'field', icon: 'user', meta: 'Personal Info', fieldLabel: 'Email' },
            { title: 'Password', section: 'profile', subsection: 'personalInfoSection', type: 'field', icon: 'lock', meta: 'Personal Info', fieldLabel: 'Password' },
            { title: 'Contact', section: 'profile', subsection: 'personalInfoSection', type: 'field', icon: 'user', meta: 'Personal Info', fieldLabel: 'Contact' },
            { title: 'Job Title', section: 'profile', subsection: 'personalInfoSection', type: 'field', icon: 'user', meta: 'Personal Info', fieldLabel: 'Job Title' },
            { title: 'Location', section: 'profile', subsection: 'personalInfoSection', type: 'field', icon: 'user', meta: 'Personal Info', fieldLabel: 'Location' },
            { title: 'Website', section: 'profile', subsection: 'personalInfoSection', type: 'field', icon: 'user', meta: 'Personal Info', fieldLabel: 'Website' },
            { title: 'Bio', section: 'profile', subsection: 'personalInfoSection', type: 'field', icon: 'user', meta: 'Personal Info', fieldLabel: 'Bio' },
            { title: 'Learning Goals', section: 'profile', subsection: 'personalInfoSection', type: 'field', icon: 'user', meta: 'Personal Info', fieldLabel: 'Learning Goals' },
            { title: 'Social Links', section: 'profile', subsection: 'personalInfoSection', type: 'field', icon: 'user', meta: 'Personal Info', fieldLabel: 'Social Links' },
            
            // Google Account Fields
            { title: 'Member Since', section: 'profile', subsection: 'googleAccountSection', type: 'field', icon: 'user', meta: 'Account', fieldLabel: 'Member Since' },
            { title: 'Account Type', section: 'profile', subsection: 'googleAccountSection', type: 'field', icon: 'user', meta: 'Account', fieldLabel: 'Account Type' },
            { title: 'Programs Enrolled', section: 'profile', subsection: 'googleAccountSection', type: 'field', icon: 'user', meta: 'Account', fieldLabel: 'Programs Enrolled' },
            { title: 'Sign-In Method', section: 'profile', subsection: 'googleAccountSection', type: 'field', icon: 'user', meta: 'Account', fieldLabel: 'Sign-In Method' },
            { title: 'Google Account', section: 'profile', subsection: 'googleAccountSection', type: 'field', icon: 'user', meta: 'Account', fieldLabel: 'Google Account' },
            
            // Preferences Items
            { title: 'Email Notifications', section: 'profile', subsection: 'preferencesSection', type: 'field', icon: 'bell', meta: 'Preferences', fieldLabel: 'Email Notifications' },
            { title: 'Marketing Emails', section: 'profile', subsection: 'preferencesSection', type: 'field', icon: 'bell', meta: 'Preferences', fieldLabel: 'Marketing Emails' },
            { title: 'Push Notifications', section: 'profile', subsection: 'preferencesSection', type: 'field', icon: 'bell', meta: 'Preferences', fieldLabel: 'Push Notifications' },
            { title: 'Course Updates', section: 'profile', subsection: 'preferencesSection', type: 'field', icon: 'book', meta: 'Preferences', fieldLabel: 'Course Updates' },
            { title: 'Assignment Reminders', section: 'profile', subsection: 'preferencesSection', type: 'field', icon: 'check', meta: 'Preferences', fieldLabel: 'Assignment Reminders' },
            { title: 'Study Reminders', section: 'profile', subsection: 'preferencesSection', type: 'field', icon: 'check', meta: 'Preferences', fieldLabel: 'Study Reminders' },
            { title: 'Animations', section: 'profile', subsection: 'preferencesSection', type: 'field', icon: 'eye', meta: 'Preferences', fieldLabel: 'Animations' },
            { title: 'Compact Sidebar', section: 'profile', subsection: 'preferencesSection', type: 'field', icon: 'settings', meta: 'Preferences', fieldLabel: 'Compact Sidebar' },
            { title: 'Auto-play Videos', section: 'profile', subsection: 'preferencesSection', type: 'field', icon: 'settings', meta: 'Preferences', fieldLabel: 'Auto-play Videos' },
            // Note: Progress Tracking, Language, and Timezone removed - they exist in Settings section
            
            // Payment Fields
            { title: 'Payment Method', section: 'payment', subsection: 'paymentMethodSection', type: 'field', icon: 'card', meta: 'Payment', fieldLabel: 'Payment Method' },
            { title: 'Billing Address', section: 'payment', subsection: 'paymentMethodSection', type: 'field', icon: 'card', meta: 'Payment', fieldLabel: 'Billing Address' },
            { title: 'Manage Payment Method', section: 'payment', subsection: 'paymentMethodSection', type: 'field', icon: 'card', meta: 'Payment', fieldLabel: 'Actions' },
            
            // Advanced Section Fields
            // Note: Language and Timezone removed - they already exist in preferencesSection
            // Note: Profile Visibility, Activity Status, Show Email Publicly removed - they exist in privacySection
            // Note: Two-Factor Authentication removed - it exists in securitySection
            { title: 'Active Sessions', section: 'profile', subsection: 'advancedSection', type: 'field', icon: 'monitor', meta: 'Advanced', fieldLabel: 'Active Sessions' },
            { title: 'Data Management', section: 'profile', subsection: 'advancedSection', type: 'field', icon: 'settings', meta: 'Advanced', fieldLabel: 'Data Management' },
            { title: 'Download My Data', section: 'profile', subsection: 'advancedSection', type: 'field', icon: 'settings', meta: 'Advanced', fieldLabel: 'Data Management' },
            { title: 'Delete Account', section: 'profile', subsection: 'advancedSection', type: 'field', icon: 'settings', meta: 'Advanced', fieldLabel: 'Data Management' },
            
            // Security Section Fields
            { title: 'Current Password', section: 'profile', subsection: 'securitySection', type: 'field', icon: 'shield', meta: 'Security', fieldLabel: 'Current Password' },
            { title: 'Two-Factor Authentication', section: 'profile', subsection: 'securitySection', type: 'field', icon: 'shield', meta: 'Security', fieldLabel: 'Two-Factor Authentication' },
            { title: 'Last Password Change', section: 'profile', subsection: 'securitySection', type: 'field', icon: 'shield', meta: 'Security', fieldLabel: 'Last Password Change' },
            
            // Privacy Section Fields
            // Note: These are the primary locations for these fields within profile section
            { title: 'Profile Visibility', section: 'profile', subsection: 'privacySection', type: 'field', icon: 'lock', meta: 'Privacy', fieldLabel: 'Profile Visibility' },
            { title: 'Show Email Publicly', section: 'profile', subsection: 'privacySection', type: 'field', icon: 'lock', meta: 'Privacy', fieldLabel: 'Show Email Publicly' },
            { title: 'Activity Status', section: 'profile', subsection: 'privacySection', type: 'field', icon: 'lock', meta: 'Privacy', fieldLabel: 'Activity Status' },
            
            // Sessions Section Fields
            { title: 'Current Session', section: 'profile', subsection: 'sessionsSection', type: 'field', icon: 'monitor', meta: 'Sessions', fieldLabel: 'Current Session' },
            { title: 'Last Active', section: 'profile', subsection: 'sessionsSection', type: 'field', icon: 'monitor', meta: 'Sessions', fieldLabel: 'Last Active' },
            { title: 'Browser', section: 'profile', subsection: 'sessionsSection', type: 'field', icon: 'monitor', meta: 'Sessions', fieldLabel: 'Browser' },
            
            // Notifications Section Fields (Profile)
            { title: 'Email Notifications', section: 'profile', subsection: 'notificationsSection', type: 'field', icon: 'bell', meta: 'Notifications', fieldLabel: 'Email Notifications' },
            { title: 'Push Notifications', section: 'profile', subsection: 'notificationsSection', type: 'field', icon: 'bell', meta: 'Notifications', fieldLabel: 'Push Notifications' },
            { title: 'Course Updates', section: 'profile', subsection: 'notificationsSection', type: 'field', icon: 'bell', meta: 'Notifications', fieldLabel: 'Course Updates' },
            
            // Settings Section Fields
            // Notifications
            { title: 'Email Notifications', section: 'settings', type: 'field', icon: 'bell', meta: 'Settings', fieldLabel: 'Email Notifications' },
            { title: 'Push Notifications', section: 'settings', type: 'field', icon: 'bell', meta: 'Settings', fieldLabel: 'Push Notifications' },
            { title: 'Course Updates', section: 'settings', type: 'field', icon: 'book', meta: 'Settings', fieldLabel: 'Course Updates' },
            { title: 'Assignment Reminders', section: 'settings', type: 'field', icon: 'check', meta: 'Settings', fieldLabel: 'Assignment Reminders' },
            { title: 'Study Reminders', section: 'settings', type: 'field', icon: 'check', meta: 'Settings', fieldLabel: 'Study Reminders' },
            
            // Appearance - add multiple search terms for light mode
            { title: 'Always on Light Mode', section: 'settings', type: 'field', icon: 'eye', meta: 'Settings', fieldLabel: 'Always on Light Mode' },
            { title: 'Light Mode', section: 'settings', type: 'field', icon: 'eye', meta: 'Settings', fieldLabel: 'Always on Light Mode' },
            { title: 'Dark Mode', section: 'settings', type: 'field', icon: 'eye', meta: 'Settings', fieldLabel: 'Always on Light Mode' },
            { title: 'Theme', section: 'settings', type: 'field', icon: 'eye', meta: 'Settings', fieldLabel: 'Always on Light Mode' },
            { title: 'Animations', section: 'settings', type: 'field', icon: 'eye', meta: 'Settings', fieldLabel: 'Animations' },
            { title: 'Compact Sidebar', section: 'settings', type: 'field', icon: 'settings', meta: 'Settings', fieldLabel: 'Compact Sidebar' },
            { title: 'Auto-play Videos', section: 'settings', type: 'field', icon: 'settings', meta: 'Settings', fieldLabel: 'Auto-play Videos' },
            
            // Privacy
            { title: 'Profile Visibility', section: 'settings', type: 'field', icon: 'lock', meta: 'Settings', fieldLabel: 'Profile Visibility' },
            { title: 'Activity Status', section: 'settings', type: 'field', icon: 'monitor', meta: 'Settings', fieldLabel: 'Activity Status' },
            { title: 'Data Analytics', section: 'settings', type: 'field', icon: 'activity', meta: 'Settings', fieldLabel: 'Data Analytics' },
            
            // Learning & Regional
            { title: 'Progress Tracking', section: 'settings', type: 'field', icon: 'activity', meta: 'Settings', fieldLabel: 'Progress Tracking' },
            { title: 'Language', section: 'settings', type: 'field', icon: 'settings', meta: 'Settings', fieldLabel: 'Language' },
            { title: 'Timezone', section: 'settings', type: 'field', icon: 'settings', meta: 'Settings', fieldLabel: 'Timezone' }
        ];
        
        // Search and filter items
        function performSearch(query) {
            if (!query) return [];
            
            const lowercaseQuery = query.toLowerCase();
            const matches = searchItems.filter(item => {
                const titleMatch = item.title.toLowerCase().includes(lowercaseQuery);
                const metaMatch = item.meta && item.meta.toLowerCase().includes(lowercaseQuery);
                const fieldLabelMatch = item.fieldLabel && item.fieldLabel.toLowerCase().includes(lowercaseQuery);
                
                return titleMatch || metaMatch || fieldLabelMatch;
            });
            
            // Sort matches by priority: sections > subsections > fields
            // Then by settings vs profile priority
            // Then by preferencesSection vs notificationsSection (preferencesSection has priority)
            const typePriority = { 'section': 1, 'subsection': 2, 'field': 3 };
            
            const sortedMatches = matches.sort((a, b) => {
                // First priority: type (section > subsection > field)
                const typeDiff = typePriority[a.type] - typePriority[b.type];
                if (typeDiff !== 0) return typeDiff;
                
                // Second priority: settings has higher priority over profile (for same type)
                if (a.section === 'settings' && b.section === 'profile') return -1;
                if (a.section === 'profile' && b.section === 'settings') return 1;
                
                // Third priority: subsection priority within same section (profile)
                // preferencesSection > privacySection > securitySection > advancedSection > notificationsSection
                const subsectionPriority = {
                    'preferencesSection': 1,
                    'privacySection': 2,
                    'securitySection': 3,
                    'advancedSection': 4,
                    'notificationsSection': 5
                };
                
                if (a.section === 'profile' && b.section === 'profile' && a.subsection && b.subsection) {
                    const aPriority = subsectionPriority[a.subsection] || 99;
                    const bPriority = subsectionPriority[b.subsection] || 99;
                    if (aPriority !== bPriority) return aPriority - bPriority;
                }
                
                // Also handle preferencesSection vs notificationsSection for backwards compatibility
                if (a.subsection === 'preferencesSection' && b.subsection === 'notificationsSection') return -1;
                if (a.subsection === 'notificationsSection' && b.subsection === 'preferencesSection') return 1;
                
                return 0;
            });
            
            // Remove duplicates - keep first occurrence (which will be highest priority)
            const uniqueMatches = [];
            const seen = new Set();
            
            sortedMatches.forEach(item => {
                // Create a key that identifies the same field across different sections/subsections
                // For fields, use lowercase fieldLabel to ensure case-insensitive matching
                // For subsections/sections, use section + subsection/title
                let key;
                if (item.fieldLabel) {
                    // Use lowercase fieldLabel for case-insensitive deduplication
                    // This ensures Language/Timezone/etc only appear once regardless of section
                    key = item.fieldLabel.toLowerCase().trim();
                } else if (item.subsection) {
                    key = `${item.section}-${item.subsection}`.toLowerCase();
                } else {
                    key = `${item.section}-${item.title}`.toLowerCase();
                }
                
                // Only add if we haven't seen this key before
                // This ensures no duplicates appear in search results
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueMatches.push(item);
                }
                // If duplicate found, skip it (already handled by seen.has check above)
            });
            
            return uniqueMatches.slice(0, 12);
        }
        
        // Highlight matching text
        function highlightMatch(text, query) {
            const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            return text.replace(regex, '<span class="search-highlight">$1</span>');
        }
        
        let selectedIndex = -1;
        let currentMatches = [];
        
        // Show suggestions
        function showSuggestions(query) {
            currentMatches = performSearch(query);
            
            if (currentMatches.length === 0) {
                headerSearchDropdown.classList.remove('show');
                selectedIndex = -1;
                return;
            }
            
            selectedIndex = -1;
            headerSearchSuggestions.innerHTML = currentMatches.map((item, index) => `
                <div class="header-search-item" data-section="${item.section}" ${item.subsection ? `data-subsection="${item.subsection}"` : ''} ${item.fieldLabel ? `data-field-label="${item.fieldLabel}"` : ''} data-index="${index}">
                    <div class="header-search-item-content">
                        <div class="header-search-item-title">${highlightMatch(item.title, query)}</div>
                        ${item.meta ? `<div class="header-search-item-meta">${item.meta}</div>` : ''}
                    </div>
                </div>
            `).join('');
            
            headerSearchDropdown.classList.add('show');
            
            // Add click handlers to search items
            const searchItemElements = headerSearchSuggestions.querySelectorAll('.header-search-item');
            searchItemElements.forEach(el => {
                el.addEventListener('click', function() {
                    handleSearchItemClick(this);
                });
            });
            
            // Update scroll container max height
            headerSearchSuggestions.style.maxHeight = '400px';
            headerSearchSuggestions.style.overflowY = 'auto';
        }
        
        // Handle search item click
        function handleSearchItemClick(element) {
            const section = element.getAttribute('data-section');
            const subsection = element.getAttribute('data-subsection');
            const fieldLabel = element.getAttribute('data-field-label');
            
            // Clear search first
            headerSearchInput.value = '';
            if (headerSearchClear) {
                headerSearchClear.style.display = 'none';
            }
            headerSearchDropdown.classList.remove('show');
            selectedIndex = -1;
            
            // Set flag to prevent scroll to top
            window._isSearchNavigation = true;
            
            // Navigate to section first
            if (typeof navigateToSection === 'function') {
                navigateToSection(section, true); // Pass skipScroll flag
            }
            
            // Wait for navigation to complete, then handle subsection/field
            setTimeout(() => {
                // If there's a field label, scroll to it and highlight
                if (fieldLabel) {
                    // If there's a subsection, navigate to it first
                    if (subsection) {
                        navigateToProfileSubsection(subsection);
                        setTimeout(() => {
                            scrollToAndHighlightField(fieldLabel, section); // Pass section to ensure we only find field in correct section
                            window._isSearchNavigation = false;
                        }, 500);
                    } else {
                        // No subsection, just scroll to field (for settings section)
                        // Wait longer for settings section to be fully visible
                        setTimeout(() => {
                            scrollToAndHighlightField(fieldLabel, section); // Pass section to ensure we only find field in correct section
                            window._isSearchNavigation = false;
                        }, 600);
                    }
                } else if (subsection) {
                    // No field, but has subsection - navigate to it
                    navigateToProfileSubsection(subsection);
                    setTimeout(() => {
                        window._isSearchNavigation = false;
                    }, 300);
                } else {
                    // No subsection, just navigate to the main section
                    setTimeout(() => {
                        window._isSearchNavigation = false;
                    }, 300);
                }
            }, 300);
        }
        
        // Scroll to and highlight a field by its label text
        function scrollToAndHighlightField(labelText, targetSection) {
            // Find all profile field labels, but only in the target section
            let searchContainer = null;
            if (targetSection === 'settings') {
                searchContainer = document.getElementById('settings');
            } else if (targetSection === 'profile') {
                searchContainer = document.getElementById('profile');
            }
            
            // If we have a specific section, only search within it
            const labels = searchContainer 
                ? searchContainer.querySelectorAll('.profile-field-label')
                : document.querySelectorAll('.profile-field-label');
            
            // Find the label that matches (exact match first, then partial)
            let targetField = null;
            
            // First try exact match
            labels.forEach(label => {
                if (label.textContent.trim() === labelText) {
                    const field = label.closest('.profile-field');
                    // Double-check it's in the right section
                    if (!targetSection || 
                        (targetSection === 'settings' && field.closest('#settings')) ||
                        (targetSection === 'profile' && field.closest('#profile'))) {
                        targetField = field;
                    }
                }
            });
            
            // If no exact match, try case-insensitive partial match
            if (!targetField) {
                const lowerLabelText = labelText.toLowerCase();
                labels.forEach(label => {
                    if (label.textContent.trim().toLowerCase().includes(lowerLabelText) || 
                        lowerLabelText.includes(label.textContent.trim().toLowerCase())) {
                        const field = label.closest('.profile-field');
                        // Double-check it's in the right section
                        if (!targetSection || 
                            (targetSection === 'settings' && field.closest('#settings')) ||
                            (targetSection === 'profile' && field.closest('#profile'))) {
                            targetField = field;
                        }
                    }
                });
            }
            
            if (targetField) {
                // Ensure subsection is visible (for profile sections)
                const subsection = targetField.closest('.profile-subsection');
                if (subsection) {
                    subsection.style.display = 'block';
                    subsection.classList.add('active');
                }
                
                // Ensure settings section is visible (for settings fields)
                const settingsSection = targetField.closest('#settings');
                if (settingsSection) {
                    // Make sure settings section is active
                    const allSections = document.querySelectorAll('.content-section');
                    allSections.forEach(section => section.classList.remove('active'));
                    settingsSection.classList.add('active');
                    
                    // Update nav items
                    const navLinks = document.querySelectorAll('.nav-link');
                    navLinks.forEach(link => {
                        link.parentElement.classList.remove('active');
                        if (link.getAttribute('data-section') === 'settings') {
                            link.parentElement.classList.add('active');
                        }
                    });
                    
                    // Update header title
                    if (typeof updateHeaderTitle === 'function') {
                        updateHeaderTitle('settings');
                    }
                }
                
                // Scroll to the field - use scrollIntoView for reliability
                // First ensure the field is visible
                requestAnimationFrame(() => {
                    // Scroll to the field using scrollIntoView
                    targetField.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center',
                        inline: 'nearest'
                    });
                    
                    // Add highlight after scroll starts
                    setTimeout(() => {
                        targetField.classList.add('search-highlight-field');
                        
                        // Also highlight the settings section title if it exists
                        const settingsSection = targetField.closest('.settings-section');
                        if (settingsSection) {
                            const sectionTitle = settingsSection.querySelector('.settings-section-title');
                            if (sectionTitle) {
                                sectionTitle.classList.add('search-highlight-title');
                                
                                // Remove title highlight after 3 seconds (fade will happen via CSS transition)
                                setTimeout(() => {
                                    sectionTitle.classList.remove('search-highlight-title');
                                }, 3000);
                            }
                        }
                        
                        // Remove highlight after 3 seconds (fade will happen via CSS transition)
                        setTimeout(() => {
                            targetField.classList.remove('search-highlight-field');
                        }, 3000);
                    }, 300);
                });
            }
        }
        
        // Update selected item highlight
        function updateSelectedItem() {
            const items = headerSearchSuggestions.querySelectorAll('.header-search-item');
            items.forEach((item, index) => {
                if (index === selectedIndex) {
                    item.classList.add('selected');
                    // Scroll into view
                    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    item.classList.remove('selected');
                }
            });
        }
        
        // Handle keyboard navigation
        function handleKeyboardNavigation(e) {
            if (!headerSearchDropdown.classList.contains('show')) return;
            
            const items = headerSearchSuggestions.querySelectorAll('.header-search-item');
            if (items.length === 0) return;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % items.length;
                updateSelectedItem();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
                updateSelectedItem();
            } else if (e.key === 'Enter' && selectedIndex >= 0) {
                e.preventDefault();
                const selectedItem = items[selectedIndex];
                if (selectedItem) {
                    handleSearchItemClick(selectedItem);
                }
            }
        }
        
        // Navigate to profile subsection
        function navigateToProfileSubsection(subsectionId) {
            const profileNavItems = document.querySelectorAll('.profile-nav-item');
            const profileSubsections = document.querySelectorAll('.profile-subsection');
            const profileTabs = document.querySelectorAll('.profile-tab');
            
            // Also check for progress tabs, programs tabs, payment tabs, etc.
            const progressNavBtns = document.querySelectorAll('.progress-nav-btn');
            const programsNavBtns = document.querySelectorAll('.payment-nav-btn[data-programs-section]');
            const paymentNavBtns = document.querySelectorAll('.payment-nav-btn[data-payment-section]');
            
            // Find the corresponding nav item
            const targetNavItem = Array.from(profileNavItems).find(item => 
                item.getAttribute('data-section') === subsectionId
            );
            
            // Also activate the corresponding profile tab if it exists
            const targetTab = Array.from(profileTabs).find(tab => 
                tab.getAttribute('data-section') === subsectionId
            );
            
            // Check for progress section tabs
            const progressNavBtn = Array.from(progressNavBtns).find(btn => 
                btn.getAttribute('data-progress-section') === subsectionId
            );
            
            // Check for programs section tabs
            const programsNavBtn = Array.from(programsNavBtns).find(btn => 
                btn.getAttribute('data-programs-section') === subsectionId
            );
            
            // Check for payment section tabs
            const paymentNavBtn = Array.from(paymentNavBtns).find(btn => 
                btn.getAttribute('data-payment-section') === subsectionId
            );
            
            if (targetTab) {
                // Remove active class from all tabs
                profileTabs.forEach(tab => tab.classList.remove('active'));
                // Add active class to target tab
                targetTab.classList.add('active');
                
                // Move the profile tab indicator (purple slider)
                const profileTabsContainer = targetTab.closest('.profile-tabs');
                if (profileTabsContainer) {
                    const indicator = profileTabsContainer.querySelector('.profile-tab-indicator');
                    if (indicator) {
                        // Function to update indicator position
                        const updateIndicator = () => {
                            const tabRect = targetTab.getBoundingClientRect();
                            const containerRect = profileTabsContainer.getBoundingClientRect();
                            const left = tabRect.left - containerRect.left;
                            const width = tabRect.width;
                            
                            indicator.style.left = `${left}px`;
                            indicator.style.width = `${width}px`;
                            indicator.style.display = 'block';
                            indicator.style.opacity = '1';
                            indicator.style.visibility = 'visible';
                        };
                        
                        // Use requestAnimationFrame to ensure layout is ready
                        requestAnimationFrame(updateIndicator);
                        
                        // Also try multiple times to ensure it works after DOM updates
                        setTimeout(updateIndicator, 50);
                        setTimeout(updateIndicator, 150);
                        setTimeout(updateIndicator, 300);
                    }
                }
            }
            
            // Handle progress section tabs
            if (progressNavBtn) {
                progressNavBtns.forEach(btn => btn.classList.remove('progress-nav-active'));
                progressNavBtn.classList.add('progress-nav-active');
                
                // Move underline - use same approach as profile tabs
                const progressNavContainer = progressNavBtn.closest('.progress-nav-container');
                if (progressNavContainer) {
                    const underline = progressNavContainer.querySelector('.progress-nav-underline');
                    if (underline) {
                        // Function to update underline position
                        const updateUnderline = () => {
                            const btnRect = progressNavBtn.getBoundingClientRect();
                            const containerRect = progressNavContainer.getBoundingClientRect();
                            const left = btnRect.left - containerRect.left;
                            const width = btnRect.width;
                            
                            underline.style.left = `${left}px`;
                            underline.style.width = `${width}px`;
                            underline.style.display = 'block';
                            underline.style.opacity = '1';
                            underline.style.visibility = 'visible';
                        };
                        
                        // Use requestAnimationFrame to ensure layout is ready
                        requestAnimationFrame(updateUnderline);
                        
                        // Also try multiple times to ensure it works after DOM updates
                        setTimeout(updateUnderline, 50);
                        setTimeout(updateUnderline, 150);
                        setTimeout(updateUnderline, 300);
                    }
                }
            }
            
            // Handle programs section tabs
            if (programsNavBtn) {
                programsNavBtns.forEach(btn => btn.classList.remove('payment-nav-active'));
                programsNavBtn.classList.add('payment-nav-active');
                
                // Move underline - use same approach as profile tabs
                const programsNavContainer = programsNavBtn.closest('.payment-nav-container');
                if (programsNavContainer) {
                    const underline = programsNavContainer.querySelector('.payment-nav-underline');
                    if (underline) {
                        // Function to update underline position
                        const updateUnderline = () => {
                            const btnRect = programsNavBtn.getBoundingClientRect();
                            const containerRect = programsNavContainer.getBoundingClientRect();
                            const left = btnRect.left - containerRect.left;
                            const width = btnRect.width;
                            
                            underline.style.left = `${left}px`;
                            underline.style.width = `${width}px`;
                            underline.style.display = 'block';
                            underline.style.opacity = '1';
                            underline.style.visibility = 'visible';
                        };
                        
                        // Use requestAnimationFrame to ensure layout is ready
                        requestAnimationFrame(updateUnderline);
                        
                        // Also try multiple times to ensure it works after DOM updates
                        setTimeout(updateUnderline, 50);
                        setTimeout(updateUnderline, 150);
                        setTimeout(updateUnderline, 300);
                    }
                }
                
                // Also trigger programs filter update if function exists
                if (typeof window.updateProgramsFilter === 'function') {
                    const filterMap = {
                        'allProgramsSection': 'all',
                        'notStartedSection': 'not-started',
                        'inProgressSection': 'in-progress',
                        'completedSection': 'completed'
                    };
                    const filterType = filterMap[subsectionId];
                    if (filterType) {
                        setTimeout(() => {
                            window.updateProgramsFilter(filterType);
                        }, 100);
                    }
                }
            }
            
            // Handle payment section tabs
            if (paymentNavBtn) {
                paymentNavBtns.forEach(btn => btn.classList.remove('payment-nav-active'));
                paymentNavBtn.classList.add('payment-nav-active');
                
                // Move underline - use same approach as profile tabs
                const paymentNavContainer = paymentNavBtn.closest('.payment-nav-container');
                if (paymentNavContainer) {
                    const underline = paymentNavContainer.querySelector('.payment-nav-underline');
                    if (underline) {
                        // Function to update underline position
                        const updateUnderline = () => {
                            const btnRect = paymentNavBtn.getBoundingClientRect();
                            const containerRect = paymentNavContainer.getBoundingClientRect();
                            const left = btnRect.left - containerRect.left;
                            const width = btnRect.width;
                            
                            underline.style.left = `${left}px`;
                            underline.style.width = `${width}px`;
                            underline.style.display = 'block';
                            underline.style.opacity = '1';
                            underline.style.visibility = 'visible';
                        };
                        
                        // Use requestAnimationFrame to ensure layout is ready
                        requestAnimationFrame(updateUnderline);
                        
                        // Also try multiple times to ensure it works after DOM updates
                        setTimeout(updateUnderline, 50);
                        setTimeout(updateUnderline, 150);
                        setTimeout(updateUnderline, 300);
                    }
                }
            }
            
            if (targetNavItem) {
                // Remove active class from all nav items
                profileNavItems.forEach(nav => nav.classList.remove('active'));
                
                // Add active class to target item
                targetNavItem.classList.add('active');
            }
            
            // Hide all subsections (both profile and progress/programs)
            profileSubsections.forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active');
            });
            
            // Also handle progress/programs subsections
            const allSubsections = document.querySelectorAll('.profile-subsection');
            allSubsections.forEach(section => {
                if (section.id !== subsectionId) {
                    section.style.display = 'none';
                    section.classList.remove('active');
                }
            });
            
            // Show target subsection
            const targetSection = document.getElementById(subsectionId);
            if (targetSection) {
                targetSection.style.display = 'block';
                targetSection.classList.add('active');
            }
        }
        
        // Event listeners
        if (headerSearchInput) {
            headerSearchInput.addEventListener('input', function(e) {
                const query = e.target.value.trim();
                
                if (query) {
                    if (headerSearchClear) {
                        headerSearchClear.style.display = 'block';
                    }
                    showSuggestions(query);
                } else {
                    if (headerSearchClear) {
                        headerSearchClear.style.display = 'none';
                    }
                    headerSearchDropdown.classList.remove('show');
                    selectedIndex = -1;
                }
            });
            
            headerSearchInput.addEventListener('focus', function() {
                if (this.value.trim()) {
                    showSuggestions(this.value.trim());
                }
            });
            
            // Keyboard navigation
            headerSearchInput.addEventListener('keydown', function(e) {
                handleKeyboardNavigation(e);
            });
            
            // Keyboard shortcut: '/' to focus search
            document.addEventListener('keydown', function(e) {
                if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                    e.preventDefault();
                    headerSearchInput.focus();
                } else if (e.key === 'Escape' && document.activeElement === headerSearchInput) {
                    headerSearchInput.blur();
                    headerSearchDropdown.classList.remove('show');
                    selectedIndex = -1;
                }
            });
        }
        
        if (headerSearchClear) {
            headerSearchClear.addEventListener('click', function() {
                headerSearchInput.value = '';
                this.style.display = 'none';
                headerSearchDropdown.classList.remove('show');
                headerSearchInput.focus();
            });
        }
        
        // Click outside to close dropdown
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.header-search-bar')) {
                headerSearchDropdown.classList.remove('show');
            }
        });
    }
})();

