// User Info Module
// Handles user profile data loading, avatar, display name, subscription status, and password management

// Keep password forms aligned with the user's username/email
window.syncPasswordUsernameFields = function syncPasswordUsernameFields(email) {
    const usernameValue = email || '';
    const usernameFields = document.querySelectorAll('input[data-username-field]');
    usernameFields.forEach(field => {
        if (field && typeof field.value !== 'undefined') {
            field.value = usernameValue;
        }
    });
};

// Load user information from Firebase
window.loadUserInfo = async function loadUserInfo() {
    try {
        if (!window.firebase || !window.firebase.auth || !window.firebase.db) {
            console.log('Firebase not ready yet');
            setTimeout(loadUserInfo, 100);
            return;
        }

        const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const { doc, getDoc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
            console.log('No user logged in');
            return;
        }

        console.log('Loading user info for:', user.uid, user.email);
        window.cachedUserEmail = user.email || '';
        if (typeof window.syncPasswordUsernameFields === 'function') {
            window.syncPasswordUsernameFields(window.cachedUserEmail);
        }

        // Get user data from Firestore
        let displayName = user.displayName || user.email?.split('@')[0] || 'User';
        let photoURL = user.photoURL || null;
        let userData = null; // Declare userData in outer scope
        
        try {
            const userDocRef = doc(window.firebase.db, 'users', user.uid);
            let userDoc = await getDoc(userDocRef);
            
            // Create user document if it doesn't exist
            if (!userDoc.exists()) {
                console.log('User document not found in loadUserInfo, creating one...');
                try {
                    await setDoc(userDocRef, {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName || user.email?.split('@')[0] || 'User',
                        photoURL: user.photoURL || null,
                        createdAt: new Date(),
                        enrolledCourses: [],
                        progress: {},
                        role: 'user' // Default role for all new users
                    });
                    // Reload the document
                    userDoc = await getDoc(userDocRef);
                    console.log('User document created successfully in loadUserInfo');
                } catch (createError) {
                    console.error('Error creating user document in loadUserInfo:', createError);
                }
            }
            
            if (userDoc.exists()) {
                userData = userDoc.data();
                console.log('User data loaded from Firestore:', userData);
                // Use Firestore data if available
                if (userData.displayName) {
                    displayName = userData.displayName;
                } else if (userData.firstName && userData.lastName) {
                    displayName = `${userData.firstName} ${userData.lastName}`.trim();
                }
                
                if (userData.photoURL) {
                    photoURL = userData.photoURL;
                }
            } else {
                console.log('User document still does not exist after creation attempt');
            }
        } catch (error) {
            console.error('Error loading user data from Firestore:', error);
            userData = null;
        }

        // Update user name in header - BUT only if we're on overview section
        const userName = document.getElementById('userName');
        const userNameMini = document.getElementById('userNameMini');
        
        // Get firstName - prioritize from userData.firstName
        let firstName = 'Student';
        if (userData && userData.firstName) {
            firstName = userData.firstName.trim();
        } else if (displayName) {
            firstName = displayName.split(' ')[0].trim() || 'Student';
        }
        
        if (!firstName || firstName === 'User' || firstName === '' || firstName.toLowerCase() === 'user') {
            firstName = 'Student';
        }
        
        // Cache the first name globally for immediate access
        window.cachedUserFirstName = firstName;
        
        const currentSection = document.querySelector('.content-section.active');
        const isOverview = currentSection && currentSection.id === 'overview';
        
        if (userName) {
            if (isOverview) {
                // Always show "Welcome, [FirstName]" when on overview section
                userName.textContent = firstName;
                userName.style.display = 'inline';
            } else {
                // Not on overview - hide and clear userName
                userName.style.display = 'none';
                userName.textContent = '';
            }
        }
        if (userNameMini) {
            userNameMini.textContent = firstName;
        }

        // Update user avatar
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            if (photoURL) {
                // Use photo URL
                userAvatar.innerHTML = `<img src="${photoURL}" alt="${displayName}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            } else {
                // Use initials
                const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                userAvatar.textContent = initials;
            }
        }

        console.log('User info loaded:', { displayName, firstName, photoURL });

        // Update profile header (name, email, status)
        const profileNameEl = document.getElementById('profileDisplayName');
        const profileEmailEl = document.getElementById('profileEmail');
        const profileStatusEl = document.getElementById('profileStatus');

        if (profileNameEl) {
            profileNameEl.textContent = displayName;
        }
        if (profileEmailEl) {
            profileEmailEl.textContent = user.email || '';
        }

        // Default status is Free unless subscription says otherwise
        let statusLabel = 'Status: Free';

        try {
            // Reuse Stripe subscription helpers if available
            if (typeof getUserSubscription === 'function' && typeof formatSubscriptionStatus === 'function') {
                const subscription = await getUserSubscription(user.uid);
                const subscriptionInfo = formatSubscriptionStatus(subscription);

                let planLabel = 'Free';
                if (subscriptionInfo && subscriptionInfo.hasSubscription) {
                    const planName = (subscriptionInfo.planName || '').toLowerCase();
                    if (planName.includes('enterprise')) {
                        planLabel = 'Enterprise';
                    } else if (planName.includes('pro')) {
                        planLabel = 'Pro';
                    } else if (planName.includes('free')) {
                        planLabel = 'Free';
                    } else {
                        // Any other paid plan defaults to Pro-style label
                        planLabel = 'Pro';
                    }
                }

                statusLabel = `Status: ${planLabel}`;
            }
        } catch (statusError) {
            console.error('Error determining subscription status for profile header:', statusError);
        }

        if (profileStatusEl) {
            profileStatusEl.textContent = statusLabel;
        }
        
        // Check if user has password set and show/hide set password option in Personal section
        if (user && user.providerData) {
            const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');
            const hasEmailPassword = user.providerData.some(provider => provider.providerId === 'password');
            
            const setPasswordContainer = document.getElementById('setPasswordContainer');
            const profilePasswordText = document.getElementById('profilePasswordText');
            const changePasswordBtn = document.getElementById('changePasswordBtn');
            const passwordAlertBadge = document.getElementById('passwordAlertBadge');
            
            // Store password status globally for other scripts to check
            window.userHasPassword = hasEmailPassword;
            
            if (setPasswordContainer && profilePasswordText) {
                // Show set password option if user doesn't have email/password linked
                if (!hasEmailPassword) {
                    setPasswordContainer.style.display = 'block';
                    profilePasswordText.style.display = 'none';
                    if (changePasswordBtn) changePasswordBtn.style.display = 'none';
                    // Show alert badge
                    if (passwordAlertBadge) passwordAlertBadge.style.display = 'inline-flex';
                } else {
                    setPasswordContainer.style.display = 'none';
                    profilePasswordText.style.display = 'inline';
                    // Show change password button for users with password
                    if (changePasswordBtn) changePasswordBtn.style.display = 'inline-block';
                    // Hide alert badge
                    if (passwordAlertBadge) passwordAlertBadge.style.display = 'none';
                }
            }
            
            // Update sign-in method text
            const signInMethodText = document.getElementById('signInMethodText');
            if (signInMethodText) {
                if (isGoogleUser && hasEmailPassword) {
                    signInMethodText.textContent = 'Google & Email/Password';
                } else if (isGoogleUser) {
                    signInMethodText.textContent = 'Google';
                } else if (hasEmailPassword) {
                    signInMethodText.textContent = 'Email/Password';
                } else {
                    signInMethodText.textContent = 'Unknown';
                }
            }
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
};

// Handle Set Password functionality in Personal section
(function() {
    const setPasswordBtn = document.getElementById('setPasswordBtnPersonal');
    const setPasswordForm = document.getElementById('setPasswordFormPersonal');
    const savePasswordBtn = document.getElementById('savePasswordBtnPersonal');
    const cancelPasswordBtn = document.getElementById('cancelPasswordBtnPersonal');
    const newPasswordInput = document.getElementById('newPasswordInputPersonal');
    const confirmPasswordInput = document.getElementById('confirmPasswordInputPersonal');
    const passwordError = document.getElementById('passwordErrorPersonal');
    const passwordSuccess = document.getElementById('passwordSuccessPersonal');
    
    if (setPasswordBtn) {
        setPasswordBtn.addEventListener('click', () => {
            if (typeof window.syncPasswordUsernameFields === 'function') {
                window.syncPasswordUsernameFields(window.cachedUserEmail || '');
            }
            if (setPasswordForm) {
                setPasswordForm.style.display = 'block';
                setPasswordBtn.parentElement.style.display = 'none';
            }
        });
    }
    
    if (cancelPasswordBtn) {
        cancelPasswordBtn.addEventListener('click', () => {
            if (setPasswordForm) {
                setPasswordForm.style.display = 'none';
                if (setPasswordBtn) setPasswordBtn.parentElement.style.display = 'flex';
                if (newPasswordInput) newPasswordInput.value = '';
                if (confirmPasswordInput) confirmPasswordInput.value = '';
                if (passwordError) {
                    passwordError.style.display = 'none';
                    passwordError.textContent = '';
                }
                if (passwordSuccess) {
                    passwordSuccess.style.display = 'none';
                    passwordSuccess.textContent = '';
                }
            }
        });
    }
    
    if (savePasswordBtn) {
        savePasswordBtn.addEventListener('click', async () => {
            const newPassword = newPasswordInput?.value || '';
            const confirmPassword = confirmPasswordInput?.value || '';
            
            // Hide previous messages
            if (passwordError) {
                passwordError.style.display = 'none';
                passwordError.textContent = '';
            }
            if (passwordSuccess) {
                passwordSuccess.style.display = 'none';
                passwordSuccess.textContent = '';
            }
            
            // Validate
            if (!newPassword || newPassword.length < 6) {
                if (passwordError) {
                    passwordError.textContent = 'Password must be at least 6 characters long.';
                    passwordError.style.display = 'block';
                }
                return;
            }
            
            if (newPassword !== confirmPassword) {
                if (passwordError) {
                    passwordError.textContent = 'Passwords do not match.';
                    passwordError.style.display = 'block';
                }
                return;
            }
            
            try {
                const { getAuth, EmailAuthProvider, linkWithCredential } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
                const auth = getAuth();
                const user = auth.currentUser;
                
                if (!user || !user.email) {
                    throw new Error('User not found');
                }
                
                // Create email/password credential
                const credential = EmailAuthProvider.credential(user.email, newPassword);
                
                // Link the credential to the Google account
                await linkWithCredential(user, credential);
                
                // Show success message
                if (passwordSuccess) {
                    passwordSuccess.textContent = 'Password set successfully!';
                    passwordSuccess.style.display = 'block';
                }
                
                // Hide alert badge immediately
                const passwordAlertBadge = document.getElementById('passwordAlertBadge');
                if (passwordAlertBadge) passwordAlertBadge.style.display = 'none';
                
                // Hide form after 1.5 seconds and reload UI
                setTimeout(() => {
                    if (setPasswordForm) setPasswordForm.style.display = 'none';
                    if (newPasswordInput) newPasswordInput.value = '';
                    if (confirmPasswordInput) confirmPasswordInput.value = '';
                    if (passwordSuccess) passwordSuccess.style.display = 'none';
                    
                    // Reload user info to update UI
                    if (window.loadUserInfo) {
                        window.loadUserInfo();
                    }
                }, 1500);
                
            } catch (error) {
                console.error('Error setting password:', error);
                if (passwordError) {
                    let errorMsg = 'Failed to set password. Please try again.';
                    if (error.code === 'auth/email-already-in-use') {
                        errorMsg = 'This email is already in use with a different account.';
                    } else if (error.code === 'auth/weak-password') {
                        errorMsg = 'Password is too weak. Please choose a stronger password.';
                    } else if (error.code === 'auth/requires-recent-login') {
                        errorMsg = 'For security, please sign out and sign in again, then try setting your password.';
                    }
                    passwordError.textContent = errorMsg;
                    passwordError.style.display = 'block';
                }
            }
        });
    }
})();

// Change Password Modal Functionality
(function() {
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const changePasswordCancelBtn = document.getElementById('changePasswordCancelBtn');
    const changePasswordConfirmBtn = document.getElementById('changePasswordConfirmBtn');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    // Open modal when clicking Change Password button
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            if (typeof window.syncPasswordUsernameFields === 'function') {
                window.syncPasswordUsernameFields(window.cachedUserEmail || '');
            }
            if (changePasswordModal) {
                changePasswordModal.style.display = 'flex';
                // Clear inputs
                if (currentPasswordInput) currentPasswordInput.value = '';
                if (newPasswordInput) newPasswordInput.value = '';
                if (confirmPasswordInput) confirmPasswordInput.value = '';
            }
        });
    }
    
    // Close modal when clicking Cancel
    if (changePasswordCancelBtn) {
        changePasswordCancelBtn.addEventListener('click', () => {
            if (changePasswordModal) {
                changePasswordModal.style.display = 'none';
            }
        });
    }
    
    // Close modal when clicking overlay
    if (changePasswordModal) {
        const overlay = changePasswordModal.querySelector('.logout-modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                changePasswordModal.style.display = 'none';
            });
        }
    }
    
    // Handle password change
    if (changePasswordConfirmBtn) {
        changePasswordConfirmBtn.addEventListener('click', async () => {
            const currentPassword = currentPasswordInput?.value || '';
            const newPassword = newPasswordInput?.value || '';
            const confirmPassword = confirmPasswordInput?.value || '';
            
            // Validate inputs
            if (!currentPassword) {
                if (typeof window.showCustomNotification === 'function') {
                    window.showCustomNotification('error', 'Validation Error', 'Please enter your current password');
                } else {
                    alert('Please enter your current password');
                }
                return;
            }
            
            if (!newPassword || newPassword.length < 6) {
                if (typeof window.showCustomNotification === 'function') {
                    window.showCustomNotification('error', 'Validation Error', 'New password must be at least 6 characters long');
                } else {
                    alert('New password must be at least 6 characters long');
                }
                return;
            }
            
            if (newPassword !== confirmPassword) {
                if (typeof window.showCustomNotification === 'function') {
                    window.showCustomNotification('error', 'Validation Error', 'New passwords do not match');
                } else {
                    alert('New passwords do not match');
                }
                return;
            }
            
            if (currentPassword === newPassword) {
                if (typeof window.showCustomNotification === 'function') {
                    window.showCustomNotification('error', 'Validation Error', 'New password must be different from current password');
                } else {
                    alert('New password must be different from current password');
                }
                return;
            }
            
            try {
                // Disable button during processing
                changePasswordConfirmBtn.disabled = true;
                changePasswordConfirmBtn.textContent = 'Changing...';
                
                const { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
                const auth = getAuth();
                const user = auth.currentUser;
                
                if (!user || !user.email) {
                    throw new Error('User not found');
                }
                
                // Re-authenticate user with current password
                const credential = EmailAuthProvider.credential(user.email, currentPassword);
                await reauthenticateWithCredential(user, credential);
                
                // Update to new password
                await updatePassword(user, newPassword);
                
                // Show success message
                if (typeof window.showCustomNotification === 'function') {
                    window.showCustomNotification('success', 'Password Changed', 'Your password has been updated successfully');
                } else {
                    alert('Password changed successfully!');
                }
                
                // Close modal
                if (changePasswordModal) {
                    changePasswordModal.style.display = 'none';
                }
                
                // Clear inputs
                if (currentPasswordInput) currentPasswordInput.value = '';
                if (newPasswordInput) newPasswordInput.value = '';
                if (confirmPasswordInput) confirmPasswordInput.value = '';
                
            } catch (error) {
                console.error('Error changing password:', error);
                let errorMsg = 'Failed to change password. Please try again.';
                
                if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    errorMsg = 'Current password is incorrect';
                } else if (error.code === 'auth/weak-password') {
                    errorMsg = 'New password is too weak. Please choose a stronger password';
                } else if (error.code === 'auth/requires-recent-login') {
                    errorMsg = 'For security, please sign out and sign in again, then try changing your password';
                } else if (error.code === 'auth/user-not-found') {
                    errorMsg = 'User not found. Please sign in again';
                }
                
                if (typeof window.showCustomNotification === 'function') {
                    window.showCustomNotification('error', 'Password Change Failed', errorMsg);
                } else {
                    alert(errorMsg);
                }
            } finally {
                // Re-enable button
                changePasswordConfirmBtn.disabled = false;
                changePasswordConfirmBtn.textContent = 'Change Password';
            }
        });
    }
})();

// Add safeguard to prevent password elements from showing when user doesn't have password
(function() {
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const profilePasswordText = document.getElementById('profilePasswordText');
    const setPasswordContainer = document.getElementById('setPasswordContainer');
    
    // Function to enforce password display rules
    function enforcePasswordRules() {
        if (!window.userHasPassword) {
            // User doesn't have password - hide password display and change button
            if (changePasswordBtn && changePasswordBtn.style.display !== 'none') {
                changePasswordBtn.style.display = 'none';
            }
            if (profilePasswordText && profilePasswordText.style.display !== 'none') {
                profilePasswordText.style.display = 'none';
            }
        }
    }
    
    // Enforce rules on load
    enforcePasswordRules();
    
    // Watch for changes to userHasPassword
    setInterval(enforcePasswordRules, 1000);
})();

// Initialize loadUserInfo when Firebase is ready
(function() {
    // Wait for Firebase to be initialized
    if (window.firebase && window.firebase.auth && window.firebase.db) {
        // Firebase already ready, call immediately
        if (typeof window.loadUserInfo === 'function') {
            window.loadUserInfo();
        }
    } else {
        // Wait for Firebase to be ready
        const checkFirebase = setInterval(() => {
            if (window.firebase && window.firebase.auth && window.firebase.db) {
                clearInterval(checkFirebase);
                if (typeof window.loadUserInfo === 'function') {
                    window.loadUserInfo();
                }
            }
        }, 100);
        
        // Safety timeout - stop checking after 5 seconds
        setTimeout(() => {
            clearInterval(checkFirebase);
        }, 5000);
    }
})();

