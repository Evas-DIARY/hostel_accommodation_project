// Firestore/LocalStorage Authentication Module
// No Firebase Auth SDK - uses Firestore users collection directly
class AuthManager {
    constructor() {
        this.user = undefined; // undefined = not initialized, null = logged out
        this.useFirestore = false;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        this.initialized = true;

        // Check if Firestore is available
        if (window.firebaseDb && window.firebaseFunctions) {
            this.useFirestore = true;
            console.log('Auth: Using Firestore for authentication');
        } else {
            this.useFirestore = false;
            console.log('Auth: Using localStorage for authentication');
            await this.ensureDefaultUsers();
        }

        // Check for existing session
        this.restoreSession();
    }

    restoreSession() {
        const saved = localStorage.getItem('currentUser');
        if (saved) {
            try {
                this.user = JSON.parse(saved);
                console.log('Auth: Session restored for', this.user.name);
                if (!window.location.pathname.includes('login.html')) {
                    this.onLogin(this.user);
                }
            } catch (e) {
                this.user = null;
                localStorage.removeItem('currentUser');
            }
        } else {
            this.user = null;
            this.onLogout();
        }
    }

    async signIn(identifier, password) {
        identifier = identifier.trim();

        // Try Firestore first
        if (this.useFirestore) {
            try {
                const result = await this._firestoreSignIn(identifier, password);
                if (result.success) return result;
                // If Firestore says not found, also try localStorage before giving up
            } catch (error) {
                console.warn('Firestore sign-in error, trying localStorage:', error.message);
            }
        }

        // LocalStorage fallback (always tried if Firestore didn't succeed)
        await this.ensureDefaultUsers();
        const users = this.getLocalUsers();
        const user = users.find(u =>
            (u.email === identifier || u.registration_number === identifier) &&
            u.password === password
        );

        if (!user) {
            return { success: false, error: 'Invalid credentials. Please check your email/ID and password.' };
        }

        const sessionUser = this._buildSession(user);
        this.user = sessionUser;
        localStorage.setItem('currentUser', JSON.stringify(sessionUser));
        return { success: true, user: sessionUser };
    }

