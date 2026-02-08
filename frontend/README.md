# AU Hostel Accommodation System - Frontend

A modern, responsive web application for managing hostel accommodation at African University.

## Features

### For Students
- **Dashboard**: View application status, available rooms, and quick actions
- **Application Form**: Comprehensive form for hostel accommodation application
- **Room Explorer**: Browse available rooms with filters and details
- **Application Status**: Track application progress and notifications

### For Wardens (Future Implementation)
- Application management and approval
- Room allocation system
- Reports and analytics
- User management

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with CSS Variables, Responsive Design
- **Authentication**: Firebase Authentication
- **Backend Integration**: REST API calls to FastAPI backend
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Poppins, Roboto)

## Color Scheme

- **Primary**: Red (#D32F2F)
- **Secondary**: White (#FFFFFF)
- **Third**: Black (#212121)

## Project Structure

```
frontend/
├── index.html              # Main entry point
├── styles/
│   ├── main.css           # Main stylesheet
│   ├── responsive.css     # Media queries
│   └── utilities.css      # Utility classes
├── scripts/
│   ├── main.js            # Core application logic
│   ├── auth.js            # Firebase authentication
│   └── api.js             # Backend API communication
├── assets/
│   ├── images/            # Images and photos
│   └── icons/             # Custom icons
└── pages/                 # HTML page templates
```

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hostel_accommodation_project
   ```

2. **Backend Setup**
   ```bash
   cd accommodation_back_end
   pip install fastapi uvicorn
   uvicorn app.main:app --reload
   ```

3. **Frontend Setup**
   - The frontend is served statically by FastAPI
   - Access the application at `http://localhost:8000`

4. **Firebase Configuration**
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Authentication and Firestore
   - Update the Firebase config in `frontend/index.html`

## Key Features Implemented

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized
- Flexible grid layouts

### User Authentication
- Firebase Auth integration
- Login/Register forms
- Automatic session management

### Dynamic UI
- Single Page Application (SPA) architecture
- Smooth page transitions
- Loading states and error handling

### API Integration
- RESTful API calls to backend
- Authentication token handling
- Error handling and user feedback

### Modern UI/UX
- Clean, professional design
- Intuitive navigation
- Interactive elements with hover effects
- Toast notifications

## Development

### Adding New Pages
1. Add a new case in `main.js` `loadPage()` method
2. Create the HTML content function
3. Update navigation if needed

### Styling Guidelines
- Use CSS variables for colors and spacing
- Follow BEM naming convention
- Ensure responsive design with media queries

### API Calls
- Use the `APIManager` class for all backend communication
- Authentication tokens are automatically included
- Handle errors gracefully

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

1. Follow the existing code style
2. Test on multiple devices and browsers
3. Ensure responsive design works
4. Add comments for complex logic

## License

This project is part of the AU Hostel Accommodation System.