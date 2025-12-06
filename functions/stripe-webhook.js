/**
 * Netlify Function: Stripe Webhook Handler
 * 
 * This function handles Stripe webhook events and updates Firestore
 * 
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key (sk_live_...)
 * - STRIPE_WEBHOOK_SECRET: Your webhook signing secret (whsec_...)
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
    const sig = event.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing signature or webhook secret' })
        };
    }

    let stripeEvent;

    try {
        // Construct the event from the request body and signature
        stripeEvent = stripe.webhooks.constructEvent(
            event.body,
            sig,
            webhookSecret
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
        };
    }

    // Handle the event
    try {
        switch (stripeEvent.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionUpdate(stripeEvent.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(stripeEvent.data.object);
                break;

            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(stripeEvent.data.object);
                break;

            case 'invoice.payment_failed':
                await handlePaymentFailed(stripeEvent.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${stripeEvent.type}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ received: true })
        };
    } catch (error) {
        console.error('Error handling webhook:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Webhook handler error' })
        };
    }
};

async function handleSubscriptionUpdate(subscription) {
    const customerId = subscription.customer;
    const subscriptionId = subscription.id;

    // Get customer to find Firebase user ID
    const customer = await stripe.customers.retrieve(customerId);
    const userId = customer.metadata.firebaseUserId;

    if (!userId) {
        console.error('No Firebase user ID in customer metadata for customer:', customerId);
        return;
    }

    // Get price details
    const priceId = subscription.items.data[0].price.id;
    const price = await stripe.prices.retrieve(priceId);

    // Get product name
    const product = await stripe.products.retrieve(price.product);
    const planName = product.name || price.nickname || 'Unknown Plan';

    // Update Firestore
    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);

    await userRef.update({
        subscription: {
            subscriptionId: subscriptionId,
            customerId: customerId,
            status: subscription.status,
            planName: planName,
            amount: price.unit_amount / 100, // Convert from cents
            currency: price.currency,
            interval: price.recurring?.interval || 'month',
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
    });

    console.log(`Updated subscription for user ${userId}: ${planName} (${subscription.status})`);
}

async function handleSubscriptionDeleted(subscription) {
    const customerId = subscription.customer;

    // Get customer to find Firebase user ID
    const customer = await stripe.customers.retrieve(customerId);
    const userId = customer.metadata.firebaseUserId;

    if (!userId) {
        console.error('No Firebase user ID in customer metadata for customer:', customerId);
        return;
    }

    // Remove subscription from Firestore
    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);

    await userRef.update({
        subscription: admin.firestore.FieldValue.delete()
    });

    console.log(`Removed subscription for user ${userId}`);
}

async function handlePaymentSucceeded(invoice) {
    // Optional: Send email notification, update payment history, etc.
    console.log(`Payment succeeded for invoice ${invoice.id}`);
    
    // You can add additional logic here, like:
    // - Sending confirmation emails
    // - Updating payment history in Firestore
    // - Triggering other business logic
}

async function handlePaymentFailed(invoice) {
    // Optional: Send email notification, update user, etc.
    console.log(`Payment failed for invoice ${invoice.id}`);
    
    // You can add additional logic here, like:
    // - Sending payment failure notifications
    // - Updating user status
    // - Triggering retry logic
}

