/**
 * Stripe Subscriptions Module
 * Handles subscription checkout, status display, and management
 */

// IMPORTANT: Replace with your Stripe Publishable Key
// Get it from: https://dashboard.stripe.com/apikeys
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51SHYplPWWl4JEHZ13b5EgehwTtsiwv9dXExLTmwnw62Ax0mWAhv2HDu8QJAS8ohTVIRDXDwKCA15jpk9fJ80Urev00ochngNGP';

// Subscription Plans Configuration
// Replace price IDs with your actual Stripe Price IDs from Stripe Dashboard
const SUBSCRIPTION_PLANS = {
    free: {
        name: 'Free Plan',
        priceId: null, // Free plan has no price ID
        amount: 0,
        currency: 'usd',
        interval: 'month',
        features: [
            'Limited course access',
            'Basic progress tracking',
            'Community access'
        ]
    },
    pro: {
        name: 'Pro Plan',
        priceId: 'price_1SWn2kPWWl4JEHZ1zPfP5EMq', // Your Stripe Price ID
        amount: 29.99,
        currency: 'usd',
        interval: 'month',
        features: [
            'Access to all courses',
            'Progress tracking',
            'Certificate of completion',
            'Community support'
        ]
    },
    enterprise: {
        name: 'Enterprise Plan',
        priceId: 'price_1SWn3DPWWl4JEHZ1WOjDLU5s', // Your Stripe Price ID
        amount: 99.99,
        currency: 'usd',
        interval: 'month',
        features: [
            'Everything in Pro',
            'Team Management',
            'Custom AI Models',
            'Dedicated Support',
            'API Access',
            'White-label Solutions'
        ]
    }
};

// Initialize Stripe (loads Stripe.js library)
let stripe = null;
let stripeLoaded = false;

/**
 * Load Stripe.js library dynamically
 */
