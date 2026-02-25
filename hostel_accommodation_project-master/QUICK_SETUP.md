# Quick Setup Guide

## 🎯 Immediate Setup Steps

### 1. Add Background Image
Place your background image as:
```
frontend/assets/images/1.png
```
This image will be used as the login page background with red transparency overlay.

### 2. Verify Image Assets
Ensure these images exist in `frontend/assets/images/`:
- `1.jpg` - Hostel exterior view
- `2.jpg` - Study spaces
- `3.jpg` - Recreation facilities
- `4.jpg` - Safety features
- `logo.png` - University logo

### 3. Firebase Configuration
Update the Firebase config in `frontend/pages/login.html`:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};
```

### 4. Environment Variables
Create `.env` file in `accommodation_back_end/`:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/serviceAccountKey.json
ENV=development
PORT=8000
```

### 5. Install Dependencies
```bash
cd accommodation_back_end
pip install fastapi uvicorn firebase-admin python-dotenv pydantic
```

### 6. Run the Application
```bash
# From accommodation_back_end directory
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 7. Access the Application
- **Frontend**: http://localhost:8000
- **Login Page**: http://localhost:8000/login
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🎨 Theme Toggle Usage

The theme toggle is automatically available on all pages:
- **Location**: Top-right corner (fixed position)
- **Default**: Light theme
- **Persistence**: Saves to localStorage
- **Keyboard**: No keyboard shortcut (click only)

## 📱 Testing Responsive Design

### Desktop (> 1024px)
- Full dashboard with all cards visible
- Image slider at 400px height
- Side-by-side layout for forms

### Tablet (768px - 1024px)
- Adjusted grid layouts
- Image slider at 300px height
- Stacked forms

### Mobile (< 768px)
- Single column layout
- Image slider at 250px height
- Hamburger menu for navigation
- Touch-optimized buttons

## 🔐 Default Test Accounts

### Student Account
```
Email: student@africau.edu
Password: student123
Role: student
```

### Warden Account
```
Email: warden@africau.edu
Password: warden123
Role: warden
```

## 🚀 Key Features to Test

### Student Dashboard
1. ✅ Login with student credentials
2. ✅ View image slider (auto-scrolls every 5 seconds)
3. ✅ Click profile picture camera icon to upload new photo
4. ✅ Click notification bell to view notifications
5. ✅ Toggle light/dark theme
6. ✅ Submit accommodation application
7. ✅ View application status
8. ✅ Browse available rooms

### Warden Dashboard
1. ✅ Login with warden credentials
2. ✅ View all pending applications
3. ✅ Approve/reject applications with reasons
4. ✅ Allocate rooms to approved students
5. ✅ View occupancy reports
6. ✅ Manage hostels and rooms
7. ✅ Generate reports
8. ✅ View system analytics

## 🐛 Troubleshooting

### Theme Not Persisting
- Check browser localStorage is enabled
- Clear cache and reload

### Images Not Loading
- Verify image paths in `frontend/assets/images/`
- Check file extensions (.jpg vs .png)
- Ensure images are not too large (< 2MB recommended)

### Slider Not Auto-Scrolling
- Check JavaScript console for errors
- Verify all 4 images exist
- Ensure slider initialization in main.js

### API Errors
- Verify Firebase credentials
- Check Firestore security rules
- Ensure backend is running on port 8000

### Profile Picture Upload Not Working
- Check file input accepts image/*
- Verify FileReader API support
- Check browser console for errors

## 📊 Performance Optimization

### Image Optimization
- Compress images to < 500KB each
- Use WebP format for better compression
- Lazy load images below the fold

### CSS Optimization
- Minify CSS for production
- Remove unused styles
- Use CSS variables for theming

### JavaScript Optimization
- Minify JS for production
- Use async/defer for scripts
- Implement code splitting

## 🔄 Future Enhancements

### Planned Features
- [ ] Email notifications
- [ ] SMS alerts
- [ ] Payment integration
- [ ] Room maintenance requests
- [ ] Roommate matching
- [ ] Virtual room tours
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Advanced analytics dashboard
- [ ] Export reports to PDF/Excel

### UI Improvements
- [ ] More animation options
- [ ] Custom theme colors
- [ ] Accessibility improvements (WCAG 2.1)
- [ ] Multi-language support
- [ ] Voice commands
- [ ] Gesture controls for mobile

## 📞 Support Contacts

- **Technical Support**: it@africau.edu
- **Hostel Warden**: warden@africau.edu
- **Student Affairs**: affairs@africau.edu
- **Emergency**: +234 123 456 7890

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready ✅
