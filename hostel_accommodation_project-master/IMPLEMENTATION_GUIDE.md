# AU Hostel Accommodation System - Enhanced Version

## 🎨 Design Enhancements

### 1. **Elegant & Futuristic UI**
- **Glassmorphism Effects**: Modern glass-like cards with backdrop blur
- **Smooth Animations**: Fade-in, slide, and pulse animations throughout
- **Enhanced Color Scheme**: Maintained red (#D32F2F), white, and black theme with improved gradients
- **Responsive Design**: Fully responsive across all devices (mobile, tablet, desktop)

### 2. **Light/Dark Theme Toggle**
- **Theme Switcher**: Fixed position toggle button (top-right corner)
- **Persistent Theme**: Saves user preference in localStorage
- **Smooth Transitions**: All elements transition smoothly between themes
- **Icon Updates**: Dynamic sun/moon icons based on current theme

### 3. **Login Page Enhancements**
- **Background Image**: Uses `1.png` with red transparency overlay
- **Enhanced Buttons**: Gradient backgrounds with ripple effects on click
- **Improved Forms**: Better input styling with icons and focus states
- **Loading States**: Animated loading overlay during authentication

## 📱 Student Dashboard Features

### 1. **Image Slider**
- **Auto-Scrolling**: Automatically cycles through 4 hostel images every 5 seconds
- **Manual Navigation**: Previous/Next arrows and dot indicators
- **Responsive**: Adapts to different screen sizes
- **Overlay Information**: Each slide displays relevant hostel information

### 2. **Profile Section**
- **Profile Picture Upload**: Click camera icon to change avatar
- **Personal Information Display**:
  - Full Name
  - Registration Number
  - Email
  - Program and Year of Study
- **Edit Profile Button**: Quick access to profile editing
- **Statistics Cards**: Shows application status, room number, and semester info

### 3. **Notification Bell**
- **Real-time Notifications**: Bell icon with unread count badge
- **Dropdown Panel**: Click to view all notifications
- **Notification Types**:
  - Application approvals
  - Room allocations
  - Deadline reminders
  - System updates
- **Mark as Read**: Individual and bulk mark-as-read functionality

### 4. **Essential Information Cards**
- **Application Status**: Current application state with visual indicators
- **My Room**: Allocated room details and occupancy
- **Quick Actions**: Fast access to common tasks

## 🛠️ Warden Dashboard Features

### 1. **Admin Privileges**
- **Full Access Control**: All administrative functions
- **Room Allocation Management**
- **Application Review & Approval**
- **Hostel & Room Management**
- **Occupancy Reports**

### 2. **Room Allocation Service**
Implements all critical business rules:

#### ✅ **Capacity Enforcement**
- Prevents allocation when room is at full capacity
- Real-time occupancy tracking
- Transaction-based updates to prevent race conditions

#### ✅ **Application Validation**
- Ensures student has an approved application before allocation
- Checks for duplicate allocations per semester
- Updates application status to "allocated"

#### ✅ **Firestore Transactions**
- Atomic operations prevent double allocation
- Consistent state across all documents
- Rollback on any failure

#### ✅ **Room Occupancy Updates**
- Automatically increments occupied count on allocation
- Decrements on cancellation
- Never allows negative occupancy

#### ✅ **Gender Restrictions**
- Enforces hostel gender policies
- Validates student gender matches hostel requirements
- Supports mixed-gender hostels

### 3. **Application Management**
- **Filter Applications**: By status, gender, year, priority
- **Approve/Reject**: With reason tracking
- **Bulk Operations**: Process multiple applications
- **Priority Flags**: Disability, final year, medical needs

### 4. **Reports & Analytics**
- **Occupancy Reports**: Real-time room availability
- **Application Trends**: Monthly submission statistics
- **Revenue Reports**: Fee collection tracking
- **Maintenance Reports**: Room condition monitoring

## 🔧 Backend Architecture

### API Endpoints

#### **Authentication & Users**
```
POST   /api/auth/register     - Register new user
POST   /api/auth/login        - User login
GET    /api/users/me          - Get current user profile
PATCH  /api/users/me          - Update user profile
```

#### **Applications (Student)**
```
POST   /api/applications              - Submit application
GET    /api/applications/mine         - View own application
PATCH  /api/applications/{id}/cancel  - Cancel application
```

#### **Applications (Warden)**
```
GET    /api/applications                    - List all applications
PATCH  /api/applications/{id}/approve       - Approve application
PATCH  /api/applications/{id}/reject        - Reject application
```

#### **Allocations (Warden)**
```
POST   /api/allocations                     - Allocate room
GET    /api/allocations                     - List allocations
GET    /api/allocations/{id}                - Get allocation details
PATCH  /api/allocations/{id}/end            - End allocation
GET    /api/allocations/hostel/{id}/occupancy - Get occupancy stats
```

#### **Hostels (Warden)**
```
POST   /api/hostels           - Create hostel
GET    /api/hostels           - List hostels
GET    /api/hostels/{id}      - Get hostel details
PATCH  /api/hostels/{id}      - Update hostel
DELETE /api/hostels/{id}      - Delete hostel
```

#### **Rooms (Warden)**
```
POST   /api/rooms             - Create room
GET    /api/rooms             - List rooms
GET    /api/rooms/{id}        - Get room details
PATCH  /api/rooms/{id}        - Update room
DELETE /api/rooms/{id}        - Delete room
```

#### **Reports (Warden)**
```
GET    /api/reports/occupancy         - Occupancy report
GET    /api/reports/applications      - Application trends
GET    /api/reports/revenue           - Revenue report
GET    /api/reports/maintenance       - Maintenance report
```

### Firestore Collections

#### **users**
```json
{
  "role": "student|warden|admin",
  "regNumber": "AU12345",
  "fullName": "John Doe",
  "email": "john@africau.edu",
  "gender": "male|female",
  "program": "BSc AI",
  "yearOfStudy": 1,
  "isActive": true,
  "createdAt": "timestamp",
  "profilePicture": "url"
}
```

#### **applications**
```json
{
  "studentId": "uid123",
  "regNumber": "AU12345",
  "status": "submitted|under_review|approved|rejected|allocated|cancelled",
  "semester": "2026S1",
  "preferences": {
    "hostelGender": "male",
    "hostelPreferred": ["Hostel A", "Hostel B"]
  },
  "priorityFlags": {
    "disability": false,
    "finalYear": false
  },
  "submittedAt": "timestamp",
  "reviewedBy": "wardenUid",
  "reviewedAt": "timestamp",
  "decisionReason": "string"
}
```

#### **hostels**
```json
{
  "name": "Hostel A",
  "gender": "male|female|mixed",
  "campus": "Main",
  "isActive": true,
  "createdAt": "timestamp"
}
```

#### **rooms**
```json
{
  "hostelId": "hostelDocId",
  "roomNumber": "A-101",
  "capacity": 4,
  "occupied": 2,
  "isActive": true,
  "amenities": ["WiFi", "AC", "Study Desk"]
}
```

#### **allocations**
```json
{
  "studentId": "uid123",
  "applicationId": "appDocId",
  "hostelId": "hostelDocId",
  "roomId": "roomDocId",
  "bedLabel": "Bed 2",
  "semester": "2026S1",
  "allocatedBy": "wardenUid",
  "allocatedAt": "timestamp",
  "status": "active|cancelled"
}
```

## 🚀 Getting Started

### Prerequisites
```bash
- Python 3.8+
- Node.js 14+ (for frontend development)
- Firebase Project with Firestore enabled
- Firebase Service Account Key
```

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd hostel_accommodation_project-master
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your Firebase credentials
```

3. **Install Python dependencies**
```bash
cd accommodation_back_end
pip install -r requirements.txt
```

4. **Configure Firebase**
- Place your `serviceAccountKey.json` in `secrets/` directory
- Update `.env` with your Firebase project ID

5. **Run the backend**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

6. **Access the application**
```
Frontend: http://localhost:8000
API Docs: http://localhost:8000/docs
```

## 🎯 Key Features Implemented

### ✅ Student Features
- [x] Responsive login/register with theme toggle
- [x] Image slider with auto-scroll
- [x] Profile management with avatar upload
- [x] Notification system with dropdown
- [x] Application submission
- [x] Application status tracking
- [x] Room viewing and selection
- [x] Personal dashboard with statistics

### ✅ Warden Features
- [x] Full admin dashboard
- [x] Application review and approval
- [x] Room allocation with business rules
- [x] Capacity enforcement
- [x] Gender restriction validation
- [x] Transaction-based allocation
- [x] Occupancy reports
- [x] Hostel and room management
- [x] Student management
- [x] Analytics and reports

### ✅ Technical Features
- [x] Light/Dark theme toggle
- [x] Responsive design (mobile-first)
- [x] Firestore transactions
- [x] Role-based access control
- [x] RESTful API architecture
- [x] Input validation
- [x] Error handling
- [x] Loading states
- [x] Toast notifications
- [x] Smooth animations

## 🎨 Color Scheme

### Primary Colors
- **Red**: #D32F2F (Primary actions, highlights)
- **Light Red**: #FF6659 (Hover states)
- **Dark Red**: #9A0007 (Active states)

### Secondary Colors
- **White**: #FFFFFF (Backgrounds, text)
- **Light Gray**: #F5F5F5 (Secondary backgrounds)
- **Gray**: #EEEEEE (Borders, dividers)

### Accent Colors
- **Green**: #4CAF50 (Success, approved)
- **Blue**: #2196F3 (Info, links)
- **Orange**: #FF9800 (Warning, pending)
- **Yellow**: #FFEB3B (Highlights)

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔒 Security Features

- Firebase Authentication
- Role-based access control (RBAC)
- Token verification on all API calls
- Input sanitization
- CORS configuration
- Secure password handling
- Session management

## 📝 License

Copyright © 2026 Africa University. All rights reserved.

## 👥 Support

For support, email hostels@africau.edu or contact the IT department.

---

**Built with ❤️ for Africa University Students**