async function loadStripe() {
    if (stripeLoaded && stripe) {
        return stripe;
    }

    return new Promise((resolve, reject) => {
        if (window.Stripe) {
            stripe = window.Stripe(STRIPE_PUBLISHABLE_KEY);
            stripeLoaded = true;
            resolve(stripe);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.onload = () => {
            stripe = window.Stripe(STRIPE_PUBLISHABLE_KEY);
            stripeLoaded = true;
            resolve(stripe);
        };
        script.onerror = () => {
            reject(new Error('Failed to load Stripe.js'));
        };
        document.head.appendChild(script);
    });
}

/**
 * Create checkout session and redirect to Stripe Checkout
 * @param {string} priceId - Stripe Price ID
 * @param {string} userId - Firebase user ID
 * @param {string} userEmail - User email
 */
async function createCheckoutSession(priceId, userId, userEmail) {
    let loadingMessage = null;
    let errorDisplay = null;
    try {
        // Show loading state - create it if it doesn't exist
        loadingMessage = document.getElementById('subscriptionLoading');
        if (!loadingMessage) {
            const paymentSection = document.getElementById('paymentSection');
            if (paymentSection) {
                const loadingDiv = document.createElement('div');
                loadingDiv.id = 'subscriptionLoading';
                loadingDiv.style.cssText = 'display: block; text-align: center; padding: 1rem; color: var(--color-text-secondary);';
                paymentSection.appendChild(loadingDiv);
                loadingMessage = loadingDiv;
            }
        }
        
        // Remove any existing error messages
        const existingError = document.getElementById('subscriptionError');
        if (existingError) {
            existingError.remove();
        }
        
        if (loadingMessage) {
            loadingMessage.style.display = 'block';
            loadingMessage.textContent = 'Creating checkout session...';
        }

        console.log('Creating checkout session for:', { priceId, userId, userEmail });

        // Call your backend to create checkout session
        // Netlify Functions: automatically routes to /.netlify/functions/create-checkout-session
        const functionUrl = '/.netlify/functions/create-checkout-session';
        console.log('Calling function:', functionUrl);
        console.log('Current origin:', window.location.origin);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        let response;
        try {
            response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId: priceId,
                    userId: userId,
                    userEmail: userEmail,
                    successUrl: `${window.location.origin}/payment?payment=success`,
                    cancelUrl: `${window.location.origin}/payment?payment=cancelled`
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
        } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
                throw new Error('Request timed out. Please check your Netlify Functions are deployed and accessible.');
            }
            if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
                throw new Error('Network error: Unable to connect to server. Please check your internet connection and ensure Netlify Functions are deployed.');
            }
            throw fetchError;
        }

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: `Server error: ${response.status} ${response.statusText}` };
            }
            console.error('Checkout session error:', errorData);
            throw new Error(errorData.error || `Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const sessionId = data.sessionId;

        if (!sessionId) {
            throw new Error('No session ID returned from server. Please check the server logs.');
        }

        console.log('Checkout session created:', sessionId);

        if (loadingMessage) {
            loadingMessage.textContent = 'Redirecting to checkout...';
        }

        // Load Stripe before redirecting
        await loadStripe();
        
        if (!stripe) {
            throw new Error('Failed to load Stripe. Please refresh the page and try again.');
        }

        // Redirect to Stripe Checkout
        const { error } = await stripe.redirectToCheckout({
            sessionId: sessionId
        });

        if (error) {
            console.error('Stripe redirect error:', error);
            throw new Error(error.message || 'Failed to redirect to checkout. Please try again.');
        }
        
        // If we get here, redirect should be happening
        // Keep loading message visible during redirect
        if (loadingMessage) {
            loadingMessage.textContent = 'Redirecting to checkout...';
        }
    } catch (error) {
        console.error('Checkout error:', error);
        
        // Show error message in UI (profile-style format)
        const paymentSection = document.getElementById('paymentSection');
        if (paymentSection && !document.getElementById('subscriptionError')) {
            const errorMsg = error.message || 'Failed to start checkout. Please try again.';
            
            // Create error field in profile style
            errorDisplay = document.createElement('div');
            errorDisplay.id = 'subscriptionError';
            errorDisplay.className = 'profile-field';
            errorDisplay.style.cssText = 'border-bottom: none; margin-top: var(--space-4);';
            
            errorDisplay.innerHTML = `
                <div class="profile-field-label" style="color: #ef4444;">Error</div>
                <div class="profile-field-value">
                    <div style="padding: var(--space-3); background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; color: #ef4444;">
                        <div style="display: flex; align-items: start; gap: 0.75rem;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0; margin-top: 2px;">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <div style="flex: 1;">
                                <strong style="display: block; margin-bottom: 0.25rem;">Checkout Error</strong>
                                <div style="font-size: var(--font-size-sm);">${errorMsg}</div>
                                <button onclick="this.closest('#subscriptionError').remove()" style="margin-top: 0.75rem; padding: 0.5rem 1rem; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 4px; color: #ef4444; cursor: pointer; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium);">Dismiss</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            if (loadingMessage) {
                loadingMessage.insertAdjacentElement('afterend', errorDisplay);
            } else {
                paymentSection.appendChild(errorDisplay);
            }
        }
        
        // Hide loading message
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
        
        // Also log to console for debugging
        console.error('Full error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            priceId,
            userId,
            userEmail
        });
    }
}

/**
 * Get user's subscription status from Firestore
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Object|null>} Subscription data or null
 */
async function getUserSubscription(userId) {
    try {
        if (!window.firebase || !window.firebase.db) {
            console.error('Firebase not initialized');
            return null;
        }

        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const userRef = doc(window.firebase.db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            return userData.subscription || null;
        }

        return null;
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return null;
    }
}

/**
 * Format subscription status for display
 * @param {Object} subscription - Subscription data from Firestore
 * @returns {Object} Formatted subscription info
 */
