# 🔥 FIREBASE SETUP - FIX CONFIGURATION ERROR

## ⚠️ Error: "CONFIGURATION_NOT_FOUND"

This error means Email/Password authentication is not enabled in your Firebase project.

## ✅ SOLUTION - Enable Authentication (5 Minutes)

### Step 1: Go to Firebase Console
1. Open: https://console.firebase.google.com
2. Click on your project: **hostel-accommodation**

### Step 2: Enable Email/Password Authentication
1. In left sidebar, click **"Authentication"**
2. Click **"Get Started"** (if first time)
3. Click **"Sign-in method"** tab
4. Find **"Email/Password"** in the list
5. Click on it
6. Toggle **"Enable"** switch to ON
7. Click **"Save"**

### Step 3: Set Up Firestore Database
1. In left sidebar, click **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select your region (closest to you)
5. Click **"Enable"**

### Step 4: Update Firestore Rules (Security)
1. In Firestore Database, click **"Rules"** tab
2. Replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Applications collection
    match /applications/{applicationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.studentId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['warden', 'admin']);
    }
    
    // Rooms collection
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['warden', 'admin'];
    }
    
    // Allocations collection
    match /allocations/{allocationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['warden', 'admin'];
    }
  }
}
```

3. Click **"Publish"**

### Step 5: Verify Setup
1. Go back to your site
2. Refresh the page (Ctrl+F5)
3. Try to register a new account
4. Should work now! ✅

---

## 🎯 QUICK TEST

After setup, test with these steps:

1. **Register Account:**
   - Name: Test Student
   - Reg Number: 123456
   - Email: test@test.com
   - Gender: Female
   - Course: BSc CS
   - Password: test123

2. **Login:**
   - Use: 123456 OR test@test.com
   - Password: test123

3. **Should redirect to dashboard!** 🎉

---

## 🐛 Still Having Issues?

### Check Firebase Console:
1. Go to **Authentication** → **Users** tab
2. You should see registered users here
3. If empty, registration isn't working

### Check Browser Console:
1. Press F12
2. Look for errors
3. Common issues:
   - "auth/invalid-api-key" → Wrong API key
   - "auth/operation-not-allowed" → Email/Password not enabled
   - "permission-denied" → Firestore rules too strict

### Verify API Key:
Your current API key: `AIzaSyCiQ6ACTlxFqLEuE74oSt0qa0Unt__k3MQ`

To get correct key:
1. Firebase Console → Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Copy the correct `apiKey`
4. Update in `login.html` line 19

---

## 📞 Need Help?

1. Check Firebase Console for errors
2. Verify authentication is enabled
3. Check Firestore rules are published
4. Clear browser cache and try again

---

## ✅ Success Checklist:

- [ ] Email/Password authentication enabled
- [ ] Firestore database created
- [ ] Firestore rules published
- [ ] Page refreshed (Ctrl+F5)
- [ ] Registration works
- [ ] Login works
- [ ] Dashboard loads

Once all checked, your site is fully functional! 🚀
