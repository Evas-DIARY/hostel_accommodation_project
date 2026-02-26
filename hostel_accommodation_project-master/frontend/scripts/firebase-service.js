// Firebase Real-time Service
class FirebaseService {
    constructor() {
        this.auth = null;
        this.db = null;
        this.unsubscribers = [];
        this.inactivityTimer = null;
        this.INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
    }

    async init() {
        // Wait for Firebase to be loaded
        await this.waitForFirebase();
        this.auth = window.firebaseAuth;
        this.db = window.firebaseDb;

        // Enable offline persistence for Firestore
        await this.enableOfflinePersistence();

        this.setupInactivityMonitor();
        this.setupSecurityHeaders();
    }

    async waitForFirebase() {
        return new Promise((resolve) => {
            const check = () => {
                if (window.firebaseAuth && window.firebaseDb) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    async enableOfflinePersistence() {
        try {
            const { enableIndexedDbPersistence } = window.firebaseFunctions;
            await enableIndexedDbPersistence(this.db);
            console.log('Firebase persistence enabled.');
        } catch (error) {
            if (error.code === 'failed-precondition') {
                console.warn('Firebase persistence failed: Multiple tabs open. Persistence can only be enabled in one tab at a time.');
            } else if (error.code === 'unimplemented') {
                console.warn('Firebase persistence failed: The current browser does not support all of the features required to enable persistence.');
            } else {
                console.error('Firebase persistence failed:', error);
            }
        }
    }

    // Security: Inactivity Monitor
    setupInactivityMonitor() {
        const resetTimer = () => {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = setTimeout(() => {
                this.handleInactivityLogout();
            }, this.INACTIVITY_TIMEOUT);
        };

        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });

        resetTimer();
    }

    async handleInactivityLogout() {
        if (this.auth.currentUser) {
            await this.signOut();
            alert('You have been logged out due to inactivity.');
            window.location.href = 'pages/login.html';
        }
    }

    setupSecurityHeaders() {
        // Prevent clickjacking
        if (window.self !== window.top) {
            window.top.location = window.self.location;
        }
    }

    // Real-time Application Listener
    listenToApplications(studentId, callback) {
        const { onSnapshot, collection, query, where } = window.firebaseFunctions;
        const applicationsRef = collection(this.db, 'applications');
        const q = query(applicationsRef, where('studentId', '==', studentId));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const applications = [];
            snapshot.forEach((doc) => {
                applications.push({ id: doc.id, ...doc.data() });
            });
            callback(applications);
        });
        
        this.unsubscribers.push(unsubscribe);
        return unsubscribe;
    }

    // Real-time Room Allocation Listener
    listenToRoomAllocation(studentId, callback) {
        const { onSnapshot, collection, query, where } = window.firebaseFunctions;
        const allocationsRef = collection(this.db, 'allocations');
        const q = query(allocationsRef, where('studentId', '==', studentId), where('status', '==', 'active'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allocations = [];
            snapshot.forEach((doc) => {
                allocations.push({ id: doc.id, ...doc.data() });
            });
            callback(allocations);
        });
        
        this.unsubscribers.push(unsubscribe);
        return unsubscribe;
    }

    // Real-time Pending Applications (Warden)
    listenToPendingApplications(callback) {
        const { onSnapshot, collection, query, where, orderBy } = window.firebaseFunctions;
        const applicationsRef = collection(this.db, 'applications');
        const q = query(applicationsRef, where('status', '==', 'pending'), orderBy('submittedAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const applications = [];
            snapshot.forEach((doc) => {
                applications.push({ id: doc.id, ...doc.data() });
            });
            callback(applications);
        });
        
        this.unsubscribers.push(unsubscribe);
        return unsubscribe;
    }

    // Real-time All Rooms Listener
    listenToRooms(callback) {
        const { onSnapshot, collection } = window.firebaseFunctions;
        const roomsRef = collection(this.db, 'rooms');
        
        const unsubscribe = onSnapshot(roomsRef, (snapshot) => {
            const rooms = [];
            snapshot.forEach((doc) => {
                rooms.push({ id: doc.id, ...doc.data() });
            });
            callback(rooms);
        });
        
        this.unsubscribers.push(unsubscribe);
        return unsubscribe;
    }

    // Submit Application
    async submitApplication(applicationData) {
        const { collection, addDoc, serverTimestamp } = window.firebaseFunctions;
        const applicationsRef = collection(this.db, 'applications');
        
        const data = {
            ...applicationData,
            status: 'pending',
            submittedAt: serverTimestamp(),
            reviewedBy: null,
            reviewedAt: null
        };
        
        return await addDoc(applicationsRef, data);
    }

    // Approve Application (Warden)
    async approveApplication(applicationId, wardenId) {
        const { doc, updateDoc, serverTimestamp } = window.firebaseFunctions;
        const applicationRef = doc(this.db, 'applications', applicationId);
        
        return await updateDoc(applicationRef, {
            status: 'approved',
            reviewedBy: wardenId,
            reviewedAt: serverTimestamp()
        });
    }

    // Reject Application (Warden)
    async rejectApplication(applicationId, wardenId, reason) {
        const { doc, updateDoc, serverTimestamp } = window.firebaseFunctions;
        const applicationRef = doc(this.db, 'applications', applicationId);
        
        return await updateDoc(applicationRef, {
            status: 'rejected',
            reviewedBy: wardenId,
            reviewedAt: serverTimestamp(),
            rejectionReason: reason
        });
    }

    // Allocate Room (Warden)
    async allocateRoom(allocationData) {
        const { collection, addDoc, doc, updateDoc, serverTimestamp, runTransaction } = window.firebaseFunctions;
        
        // Use transaction to ensure room capacity isn't exceeded
        return await runTransaction(this.db, async (transaction) => {
            const roomRef = doc(this.db, 'rooms', allocationData.roomId);
            const roomDoc = await transaction.get(roomRef);
            
            if (!roomDoc.exists()) {
                throw new Error('Room does not exist');
            }
            
            const room = roomDoc.data();
            if (room.occupied >= room.capacity) {
                throw new Error('Room is full');
            }
            
            // Create allocation
            const allocationsRef = collection(this.db, 'allocations');
            const allocationDoc = {
                ...allocationData,
                status: 'active',
                allocatedAt: serverTimestamp()
            };
            
            await addDoc(allocationsRef, allocationDoc);
            
            // Update room occupancy
            transaction.update(roomRef, {
                occupied: room.occupied + 1
            });
            
            // Update application status
            const applicationRef = doc(this.db, 'applications', allocationData.applicationId);
            transaction.update(applicationRef, {
                status: 'allocated'
            });
        });
    }

    // Get User Data
    async getUserData(userId) {
        const { doc, getDoc } = window.firebaseFunctions;
        const userRef = doc(this.db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            return { id: userDoc.id, ...userDoc.data() };
        }
        return null;
    }

    // Sign Out
    async signOut() {
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
        this.unsubscribers = [];
        clearTimeout(this.inactivityTimer);
        
        const { signOut } = window.firebaseFunctions;
        await signOut(this.auth);
    }

    // Cleanup
    cleanup() {
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
        this.unsubscribers = [];
        clearTimeout(this.inactivityTimer);
    }
}

// Initialize service
window.firebaseService = new FirebaseService();