function formatSubscriptionStatus(subscription) {
    if (!subscription || !subscription.status) {
        return {
            hasSubscription: false,
            planName: 'Free',
            status: 'inactive',
            statusText: 'No active subscription',
            nextBillingDate: null,
            amount: null,
            interval: null
        };
    }

    const statusMap = {
        'active': 'Active',
        'trialing': 'Trial',
        'past_due': 'Past Due',
        'canceled': 'Cancelled',
        'unpaid': 'Unpaid',
        'incomplete': 'Incomplete',
        'incomplete_expired': 'Expired'
    };

    const currentPeriodStart = subscription.currentPeriodStart ? new Date(subscription.currentPeriodStart * 1000) : null;
    const currentPeriodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd * 1000) : null;
    const createdAt = subscription.created ? new Date(subscription.created * 1000) : null;
    
    // Calculate days until next billing/expiration
    let daysUntilNext = null;
    if (currentPeriodEnd) {
        const now = new Date();
        const diffTime = currentPeriodEnd - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysUntilNext = diffDays > 0 ? diffDays : 0;
    }

    return {
        hasSubscription: subscription.status === 'active' || subscription.status === 'trialing',
        planName: subscription.planName || 'Unknown',
        status: subscription.status,
        statusText: statusMap[subscription.status] || subscription.status,
        nextBillingDate: currentPeriodEnd,
        currentPeriodStart: currentPeriodStart,
        createdAt: createdAt,
        amount: subscription.amount || null,
        interval: subscription.interval || null,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
        subscriptionId: subscription.subscriptionId || subscription.id || null,
        daysUntilNext: daysUntilNext
    };
}

/**
 * Create customer portal session for subscription management
 * @param {string} userId - Firebase user ID
 */
async function createCustomerPortalSession(userId) {
    try {
        const response = await fetch('/.netlify/functions/create-portal-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                returnUrl: `${window.location.origin}/payment?payment=updated`
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to create portal session');
        }

        const { url } = await response.json();
        if (url) {
            window.location.href = url;
        } else {
            throw new Error('No portal URL returned');
        }
    } catch (error) {
        console.error('Portal session error:', error);
        alert('Unable to open payment management. Please make sure you have an active subscription.');
    }
}

/**
 * Initialize subscription UI
 * Call this when payment section loads
 */
async function initializeSubscriptionUI() {
    console.log('initializeSubscriptionUI called');
    try {
        const paymentSection = document.getElementById('paymentSection');
        if (!paymentSection) {
            console.error('Payment section not found - element with id="paymentSection" does not exist');
            console.error('Available elements:', document.querySelectorAll('[id*="payment"], [id*="subscription"]'));
            return;
        }
        console.log('paymentSection found, initializing...');

        // Show loading state in profile-style format
        paymentSection.innerHTML = `
            <div class="profile-field">
                <div class="profile-field-label">Loading</div>
                <div class="profile-field-value">
                    <div style="text-align: center; padding: 2rem 1rem;">
                        <div class="loading-spinner" style="margin: 0 auto;"></div>
                        <p style="color: var(--color-text-tertiary); margin-top: 1rem; font-size: var(--font-size-sm);">Loading subscription information...</p>
                    </div>
                </div>
            </div>
        `;

        // Wait a bit for Firebase to be ready
        let user = window.currentUser || (window.firebase && window.firebase.auth && window.firebase.auth.currentUser);
        
        if (!user && window.firebase && window.firebase.auth) {
            // Wait for auth state
            await new Promise((resolve) => {
                const unsubscribe = window.firebase.auth.onAuthStateChanged((authUser) => {
                    unsubscribe();
                    user = authUser;
                    resolve();
                });
                // Timeout after 3 seconds
                setTimeout(resolve, 3000);
            });
        }
        
        if (!user) {
            console.warn('User not authenticated');
            paymentSection.innerHTML = `
                <div class="profile-field">
                    <div class="profile-field-label">Authentication Required</div>
                    <div class="profile-field-value">
                        <span style="color: var(--color-text-tertiary);">Please sign in to view subscription options</span>
                    </div>
                </div>
            `;
            return;
        }

        // Load subscription status
        const subscription = await getUserSubscription(user.uid);
        const subscriptionInfo = formatSubscriptionStatus(subscription);

        // Update UI
        updateSubscriptionDisplay(subscriptionInfo);

        // Setup subscription buttons
        setupSubscriptionButtons(user, subscriptionInfo);
    } catch (error) {
        console.error('Error initializing subscription UI:', error);
        const paymentSection = document.getElementById('paymentSection');
        if (paymentSection) {
            // Fallback: Show subscription info even if there's an error
            const subscriptionInfo = formatSubscriptionStatus(null);
            updateSubscriptionDisplay(subscriptionInfo);
        } else {
            console.error('paymentSection element not found!');
        }
    }
}

