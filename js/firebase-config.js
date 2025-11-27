// Shared Firebase Configuration
// This file centralizes Firebase config to avoid duplication across HTML files

export const firebaseConfig = {
    apiKey: "AIzaSyDZvKVOLry7oDekiRxZlY_7-u-Nfe15Zts",
    authDomain: "nuerlo-course-platform.firebaseapp.com",
    projectId: "nuerlo-course-platform",
    storageBucket: "nuerlo-course-platform.firebasestorage.app",
    messagingSenderId: "1089335169355",
    appId: "1:1089335169355:web:a327f39b892f5e752398ce",
    measurementId: "G-D6BX96Z7KN"
};

// Helper function to initialize Firebase (returns initialized services)
export async function initializeFirebase() {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const { getStorage } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js');
    const { getAnalytics } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js');
    
    const app = initializeApp(firebaseConfig);
    
    return {
        app,
        auth: getAuth(app),
        db: getFirestore(app),
        storage: getStorage(app),
        analytics: getAnalytics(app)
    };
}

