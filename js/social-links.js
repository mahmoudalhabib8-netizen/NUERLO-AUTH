// Social Links Module
// Handles loading, displaying, and managing social links in the profile section

// Helper function to detect social platform from URL and return icon info
function getSocialIconFromUrl(url) {
    if (!url || !url.trim()) return null;
    
    const urlLower = url.toLowerCase();
    
    // Twitter/X
    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
        return {
            icon: '/assets/images/twitter.png',
            alt: 'Twitter',
            platform: 'twitter'
        };
    }
    
    // LinkedIn
    if (urlLower.includes('linkedin.com')) {
        return {
            icon: '/assets/images/linkedin.png',
            alt: 'LinkedIn',
            platform: 'linkedin'
        };
    }
    
    // GitHub
    if (urlLower.includes('github.com')) {
        return {
            icon: null,
            alt: 'GitHub',
            platform: 'github',
            text: 'GitHub'
        };
    }
    
    // Instagram
    if (urlLower.includes('instagram.com')) {
        return {
            icon: '/assets/images/instagram.png',
            alt: 'Instagram',
            platform: 'instagram'
        };
    }
    
    // Facebook
    if (urlLower.includes('facebook.com')) {
        return {
            icon: '/assets/images/facebook.png',
            alt: 'Facebook',
            platform: 'facebook'
        };
    }
    
    // YouTube
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
        return {
            icon: '/assets/images/youtube.png',
            alt: 'YouTube',
            platform: 'youtube'
        };
    }
    
    // Pinterest
    if (urlLower.includes('pinterest.com')) {
        return {
            icon: '/assets/images/pinterest.png',
            alt: 'Pinterest',
            platform: 'pinterest'
        };
    }
    
    // Telegram
    if (urlLower.includes('telegram.org') || urlLower.includes('t.me')) {
        return {
            icon: '/assets/images/telegram.png',
            alt: 'Telegram',
            platform: 'telegram'
        };
    }
    
    // TikTok
    if (urlLower.includes('tiktok.com')) {
        return {
            icon: '/assets/images/tik-tok.png',
            alt: 'TikTok',
            platform: 'tiktok'
        };
    }
    
    // WhatsApp
    if (urlLower.includes('whatsapp.com') || urlLower.includes('wa.me')) {
        return {
            icon: '/assets/images/whatsapp.png',
            alt: 'WhatsApp',
            platform: 'whatsapp'
        };
    }
    
    // Default: show as generic link
    return {
        icon: null,
        alt: 'Social Link',
        platform: 'other',
        text: 'Link'
    };
}

// Helper function to create a social link element
function createSocialLinkElement(url, iconInfo) {
    const link = document.createElement('a');
    link.href = url.trim();
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'social-logo-link';
    
    if (iconInfo.icon) {
        link.innerHTML = `<img src="${iconInfo.icon}" alt="${iconInfo.alt}" class="social-logo-img" style="width: 32px; height: 32px; object-fit: contain;">`;
    } else {
        link.style.textDecoration = 'none';
        link.style.color = 'var(--color-text-primary, #ffffff)';
        link.textContent = iconInfo.text || iconInfo.alt || 'Link';
    }
    
    return link;
}

