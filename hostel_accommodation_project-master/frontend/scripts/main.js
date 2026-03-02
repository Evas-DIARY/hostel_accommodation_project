// Main Application Controller
class HostelApp {
    constructor() {
        this.currentUser = null;
        this.currentSlide = 0;
        this.totalSlides = 4;
        this.autoSlideInterval = null;
    }

    async init() {
        this.navMenu = document.getElementById('navMenu');
        this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        this.mainContent = document.getElementById('mainContent');
        this.loadingSpinner = document.getElementById('loadingSpinner');

        // Initialize Firebase service
        if (window.firebaseDb && window.firebaseService) {
            await window.firebaseService.init();
        }

        // Initialize auth
        await authManager.init();

        this.checkAuth();
        this.setupEventListeners();
    }

    async checkAuth() {
        // Wait for auth to initialize
        await new Promise(resolve => {
            const check = () => {
                if (authManager.user !== undefined) resolve();
                else setTimeout(check, 100);
            };
            check();
        });

        if (authManager.isAuthenticated()) {
            // Wait for currentUser to be set by auth onLogin
            await new Promise(resolve => {
                const check = () => {
                    if (this.currentUser && this.currentUser.name) resolve();
                    else if (authManager.user === null) resolve();
                    else setTimeout(check, 200);
                };
                setTimeout(() => resolve(), 3000); // timeout safety
                check();
            });

            if (!window.location.pathname.includes('login.html')) {
                this.loadDashboard();
            }
        } else {
            if (!window.location.pathname.includes('login.html')) {
                const loginPath = window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
                window.location.href = loginPath;
            }
        }
        this.hideLoading();
    }

    async loadDashboard() {
        await this.loadPage('dashboard');
    }

