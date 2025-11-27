/**
 * Netlify Function: Create Stripe Customer Portal Session
 * 
 * This function creates a Stripe Customer Portal session for subscription management
 * 
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key (sk_live_...)
 * - FIREBASE_SERVICE_ACCOUNT: Firebase service account JSON (as string)
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
}

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
        const { userId, returnUrl } = JSON.parse(event.body);

        if (!userId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required field: userId' })
            };
        }

        // Get user's Stripe customer ID from Firestore
        const db = admin.firestore();
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'User not found' })
            };
        }

        const userData = userDoc.data();
        const customerId = userData.subscription?.customerId;

        if (!customerId) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'No subscription found for this user' })
            };
        }

        // Create portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl || `${event.headers.referer || event.headers.origin}/dashboard?payment=updated`
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ url: session.url })
        };
    } catch (error) {
        console.error('Error creating portal session:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};