async function loadSocialLinks() {
    try {
        const profileSocialText = document.getElementById('profileSocialText');
        const profileSocialLogos = document.getElementById('profileSocialLogos');

        if (!profileSocialText || !profileSocialLogos) {
            return;
        }

        // Load from localStorage
        const socialLinksJson = localStorage.getItem('userSocialLinks');
        const social = socialLinksJson ? JSON.parse(socialLinksJson) : {};
        
        // Collect all social links (standard + dynamic)
        const allSocialLinks = [];
        
        // Standard social links
        if (social.twitter && social.twitter.trim()) {
            allSocialLinks.push({ url: social.twitter.trim(), type: 'twitter' });
        }
        if (social.linkedIn && social.linkedIn.trim()) {
            allSocialLinks.push({ url: social.linkedIn.trim(), type: 'linkedin' });
        }
        if (social.github && social.github.trim()) {
            allSocialLinks.push({ url: social.github.trim(), type: 'github' });
        }
        
        // Dynamic social links (keys starting with 'dynamic_')
        // Sort them numerically to maintain order
        const dynamicKeys = Object.keys(social)
            .filter(key => key.startsWith('dynamic_'))
            .sort((a, b) => {
                const numA = parseInt(a.replace('dynamic_', ''));
                const numB = parseInt(b.replace('dynamic_', ''));
                return numA - numB;
            });
        
        dynamicKeys.forEach(key => {
            const url = social[key];
            if (url && url.trim()) {
                allSocialLinks.push({ url: url.trim(), type: 'dynamic' });
            }
        });

        // Check if any social links exist
        if (allSocialLinks.length > 0) {
            // Hide "Not provided" text
            profileSocialText.style.display = 'none';
            
            // Show logos container
            profileSocialLogos.style.display = 'flex';
            profileSocialLogos.innerHTML = '';

            // Add logos for each social link
            allSocialLinks.forEach(linkData => {
                const iconInfo = getSocialIconFromUrl(linkData.url);
                if (iconInfo) {
                    const linkElement = createSocialLinkElement(linkData.url, iconInfo);
                    profileSocialLogos.appendChild(linkElement);
                }
            });
        } else {
            // No social links, show "Not provided"
            profileSocialText.style.display = 'inline';
            profileSocialLogos.style.display = 'none';
            profileSocialLogos.innerHTML = '';
        }

        // Also load into input fields
        const socialTwitter = document.getElementById('socialTwitter');
        const socialLinkedIn = document.getElementById('socialLinkedIn');
        const socialGitHub = document.getElementById('socialGitHub');
        if (socialTwitter) socialTwitter.value = social.twitter || '';
        if (socialLinkedIn) socialLinkedIn.value = social.linkedIn || '';
        if (socialGitHub) socialGitHub.value = social.github || '';
        
        // Load dynamic social links into input fields
        if (typeof window.loadDynamicSocialLinks === 'function') {
            window.loadDynamicSocialLinks(social);
        }
    } catch (error) {
        console.error('Error loading social links from localStorage:', error);
    }
}

// Load social links when profile section is shown
function observeProfileSection() {
    const profileSection = document.getElementById('profile');
    if (!profileSection) {
        setTimeout(observeProfileSection, 500);
        return;
    }

    // Use MutationObserver to detect when profile section becomes active
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const isActive = profileSection.classList.contains('active');
                if (isActive && typeof loadSocialLinks === 'function') {
                    // Call immediately when profile section becomes active
                    loadSocialLinks();
                }
            }
        });
    });

    observer.observe(profileSection, {
        attributes: true,
        attributeFilter: ['class']
    });

    // Also check immediately if profile section is already active
    if (profileSection.classList.contains('active') && typeof loadSocialLinks === 'function') {
        loadSocialLinks();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(observeProfileSection, 500);
    });
} else {
    setTimeout(observeProfileSection, 500);
}