    async _firestoreSignIn(identifier, password) {
        const { collection, query, where, getDocs } = window.firebaseFunctions;
        const usersRef = collection(window.firebaseDb, 'users');

        let userDoc = null;
        let userData = null;

        if (/^\d{6}$/.test(identifier)) {
            const q = query(usersRef, where('registration_number', '==', identifier));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) { userDoc = snapshot.docs[0]; userData = userDoc.data(); }
        } else {
            const q = query(usersRef, where('email', '==', identifier));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) { userDoc = snapshot.docs[0]; userData = userDoc.data(); }
        }

        if (!userData) {
            return { success: false, error: 'Account not found. Please register first.' };
        }
        if (userData.password !== password) {
            return { success: false, error: 'Invalid password. Please try again.' };
        }

        const sessionUser = {
            uid: userDoc.id,
            email: userData.email,
            name: userData.full_name || userData.name,
            full_name: userData.full_name || userData.name,
            role: userData.role || 'student',
            registration_number: userData.registration_number,
            program: userData.program || 'N/A',
            gender: userData.gender || 'N/A'
        };

        this.user = sessionUser;
        localStorage.setItem('currentUser', JSON.stringify(sessionUser));
        return { success: true, user: sessionUser };
    }

    _buildSession(user) {
        return {
            uid: user.uid || user.registration_number,
            email: user.email,
            name: user.full_name || user.name,
            full_name: user.full_name || user.name,
            role: user.role || 'student',
            registration_number: user.registration_number,
            program: user.program || 'N/A',
            gender: user.gender || 'N/A'
        };
    }

    async signUp(email, password, userData) {
        // Try Firestore first, then fall back to localStorage
        if (this.useFirestore) {
            try {
                return await this._firestoreSignUp(email, password, userData);
            } catch (error) {
                console.warn('Firestore sign-up failed, falling back to localStorage:', error.message);
                // Fall through to localStorage
            }
        }

        // LocalStorage fallback
        await this.ensureDefaultUsers();
        const users = this.getLocalUsers();

        const exists = users.find(u =>
            u.email === email || u.registration_number === userData.registration_number
        );
        if (exists) {
            return { success: false, error: 'User already exists with this email or registration number.' };
        }

        const newUser = {
            ...userData,
            email: email,
            password: password,
            uid: userData.registration_number,
            created_at: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        console.log('Auth: User registered in localStorage:', newUser.uid);
        return { success: true, user: { uid: newUser.uid }, shouldRedirectToLogin: true };
    }

    async _firestoreSignUp(email, password, userData) {
        const { collection, query, where, getDocs, doc, setDoc } = window.firebaseFunctions;
        const usersRef = collection(window.firebaseDb, 'users');

        // Check if email already exists
        const emailQuery = query(usersRef, where('email', '==', email));
        const emailSnapshot = await getDocs(emailQuery);
        if (!emailSnapshot.empty) {
            return { success: false, error: 'An account with this email already exists.' };
        }

        // Check if registration number already exists
        const regQuery = query(usersRef, where('registration_number', '==', userData.registration_number));
        const regSnapshot = await getDocs(regQuery);
        if (!regSnapshot.empty) {
            return { success: false, error: 'This registration number is already registered.' };
        }

        const docId = userData.registration_number;
        const userDoc = {
            ...userData,
            email: email,
            password: password,
            uid: docId,
            created_at: new Date().toISOString()
        };

        await setDoc(doc(window.firebaseDb, 'users', docId), userDoc);
        console.log('Auth: User registered in Firestore:', docId);

        // Also save to localStorage as backup
        const users = this.getLocalUsers();
        users.push(userDoc);
        localStorage.setItem('users', JSON.stringify(users));

        return { success: true, user: { uid: docId }, shouldRedirectToLogin: true };
    }

    async signOut() {
        this.user = null;
        localStorage.removeItem('currentUser');
        return { success: true };
    }

    async getUserProfile(uid) {
        if (this.useFirestore) {
            try {
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
            const users = this.getLocalUsers();
            return users.find(u => u.uid === uid || u.registration_number === uid) || null;
        }
    }

    onLogin(user) {
        console.log('Auth: User logged in:', user.name, '(' + user.role + ')');

        // Wait for app to be available
        if (typeof window.app === 'undefined') {
            setTimeout(() => this.onLogin(user), 100);
            return;
        }

        window.app.currentUser = {
            name: user.full_name || user.name,
            full_name: user.full_name || user.name,
            role: user.role || 'student',
            id: user.registration_number || user.uid,
            email: user.email,
            program: user.program || 'N/A',
            gender: user.gender || 'N/A'
        };

        // Update nav UI
        this.updateUIBasedOnRole(window.app.currentUser.role);

        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = window.app.currentUser.name;
        }

        window.app.loadDashboard();
    }

    onLogout() {
        console.log('Auth: User logged out');
        if (typeof window.app !== 'undefined') {
            window.app.currentUser = null;
        }
        // Redirect to login if not already there
        if (!window.location.pathname.includes('login.html')) {
            const loginPath = window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
            window.location.href = loginPath;
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

    // LocalStorage helpers
    getLocalUsers() {
        const data = localStorage.getItem('users');
        return data ? JSON.parse(data) : [];
    }

    async ensureDefaultUsers() {
        if (!localStorage.getItem('users')) {
            const defaults = [
                {
                    uid: '123456',
                    email: 'student@au.edu',
                    name: 'Test Student',
                    full_name: 'Test Student',
                    registration_number: '123456',
                    role: 'student',
                    gender: 'male',
                    program: 'BSc Computer Science',
                    password: 'password123',
                    created_at: new Date().toISOString()
                },
                {
                    uid: '654321',
                    email: 'warden@au.edu',
                    name: 'Test Warden',
                    full_name: 'Test Warden',
                    registration_number: '654321',
                    role: 'warden',
                    gender: 'female',
                    program: 'Administration',
                    password: 'password123',
                    created_at: new Date().toISOString()
                }
            ];
            localStorage.setItem('users', JSON.stringify(defaults));
            console.log('Auth: Default test users created in localStorage');
        }
    }
}

// Initialize auth manager
const authManager = new AuthManager();