/**
 * Update subscription display in payment section
 * @param {Object} subscriptionInfo - Formatted subscription info
 */
function updateSubscriptionDisplay(subscriptionInfo) {
    // Update payment section - use profile-style format
    const paymentSection = document.getElementById('paymentSection');
    if (!paymentSection) {
        console.error('paymentSection element not found in updateSubscriptionDisplay!');
        console.error('Looking for element with id="paymentSection"');
        return;
    }

    console.log('updateSubscriptionDisplay called with:', subscriptionInfo);
    console.log('paymentSection found, updating content...');

    if (subscriptionInfo.hasSubscription) {
        // Format dates
        const formatDate = (date) => date ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
        const formatDateShort = (date) => date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
        
        // Calculate billing cycle display
        const billingCycleText = subscriptionInfo.interval ? subscriptionInfo.interval.charAt(0).toUpperCase() + subscriptionInfo.interval.slice(1) : 'N/A';
        
        // Auto-renewal status
        const autoRenewalStatus = subscriptionInfo.cancelAtPeriodEnd ? 'Cancelling' : 'Enabled';
        const autoRenewalColor = subscriptionInfo.cancelAtPeriodEnd ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)';
        
        // Days until next billing/expiration
        const daysText = subscriptionInfo.daysUntilNext !== null 
            ? `${subscriptionInfo.daysUntilNext} ${subscriptionInfo.daysUntilNext === 1 ? 'day' : 'days'}`
            : 'N/A';
        
        // Active subscription - show in profile field format
        paymentSection.innerHTML = `
            <div class="profile-field">
                <div class="profile-field-label">Current Plan</div>
                <div class="profile-field-value">
                    <span style="color: var(--color-text-primary); font-weight: var(--font-weight-medium);">${subscriptionInfo.planName}</span>
                </div>
            </div>
            <div class="profile-field">
                <div class="profile-field-label">Status</div>
                <div class="profile-field-value">
                    <span style="color: var(--color-text-secondary);">${subscriptionInfo.statusText}</span>
                </div>
            </div>
            ${subscriptionInfo.amount ? `
            <div class="profile-field">
                <div class="profile-field-label">Billing Amount</div>
                <div class="profile-field-value">
                    <span style="color: var(--color-text-secondary);">$${subscriptionInfo.amount.toFixed(2)}/${subscriptionInfo.interval}</span>
                </div>
            </div>
            ` : ''}
            ${subscriptionInfo.interval ? `
            <div class="profile-field">
                <div class="profile-field-label">Billing Cycle</div>
                <div class="profile-field-value">
                    <span style="color: var(--color-text-secondary);">${billingCycleText}</span>
                </div>
            </div>
            ` : ''}
            <div class="profile-field">
                <div class="profile-field-label">${subscriptionInfo.cancelAtPeriodEnd ? 'Expires On' : 'Next Billing Date'}</div>
                <div class="profile-field-value">
                    ${subscriptionInfo.nextBillingDate ? `
                        <span style="color: var(--color-text-secondary);">${formatDate(subscriptionInfo.nextBillingDate)}</span>
                        ${subscriptionInfo.daysUntilNext !== null ? `<span style="color: var(--color-text-tertiary); font-size: var(--font-size-sm); margin-left: var(--space-2);">(${daysText})</span>` : ''}
                    ` : `
                        <span style="color: var(--color-text-tertiary);">N/A</span>
                    `}
                </div>
            </div>
            ${subscriptionInfo.createdAt ? `
            <div class="profile-field">
                <div class="profile-field-label">Subscription Start</div>
                <div class="profile-field-value">
                    <span style="color: var(--color-text-secondary);">${formatDate(subscriptionInfo.createdAt)}</span>
                </div>
            </div>
            ` : ''}
            ${subscriptionInfo.currentPeriodStart ? `
            <div class="profile-field">
                <div class="profile-field-label">Current Period Start</div>
                <div class="profile-field-value">
                    <span style="color: var(--color-text-secondary);">${formatDateShort(subscriptionInfo.currentPeriodStart)}</span>
                </div>
            </div>
            ` : ''}
            <div class="profile-field">
                <div class="profile-field-label">Auto-Renewal</div>
                <div class="profile-field-value">
                    <span style="color: ${autoRenewalColor};">${autoRenewalStatus}</span>
                </div>
            </div>
            ${subscriptionInfo.subscriptionId ? `
            <div class="profile-field">
                <div class="profile-field-label">Subscription ID</div>
                <div class="profile-field-value">
                    <span style="color: var(--color-text-tertiary); font-family: monospace; font-size: var(--font-size-sm);">${subscriptionInfo.subscriptionId}</span>
                </div>
            </div>
            ` : ''}
            <div class="profile-field" style="border-bottom: none;">
                <div class="profile-field-label">Actions</div>
                <div class="profile-field-value">
                    <a href="#" class="plan-action-link" id="manageSubscriptionBtn">
                        Manage Subscription
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: 4px;">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </a>
                </div>
            </div>
            <div id="subscriptionLoading" style="display: none; text-align: center; padding: 1rem; color: var(--color-text-secondary);"></div>
        `;
    } else {
        // No active subscription
        paymentSection.innerHTML = `
            <div class="profile-field">
                <div class="profile-field-label">Current Plan</div>
                <div class="profile-field-value">
                    <span style="color: var(--color-text-secondary);">Free Plan</span>
                </div>
            </div>
            <div class="profile-field">
                <div class="profile-field-label">Status</div>
                <div class="profile-field-value">
                    <span style="color: var(--color-text-tertiary);">No active subscription</span>
                </div>
            </div>
            <div class="profile-field">
                <div class="profile-field-label">Next Billing Date</div>
                <div class="profile-field-value">
                    <span style="color: var(--color-text-tertiary);">N/A</span>
                </div>
            </div>
            <div class="profile-field" style="border-bottom: none;">
                <div class="profile-field-label">Actions</div>
                <div class="profile-field-value">
                    <p style="color: var(--color-text-tertiary); font-size: var(--font-size-sm); margin-bottom: var(--space-3);">View available plans in the Plans tab</p>
                </div>
            </div>
            <div id="subscriptionLoading" style="display: none; text-align: center; padding: 1rem; color: var(--color-text-secondary);"></div>
        `;
    }

    // Setup manage subscription link
    const manageBtn = document.getElementById('manageSubscriptionBtn');
    if (manageBtn) {
        // Remove existing event listeners by cloning and replacing
        const newBtn = manageBtn.cloneNode(true);
        manageBtn.parentNode.replaceChild(newBtn, manageBtn);
        
        newBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const user = window.currentUser || (window.firebase && window.firebase.auth && window.firebase.auth.currentUser);
            if (user) {
                await createCustomerPortalSession(user.uid);
            }
        });
    }
    
    // Update plans section
    updatePlansDisplay(subscriptionInfo);
    
    // Update payment method section
    updatePaymentMethodDisplay(subscriptionInfo);
    
    // Update billing history section
    updateBillingHistoryDisplay(subscriptionInfo);
}

