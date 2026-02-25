// Firebase/JSON Authentication Module
class AuthManager {
    constructor() {
        this.user = undefined; // Start as undefined to indicate not initialized
        this.useFirebase = false;
        this.init();
    }

    init() {
        // Check if Firebase is available
        if (typeof window.firebaseAuth !== 'undefined') {
            this.useFirebase = true;
            this.setupAuthListeners();
        } else {
            // Fallback to JSON storage
            this.useFirebase = false;
            this.loadUsersFromJSON().then(() => {
                this.setupAuthListeners();
            }).catch(() => {
                // Even if loading fails, set up listeners with empty users
                this.setupAuthListeners();
            });
        }
    }

    setupAuthListeners() {
        if (this.useFirebase) {
            const { onAuthStateChanged } = window.firebaseFunctions;
            onAuthStateChanged(window.firebaseAuth, (user) => {
                if (user) {
                    this.user = user;
                    this.onLogin(user);
                } else {
                    this.user = null;
                    this.onLogout();
                }
            });
        } else {
            // For JSON, check localStorage
            const loggedInUser = localStorage.getItem('currentUser');
            if (loggedInUser) {
                this.user = JSON.parse(loggedInUser);
                this.onLogin(this.user);
            } else {
                this.onLogout();
            }
        }
    }

