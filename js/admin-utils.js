// Admin & Mentor Utilities
// Helper functions for checking roles and managing admin/mentor roles

/**
 * Check if the current user is an admin
 * @returns {Promise<boolean>} True if user is admin, false otherwise
 */
async function isAdmin() {
    try {
        const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user || !window.firebase?.db) {
            return false;
        }
        
        const userDocRef = doc(window.firebase.db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            return false;
        }
        
        const userData = userDoc.data();
        return userData.role === 'admin';
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

/**
 * Check if the current user is a mentor
 * @returns {Promise<boolean>} True if user is mentor, false otherwise
 */
async function isMentor() {
    try {
        const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user || !window.firebase?.db) {
            return false;
        }
        
        const userDocRef = doc(window.firebase.db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            return false;
        }
        
        const userData = userDoc.data();
        return userData.role === 'mentor';
    } catch (error) {
        console.error('Error checking mentor status:', error);
        return false;
    }
}

/**
 * Check if the current user is an admin or mentor
 * @returns {Promise<boolean>} True if user is admin or mentor, false otherwise
 */
async function isAdminOrMentor() {
    const admin = await isAdmin();
    const mentor = await isMentor();
    return admin || mentor;
}

/**
 * Get the current user's role
 * @returns {Promise<string|null>} User's role ('admin', 'mentor', or 'user') or null if not found
 */
async function getUserRole() {
    try {
        const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user || !window.firebase?.db) {
            return null;
        }
        
        const userDocRef = doc(window.firebase.db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            return null;
        }
        
        const userData = userDoc.data();
        return userData.role || 'user'; // Default to 'user' if role not set
    } catch (error) {
        console.error('Error getting user role:', error);
        return null;
    }
}

/**
 * Set a user as admin (requires admin privileges)
 * This function should only be called by existing admins
 * @param {string} userId - The UID of the user to make admin
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function setUserAsAdmin(userId) {
    try {
        // First check if current user is admin
        const currentUserIsAdmin = await isAdmin();
        if (!currentUserIsAdmin) {
            console.error('Only admins can set other users as admin');
            return false;
        }
        
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const userDocRef = doc(window.firebase.db, 'users', userId);
        await updateDoc(userDocRef, {
            role: 'admin'
        });
        
        console.log('User set as admin successfully');
        return true;
    } catch (error) {
        console.error('Error setting user as admin:', error);
        return false;
    }
}

/**
 * Remove admin role from a user (requires admin privileges)
 * @param {string} userId - The UID of the user to remove admin from
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function removeAdminRole(userId) {
    try {
        // First check if current user is admin
        const currentUserIsAdmin = await isAdmin();
        if (!currentUserIsAdmin) {
            console.error('Only admins can remove admin role');
            return false;
        }
        
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const userDocRef = doc(window.firebase.db, 'users', userId);
        await updateDoc(userDocRef, {
            role: 'user'
        });
        
        console.log('Admin role removed successfully');
        return true;
    } catch (error) {
        console.error('Error removing admin role:', error);
        return false;
    }
}

/**
 * Set a user as mentor (requires admin privileges)
 * @param {string} userId - The UID of the user to make mentor
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function setUserAsMentor(userId) {
    try {
        // First check if current user is admin
        const currentUserIsAdmin = await isAdmin();
        if (!currentUserIsAdmin) {
            console.error('Only admins can set other users as mentor');
            return false;
        }
        
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const userDocRef = doc(window.firebase.db, 'users', userId);
        await updateDoc(userDocRef, {
            role: 'mentor'
        });
        
        console.log('User set as mentor successfully');
        return true;
    } catch (error) {
        console.error('Error setting user as mentor:', error);
        return false;
    }
}

/**
 * Remove mentor role from a user (requires admin privileges)
 * @param {string} userId - The UID of the user to remove mentor from
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function removeMentorRole(userId) {
    try {
        // First check if current user is admin
        const currentUserIsAdmin = await isAdmin();
        if (!currentUserIsAdmin) {
            console.error('Only admins can remove mentor role');
            return false;
        }
        
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const userDocRef = doc(window.firebase.db, 'users', userId);
        await updateDoc(userDocRef, {
            role: 'user'
        });
        
        console.log('Mentor role removed successfully');
        return true;
    } catch (error) {
        console.error('Error removing mentor role:', error);
        return false;
    }
}

/**
 * Check if current user owns a course (mentor can only edit their own courses)
 * @param {string} courseId - The course ID to check
 * @returns {Promise<boolean>} True if user owns the course, false otherwise
 */
async function ownsCourse(courseId) {
    try {
        const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user || !window.firebase?.db) {
            return false;
        }
        
        // Admins own all courses
        if (await isAdmin()) {
            return true;
        }
        
        // Check if mentor owns this course
        const courseDocRef = doc(window.firebase.db, 'courses', courseId);
        const courseDoc = await getDoc(courseDocRef);
        
        if (!courseDoc.exists()) {
            return false;
        }
        
        const courseData = courseDoc.data();
        return courseData.createdBy === user.uid;
    } catch (error) {
        console.error('Error checking course ownership:', error);
        return false;
    }
}

// Make functions available globally
window.isAdmin = isAdmin;
window.isMentor = isMentor;
window.isAdminOrMentor = isAdminOrMentor;
window.getUserRole = getUserRole;
window.setUserAsAdmin = setUserAsAdmin;
window.removeAdminRole = removeAdminRole;
window.setUserAsMentor = setUserAsMentor;
window.removeMentorRole = removeMentorRole;
window.ownsCourse = ownsCourse;

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isAdmin,
        isMentor,
        isAdminOrMentor,
        getUserRole,
        setUserAsAdmin,
        removeAdminRole,
        setUserAsMentor,
        removeMentorRole,
        ownsCourse
    };
}

