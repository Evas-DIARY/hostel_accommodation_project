// Room Allocation Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    loadStudents();
    loadRooms();
    loadAllocations();
    loadRoomOverview();

    // Form submission
    document.getElementById('allocationForm').addEventListener('submit', handleAllocation);

    // Search and filter
    document.getElementById('searchInput').addEventListener('input', filterAllocations);
    document.getElementById('statusFilter').addEventListener('change', filterAllocations);

    // Modal close
    document.querySelector('.close').addEventListener('click', closeModal);
});

async function loadStudents() {
    try {
        // Mock students data - in development mode
        const mockStudents = [
            { id: '1', full_name: 'John Doe', email: 'john.doe@au.edu' },
            { id: '2', full_name: 'Jane Smith', email: 'jane.smith@au.edu' },
            { id: '3', full_name: 'Bob Johnson', email: 'bob.johnson@au.edu' }
        ];

        const studentSelect = document.getElementById('studentSelect');
        mockStudents.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.full_name} (${student.email})`;
            studentSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading students:', error);
        showToast('Error loading students', 'error');
    }
}

async function loadRooms() {
    try {
        // Mock rooms data - in development mode
        const mockRooms = [
            { id: '1', room_number: '101', capacity: 2, occupied: 1 },
            { id: '2', room_number: '102', capacity: 2, occupied: 0 },
            { id: '3', room_number: '103', capacity: 1, occupied: 1 },
            { id: '4', room_number: '104', capacity: 2, occupied: 2 }
        ];

        const roomSelect = document.getElementById('roomSelect');
        mockRooms.forEach(room => {
            const available = room.capacity - room.occupied;
            if (available > 0) {
                const option = document.createElement('option');
                option.value = room.id;
                option.textContent = `Room ${room.room_number} (${available} available)`;
                roomSelect.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Error loading rooms:', error);
        showToast('Error loading rooms', 'error');
    }
}

async function handleAllocation(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const allocationData = {
        user_id: formData.get('studentSelect'),
        room_id: formData.get('roomSelect'),
        academic_year: formData.get('academicYear'),
        semester: formData.get('semester')
    };

    try {
        // Mock allocation creation - in development mode
        showToast('Room allocated successfully! (Demo Mode)', 'success');
        e.target.reset();
        loadAllocations();
        loadRoomOverview();
    } catch (error) {
        console.error('Error allocating room:', error);
        showToast(error.message || 'Error allocating room', 'error');
    }
}

async function loadAllocations() {
    try {
        // Mock allocations data - in development mode
        const mockAllocations = [
            {
                id: '1',
                student_name: 'John Doe',
                room_number: '101',
                academic_year: '2023/2024',
                semester: 'Fall',
                status: 'Active'
            },
            {
                id: '2',
                student_name: 'Jane Smith',
                room_number: '102',
                academic_year: '2023/2024',
                semester: 'Fall',
                status: 'Active'
            }
        ];

        displayAllocations(mockAllocations);
    } catch (error) {
        console.error('Error loading allocations:', error);
        showToast('Error loading allocations', 'error');
    }
}

function displayAllocations(allocations) {
    const container = document.getElementById('allocationsList');
    container.innerHTML = '';

    if (allocations.length === 0) {
        container.innerHTML = '<p class="no-data">No allocations found</p>';
        return;
    }

    allocations.forEach(allocation => {
        const allocationCard = createAllocationCard(allocation);
        container.appendChild(allocationCard);
    });
}

function createAllocationCard(allocation) {
    const card = document.createElement('div');
    card.className = 'allocation-card';
    card.innerHTML = `
        <div class="allocation-info">
            <h4>Room ${allocation.room_number || 'N/A'}</h4>
            <p><strong>Student:</strong> ${allocation.student_name || 'N/A'}</p>
            <p><strong>Academic Year:</strong> ${allocation.academic_year}</p>
            <p><strong>Semester:</strong> ${allocation.semester}</p>
            <p><strong>Status:</strong> <span class="status ${allocation.status}">${allocation.status}</span></p>
            <p><strong>Allocated:</strong> ${new Date(allocation.allocated_at).toLocaleDateString()}</p>
        </div>
        <div class="allocation-actions">
            <button class="btn btn-sm btn-info" onclick="viewAllocation('${allocation.id}')">
                <i class="fas fa-eye"></i> View
            </button>
            ${allocation.status === 'active' ? `
                <button class="btn btn-sm btn-danger" onclick="cancelAllocation('${allocation.id}')">
                    <i class="fas fa-times"></i> Cancel
                </button>
            ` : ''}
        </div>
    `;
    return card;
}

async function loadRoomOverview() {
    try {
        // Mock rooms data - in development mode
        const mockRooms = [
            { id: '1', room_number: '101', capacity: 2, occupied: 1 },
            { id: '2', room_number: '102', capacity: 2, occupied: 0 },
            { id: '3', room_number: '103', capacity: 1, occupied: 1 },
            { id: '4', room_number: '104', capacity: 2, occupied: 2 }
        ];

        displayRoomOverview(mockRooms);
    } catch (error) {
        console.error('Error loading room overview:', error);
        showToast('Error loading room overview', 'error');
    }
}

function displayRoomOverview(rooms) {
    const container = document.getElementById('roomOverview');
    container.innerHTML = '';

    rooms.forEach(room => {
        const roomCard = document.createElement('div');
        roomCard.className = `room-card ${room.occupied >= room.capacity ? 'full' : 'available'}`;
        roomCard.innerHTML = `
            <div class="room-number">Room ${room.room_number}</div>
            <div class="room-capacity">${room.occupied}/${room.capacity}</div>
            <div class="room-status">${room.occupied >= room.capacity ? 'Full' : 'Available'}</div>
        `;
        container.appendChild(roomCard);
    });
}

function filterAllocations() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const cards = document.querySelectorAll('.allocation-card');

    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const status = card.querySelector('.status').textContent.toLowerCase();
        const matchesSearch = text.includes(searchTerm);
        const matchesStatus = !statusFilter || status === statusFilter;

        card.style.display = matchesSearch && matchesStatus ? 'block' : 'none';
    });
}

async function viewAllocation(allocationId) {
    try {
        // Mock allocation details - in development mode
        const mockAllocation = {
            id: allocationId,
            student_name: 'John Doe',
            room_number: '101',
            academic_year: '2023/2024',
            semester: 'Fall',
            status: 'Active',
            allocated_by_name: 'Warden Smith'
        };

        showAllocationModal(mockAllocation);
    } catch (error) {
        console.error('Error viewing allocation:', error);
        showToast('Error viewing allocation', 'error');
    }
}

function showAllocationModal(allocation) {
    const modal = document.getElementById('allocationModal');
    const details = document.getElementById('allocationDetails');

    details.innerHTML = `
        <div class="allocation-detail">
            <p><strong>Allocation ID:</strong> ${allocation.id}</p>
            <p><strong>Student:</strong> ${allocation.student_name || 'N/A'}</p>
            <p><strong>Room:</strong> ${allocation.room_number || 'N/A'}</p>
            <p><strong>Academic Year:</strong> ${allocation.academic_year}</p>
            <p><strong>Semester:</strong> ${allocation.semester}</p>
            <p><strong>Status:</strong> ${allocation.status}</p>
            <p><strong>Allocated By:</strong> ${allocation.allocated_by_name || 'N/A'}</p>
            <p><strong>Allocated At:</strong> ${new Date(allocation.allocated_at).toLocaleString()}</p>
        </div>
    `;

    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('allocationModal').style.display = 'none';
}

async function cancelAllocation(allocationId) {
    if (!confirm('Are you sure you want to cancel this allocation?')) return;

    try {
        // Mock allocation cancellation - in development mode
        showToast('Allocation cancelled successfully! (Demo Mode)', 'success');
        loadAllocations();
        loadRoomOverview();
    } catch (error) {
        console.error('Error cancelling allocation:', error);
        showToast(error.message || 'Error cancelling allocation', 'error');
    }
}

function showToast(message, type = 'info') {
    // Assuming there's a toast system in place
    console.log(`${type.toUpperCase()}: ${message}`);
    // You can implement a proper toast notification system
}