// Dynamic social links functionality
(function() {
    const MAX_SOCIAL_LINKS = 5;
    let dynamicSocialLinkCount = 0;
    
    function getTotalSocialLinkCount() {
        // Count the 3 fixed social links + dynamic ones
        const fixedInputs = document.querySelectorAll('.profile-social-inputs input[data-social-type]');
        const dynamicInputs = document.querySelectorAll('#dynamicSocialLinks .profile-field-input');
        return fixedInputs.length + dynamicInputs.length;
    }
    
    function updateAddSocialButton() {
        const addSocialBtn = document.getElementById('addSocialBtn');
        if (!addSocialBtn) return;
        
        const totalCount = getTotalSocialLinkCount();
        if (totalCount >= MAX_SOCIAL_LINKS) {
            addSocialBtn.disabled = true;
            addSocialBtn.style.opacity = '0.4';
            addSocialBtn.style.cursor = 'not-allowed';
        } else {
            addSocialBtn.disabled = false;
            addSocialBtn.style.opacity = '1';
            addSocialBtn.style.cursor = 'pointer';
        }
    }
    
    function addDynamicSocialLink() {
        console.log('addDynamicSocialLink called');
        const totalCount = getTotalSocialLinkCount();
        console.log('Total social link count:', totalCount);
        
        if (totalCount >= MAX_SOCIAL_LINKS) {
            console.log('Max social links reached');
            return;
        }
        
        const dynamicContainer = document.getElementById('dynamicSocialLinks');
        if (!dynamicContainer) {
            console.error('dynamicSocialLinks container not found');
            return;
        }
        
        dynamicSocialLinkCount++;
        const linkId = `dynamicSocialLink_${dynamicSocialLinkCount}`;
        
        const linkRow = document.createElement('div');
        linkRow.className = 'dynamic-social-link-row';
        linkRow.id = linkId;
        linkRow.style.display = 'flex';
        linkRow.style.flexDirection = 'row';
        linkRow.style.gap = 'var(--space-2)';
        linkRow.style.alignItems = 'center';
        
        const input = document.createElement('input');
        input.type = 'url';
        input.className = 'profile-field-input';
        input.placeholder = 'Social media profile URL';
        input.style.display = 'block';
        input.style.flex = '1';
        input.setAttribute('data-social-dynamic', 'true');
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-social-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.style.padding = '8px 16px';
        removeBtn.style.cursor = 'pointer';
        removeBtn.onclick = function() {
            linkRow.remove();
            updateAddSocialButton();
        };
        
        linkRow.appendChild(input);
        linkRow.appendChild(removeBtn);
        dynamicContainer.appendChild(linkRow);
        
        console.log('Dynamic social link added:', linkId);
        updateAddSocialButton();
        
        // Focus the new input
        input.focus();
    }
    
    function showAddSocialButton() {
        const addSocialBtn = document.getElementById('addSocialBtn');
        const profileSocialInputs = document.querySelector('.profile-social-inputs');
        if (addSocialBtn && profileSocialInputs && profileSocialInputs.style.display !== 'none') {
            addSocialBtn.style.display = 'block';
            updateAddSocialButton();
        }
    }
    
    function hideAddSocialButton() {
        const addSocialBtn = document.getElementById('addSocialBtn');
        if (addSocialBtn) {
            addSocialBtn.style.display = 'none';
        }
    }
    
    // Initialize when DOM is ready
    function initDynamicSocialLinks() {
        const addSocialBtn = document.getElementById('addSocialBtn');
        if (!addSocialBtn) {
            console.log('Add Social button not found, retrying...');
            setTimeout(initDynamicSocialLinks, 500);
            return;
        }
        
        console.log('Initializing Add Social button');
        
        // Remove any existing event listeners by cloning the button
        const newBtn = addSocialBtn.cloneNode(true);
        addSocialBtn.parentNode.replaceChild(newBtn, addSocialBtn);
        
        // Update the reference to use the new button
        const currentBtn = document.getElementById('addSocialBtn');
        
        // Add click handler to the new button
        currentBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Add Social button clicked (addEventListener)');
            addDynamicSocialLink();
            return false;
        });
        
        // Also add as onclick as backup
        currentBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Add Social button onclick triggered');
            addDynamicSocialLink();
            return false;
        };
        
        // Make sure button is accessible
        currentBtn.setAttribute('role', 'button');
        currentBtn.setAttribute('tabindex', '0');
        
        // Also handle Enter key
        currentBtn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                addDynamicSocialLink();
            }
        });
        
        // Observe when edit mode is activated
        const profileSocialInputs = document.querySelector('.profile-social-inputs');
        if (profileSocialInputs) {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        const isVisible = profileSocialInputs.style.display !== 'none';
                        if (isVisible) {
                            showAddSocialButton();
                        } else {
                            hideAddSocialButton();
                        }
                    }
                });
            });
            
            observer.observe(profileSocialInputs, {
                attributes: true,
                attributeFilter: ['style']
            });
            
            // Check initial state
            if (profileSocialInputs.style.display !== 'none') {
                showAddSocialButton();
            }
        }
    }
    
    // Also listen for edit button clicks (if dashboard.js handles edit mode)
    const profileEditBtn = document.getElementById('profileEditBtn');
    if (profileEditBtn) {
        profileEditBtn.addEventListener('click', function() {
            // Wait for edit mode to fully activate and input fields to be visible
            setTimeout(() => {
                showAddSocialButton();
                // Load social links into input fields when edit mode is activated
                // Wait a bit more to ensure input fields are visible
                setTimeout(() => {
                    if (typeof loadSocialLinks === 'function') {
                        console.log('Loading social links when edit mode activated');
                        loadSocialLinks();
                    }
                }, 200);
            }, 100);
        });
    }
    
    // Function to get all social links from input fields (for saving)
    window.getAllSocialLinks = function() {
        const social = {
            twitter: (document.getElementById('socialTwitter')?.value || '').trim(),
            linkedIn: (document.getElementById('socialLinkedIn')?.value || '').trim(),
            github: (document.getElementById('socialGitHub')?.value || '').trim()
        };
        
        // Get dynamic social links from input fields - preserve order and only save non-empty values
        const dynamicInputs = document.querySelectorAll('#dynamicSocialLinks .profile-field-input');
        let dynamicIndex = 0;
        
        console.log('getAllSocialLinks: Found', dynamicInputs.length, 'dynamic input fields');
        dynamicInputs.forEach((input, index) => {
            const value = input.value.trim();
            console.log(`Dynamic input ${index}:`, value);
            if (value) {
                // Store as dynamic_0, dynamic_1, etc. in order
                social[`dynamic_${dynamicIndex}`] = value;
                dynamicIndex++;
            }
        });
        
        console.log('getAllSocialLinks returned:', social, 'dynamic inputs found:', dynamicInputs.length, 'with values:', dynamicIndex);
        return social;
    };
    
    // Function to load dynamic social links (called when profile data is loaded)
    window.loadDynamicSocialLinks = function(socialData) {
        if (!socialData || typeof socialData !== 'object') return;
        
        const dynamicContainer = document.getElementById('dynamicSocialLinks');
        if (!dynamicContainer) {
            console.error('dynamicSocialLinks container not found in loadDynamicSocialLinks');
            return;
        }
        
        // Clear existing dynamic links
        dynamicContainer.innerHTML = '';
        dynamicSocialLinkCount = 0;
        
        // Find dynamic social links (keys that start with 'dynamic_')
        // Sort them numerically to maintain order
        const dynamicKeys = Object.keys(socialData)
            .filter(key => key.startsWith('dynamic_'))
            .sort((a, b) => {
                const numA = parseInt(a.replace('dynamic_', ''));
                const numB = parseInt(b.replace('dynamic_', ''));
                return numA - numB;
            });
        
        dynamicKeys.forEach((key) => {
            const value = socialData[key];
            if (value && value.trim()) {
                dynamicSocialLinkCount++;
                const linkId = `dynamicSocialLink_${dynamicSocialLinkCount}`;
                
                const linkRow = document.createElement('div');
                linkRow.className = 'dynamic-social-link-row';
                linkRow.id = linkId;
                linkRow.style.display = 'flex';
                linkRow.style.flexDirection = 'row';
                linkRow.style.gap = 'var(--space-2)';
                linkRow.style.alignItems = 'center';
                
                const input = document.createElement('input');
                input.type = 'url';
                input.className = 'profile-field-input';
                input.placeholder = 'Social media profile URL';
                input.style.display = 'block';
                input.style.flex = '1';
                input.value = value.trim();
                input.setAttribute('data-social-dynamic', 'true');
                
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'remove-social-btn';
                removeBtn.textContent = 'Remove';
                removeBtn.style.padding = '8px 16px';
                removeBtn.style.cursor = 'pointer';
                removeBtn.onclick = function() {
                    linkRow.remove();
                    updateAddSocialButton();
                };
                
                linkRow.appendChild(input);
                linkRow.appendChild(removeBtn);
                dynamicContainer.appendChild(linkRow);
            }
        });
        
        console.log('Loaded', dynamicSocialLinkCount, 'dynamic social links');
        updateAddSocialButton();
    };
    
    // Hook into save button using event delegation (works even if button is recreated)
    function saveSocialLinks() {
        console.log('saveSocialLinks called');
        
        // Get existing data first to preserve it
        let existingSocialLinks = {};
        try {
            const existingJson = localStorage.getItem('userSocialLinks');
            if (existingJson) {
                existingSocialLinks = JSON.parse(existingJson);
                console.log('Existing social links from localStorage:', existingSocialLinks);
            }
        } catch (error) {
            console.error('Error reading existing social links:', error);
        }
        
        // Get all social links including dynamic ones from input fields IMMEDIATELY
        const inputSocialLinks = window.getAllSocialLinks ? window.getAllSocialLinks() : {};
        console.log('Social links from input fields:', inputSocialLinks);
        
        // Check if dynamic inputs container has any input fields
        const dynamicInputs = document.querySelectorAll('#dynamicSocialLinks .profile-field-input');
        const hasDynamicInputsLoaded = dynamicInputs.length > 0;
        
        console.log('Dynamic inputs found:', dynamicInputs.length, 'Has inputs loaded:', hasDynamicInputsLoaded);
        
        // Start with existing data, then merge in input values
        const allSocialLinks = { ...existingSocialLinks };
        
        // Update standard social links from inputs (if provided)
        if (inputSocialLinks.twitter) allSocialLinks.twitter = inputSocialLinks.twitter;
        if (inputSocialLinks.linkedIn) allSocialLinks.linkedIn = inputSocialLinks.linkedIn;
        if (inputSocialLinks.github) allSocialLinks.github = inputSocialLinks.github;
        
        // For dynamic links: if inputs are loaded and have values, use those; otherwise keep existing
        const inputDynamicKeys = Object.keys(inputSocialLinks).filter(k => k.startsWith('dynamic_'));
        const existingDynamicKeys = Object.keys(existingSocialLinks).filter(k => k.startsWith('dynamic_'));
        
        if (hasDynamicInputsLoaded && inputDynamicKeys.length > 0) {
            console.log('Using dynamic links from input fields:', inputDynamicKeys);
            // Remove old dynamic keys and add new ones
            existingDynamicKeys.forEach(key => delete allSocialLinks[key]);
            inputDynamicKeys.forEach(key => {
                if (inputSocialLinks[key] && inputSocialLinks[key].trim()) {
                    allSocialLinks[key] = inputSocialLinks[key];
                }
            });
        } else {
            // Keep existing dynamic links
            console.log('Preserving existing dynamic links:', existingDynamicKeys);
        }
        
        console.log('Final social links to save:', allSocialLinks);
        
        // Save to localStorage IMMEDIATELY
        try {
            localStorage.setItem('userSocialLinks', JSON.stringify(allSocialLinks));
            console.log('✅ Social links saved successfully to localStorage');
            
            // Reload social links after save
            setTimeout(() => {
                if (typeof loadSocialLinks === 'function') {
                    loadSocialLinks();
                }
            }, 300);
        } catch (error) {
            console.error('❌ Error saving social links to localStorage:', error);
        }
    }
    
    // Use event delegation on document body to catch save button clicks
    document.body.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'profileSaveBtn') {
            console.log('Save button clicked via event delegation');
            saveSocialLinks();
        }
    }, true); // Capture phase
    
    // Also try to attach directly if button exists
    const profileSaveBtn = document.getElementById('profileSaveBtn');
    if (profileSaveBtn) {
        profileSaveBtn.addEventListener('click', function(e) {
            console.log('Save button clicked via direct listener');
            saveSocialLinks();
        }, true);
    }
    
    // Watch for when save button is added to DOM
    const saveButtonObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    if (node.id === 'profileSaveBtn') {
                        console.log('Save button added to DOM, attaching listener');
                        node.addEventListener('click', saveSocialLinks, true);
                    }
                    // Also check children
                    const saveBtn = node.querySelector && node.querySelector('#profileSaveBtn');
                    if (saveBtn) {
                        console.log('Save button found in added node, attaching listener');
                        saveBtn.addEventListener('click', saveSocialLinks, true);
                    }
                }
            });
        });
    });
    
    saveButtonObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDynamicSocialLinks);
    } else {
        initDynamicSocialLinks();
    }
})();