/**
 * Update plans display in Plans tab
 * @param {Object} subscriptionInfo - Formatted subscription info
 */
function updatePlansDisplay(subscriptionInfo) {
    const plansContent = document.getElementById('plansContent');
    if (!plansContent) return;
    
    // Determine current plan - check if user has subscription, otherwise default to free
    let currentPlanKey = null;
    if (subscriptionInfo.hasSubscription) {
        currentPlanKey = Object.keys(SUBSCRIPTION_PLANS).find(key => 
            SUBSCRIPTION_PLANS[key].name === subscriptionInfo.planName
        );
    } else {
        // No subscription means free plan
        currentPlanKey = 'free';
    }
    
    const plansHtml = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
        const isCurrentPlan = key === currentPlanKey;
        const isUpgrade = currentPlanKey && SUBSCRIPTION_PLANS[currentPlanKey] && plan.amount > SUBSCRIPTION_PLANS[currentPlanKey].amount;
        const isDowngrade = currentPlanKey && SUBSCRIPTION_PLANS[currentPlanKey] && plan.amount < SUBSCRIPTION_PLANS[currentPlanKey].amount;
        const isFree = plan.amount === 0;
        
        // Format interval display - convert "month" to "mo"
        const intervalDisplay = plan.interval === 'month' ? 'mo' : plan.interval;
        
        // Format price display - gray color next to plan name
        const priceDisplay = isFree 
            ? '<span class="plan-price-inline">Free</span>'
            : `<span class="plan-price-inline">$${plan.amount.toFixed(2)}/${intervalDisplay}</span>`;
        
        return `
            <div class="plan-field" data-plan="${key}">
                <div class="plan-field-header">
                    <div class="plan-field-main">
                        <div class="plan-name-with-price">
                            <span class="plan-name-primary">${plan.name}</span>
                            ${priceDisplay}
                        </div>
                        ${isCurrentPlan ? '<div class="plan-current-badge-wrapper"><span class="plan-current-badge">CURRENT PLAN</span></div>' : ''}
                    </div>
                    ${plan.priceId ? `
                        <div class="plan-field-action">
                            ${isCurrentPlan ? `
                                <a href="#" class="plan-action-link manage-subscription-link">
                                    Manage Subscription
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: 4px;">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </a>
                            ` : `
                                <a href="#" class="plan-action-link subscribe-link" data-price-id="${plan.priceId}">
                                    ${isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : 'Subscribe'}
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: 4px;">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </a>
                            `}
                        </div>
                    ` : ''}
                </div>
                <div class="plan-features-list">
                    ${plan.features.map(feature => `
                        <div class="plan-feature-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span>${feature}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
    
    plansContent.innerHTML = plansHtml;
    
    // Setup subscribe links
    plansContent.querySelectorAll('.subscribe-link').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const priceId = e.currentTarget.getAttribute('data-price-id');
            if (!priceId) return; // Skip if no price ID (free plan)
            const user = window.currentUser || (window.firebase && window.firebase.auth && window.firebase.auth.currentUser);
            if (user) {
                await createCheckoutSession(priceId, user.uid, user.email);
            }
        });
    });
    
    // Setup manage subscription links (for current paid plans)
    plansContent.querySelectorAll('.manage-subscription-link').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const user = window.currentUser || (window.firebase && window.firebase.auth && window.firebase.auth.currentUser);
            if (user) {
                await createCustomerPortalSession(user.uid);
            }
        });
    });
}

