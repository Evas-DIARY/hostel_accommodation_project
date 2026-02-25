// Login Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize auth manager
    authManager.init();

    // Check if user is already logged in
    if (authManager.isAuthenticated()) {
        redirectToDashboard();
        return;
    }

    // Setup form validation
    setupFormValidation();
});

// Tab switching functionality
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.add('hidden'));

    document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
    document.getElementById(`${tab}Form`).classList.remove('hidden');
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();

    const identifier = document.getElementById('loginIdentifier').value;
    const password = document.getElementById('loginPassword').value;

    // Show loading
    showLoading(true);

    try {
        // Attempt login
        const result = await authManager.signIn(identifier, password);

        if (result.success) {
            // Get user profile
            const profile = await authManager.getUserProfile(result.user.uid);

            if (!profile) {
                showToast('User profile not found. Please contact administrator.', 'error');
                await authManager.signOut();
                return;
            }

            showToast(`Welcome back, ${profile.full_name || profile.name || 'User'}!`, 'success');

            // Redirect to appropriate dashboard after a short delay
            setTimeout(() => {
                redirectToDashboard();
            }, 1500);

        } else {
            console.error('Login failed:', result.error);
            showToast(result.error || 'Login failed. Please check your credentials.', 'error');
        }

    } catch (error) {
        console.error('Login error:', error);
        showToast('An error occurred during login. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle registration form submission
async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('registerName').value;
    const regNo = document.getElementById('registerRegNo').value;
    const email = document.getElementById('registerEmail').value;
    const roleElement = document.querySelector('input[name="registerRole"]:checked');
    const role = roleElement ? roleElement.value : 'student';
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    // Validate passwords match
    if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
    }

    // Validate password strength
    if (password.length < 6) {
        showToast('Password must be at least 6 characters long.', 'error');
        return;
    }

    // Validate 6-digit registration number
    if (!/^\d{6}$/.test(regNo)) {
        showToast('Registration number must be exactly 6 digits.', 'error');
        return;
    }

    showLoading(true);

    try {
        const userData = {
            name: name,
            full_name: name,
            email: email,
            role: role,
            registration_number: regNo,
            created_at: new Date()
        };

        const result = await authManager.signUp(email, password, userData);

        if (result.success) {
            showToast('Account created successfully! Please login with your 6-digit ID and password.', 'success');

            // Redirect to login tab after 2 seconds
            setTimeout(() => {
                switchTab('login');
                // Pre-fill the registration number
                document.getElementById('loginIdentifier').value = regNo;
            }, 2000);

        } else {
            showToast(result.error || 'Registration failed. Please try again.', 'error');
        }

    } catch (error) {
        console.error('Registration error in handleRegister:', error);
        showToast('An error occurred during registration. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Redirect to appropriate dashboard based on user role
function redirectToDashboard() {
    // Redirect to main application
    window.location.href = '../index.html';
}

// Show forgot password modal/form
function showForgotPassword() {
    showToast('Password reset functionality coming soon. Please contact administrator.', 'info');
}

// Form validation setup
function setupFormValidation() {
    // Real-time email validation
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value && !isValidEmail(this.value)) {
                this.classList.add('error');
                showFieldError(this, 'Please enter a valid email address');
            } else {
                this.classList.remove('error');
                hideFieldError(this);
            }
        });
    });

    // Password confirmation validation
    const confirmPassword = document.getElementById('registerConfirmPassword');
    if (confirmPassword) {
        confirmPassword.addEventListener('input', function() {
            const password = document.getElementById('registerPassword').value;
            if (this.value && this.value !== password) {
                this.classList.add('error');
                showFieldError(this, 'Passwords do not match');
            } else {
                this.classList.remove('error');
                hideFieldError(this);
            }
        });
    }
}

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showFieldError(input, message) {
    hideFieldError(input); // Remove existing error

    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;

    input.parentNode.appendChild(errorDiv);
}

function hideFieldError(input) {
    const existingError = input.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.style.display = 'flex';
    } else {
        overlay.style.display = 'none';
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    document.getElementById('toastContainer').appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}


// Theme Toggle Functionality
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    if (newTheme === 'dark') {
        themeIcon.className = 'fas fa-sun';
        themeText.textContent = 'Light';
    } else {
        themeIcon.className = 'fas fa-moon';
        themeText.textContent = 'Dark';
    }
}

// Load saved theme on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    if (savedTheme === 'dark') {
        themeIcon.className = 'fas fa-sun';
        themeText.textContent = 'Light';
    }
});
