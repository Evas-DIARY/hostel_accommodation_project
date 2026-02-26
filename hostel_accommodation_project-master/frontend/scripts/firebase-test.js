// Firebase Test & Setup Script
// Creates test users directly in Firestore (no Firebase Auth)

async function setupFirebase() {
    console.log('🔥 Setting up test users...');
    
    // Fallback: Create users in localStorage if Firestore not available
    const testUsers = [
        {
            id: '123456',
            data: {
                registration_number: '123456',
                password: 'student123',
                full_name: 'Test Student',
                name: 'Test Student',
                role: 'student',
                gender: 'male',
                program: 'Computer Science',
                year_of_study: 2,
                email: 'student@au.edu',
                created_at: new Date().toISOString()
            }
        },
        {
            id: '999999',
            data: {
                registration_number: '999999',
                password: 'warden123',
                full_name: 'Test Warden',
                name: 'Test Warden',
                role: 'warden',
                gender: 'female',
                program: 'Administration',
                year_of_study: null,
                email: 'warden@au.edu',
                created_at: new Date().toISOString()
            }
        }
    ];

    // Try Firestore first
    if (window.firebaseDb && window.firebaseFunctions) {
        try {
            const { collection, doc, setDoc, getDocs, query, where } = window.firebaseFunctions;

            for (const user of testUsers) {
                const usersRef = collection(window.firebaseDb, 'users');
                const q = query(usersRef, where('registration_number', '==', user.id));
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    await setDoc(doc(window.firebaseDb, 'users', user.id), user.data);
                    console.log(`✅ Firestore: Created ID ${user.id}`);
                } else {
                    console.log(`ℹ️  Firestore: ID ${user.id} exists`);
                }
            }
            console.log('\n🎉 Firestore setup complete!');
            return;
        } catch (error) {
            console.warn('⚠️  Firestore not available:', error.message);
            console.log('📦 Falling back to localStorage...');
        }
    }

    // Fallback to localStorage
    const localUsers = testUsers.map(u => u.data);
    localStorage.setItem('hostel_users', JSON.stringify(localUsers));
    console.log('✅ LocalStorage: Created test users');
    console.log('\n📋 Test Credentials:');
    console.log('Student ID: 123456 / Password: student123');
    console.log('Warden ID: 999999 / Password: warden123');
    console.log('\n⚠️  Note: Create Firestore database for full functionality');
    console.log('Visit: https://console.cloud.google.com/datastore/setup?project=hostel-accommodation');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(setupFirebase, 2000);
    });
} else {
    setTimeout(setupFirebase, 2000);
}

window.setupFirebase = setupFirebase;
