# Firebase Setup Instructions

## Step 1: Add Firebase via Swift Package Manager

1. Open the project in Xcode
2. Go to **File → Add Package Dependencies...**
3. Enter this URL: `https://github.com/firebase/firebase-ios-sdk`
4. Click **Add Package**
5. Select these products:
   - **FirebaseAuth**
   - **FirebaseCore**
6. Click **Add Package**

## Step 2: Verify GoogleService-Info.plist

The `GoogleService-Info.plist` file is already in the project. Make sure it's included in the target:
1. Select `GoogleService-Info.plist` in the project navigator
2. Check the "Target Membership" in the File Inspector
3. Make sure "NuerloApp" is checked

## Step 3: Build and Run

The app should now build successfully with Firebase authentication!

## Features Implemented

- ✅ Native iOS login screen matching website design
- ✅ Native iOS registration screen
- ✅ Firebase email/password authentication
- ✅ Dashboard with bottom menu (slides up from bottom)
- ✅ Sign out functionality
- ✅ Purple gradient backgrounds matching website
- ✅ Gray dividers
- ✅ No glows, no boxes - clean design
- ✅ Logo integration

## Next Steps (Optional)

To add Google Sign In:
1. Add `FirebaseAuth/Google` package
2. Configure Google Sign In in Firebase Console
3. Update `LoginViewController.swift` and `RegisterViewController.swift` with Google Sign In implementation

