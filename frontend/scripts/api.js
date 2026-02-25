// API Communication Module
class APIManager {
    constructor() {
        this.baseURL = '/api'; // Relative URL since frontend is served from same server
        this.init();
    }

    init() {
        // Set up interceptors for authentication
        this.setupInterceptors();
    }

    setupInterceptors() {
        // Add auth token to requests
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            const token = await authManager.getIdToken();
            if (token) {
                options.headers = {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
            }
            return originalFetch(url, options);
        };
    }

    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `${this.baseURL}${endpoint}${queryString ? '?' + queryString : ''}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return this.handleResponse(response);
    }

    async post(endpoint, data = {}) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    }

    async put(endpoint, data = {}) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    }

    async delete(endpoint) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return this.handleResponse(response);
    }

    async handleResponse(response) {
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Network error' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }
        return response.json();
    }

    // Application endpoints
    async submitApplication(applicationData) {
        return this.post('/applications/', applicationData);
    }

    async getApplicationStatus(userId) {
        return this.get(`/applications/user/${userId}`);
    }

    async getApplications(filters = {}) {
        return this.get('/applications/', filters);
    }

    async updateApplicationStatus(applicationId, status) {
        return this.put(`/applications/${applicationId}`, { status });
    }

    // Room endpoints
    async getRooms(filters = {}) {
        return this.get('/rooms/', filters);
    }

    async getRoom(roomId) {
        return this.get(`/rooms/${roomId}`);
    }

    // Allocation endpoints
    async getAllocations(filters = {}) {
        return this.get('/allocations/', filters);
    }

    async createAllocation(allocationData) {
        return this.post('/allocations/', allocationData);
    }

    async updateAllocation(allocationId, data) {
        return this.put(`/allocations/${allocationId}`, data);
    }

    // User endpoints
    async getUsers(filters = {}) {
        return this.get('/users/', filters);
    }

    async getUser(userId) {
        return this.get(`/users/${userId}`);
    }

    // Reports endpoints
    async getReports(type, filters = {}) {
        return this.get(`/reports/${type}`, filters);
    }

    // Health check
    async healthCheck() {
        return this.get('/health/');
    }
}

// Initialize API manager
const apiManager = new APIManager();