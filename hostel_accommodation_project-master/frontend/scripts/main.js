// Main Application Controller
class HostelApp {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // DOM Elements
        this.navMenu = document.getElementById('navMenu');
        this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        this.mainContent = document.getElementById('mainContent');
        this.loadingSpinner = document.getElementById('loadingSpinner');

        // Initialize auth manager
        authManager.init();
        

        // Check authentication and setup
        this.checkAuth();
        this.setupEventListeners();
    }

    async checkAuth() {
        // Wait for auth manager to initialize
        await new Promise(resolve => {
            const checkReady = () => {
                if (authManager.user !== undefined) {
                    resolve();
                } else {
                    setTimeout(checkReady, 100);
                }
            };
            checkReady();
        });

        // Check if user is authenticated
        if (authManager.isAuthenticated()) {
            this.loadDashboard();
        } else {
            // User is not authenticated, redirect to login
            if (!window.location.pathname.includes('login.html')) {
                // Check if we are already in the pages directory to avoid pages/pages/login.html
                const loginPath = window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
                window.location.href = loginPath;
            }
        }
        this.currentUser = authManager.user;
        this.hideLoading();
    }

    async loadDashboard() {
        // Load the dashboard content based on user role
        await this.loadPage('dashboard');
    }

    setupEventListeners() {
        // Mobile menu toggle
        this.mobileMenuBtn?.addEventListener('click', () => {
            this.navMenu.classList.toggle('active');
        });

        // Navigation clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-link')) {
                e.preventDefault();
                const target = e.target.closest('.nav-link').getAttribute('href').substring(1);
                this.loadPage(target);
                this.setActiveNav(target);

                // Close mobile menu on click
                this.navMenu.classList.remove('active');
            }
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-menu') && !e.target.closest('.mobile-menu-btn')) {
                this.navMenu.classList.remove('active');
            }
        });

        // Logout functionality
        document.addEventListener('click', (e) => {
            if (e.target.closest('.logout-btn')) {
                this.handleLogout();
            }
        });
    }

    setActiveNav(page) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`.nav-link[href="#${page}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    async loadPage(page) {
        this.showLoading();
        
        try {
            let content = '';
            
            switch(page) {
                case 'dashboard':
                    content = await this.loadDashboardContent();
                    break;
                case 'apply':
                    content = await this.loadApplicationForm();
                    break;
                case 'status':
                    content = await this.loadApplicationStatus();
                    break;
                case 'rooms':
                    content = await this.loadRoomView();
                    break;
                case 'allocation':
                    content = await this.loadAllocationPage();
                    break;
                case 'applications':
                    content = await this.loadApplicationsPage();
                    break;
                case 'reports':
                    content = await this.loadReportsPage();
                    break;
                case 'login':
                    content = await this.loadLoginPage();
                    break;
                default:
                    content = await this.loadDashboardContent();
            }
            
            this.mainContent.innerHTML = content;
            this.initPageComponents(page);
        } catch (error) {
            this.showError('Failed to load page');
        } finally {
            this.hideLoading();
        }
    }

    async loadDashboardContent() {
        const userRole = this.currentUser?.role || 'student';

        if (userRole === 'warden' || userRole === 'admin') {
            return this.loadWardenDashboard();
        } else {
            return this.loadStudentDashboard();
        }
    }

    async loadStudentDashboard() {
        const quotes = [
            "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            "Believe you can and you're halfway there.",
            "The future belongs to those who believe in the beauty of their dreams.",
            "Education is the most powerful weapon which you can use to change the world.",
            "Your time is limited, don't waste it living someone else's life."
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        const userName = this.currentUser?.name || this.currentUser?.full_name || 'Student';
        
        return `
            <div class="dashboard-header fade-in">
                <h1>Welcome back, ${userName}!</h1>
                <p style="font-style:italic;color:var(--text-secondary);margin-top:0.5rem">"${randomQuote}"</p>
            </div>

            <!-- Image Slider -->
            <div class="image-slider fade-in">
                <div class="slider-container">
                    <div class="slider-track" id="sliderTrack">
                        <div class="slide">
                            <img src="assets/images/1.jpg" alt="Hostel View 1">
                            <div class="slide-overlay">
                                <h3>Welcome, ${userName}!</h3>
                                <p>Experience comfortable living in our state-of-the-art hostels</p>
                            </div>
                        </div>
                        <div class="slide">
                            <img src="assets/images/2.jpg" alt="Hostel View 2">
                            <div class="slide-overlay">
                                <h3>Study Spaces for ${userName}</h3>
                                <p>Dedicated areas for focused academic work</p>
                            </div>
                        </div>
                        <div class="slide">
                            <img src="assets/images/3.jpg" alt="Hostel View 3">
                            <div class="slide-overlay">
                                <h3>Recreation Facilities</h3>
                                <p>Relax and unwind in our common areas</p>
                            </div>
                        </div>
                        <div class="slide">
                            <img src="assets/images/4.jpg" alt="Hostel View 4">
                            <div class="slide-overlay">
                                <h3>Safe Environment</h3>
                                <p>24/7 security for your peace of mind</p>
                            </div>
                        </div>
                    </div>
                    <button class="slider-arrow prev" onclick="app.prevSlide()">‹</button>
                    <button class="slider-arrow next" onclick="app.nextSlide()">›</button>
                    <div class="slider-nav" id="sliderNav"></div>
                </div>
            </div>

            <!-- Profile Section -->
            <div class="profile-section fade-in" style="animation-delay: 0.1s">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <img src="assets/images/logo.png" alt="Profile" id="profileImage">
                        <label class="avatar-upload" title="Change profile picture">
                            <i class="fas fa-camera"></i>
                            <input type="file" accept="image/*" onchange="app.updateProfilePicture(event)">
                        </label>
                    </div>
                    <div class="profile-info">
                        <h2>${userName}</h2>
                        <p><i class="fas fa-id-card"></i> ID: ${this.currentUser?.registration_number || this.currentUser?.uid || 'N/A'}</p>
                        <p><i class="fas fa-envelope"></i> ${this.currentUser?.email || 'email@au.edu'}</p>
                        <p><i class="fas fa-graduation-cap"></i> ${this.currentUser?.program || 'Program'}</p>
                        <button class="btn btn-outline mt-2" onclick="app.editProfile()">
                            <i class="fas fa-edit"></i> Edit Profile
                        </button>
                    </div>
                    <div class="notification-bell" onclick="app.toggleNotifications()">
                        <i class="fas fa-bell"></i>
                        <span class="notification-count" id="notificationCount">3</span>
                        <div class="notification-dropdown" id="notificationDropdown">
                            <div class="notification-header">
                                <h4>Notifications</h4>
                                <a href="#" class="mark-all-read" onclick="app.markAllRead(event)">Mark all read</a>
                            </div>
                            <div class="notification-list">
                                <div class="notification-item unread" style="display: flex; align-items: flex-start;">
                                    <div class="notification-icon">
                                        <i class="fas fa-check-circle" style="color: var(--accent-green);"></i>
                                    </div>
                                    <div class="notification-content">
                                        <div class="notification-title">Application Approved</div>
                                        <div class="notification-text">Your accommodation application has been approved!</div>
                                        <div class="notification-time">2 hours ago</div>
                                    </div>
                                </div>
                                <div class="notification-item unread" style="display: flex; align-items: flex-start;">
                                    <div class="notification-icon">
                                        <i class="fas fa-home" style="color: var(--accent-blue);"></i>
                                    </div>
                                    <div class="notification-content">
                                        <div class="notification-title">Room Allocated</div>
                                        <div class="notification-text">You've been assigned to Room A-101</div>
                                        <div class="notification-time">5 hours ago</div>
                                    </div>
                                </div>
                                <div class="notification-item" style="display: flex; align-items: flex-start;">
                                    <div class="notification-icon">
                                        <i class="fas fa-info-circle" style="color: var(--accent-orange);"></i>
                                    </div>
                                    <div class="notification-content">
                                        <div class="notification-title">Deadline Reminder</div>
                                        <div class="notification-text">Application deadline: Dec 15, 2024</div>
                                        <div class="notification-time">1 day ago</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="profile-stats">
                    <div class="stat-box">
                        <span class="stat-value">1</span>
                        <span class="stat-label">Active Application</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value">A-101</span>
                        <span class="stat-label">Room Number</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value">Approved</span>
                        <span class="stat-label">Status</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value">2026S1</span>
                        <span class="stat-label">Semester</span>
                    </div>
                </div>
            </div>

            <div class="dashboard-grid">
                <!-- Application Status -->
                <div class="card fade-in" style="animation-delay: 0.2s">
                    <div class="card-header">
                        <h3><i class="fas fa-clipboard-check"></i> Application Status</h3>
                        <span class="status-badge status-approved">
                            <i class="fas fa-check"></i> Approved
                        </span>
                    </div>
                    <p>Your application has been approved by the warden.</p>
                    <button class="btn btn-outline mt-2" onclick="app.viewApplicationDetails()">
                        View Details <i class="fas fa-arrow-right"></i>
                    </button>
                </div>

                <!-- My Room -->
                <div class="card fade-in" style="animation-delay: 0.3s">
                    <div class="card-header">
                        <h3><i class="fas fa-home"></i> My Room</h3>
                        <span class="status-badge status-approved">
                            <i class="fas fa-check"></i> Allocated
                        </span>
                    </div>
                    <div class="room-info">
                        <p><strong>Room:</strong> A-101</p>
                        <p><strong>Hostel:</strong> Hostel A</p>
                        <p><strong>Capacity:</strong> 4 students</p>
                        <p><strong>Occupied:</strong> 3 students</p>
                    </div>
                    <button class="btn btn-info mt-2" onclick="app.viewRoomDetails()">
                        <i class="fas fa-eye"></i> View Room Details
                    </button>
                </div>

                <!-- Quick Actions -->
                <div class="card fade-in" style="animation-delay: 0.4s">
                    <div class="card-header">
                        <h3><i class="fas fa-bolt"></i> Quick Actions</h3>
                    </div>
                    <div class="action-grid">
                        <button class="action-btn" onclick="app.loadPage('apply')">
                            <i class="fas fa-edit"></i>
                            <span>Apply Now</span>
                        </button>
                        <button class="action-btn" onclick="app.loadPage('status')">
                            <i class="fas fa-history"></i>
                            <span>Check Status</span>
                        </button>
                        <button class="action-btn" onclick="app.loadPage('rooms')">
                            <i class="fas fa-bed"></i>
                            <span>View Rooms</span>
                        </button>
                        <button class="action-btn" onclick="app.contactWarden()">
                            <i class="fas fa-headset"></i>
                            <span>Contact Warden</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async loadWardenDashboard() {
        return `
            <div class="dashboard-header fade-in">
                <h1>Welcome back, ${this.currentUser?.name || 'Warden'}!</h1>
                <p>Manage hostel accommodations and student allocations</p>
            </div>

            <div class="dashboard-grid">
                <!-- Overview Stats -->
                <div class="card fade-in" style="animation-delay: 0.1s">
                    <div class="card-header">
                        <h3><i class="fas fa-chart-bar"></i> Hostel Overview</h3>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-number">245</div>
                            <div class="stat-label">Total Students</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">180</div>
                            <div class="stat-label">Allocated</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">65</div>
                            <div class="stat-label">Available Beds</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">12</div>
                            <div class="stat-label">Pending Applications</div>
                        </div>
                    </div>
                </div>

                <!-- Room Allocation Management -->
                <div class="card fade-in" style="animation-delay: 0.2s">
                    <div class="card-header">
                        <h3><i class="fas fa-bed"></i> Room Management</h3>
                        <div class="card-icon">
                            <i class="fas fa-cogs"></i>
                        </div>
                    </div>
                    <p>Manage room allocations and view occupancy</p>
                    <div class="action-buttons">
                        <button class="btn btn-primary" onclick="app.loadPage('allocation')">
                            <i class="fas fa-plus"></i> Allocate Rooms
                        </button>
                        <button class="btn btn-info" onclick="app.loadPage('rooms')">
                            <i class="fas fa-eye"></i> View All Rooms
                        </button>
                    </div>
                </div>

                <!-- Application Management -->
                <div class="card fade-in" style="animation-delay: 0.3s">
                    <div class="card-header">
                        <h3><i class="fas fa-clipboard-list"></i> Applications</h3>
                        <span class="status-badge status-warning">
                            <i class="fas fa-clock"></i> 12 Pending
                        </span>
                    </div>
                    <p>Review and process student applications</p>
                    <button class="btn btn-warning mt-2" onclick="app.loadPage('applications')">
                        Review Applications <i class="fas fa-arrow-right"></i>
                    </button>
                </div>

                <!-- Quick Actions -->
                <div class="card fade-in" style="animation-delay: 0.4s">
                    <div class="card-header">
                        <h3><i class="fas fa-bolt"></i> Quick Actions</h3>
                    </div>
                    <div class="action-grid">
                        <button class="action-btn" onclick="app.generateReports()">
                            <i class="fas fa-chart-line"></i>
                            <span>Generate Reports</span>
                        </button>
                        <button class="action-btn" onclick="app.manageHostels()">
                            <i class="fas fa-building"></i>
                            <span>Manage Hostels</span>
                        </button>
                        <button class="action-btn" onclick="app.viewStudents()">
                            <i class="fas fa-users"></i>
                            <span>View Students</span>
                        </button>
                        <button class="action-btn" onclick="app.systemSettings()">
                            <i class="fas fa-cog"></i>
                            <span>System Settings</span>
                        </button>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="card fade-in" style="animation-delay: 0.5s">
                    <div class="card-header">
                        <h3><i class="fas fa-history"></i> Recent Activity</h3>
                    </div>
                    <div class="activity-list">
                        <div class="activity-item">
                            <i class="fas fa-user-plus text-success"></i>
                            <div>
                                <p>Room A-101 allocated to John Doe</p>
                                <small>2 hours ago</small>
                            </div>
                        </div>
                        <div class="activity-item">
                            <i class="fas fa-file-alt text-info"></i>
                            <div>
                                <p>Application approved for Jane Smith</p>
                                <small>4 hours ago</small>
                            </div>
                        </div>
                        <div class="activity-item">
                            <i class="fas fa-user-times text-warning"></i>
                            <div>
                                <p>Room B-205 vacated by Bob Johnson</p>
                                <small>1 day ago</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- System Alerts -->
                <div class="card fade-in" style="animation-delay: 0.6s">
                    <div class="card-header">
                        <h3><i class="fas fa-exclamation-triangle"></i> System Alerts</h3>
                        <span class="notification-badge">3</span>
                    </div>
                    <div class="alert-list">
                        <div class="alert-item alert-warning">
                            <i class="fas fa-tools"></i>
                            <div>
                                <p>Hostel A maintenance scheduled for next week</p>
                                <small>Action required</small>
                            </div>
                        </div>
                        <div class="alert-item alert-info">
                            <i class="fas fa-calendar-check"></i>
                            <div>
                                <p>Semester allocation deadline approaching</p>
                                <small>5 days remaining</small>
                            </div>
                        </div>
                        <div class="alert-item alert-success">
                            <i class="fas fa-check-circle"></i>
                            <div>
                                <p>All room inspections completed</p>
                                <small>Updated today</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadApplicationForm() {
        return `
            <div class="application-form fade-in">
                <div class="form-header">
                    <h1><i class="fas fa-edit"></i> Accommodation Application</h1>
                    <p>Fill out the form below to apply for hostel accommodation</p>
                </div>
                
                <form id="applicationForm" onsubmit="app.submitApplication(event)">
                    <div class="form-grid">
                        <!-- Personal Information -->
                        <div class="form-section">
                            <h3><i class="fas fa-user"></i> Personal Information</h3>
                            <div class="form-group">
                                <label class="form-label">Full Name</label>
                                <input type="text" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Registration Number</label>
                                <input type="text" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Gender</label>
                                <select class="form-control" required>
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- Academic Information -->
                        <div class="form-section">
                            <h3><i class="fas fa-graduation-cap"></i> Academic Information</h3>
                            <div class="form-group">
                                <label class="form-label">Program</label>
                                <select class="form-control" required>
                                    <option value="">Select Program</option>
                                    <option value="ai">BSc Artificial Intelligence</option>
                                    <option value="cs">BSc Computer Science</option>
                                    <option value="engineering">BSc Engineering</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Year of Study</label>
                                <select class="form-control" required>
                                    <option value="">Select Year</option>
                                    <option value="1">Year 1</option>
                                    <option value="2">Year 2</option>
                                    <option value="3">Year 3</option>
                                    <option value="4">Year 4</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- Hostel Preferences -->
                        <div class="form-section">
                            <h3><i class="fas fa-home"></i> Hostel Preferences</h3>
                            <div class="form-group">
                                <label class="form-label">Preferred Hostel (1st Choice)</label>
                                <select class="form-control" required>
                                    <option value="">Select Hostel</option>
                                    <option value="hostel_a">Hostel A - Male</option>
                                    <option value="hostel_b">Hostel B - Female</option>
                                    <option value="hostel_c">Hostel C - Mixed</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Preferred Hostel (2nd Choice)</label>
                                <select class="form-control">
                                    <option value="">Select Hostel</option>
                                    <option value="hostel_a">Hostel A - Male</option>
                                    <option value="hostel_b">Hostel B - Female</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Room Type Preference</label>
                                <select class="form-control">
                                    <option value="">Select Room Type</option>
                                    <option value="single">Single Room</option>
                                    <option value="double">Double Room</option>
                                    <option value="quad">Quad Room (4 persons)</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- Special Requirements -->
                        <div class="form-section">
                            <h3><i class="fas fa-star"></i> Special Requirements</h3>
                            <div class="checkbox-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="disability">
                                    <span>I have a disability requiring special accommodation</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" name="medical">
                                    <span>I have medical conditions requiring attention</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" name="final_year">
                                    <span>I am a final year student (priority consideration)</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Additional Notes (Optional)</label>
                                <textarea class="form-control" rows="3" placeholder="Any additional information..."></textarea>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" onclick="app.loadPage('dashboard')">
                            <i class="fas fa-arrow-left"></i> Back to Dashboard
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-paper-plane"></i> Submit Application
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    async loadLoginPage() {
        return `
            <div class="login-container fade-in">
                <div class="login-card">
                    <div class="login-header">
                        <h1><i class="fas fa-hotel"></i> AU Hostel Login</h1>
                        <p>Welcome to African University Hostel Accommodation System</p>
                    </div>
                    
                    <div class="login-tabs">
                        <button class="tab-btn active" onclick="app.switchTab('login')">Login</button>
                        <button class="tab-btn" onclick="app.switchTab('register')">Register</button>
                    </div>
                    
                    <div id="loginForm" class="auth-form">
                        <form onsubmit="app.handleLogin(event)">
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Password</label>
                                <input type="password" class="form-control" required>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block">
                                <i class="fas fa-sign-in-alt"></i> Login
                            </button>
                        </form>
                    </div>
                    
                    <div id="registerForm" class="auth-form hidden">
                        <form onsubmit="app.handleRegister(event)">
                            <div class="form-group">
                                <label class="form-label">Full Name</label>
                                <input type="text" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Password</label>
                                <input type="password" class="form-control" required minlength="6">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Confirm Password</label>
                                <input type="password" class="form-control" required minlength="6">
                            </div>
                            <button type="submit" class="btn btn-primary btn-block">
                                <i class="fas fa-user-plus"></i> Register
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    async loadRoomView() {
        return `
            <div class="room-view-container">
                <div class="page-header">
                    <h1><i class="fas fa-bed"></i> Available Rooms</h1>
                    <p>Browse available rooms and check occupancy status</p>
                </div>

                <div class="filters-section">
                    <div class="filter-group">
                        <label for="hostelFilter">Hostel:</label>
                        <select id="hostelFilter">
                            <option value="">All Hostels</option>
                            <option value="hostel_a">Hostel A</option>
                            <option value="hostel_b">Hostel B</option>
                            <option value="hostel_c">Hostel C</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="capacityFilter">Room Type:</label>
                        <select id="capacityFilter">
                            <option value="">All Types</option>
                            <option value="1">Single</option>
                            <option value="2">Double</option>
                            <option value="4">Quad</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" onclick="app.filterRooms()">
                        <i class="fas fa-filter"></i> Apply Filters
                    </button>
                </div>

                <div class="room-grid" id="roomGrid">
                    ${this.generateRoomCards()}
                </div>
            </div>
        `;
    }

    // Utility Methods
    showLoading() {
        this.loadingSpinner.style.display = 'flex';
    }

    hideLoading() {
        this.loadingSpinner.style.display = 'none';
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.getElementById('toastContainer').appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    // Placeholder methods for functionality
    submitApplication(e) {
        e.preventDefault();
        this.showToast('Application submitted successfully!', 'success');
        setTimeout(() => this.loadPage('dashboard'), 1500);
    }

    filterRooms() {
        // Placeholder for room filtering functionality
        this.showToast('Filters applied!', 'success');
    }

    contactWarden() {
        this.showToast('Opening contact form...', 'info');
    }

    viewHostelRules() {
        this.showToast('Loading hostel rules...', 'info');
    }

    generateReports() {
        this.showToast('Reports feature coming soon!', 'info');
    }

    manageHostels() {
        this.showToast('Hostel management feature coming soon!', 'info');
    }

    viewStudents() {
        this.showToast('Student management feature coming soon!', 'info');
    }

    systemSettings() {
        this.showToast('System settings feature coming soon!', 'info');
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(form => form.classList.add('hidden'));
        
        document.querySelector(`[onclick="app.switchTab('${tab}')"]`).classList.add('active');
        document.getElementById(`${tab}Form`).classList.remove('hidden');
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        
        const result = await authManager.signIn(email, password);
        if (result.success) {
            this.showToast('Login successful!', 'success');
        } else {
            this.showError(result.error);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }
        
        const result = await authManager.signUp(email, password, { name, email });
        if (result.success) {
            this.showToast('Registration successful!', 'success');
        } else {
            this.showError(result.error);
        }
    }

    async loadAllocationPage() {
        // Check if user has permission
        if (!this.currentUser || (this.currentUser.role !== 'warden' && this.currentUser.role !== 'admin')) {
            return `
                <div class="error-container">
                    <h2><i class="fas fa-lock"></i> Access Denied</h2>
                    <p>You don't have permission to access the room allocation page.</p>
                    <button class="btn btn-primary" onclick="app.loadPage('dashboard')">Go to Dashboard</button>
                </div>
            `;
        }

        // Load the allocation page content
        try {
            const response = await fetch('pages/allocation.html');
            const html = await response.text();
            return html;
        } catch (error) {
            console.error('Error loading allocation page:', error);
            return `
                <div class="error-container">
                    <h2><i class="fas fa-exclamation-triangle"></i> Error</h2>
                    <p>Failed to load the allocation page. Please try again.</p>
                    <button class="btn btn-primary" onclick="app.loadPage('dashboard')">Go to Dashboard</button>
                </div>
            `;
        }
    }

    async loadApplicationsPage() {
        // Check if user has permission
        if (!this.currentUser || (this.currentUser.role !== 'warden' && this.currentUser.role !== 'admin')) {
            return `
                <div class="error-container">
                    <h2><i class="fas fa-lock"></i> Access Denied</h2>
                    <p>You don't have permission to access the applications page.</p>
                    <button class="btn btn-primary" onclick="app.loadPage('dashboard')">Go to Dashboard</button>
                </div>
            `;
        }

        return `
            <div class="applications-container">
                <div class="page-header">
                    <h1><i class="fas fa-clipboard-list"></i> Applications Management</h1>
                    <p>Review and process student accommodation applications</p>
                </div>

                <div class="applications-grid">
                    <div class="applications-list">
                        <h3>Pending Applications (12)</h3>
                        <div class="application-items">
                            <div class="application-item">
                                <div class="application-header">
                                    <h4>John Doe</h4>
                                    <span class="status-badge status-pending">Pending</span>
                                </div>
                                <p>Applied for: Double Room, Hostel A</p>
                                <p>Submitted: 2 days ago</p>
                                <div class="application-actions">
                                    <button class="btn btn-success btn-sm" onclick="app.approveApplication('john-doe')">Approve</button>
                                    <button class="btn btn-danger btn-sm" onclick="app.rejectApplication('john-doe')">Reject</button>
                                    <button class="btn btn-info btn-sm" onclick="app.viewApplicationDetails('john-doe')">View Details</button>
                                </div>
                            </div>
                            <!-- More application items would be loaded dynamically -->
                        </div>
                    </div>

                    <div class="application-stats">
                        <div class="stat-card">
                            <h4>Total Applications</h4>
                            <div class="stat-number">45</div>
                        </div>
                        <div class="stat-card">
                            <h4>Approved</h4>
                            <div class="stat-number">28</div>
                        </div>
                        <div class="stat-card">
                            <h4>Rejected</h4>
                            <div class="stat-number">5</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadReportsPage() {
        // Check if user has permission
        if (!this.currentUser || (this.currentUser.role !== 'warden' && this.currentUser.role !== 'admin')) {
            return `
                <div class="error-container">
                    <h2><i class="fas fa-lock"></i> Access Denied</h2>
                    <p>You don't have permission to access the reports page.</p>
                    <button class="btn btn-primary" onclick="app.loadPage('dashboard')">Go to Dashboard</button>
                </div>
            `;
        }

        return `
            <div class="reports-container">
                <div class="page-header">
                    <h1><i class="fas fa-chart-bar"></i> Reports & Analytics</h1>
                    <p>Generate reports and view hostel statistics</p>
                </div>

                <div class="reports-grid">
                    <div class="report-card">
                        <h3>Occupancy Report</h3>
                        <p>Current room occupancy across all hostels</p>
                        <button class="btn btn-primary" onclick="app.generateOccupancyReport()">Generate Report</button>
                    </div>

                    <div class="report-card">
                        <h3>Application Trends</h3>
                        <p>Monthly application submission trends</p>
                        <button class="btn btn-primary" onclick="app.generateApplicationTrends()">Generate Report</button>
                    </div>

                    <div class="report-card">
                        <h3>Revenue Report</h3>
                        <p>Accommodation fees and payments</p>
                        <button class="btn btn-primary" onclick="app.generateRevenueReport()">Generate Report</button>
                    </div>

                    <div class="report-card">
                        <h3>Maintenance Report</h3>
                        <p>Room maintenance and repairs</p>
                        <button class="btn btn-primary" onclick="app.generateMaintenanceReport()">Generate Report</button>
                    </div>
                </div>
            </div>
        `;
    }

    // Warden-specific methods
    async approveApplication(applicationId) {
        if (!this.currentUser || (this.currentUser.role !== 'warden' && this.currentUser.role !== 'admin')) {
            this.showError('Access denied');
            return;
        }

        if (confirm('Are you sure you want to approve this application?')) {
            // Mock API call - in development mode
            this.showToast('Application approved successfully (Demo Mode)', 'success');
            setTimeout(() => {
                this.loadPage('applications');
            }, 1000);
        }
    }

    async rejectApplication(applicationId) {
        if (!this.currentUser || (this.currentUser.role !== 'warden' && this.currentUser.role !== 'admin')) {
            this.showError('Access denied');
            return;
        }

        const reason = prompt('Please provide a reason for rejection:');
        if (reason) {
            // Mock API call - in development mode
            this.showToast('Application rejected (Demo Mode)', 'warning');
            setTimeout(() => {
                this.loadPage('applications');
            }, 1000);
        }
    }

    async viewApplicationDetails(applicationId) {
        if (!this.currentUser || (this.currentUser.role !== 'warden' && this.currentUser.role !== 'admin')) {
            this.showError('Access denied');
            return;
        }

        // Mock application details - in development mode
        const mockApplication = {
            studentName: 'John Doe',
            registrationNumber: '123456',
            email: 'john.doe@au.edu',
            hostelChoice: 'Hostel A',
            roomType: 'Double',
            status: 'Pending',
            submittedDate: '2024-01-15'
        };

        this.showToast(`Application details loaded (Demo Mode)`, 'info');
        setTimeout(() => {
            alert(`Application Details:\n${JSON.stringify(mockApplication, null, 2)}`);
        }, 500);
    }

    async generateOccupancyReport() {
        if (!this.currentUser || (this.currentUser.role !== 'warden' && this.currentUser.role !== 'admin')) {
            this.showError('Access denied');
            return;
        }

        // Mock occupancy report - in development mode
        const mockReport = {
            totalRooms: 100,
            occupiedRooms: 85,
            occupancyRate: '85%',
            vacantRooms: 15,
            byHostel: {
                'Hostel A': { occupied: 45, total: 50, rate: '90%' },
                'Hostel B': { occupied: 40, total: 50, rate: '80%' }
            }
        };

        this.showToast('Occupancy report generated (Demo Mode)', 'success');
        setTimeout(() => {
            alert('Occupancy Report:\n' + JSON.stringify(mockReport, null, 2));
        }, 500);
    }

    async generateApplicationTrends() {
        if (!this.currentUser || (this.currentUser.role !== 'warden' && this.currentUser.role !== 'admin')) {
            this.showError('Access denied');
            return;
        }

        // Mock application trends report - in development mode
        const mockReport = {
            totalApplications: 150,
            approved: 120,
            rejected: 20,
            pending: 10,
            monthlyTrends: {
                'Jan': 25,
                'Feb': 30,
                'Mar': 35,
                'Apr': 40,
                'May': 20
            },
            approvalRate: '80%'
        };

        this.showToast('Application trends report generated (Demo Mode)', 'success');
        setTimeout(() => {
            alert('Application Trends Report:\n' + JSON.stringify(mockReport, null, 2));
        }, 500);
    }

    async generateRevenueReport() {
        if (!this.currentUser || (this.currentUser.role !== 'warden' && this.currentUser.role !== 'admin')) {
            this.showError('Access denied');
            return;
        }

        // Mock revenue report - in development mode
        const mockReport = {
            totalRevenue: 150000,
            monthlyRevenue: {
                'Jan': 12000,
                'Feb': 15000,
                'Mar': 18000,
                'Apr': 20000,
                'May': 25000
            },
            averageMonthlyRevenue: 18000,
            paymentMethods: {
                'Cash': 40,
                'Bank Transfer': 35,
                'Online Payment': 25
            }
        };

        this.showToast('Revenue report generated (Demo Mode)', 'success');
        setTimeout(() => {
            alert('Revenue Report:\n' + JSON.stringify(mockReport, null, 2));
        }, 500);
    }

    async generateMaintenanceReport() {
        if (!this.currentUser || (this.currentUser.role !== 'warden' && this.currentUser.role !== 'admin')) {
            this.showError('Access denied');
            return;
        }

        // Mock maintenance report - in development mode
        const mockReport = {
            totalRequests: 45,
            pendingRequests: 12,
            completedRequests: 33,
            urgentRequests: 5,
            byCategory: {
                'Electrical': 15,
                'Plumbing': 10,
                'Structural': 8,
                'Cleaning': 12
            },
            averageResolutionTime: '3.5 days'
        };

        this.showToast('Maintenance report generated (Demo Mode)', 'success');
        setTimeout(() => {
            alert('Maintenance Report:\n' + JSON.stringify(mockReport, null, 2));
        }, 500);
    }

    async handleLogout() {
        try {
            await authManager.signOut();
            this.showToast('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = 'pages/login.html';
            }, 1000);
        } catch (error) {
            console.error('Logout error:', error);
            this.showToast('Error logging out', 'error');
        }
    }

    async loadApplicationStatus() {
        return '<div class="page-header"><h1>Application Status</h1><p>View your application status here</p></div>';
    }



    // Image Slider Functionality
    initSlider() {
        this.currentSlide = 0;
        this.totalSlides = 4;
        this.autoSlideInterval = null;
        
        // Create slider dots
        const sliderNav = document.getElementById('sliderNav');
        if (sliderNav) {
            for (let i = 0; i < this.totalSlides; i++) {
                const dot = document.createElement('div');
                dot.className = `slider-dot ${i === 0 ? 'active' : ''}`;
                dot.onclick = () => this.goToSlide(i);
                sliderNav.appendChild(dot);
            }
            
            // Start auto-slide
            this.startAutoSlide();
        }
    }

    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
        this.updateSlider();
        this.resetAutoSlide();
    }

    prevSlide() {
        this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.updateSlider();
        this.resetAutoSlide();
    }

    goToSlide(index) {
        this.currentSlide = index;
        this.updateSlider();
        this.resetAutoSlide();
    }

    updateSlider() {
        const track = document.getElementById('sliderTrack');
        const dots = document.querySelectorAll('.slider-dot');
        
        if (track) {
            track.style.transform = `translateX(-${this.currentSlide * 100}%)`;
        }
        
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
    }

    startAutoSlide() {
        this.autoSlideInterval = setInterval(() => {
            this.nextSlide();
        }, 5000); // Change slide every 5 seconds
    }

    resetAutoSlide() {
        clearInterval(this.autoSlideInterval);
        this.startAutoSlide();
    }

    // Theme Toggle
    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const themeIcon = document.getElementById('themeIcon');
        const themeText = document.getElementById('themeText');
        
        if (themeIcon && themeText) {
            if (newTheme === 'dark') {
                themeIcon.className = 'fas fa-sun';
                themeText.textContent = 'Light';
            } else {
                themeIcon.className = 'fas fa-moon';
                themeText.textContent = 'Dark';
            }
        }
        
        this.showToast(`Switched to ${newTheme} mode`, 'success');
    }

    // Notification Management
    toggleNotifications() {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    markAllRead(event) {
        event.preventDefault();
        const notificationItems = document.querySelectorAll('.notification-item.unread');
        notificationItems.forEach(item => {
            item.classList.remove('unread');
        });
        
        const notificationCount = document.getElementById('notificationCount');
        if (notificationCount) {
            notificationCount.textContent = '0';
            notificationCount.style.display = 'none';
        }
        
        this.showToast('All notifications marked as read', 'success');
    }

    // Profile Management
    updateProfilePicture(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const profileImage = document.getElementById('profileImage');
                if (profileImage) {
                    profileImage.src = e.target.result;
                    this.showToast('Profile picture updated successfully', 'success');
                }
            };
            reader.readAsDataURL(file);
        }
    }

    editProfile() {
        this.showToast('Opening profile editor...', 'info');
        // TODO: Implement profile editing modal
    }

    viewApplicationDetails() {
        this.showToast('Loading application details...', 'info');
        // TODO: Implement application details view
    }

    viewRoomDetails() {
        this.showToast('Loading room details...', 'info');
        // TODO: Implement room details view
    }

    initPageComponents(page) {
        // Initialize page-specific components
        if (page === 'dashboard') {
            // Initialize slider if on dashboard
            setTimeout(() => {
                this.initSlider();
            }, 100);
        }
        
        // Close notification dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const notificationBell = document.querySelector('.notification-bell');
            const notificationDropdown = document.getElementById('notificationDropdown');
            
            if (notificationBell && notificationDropdown && 
                !notificationBell.contains(e.target) && 
                !notificationDropdown.contains(e.target)) {
                notificationDropdown.classList.remove('show');
            }
        });
    }

    generateRoomCards() {
        // Generate sample room cards
        const rooms = [
            { number: 'A-101', hostel: 'Hostel A', capacity: 4, occupied: 2, type: 'Quad', available: true },
            { number: 'A-102', hostel: 'Hostel A', capacity: 2, occupied: 1, type: 'Double', available: true },
            { number: 'A-103', hostel: 'Hostel A', capacity: 4, occupied: 4, type: 'Quad', available: false },
            { number: 'B-201', hostel: 'Hostel B', capacity: 2, occupied: 0, type: 'Double', available: true },
            { number: 'B-202', hostel: 'Hostel B', capacity: 4, occupied: 3, type: 'Quad', available: true },
            { number: 'B-203', hostel: 'Hostel B', capacity: 1, occupied: 0, type: 'Single', available: true },
        ];

        return rooms.map(room => `
            <div class="room-card ${room.available ? 'available' : 'full'}">
                <div class="room-card-header">
                    <h4>Room ${room.number}</h4>
                    <span class="room-type">${room.type}</span>
                </div>
                <div class="room-info">
                    <p><i class="fas fa-building"></i> ${room.hostel}</p>
                    <p><i class="fas fa-users"></i> Capacity: ${room.capacity}</p>
                    <p><i class="fas fa-user-check"></i> Occupied: ${room.occupied}</p>
                    <p><i class="fas fa-door-open"></i> Available: ${room.capacity - room.occupied}</p>
                </div>
                <div class="availability-meter">
                    <div class="meter-fill" style="width: ${(room.occupied / room.capacity) * 100}%"></div>
                </div>
                <button class="btn ${room.available ? 'btn-primary' : 'btn-outline'}" 
                        ${!room.available ? 'disabled' : ''} 
                        onclick="app.selectRoom('${room.number}')">
                    ${room.available ? '<i class="fas fa-check"></i> Select Room' : '<i class="fas fa-lock"></i> Full'}
                </button>
            </div>
        `).join('');
    }

    selectRoom(roomNumber) {
        this.showToast(`Room ${roomNumber} selected. Proceeding to application...`, 'success');
        setTimeout(() => {
            this.loadPage('apply');
        }, 1500);
    }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
});

// Make theme toggle globally available
window.toggleTheme = function() {
    if (window.app) {
        window.app.toggleTheme();
    }
};

// Initialize the app
// Initialize the app
window.addEventListener('DOMContentLoaded', () => {
    const app = new HostelApp();
    window.app = app;
});
