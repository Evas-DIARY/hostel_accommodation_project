// Main Application Controller
class HostelApp {
    constructor() {
        this.currentUser = null;
        this.currentSlide = 0;
        this.totalSlides = 4;
        this.autoSlideInterval = null;
        this.newsRotationInterval = null;
        this._notifications = [];
        this._allApplications = [];
        this._allRooms = [];
        this._allAllocations = [];
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
        this.setupInactivityTimer();
    }

    async checkAuth() {
        await new Promise(resolve => {
            const check = () => {
                if (authManager.user !== undefined) resolve();
                else setTimeout(check, 100);
            };
            check();
        });

        if (authManager.isAuthenticated()) {
            await new Promise(resolve => {
                const check = () => {
                    if (this.currentUser && this.currentUser.name) resolve();
                    else if (authManager.user === null) resolve();
                    else setTimeout(check, 200);
                };
                setTimeout(() => resolve(), 3000);
                check();
            });

            if (!window.location.pathname.includes('login.html')) {
                this.loadDashboard();
                this.setupNotificationListener();
                this.loadProfilePhoto();
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
        this.mobileMenuBtn?.addEventListener('click', () => {
            this.navMenu.classList.toggle('active');
        });

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

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-menu') && !e.target.closest('.mobile-menu-btn')) {
                this.navMenu?.classList.remove('active');
            }
        });

