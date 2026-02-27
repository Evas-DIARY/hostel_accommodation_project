// Main Application Controller
class HostelApp {
    constructor() {
        this.currentUser = null;
    }

    async init() {
        // DOM Elements
        this.navMenu = document.getElementById('navMenu');
        this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        this.mainContent = document.getElementById('mainContent');
        this.loadingSpinner = document.getElementById('loadingSpinner');

        // Initialize Firebase service first to enable persistence before any DB calls
        if (typeof window.firebaseAuth !== 'undefined' && window.firebaseService) {
            await window.firebaseService.init();
        }

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
        const userId = this.currentUser?.id || this.currentUser?.registration_number;
        
        // Start listening to applications and allocations if Firebase is enabled
        if (window.firebaseService && typeof window.firebaseAuth !== 'undefined') {
             // We setup listeners and update the DOM directly when data changes
             setTimeout(() => {
                 window.firebaseService.listenToApplications(userId, (applications) => {
                     const appStatusContainer = document.getElementById('dashboard-app-status-inner');
                     if (appStatusContainer) {
                         if (applications.length > 0) {
                             const latestApp = applications[0]; // Assuming sorted or just taking latest
                             appStatusContainer.innerHTML = \`
                                <p>Latest Application Status: <strong class="\${latestApp.status === 'approved' ? 'text-green' : 'text-orange'}">\${latestApp.status.toUpperCase()}</strong></p>
                                <button class="btn btn-outline mt-2 futuristic" onclick="app.viewApplicationDetails('\${latestApp.id}')">
                                    View Details <i class="fas fa-arrow-right"></i>
                                </button>
                             \`;
                         } else {
                              appStatusContainer.innerHTML = \`<p>No applications found.</p>\`;
                         }
                     }
                 });

                 window.firebaseService.listenToRoomAllocation(userId, (allocations) => {
                     const roomStatusContainer = document.getElementById('dashboard-room-status-inner');
                     if (roomStatusContainer) {
                         if (allocations.length > 0) {
                             const allocation = allocations[0];
                             roomStatusContainer.innerHTML = \`
                                <div class="room-info" style="color: var(--text-primary); font-size: 1.1rem; margin-bottom: 1rem;">
                                    <p><strong>Room:</strong> <span style="color: var(--neon-blue); text-shadow: var(--shadow-neon);">\${allocation.roomId || 'Assigned'}</span></p>
                                    <p><strong>Hostel:</strong> \${allocation.hostelBlock || 'Standard Block'}</p>
                                </div>
                                <button class="btn btn-info mt-2 futuristic pulse-neon" onclick="app.viewRoomDetails()">
                                    <i class="fas fa-eye"></i> View Room Details
                                </button>
                             \`;
                             document.getElementById('room-status-badge').innerHTML = \`<i class="fas fa-check"></i> Allocated\`;
                         } else {
                              roomStatusContainer.innerHTML = \`<p>You have not been allocated a room yet.</p>\`;
                              document.getElementById('room-status-badge').innerHTML = \`<i class="fas fa-clock"></i> Pending\`;
                         }
                     }
                 });
             }, 500);
        }

        return \`
            <div class="dashboard-header futuristic fade-in" style="padding: 2rem; border-radius: 16px; margin-bottom: 2rem;">
                <h1 style="color: var(--text-primary); text-shadow: var(--shadow-neon);">Welcome back, \${userName}!</h1>
                <p style="font-style:italic;color:var(--text-secondary);margin-top:0.5rem">"\${randomQuote}"</p>
            </div>

            <!-- Profile Section -->
            <div class="profile-section fade-in glass-panel" style="animation-delay: 0.1s; margin-bottom: 2rem; padding: 2rem;">
                <div class="profile-header">
                    <div class="profile-avatar" style="box-shadow: var(--shadow-neon); border-radius: 50%;">
                        <img src="assets/images/logo.png" alt="Profile" id="profileImage">
                    </div>
                    <div class="profile-info">
                        <h2 style="color: var(--neon-blue);">\${userName}</h2>
                        <p><i class="fas fa-id-card"></i> ID: \${userId || 'N/A'}</p>
                        <p><i class="fas fa-envelope"></i> \${this.currentUser?.email || 'email@au.edu'}</p>
                        <p><i class="fas fa-graduation-cap"></i> \${this.currentUser?.program || 'Program'}</p>
                    </div>
                </div>
            </div>

            <div class="dashboard-grid">
                <!-- Application Status -->
                <div class="card fade-in glass-panel" style="animation-delay: 0.2s">
                    <div class="card-header">
                        <h3 style="color: var(--text-primary);"><i class="fas fa-clipboard-check" style="color: var(--neon-purple);"></i> Application Status</h3>
                    </div>
                    <div id="dashboard-app-status-inner">
                        <div class="spinner" style="width: 20px; height: 20px;"></div> Loading...
                    </div>
                </div>

                <!-- My Room / Real-Time allocation injected here -->
                <div class="card fade-in glass-panel" style="animation-delay: 0.3s">
                    <div class="card-header">
                        <h3 style="color: var(--text-primary);"><i class="fas fa-home" style="color: var(--neon-blue);"></i> My Room</h3>
                        <span id="room-status-badge" class="status-badge status-approved" style="color: var(--neon-blue); border-color: var(--neon-blue);">
                            <i class="fas fa-spinner fa-spin"></i> Checking
                        </span>
                    </div>
                    <div id="dashboard-room-status-inner">
                        <div class="spinner" style="width: 20px; height: 20px;"></div> Loading room data...
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="card fade-in glass-panel" style="animation-delay: 0.4s">
                    <div class="card-header">
                        <h3 style="color: var(--text-primary);"><i class="fas fa-bolt" style="color: var(--primary-red); text-shadow: 0 0 10px rgba(211,47,47,0.5);"></i> Quick Actions</h3>
                    </div>
                    <div class="action-grid">
                        <button class="action-btn futuristic glass-panel" onclick="app.loadPage('apply')">
                            <i class="fas fa-edit" style="color: var(--neon-purple);"></i>
                            <span style="color: var(--text-primary);">Apply Now</span>
                        </button>
                        <button class="action-btn futuristic glass-panel" onclick="app.loadPage('status')">
                            <i class="fas fa-history" style="color: var(--neon-blue);"></i>
                            <span style="color: var(--text-primary);">Check Status</span>
                        </button>
                    </div>
                </div>
            </div>
        \`;
    }

    async loadWardenDashboard() {
        // Start listening to pending applications if Firebase is enabled
        if (window.firebaseService && typeof window.firebaseAuth !== 'undefined') {
             setTimeout(() => {
                 window.firebaseService.listenToPendingApplications((applications) => {
                     const listContainer = document.getElementById('warden-pending-apps-list');
                     const countContainer = document.getElementById('warden-pending-count');
                     
                     if (listContainer && countContainer) {
                         countContainer.innerHTML = \`<i class="fas fa-clock"></i> \${applications.length} Pending\`;
                         
                         if (applications.length > 0) {
                             listContainer.innerHTML = applications.map(app => \`
                                <div class="application-item" style="padding: 1rem; border-bottom: 1px solid var(--border-color); background: var(--bg-primary); border-radius: 8px; margin-bottom: 0.5rem;">
                                    <p><strong>\${app.studentName || 'Student'}</strong></p>
                                    <p style="font-size: 0.9rem; color: var(--text-secondary);">Applied: \${app.submittedAt ? new Date(app.submittedAt.toDate()).toLocaleDateString() : 'Recently'}</p>
                                    <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                                        <button class="btn btn-success btn-sm futuristic pulse-neon" style="background: var(--accent-green); color: white; border:none;" onclick="app.approveApplication('\${app.id}')">Approve</button>
                                        <button class="btn btn-danger btn-sm futuristic" style="background: var(--primary-red); color: white; border:none;" onclick="app.rejectApplication('\${app.id}')">Reject</button>
                                    </div>
                                </div>
                             \`).join('');
                         } else {
                             listContainer.innerHTML = \`<p style="color: var(--text-secondary); text-align: center; padding: 1rem;">No pending applications.</p>\`;
                         }
                     }
                 });
             }, 500);
        }

        return \`
            <div class="dashboard-header futuristic fade-in" style="padding: 2rem; border-radius: 16px; margin-bottom: 2rem;">
                <h1 style="color: var(--text-primary); text-shadow: var(--shadow-neon);">Warden Dashboard - <span style="color: var(--neon-purple);">\${this.currentUser?.name || 'Warden'}</span></h1>
                <p style="color: var(--text-secondary);">Manage hostel accommodations, review applications, and allocate rooms in real-time</p>
            </div>

            <div class="dashboard-grid">
                <!-- Pending Applications -->
                <div class="card fade-in glass-panel" style="animation-delay: 0.1s">
                    <div class="card-header">
                        <h3 style="color: var(--text-primary);"><i class="fas fa-clipboard-list" style="color: var(--neon-blue);"></i> Pending Applications</h3>
                        <span id="warden-pending-count" class="status-badge status-pending" style="color: var(--accent-orange); border-color: var(--accent-orange);">
                            <i class="fas fa-spinner fa-spin"></i> Loading...
                        </span>
                    </div>
                    <div id="warden-pending-apps-list" class="application-list" style="max-height: 300px; overflow-y: auto; padding-right: 0.5rem;">
                        <div class="spinner" style="margin: 2rem auto;"></div>
                    </div>
                    <button class="btn btn-primary futuristic mt-2" onclick="app.loadPage('applications')" style="width: 100%; margin-top: 1rem;">
                        View All Applications <i class="fas fa-arrow-right"></i>
                    </button>
                </div>

                <!-- Room Allocation -->
                <div class="card fade-in glass-panel" style="animation-delay: 0.2s">
                    <div class="card-header">
                        <h3 style="color: var(--text-primary);"><i class="fas fa-bed" style="color: var(--neon-purple);"></i> Room Allocation</h3>
                    </div>
                    <p style="color: var(--text-secondary);">Allocate approved students to available rooms dynamically</p>
                    <button class="btn btn-primary futuristic pulse-neon mt-2" onclick="app.loadPage('allocation')" style="width: 100%; margin-top: 1rem;">
                        <i class="fas fa-plus"></i> Open Allocation Interface
                    </button>
                </div>
                
                <!-- Quick Stats Placeholder -->
                <div class="card fade-in glass-panel" style="animation-delay: 0.3s">
                    <div class="card-header">
                        <h3 style="color: var(--text-primary);"><i class="fas fa-chart-bar" style="color: var(--neon-blue);"></i> Statistics</h3>
                    </div>
                    <div style="font-style: italic; color: var(--text-secondary); padding: 1rem; text-align: center;">
                       Live analytics connected to Firestore coming soon...
                    </div>
                </div>
            </div>
        \`;
    }

    async loadApplicationForm() {
        const userGender = this.currentUser?.gender;
        return `
            <div class="application-form fade-in" style="max-width: 900px; margin: 0 auto;">
                <div class="form-header" style="text-align: center; margin-bottom: 2rem; background: linear-gradient(135deg, var(--primary-red) 0%, var(--primary-dark) 100%); padding: 2rem; border-radius: 16px; color: white;">
                    <h1 style="color: white; margin-bottom: 0.5rem;"><i class="fas fa-file-alt"></i> Accommodation Application</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 0;">Complete your hostel accommodation application</p>
                </div>
                
                <form id="applicationForm" onsubmit="app.submitApplication(event)" style="background: var(--bg-primary); padding: 2rem; border-radius: 16px; box-shadow: var(--shadow-lg);">
                    <div class="form-grid" style="display: grid; gap: 2rem;">
                        <!-- Personal Information -->
                        <div class="form-section" style="background: linear-gradient(135deg, rgba(211, 47, 47, 0.05) 0%, transparent 100%); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--primary-red);">
                            <h3 style="color: var(--primary-red); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-user"></i> Personal Information
                            </h3>
                            <div class="form-row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                                <div class="form-group">
                                    <label class="form-label" style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem; display: block;">Full Name</label>
                                    <input type="text" class="form-control" value="${this.currentUser?.name || ''}" readonly style="background: var(--bg-secondary);">
                                </div>
                                <div class="form-group">
                                    <label class="form-label" style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem; display: block;">Registration Number</label>
                                    <input type="text" class="form-control" value="${this.currentUser?.id || ''}" readonly style="background: var(--bg-secondary);">
                                </div>
                                <div class="form-group">
                                    <label class="form-label" style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem; display: block;">Gender</label>
                                    <input type="text" class="form-control" value="${userGender === 'female' ? 'Female' : 'Male'}" readonly style="background: var(--bg-secondary);">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Academic Information -->
                        <div class="form-section" style="background: linear-gradient(135deg, rgba(211, 47, 47, 0.05) 0%, transparent 100%); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--primary-red);">
                            <h3 style="color: var(--primary-red); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-graduation-cap"></i> Academic Information
                            </h3>
                            <div class="form-row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                                <div class="form-group">
                                    <label class="form-label" style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem; display: block;">Program</label>
                                    <input type="text" class="form-control" value="${this.currentUser?.program || ''}" readonly style="background: var(--bg-secondary);">
                                </div>
                                <div class="form-group">
                                    <label class="form-label" style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem; display: block;">Year of Study</label>
                                    <select class="form-control" required style="padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 8px; transition: all 0.3s ease;">
                                        <option value="">Select Year</option>
                                        <option value="1">Year 1</option>
                                        <option value="2">Year 2</option>
                                        <option value="3">Year 3</option>
                                        <option value="4">Year 4</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Hostel Preferences -->
                        <div class="form-section" style="background: linear-gradient(135deg, rgba(211, 47, 47, 0.05) 0%, transparent 100%); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--primary-red);">
                            <h3 style="color: var(--primary-red); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-home"></i> Hostel Preferences
                            </h3>
                            <div class="form-group">
                                <label class="form-label" style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem; display: block;">Preferred Block</label>
                                <select class="form-control" id="hostelBlock" required style="padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 8px; transition: all 0.3s ease;">
                                    <option value="">Select Block</option>
                                </select>
                                <small style="color: var(--text-secondary); margin-top: 0.5rem; display: block; font-style: italic;">
                                    <i class="fas fa-info-circle"></i> Warden will assign specific hostel within your selected block
                                </small>
                            </div>
                            <div class="form-group" style="margin-top: 1rem;">
                                <label class="form-label" style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem; display: block;">Room Type</label>
                                <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; border: 2px solid var(--primary-red);">
                                    <p style="margin: 0; font-weight: 600; color: var(--primary-red);">
                                        <i class="fas fa-bed"></i> Triple Occupancy (3 Students per Room)
                                    </p>
                                    <small style="color: var(--text-secondary); display: block; margin-top: 0.5rem;">All rooms are triple occupancy for both boys and girls</small>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Special Requirements -->
                        <div class="form-section" style="background: linear-gradient(135deg, rgba(211, 47, 47, 0.05) 0%, transparent 100%); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--primary-red);">
                            <h3 style="color: var(--primary-red); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-star"></i> Special Requirements
                            </h3>
                            <div class="checkbox-group">
                                <label class="checkbox-label" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; cursor: pointer; padding: 0.5rem; border-radius: 8px; transition: all 0.3s ease;" onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" name="disability" style="width: 18px; height: 18px; cursor: pointer;">
                                    <span>I have a disability requiring special accommodation</span>
                                </label>
                                <label class="checkbox-label" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; cursor: pointer; padding: 0.5rem; border-radius: 8px; transition: all 0.3s ease;" onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" name="medical" style="width: 18px; height: 18px; cursor: pointer;">
                                    <span>I have medical conditions requiring attention</span>
                                </label>
                                <label class="checkbox-label" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; cursor: pointer; padding: 0.5rem; border-radius: 8px; transition: all 0.3s ease;" onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" name="final_year" style="width: 18px; height: 18px; cursor: pointer;">
                                    <span>I am a final year student (priority consideration)</span>
                                </label>
                            </div>
                            <div class="form-group" style="margin-top: 1rem;">
                                <label class="form-label" style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem; display: block;">Additional Notes (Optional)</label>
                                <textarea class="form-control" rows="4" placeholder="Any additional information..." style="padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 8px; resize: vertical;"></textarea>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-actions" style="display: flex; gap: 1rem; margin-top: 2rem; justify-content: center;">
                        <button type="button" class="btn btn-outline" onclick="app.loadPage('dashboard')" style="padding: 1rem 2rem; border: 2px solid var(--primary-red); background: transparent; color: var(--primary-red); border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.background='var(--primary-red)'; this.style.color='white'" onmouseout="this.style.background='transparent'; this.style.color='var(--primary-red)'">
                            <i class="fas fa-arrow-left"></i> Back to Dashboard
                        </button>
                        <button type="submit" class="btn btn-primary" style="padding: 1rem 2rem; background: linear-gradient(135deg, var(--primary-red) 0%, var(--primary-dark) 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 15px rgba(211, 47, 47, 0.3); transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(211, 47, 47, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(211, 47, 47, 0.3)'">
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
        const userGender = this.currentUser?.gender;
        const userRole = this.currentUser?.role || 'student';
        
        // Generate mock rooms data
        const rooms = this.generateRoomsData(userGender);
        
        return `
            <div class="room-explorer-container fade-in">
                <!-- Hero Header -->
                <div class="room-explorer-hero" style="background: linear-gradient(135deg, var(--primary-red) 0%, var(--primary-dark) 100%); padding: 3rem 2rem; border-radius: 20px; text-align: center; color: white; margin-bottom: 2rem; box-shadow: var(--shadow-lg);">
                    <h1 style="color: white; font-size: 2.5rem; margin-bottom: 1rem;">
                        <i class="fas fa-building"></i> Interactive Room Explorer
                    </h1>
                    <p style="font-size: 1.2rem; opacity: 0.9; margin: 0;">
                        Explore available rooms with real-time 3D visualization
                    </p>
                </div>

                <!-- Filter Controls -->
                <div class="room-filters" style="background: var(--bg-primary); padding: 1.5rem; border-radius: 16px; margin-bottom: 2rem; box-shadow: var(--shadow-md);">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; align-items: end;">
                        <div>
                            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary);">
                                <i class="fas fa-building"></i> Block
                            </label>
                            <select id="blockFilter" onchange="app.filterRoomsByBlock()" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary);">
                                <option value="all">All Blocks</option>
                                ${userGender === 'female' ? 
                                    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(b => `<option value="${b}">Block ${b}</option>`).join('') :
                                    ['I', 'J', 'K', 'L'].map(b => `<option value="${b}">Block ${b}</option>`).join('')
                                }
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary);">
                                <i class="fas fa-door-open"></i> Availability
                            </label>
                            <select id="availabilityFilter" onchange="app.filterRoomsByBlock()" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary);">
                                <option value="all">All Rooms</option>
                                <option value="available">Available Only</option>
                                <option value="full">Full Only</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary);">
                                <i class="fas fa-sort"></i> Sort By
                            </label>
                            <select id="sortFilter" onchange="app.filterRoomsByBlock()" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary);">
                                <option value="room">Room Number</option>
                                <option value="availability">Availability</option>
                                <option value="block">Block</option>
                            </select>
                        </div>
                        <div>
                            <button onclick="app.resetRoomFilters()" class="btn btn-outline" style="width: 100%; padding: 0.75rem; border: 2px solid var(--primary-red); background: transparent; color: var(--primary-red); border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.background='var(--primary-red)'; this.style.color='white'" onmouseout="this.style.background='transparent'; this.style.color='var(--primary-red)'">
                                <i class="fas fa-redo"></i> Reset
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Stats Overview -->
                <div class="room-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    <div class="stat-card-3d" style="background: linear-gradient(135deg, var(--accent-green) 0%, #388E3C 100%); color: white; padding: 1.5rem; border-radius: 16px; box-shadow: var(--shadow-md); transition: transform 0.3s ease;" onmouseover="this.style.transform='translateY(-5px) rotateX(5deg)'" onmouseout="this.style.transform='translateY(0) rotateX(0)'">
                        <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem;">${rooms.filter(r => r.available > 0).length}</div>
                        <div style="opacity: 0.9;"><i class="fas fa-door-open"></i> Available Rooms</div>
                    </div>
                    <div class="stat-card-3d" style="background: linear-gradient(135deg, var(--accent-blue) 0%, #1976D2 100%); color: white; padding: 1.5rem; border-radius: 16px; box-shadow: var(--shadow-md); transition: transform 0.3s ease;" onmouseover="this.style.transform='translateY(-5px) rotateX(5deg)'" onmouseout="this.style.transform='translateY(0) rotateX(0)'">
                        <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem;">${rooms.reduce((sum, r) => sum + r.available, 0)}</div>
                        <div style="opacity: 0.9;"><i class="fas fa-bed"></i> Total Beds Available</div>
                    </div>
                    <div class="stat-card-3d" style="background: linear-gradient(135deg, var(--accent-orange) 0%, #F57C00 100%); color: white; padding: 1.5rem; border-radius: 16px; box-shadow: var(--shadow-md); transition: transform 0.3s ease;" onmouseover="this.style.transform='translateY(-5px) rotateX(5deg)'" onmouseout="this.style.transform='translateY(0) rotateX(0)'">
                        <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem;">${Math.round((rooms.reduce((sum, r) => sum + r.occupied, 0) / rooms.reduce((sum, r) => sum + r.capacity, 0)) * 100)}%</div>
                        <div style="opacity: 0.9;"><i class="fas fa-chart-pie"></i> Occupancy Rate</div>
                    </div>
                    <div class="stat-card-3d" style="background: linear-gradient(135deg, var(--primary-red) 0%, var(--primary-dark) 100%); color: white; padding: 1.5rem; border-radius: 16px; box-shadow: var(--shadow-md); transition: transform 0.3s ease;" onmouseover="this.style.transform='translateY(-5px) rotateX(5deg)'" onmouseout="this.style.transform='translateY(0) rotateX(0)'">
                        <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem;">${rooms.length}</div>
                        <div style="opacity: 0.9;"><i class="fas fa-home"></i> Total Rooms</div>
                    </div>
                </div>

                <!-- 3D Room Grid -->
                <div id="roomsGrid" class="rooms-3d-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
                    ${rooms.map(room => this.generateRoomCard3D(room)).join('')}
                </div>

                <!-- Room Details Modal -->
                <div id="roomModal" class="room-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(5px);" onclick="if(event.target.id==='roomModal') app.closeRoomModal()">
                    <div class="room-modal-content" style="background: var(--bg-primary); border-radius: 20px; padding: 2rem; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.3s ease;">
                        <div id="roomModalBody"></div>
                    </div>
                </div>
            </div>

            <style>
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(50px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .room-card-3d {
                    perspective: 1000px;
                    transform-style: preserve-3d;
                }
                
                .room-card-inner {
                    transition: transform 0.6s;
                    transform-style: preserve-3d;
                }
                
                .room-card-3d:hover .room-card-inner {
                    transform: rotateY(5deg) translateY(-10px);
                }
                
                .bed-icon {
                    display: inline-block;
                    width: 30px;
                    height: 30px;
                    margin: 0.25rem;
                    border-radius: 6px;
                    transition: all 0.3s ease;
                }
                
                .bed-icon.occupied {
                    background: var(--primary-red);
                    box-shadow: 0 2px 8px rgba(211, 47, 47, 0.4);
                }
                
                .bed-icon.available {
                    background: var(--accent-green);
                    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
                }
                
                .bed-icon:hover {
                    transform: scale(1.2) rotate(5deg);
                }
            </style>
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
        
        if (page === 'apply') {
            // Populate hostel blocks based on gender
            setTimeout(() => {
                const hostelBlock = document.getElementById('hostelBlock');
                const userGender = this.currentUser?.gender;
                
                if (hostelBlock && userGender) {
                    hostelBlock.innerHTML = '<option value="">Select Block</option>';
                    
                    if (userGender === 'female') {
                        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(block => {
                            hostelBlock.innerHTML += `<option value="${block}">Block ${block} (Girls)</option>`;
                        });
                    } else if (userGender === 'male') {
                        ['I', 'J', 'K', 'L'].forEach(block => {
                            hostelBlock.innerHTML += `<option value="${block}">Block ${block} (Boys)</option>`;
                        });
                    }
                }
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

    // Room Explorer Methods
    generateRoomsData(gender) {
        const blocks = gender === 'female' ? ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] : ['I', 'J', 'K', 'L'];
        const rooms = [];
        
        blocks.forEach(block => {
            for (let floor = 1; floor <= 3; floor++) {
                for (let room = 1; room <= 8; room++) {
                    const roomNumber = `${block}-${floor}0${room}`;
                    const capacity = 3; // All rooms are triple occupancy
                    const occupied = Math.floor(Math.random() * 4); // 0-3 students
                    const available = Math.max(0, capacity - occupied);
                    
                    rooms.push({
                        number: roomNumber,
                        block: block,
                        floor: floor,
                        capacity: capacity,
                        occupied: occupied,
                        available: available,
                        amenities: ['WiFi', 'Study Desk', 'Wardrobe', 'Fan'],
                        condition: ['Excellent', 'Good', 'Fair'][Math.floor(Math.random() * 3)],
                        lastCleaned: `${Math.floor(Math.random() * 7) + 1} days ago`
                    });
                }
            }
        });
        
        return rooms;
    }

    generateRoomCard3D(room) {
        const availabilityPercent = (room.available / room.capacity) * 100;
        const statusColor = room.available === 0 ? 'var(--third-light)' : 
                           room.available === room.capacity ? 'var(--accent-green)' : 
                           'var(--accent-orange)';
        
        return `
            <div class="room-card-3d" data-block="${room.block}" data-available="${room.available > 0 ? 'available' : 'full'}">
                <div class="room-card-inner" style="background: var(--bg-primary); border-radius: 16px; padding: 1.5rem; box-shadow: var(--shadow-lg); border-left: 4px solid ${statusColor}; cursor: pointer;" onclick="app.showRoomDetails('${room.number}')">
                    <!-- Room Header -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="color: var(--primary-red); margin: 0; font-size: 1.5rem;">
                            <i class="fas fa-door-closed"></i> ${room.number}
                        </h3>
                        <span style="background: ${statusColor}; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                            ${room.available > 0 ? `${room.available} Available` : 'Full'}
                        </span>
                    </div>
                    
                    <!-- Visual Bed Layout -->
                    <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 12px; margin-bottom: 1rem;">
                        <div style="text-align: center; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-primary);">
                            <i class="fas fa-bed"></i> Bed Layout
                        </div>
                        <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 0.5rem;">
                            ${Array(room.capacity).fill(0).map((_, i) => `
                                <div class="bed-icon ${i < room.occupied ? 'occupied' : 'available'}" 
                                     title="${i < room.occupied ? 'Occupied' : 'Available'}">
                                    <i class="fas fa-bed" style="color: white; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; height: 100%;"></i>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Room Info -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem; font-size: 0.9rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary);">
                            <i class="fas fa-building" style="color: var(--primary-red);"></i>
                            <span>Block ${room.block}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary);">
                            <i class="fas fa-layer-group" style="color: var(--primary-red);"></i>
                            <span>Floor ${room.floor}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary);">
                            <i class="fas fa-users" style="color: var(--primary-red);"></i>
                            <span>${room.occupied}/${room.capacity}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary);">
                            <i class="fas fa-star" style="color: var(--primary-red);"></i>
                            <span>${room.condition}</span>
                        </div>
                    </div>
                    
                    <!-- Progress Bar -->
                    <div style="background: var(--bg-secondary); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 1rem;">
                        <div style="height: 100%; background: linear-gradient(90deg, ${statusColor} 0%, ${statusColor} 100%); width: ${(room.occupied / room.capacity) * 100}%; transition: width 0.3s ease;"></div>
                    </div>
                    
                    <!-- Amenities -->
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
                        ${room.amenities.map(amenity => `
                            <span style="background: var(--bg-secondary); color: var(--text-primary); padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
                                <i class="fas fa-check" style="color: var(--accent-green); font-size: 0.7rem;"></i>
                                ${amenity}
                            </span>
                        `).join('')}
                    </div>
                    
                    <!-- Action Button -->
                    <button class="btn ${room.available > 0 ? 'btn-primary' : 'btn-outline'}" 
                            style="width: 100%; padding: 0.75rem; border-radius: 8px; font-weight: 600; transition: all 0.3s ease; ${room.available === 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''}" 
                            ${room.available === 0 ? 'disabled' : ''}
                            onclick="event.stopPropagation(); app.selectRoomForApplication('${room.number}')">
                        ${room.available > 0 ? 
                            `<i class="fas fa-hand-pointer"></i> Select This Room` : 
                            `<i class="fas fa-lock"></i> Room Full`
                        }
                    </button>
                </div>
            </div>
        `;
    }

    showRoomDetails(roomNumber) {
        const userGender = this.currentUser?.gender;
        const rooms = this.generateRoomsData(userGender);
        const room = rooms.find(r => r.number === roomNumber);
        
        if (!room) return;
        
        const modalBody = document.getElementById('roomModalBody');
        const modal = document.getElementById('roomModal');
        
        modalBody.innerHTML = `
            <div style="text-align: center; margin-bottom: 2rem;">
                <h2 style="color: var(--primary-red); margin-bottom: 0.5rem;">
                    <i class="fas fa-door-open"></i> Room ${room.number}
                </h2>
                <p style="color: var(--text-secondary);">Detailed Room Information</p>
            </div>
            
            <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
                <h3 style="color: var(--text-primary); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-info-circle"></i> Room Details
                </h3>
                <div style="display: grid; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-primary); border-radius: 8px;">
                        <span style="font-weight: 600;"><i class="fas fa-building"></i> Block:</span>
                        <span>${room.block} (${userGender === 'female' ? 'Girls' : 'Boys'})</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-primary); border-radius: 8px;">
                        <span style="font-weight: 600;"><i class="fas fa-layer-group"></i> Floor:</span>
                        <span>Floor ${room.floor}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-primary); border-radius: 8px;">
                        <span style="font-weight: 600;"><i class="fas fa-bed"></i> Capacity:</span>
                        <span>${room.capacity} Students (Triple Occupancy)</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-primary); border-radius: 8px;">
                        <span style="font-weight: 600;"><i class="fas fa-users"></i> Currently Occupied:</span>
                        <span>${room.occupied} Students</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-primary); border-radius: 8px;">
                        <span style="font-weight: 600;"><i class="fas fa-door-open"></i> Available Beds:</span>
                        <span style="color: ${room.available > 0 ? 'var(--accent-green)' : 'var(--primary-red)'}; font-weight: 700;">${room.available}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-primary); border-radius: 8px;">
                        <span style="font-weight: 600;"><i class="fas fa-star"></i> Condition:</span>
                        <span>${room.condition}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-primary); border-radius: 8px;">
                        <span style="font-weight: 600;"><i class="fas fa-broom"></i> Last Cleaned:</span>
                        <span>${room.lastCleaned}</span>
                    </div>
                </div>
            </div>
            
            <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
                <h3 style="color: var(--text-primary); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-list-check"></i> Amenities
                </h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
                    ${room.amenities.map(amenity => `
                        <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: var(--bg-primary); border-radius: 8px;">
                            <i class="fas fa-check-circle" style="color: var(--accent-green);"></i>
                            <span>${amenity}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="display: flex; gap: 1rem;">
                <button onclick="app.closeRoomModal()" class="btn btn-outline" style="flex: 1; padding: 0.75rem; border: 2px solid var(--primary-red); background: transparent; color: var(--primary-red); border-radius: 8px; font-weight: 600;">
                    <i class="fas fa-times"></i> Close
                </button>
                <button onclick="app.selectRoomForApplication('${room.number}')" class="btn btn-primary" style="flex: 1; padding: 0.75rem; background: linear-gradient(135deg, var(--primary-red) 0%, var(--primary-dark) 100%); color: white; border: none; border-radius: 8px; font-weight: 600; ${room.available === 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''}" ${room.available === 0 ? 'disabled' : ''}>
                    <i class="fas fa-hand-pointer"></i> Select Room
                </button>
            </div>
        `;
        
        modal.style.display = 'flex';
    }

    closeRoomModal() {
        const modal = document.getElementById('roomModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    selectRoomForApplication(roomNumber) {
        this.closeRoomModal();
        this.showToast(`Room ${roomNumber} selected! Redirecting to application...`, 'success');
        setTimeout(() => {
            this.loadPage('apply');
        }, 1500);
    }

    filterRoomsByBlock() {
        const blockFilter = document.getElementById('blockFilter')?.value || 'all';
        const availabilityFilter = document.getElementById('availabilityFilter')?.value || 'all';
        const sortFilter = document.getElementById('sortFilter')?.value || 'room';
        
        const roomCards = document.querySelectorAll('.room-card-3d');
        let visibleCount = 0;
        
        roomCards.forEach(card => {
            const cardBlock = card.getAttribute('data-block');
            const cardAvailable = card.getAttribute('data-available');
            
            let showCard = true;
            
            if (blockFilter !== 'all' && cardBlock !== blockFilter) {
                showCard = false;
            }
            
            if (availabilityFilter === 'available' && cardAvailable !== 'available') {
                showCard = false;
            } else if (availabilityFilter === 'full' && cardAvailable !== 'full') {
                showCard = false;
            }
            
            card.style.display = showCard ? 'block' : 'none';
            if (showCard) visibleCount++;
        });
        
        this.showToast(`Showing ${visibleCount} rooms`, 'info');
    }

    resetRoomFilters() {
        const blockFilter = document.getElementById('blockFilter');
        const availabilityFilter = document.getElementById('availabilityFilter');
        const sortFilter = document.getElementById('sortFilter');
        
        if (blockFilter) blockFilter.value = 'all';
        if (availabilityFilter) availabilityFilter.value = 'all';
        if (sortFilter) sortFilter.value = 'room';
        
        const roomCards = document.querySelectorAll('.room-card-3d');
        roomCards.forEach(card => {
            card.style.display = 'block';
        });
        
        this.showToast('Filters reset', 'success');
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
window.addEventListener('DOMContentLoaded', async () => {
    const app = new HostelApp();
    window.app = app;
    await app.init();
});
