# AU Hostel Accommodation System - Real-Time Setup Guide

## 🚀 Features Implemented

### Security Features
- ✅ **Auto-logout after 5 minutes of inactivity**
- ✅ **Clickjacking protection**
- ✅ **Secure Firebase authentication**
- ✅ **Real-time data synchronization**
- ✅ **Transaction-based room allocation** (prevents double booking)

### Real-Time Features
- ✅ **Live application status updates**
- ✅ **Real-time room availability**
- ✅ **Instant warden approval/rejection notifications**
- ✅ **Live dashboard statistics**
- ✅ **Real-time room allocation tracking**

### Student Features
- View allocated room in real-time
- Submit applications with instant feedback
- Real-time application status tracking
- Auto-logout security

### Warden Features
- Real-time pending applications dashboard
- Approve/reject applications instantly
- Room allocation with capacity validation
- Live occupancy statistics
- Futuristic admin interface

## 📋 Setup Instructions

### Step 1: Firebase Setup (Already Configured)
Your Firebase project is already set up with:
- Project ID: `hostel-accommodation`
- Authentication enabled
- Firestore database enabled

### Step 2: Initialize Firebase Data

1. Open your browser and navigate to `index.html`
2. Open browser console (F12)
3. Run this command to seed initial room data:
```javascript
await seedFirebaseData();
```

This will create:
- 192 rooms for girls (Blocks A-H, 3 floors, 8 rooms each)
- 96 rooms for boys (Blocks I-L, 3 floors, 8 rooms each)
- All rooms are triple occupancy (3 students per room)

### Step 3: Create Test Accounts

#### Create Student Account:
1. Go to login page
2. Click "Register"
3. Fill in:
   - Name: Test Student
   - Reg Number: 123456
   - Email: student@test.com
   - Gender: Female/Male
   - Course: BSc Computer Science
   - Role: Student
   - Password: test123

#### Create Warden Account:
1. Click "Register"
2. Fill in:
   - Name: Test Warden
   - Reg Number: 999999
   - Email: warden@test.com
   - Gender: Female/Male
   - Course: Administration
   - Role: Warden
   - Password: warden123

### Step 4: Test Real-Time Features

#### As Student:
1. Login with student account
2. Navigate to "Apply" tab
3. Submit an application
4. Watch dashboard update in real-time
5. Leave browser idle for 5 minutes to test auto-logout

#### As Warden:
1. Login with warden account
2. See pending applications appear instantly
3. Click "Approve" or "Reject"
4. Student will see status update in real-time

#### Test Room Allocation:
1. As warden, approve a student application
2. Go to "Room Allocation" tab
3. Select student and assign room
4. Student's dashboard updates instantly with room details

## 🔒 Security Features Explained

### 1. Auto-Logout (5 Minutes Inactivity)
- Monitors: mouse movement, clicks, keyboard, scroll, touch
- Automatically logs out user after 5 minutes of no activity
- Shows alert before redirecting to login

### 2. Clickjacking Protection
- Prevents site from being embedded in iframes
- Protects against UI redressing attacks

### 3. Transaction-Based Allocation
- Uses Firestore transactions
- Prevents race conditions
- Ensures room capacity is never exceeded
- Atomic operations for data consistency

## 📊 Real-Time Data Flow

```
Student Submits Application
    ↓
Firebase Firestore (applications collection)
    ↓
Real-time listener triggers
    ↓
Warden Dashboard Updates Instantly
    ↓
Warden Approves/Rejects
    ↓
Firebase Firestore Updates
    ↓
Student Dashboard Updates Instantly
```

## 🎨 Futuristic UI Features

### Student Dashboard:
- Auto-scrolling image slider with personalized messages
- Profile section with avatar upload
- Real-time notification bell
- Animated stat cards
- Glassmorphism effects
- Theme toggle (light/dark mode)

### Warden Dashboard:
- Real-time pending applications with action buttons
- Live room allocation interface
- Gender-based hostel statistics
- 3D hover effects on cards
- Gradient backgrounds
- Smooth animations

### View Rooms Tab:
- Interactive 3D room cards
- Visual bed layout (occupied vs available)
- Real-time availability filters
- Animated statistics dashboard
- Detailed room modal with full information
- Click-to-select functionality

## 🔧 Firestore Collections Structure

### users
```javascript
{
  uid: "firebase-auth-uid",
  name: "Student Name",
  email: "student@test.com",
  registrationNumber: "123456",
  gender: "female",
  program: "BSc CS",
  role: "student",
  createdAt: timestamp
}
```

### applications
```javascript
{
  studentId: "uid",
  studentName: "Student Name",
  registrationNumber: "123456",
  gender: "female",
  program: "BSc CS",
  preferredBlock: "A",
  status: "pending", // pending, approved, rejected, allocated
  submittedAt: timestamp,
  reviewedBy: "warden-uid",
  reviewedAt: timestamp,
  rejectionReason: "string"
}
```

### rooms
```javascript
{
  number: "A-101",
  block: "A",
  floor: 1,
  gender: "female",
  capacity: 3,
  occupied: 2,
  amenities: ["WiFi", "Study Desk", "Wardrobe", "Fan"],
  condition: "Excellent",
  isActive: true
}
```

### allocations
```javascript
{
  studentId: "uid",
  applicationId: "app-id",
  roomId: "room-id",
  roomNumber: "A-101",
  block: "A",
  status: "active",
  allocatedBy: "warden-uid",
  allocatedAt: timestamp
}
```

## 🐛 Troubleshooting

### Issue: Auto-logout not working
**Solution**: Check browser console for errors. Ensure firebase-service.js is loaded.

### Issue: Real-time updates not showing
**Solution**: 
1. Check Firebase console for Firestore rules
2. Ensure rules allow read/write for authenticated users
3. Check browser console for permission errors

### Issue: Room allocation fails
**Solution**: 
1. Verify room exists in Firestore
2. Check room capacity hasn't been exceeded
3. Ensure application is in "approved" status

### Issue: Data not seeding
**Solution**:
1. Open browser console
2. Check for Firebase initialization errors
3. Verify Firebase config is correct
4. Run `await seedFirebaseData()` again

## 📱 Browser Compatibility
- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

## 🚀 Deployment

### Option 1: Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Option 2: Any Static Host
Upload the `frontend` folder to:
- Netlify
- Vercel
- GitHub Pages
- AWS S3

## 📞 Support
For issues or questions, contact the development team.

## 🎉 Success!
Your real-time hostel accommodation system is now live with:
- ✅ 5-minute auto-logout security
- ✅ Real-time data synchronization
- ✅ Futuristic UI/UX
- ✅ Transaction-based room allocation
- ✅ Live warden-student communication