/**
 * Update billing history display
 * @param {Object} subscriptionInfo - Formatted subscription info
 */
async function updateBillingHistoryDisplay(subscriptionInfo) {
    const billingHistoryContent = document.getElementById('billingHistoryContent');
    if (!billingHistoryContent) return;

    try {
        const user = window.currentUser || (window.firebase && window.firebase.auth && window.firebase.auth.currentUser);
        if (!user) {
            billingHistoryContent.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: var(--color-text-tertiary);">
                    <p style="color: var(--color-text-tertiary);">Please sign in to view billing history</p>
                </div>
            `;
            return;
        }

        // Fetch invoices from Netlify function
        const response = await fetch('/.netlify/functions/get-invoices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: user.uid })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch invoices');
        }

        const data = await response.json();
        const invoices = data.invoices || [];

        if (invoices.length === 0) {
            billingHistoryContent.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: var(--color-text-tertiary);">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 1rem; opacity: 0.2;">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    <p style="color: var(--color-text-secondary); margin-bottom: 0.5rem; font-weight: var(--font-weight-medium);">No billing history</p>
                    <p style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Your invoices and receipts will appear here</p>
                </div>
            `;
            return;
        }

        // Format invoices for display
        const invoicesHtml = invoices.map(invoice => {
            const date = new Date(invoice.date);
            const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            
            const statusMap = {
                'paid': { text: 'Paid', color: 'var(--color-text-secondary)' },
                'open': { text: 'Open', color: 'var(--color-text-tertiary)' },
                'draft': { text: 'Draft', color: 'var(--color-text-tertiary)' },
                'void': { text: 'Void', color: 'var(--color-text-tertiary)' },
                'uncollectible': { text: 'Uncollectible', color: 'var(--color-text-tertiary)' }
            };
            
            const status = statusMap[invoice.status] || { text: invoice.status, color: 'var(--color-text-tertiary)' };
            
            return `
                <div class="billing-history-item">
                    <div class="billing-history-header">
                        <div class="billing-history-main">
                            <div class="billing-history-label">Invoice ${invoice.number || invoice.id.slice(-8)}</div>
                            <div class="billing-history-value">
                                <span style="color: var(--color-text-primary); font-weight: var(--font-weight-medium);">$${invoice.amount.toFixed(2)} ${invoice.currency}</span>
                                <span style="color: ${status.color}; font-size: var(--font-size-sm); margin-left: var(--space-2);">${status.text}</span>
                            </div>
                        </div>
                        <div class="billing-history-date">
                            <span style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">${formattedDate}</span>
                        </div>
                    </div>
                    <div class="billing-history-description">
                        <span style="color: var(--color-text-secondary); font-size: var(--font-size-sm);">${invoice.description}</span>
                    </div>
                    ${invoice.hostedInvoiceUrl ? `
                    <div class="billing-history-actions">
                        <a href="${invoice.hostedInvoiceUrl}" target="_blank" class="plan-action-link">
                            View Invoice
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: 4px;">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </a>
                        ${invoice.invoicePdf ? `
                        <a href="${invoice.invoicePdf}" target="_blank" class="plan-action-link" style="margin-left: var(--space-4);">
                            Download PDF
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: 4px;">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                        </a>
                        ` : ''}
                    </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        billingHistoryContent.innerHTML = invoicesHtml;
    } catch (error) {
        console.error('Error loading billing history:', error);
        billingHistoryContent.innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem; color: var(--color-text-tertiary);">
                <p style="color: var(--color-text-tertiary);">Unable to load billing history. Please try again later.</p>
            </div>
        `;
    }
}

/**
 * Update payment method display
 * @param {Object} subscriptionInfo - Formatted subscription info
 */
function updatePaymentMethodDisplay(subscriptionInfo) {
    const paymentMethodDisplay = document.getElementById('paymentMethodDisplay');
    const billingAddressDisplay = document.getElementById('billingAddressDisplay');
    const managePaymentMethodBtn = document.getElementById('managePaymentMethodBtn');
    
    if (paymentMethodDisplay) {
        if (subscriptionInfo.hasSubscription) {
            paymentMethodDisplay.innerHTML = '<span style="color: var(--color-text-secondary);">Card on file</span>';
        } else {
            paymentMethodDisplay.innerHTML = '<span style="color: var(--color-text-tertiary);">No payment method on file</span>';
        }
    }
    
    if (billingAddressDisplay) {
        if (subscriptionInfo.hasSubscription) {
            billingAddressDisplay.innerHTML = '<span style="color: var(--color-text-secondary);">Set in Stripe</span>';
        } else {
            billingAddressDisplay.innerHTML = '<span style="color: var(--color-text-tertiary);">Not set</span>';
        }
    }
    
    if (managePaymentMethodBtn) {
        // Remove existing event listeners by cloning and replacing
        const newBtn = managePaymentMethodBtn.cloneNode(true);
        managePaymentMethodBtn.parentNode.replaceChild(newBtn, managePaymentMethodBtn);
        
        // Only enable the link if user has a subscription
        if (subscriptionInfo.hasSubscription) {
            newBtn.style.opacity = '1';
            newBtn.style.pointerEvents = 'auto';
            newBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const user = window.currentUser || (window.firebase && window.firebase.auth && window.firebase.auth.currentUser);
                if (user) {
                    try {
                        await createCustomerPortalSession(user.uid);
                    } catch (error) {
                        console.error('Error opening payment portal:', error);
                        alert('Unable to open payment management. Please try again later.');
                    }
                }
            });
        } else {
            // Disable link if no subscription
            newBtn.style.opacity = '0.5';
            newBtn.style.pointerEvents = 'none';
            newBtn.style.cursor = 'not-allowed';
        }
    }
}

/**
 * Setup subscription buttons
 * @param {Object} user - Firebase user
 * @param {Object} subscriptionInfo - Subscription info
 */
function setupSubscriptionButtons(user, subscriptionInfo) {
    // This is handled in updateSubscriptionDisplay
}

/**
 * Update subscription status in profile section
 * @param {Object} subscriptionInfo - Formatted subscription info
 */
function updateProfileSubscription(subscriptionInfo) {
    const currentPlanEl = document.querySelector('#subscriptionSection .profile-field-value span');
    const billingCycleEl = document.querySelectorAll('#subscriptionSection .profile-field-value')[1]?.querySelector('span');
    const paymentMethodEl = document.querySelectorAll('#subscriptionSection .profile-field-value')[2]?.querySelector('span');

    if (currentPlanEl) {
        currentPlanEl.textContent = subscriptionInfo.hasSubscription 
            ? subscriptionInfo.planName 
            : 'Free Plan';
        currentPlanEl.style.color = subscriptionInfo.hasSubscription 
            ? 'var(--color-brand-purple)' 
            : 'var(--color-text-secondary)';
    }

    if (billingCycleEl) {
        if (subscriptionInfo.hasSubscription && subscriptionInfo.interval) {
            billingCycleEl.textContent = `$${subscriptionInfo.amount.toFixed(2)}/${subscriptionInfo.interval}`;
            billingCycleEl.style.color = 'var(--color-text-secondary)';
        } else {
            billingCycleEl.textContent = 'N/A';
            billingCycleEl.style.color = 'var(--color-text-tertiary)';
        }
    }

    if (paymentMethodEl) {
        paymentMethodEl.textContent = subscriptionInfo.hasSubscription 
            ? 'Card on file' 
            : 'No payment method';
        paymentMethodEl.style.color = subscriptionInfo.hasSubscription 
            ? 'var(--color-text-secondary)' 
            : 'var(--color-text-tertiary)';
    }
}

// Export functions for use in other files
window.stripeSubscriptions = {
    initialize: initializeSubscriptionUI,
    getUserSubscription: getUserSubscription,
    formatSubscriptionStatus: formatSubscriptionStatus,
    updateProfileSubscription: updateProfileSubscription,
    createCheckoutSession: createCheckoutSession,
    createCustomerPortalSession: createCustomerPortalSession
};

// Auto-initialize when payment section becomes visible (fallback)
document.addEventListener('DOMContentLoaded', () => {
    // Watch for payment section to become active
    const observer = new MutationObserver((mutations) => {
        const paymentSection = document.getElementById('payment');
        if (paymentSection && paymentSection.classList.contains('active')) {
            const paymentContent = document.getElementById('paymentSection');
            if (paymentContent && paymentContent.innerHTML.includes('Loading subscription')) {
                // Section is active but still loading, try to initialize
                if (typeof window.stripeSubscriptions !== 'undefined' && typeof window.stripeSubscriptions.initialize === 'function') {
                    console.log('Auto-initializing subscription UI (fallback)');
                    window.stripeSubscriptions.initialize();
                }
            }
        }
    });
    
    // Observe the payment section
    const paymentSection = document.getElementById('payment');
    if (paymentSection) {
        observer.observe(paymentSection, { attributes: true, attributeFilter: ['class'] });
    }
});