        // Close notification dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#notificationBell')) {
                const dropdown = document.getElementById('notifDropdown');
                if (dropdown) dropdown.style.display = 'none';
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('.logout-btn')) {
                this.handleLogout();
            }
        });

        // Mobile logout button
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }

    setActiveNav(page) {
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[href="#${page}"]`);
        if (activeLink) activeLink.classList.add('active');
    }

    async loadPage(page) {
        this.showLoading();
        // Clear any intervals
        if (this.newsRotationInterval) {
            clearInterval(this.newsRotationInterval);
            this.newsRotationInterval = null;
        }
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
    // NOTIFICATIONS
    // ========================

    setupNotificationListener() {
        const userId = this.currentUser?.id;
        if (!userId || !window.firebaseService || !window.firebaseDb) return;

        window.firebaseService.listenToNotifications(userId, (notifications) => {
            this._notifications = notifications;
            this.updateNotificationBadge(notifications);
            this.renderNotificationList(notifications);
        });
    }

    updateNotificationBadge(notifications) {
        const badge = document.getElementById('notifBadge');
        if (!badge) return;
        const unread = notifications.filter(n => !n.read).length;
        if (unread > 0) {
            badge.style.display = 'flex';
            badge.textContent = unread > 9 ? '9+' : unread;
        } else {
            badge.style.display = 'none';
        }
    }

    renderNotificationList(notifications) {
        const list = document.getElementById('notifList');
        if (!list) return;

        if (notifications.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 1rem; font-size: 0.9rem;">No notifications yet</p>';
            return;
        }

        list.innerHTML = notifications.slice(0, 15).map(n => {
            const icon = n.type === 'success' ? 'check-circle' : n.type === 'error' ? 'times-circle' : n.type === 'warning' ? 'exclamation-triangle' : 'info-circle';
            const color = n.type === 'success' ? 'var(--accent-green)' : n.type === 'error' ? 'var(--primary-red)' : n.type === 'warning' ? 'var(--accent-orange)' : 'var(--accent-blue)';
            const time = n.createdAt?.toDate ? this.timeAgo(n.createdAt.toDate()) : 'Just now';
            const unreadBg = !n.read ? 'background: rgba(33,150,243,0.05);' : '';
            return `
                <div style="padding: 0.75rem; border-bottom: 1px solid var(--border-color); ${unreadBg} border-radius: 6px; margin-bottom: 2px;">
                    <div style="display: flex; gap: 0.5rem; align-items: start;">
                        <i class="fas fa-${icon}" style="color: ${color}; margin-top: 2px;"></i>
                        <div style="flex: 1;">
                            <p style="margin: 0; font-size: 0.85rem; color: var(--text-primary); line-height: 1.4;">${n.message}</p>
                            <span style="font-size: 0.7rem; color: var(--text-secondary);">${time}</span>
                        </div>
                        ${!n.read ? '<span style="width: 8px; height: 8px; background: var(--accent-blue); border-radius: 50%; flex-shrink: 0; margin-top: 4px;"></span>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    timeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
        return Math.floor(seconds / 86400) + 'd ago';
    }

    toggleNotificationDropdown() {
        const dropdown = document.getElementById('notifDropdown');
        if (!dropdown) return;
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }

    async markAllRead(e) {
        e.stopPropagation();
        const userId = this.currentUser?.id;
        if (!userId || !window.firebaseService || !window.firebaseDb) return;
        try {
            await window.firebaseService.markAllNotificationsRead(userId);
            this.showToast('All notifications marked as read', 'info');
        } catch (err) {
            console.warn('Could not mark all read:', err.message);
        }
    }

    // ========================
    // PROFILE PHOTO
    // ========================

    loadProfilePhoto() {
        const userId = this.currentUser?.id;
        if (!userId) return;
        const photo = localStorage.getItem(`profilePhoto_${userId}`);
        if (photo) {
            const navAvatar = document.getElementById('navAvatar');
            if (navAvatar) navAvatar.src = photo;
        }
    }

    handleProfilePhotoUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) {
                this.showToast('Image must be less than 2MB', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const base64 = ev.target.result;
                const userId = this.currentUser?.id;
                if (userId) {
                    localStorage.setItem(`profilePhoto_${userId}`, base64);
                    // Update profile image on page
                    const profileImg = document.getElementById('profileImage');
                    if (profileImg) profileImg.src = base64;
                    const navAvatar = document.getElementById('navAvatar');
                    if (navAvatar) navAvatar.src = base64;
                    this.showToast('Profile photo updated!', 'success');

                    // Also try to update in Firestore
                    if (window.firebaseService && window.firebaseDb) {
                        window.firebaseService.updateUserProfile(userId, { photoURL: base64 }).catch(() => {});
                    }
                }
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }

    // ========================
    // HOSTEL RULES
    // ========================

    showHostelRules() {
        const modal = document.getElementById('hostelRulesModal');
        if (modal) modal.style.display = 'flex';
    }

    closeHostelRules() {
        const modal = document.getElementById('hostelRulesModal');
        if (modal) modal.style.display = 'none';
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
        const profilePhoto = localStorage.getItem(`profilePhoto_${userId}`) || 'assets/images/logo.png';

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

            <!-- Personal Information with Photo Upload -->
            <div class="profile-section fade-in glass-panel" style="animation-delay: 0.1s; margin-bottom: 2rem; padding: 2rem;">
                <div class="profile-header" style="display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;">
                    <div class="profile-avatar-wrapper" style="position: relative; cursor: pointer;" onclick="app.handleProfilePhotoUpload()">
                        <div class="profile-avatar" style="box-shadow: var(--shadow-neon); border-radius: 50%; width: 100px; height: 100px; overflow: hidden;">
                            <img src="${profilePhoto}" alt="Profile" id="profileImage" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <div class="photo-upload-overlay" style="position: absolute; bottom: 0; right: 0; background: var(--primary-red); color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-md);">
                            <i class="fas fa-camera" style="font-size: 0.75rem;"></i>
                        </div>
                    </div>
                    <div class="profile-info" style="flex: 1;">
                        <h2 style="color: var(--neon-blue); margin-bottom: 0.5rem;">${userName}</h2>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem;">
                            <p style="margin: 0;"><i class="fas fa-id-card" style="color: var(--primary-red); width: 20px;"></i> Reg No: ${userId || 'N/A'}</p>
                            <p style="margin: 0;"><i class="fas fa-envelope" style="color: var(--primary-red); width: 20px;"></i> ${this.currentUser?.email || 'N/A'}</p>
                            <p style="margin: 0;"><i class="fas fa-graduation-cap" style="color: var(--primary-red); width: 20px;"></i> ${this.currentUser?.program || 'N/A'}</p>
                            <p style="margin: 0;"><i class="fas fa-venus-mars" style="color: var(--primary-red); width: 20px;"></i> ${this.currentUser?.gender ? this.currentUser.gender.charAt(0).toUpperCase() + this.currentUser.gender.slice(1) : 'N/A'}</p>
                        </div>
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
                        <button class="action-btn futuristic glass-panel" onclick="app.showHostelRules()">
                            <i class="fas fa-book" style="color: var(--accent-orange);"></i>
                            <span style="color: var(--text-primary);">Hostel Rules</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Hostel Rules Modal -->
            <div id="hostelRulesModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(5px);" onclick="if(event.target.id==='hostelRulesModal') app.closeHostelRules()">
                <div style="background: var(--bg-primary); border-radius: 20px; padding: 0; max-width: 650px; width: 90%; max-height: 85vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                    <div style="background: linear-gradient(135deg, var(--primary-red) 0%, var(--primary-dark) 100%); padding: 1.5rem 2rem; color: white; display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin: 0; color: white;"><i class="fas fa-book"></i> Hostel Rules & Regulations</h2>
                        <button onclick="app.closeHostelRules()" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;"><i class="fas fa-times"></i></button>
                    </div>
                    <div style="padding: 2rem; overflow-y: auto; max-height: calc(85vh - 80px);">
                        <div style="margin-bottom: 1.5rem;">
                            <h3 style="color: var(--primary-red); margin-bottom: 0.75rem;"><i class="fas fa-clock"></i> General Conduct</h3>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); color: var(--text-primary);"><i class="fas fa-check-circle" style="color: var(--accent-green); margin-right: 0.5rem;"></i> Quiet hours are observed from 10:00 PM to 6:00 AM daily.</li>
                                <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); color: var(--text-primary);"><i class="fas fa-check-circle" style="color: var(--accent-green); margin-right: 0.5rem;"></i> All students must carry their student ID at all times within the hostel premises.</li>
                                <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); color: var(--text-primary);"><i class="fas fa-check-circle" style="color: var(--accent-green); margin-right: 0.5rem;"></i> No unauthorized visitors are allowed in the hostel rooms.</li>
                                <li style="padding: 0.5rem 0; color: var(--text-primary);"><i class="fas fa-check-circle" style="color: var(--accent-green); margin-right: 0.5rem;"></i> Students must respect the privacy and property of fellow residents.</li>
                            </ul>
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <h3 style="color: var(--primary-red); margin-bottom: 0.75rem;"><i class="fas fa-broom"></i> Cleanliness & Maintenance</h3>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); color: var(--text-primary);"><i class="fas fa-check-circle" style="color: var(--accent-green); margin-right: 0.5rem;"></i> Keep your room clean and tidy at all times.</li>
                                <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); color: var(--text-primary);"><i class="fas fa-check-circle" style="color: var(--accent-green); margin-right: 0.5rem;"></i> Report any maintenance issues to the warden immediately.</li>
                                <li style="padding: 0.5rem 0; color: var(--text-primary);"><i class="fas fa-check-circle" style="color: var(--accent-green); margin-right: 0.5rem;"></i> Dispose of waste in designated bins only.</li>
                            </ul>
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <h3 style="color: var(--primary-red); margin-bottom: 0.75rem;"><i class="fas fa-shield-alt"></i> Safety & Security</h3>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); color: var(--text-primary);"><i class="fas fa-check-circle" style="color: var(--accent-green); margin-right: 0.5rem;"></i> No cooking appliances allowed in rooms (except kettles).</li>
                                <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); color: var(--text-primary);"><i class="fas fa-check-circle" style="color: var(--accent-green); margin-right: 0.5rem;"></i> Do not tamper with fire safety equipment.</li>
                                <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); color: var(--text-primary);"><i class="fas fa-check-circle" style="color: var(--accent-green); margin-right: 0.5rem;"></i> Lock your room when leaving. The university is not liable for lost items.</li>
                                <li style="padding: 0.5rem 0; color: var(--text-primary);"><i class="fas fa-check-circle" style="color: var(--accent-green); margin-right: 0.5rem;"></i> Alcohol, drugs, and weapons are strictly prohibited.</li>
                            </ul>
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <h3 style="color: var(--primary-red); margin-bottom: 0.75rem;"><i class="fas fa-exclamation-triangle"></i> Disciplinary Actions</h3>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); color: var(--text-primary);"><i class="fas fa-times-circle" style="color: var(--primary-red); margin-right: 0.5rem;"></i> First offense: Written warning.</li>
                                <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); color: var(--text-primary);"><i class="fas fa-times-circle" style="color: var(--primary-red); margin-right: 0.5rem;"></i> Second offense: Meeting with the warden and written notice.</li>
                                <li style="padding: 0.5rem 0; color: var(--text-primary);"><i class="fas fa-times-circle" style="color: var(--primary-red); margin-right: 0.5rem;"></i> Third offense: Eviction from the hostel.</li>
                            </ul>
                        </div>
                        <div style="background: rgba(211,47,47,0.05); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--primary-red);">
                            <p style="margin: 0; color: var(--text-primary); font-weight: 600;"><i class="fas fa-info-circle" style="color: var(--primary-red);"></i> By residing in the AU hostel, you agree to abide by all the rules and regulations above. Violations may lead to disciplinary action.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupStudentListeners(studentId) {
        if (!window.firebaseService || !window.firebaseDb) {
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

        const pendingQuotes = [
            "Good things come to those who wait. Your application is in safe hands!",
            "Patience is the companion of wisdom. We're reviewing your application carefully.",
            "Every great journey begins with a single step — yours has been taken!",
        ];
        const pendingQuote = pendingQuotes[Math.floor(Math.random() * pendingQuotes.length)];

        container.innerHTML = `
            <div style="padding: 0.5rem 0;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                    <i class="fas fa-${statusIcon}" style="font-size: 2rem; color: ${statusColor};"></i>
                    <div>
                        <p style="font-weight: 600; color: var(--text-primary); margin: 0;">Status: <span style="color: ${statusColor}; text-transform: uppercase;">${latest.status}</span></p>
                    </div>
                </div>
                ${latest.status === 'pending' ? `
                    <div style="background: linear-gradient(135deg, rgba(255,152,0,0.08) 0%, rgba(255,152,0,0.03) 100%); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,152,0,0.2); margin-bottom: 0.5rem;">
                        <p style="color: var(--accent-orange); font-weight: 600; margin: 0 0 0.5rem 0;">
                            <i class="fas fa-paper-plane"></i> Application Sent Successfully!
                        </p>
                        <p style="color: var(--text-secondary); margin: 0; font-size: 0.9rem;">
                            Your application is pending and awaiting approval from the warden.
                        </p>
                        <p style="color: var(--text-secondary); margin: 0.5rem 0 0 0; font-style: italic; font-size: 0.85rem;">
                            "${pendingQuote}"
                        </p>
                    </div>
                ` : ''}
                ${latest.status === 'rejected' ? `
                    <p style="color: var(--primary-red); font-size: 0.9rem; background: rgba(211,47,47,0.1); padding: 0.75rem; border-radius: 8px;">
                        <i class="fas fa-exclamation-triangle"></i> Reason: ${latest.rejectionReason || 'Not specified'}
                    </p>
                ` : ''}
                ${latest.status === 'approved' ? `
                    <div style="background: rgba(76,175,80,0.1); padding: 1rem; border-radius: 10px; border: 1px solid rgba(76,175,80,0.2);">
                        <p style="color: var(--accent-green); font-weight: 600; margin: 0;">
                            <i class="fas fa-check-circle"></i> Your application has been approved!
                        </p>
                        <p style="color: var(--text-secondary); margin: 0.5rem 0 0 0; font-size: 0.9rem;">
                            The warden will assign you a room shortly. Stay tuned!
                        </p>
                    </div>
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
                            <span style="color: var(--text-secondary);"><i class="fas fa-users"></i> Occupancy</span>
                            <strong style="color: var(--text-primary);">${alloc.roomCapacity || 3} per room</strong>
                        </div>
                    </div>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${['WiFi', 'Lighting', 'Study Desk', 'Chair', 'Bed', 'Wardrobe', 'Fan'].map(a => `
                        <span style="background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.8rem; color: var(--text-primary);">
                            <i class="fas fa-check" style="color: var(--accent-green); font-size: 0.7rem;"></i> ${a}
                        </span>
                    `).join('')}
                </div>
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

            <!-- Africa University News Feed -->
            <div class="fade-in" style="animation-delay: 0.15s; margin-bottom: 2rem;">
                <h2 style="color: var(--text-primary); margin-bottom: 1rem;"><i class="fas fa-newspaper" style="color: var(--primary-red);"></i> Africa University — Latest News</h2>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;" id="newsContainers">
                    ${this.generateNewsContainers()}
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

    generateNewsContainers() {
        const allNews = [
            { category: 'Academics', icon: 'fa-graduation-cap', color: 'var(--accent-blue)', items: [
                'AU launches new Master\'s in Data Science program for 2026',
                'Faculty of Science hosts international research symposium',
                'Student enrollment increases by 15% this academic year',
                'New partnership with MIT for student exchange programs',
                'Library opens 24/7 study spaces during exam period'
            ]},
            { category: 'Campus Life', icon: 'fa-university', color: 'var(--accent-green)', items: [
                'Annual cultural festival "Ubuntu Fest" dates announced',
                'New sports complex construction begins in March',
                'Student council elections scheduled for next month',
                'Campus sustainability initiative wins national award',
                'AU choir takes first place at regional competition'
            ]},
            { category: 'Hostel Updates', icon: 'fa-hotel', color: 'var(--accent-orange)', items: [
                'WiFi upgrade completed across all hostel blocks',
                'New laundry facilities installed in Block C and D',
                'Hostel maintenance schedule for March released',
                'Solar water heating system installed in girls hostels',
                'Community lounge renovation completed in Block A'
            ]},
            { category: 'Events', icon: 'fa-calendar-alt', color: 'var(--neon-purple)', items: [
                'Career fair: Top employers visiting campus March 15',
                'Inter-hostel sports tournament kicks off next week',
                'Guest lecture by Prof. Achille Mbembe confirmed',
                'Annual charity run registration now open',
                'AU Alumni homecoming weekend March 22-23'
            ]}
        ];

        return allNews.map((cat, idx) => `
            <div class="glass-panel news-container" style="padding: 1.25rem; min-height: 180px; position: relative; overflow: hidden; border-top: 3px solid ${cat.color};">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                    <i class="fas ${cat.icon}" style="color: ${cat.color};"></i>
                    <h4 style="margin: 0; font-size: 0.9rem; color: var(--text-primary);">${cat.category}</h4>
                </div>
                <div class="news-ticker" id="newsTicker${idx}" data-items='${JSON.stringify(cat.items)}' data-current="0">
                    <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; margin: 0; transition: opacity 0.5s ease;" id="newsText${idx}">${cat.items[0]}</p>
                </div>
                <div style="position: absolute; bottom: 0.75rem; right: 1rem;">
                    <a href="https://africau.edu/" target="_blank" style="font-size: 0.7rem; color: ${cat.color}; text-decoration: none;">
                        africau.edu <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            </div>
        `).join('');
    }

    startNewsRotation() {
        if (this.newsRotationInterval) clearInterval(this.newsRotationInterval);

        this.newsRotationInterval = setInterval(() => {
            for (let i = 0; i < 4; i++) {
                const ticker = document.getElementById(`newsTicker${i}`);
                const textEl = document.getElementById(`newsText${i}`);
                if (!ticker || !textEl) continue;

                try {
                    const items = JSON.parse(ticker.dataset.items);
                    let current = parseInt(ticker.dataset.current) || 0;
                    current = (current + 1) % items.length;
                    ticker.dataset.current = current;

                    textEl.style.opacity = '0';
                    setTimeout(() => {
                        textEl.textContent = items[current];
                        textEl.style.opacity = '1';
                    }, 300);
                } catch (e) {
                    // skip
                }
            }
        }, 4000);
    }

    setupWardenDashboardListeners() {
        if (!window.firebaseService || !window.firebaseDb) {
            const listEl = document.getElementById('warden-pending-apps-list');
            if (listEl) listEl.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No Firestore connection. Data unavailable.</p>';
            return;
        }

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

        window.firebaseService.listenToPendingApplications((apps) => {
            const countEl = document.getElementById('warden-pending-count');
            const listEl = document.getElementById('warden-pending-apps-list');
            if (!listEl) return;

            if (countEl) countEl.textContent = apps.length;

            if (apps.length === 0) {
                listEl.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;"><i class="fas fa-check-circle" style="color: var(--accent-green);"></i> No pending applications</p>';
                return;
            }

            listEl.innerHTML = apps.map(a => `
                <div style="padding: 1rem; border-bottom: 1px solid var(--border-color); background: var(--bg-secondary); border-radius: 8px; margin-bottom: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <div>
                            <p style="font-weight: 600; color: var(--text-primary); margin: 0;">${a.studentName || 'Unknown Student'}</p>
                            <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0.25rem 0 0 0;">
                                <i class="fas fa-id-card"></i> ${a.studentId || ''} &bull;
                                <i class="fas fa-venus-mars"></i> ${a.gender || 'N/A'}
                                ${a.specialConditions ? ` &bull; <i class="fas fa-exclamation-circle" style="color: var(--accent-orange);"></i> Special conditions` : ''}
                            </p>
                        </div>
                        <span style="background: var(--accent-orange); color: white; padding: 0.15rem 0.5rem; border-radius: 12px; font-size: 0.75rem;">Pending</span>
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
                        <button class="btn btn-sm" style="flex: 1; background: var(--accent-green); color: white; border: none; padding: 0.5rem; border-radius: 6px; cursor: pointer;" onclick="app.handleApproveApplication('${a.id}', '${a.studentId}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-sm" style="flex: 1; background: var(--primary-red); color: white; border: none; padding: 0.5rem; border-radius: 6px; cursor: pointer;" onclick="app.handleRejectApplication('${a.id}', '${a.studentId}')">
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
                                <input type="text" class="form-control" value="${this.currentUser?.gender === 'female' ? 'Female' : 'Male'}" readonly style="background: var(--bg-secondary);">
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

                    <!-- Hostel Information (Read-only notice) -->
                    <div class="form-section" style="background: linear-gradient(135deg, rgba(211,47,47,0.05) 0%, transparent 100%); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--primary-red); margin-bottom: 1.5rem;">
                        <h3 style="color: var(--primary-red); margin-bottom: 1rem;"><i class="fas fa-home"></i> Hostel Information</h3>
                        <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; border: 2px solid var(--border-color);">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                                <i class="fas fa-info-circle" style="color: var(--accent-blue); font-size: 1.2rem;"></i>
                                <p style="margin: 0; font-weight: 600; color: var(--text-primary);">Room & Block Assignment</p>
                            </div>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                                The hostel block and room will be assigned by the warden upon approval of your application.
                                You will be notified once a room has been allocated to you.
                            </p>
                        </div>
                        <div style="margin-top: 1rem; background: var(--bg-secondary); padding: 1rem; border-radius: 8px; border: 2px solid var(--primary-red);">
                            <p style="margin: 0; font-weight: 600; color: var(--primary-red);">
                                <i class="fas fa-bed"></i> Triple Occupancy (3 Students per Room)
                            </p>
                            <small style="color: var(--text-secondary);">All rooms are triple occupancy</small>
                        </div>
                    </div>

                    <!-- Special Conditions -->
                    <div class="form-section" style="background: linear-gradient(135deg, rgba(211,47,47,0.05) 0%, transparent 100%); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--accent-orange); margin-bottom: 1.5rem;">
                        <h3 style="color: var(--accent-orange); margin-bottom: 1rem;"><i class="fas fa-exclamation-circle"></i> Special Conditions</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem;">Do you have any special conditions that need to be considered for your accommodation? (e.g., disability, medical condition, etc.)</p>
                        <div class="form-group" style="margin-bottom: 0.75rem;">
                            <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; padding: 0.75rem; background: var(--bg-secondary); border-radius: 8px; border: 2px solid var(--border-color); transition: all 0.3s ease;" id="specialConditionToggle">
                                <input type="checkbox" id="hasSpecialConditions" onchange="app.toggleSpecialConditions()" style="width: 18px; height: 18px; accent-color: var(--primary-red);">
                                <span style="font-weight: 600; color: var(--text-primary);">Yes, I have special conditions</span>
                            </label>
                        </div>
                        <div id="specialConditionsDetail" style="display: none;">
                            <textarea class="form-control" id="specialConditionsText" rows="3" placeholder="Please describe your special conditions in detail..." style="padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 8px; resize: vertical;"></textarea>
                        </div>
                    </div>

                    <!-- Additional Notes -->
                    <div class="form-section" style="background: linear-gradient(135deg, rgba(211,47,47,0.05) 0%, transparent 100%); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--primary-red); margin-bottom: 1.5rem;">
                        <h3 style="color: var(--primary-red); margin-bottom: 1rem;"><i class="fas fa-star"></i> Additional Information</h3>
                        <div class="form-group">
                            <label class="form-label" style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Notes (Optional)</label>
                            <textarea class="form-control" id="applicationNotes" rows="3" placeholder="Any additional notes or preferences..." style="padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 8px; resize: vertical;"></textarea>
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

    toggleSpecialConditions() {
        const checkbox = document.getElementById('hasSpecialConditions');
        const detail = document.getElementById('specialConditionsDetail');
        if (detail) {
            detail.style.display = checkbox.checked ? 'block' : 'none';
        }
    }

    async submitApplication(e) {
        e.preventDefault();

        const yearOfStudy = document.getElementById('yearOfStudy')?.value;
        const notes = document.getElementById('applicationNotes')?.value || '';
        const hasSpecialConditions = document.getElementById('hasSpecialConditions')?.checked || false;
        const specialConditionsText = document.getElementById('specialConditionsText')?.value || '';

        if (!yearOfStudy) {
            this.showToast('Please select your year of study.', 'error');
            return;
        }

        const applicationData = {
            studentId: this.currentUser?.id || '',
            studentName: this.currentUser?.name || '',
            studentEmail: this.currentUser?.email || '',
            gender: this.currentUser?.gender || '',
            program: this.currentUser?.program || '',
            yearOfStudy: yearOfStudy,
            notes: notes,
            roomType: 'triple',
            hasSpecialConditions: hasSpecialConditions,
            specialConditions: hasSpecialConditions ? specialConditionsText : ''
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

        const pendingQuotes = [
            "Good things come to those who wait. Your application is in safe hands!",
            "Patience is the companion of wisdom. We're reviewing your application carefully.",
            "Every great journey begins with a single step — yours has been taken!",
            "Behind the scenes, great things are happening for you. Stay positive!",
        ];

        container.innerHTML = applications.map((app, index) => {
            const statusColor = app.status === 'approved' || app.status === 'allocated' ? 'var(--accent-green)' :
                               app.status === 'rejected' ? 'var(--primary-red)' : 'var(--accent-orange)';
            const statusIcon = app.status === 'approved' || app.status === 'allocated' ? 'check-circle' :
                              app.status === 'rejected' ? 'times-circle' : 'clock';
            const date = app.submittedAt?.toDate ? app.submittedAt.toDate().toLocaleDateString() :
                        app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'Recently';
            const randomQuote = pendingQuotes[Math.floor(Math.random() * pendingQuotes.length)];

            return `
                <div class="glass-panel" style="padding: 1.5rem; margin-bottom: 1rem; border-left: 4px solid ${statusColor};">
                    <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 1rem;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                                <i class="fas fa-${statusIcon}" style="font-size: 1.5rem; color: ${statusColor};"></i>
                                <h3 style="color: var(--text-primary); margin: 0;">Application #${index + 1}</h3>
                                <span style="background: ${statusColor}; color: white; padding: 0.2rem 0.75rem; border-radius: 12px; font-size: 0.8rem; text-transform: uppercase;">${app.status}</span>
                            </div>
                            <p style="color: var(--text-secondary); margin: 0.25rem 0;"><i class="fas fa-calendar"></i> Submitted: ${date}</p>
                            <p style="color: var(--text-secondary); margin: 0.25rem 0;"><i class="fas fa-graduation-cap"></i> Year: ${app.yearOfStudy || 'N/A'}</p>
                            ${app.hasSpecialConditions ? `<p style="color: var(--accent-orange); margin: 0.25rem 0;"><i class="fas fa-exclamation-circle"></i> Special conditions noted</p>` : ''}
                        </div>
                        ${app.status === 'pending' ? `
                            <div style="background: linear-gradient(135deg, rgba(255,152,0,0.08) 0%, rgba(255,152,0,0.03) 100%); padding: 1.25rem; border-radius: 10px; border: 1px solid rgba(255,152,0,0.2); max-width: 350px;">
                                <p style="font-weight: 600; color: var(--accent-orange); margin: 0 0 0.5rem 0;">
                                    <i class="fas fa-paper-plane"></i> Application Sent Successfully!
                                </p>
                                <p style="color: var(--text-secondary); margin: 0 0 0.5rem 0; font-size: 0.9rem;">
                                    Your application is <strong>pending</strong> — awaiting approval from the warden.
                                </p>
                                <p style="color: var(--text-secondary); margin: 0; font-style: italic; font-size: 0.85rem;">
                                    "${randomQuote}"
                                </p>
                            </div>
                        ` : ''}
                        ${app.status === 'allocated' && app.allocatedRoom ? `
                            <div style="background: rgba(76,175,80,0.1); padding: 1rem; border-radius: 8px; text-align: center;">
                                <p style="font-weight: 600; color: var(--accent-green); margin: 0;"><i class="fas fa-door-open"></i> Room Assigned</p>
                                <p style="font-size: 1.5rem; font-weight: 700; color: var(--accent-green); margin: 0.5rem 0 0;">${app.allocatedRoom}</p>
                            </div>
                        ` : ''}
                        ${app.status === 'approved' ? `
                            <div style="background: rgba(76,175,80,0.1); padding: 1rem; border-radius: 8px;">
                                <p style="font-weight: 600; color: var(--accent-green); margin: 0;"><i class="fas fa-check-circle"></i> Approved!</p>
                                <p style="color: var(--text-secondary); margin: 0.5rem 0 0; font-size: 0.85rem;">Room assignment pending</p>
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
                                <i class="fas fa-calendar"></i> ${date} &bull;
                                <i class="fas fa-venus-mars"></i> ${app.gender || 'N/A'}
                                ${app.hasSpecialConditions ? ` &bull; <i class="fas fa-exclamation-circle" style="color: var(--accent-orange);"></i> <span style="color: var(--accent-orange);">Special: ${app.specialConditions || 'Yes'}</span>` : ''}
                            </p>
                        </div>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <span style="background: ${statusColor}; color: white; padding: 0.2rem 0.75rem; border-radius: 12px; font-size: 0.8rem; text-transform: uppercase;">${app.status}</span>
                            ${app.status === 'pending' ? `
                                <button class="btn btn-sm" style="background: var(--accent-green); color: white; border: none; padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer;" onclick="app.handleApproveApplication('${app.id}', '${app.studentId}')">
                                    <i class="fas fa-check"></i> Approve
                                </button>
                                <button class="btn btn-sm" style="background: var(--primary-red); color: white; border: none; padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer;" onclick="app.handleRejectApplication('${app.id}', '${app.studentId}')">
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
    // ROOM ALLOCATION (Warden) — Redesigned
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
                    <p style="color: rgba(255,255,255,0.9); margin: 0;">Assign blocks and rooms to approved students</p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <!-- Allocation Form -->
                    <div class="glass-panel" style="padding: 2rem;">
                        <h3 style="color: var(--text-primary); margin-bottom: 1.5rem;"><i class="fas fa-plus-circle" style="color: var(--primary-red);"></i> Allocate Room</h3>
                        <form id="allocationForm" onsubmit="app.handleAllocation(event)">
                            <!-- Step 1: Select Student -->
                            <div class="form-group" style="margin-bottom: 1.25rem;">
                                <label style="font-weight: 600; display: block; margin-bottom: 0.5rem; color: var(--text-primary);">
                                    <span style="background: var(--primary-red); color: white; padding: 0.1rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-right: 0.5rem;">1</span>
                                    Select Approved Student
                                </label>
                                <select id="allocStudentSelect" class="form-control" required onchange="app.onStudentSelectChange()" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary);">
                                    <option value="">Loading approved students...</option>
                                </select>
                                <div id="studentDetailPreview" style="display: none; margin-top: 0.75rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: 8px; font-size: 0.85rem;"></div>
                            </div>

                            <!-- Step 2: Select Block -->
                            <div class="form-group" style="margin-bottom: 1.25rem;">
                                <label style="font-weight: 600; display: block; margin-bottom: 0.5rem; color: var(--text-primary);">
                                    <span style="background: var(--primary-red); color: white; padding: 0.1rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-right: 0.5rem;">2</span>
                                    Select Block
                                </label>
                                <select id="allocBlockSelect" class="form-control" required onchange="app.onBlockSelectChange()" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary);">
                                    <option value="">Select a student first</option>
                                </select>
                            </div>

                            <!-- Step 3: Select Room -->
                            <div class="form-group" style="margin-bottom: 1.25rem;">
                                <label style="font-weight: 600; display: block; margin-bottom: 0.5rem; color: var(--text-primary);">
                                    <span style="background: var(--primary-red); color: white; padding: 0.1rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-right: 0.5rem;">3</span>
                                    Select Room
                                </label>
                                <select id="allocRoomSelect" class="form-control" required style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary);">
                                    <option value="">Select a block first</option>
                                </select>
                            </div>

                            <button type="submit" class="btn btn-primary futuristic" style="width: 100%; padding: 1rem; margin-top: 0.5rem; font-size: 1rem;">
                                <i class="fas fa-check-circle"></i> Confirm Allocation
                            </button>
                        </form>
                    </div>

                    <!-- Current Allocations -->
                    <div class="glass-panel" style="padding: 2rem;">
                        <h3 style="color: var(--text-primary); margin-bottom: 1.5rem;"><i class="fas fa-list" style="color: var(--accent-blue);"></i> Recent Allocations</h3>
                        <div id="current-allocations-list" style="max-height: 500px; overflow-y: auto;">
                            <p style="color: var(--text-secondary); text-align: center; padding: 2rem;">
                                <i class="fas fa-spinner fa-spin"></i> Loading...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    onStudentSelectChange() {
        const select = document.getElementById('allocStudentSelect');
        const blockSelect = document.getElementById('allocBlockSelect');
        const roomSelect = document.getElementById('allocRoomSelect');
        const preview = document.getElementById('studentDetailPreview');

        if (!select || !select.value) {
            if (blockSelect) blockSelect.innerHTML = '<option value="">Select a student first</option>';
            if (roomSelect) roomSelect.innerHTML = '<option value="">Select a block first</option>';
            if (preview) preview.style.display = 'none';
            return;
        }

        const opt = select.selectedOptions[0];
        const gender = opt.dataset.gender || '';
        const name = opt.dataset.studentName || '';
        const studentId = opt.dataset.studentId || '';
        const specialConditions = opt.dataset.specialConditions || '';

        // Show student details preview
        if (preview) {
            preview.style.display = 'block';
            preview.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-primary);">
                    <i class="fas fa-user" style="color: var(--accent-blue);"></i>
                    <strong>${name}</strong> (${studentId})
                    <span style="background: ${gender === 'female' ? 'var(--neon-purple)' : 'var(--accent-blue)'}; color: white; padding: 0.1rem 0.5rem; border-radius: 10px; font-size: 0.7rem;">${gender}</span>
                </div>
                ${specialConditions ? `<p style="margin: 0.5rem 0 0 0; color: var(--accent-orange); font-size: 0.8rem;"><i class="fas fa-exclamation-circle"></i> ${specialConditions}</p>` : ''}
            `;
        }

        // Populate blocks based on gender
        const blocks = gender === 'female' ? ['A','B','C','D','E','F','G','H'] : ['I','J','K','L'];
        if (blockSelect) {
            blockSelect.innerHTML = '<option value="">Choose a block...</option>';
            blocks.forEach(b => {
                blockSelect.innerHTML += `<option value="${b}">Block ${b} (${gender === 'female' ? 'Girls' : 'Boys'} — 40 rooms)</option>`;
            });
        }
        if (roomSelect) {
            roomSelect.innerHTML = '<option value="">Select a block first</option>';
        }
    }

    onBlockSelectChange() {
        const blockSelect = document.getElementById('allocBlockSelect');
        const roomSelect = document.getElementById('allocRoomSelect');

        if (!blockSelect || !blockSelect.value || !roomSelect) return;

        const block = blockSelect.value;

        // Generate 40 rooms for the block (Room 1 to Room 40)
        roomSelect.innerHTML = '<option value="">Choose a room...</option>';
        for (let room = 1; room <= 40; room++) {
            const roomNum = room.toString();
            const roomId = `${block}-${roomNum}`;
            // Check if room is in allocations (basic check)
            const spotsUsed = this._allAllocations.filter(a => a.status === 'active' && a.roomNumber === roomNum && a.block === block).length;
            const spotsLeft = 3 - spotsUsed;
            if (spotsLeft > 0) {
                roomSelect.innerHTML += `<option value="${roomId}" data-number="${roomNum}" data-block="${block}">Room ${roomNum} (${spotsLeft} bed${spotsLeft > 1 ? 's' : ''} free)</option>`;
            } else {
                roomSelect.innerHTML += `<option value="${roomId}" data-number="${roomNum}" data-block="${block}" disabled style="color: var(--text-secondary);">Room ${roomNum} (Full)</option>`;
            }
        }
    }

    setupAllocationPageListeners() {
        if (!window.firebaseService || !window.firebaseDb) return;

        // Load approved students
        window.firebaseService.listenToAllApplications((apps) => {
            this._allApplications = apps;
            const approved = apps.filter(a => a.status === 'approved');
            const select = document.getElementById('allocStudentSelect');
            if (!select) return;

            select.innerHTML = '<option value="">Choose a student...</option>';
            approved.forEach(app => {
                const sc = app.hasSpecialConditions ? app.specialConditions : '';
                select.innerHTML += `<option value="${app.id}" data-student-id="${app.studentId}" data-student-name="${app.studentName}" data-gender="${app.gender}" data-special-conditions="${sc}">${app.studentName} (${app.studentId}) — ${app.gender === 'female' ? 'Female' : 'Male'}</option>`;
            });

            if (approved.length === 0) {
                select.innerHTML = '<option value="">No approved students available</option>';
            }
        });

        // Load allocations for room availability checks
        window.firebaseService.listenToAllocations((allocations) => {
            this._allAllocations = allocations;
            const container = document.getElementById('current-allocations-list');
            if (!container) return;

            const active = allocations.filter(a => a.status === 'active');
            if (active.length === 0) {
                container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No allocations yet.</p>';
                return;
            }

            container.innerHTML = active.map(alloc => `
                <div style="padding: 0.75rem; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center; border-left: 3px solid var(--accent-green);">
                    <div>
                        <p style="font-weight: 600; color: var(--text-primary); margin: 0;">${alloc.studentName || alloc.studentId}</p>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0.25rem 0 0 0;">
                            <i class="fas fa-building" style="color: var(--primary-red);"></i> Block ${alloc.block || ''} &bull;
                            <i class="fas fa-door-closed" style="color: var(--primary-red);"></i> Room ${alloc.roomNumber || alloc.roomId}
                        </p>
                    </div>
                    <span style="background: var(--accent-green); color: white; padding: 0.15rem 0.5rem; border-radius: 12px; font-size: 0.75rem;">Active</span>
                </div>
            `).join('');
        });
    }

    async handleAllocation(e) {
        e.preventDefault();

        const studentSelect = document.getElementById('allocStudentSelect');
        const blockSelect = document.getElementById('allocBlockSelect');
        const roomSelect = document.getElementById('allocRoomSelect');

        const applicationId = studentSelect.value;
        const block = blockSelect.value;
        const roomId = roomSelect.value;

        if (!applicationId || !block || !roomId) {
            this.showToast('Please select a student, block, and room.', 'error');
            return;
        }

        const selectedStudent = studentSelect.selectedOptions[0];
        const selectedRoom = roomSelect.selectedOptions[0];
        const roomNumber = selectedRoom.dataset.number || '';
        const studentId = selectedStudent.dataset.studentId || '';
        const studentName = selectedStudent.dataset.studentName || '';

        const allocationData = {
            applicationId: applicationId,
            studentId: studentId,
            studentName: studentName,
            roomId: roomId,
            roomNumber: roomNumber,
            block: block,
            hostelBlock: block,
            roomCondition: 'Good',
            roomCapacity: 3,
            amenities: ['WiFi', 'Lighting', 'Study Desk', 'Chair', 'Bed', 'Wardrobe', 'Fan'],
            allocatedBy: this.currentUser?.id || ''
        };

        if (window.firebaseService && window.firebaseDb) {
            try {
                await window.firebaseService.allocateRoom(allocationData);
                // Send notification to student
                await window.firebaseService.notifyAllocation(studentId, block, roomNumber);
                this.showToast(`Room ${roomNumber} in Block ${block} allocated to ${studentName}!`, 'success');
                e.target.reset();
                // Reset cascading dropdowns
                const preview = document.getElementById('studentDetailPreview');
                if (preview) preview.style.display = 'none';
                if (blockSelect) blockSelect.innerHTML = '<option value="">Select a student first</option>';
                if (roomSelect) roomSelect.innerHTML = '<option value="">Select a block first</option>';
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

    async handleApproveApplication(applicationId, studentId) {
        if (!confirm('Approve this application?')) return;

        if (window.firebaseService && window.firebaseDb) {
            try {
                await window.firebaseService.approveApplication(applicationId, this.currentUser?.id || '', studentId);
                this.showToast('Application approved!', 'success');
            } catch (error) {
                this.showToast('Failed to approve: ' + error.message, 'error');
            }
        }
    }

    async handleRejectApplication(applicationId, studentId) {
        const reason = prompt('Please provide a reason for rejection:');
        if (reason === null) return;

        if (window.firebaseService && window.firebaseDb) {
            try {
                await window.firebaseService.rejectApplication(applicationId, this.currentUser?.id || '', reason, studentId);
                this.showToast('Application rejected.', 'warning');
            } catch (error) {
                this.showToast('Failed to reject: ' + error.message, 'error');
            }
        }
    }

    // ========================
    // VIEW ROOMS (role-based)
    // ========================

    async loadRoomView() {
        const userRole = this.currentUser?.role || 'student';
        if (userRole === 'warden' || userRole === 'admin') {
            return this.loadWardenRoomView();
        }
        return this.loadStudentRoomView();
    }

    // --- STUDENT Room View ---
    async loadStudentRoomView() {
        const studentId = this.currentUser?.id || '';
        const userGender = this.currentUser?.gender;
        const blocks = userGender === 'female' ? ['A','B','C','D','E','F','G','H'] : ['I','J','K','L'];

        setTimeout(() => this.setupStudentRoomViewListeners(studentId), 300);

        return `
            <div class="fade-in">
                <div style="background: linear-gradient(135deg, var(--primary-red) 0%, var(--primary-dark) 100%); padding: 2.5rem 2rem; border-radius: 20px; text-align: center; color: white; margin-bottom: 2rem;">
                    <h1 style="color: white; font-size: 2rem; margin-bottom: 0.5rem;">
                        <i class="fas fa-building"></i> View Rooms
                    </h1>
                    <p style="font-size: 1.1rem; opacity: 0.9; margin: 0;">Your room information and available blocks</p>
                </div>

                <!-- My Allocated Room (shows when allocated) -->
                <div id="student-allocated-room" style="margin-bottom: 2rem;"></div>

                <!-- Stats (real-time) -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    <div style="background: linear-gradient(135deg, var(--accent-green) 0%, #388E3C 100%); color: white; padding: 1.5rem; border-radius: 16px; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700;" id="studentStatAvailable">—</div>
                        <div><i class="fas fa-door-open"></i> Available Rooms</div>
                    </div>
                    <div style="background: linear-gradient(135deg, var(--accent-blue) 0%, #1976D2 100%); color: white; padding: 1.5rem; border-radius: 16px; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700;" id="studentStatBeds">—</div>
                        <div><i class="fas fa-bed"></i> Beds Available</div>
                    </div>
                    <div style="background: linear-gradient(135deg, var(--accent-orange) 0%, #F57C00 100%); color: white; padding: 1.5rem; border-radius: 16px; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700;" id="studentStatOccupancy">—</div>
                        <div><i class="fas fa-chart-pie"></i> Occupancy</div>
                    </div>
                    <div style="background: linear-gradient(135deg, var(--primary-red) 0%, var(--primary-dark) 100%); color: white; padding: 1.5rem; border-radius: 16px; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700;" id="studentStatTotal">—</div>
                        <div><i class="fas fa-home"></i> Total Rooms</div>
                    </div>
                </div>

                <!-- Available Blocks -->
                <h2 style="color: var(--text-primary); margin-bottom: 1rem;"><i class="fas fa-th-large" style="color: var(--primary-red);"></i> Available Blocks (${userGender === 'female' ? 'Girls Hostels' : 'Boys Hostels'})</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.25rem;">
                    ${blocks.map(block => `
                        <div class="glass-panel" style="padding: 1.5rem; text-align: center; border-top: 4px solid var(--primary-red); transition: transform 0.3s ease;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, var(--primary-red) 0%, var(--primary-dark) 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                                <span style="color: white; font-size: 1.5rem; font-weight: 700;">${block}</span>
                            </div>
                            <h3 style="color: var(--text-primary); margin: 0 0 0.5rem;">Block ${block}</h3>
                            <p style="color: var(--text-secondary); font-size: 0.85rem; margin: 0;">40 Rooms &bull; Triple Occupancy</p>
                            <p style="color: var(--text-secondary); font-size: 0.85rem; margin: 0.25rem 0 0;">${userGender === 'female' ? 'Girls Hostel' : 'Boys Hostel'}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    setupStudentRoomViewListeners(studentId) {
        if (!window.firebaseService || !window.firebaseDb) {
            // Show mock stats
            const gender = this.currentUser?.gender;
            const totalBlocks = gender === 'female' ? 8 : 4;
            const totalRooms = totalBlocks * 40;
            const el = (id) => document.getElementById(id);
            if (el('studentStatTotal')) el('studentStatTotal').textContent = totalRooms;
            if (el('studentStatAvailable')) el('studentStatAvailable').textContent = Math.floor(totalRooms * 0.35);
            if (el('studentStatBeds')) el('studentStatBeds').textContent = Math.floor(totalRooms * 0.35 * 2);
            if (el('studentStatOccupancy')) el('studentStatOccupancy').textContent = '65%';
            return;
        }

        // Listen to allocations for stats
        window.firebaseService.listenToAllocations((allocations) => {
            const gender = this.currentUser?.gender;
            const blocks = gender === 'female' ? ['A','B','C','D','E','F','G','H'] : ['I','J','K','L'];
            const totalRooms = blocks.length * 40;
            const totalBeds = totalRooms * 3;

            const relevantAllocations = allocations.filter(a => a.status === 'active' && blocks.includes(a.block));
            const occupiedBeds = relevantAllocations.length;
            const availableBeds = totalBeds - occupiedBeds;

            // Approximate available rooms (rooms with at least 1 free bed)
            const roomOccupancy = {};
            relevantAllocations.forEach(a => {
                const key = `${a.block}-${a.roomNumber}`;
                roomOccupancy[key] = (roomOccupancy[key] || 0) + 1;
            });
            const fullRooms = Object.values(roomOccupancy).filter(c => c >= 3).length;
            const availableRooms = totalRooms - fullRooms;
            const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

            const el = (id) => document.getElementById(id);
            if (el('studentStatAvailable')) el('studentStatAvailable').textContent = availableRooms;
            if (el('studentStatBeds')) el('studentStatBeds').textContent = availableBeds;
            if (el('studentStatOccupancy')) el('studentStatOccupancy').textContent = occupancyPct + '%';
            if (el('studentStatTotal')) el('studentStatTotal').textContent = totalRooms;
        });

        // Listen for student's own allocation
        window.firebaseService.listenToRoomAllocation(studentId, (allocations) => {
            const container = document.getElementById('student-allocated-room');
            if (!container) return;

            if (allocations.length === 0) {
                container.innerHTML = '';
                return;
            }

            const alloc = allocations[0];
            container.innerHTML = `
                <div class="glass-panel" style="padding: 2rem; border-left: 5px solid var(--accent-green); background: linear-gradient(135deg, rgba(76,175,80,0.05) 0%, transparent 100%);">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
                        <i class="fas fa-check-circle" style="font-size: 1.5rem; color: var(--accent-green);"></i>
                        <h2 style="color: var(--accent-green); margin: 0;">Your Allocated Room</h2>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
                        <div style="text-align: center; padding: 1.25rem; background: var(--bg-secondary); border-radius: 12px;">
                            <i class="fas fa-building" style="font-size: 1.5rem; color: var(--primary-red); margin-bottom: 0.5rem;"></i>
                            <p style="font-weight: 700; font-size: 1.3rem; color: var(--text-primary); margin: 0;">Block ${alloc.block || alloc.hostelBlock || '—'}</p>
                            <p style="color: var(--text-secondary); font-size: 0.8rem; margin: 0;">Hostel Block</p>
                        </div>
                        <div style="text-align: center; padding: 1.25rem; background: var(--bg-secondary); border-radius: 12px;">
                            <i class="fas fa-door-closed" style="font-size: 1.5rem; color: var(--accent-blue); margin-bottom: 0.5rem;"></i>
                            <p style="font-weight: 700; font-size: 1.3rem; color: var(--text-primary); margin: 0;">Room ${alloc.roomNumber || '—'}</p>
                            <p style="color: var(--text-secondary); font-size: 0.8rem; margin: 0;">Room Number</p>
                        </div>
                        <div style="text-align: center; padding: 1.25rem; background: var(--bg-secondary); border-radius: 12px;">
                            <i class="fas fa-users" style="font-size: 1.5rem; color: var(--accent-orange); margin-bottom: 0.5rem;"></i>
                            <p style="font-weight: 700; font-size: 1.3rem; color: var(--text-primary); margin: 0;">Triple</p>
                            <p style="color: var(--text-secondary); font-size: 0.8rem; margin: 0;">Occupancy Type</p>
                        </div>
                        <div style="text-align: center; padding: 1.25rem; background: var(--bg-secondary); border-radius: 12px;">
                            <i class="fas fa-star" style="font-size: 1.5rem; color: var(--accent-green); margin-bottom: 0.5rem;"></i>
                            <p style="font-weight: 700; font-size: 1.3rem; color: var(--text-primary); margin: 0;">${alloc.roomCondition || 'Good'}</p>
                            <p style="color: var(--text-secondary); font-size: 0.8rem; margin: 0;">Condition</p>
                        </div>
                    </div>
                    <div style="margin-top: 1.5rem;">
                        <h4 style="color: var(--text-primary); margin-bottom: 0.75rem;"><i class="fas fa-list-check" style="color: var(--primary-red);"></i> Room Amenities & Details</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
                            ${[
                                { icon: 'fa-wifi', label: 'WiFi', color: 'var(--accent-blue)' },
                                { icon: 'fa-lightbulb', label: 'Lighting', color: 'var(--accent-orange)' },
                                { icon: 'fa-chair', label: 'Chair', color: 'var(--neon-purple)' },
                                { icon: 'fa-bed', label: 'Bed', color: 'var(--primary-red)' },
                                { icon: 'fa-desktop', label: 'Study Desk', color: 'var(--accent-green)' },
                                { icon: 'fa-box', label: 'Wardrobe', color: 'var(--third-light)' },
                                { icon: 'fa-fan', label: 'Fan', color: 'var(--accent-blue)' }
                            ].map(a => `
                                <div style="display: flex; align-items: center; gap: 0.5rem; background: var(--bg-secondary); padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid var(--border-color);">
                                    <i class="fas ${a.icon}" style="color: ${a.color};"></i>
                                    <span style="color: var(--text-primary); font-size: 0.85rem;">${a.label}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        });
    }

    // --- WARDEN Room View ---
    async loadWardenRoomView() {
        setTimeout(() => this.setupWardenRoomViewListeners(), 300);

        return `
            <div class="fade-in">
                <div style="background: linear-gradient(135deg, var(--primary-red) 0%, var(--primary-dark) 100%); padding: 2.5rem 2rem; border-radius: 20px; text-align: center; color: white; margin-bottom: 2rem;">
                    <h1 style="color: white; font-size: 2rem; margin-bottom: 0.5rem;">
                        <i class="fas fa-building"></i> Room Overview
                    </h1>
                    <p style="font-size: 1.1rem; opacity: 0.9; margin: 0;">View all hostels, rooms, and allocated students</p>
                </div>

                <!-- Tab Toggle -->
                <div style="display: flex; gap: 0; margin-bottom: 2rem; background: var(--bg-secondary); border-radius: 12px; padding: 4px; border: 1px solid var(--border-color);">
                    <button id="tabGirls" onclick="app.switchRoomViewTab('girls')" style="flex: 1; padding: 0.75rem; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; background: var(--primary-red); color: white; font-family: var(--font-primary);">
                        <i class="fas fa-female"></i> Girls Hostels (A – H)
                    </button>
                    <button id="tabBoys" onclick="app.switchRoomViewTab('boys')" style="flex: 1; padding: 0.75rem; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; background: transparent; color: var(--text-primary); font-family: var(--font-primary);">
                        <i class="fas fa-male"></i> Boys Hostels (I – L)
                    </button>
                </div>

                <!-- Block selector -->
                <div style="margin-bottom: 1.5rem;">
                    <select id="wardenBlockFilter" onchange="app.filterWardenRoomView()" style="padding: 0.75rem 1rem; border: 2px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary); min-width: 200px;">
                        <option value="all">All Blocks</option>
                    </select>
                </div>

                <div id="wardenRoomViewContent">
                    <p style="color: var(--text-secondary); text-align: center; padding: 2rem;">
                        <i class="fas fa-spinner fa-spin"></i> Loading room data...
                    </p>
                </div>
            </div>
        `;
    }

    switchRoomViewTab(tab) {
        const girlsBtn = document.getElementById('tabGirls');
        const boysBtn = document.getElementById('tabBoys');
        const filter = document.getElementById('wardenBlockFilter');

        if (tab === 'girls') {
            girlsBtn.style.background = 'var(--primary-red)';
            girlsBtn.style.color = 'white';
            boysBtn.style.background = 'transparent';
            boysBtn.style.color = 'var(--text-primary)';
            this._currentRoomTab = 'girls';
            if (filter) {
                filter.innerHTML = '<option value="all">All Girls Blocks</option>';
                ['A','B','C','D','E','F','G','H'].forEach(b => filter.innerHTML += `<option value="${b}">Block ${b}</option>`);
            }
        } else {
            boysBtn.style.background = 'var(--primary-red)';
            boysBtn.style.color = 'white';
            girlsBtn.style.background = 'transparent';
            girlsBtn.style.color = 'var(--text-primary)';
            this._currentRoomTab = 'boys';
            if (filter) {
                filter.innerHTML = '<option value="all">All Boys Blocks</option>';
                ['I','J','K','L'].forEach(b => filter.innerHTML += `<option value="${b}">Block ${b}</option>`);
            }
        }
        this.renderWardenRoomView();
    }

    filterWardenRoomView() {
        this.renderWardenRoomView();
    }

    setupWardenRoomViewListeners() {
        this._currentRoomTab = 'girls';
        // Set initial filter options
        const filter = document.getElementById('wardenBlockFilter');
        if (filter) {
            filter.innerHTML = '<option value="all">All Girls Blocks</option>';
            ['A','B','C','D','E','F','G','H'].forEach(b => filter.innerHTML += `<option value="${b}">Block ${b}</option>`);
        }

        if (!window.firebaseService || !window.firebaseDb) {
            this.renderWardenRoomView();
            return;
        }

        window.firebaseService.listenToAllocations((allocations) => {
            this._allAllocations = allocations;
            this.renderWardenRoomView();
        });
    }

    renderWardenRoomView() {
        const container = document.getElementById('wardenRoomViewContent');
        if (!container) return;

        const tab = this._currentRoomTab || 'girls';
        const filterBlock = document.getElementById('wardenBlockFilter')?.value || 'all';
        const blocks = tab === 'girls' ? ['A','B','C','D','E','F','G','H'] : ['I','J','K','L'];
        const filteredBlocks = filterBlock === 'all' ? blocks : blocks.filter(b => b === filterBlock);
        const activeAllocations = (this._allAllocations || []).filter(a => a.status === 'active');

        container.innerHTML = filteredBlocks.map(block => {
            // Build room data for this block (40 rooms: 4 floors x 10)
            const blockAllocations = activeAllocations.filter(a => a.block === block);
            const roomMap = {};
            blockAllocations.forEach(a => {
                const key = a.roomNumber || '';
                if (!roomMap[key]) roomMap[key] = [];
                roomMap[key].push(a.studentName || a.studentId || 'Student');
            });

            const totalOccupied = blockAllocations.length;
            const totalBeds = 40 * 3;
            const occupancyPct = Math.round((totalOccupied / totalBeds) * 100);

            return `
                <div class="glass-panel" style="padding: 1.5rem; margin-bottom: 1.5rem; border-top: 4px solid var(--primary-red);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
                        <h3 style="margin: 0; color: var(--text-primary);"><i class="fas fa-building" style="color: var(--primary-red);"></i> Block ${block} <span style="font-size: 0.8rem; color: var(--text-secondary);">(${tab === 'girls' ? 'Girls' : 'Boys'} Hostel)</span></h3>
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <span style="color: var(--text-secondary); font-size: 0.85rem;">40 Rooms</span>
                            <span style="color: var(--text-secondary); font-size: 0.85rem;">${totalOccupied}/${totalBeds} beds occupied</span>
                            <div style="background: var(--bg-secondary); height: 8px; width: 80px; border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; background: ${occupancyPct > 80 ? 'var(--primary-red)' : occupancyPct > 50 ? 'var(--accent-orange)' : 'var(--accent-green)'}; width: ${occupancyPct}%;"></div>
                            </div>
                            <span style="font-weight: 600; color: var(--text-primary); font-size: 0.85rem;">${occupancyPct}%</span>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 0.75rem; max-height: 400px; overflow-y: auto; padding-right: 0.25rem;">
                        ${this.generateWardenRoomCards(block, roomMap)}
                    </div>
                </div>
            `;
        }).join('');
    }

    generateWardenRoomCards(block, roomMap) {
        let html = '';
        for (let room = 1; room <= 40; room++) {
            const roomNum = room.toString();
            const occupants = roomMap[roomNum] || [];
            const spotsLeft = 3 - occupants.length;
            const statusColor = spotsLeft === 3 ? 'var(--accent-green)' : spotsLeft === 0 ? 'var(--primary-red)' : 'var(--accent-orange)';

            html += `
                <div style="padding: 0.75rem; background: var(--bg-secondary); border-radius: 8px; border-left: 3px solid ${statusColor}; font-size: 0.85rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${occupants.length ? '0.5rem' : '0'};">
                        <span style="font-weight: 600; color: var(--text-primary);"><i class="fas fa-door-closed" style="color: var(--primary-red); font-size: 0.75rem;"></i> ${block}-${roomNum}</span>
                        <span style="font-size: 0.7rem; color: ${statusColor}; font-weight: 600;">${spotsLeft === 0 ? 'Full' : spotsLeft + '/' + 3 + ' free'}</span>
                    </div>
                    ${occupants.length > 0 ? `
                        <div style="display: flex; flex-direction: column; gap: 0.2rem;">
                            ${occupants.map(name => `
                                <span style="color: var(--text-secondary); font-size: 0.75rem;"><i class="fas fa-user" style="color: var(--accent-blue); font-size: 0.6rem;"></i> ${name}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }
        return html;
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

    // ========================
    // INACTIVITY AUTO-LOGOUT (5 minutes)
    // ========================

    setupInactivityTimer() {
        if (window.location.pathname.includes('login.html')) return;

        this._inactivityTimeout = null;
        this._warningTimeout = null;
        this._countdownInterval = null;
        this._inactivityDelay = 5 * 60 * 1000; // 5 minutes
        this._warningDuration = 30; // 30 seconds countdown

        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
        const resetTimer = () => this.resetInactivityTimer();
        events.forEach(evt => document.addEventListener(evt, resetTimer, { passive: true }));

        this.resetInactivityTimer();
    }

    resetInactivityTimer() {
        // Clear existing timers
        if (this._inactivityTimeout) clearTimeout(this._inactivityTimeout);
        if (this._warningTimeout) clearTimeout(this._warningTimeout);
        if (this._countdownInterval) clearInterval(this._countdownInterval);

        // Dismiss warning modal if open
        const existingModal = document.getElementById('inactivityOverlay');
        if (existingModal) existingModal.remove();

        // Set new inactivity timeout
        this._inactivityTimeout = setTimeout(() => {
            this.showInactivityWarning();
        }, this._inactivityDelay);
    }

    showInactivityWarning() {
        let remaining = this._warningDuration;

        const overlay = document.createElement('div');
        overlay.className = 'inactivity-overlay';
        overlay.id = 'inactivityOverlay';
        overlay.innerHTML = `
            <div class="inactivity-modal">
                <i class="fas fa-clock"></i>
                <h3>Session Timeout Warning</h3>
                <p>You have been inactive for 5 minutes. You will be logged out automatically.</p>
                <div class="countdown" id="inactivityCountdown">${remaining}s</div>
                <div class="modal-actions">
                    <button class="btn-stay" id="stayLoggedInBtn">
                        <i class="fas fa-check"></i> Stay Logged In
                    </button>
                    <button class="btn-logout-now" id="logoutNowBtn">
                        <i class="fas fa-sign-out-alt"></i> Logout Now
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const countdownEl = document.getElementById('inactivityCountdown');
        this._countdownInterval = setInterval(() => {
            remaining--;
            if (countdownEl) countdownEl.textContent = remaining + 's';
            if (remaining <= 0) {
                clearInterval(this._countdownInterval);
                this.handleLogout();
            }
        }, 1000);

        document.getElementById('stayLoggedInBtn').addEventListener('click', () => {
            this.resetInactivityTimer();
        });

        document.getElementById('logoutNowBtn').addEventListener('click', () => {
            clearInterval(this._countdownInterval);
            this.handleLogout();
        });
    }

    async handleLogout() {
        try {
            // Clear inactivity timers
            if (this._inactivityTimeout) clearTimeout(this._inactivityTimeout);
            if (this._warningTimeout) clearTimeout(this._warningTimeout);
            if (this._countdownInterval) clearInterval(this._countdownInterval);
            const modal = document.getElementById('inactivityOverlay');
            if (modal) modal.remove();

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

    // --- Page Component Init ---
    initPageComponents(page) {
        if (page === 'dashboard') {
            setTimeout(() => {
                this.initSlider();
                // Start news rotation for warden
                if (this.currentUser?.role === 'warden' || this.currentUser?.role === 'admin') {
                    this.startNewsRotation();
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