// Fix social logo paths for production
// Fixes image paths after they're rendered (for obfuscated code with relative paths)
function fixSocialLogoPaths() {
    const socialLogos = document.querySelectorAll('.social-logo-img');
    socialLogos.forEach(img => {
        let src = img.getAttribute('src') || img.src;
        if (src && src.includes('assets/images/')) {
            // If path is relative (doesn't start with / or http), make it absolute
            if (!src.startsWith('/') && !src.startsWith('http')) {
                img.src = '/' + src.replace(/^\.\//, '');
            } else if (src.startsWith('assets/images/')) {
                // Fix paths that should be absolute
                img.src = '/assets/images/' + src.replace(/^assets\/images\//, '');
            }
        }
    });
}

// Run on load and after delays to catch dynamically loaded content
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixSocialLogoPaths);
} else {
    fixSocialLogoPaths();
}
setTimeout(fixSocialLogoPaths, 500);
setTimeout(fixSocialLogoPaths, 1000);
setTimeout(fixSocialLogoPaths, 2000);

// Observe for new social logos being added dynamically
const socialLogoObserver = new MutationObserver(() => {
    fixSocialLogoPaths();
});

// Start observing once the container exists
function startObservingSocialLogos() {
    const socialContainer = document.getElementById('profileSocialLogos');
    if (socialContainer) {
        socialLogoObserver.observe(socialContainer, { childList: true, subtree: true });
    } else {
        setTimeout(startObservingSocialLogos, 500);
    }
}
startObservingSocialLogos();

