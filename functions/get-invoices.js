/**
 * Netlify Function: Get Stripe Invoices
 * 
 * This function retrieves invoices for a Stripe customer
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
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    // Only allow GET and POST requests
    if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        let userId;
        
        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body);
            userId = body.userId;
        } else {
            // GET request - get userId from query string
            userId = event.queryStringParameters?.userId;
        }

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
                statusCode: 200,
                headers,
                body: JSON.stringify({ invoices: [] })
            };
        }

        // Get invoices from Stripe
        const invoices = await stripe.invoices.list({
            customer: customerId,
            limit: 100,
            expand: ['data.charge', 'data.payment_intent']
        });

        // Format invoices for display
        const formattedInvoices = invoices.data.map(invoice => ({
            id: invoice.id,
            number: invoice.number,
            amount: invoice.amount_paid / 100, // Convert from cents
            currency: invoice.currency.toUpperCase(),
            status: invoice.status,
            date: invoice.created * 1000, // Convert to milliseconds
            periodStart: invoice.period_start ? invoice.period_start * 1000 : null,
            periodEnd: invoice.period_end ? invoice.period_end * 1000 : null,
            hostedInvoiceUrl: invoice.hosted_invoice_url,
            invoicePdf: invoice.invoice_pdf,
            description: invoice.description || invoice.lines.data[0]?.description || 'Subscription payment'
        }));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ invoices: formattedInvoices })
        };
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};

