// Seed Firebase with Initial Data
async function seedFirebaseData() {
    const { collection, addDoc, doc, setDoc } = window.firebaseFunctions;
    const db = window.firebaseDb;
    
    console.log('Starting Firebase data seeding...');
    
    // Seed Rooms
    const blocks = {
        girls: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        boys: ['I', 'J', 'K', 'L']
    };
    
    const roomsRef = collection(db, 'rooms');
    
    // Create rooms for girls blocks
    for (const block of blocks.girls) {
        for (let floor = 1; floor <= 3; floor++) {
            for (let room = 1; room <= 8; room++) {
                const roomNumber = `${block}-${floor}0${room}`;
                await addDoc(roomsRef, {
                    number: roomNumber,
                    block: block,
                    floor: floor,
                    gender: 'female',
                    capacity: 3,
                    occupied: Math.floor(Math.random() * 3),
                    amenities: ['WiFi', 'Study Desk', 'Wardrobe', 'Fan'],
                    condition: ['Excellent', 'Good'][Math.floor(Math.random() * 2)],
                    isActive: true
                });
            }
        }
    }
    
    // Create rooms for boys blocks
    for (const block of blocks.boys) {
        for (let floor = 1; floor <= 3; floor++) {
            for (let room = 1; room <= 8; room++) {
                const roomNumber = `${block}-${floor}0${room}`;
                await addDoc(roomsRef, {
                    number: roomNumber,
                    block: block,
                    floor: floor,
                    gender: 'male',
                    capacity: 3,
                    occupied: Math.floor(Math.random() * 3),
                    amenities: ['WiFi', 'Study Desk', 'Wardrobe', 'Fan'],
                    condition: ['Excellent', 'Good'][Math.floor(Math.random() * 2)],
                    isActive: true
                });
            }
        }
    }
    
    console.log('Firebase data seeding completed!');
}

// Run seed function (call this once from browser console)
window.seedFirebaseData = seedFirebaseData;
