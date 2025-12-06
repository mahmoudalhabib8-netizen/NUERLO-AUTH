/**
 * Netlify Function: Create Stripe Checkout Session
 * 
 * This function creates a Stripe Checkout session for subscriptions
 * 
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key (sk_live_...)
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const { priceId, userId, userEmail, successUrl, cancelUrl } = JSON.parse(event.body);

        if (!priceId || !userId || !userEmail) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields: priceId, userId, userEmail' })
            };
        }

        // Create or retrieve Stripe customer
        let customer;
        const customers = await stripe.customers.list({ 
            email: userEmail, 
            limit: 1 
        });

        if (customers.data.length > 0) {
            customer = customers.data[0];
            // Update metadata if needed
            if (!customer.metadata.firebaseUserId) {
                await stripe.customers.update(customer.id, {
                    metadata: {
                        firebaseUserId: userId
                    }
                });
            }
        } else {
            // Create new customer
            customer = await stripe.customers.create({
                email: userEmail,
                metadata: {
                    firebaseUserId: userId
                }
            });
        }

        // Create checkout session with customization
        const session = await stripe.checkout.sessions.create({
            customer: customer.id,
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: successUrl || `${event.headers.referer || event.headers.origin}/payment?payment=success`,
            cancel_url: cancelUrl || `${event.headers.referer || event.headers.origin}/payment?payment=cancelled`,
            metadata: {
                firebaseUserId: userId
            },
            // Customization options
            custom_text: {
                submit: {
                    message: 'Subscribe to unlock all features'
                }
            },
            // Allow promotion codes
            allow_promotion_codes: true,
            // Billing address collection
            billing_address_collection: 'auto',
            // Subscription data
            subscription_data: {
                metadata: {
                    firebaseUserId: userId
                }
            }
            // Note: Logo and colors are set in Stripe Dashboard → Settings → Branding
            // Use these colors:
            // Primary color: #a476ff (your brand purple)
            // Accent color: #8b5fff (your dark purple)
            // Note: customer_email is not needed when using customer ID (customer already has email)
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ sessionId: session.id })
        };
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};

