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
        const { onSnapshot, collection, query, where } = window.firebaseFunctions;
        const applicationsRef = collection(this.db, 'applications');

        // Query without orderBy to avoid requiring a composite index
        const q = query(applicationsRef, where('studentId', '==', studentId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const applications = [];
            snapshot.forEach((doc) => {
                applications.push({ id: doc.id, ...doc.data() });
            });
            // Sort client-side: newest first
            applications.sort((a, b) => {
                const dateA = a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(a.submittedAt || 0);
                const dateB = b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(b.submittedAt || 0);
                return dateB - dateA;
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

    // Real-time: Listen to notifications for a user
    listenToNotifications(userId, callback) {
        const { onSnapshot, collection, query, where } = window.firebaseFunctions;
        const notificationsRef = collection(this.db, 'notifications');

        // Query without orderBy to avoid requiring a composite index
        const q = query(notificationsRef, where('userId', '==', userId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifications = [];
            snapshot.forEach((doc) => {
                notifications.push({ id: doc.id, ...doc.data() });
            });
            // Sort client-side: newest first
            notifications.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                return dateB - dateA;
            });
            callback(notifications);
        }, (error) => {
            console.warn('FirebaseService: listenToNotifications error:', error.message);
            callback([]);
        });

        this.unsubscribers.push(unsubscribe);
        return unsubscribe;
    }

    // Add a notification
    async addNotification(userId, message, type = 'info') {
        const { collection, addDoc, serverTimestamp } = window.firebaseFunctions;
        const notificationsRef = collection(this.db, 'notifications');

        return await addDoc(notificationsRef, {
            userId: userId,
            message: message,
            type: type,
            read: false,
            createdAt: serverTimestamp()
        });
    }

    // Mark notification as read
    async markNotificationRead(notificationId) {
        const { doc, updateDoc } = window.firebaseFunctions;
        const notifRef = doc(this.db, 'notifications', notificationId);
        return await updateDoc(notifRef, { read: true });
    }

    // Mark all notifications as read
    async markAllNotificationsRead(userId) {
        const { collection, query, where, getDocs, doc, updateDoc } = window.firebaseFunctions;
        const notificationsRef = collection(this.db, 'notifications');
        const q = query(notificationsRef, where('userId', '==', userId), where('read', '==', false));
        const snapshot = await getDocs(q);
        const promises = [];
        snapshot.forEach((d) => {
            promises.push(updateDoc(doc(this.db, 'notifications', d.id), { read: true }));
        });
        return await Promise.all(promises);
    }

    // Update user profile (for photo etc.)
    async updateUserProfile(userId, data) {
        const { doc, updateDoc } = window.firebaseFunctions;
        const userRef = doc(this.db, 'users', userId);
        return await updateDoc(userRef, data);
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

        const result = await addDoc(applicationsRef, data);

        // Create a notification for the student
        try {
            await this.addNotification(
                applicationData.studentId,
                'Your accommodation application has been submitted successfully! It is now pending review by the warden.',
                'success'
            );
        } catch (e) {
            console.warn('Could not create notification:', e.message);
        }

        return result;
    }

    // Approve application (Warden)
    async approveApplication(applicationId, wardenId, studentId) {
        const { doc, updateDoc, serverTimestamp } = window.firebaseFunctions;
        const applicationRef = doc(this.db, 'applications', applicationId);

        await updateDoc(applicationRef, {
            status: 'approved',
            reviewedBy: wardenId,
            reviewedAt: serverTimestamp()
        });

        // Notify student
        if (studentId) {
            try {
                await this.addNotification(
                    studentId,
                    'Your accommodation application has been approved! The warden will assign you a room shortly.',
                    'success'
                );
            } catch (e) {
                console.warn('Could not create notification:', e.message);
            }
        }
    }

    // Reject application (Warden)
    async rejectApplication(applicationId, wardenId, reason, studentId) {
        const { doc, updateDoc, serverTimestamp } = window.firebaseFunctions;
        const applicationRef = doc(this.db, 'applications', applicationId);

        await updateDoc(applicationRef, {
            status: 'rejected',
            reviewedBy: wardenId,
            reviewedAt: serverTimestamp(),
            rejectionReason: reason || 'No reason provided'
        });

        // Notify student
        if (studentId) {
            try {
                await this.addNotification(
                    studentId,
                    `Your accommodation application has been rejected. Reason: ${reason || 'No reason provided'}`,
                    'error'
                );
            } catch (e) {
                console.warn('Could not create notification:', e.message);
            }
        }
    }

    // Allocate room to a student (Warden)
    async allocateRoom(allocationData) {
        const { collection, addDoc, doc, updateDoc, getDocs, query, where, serverTimestamp } = window.firebaseFunctions;

        // Check current occupancy for this room by counting active allocations
        const allocationsRef = collection(this.db, 'allocations');
        const roomQuery = query(
            allocationsRef,
            where('block', '==', allocationData.block),
            where('roomNumber', '==', allocationData.roomNumber),
            where('status', '==', 'active')
        );
        const existingSnapshot = await getDocs(roomQuery);
        const currentOccupancy = existingSnapshot.size;

        if (currentOccupancy >= 3) {
            throw new Error('Room is full (3/3 beds occupied)');
        }

        // Create allocation document
        const allocationDoc = {
            ...allocationData,
            status: 'active',
            allocatedAt: serverTimestamp()
        };

        await addDoc(allocationsRef, allocationDoc);

        // Update application status if applicationId provided
        if (allocationData.applicationId) {
            const applicationRef = doc(this.db, 'applications', allocationData.applicationId);
            await updateDoc(applicationRef, {
                status: 'allocated',
                allocatedRoom: `${allocationData.block}-${allocationData.roomNumber}`,
                allocatedBlock: allocationData.block
            });
        }
    }

    // Notify student after allocation
    async notifyAllocation(studentId, block, roomNumber) {
        try {
            await this.addNotification(
                studentId,
                `You have been allocated to Block ${block}, Room ${roomNumber}. Check your View Rooms tab for details.`,
                'success'
            );
        } catch (e) {
            console.warn('Could not create allocation notification:', e.message);
        }
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