    async signIn(identifier, password) {
        if (this.useFirebase) {
            // Use email for Firebase
            try {
                const { signInWithEmailAndPassword } = window.firebaseFunctions;
                const result = await signInWithEmailAndPassword(window.firebaseAuth, identifier, password);
                return { success: true, user: result.user };
            } catch (error) {
                return { success: false, error: this.getErrorMessage(error.code) };
            }
        } else {
            // Use JSON storage - check both email and registration number
            try {
                console.log('Attempting JSON login for:', identifier);
                // Ensure users are loaded
                if (!localStorage.getItem('users')) {
                    console.log('Loading users from JSON...');
                    await this.loadUsersFromJSON();
                }

                const users = this.getUsers();
                console.log('Available users:', users.length);

                const user = users.find(u =>
                    (u.email === identifier || u.registration_number === identifier) &&
                    u.password === password
                );

                if (!user) {
                    console.log('User not found or invalid credentials');
                    return { success: false, error: 'Invalid email/registration number or password' };
                }

                console.log('User found:', user.email || user.registration_number);
                const userObj = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.name
                };

                this.user = userObj;
                localStorage.setItem('currentUser', JSON.stringify(userObj));

                return { success: true, user: userObj };
            } catch (error) {
                console.error('Login error:', error);
                return { success: false, error: 'Login failed. Please try again.' };
            }
        }
    }

    async signUp(email, password, userData) {
        if (this.useFirebase) {
            try {
                const { createUserWithEmailAndPassword, doc, setDoc } = window.firebaseFunctions;
                const result = await createUserWithEmailAndPassword(window.firebaseAuth, email, password);

                const userDoc = {
                    ...userData,
                    uid: result.user.uid,
                    email: email,
                    created_at: new Date()
                };

                await setDoc(doc(window.firebaseDb, 'users', result.user.uid), userDoc);

                // Sign out immediately after registration
                await this.signOut();

                return { success: true, user: result.user, shouldRedirectToLogin: true };
            } catch (error) {
                return { success: false, error: this.getErrorMessage(error.code) };
            }
        } else {
            // Use JSON storage
            try {
                console.log('Starting registration process...');
                // Ensure users are loaded
                if (!localStorage.getItem('users')) {
                    console.log('Loading users from JSON...');
                    await this.loadUsersFromJSON();
                }

                const users = this.getUsers();
                console.log('Current users count:', users.length);

                const existingUser = users.find(u =>
                    u.registration_number === userData.registration_number ||
                    u.email === email
                );

                if (existingUser) {
                    console.log('User already exists:', existingUser);
                    return { success: false, error: 'User already exists' };
                }

                const newUser = {
                    ...userData,
                    password: password,
                    uid: userData.registration_number,
                    created_at: new Date()
                };

                console.log('Creating new user:', newUser);
                users.push(newUser);
                this.saveUsersToJSON(users);

                console.log('Registration successful');
                return { success: true, user: { uid: newUser.uid }, shouldRedirectToLogin: true };
            } catch (error) {
                console.error('Registration error:', error);
                return { success: false, error: 'Failed to register user. Please try again.' };
            }
        }
    }

    async signOut() {
        if (this.useFirebase) {
            try {
                const { signOut } = window.firebaseFunctions;
                await signOut(window.firebaseAuth);
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        } else {
            this.user = null;
            localStorage.removeItem('currentUser');
            return { success: true };
        }
    }

    async getUserProfile(uid) {
        if (this.useFirebase) {
            try {
                // Try to get profile from backend API first if available
                if (typeof apiManager !== 'undefined') {
                    try {
                        // We use the token to identify the user, so /me is appropriate
                        const response = await apiManager.get('/users/me');
                        return response; // Assuming backend returns the user object directly or in a wrapper
                    } catch (apiError) {
                        console.warn('API profile fetch failed, falling back to direct Firestore', apiError);
                    }
                }
                
                // Fallback to direct Firestore if API fails or apiManager not ready
                const { doc, getDoc } = window.firebaseFunctions;
                const userDoc = await getDoc(doc(window.firebaseDb, 'users', uid));
                if (userDoc.exists()) {
                    return userDoc.data();
                }
                return null;
            } catch (error) {
                console.error('Error getting user profile:', error);
                return null;
            }
        } else {
            const users = this.getUsers();
            return users.find(u => u.uid === uid) || null;
        }
    }

    async getIdToken() {
        if (this.useFirebase && this.user) {
            return await this.user.getIdToken();
        }
        return 'json-token';
    }

    async onLogin(user) {
        console.log('User logged in:', user);

        const profile = await this.getUserProfile(user.uid);

        // Wait for app to be available
        if (typeof window.app === 'undefined') {
            setTimeout(() => this.onLogin(user), 100);
            return;
        }

        window.app.currentUser = {
            name: profile?.full_name || profile?.name || user.email || user.displayName,
            role: profile?.role || 'student',
            id: user.uid,
            email: user.email
        };

        // If we're on the login page, redirect to main page
        if (window.location.pathname.includes('login.html')) {
            window.location.href = '../index.html';
        } else if (typeof window.app !== 'undefined') {
            // If app object exists, update UI
            this.updateUIBasedOnRole(window.app.currentUser.role);

            const userNameElement = document.querySelector('.user-name');
            if (userNameElement) {
                userNameElement.textContent = window.app.currentUser.name;
            }

            // Only load dashboard if we're not already loading it
            if (!window.location.pathname.includes('index.html') || !window.app.currentUser) {
                window.app.loadDashboard();
            }
        }
    }

    onLogout() {
        console.log('User logged out');
        if (typeof window.app !== 'undefined') {
            window.app.currentUser = null;
            if (window.app.loadPage) {
                window.app.loadPage('login');
            }
        } else {
            // If app object doesn't exist, redirect to login page
            if (!window.location.pathname.includes('login.html')) {
                // Fix path detection to prevent double pages/pages/ issue
                const loginPath = window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
                window.location.href = loginPath;
            }
        }
    }

    isAuthenticated() {
        return this.user !== null && this.user !== undefined;
    }

    updateUIBasedOnRole(role) {
        const adminLinks = document.querySelectorAll('.admin-only');
        const studentLinks = document.querySelectorAll('.student-only');

        if (role === 'warden' || role === 'admin') {
            adminLinks.forEach(link => link.style.display = 'block');
            studentLinks.forEach(link => link.style.display = 'none');
        } else {
            adminLinks.forEach(link => link.style.display = 'none');
            studentLinks.forEach(link => link.style.display = 'block');
        }
    }

    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.'
        };
        return errorMessages[errorCode] || 'An error occurred. Please try again.';
    }

    // JSON storage methods
    async loadUsersFromJSON() {
        // Always ensure default test users are available, skip fetch
        const defaultUsers = [
            {
                "uid": "test-student-001",
                "email": "student@au.edu",
                "name": "Test Student",
                "full_name": "Test Student",
                "registration_number": "123456",
                "role": "student",
                "password": "password123",
                "created_at": "2024-01-01T00:00:00.000Z"
            },
            {
                "uid": "test-warden-001",
                "email": "warden@au.edu",
                "name": "Test Warden",
                "full_name": "Test Warden",
                "registration_number": "654321",
                "role": "warden",
                "password": "password123",
                "created_at": "2024-01-01T00:00:00.000Z"
            }
        ];
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify(defaultUsers));
            console.log('Using default test users');
        }
        return JSON.parse(localStorage.getItem('users'));
    }

    getUsers() {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
    }

    saveUsersToJSON(users) {
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// Initialize auth manager
const authManager = new AuthManager();