    setupEventListeners() {
        // Mobile menu
        this.mobileMenuBtn?.addEventListener('click', () => {
            this.navMenu.classList.toggle('active');
        });

        // Nav clicks
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('.nav-link');
            if (navLink) {
                e.preventDefault();
                const href = navLink.getAttribute('href');
                if (href && href.startsWith('#')) {
                    const target = href.substring(1);
                    this.loadPage(target);
                    this.setActiveNav(target);
                    this.navMenu.classList.remove('active');
                }
            }
        });

        // Close mobile menu outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-menu') && !e.target.closest('.mobile-menu-btn')) {
                this.navMenu?.classList.remove('active');
            }
        });

        // Logout
        document.addEventListener('click', (e) => {
            if (e.target.closest('.logout-btn')) {
                this.handleLogout();
            }
        });
    }

    setActiveNav(page) {
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[href="#${page}"]`);
        if (activeLink) activeLink.classList.add('active');
    }

    async loadPage(page) {
        this.showLoading();
        try {
            let content = '';
            switch (page) {
                case 'dashboard': content = await this.loadDashboardContent(); break;
                case 'apply': content = await this.loadApplicationForm(); break;
                case 'status': content = await this.loadApplicationStatus(); break;
                case 'rooms': content = await this.loadRoomView(); break;
                case 'allocation': content = await this.loadAllocationPage(); break;
                case 'applications': content = await this.loadApplicationsPage(); break;
                case 'reports': content = await this.loadReportsPage(); break;
                default: content = await this.loadDashboardContent();
            }
            this.mainContent.innerHTML = content;
            this.initPageComponents(page);
        } catch (error) {
            console.error('Error loading page:', error);
            this.showError('Failed to load page');
        } finally {
            this.hideLoading();
        }
    }

    // ========================
    // DASHBOARD
    // ========================

    async loadDashboardContent() {
        const userRole = this.currentUser?.role || 'student';
        if (userRole === 'warden' || userRole === 'admin') {
            return this.loadWardenDashboard();
        }
        return this.loadStudentDashboard();
    }

    // --- STUDENT DASHBOARD ---
    async loadStudentDashboard() {
        const quotes = [
            "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            "Believe you can and you're halfway there.",
            "The future belongs to those who believe in the beauty of their dreams.",
            "Education is the most powerful weapon which you can use to change the world.",
            "Your time is limited, don't waste it living someone else's life."
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        const userName = this.currentUser?.name || 'Student';
        const userId = this.currentUser?.id || '';

        // Setup real-time listeners after DOM renders
        setTimeout(() => this.setupStudentListeners(userId), 300);

        return `
            <div class="dashboard-header futuristic fade-in" style="padding: 2rem; border-radius: 16px; margin-bottom: 2rem;">
                <h1 style="color: var(--text-primary); text-shadow: var(--shadow-neon);">Welcome back, ${userName}!</h1>
                <p style="font-style:italic;color:var(--text-secondary);margin-top:0.5rem">"${randomQuote}"</p>
            </div>

            <!-- Image Slider -->
            <div class="image-slider fade-in" style="animation-delay: 0.05s;">
                <div class="slider-container">
                    <div class="slider-track" id="sliderTrack">
                        <div class="slide"><img src="assets/images/1.jpg" alt="Modern Accommodations"><div class="slide-overlay"><h3>Modern Accommodations</h3><p>Experience the best of student living at AU.</p></div></div>
                        <div class="slide"><img src="assets/images/2.jpg" alt="Safe & Secure"><div class="slide-overlay"><h3>Safe & Secure</h3><p>24/7 security and warden support for your peace of mind.</p></div></div>
                        <div class="slide"><img src="assets/images/3.jpg" alt="Vibrant Community"><div class="slide-overlay"><h3>Vibrant Community</h3><p>Join a community of scholars from across the continent.</p></div></div>
                        <div class="slide"><img src="assets/images/4.jpg" alt="Excellence in Service"><div class="slide-overlay"><h3>Excellence in Service</h3><p>Dedicated staff committed to your academic success.</p></div></div>
                    </div>
                    <button class="slider-arrow prev" onclick="app.prevSlide()"><i class="fas fa-chevron-left"></i></button>
                    <button class="slider-arrow next" onclick="app.nextSlide()"><i class="fas fa-chevron-right"></i></button>
                    <div class="slider-nav" id="sliderNav"></div>
                </div>
            </div>

            <!-- Personal Information -->
            <div class="profile-section fade-in glass-panel" style="animation-delay: 0.1s; margin-bottom: 2rem; padding: 2rem;">
                <div class="profile-header">
                    <div class="profile-avatar" style="box-shadow: var(--shadow-neon); border-radius: 50%;">
                        <img src="assets/images/logo.png" alt="Profile" id="profileImage">
                    </div>
                    <div class="profile-info">
                        <h2 style="color: var(--neon-blue);">${userName}</h2>
                        <p><i class="fas fa-id-card"></i> Reg No: ${userId || 'N/A'}</p>
                        <p><i class="fas fa-envelope"></i> ${this.currentUser?.email || 'N/A'}</p>
                        <p><i class="fas fa-graduation-cap"></i> ${this.currentUser?.program || 'N/A'}</p>
                        <p><i class="fas fa-venus-mars"></i> ${this.currentUser?.gender ? this.currentUser.gender.charAt(0).toUpperCase() + this.currentUser.gender.slice(1) : 'N/A'}</p>
                    </div>
                </div>
            </div>

            <div class="dashboard-grid">
                <!-- Application Status Card -->
                <div class="card fade-in glass-panel" style="animation-delay: 0.2s">
                    <div class="card-header">
                        <h3 style="color: var(--text-primary);"><i class="fas fa-clipboard-check" style="color: var(--neon-purple);"></i> Application Status</h3>
                    </div>
                    <div id="dashboard-app-status-inner">
                        <p style="color: var(--text-secondary); text-align: center; padding: 1rem;">
                            <i class="fas fa-spinner fa-spin"></i> Loading application status...
                        </p>
                    </div>
                </div>

                <!-- My Room Card -->
                <div class="card fade-in glass-panel" style="animation-delay: 0.3s">
                    <div class="card-header">
                        <h3 style="color: var(--text-primary);"><i class="fas fa-home" style="color: var(--neon-blue);"></i> My Room</h3>
                        <span id="room-status-badge" class="status-badge" style="color: var(--neon-blue); border: 1px solid var(--neon-blue); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem;">
                            <i class="fas fa-spinner fa-spin"></i> Checking
                        </span>
                    </div>
                    <div id="dashboard-room-status-inner">
                        <p style="color: var(--text-secondary); text-align: center; padding: 1rem;">
                            <i class="fas fa-spinner fa-spin"></i> Loading room data...
                        </p>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="card fade-in glass-panel" style="animation-delay: 0.4s">
                    <div class="card-header">
                        <h3 style="color: var(--text-primary);"><i class="fas fa-bolt" style="color: var(--primary-red);"></i> Quick Actions</h3>
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
                        <button class="action-btn futuristic glass-panel" onclick="app.loadPage('rooms')">
                            <i class="fas fa-bed" style="color: var(--accent-green);"></i>
                            <span style="color: var(--text-primary);">View Rooms</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    setupStudentListeners(studentId) {
        if (!window.firebaseService || !window.firebaseDb) {
            // No Firestore — show mock/empty state
            this.updateStudentAppStatus([]);
            this.updateStudentRoomStatus([]);
            return;
        }

        window.firebaseService.listenToApplications(studentId, (apps) => {
            this.updateStudentAppStatus(apps);
        });

        window.firebaseService.listenToRoomAllocation(studentId, (allocations) => {
            this.updateStudentRoomStatus(allocations);
        });
    }

    updateStudentAppStatus(applications) {
        const container = document.getElementById('dashboard-app-status-inner');
        if (!container) return;

        if (applications.length === 0) {
            container.innerHTML = `
                <p style="color: var(--text-secondary); text-align: center; padding: 1rem;">
                    <i class="fas fa-info-circle"></i> No applications submitted yet.
                </p>
                <button class="btn btn-primary futuristic" onclick="app.loadPage('apply')" style="width: 100%; margin-top: 0.5rem;">
                    <i class="fas fa-edit"></i> Apply for Accommodation
                </button>
            `;
            return;
        }

        const latest = applications[0];
        const statusColor = latest.status === 'approved' || latest.status === 'allocated' ? 'var(--accent-green)' :
                           latest.status === 'rejected' ? 'var(--primary-red)' : 'var(--accent-orange)';
        const statusIcon = latest.status === 'approved' || latest.status === 'allocated' ? 'check-circle' :
                          latest.status === 'rejected' ? 'times-circle' : 'clock';

        container.innerHTML = `
            <div style="padding: 0.5rem 0;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                    <i class="fas fa-${statusIcon}" style="font-size: 2rem; color: ${statusColor};"></i>
                    <div>
                        <p style="font-weight: 600; color: var(--text-primary); margin: 0;">Status: <span style="color: ${statusColor}; text-transform: uppercase;">${latest.status}</span></p>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0.25rem 0 0 0;">
                            Preferred Block: ${latest.hostelBlock || 'N/A'}
                        </p>
                    </div>
                </div>
                ${latest.status === 'rejected' ? `
                    <p style="color: var(--primary-red); font-size: 0.9rem; background: rgba(211,47,47,0.1); padding: 0.75rem; border-radius: 8px;">
                        <i class="fas fa-exclamation-triangle"></i> Reason: ${latest.rejectionReason || 'Not specified'}
                    </p>
                ` : ''}
                ${latest.status === 'allocated' && latest.allocatedRoom ? `
                    <p style="color: var(--accent-green); font-size: 0.9rem; background: rgba(76,175,80,0.1); padding: 0.75rem; border-radius: 8px;">
                        <i class="fas fa-check-circle"></i> Room assigned: <strong>${latest.allocatedRoom}</strong>
                    </p>
                ` : ''}
            </div>
        `;
    }

    updateStudentRoomStatus(allocations) {
        const container = document.getElementById('dashboard-room-status-inner');
        const badge = document.getElementById('room-status-badge');
        if (!container) return;

        if (allocations.length === 0) {
            container.innerHTML = `
                <p style="color: var(--text-secondary); text-align: center; padding: 1rem;">
                    <i class="fas fa-info-circle"></i> You have not been allocated a room yet.
                </p>
            `;
            if (badge) badge.innerHTML = `<i class="fas fa-clock"></i> Pending`;
            return;
        }

        const alloc = allocations[0];
        container.innerHTML = `
            <div style="padding: 0.5rem 0;">
                <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 12px; margin-bottom: 1rem;">
                    <div style="display: grid; gap: 0.75rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: var(--text-secondary);"><i class="fas fa-door-closed"></i> Room</span>
                            <strong style="color: var(--neon-blue); font-size: 1.2rem;">${alloc.roomNumber || alloc.roomId || 'Assigned'}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: var(--text-secondary);"><i class="fas fa-building"></i> Block</span>
                            <strong style="color: var(--text-primary);">${alloc.hostelBlock || alloc.block || 'Standard'}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: var(--text-secondary);"><i class="fas fa-star"></i> Condition</span>
                            <strong style="color: var(--text-primary);">${alloc.roomCondition || 'Good'}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: var(--text-secondary);"><i class="fas fa-users"></i> Capacity</span>
                            <strong style="color: var(--text-primary);">${alloc.roomCapacity || 3} students</strong>
                        </div>
                    </div>
                </div>
                ${alloc.amenities ? `
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${(alloc.amenities || []).map(a => `
                            <span style="background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.8rem; color: var(--text-primary);">
                                <i class="fas fa-check" style="color: var(--accent-green); font-size: 0.7rem;"></i> ${a}
                            </span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        if (badge) {
            badge.innerHTML = `<i class="fas fa-check"></i> Allocated`;
            badge.style.color = 'var(--accent-green)';
            badge.style.borderColor = 'var(--accent-green)';
        }
    }

    // --- WARDEN DASHBOARD ---
    async loadWardenDashboard() {
        const wardenName = this.currentUser?.name || 'Warden';

        // Setup real-time listeners after DOM renders
        setTimeout(() => this.setupWardenDashboardListeners(), 300);

        return `
            <div class="dashboard-header futuristic fade-in" style="padding: 2rem; border-radius: 16px; margin-bottom: 2rem; background: linear-gradient(135deg, rgba(211,47,47,0.1) 0%, rgba(156,39,176,0.1) 100%);">
                <h1 style="color: var(--text-primary); text-shadow: var(--shadow-neon);">
                    <i class="fas fa-user-shield" style="color: var(--neon-purple);"></i> Warden Dashboard
                </h1>
                <p style="color: var(--text-secondary);">Welcome, <strong style="color: var(--neon-purple);">${wardenName}</strong> — Manage accommodations, review applications, and allocate rooms</p>
            </div>

            <!-- Stats Overview -->
            <div class="dashboard-grid fade-in" style="animation-delay: 0.1s; margin-bottom: 2rem;">
                <div class="card glass-panel" style="background: linear-gradient(135deg, var(--accent-orange) 0%, #F57C00 100%); color: white; padding: 1.5rem; text-align: center;">
                    <div id="stat-pending" style="font-size: 2.5rem; font-weight: 700;">0</div>
                    <div><i class="fas fa-clock"></i> Pending Applications</div>
                </div>
                <div class="card glass-panel" style="background: linear-gradient(135deg, var(--accent-green) 0%, #388E3C 100%); color: white; padding: 1.5rem; text-align: center;">
                    <div id="stat-approved" style="font-size: 2.5rem; font-weight: 700;">0</div>
                    <div><i class="fas fa-check-circle"></i> Approved</div>
                </div>
                <div class="card glass-panel" style="background: linear-gradient(135deg, var(--accent-blue) 0%, #1976D2 100%); color: white; padding: 1.5rem; text-align: center;">
                    <div id="stat-allocated" style="font-size: 2.5rem; font-weight: 700;">0</div>
                    <div><i class="fas fa-bed"></i> Rooms Allocated</div>
                </div>
                <div class="card glass-panel" style="background: linear-gradient(135deg, var(--primary-red) 0%, var(--primary-dark) 100%); color: white; padding: 1.5rem; text-align: center;">
                    <div id="stat-rejected" style="font-size: 2.5rem; font-weight: 700;">0</div>
                    <div><i class="fas fa-times-circle"></i> Rejected</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;" class="fade-in">
                <!-- Pending Applications -->
                <div class="card glass-panel" style="animation-delay: 0.2s">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="color: var(--text-primary);"><i class="fas fa-clipboard-list" style="color: var(--accent-orange);"></i> Pending Applications</h3>
                        <span id="warden-pending-count" style="background: var(--accent-orange); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem;">0</span>
                    </div>
                    <div id="warden-pending-apps-list" style="max-height: 400px; overflow-y: auto;">
                        <p style="color: var(--text-secondary); text-align: center; padding: 2rem;">
                            <i class="fas fa-spinner fa-spin"></i> Loading...
                        </p>
                    </div>
                    <button class="btn btn-primary futuristic" onclick="app.loadPage('applications')" style="width: 100%; margin-top: 1rem;">
                        View All Applications <i class="fas fa-arrow-right"></i>
                    </button>
                </div>

                <!-- Quick Actions -->
                <div class="card glass-panel" style="animation-delay: 0.3s">
                    <div class="card-header">
                        <h3 style="color: var(--text-primary);"><i class="fas fa-tools" style="color: var(--neon-purple);"></i> Management</h3>
                    </div>
                    <div style="display: grid; gap: 1rem; padding: 1rem 0;">
                        <button class="btn btn-primary futuristic" onclick="app.loadPage('allocation')" style="width: 100%; padding: 1rem; display: flex; align-items: center; gap: 0.75rem;">
                            <i class="fas fa-bed" style="font-size: 1.2rem;"></i>
                            <div style="text-align: left;">
                                <div style="font-weight: 600;">Room Allocation</div>
                                <div style="font-size: 0.8rem; opacity: 0.8;">Assign rooms to approved students</div>
                            </div>
                        </button>
                        <button class="btn btn-outline futuristic" onclick="app.loadPage('applications')" style="width: 100%; padding: 1rem; display: flex; align-items: center; gap: 0.75rem; border: 2px solid var(--primary-red); color: var(--primary-red); background: transparent;">
                            <i class="fas fa-clipboard-list" style="font-size: 1.2rem;"></i>
                            <div style="text-align: left;">
                                <div style="font-weight: 600;">All Applications</div>
                                <div style="font-size: 0.8rem; opacity: 0.8;">Review all student applications</div>
                            </div>
                        </button>
                        <button class="btn btn-outline futuristic" onclick="app.loadPage('rooms')" style="width: 100%; padding: 1rem; display: flex; align-items: center; gap: 0.75rem; border: 2px solid var(--accent-blue); color: var(--accent-blue); background: transparent;">
                            <i class="fas fa-building" style="font-size: 1.2rem;"></i>
                            <div style="text-align: left;">
                                <div style="font-weight: 600;">Room Overview</div>
                                <div style="font-size: 0.8rem; opacity: 0.8;">View all rooms and occupancy</div>
                            </div>
                        </button>
                        <button class="btn btn-outline futuristic" onclick="app.loadPage('reports')" style="width: 100%; padding: 1rem; display: flex; align-items: center; gap: 0.75rem; border: 2px solid var(--accent-green); color: var(--accent-green); background: transparent;">
                            <i class="fas fa-chart-bar" style="font-size: 1.2rem;"></i>
                            <div style="text-align: left;">
                                <div style="font-weight: 600;">Reports</div>
                                <div style="font-size: 0.8rem; opacity: 0.8;">Generate hostel reports</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    setupWardenDashboardListeners() {
        if (!window.firebaseService || !window.firebaseDb) {
            const listEl = document.getElementById('warden-pending-apps-list');
            if (listEl) listEl.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No Firestore connection. Data unavailable.</p>';
            return;
        }

        // Listen to all applications for stats
        window.firebaseService.listenToAllApplications((apps) => {
            const pending = apps.filter(a => a.status === 'pending').length;
            const approved = apps.filter(a => a.status === 'approved').length;
            const allocated = apps.filter(a => a.status === 'allocated').length;
            const rejected = apps.filter(a => a.status === 'rejected').length;

            const el = (id) => document.getElementById(id);
            if (el('stat-pending')) el('stat-pending').textContent = pending;
            if (el('stat-approved')) el('stat-approved').textContent = approved;
            if (el('stat-allocated')) el('stat-allocated').textContent = allocated;
            if (el('stat-rejected')) el('stat-rejected').textContent = rejected;
        });

        // Listen to pending applications
        window.firebaseService.listenToPendingApplications((apps) => {
            const countEl = document.getElementById('warden-pending-count');
            const listEl = document.getElementById('warden-pending-apps-list');
            if (!listEl) return;

            if (countEl) countEl.textContent = apps.length;

            if (apps.length === 0) {
                listEl.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;"><i class="fas fa-check-circle" style="color: var(--accent-green);"></i> No pending applications</p>';
                return;
            }

            listEl.innerHTML = apps.map(app => `
                <div style="padding: 1rem; border-bottom: 1px solid var(--border-color); background: var(--bg-secondary); border-radius: 8px; margin-bottom: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <div>
                            <p style="font-weight: 600; color: var(--text-primary); margin: 0;">${app.studentName || 'Unknown Student'}</p>
                            <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0.25rem 0 0 0;">
                                <i class="fas fa-id-card"></i> ${app.studentId || ''} &bull;
                                <i class="fas fa-building"></i> Block ${app.hostelBlock || 'N/A'}
                            </p>
                        </div>
                        <span style="background: var(--accent-orange); color: white; padding: 0.15rem 0.5rem; border-radius: 12px; font-size: 0.75rem;">Pending</span>
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
                        <button class="btn btn-sm" style="flex: 1; background: var(--accent-green); color: white; border: none; padding: 0.5rem; border-radius: 6px; cursor: pointer;" onclick="app.handleApproveApplication('${app.id}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-sm" style="flex: 1; background: var(--primary-red); color: white; border: none; padding: 0.5rem; border-radius: 6px; cursor: pointer;" onclick="app.handleRejectApplication('${app.id}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                </div>
            `).join('');
        });
    }

    // ========================
    // APPLICATION FORM (Student)
    // ========================

    async loadApplicationForm() {
        const userGender = this.currentUser?.gender;
        return `
            <div class="application-form fade-in" style="max-width: 900px; margin: 0 auto;">
                <div class="form-header" style="text-align: center; margin-bottom: 2rem; background: linear-gradient(135deg, var(--primary-red) 0%, var(--primary-dark) 100%); padding: 2rem; border-radius: 16px; color: white;">
                    <h1 style="color: white; margin-bottom: 0.5rem;"><i class="fas fa-file-alt"></i> Accommodation Application</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 0;">Complete your hostel accommodation application</p>
                </div>

                <form id="applicationForm" onsubmit="app.submitApplication(event)" style="background: var(--bg-primary); padding: 2rem; border-radius: 16px; box-shadow: var(--shadow-lg);">
                    <!-- Personal Information (read-only) -->
                    <div class="form-section" style="background: linear-gradient(135deg, rgba(211,47,47,0.05) 0%, transparent 100%); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--primary-red); margin-bottom: 1.5rem;">
                        <h3 style="color: var(--primary-red); margin-bottom: 1rem;"><i class="fas fa-user"></i> Personal Information</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                            <div class="form-group">
                                <label class="form-label" style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Full Name</label>
                                <input type="text" class="form-control" value="${this.currentUser?.name || ''}" readonly style="background: var(--bg-secondary);">
                            </div>
                            <div class="form-group">
                                <label class="form-label" style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Registration Number</label>
                                <input type="text" class="form-control" value="${this.currentUser?.id || ''}" readonly style="background: var(--bg-secondary);">
                            </div>
                            <div class="form-group">
                                <label class="form-label" style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Gender</label>
                                <input type="text" class="form-control" value="${userGender === 'female' ? 'Female' : 'Male'}" readonly style="background: var(--bg-secondary);">
                            </div>
                        </div>
                    </div>

                    <!-- Academic Information -->
                    <div class="form-section" style="background: linear-gradient(135deg, rgba(211,47,47,0.05) 0%, transparent 100%); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--primary-red); margin-bottom: 1.5rem;">
                        <h3 style="color: var(--primary-red); margin-bottom: 1rem;"><i class="fas fa-graduation-cap"></i> Academic Information</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                            <div class="form-group">
                                <label class="form-label" style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Program</label>
                                <input type="text" class="form-control" value="${this.currentUser?.program || ''}" readonly style="background: var(--bg-secondary);">
                            </div>
                            <div class="form-group">
                                <label class="form-label" style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Year of Study</label>
                                <select class="form-control" id="yearOfStudy" required style="padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 8px;">
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
                    <div class="form-section" style="background: linear-gradient(135deg, rgba(211,47,47,0.05) 0%, transparent 100%); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--primary-red); margin-bottom: 1.5rem;">
                        <h3 style="color: var(--primary-red); margin-bottom: 1rem;"><i class="fas fa-home"></i> Hostel Preferences</h3>
                        <div class="form-group">
                            <label class="form-label" style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Preferred Block</label>
                            <select class="form-control" id="hostelBlock" required style="padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 8px;">
                                <option value="">Select Block</option>
                            </select>
                            <small style="color: var(--text-secondary); margin-top: 0.5rem; display: block;">
                                <i class="fas fa-info-circle"></i> Warden will assign a specific room within your selected block
                            </small>
                        </div>
                        <div class="form-group" style="margin-top: 1rem;">
                            <label class="form-label" style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Room Type</label>
                            <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; border: 2px solid var(--primary-red);">
                                <p style="margin: 0; font-weight: 600; color: var(--primary-red);">
                                    <i class="fas fa-bed"></i> Triple Occupancy (3 Students per Room)
                                </p>
                                <small style="color: var(--text-secondary);">All rooms are triple occupancy</small>
                            </div>
                        </div>
                    </div>

                    <!-- Additional Notes -->
                    <div class="form-section" style="background: linear-gradient(135deg, rgba(211,47,47,0.05) 0%, transparent 100%); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--primary-red); margin-bottom: 1.5rem;">
                        <h3 style="color: var(--primary-red); margin-bottom: 1rem;"><i class="fas fa-star"></i> Additional Information</h3>
                        <div class="form-group">
                            <label class="form-label" style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Notes (Optional)</label>
                            <textarea class="form-control" id="applicationNotes" rows="3" placeholder="Any special requirements or notes..." style="padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 8px; resize: vertical;"></textarea>
                        </div>
                    </div>

                    <div class="form-actions" style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: center;">
                        <button type="button" class="btn btn-outline" onclick="app.loadPage('dashboard')" style="padding: 1rem 2rem; border: 2px solid var(--primary-red); background: transparent; color: var(--primary-red); border-radius: 8px; font-weight: 600; cursor: pointer;">
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                        <button type="submit" class="btn btn-primary" style="padding: 1rem 2rem; background: linear-gradient(135deg, var(--primary-red) 0%, var(--primary-dark) 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                            <i class="fas fa-paper-plane"></i> Submit Application
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    async submitApplication(e) {
        e.preventDefault();

        const yearOfStudy = document.getElementById('yearOfStudy')?.value;
        const hostelBlock = document.getElementById('hostelBlock')?.value;
        const notes = document.getElementById('applicationNotes')?.value || '';

        if (!yearOfStudy || !hostelBlock) {
            this.showToast('Please fill in all required fields.', 'error');
            return;
        }

        const applicationData = {
            studentId: this.currentUser?.id || '',
            studentName: this.currentUser?.name || '',
            studentEmail: this.currentUser?.email || '',
            gender: this.currentUser?.gender || '',
            program: this.currentUser?.program || '',
            yearOfStudy: yearOfStudy,
            hostelBlock: hostelBlock,
            notes: notes,
            roomType: 'triple'
        };

        if (window.firebaseService && window.firebaseDb) {
            try {
                await window.firebaseService.submitApplication(applicationData);
                this.showToast('Application submitted successfully! The warden will review it shortly.', 'success');
                setTimeout(() => this.loadPage('status'), 1500);
            } catch (error) {
                console.error('Error submitting application:', error);
                this.showToast('Failed to submit application: ' + error.message, 'error');
            }
        } else {
            // localStorage fallback
            const apps = JSON.parse(localStorage.getItem('applications') || '[]');
            apps.push({
                id: 'app-' + Date.now(),
                ...applicationData,
                status: 'pending',
                submittedAt: new Date().toISOString()
            });
            localStorage.setItem('applications', JSON.stringify(apps));
            this.showToast('Application submitted successfully!', 'success');
            setTimeout(() => this.loadPage('status'), 1500);
        }
    }

    // ========================
    // APPLICATION STATUS (Student)
    // ========================

    async loadApplicationStatus() {
        const studentId = this.currentUser?.id || '';

        setTimeout(() => this.setupApplicationStatusListeners(studentId), 300);

        return `
            <div class="fade-in" style="max-width: 900px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 2rem; background: linear-gradient(135deg, var(--primary-red) 0%, var(--primary-dark) 100%); padding: 2rem; border-radius: 16px; color: white;">
                    <h1 style="color: white; margin-bottom: 0.5rem;"><i class="fas fa-history"></i> Application Status</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 0;">Track your accommodation application progress</p>
                </div>
                <div id="application-status-list">
                    <p style="color: var(--text-secondary); text-align: center; padding: 2rem;">
                        <i class="fas fa-spinner fa-spin"></i> Loading your applications...
                    </p>
                </div>
            </div>
        `;
    }

    setupApplicationStatusListeners(studentId) {
        if (!window.firebaseService || !window.firebaseDb) {
            const container = document.getElementById('application-status-list');
            if (container) {
                // Check localStorage fallback
                const apps = JSON.parse(localStorage.getItem('applications') || '[]')
                    .filter(a => a.studentId === studentId);
                this.renderApplicationStatusList(apps);
            }
            return;
        }

        window.firebaseService.listenToApplications(studentId, (apps) => {
            this.renderApplicationStatusList(apps);
        });
    }

    renderApplicationStatusList(applications) {
        const container = document.getElementById('application-status-list');
        if (!container) return;

        if (applications.length === 0) {
            container.innerHTML = `
                <div class="glass-panel" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-folder-open" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--text-primary);">No Applications Found</h3>
                    <p style="color: var(--text-secondary);">You haven't submitted any accommodation applications yet.</p>
                    <button class="btn btn-primary futuristic" onclick="app.loadPage('apply')" style="margin-top: 1rem;">
                        <i class="fas fa-edit"></i> Apply Now
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = applications.map((app, index) => {
            const statusColor = app.status === 'approved' || app.status === 'allocated' ? 'var(--accent-green)' :
                               app.status === 'rejected' ? 'var(--primary-red)' : 'var(--accent-orange)';
            const statusIcon = app.status === 'approved' || app.status === 'allocated' ? 'check-circle' :
                              app.status === 'rejected' ? 'times-circle' : 'clock';
            const date = app.submittedAt?.toDate ? app.submittedAt.toDate().toLocaleDateString() :
                        app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'Recently';

            return `
                <div class="glass-panel" style="padding: 1.5rem; margin-bottom: 1rem; border-left: 4px solid ${statusColor};">
                    <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 1rem;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                                <i class="fas fa-${statusIcon}" style="font-size: 1.5rem; color: ${statusColor};"></i>
                                <h3 style="color: var(--text-primary); margin: 0;">Application #${index + 1}</h3>
                                <span style="background: ${statusColor}; color: white; padding: 0.2rem 0.75rem; border-radius: 12px; font-size: 0.8rem; text-transform: uppercase;">${app.status}</span>
                            </div>
                            <p style="color: var(--text-secondary); margin: 0.25rem 0;"><i class="fas fa-building"></i> Preferred Block: ${app.hostelBlock || 'N/A'}</p>
                            <p style="color: var(--text-secondary); margin: 0.25rem 0;"><i class="fas fa-calendar"></i> Submitted: ${date}</p>
                            <p style="color: var(--text-secondary); margin: 0.25rem 0;"><i class="fas fa-graduation-cap"></i> Year: ${app.yearOfStudy || 'N/A'}</p>
                        </div>
                        ${app.status === 'allocated' && app.allocatedRoom ? `
                            <div style="background: rgba(76,175,80,0.1); padding: 1rem; border-radius: 8px; text-align: center;">
                                <p style="font-weight: 600; color: var(--accent-green); margin: 0;"><i class="fas fa-door-open"></i> Room Assigned</p>
                                <p style="font-size: 1.5rem; font-weight: 700; color: var(--accent-green); margin: 0.5rem 0 0;">${app.allocatedRoom}</p>
                            </div>
                        ` : ''}
                        ${app.status === 'rejected' ? `
                            <div style="background: rgba(211,47,47,0.1); padding: 1rem; border-radius: 8px;">
                                <p style="font-weight: 600; color: var(--primary-red); margin: 0;"><i class="fas fa-exclamation-triangle"></i> Reason</p>
                                <p style="color: var(--text-secondary); margin: 0.5rem 0 0; font-size: 0.9rem;">${app.rejectionReason || 'Not specified'}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // ========================
    // APPLICATIONS PAGE (Warden)
    // ========================

    async loadApplicationsPage() {
        if (!this.currentUser || (this.currentUser.role !== 'warden' && this.currentUser.role !== 'admin')) {
            return this.accessDeniedHTML();
        }

        setTimeout(() => this.setupApplicationsPageListeners(), 300);

        return `
            <div class="fade-in">
                <div style="text-align: center; margin-bottom: 2rem; background: linear-gradient(135deg, var(--primary-red) 0%, var(--primary-dark) 100%); padding: 2rem; border-radius: 16px; color: white;">
                    <h1 style="color: white;"><i class="fas fa-clipboard-list"></i> Applications Management</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 0;">Review and process student accommodation applications</p>
                </div>

                <!-- Filter Bar -->
                <div class="glass-panel" style="padding: 1rem; margin-bottom: 1.5rem; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                    <select id="appStatusFilter" onchange="app.filterApplications()" style="padding: 0.5rem 1rem; border: 2px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary);">
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="allocated">Allocated</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <span id="apps-total-count" style="color: var(--text-secondary); margin-left: auto;">Loading...</span>
                </div>

                <div id="all-applications-list">
                    <p style="color: var(--text-secondary); text-align: center; padding: 2rem;">
                        <i class="fas fa-spinner fa-spin"></i> Loading applications...
                    </p>
                </div>
            </div>
        `;
    }

    setupApplicationsPageListeners() {
        if (!window.firebaseService || !window.firebaseDb) return;

        window.firebaseService.listenToAllApplications((apps) => {
            this._allApplications = apps;
            this.filterApplications();
        });
    }

    filterApplications() {
        const filter = document.getElementById('appStatusFilter')?.value || 'all';
        const apps = this._allApplications || [];
        const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter);

        const countEl = document.getElementById('apps-total-count');
        if (countEl) countEl.textContent = `Showing ${filtered.length} of ${apps.length} applications`;

        const container = document.getElementById('all-applications-list');
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No applications found.</p>';
            return;
        }

        container.innerHTML = filtered.map(app => {
            const statusColor = app.status === 'approved' || app.status === 'allocated' ? 'var(--accent-green)' :
                               app.status === 'rejected' ? 'var(--primary-red)' : 'var(--accent-orange)';
            const date = app.submittedAt?.toDate ? app.submittedAt.toDate().toLocaleDateString() :
                        app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'Recently';

            return `
                <div class="glass-panel" style="padding: 1.5rem; margin-bottom: 0.75rem; border-left: 4px solid ${statusColor};">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                        <div>
                            <h4 style="color: var(--text-primary); margin: 0 0 0.25rem 0;">${app.studentName || 'Unknown'}</h4>
                            <p style="color: var(--text-secondary); margin: 0; font-size: 0.9rem;">
                                <i class="fas fa-id-card"></i> ${app.studentId || 'N/A'} &bull;
                                <i class="fas fa-building"></i> Block ${app.hostelBlock || 'N/A'} &bull;
                                <i class="fas fa-calendar"></i> ${date} &bull;
                                <i class="fas fa-venus-mars"></i> ${app.gender || 'N/A'}
                            </p>
                        </div>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <span style="background: ${statusColor}; color: white; padding: 0.2rem 0.75rem; border-radius: 12px; font-size: 0.8rem; text-transform: uppercase;">${app.status}</span>
                            ${app.status === 'pending' ? `
                                <button class="btn btn-sm" style="background: var(--accent-green); color: white; border: none; padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer;" onclick="app.handleApproveApplication('${app.id}')">
                                    <i class="fas fa-check"></i> Approve
                                </button>
                                <button class="btn btn-sm" style="background: var(--primary-red); color: white; border: none; padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer;" onclick="app.handleRejectApplication('${app.id}')">
                                    <i class="fas fa-times"></i> Reject
                                </button>
                            ` : ''}
                            ${app.status === 'approved' ? `
                                <button class="btn btn-sm" style="background: var(--accent-blue); color: white; border: none; padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer;" onclick="app.loadPage('allocation')">
                                    <i class="fas fa-bed"></i> Allocate Room
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ========================
    // ROOM ALLOCATION (Warden)
    // ========================

    async loadAllocationPage() {
        if (!this.currentUser || (this.currentUser.role !== 'warden' && this.currentUser.role !== 'admin')) {
            return this.accessDeniedHTML();
        }

        setTimeout(() => this.setupAllocationPageListeners(), 300);

        return `
            <div class="fade-in">
                <div style="text-align: center; margin-bottom: 2rem; background: linear-gradient(135deg, var(--primary-red) 0%, var(--primary-dark) 100%); padding: 2rem; border-radius: 16px; color: white;">
                    <h1 style="color: white;"><i class="fas fa-bed"></i> Room Allocation</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 0;">Assign rooms to approved students</p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <!-- Allocation Form -->
                    <div class="glass-panel" style="padding: 2rem;">
                        <h3 style="color: var(--text-primary); margin-bottom: 1.5rem;"><i class="fas fa-plus-circle" style="color: var(--primary-red);"></i> Allocate Room</h3>
                        <form id="allocationForm" onsubmit="app.handleAllocation(event)">
                            <div class="form-group" style="margin-bottom: 1rem;">
                                <label style="font-weight: 600; display: block; margin-bottom: 0.5rem; color: var(--text-primary);">Select Approved Student</label>
                                <select id="allocStudentSelect" class="form-control" required style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary);">
                                    <option value="">Loading approved students...</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom: 1rem;">
                                <label style="font-weight: 600; display: block; margin-bottom: 0.5rem; color: var(--text-primary);">Select Room</label>
                                <select id="allocRoomSelect" class="form-control" required style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary);">
                                    <option value="">Loading available rooms...</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary futuristic" style="width: 100%; padding: 0.75rem; margin-top: 0.5rem;">
                                <i class="fas fa-check"></i> Allocate Room
                            </button>
                        </form>
                    </div>

                    <!-- Current Allocations -->
                    <div class="glass-panel" style="padding: 2rem;">
                        <h3 style="color: var(--text-primary); margin-bottom: 1.5rem;"><i class="fas fa-list" style="color: var(--accent-blue);"></i> Current Allocations</h3>
                        <div id="current-allocations-list" style="max-height: 400px; overflow-y: auto;">
                            <p style="color: var(--text-secondary); text-align: center; padding: 2rem;">
                                <i class="fas fa-spinner fa-spin"></i> Loading...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupAllocationPageListeners() {
        if (!window.firebaseService || !window.firebaseDb) return;

        // Load approved students into dropdown
        window.firebaseService.listenToAllApplications((apps) => {
            const approved = apps.filter(a => a.status === 'approved');
            const select = document.getElementById('allocStudentSelect');
            if (!select) return;

            select.innerHTML = '<option value="">Choose a student...</option>';
            approved.forEach(app => {
                select.innerHTML += `<option value="${app.id}" data-student-id="${app.studentId}" data-student-name="${app.studentName}" data-block="${app.hostelBlock}" data-gender="${app.gender}">${app.studentName} (${app.studentId}) - Block ${app.hostelBlock}</option>`;
            });

            if (approved.length === 0) {
                select.innerHTML = '<option value="">No approved students available</option>';
            }
        });

        // Load available rooms into dropdown
        window.firebaseService.listenToRooms((rooms) => {
            this._allRooms = rooms;
            const available = rooms.filter(r => r.occupied < r.capacity);
            const select = document.getElementById('allocRoomSelect');
            if (!select) return;

            select.innerHTML = '<option value="">Choose a room...</option>';
            available.forEach(room => {
                const spots = room.capacity - room.occupied;
                select.innerHTML += `<option value="${room.id}" data-number="${room.number}" data-block="${room.block}" data-condition="${room.condition || 'Good'}" data-capacity="${room.capacity}" data-amenities='${JSON.stringify(room.amenities || [])}'>Room ${room.number} - Block ${room.block} (${spots} bed${spots > 1 ? 's' : ''} available)</option>`;
            });
        });

        // Load current allocations
        window.firebaseService.listenToAllocations((allocations) => {
            const container = document.getElementById('current-allocations-list');
            if (!container) return;

            if (allocations.length === 0) {
                container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No allocations yet.</p>';
                return;
            }

            const active = allocations.filter(a => a.status === 'active');
            container.innerHTML = active.map(alloc => `
                <div style="padding: 0.75rem; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p style="font-weight: 600; color: var(--text-primary); margin: 0;">${alloc.studentName || alloc.studentId}</p>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0.25rem 0 0 0;">Room ${alloc.roomNumber || alloc.roomId} - Block ${alloc.block || ''}</p>
                    </div>
                    <span style="background: var(--accent-green); color: white; padding: 0.15rem 0.5rem; border-radius: 12px; font-size: 0.75rem;">Active</span>
                </div>
            `).join('');
        });
    }

    async handleAllocation(e) {
        e.preventDefault();

        const studentSelect = document.getElementById('allocStudentSelect');
        const roomSelect = document.getElementById('allocRoomSelect');

        const applicationId = studentSelect.value;
        const roomId = roomSelect.value;

        if (!applicationId || !roomId) {
            this.showToast('Please select both a student and a room.', 'error');
            return;
        }

        const selectedStudent = studentSelect.selectedOptions[0];
        const selectedRoom = roomSelect.selectedOptions[0];

        const allocationData = {
            applicationId: applicationId,
            studentId: selectedStudent.dataset.studentId || '',
            studentName: selectedStudent.dataset.studentName || '',
            roomId: roomId,
            roomNumber: selectedRoom.dataset.number || '',
            block: selectedRoom.dataset.block || '',
            hostelBlock: selectedRoom.dataset.block || '',
            roomCondition: selectedRoom.dataset.condition || 'Good',
            roomCapacity: parseInt(selectedRoom.dataset.capacity) || 3,
            amenities: JSON.parse(selectedRoom.dataset.amenities || '[]'),
            allocatedBy: this.currentUser?.id || ''
        };

        if (window.firebaseService && window.firebaseDb) {
            try {
                await window.firebaseService.allocateRoom(allocationData);
                this.showToast(`Room ${allocationData.roomNumber} allocated to ${allocationData.studentName}!`, 'success');
                e.target.reset();
            } catch (error) {
                console.error('Allocation error:', error);
                this.showToast('Allocation failed: ' + error.message, 'error');
            }
        } else {
            this.showToast('Firestore not available. Cannot allocate rooms.', 'error');
        }
    }

    // ========================
    // WARDEN: APPROVE / REJECT
    // ========================

    async handleApproveApplication(applicationId) {
        if (!confirm('Approve this application?')) return;

        if (window.firebaseService && window.firebaseDb) {
            try {
                await window.firebaseService.approveApplication(applicationId, this.currentUser?.id || '');
                this.showToast('Application approved!', 'success');
            } catch (error) {
                this.showToast('Failed to approve: ' + error.message, 'error');
            }
        }
    }

    async handleRejectApplication(applicationId) {
        const reason = prompt('Please provide a reason for rejection:');
        if (reason === null) return; // cancelled

        if (window.firebaseService && window.firebaseDb) {
            try {
                await window.firebaseService.rejectApplication(applicationId, this.currentUser?.id || '', reason);
                this.showToast('Application rejected.', 'warning');
            } catch (error) {
                this.showToast('Failed to reject: ' + error.message, 'error');
            }
        }
    }

    // ========================
    // VIEW ROOMS (Both roles)
    // ========================

    async loadRoomView() {
        const userGender = this.currentUser?.gender;
        const rooms = this.generateRoomsData(userGender);

        return `
            <div class="room-explorer-container fade-in">
                <div style="background: linear-gradient(135deg, var(--primary-red) 0%, var(--primary-dark) 100%); padding: 3rem 2rem; border-radius: 20px; text-align: center; color: white; margin-bottom: 2rem;">
                    <h1 style="color: white; font-size: 2.5rem; margin-bottom: 1rem;">
                        <i class="fas fa-building"></i> Room Explorer
                    </h1>
                    <p style="font-size: 1.2rem; opacity: 0.9; margin: 0;">Browse available rooms and view occupancy</p>
                </div>

                <!-- Filters -->
                <div class="glass-panel" style="padding: 1.5rem; margin-bottom: 2rem;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; align-items: end;">
                        <div>
                            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary);"><i class="fas fa-building"></i> Block</label>
                            <select id="blockFilter" onchange="app.filterRoomsByBlock()" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary);">
                                <option value="all">All Blocks</option>
                                ${(userGender === 'female' ? ['A','B','C','D','E','F','G','H'] : ['I','J','K','L']).map(b => `<option value="${b}">Block ${b}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary);"><i class="fas fa-door-open"></i> Availability</label>
                            <select id="availabilityFilter" onchange="app.filterRoomsByBlock()" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary);">
                                <option value="all">All Rooms</option>
                                <option value="available">Available Only</option>
                                <option value="full">Full Only</option>
                            </select>
                        </div>
                        <div>
                            <button onclick="app.resetRoomFilters()" style="width: 100%; padding: 0.75rem; border: 2px solid var(--primary-red); background: transparent; color: var(--primary-red); border-radius: 8px; font-weight: 600; cursor: pointer;">
                                <i class="fas fa-redo"></i> Reset
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Stats -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    <div style="background: linear-gradient(135deg, var(--accent-green) 0%, #388E3C 100%); color: white; padding: 1.5rem; border-radius: 16px; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700;">${rooms.filter(r => r.available > 0).length}</div>
                        <div><i class="fas fa-door-open"></i> Available</div>
                    </div>
                    <div style="background: linear-gradient(135deg, var(--accent-blue) 0%, #1976D2 100%); color: white; padding: 1.5rem; border-radius: 16px; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700;">${rooms.reduce((s,r) => s + r.available, 0)}</div>
                        <div><i class="fas fa-bed"></i> Beds Available</div>
                    </div>
                    <div style="background: linear-gradient(135deg, var(--accent-orange) 0%, #F57C00 100%); color: white; padding: 1.5rem; border-radius: 16px; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700;">${Math.round((rooms.reduce((s,r) => s+r.occupied,0) / rooms.reduce((s,r) => s+r.capacity,0))*100)}%</div>
                        <div><i class="fas fa-chart-pie"></i> Occupancy</div>
                    </div>
                    <div style="background: linear-gradient(135deg, var(--primary-red) 0%, var(--primary-dark) 100%); color: white; padding: 1.5rem; border-radius: 16px; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700;">${rooms.length}</div>
                        <div><i class="fas fa-home"></i> Total Rooms</div>
                    </div>
                </div>

                <!-- Room Grid -->
                <div id="roomsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
                    ${rooms.map(room => this.generateRoomCard3D(room)).join('')}
                </div>

                <!-- Room Details Modal -->
                <div id="roomModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(5px);" onclick="if(event.target.id==='roomModal') app.closeRoomModal()">
                    <div style="background: var(--bg-primary); border-radius: 20px; padding: 2rem; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                        <div id="roomModalBody"></div>
                    </div>
                </div>
            </div>

            <style>
                .bed-icon { display: inline-block; width: 30px; height: 30px; margin: 0.25rem; border-radius: 6px; }
                .bed-icon.occupied { background: var(--primary-red); box-shadow: 0 2px 8px rgba(211,47,47,0.4); }
                .bed-icon.available { background: var(--accent-green); box-shadow: 0 2px 8px rgba(76,175,80,0.4); }
            </style>
        `;
    }

    // ========================
    // REPORTS (Warden)
    // ========================

    async loadReportsPage() {
        if (!this.currentUser || (this.currentUser.role !== 'warden' && this.currentUser.role !== 'admin')) {
            return this.accessDeniedHTML();
        }

        return `
            <div class="fade-in">
                <div style="text-align: center; margin-bottom: 2rem; background: linear-gradient(135deg, var(--primary-red) 0%, var(--primary-dark) 100%); padding: 2rem; border-radius: 16px; color: white;">
                    <h1 style="color: white;"><i class="fas fa-chart-bar"></i> Reports & Analytics</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 0;">Generate reports and view hostel statistics</p>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
                    <div class="glass-panel" style="padding: 2rem; text-align: center;">
                        <i class="fas fa-users" style="font-size: 3rem; color: var(--accent-blue); margin-bottom: 1rem;"></i>
                        <h3 style="color: var(--text-primary);">Occupancy Report</h3>
                        <p style="color: var(--text-secondary);">Current room occupancy across all hostels</p>
                        <button class="btn btn-primary futuristic" onclick="app.showToast('Report generation coming soon!', 'info')" style="margin-top: 1rem;">Generate</button>
                    </div>
                    <div class="glass-panel" style="padding: 2rem; text-align: center;">
                        <i class="fas fa-chart-line" style="font-size: 3rem; color: var(--accent-green); margin-bottom: 1rem;"></i>
                        <h3 style="color: var(--text-primary);">Application Trends</h3>
                        <p style="color: var(--text-secondary);">Monthly application submission trends</p>
                        <button class="btn btn-primary futuristic" onclick="app.showToast('Report generation coming soon!', 'info')" style="margin-top: 1rem;">Generate</button>
                    </div>
                    <div class="glass-panel" style="padding: 2rem; text-align: center;">
                        <i class="fas fa-tools" style="font-size: 3rem; color: var(--accent-orange); margin-bottom: 1rem;"></i>
                        <h3 style="color: var(--text-primary);">Maintenance Report</h3>
                        <p style="color: var(--text-secondary);">Room maintenance and condition reports</p>
                        <button class="btn btn-primary futuristic" onclick="app.showToast('Report generation coming soon!', 'info')" style="margin-top: 1rem;">Generate</button>
                    </div>
                </div>
            </div>
        `;
    }

    // ========================
    // HELPERS & UTILITIES
    // ========================

    accessDeniedHTML() {
        return `
            <div style="text-align: center; padding: 4rem 2rem;">
                <i class="fas fa-lock" style="font-size: 4rem; color: var(--primary-red); margin-bottom: 1rem;"></i>
                <h2 style="color: var(--text-primary);">Access Denied</h2>
                <p style="color: var(--text-secondary);">You don't have permission to access this page.</p>
                <button class="btn btn-primary futuristic" onclick="app.loadPage('dashboard')" style="margin-top: 1rem;">Go to Dashboard</button>
            </div>
        `;
    }

    showLoading() {
        if (this.loadingSpinner) this.loadingSpinner.style.display = 'flex';
    }

    hideLoading() {
        if (this.loadingSpinner) this.loadingSpinner.style.display = 'none';
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    async handleLogout() {
        try {
            await authManager.signOut();
            if (window.firebaseService) window.firebaseService.cleanup();
            this.showToast('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = 'pages/login.html';
            }, 1000);
        } catch (error) {
            this.showToast('Error logging out', 'error');
        }
    }

    // --- Slider ---
    initSlider() {
        this.currentSlide = 0;
        this.totalSlides = 4;
        const sliderNav = document.getElementById('sliderNav');
        if (sliderNav) {
            sliderNav.innerHTML = '';
            for (let i = 0; i < this.totalSlides; i++) {
                const dot = document.createElement('div');
                dot.className = `slider-dot ${i === 0 ? 'active' : ''}`;
                dot.onclick = () => this.goToSlide(i);
                sliderNav.appendChild(dot);
            }
            this.startAutoSlide();
        }
    }

    nextSlide() { this.currentSlide = (this.currentSlide + 1) % this.totalSlides; this.updateSlider(); this.resetAutoSlide(); }
    prevSlide() { this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides; this.updateSlider(); this.resetAutoSlide(); }
    goToSlide(i) { this.currentSlide = i; this.updateSlider(); this.resetAutoSlide(); }

    updateSlider() {
        const track = document.getElementById('sliderTrack');
        if (track) track.style.transform = `translateX(-${this.currentSlide * 100}%)`;
        document.querySelectorAll('.slider-dot').forEach((dot, i) => dot.classList.toggle('active', i === this.currentSlide));
    }

    startAutoSlide() { this.autoSlideInterval = setInterval(() => this.nextSlide(), 5000); }
    resetAutoSlide() { clearInterval(this.autoSlideInterval); this.startAutoSlide(); }

    // --- Room Data Generation ---
    generateRoomsData(gender) {
        const blocks = gender === 'female' ? ['A','B','C','D','E','F','G','H'] : ['I','J','K','L'];
        const rooms = [];
        blocks.forEach(block => {
            for (let floor = 1; floor <= 3; floor++) {
                for (let room = 1; room <= 8; room++) {
                    const roomNumber = `${block}-${floor}0${room}`;
                    const capacity = 3;
                    const occupied = Math.floor(Math.random() * 4);
                    rooms.push({
                        number: roomNumber, block, floor, capacity,
                        occupied: Math.min(occupied, capacity),
                        available: Math.max(0, capacity - Math.min(occupied, capacity)),
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
        const statusColor = room.available === 0 ? 'var(--third-light)' :
                           room.available === room.capacity ? 'var(--accent-green)' : 'var(--accent-orange)';
        return `
            <div class="room-card-3d" data-block="${room.block}" data-available="${room.available > 0 ? 'available' : 'full'}">
                <div style="background: var(--bg-primary); border-radius: 16px; padding: 1.5rem; box-shadow: var(--shadow-lg); border-left: 4px solid ${statusColor}; cursor: pointer; transition: transform 0.3s ease;" onclick="app.showRoomDetails('${room.number}')" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="color: var(--primary-red); margin: 0;"><i class="fas fa-door-closed"></i> ${room.number}</h3>
                        <span style="background: ${statusColor}; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem;">${room.available > 0 ? room.available + ' Available' : 'Full'}</span>
                    </div>
                    <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 12px; margin-bottom: 1rem;">
                        <div style="text-align: center; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-primary);"><i class="fas fa-bed"></i> Bed Layout</div>
                        <div style="display: flex; justify-content: center; gap: 0.5rem;">
                            ${Array(room.capacity).fill(0).map((_, i) => `
                                <div class="bed-icon ${i < room.occupied ? 'occupied' : 'available'}" title="${i < room.occupied ? 'Occupied' : 'Available'}">
                                    <i class="fas fa-bed" style="color: white; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; height: 100%;"></i>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">
                        <span><i class="fas fa-building" style="color: var(--primary-red);"></i> Block ${room.block}</span>
                        <span><i class="fas fa-layer-group" style="color: var(--primary-red);"></i> Floor ${room.floor}</span>
                        <span><i class="fas fa-users" style="color: var(--primary-red);"></i> ${room.occupied}/${room.capacity}</span>
                        <span><i class="fas fa-star" style="color: var(--primary-red);"></i> ${room.condition}</span>
                    </div>
                    <div style="background: var(--bg-secondary); height: 6px; border-radius: 3px; overflow: hidden; margin-top: 1rem;">
                        <div style="height: 100%; background: ${statusColor}; width: ${(room.occupied / room.capacity) * 100}%;"></div>
                    </div>
                </div>
            </div>
        `;
    }

    showRoomDetails(roomNumber) {
        const rooms = this.generateRoomsData(this.currentUser?.gender);
        const room = rooms.find(r => r.number === roomNumber);
        if (!room) return;

        const modal = document.getElementById('roomModal');
        const body = document.getElementById('roomModalBody');
        body.innerHTML = `
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <h2 style="color: var(--primary-red);"><i class="fas fa-door-open"></i> Room ${room.number}</h2>
            </div>
            <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
                <div style="display: grid; gap: 0.75rem;">
                    ${[
                        ['Building', `Block ${room.block}`, 'fa-building'],
                        ['Floor', `Floor ${room.floor}`, 'fa-layer-group'],
                        ['Capacity', `${room.capacity} Students`, 'fa-bed'],
                        ['Occupied', `${room.occupied} Students`, 'fa-users'],
                        ['Available', `${room.available} Beds`, 'fa-door-open'],
                        ['Condition', room.condition, 'fa-star'],
                        ['Last Cleaned', room.lastCleaned, 'fa-broom']
                    ].map(([label, value, icon]) => `
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-primary); border-radius: 8px;">
                            <span style="font-weight: 600;"><i class="fas ${icon}"></i> ${label}</span>
                            <span>${value}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem;">
                ${room.amenities.map(a => `<span style="background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.85rem;"><i class="fas fa-check" style="color: var(--accent-green);"></i> ${a}</span>`).join('')}
            </div>
            <button onclick="app.closeRoomModal()" class="btn btn-primary" style="width: 100%; padding: 0.75rem; background: var(--primary-red); color: white; border: none; border-radius: 8px; cursor: pointer;">
                <i class="fas fa-times"></i> Close
            </button>
        `;
        modal.style.display = 'flex';
    }

    closeRoomModal() {
        const modal = document.getElementById('roomModal');
        if (modal) modal.style.display = 'none';
    }

    filterRoomsByBlock() {
        const blockFilter = document.getElementById('blockFilter')?.value || 'all';
        const availFilter = document.getElementById('availabilityFilter')?.value || 'all';
        document.querySelectorAll('.room-card-3d').forEach(card => {
            const block = card.dataset.block;
            const avail = card.dataset.available;
            let show = true;
            if (blockFilter !== 'all' && block !== blockFilter) show = false;
            if (availFilter === 'available' && avail !== 'available') show = false;
            if (availFilter === 'full' && avail !== 'full') show = false;
            card.style.display = show ? 'block' : 'none';
        });
    }

    resetRoomFilters() {
        const bf = document.getElementById('blockFilter');
        const af = document.getElementById('availabilityFilter');
        if (bf) bf.value = 'all';
        if (af) af.value = 'all';
        document.querySelectorAll('.room-card-3d').forEach(c => c.style.display = 'block');
    }

    // --- Page Component Init ---
    initPageComponents(page) {
        if (page === 'dashboard') {
            setTimeout(() => this.initSlider(), 100);
        }
        if (page === 'apply') {
            setTimeout(() => {
                const hostelBlock = document.getElementById('hostelBlock');
                const userGender = this.currentUser?.gender;
                if (hostelBlock && userGender) {
                    hostelBlock.innerHTML = '<option value="">Select Block</option>';
                    const blocks = userGender === 'female' ? ['A','B','C','D','E','F','G','H'] : ['I','J','K','L'];
                    blocks.forEach(b => {
                        hostelBlock.innerHTML += `<option value="${b}">Block ${b} (${userGender === 'female' ? 'Girls' : 'Boys'})</option>`;
                    });
                }
            }, 100);
        }
    }
}

// Theme toggle
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
});

window.toggleTheme = function() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    const icon = document.getElementById('themeIconNav') || document.getElementById('themeIcon');
    if (icon) icon.className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
};

// Initialize
window.addEventListener('DOMContentLoaded', async () => {
    const app = new HostelApp();
    window.app = app;
    await app.init();
});
