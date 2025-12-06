// Settings Sync Module
// Syncs preferences section toggles with settings section toggles (bidirectional)

(function() {
    // Mapping between preferences IDs and settings IDs
    const toggleMapping = {
        'emailNotificationsToggle': 'emailNotifications',
        'pushNotificationsPref': 'pushNotifications',
        'courseUpdatesPref': 'courseUpdates',
        'assignmentRemindersPref': 'assignmentReminders',
        'studyRemindersPref': 'studyReminders',
        'animationsPref': 'animations',
        'compactSidebarPref': 'compactSidebar',
        'autoPlayVideosPref': 'autoPlayVideos',
        'progressTrackingPref': 'progressTracking',
        'languagePref': 'language',
        'timezonePref': 'timezone'
    };
    
    // Sync function
    function syncToggles(sourceId, targetId) {
        const source = document.getElementById(sourceId);
        const target = document.getElementById(targetId);
        if (source && target) {
            if (source.type === 'checkbox') {
                target.checked = source.checked;
            } else if (source.tagName === 'SELECT') {
                target.value = source.value;
            }
        }
    }
    
    // Set up bidirectional syncing
    function setupSync() {
        Object.keys(toggleMapping).forEach(prefId => {
            const settingsId = toggleMapping[prefId];
            const prefElement = document.getElementById(prefId);
            const settingsElement = document.getElementById(settingsId);
            
            if (prefElement && settingsElement) {
                // Sync from preferences to settings
                prefElement.addEventListener('change', function() {
                    syncToggles(prefId, settingsId);
                });
                
                // Sync from settings to preferences
                settingsElement.addEventListener('change', function() {
                    syncToggles(settingsId, prefId);
                });
            }
        });
    }
    
    // Load settings and sync on page load
    function loadAndSyncSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('dashboardSettings') || '{}');
            
            // Sync checkbox states
            Object.keys(toggleMapping).forEach(prefId => {
                const settingsId = toggleMapping[prefId];
                const prefElement = document.getElementById(prefId);
                const settingsElement = document.getElementById(settingsId);
                
                if (prefElement && settingsElement) {
                    const settingKey = settingsId.replace(/([A-Z])/g, '_$1').toLowerCase();
                    const value = settings[settingsId] || settings[settingKey];
                    
                    if (prefElement.type === 'checkbox') {
                        const checked = value !== undefined ? value : (settingsElement.checked || false);
                        prefElement.checked = checked;
                        settingsElement.checked = checked;
                    } else if (prefElement.tagName === 'SELECT') {
                        const val = value || settingsElement.value || prefElement.value;
                        prefElement.value = val;
                        settingsElement.value = val;
                    }
                }
            });
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                setupSync();
                loadAndSyncSettings();
            }, 500);
        });
    } else {
        setTimeout(function() {
            setupSync();
            loadAndSyncSettings();
        }, 500);
    }
})();

