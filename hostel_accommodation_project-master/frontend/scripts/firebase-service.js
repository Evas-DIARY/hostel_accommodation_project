// Firebase Real-time Service (Firestore only)
class FirebaseService {
    constructor() {
        this.db = null;
        this.unsubscribers = [];
    }

    async init() {
        await this.waitForFirebase();
        this.db = window.firebaseDb;
        console.log('FirebaseService: Initialized');
    }

    async waitForFirebase() {
        return new Promise((resolve) => {
            const check = () => {
                if (window.firebaseDb && window.firebaseFunctions) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    // Real-time: Listen to a student's applications
    listenToApplications(studentId, callback) {
        const { onSnapshot, collection, query, where, orderBy } = window.firebaseFunctions;
        const applicationsRef = collection(this.db, 'applications');

        let q;
        try {
            q = query(applicationsRef, where('studentId', '==', studentId), orderBy('submittedAt', 'desc'));
        } catch (e) {
            q = query(applicationsRef, where('studentId', '==', studentId));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const applications = [];
            snapshot.forEach((doc) => {
                applications.push({ id: doc.id, ...doc.data() });
            });
            callback(applications);
        }, (error) => {
            console.warn('FirebaseService: listenToApplications error:', error.message);
            callback([]);
        });

        this.unsubscribers.push(unsubscribe);
        return unsubscribe;
    }

    // Real-time: Listen to a student's room allocation
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
        }, (error) => {
            console.warn('FirebaseService: listenToRoomAllocation error:', error.message);
            callback([]);
        });

        this.unsubscribers.push(unsubscribe);
        return unsubscribe;
    }

    // Real-time: Listen to all pending applications (Warden)
    listenToPendingApplications(callback) {
        const { onSnapshot, collection, query, where } = window.firebaseFunctions;
        const applicationsRef = collection(this.db, 'applications');
        const q = query(applicationsRef, where('status', '==', 'pending'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const applications = [];
            snapshot.forEach((doc) => {
                applications.push({ id: doc.id, ...doc.data() });
            });
            callback(applications);
        }, (error) => {
            console.warn('FirebaseService: listenToPendingApplications error:', error.message);
            callback([]);
        });

        this.unsubscribers.push(unsubscribe);
        return unsubscribe;
    }

    // Real-time: Listen to all applications (Warden)
    listenToAllApplications(callback) {
        const { onSnapshot, collection } = window.firebaseFunctions;
        const applicationsRef = collection(this.db, 'applications');

        const unsubscribe = onSnapshot(applicationsRef, (snapshot) => {
            const applications = [];
            snapshot.forEach((doc) => {
                applications.push({ id: doc.id, ...doc.data() });
            });
            callback(applications);
        }, (error) => {
            console.warn('FirebaseService: listenToAllApplications error:', error.message);
            callback([]);
        });

        this.unsubscribers.push(unsubscribe);
        return unsubscribe;
    }

    // Real-time: Listen to all rooms
    listenToRooms(callback) {
        const { onSnapshot, collection } = window.firebaseFunctions;
        const roomsRef = collection(this.db, 'rooms');

        const unsubscribe = onSnapshot(roomsRef, (snapshot) => {
            const rooms = [];
            snapshot.forEach((doc) => {
                rooms.push({ id: doc.id, ...doc.data() });
            });
            callback(rooms);
        }, (error) => {
            console.warn('FirebaseService: listenToRooms error:', error.message);
            callback([]);
        });

        this.unsubscribers.push(unsubscribe);
        return unsubscribe;
    }

    // Real-time: Listen to all allocations (Warden)
    listenToAllocations(callback) {
        const { onSnapshot, collection } = window.firebaseFunctions;
        const allocationsRef = collection(this.db, 'allocations');

        const unsubscribe = onSnapshot(allocationsRef, (snapshot) => {
            const allocations = [];
            snapshot.forEach((doc) => {
                allocations.push({ id: doc.id, ...doc.data() });
            });
            callback(allocations);
        }, (error) => {
            console.warn('FirebaseService: listenToAllocations error:', error.message);
            callback([]);
        });

        this.unsubscribers.push(unsubscribe);
        return unsubscribe;
    }

    // Submit a new application
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

    // Approve application (Warden)
    async approveApplication(applicationId, wardenId) {
        const { doc, updateDoc, serverTimestamp } = window.firebaseFunctions;
        const applicationRef = doc(this.db, 'applications', applicationId);

        return await updateDoc(applicationRef, {
            status: 'approved',
            reviewedBy: wardenId,
            reviewedAt: serverTimestamp()
        });
    }

    // Reject application (Warden)
    async rejectApplication(applicationId, wardenId, reason) {
        const { doc, updateDoc, serverTimestamp } = window.firebaseFunctions;
        const applicationRef = doc(this.db, 'applications', applicationId);

        return await updateDoc(applicationRef, {
            status: 'rejected',
            reviewedBy: wardenId,
            reviewedAt: serverTimestamp(),
            rejectionReason: reason || 'No reason provided'
        });
    }

    // Allocate room to a student (Warden)
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

            // Update application status if applicationId provided
            if (allocationData.applicationId) {
                const applicationRef = doc(this.db, 'applications', allocationData.applicationId);
                transaction.update(applicationRef, {
                    status: 'allocated',
                    allocatedRoom: allocationData.roomNumber || allocationData.roomId
                });
            }
        });
    }

    // Get user data
    async getUserData(userId) {
        const { doc, getDoc } = window.firebaseFunctions;
        const userRef = doc(this.db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            return { id: userDoc.id, ...userDoc.data() };
        }
        return null;
    }

    // Cleanup all listeners
    cleanup() {
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
        this.unsubscribers = [];
    }
}

// Initialize service
window.firebaseService = new FirebaseService();
