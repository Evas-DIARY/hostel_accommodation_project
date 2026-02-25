# Firebase Setup Instructions

To use Firebase authentication instead of JSON storage:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password provider
4. Enable Firestore Database:
   - Go to Firestore Database > Create database
   - Choose "Start in test mode" for development
5. Get your Firebase config:
   - Go to Project settings > General > Your apps
   - Click "Add app" > Web app
   - Copy the config object
6. Replace the placeholder config in `login.html` with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-actual-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-actual-sender-id",
    appId: "your-actual-app-id"
};
```

## Testing with JSON Storage

The app currently uses JSON file storage by default. Test accounts:

- **Student**: email: `student@au.edu
- ` or reg: `123456`, password: `password123`
- **Warden**: email: `warden@au.edu` or reg: `654321`, password: `password123`

You can register new users, and they'll be saved to localStorage.

## Switching to Firebase

Once you configure Firebase, the app will automatically detect and use Firebase authentication. User data will be stored in Firestore.