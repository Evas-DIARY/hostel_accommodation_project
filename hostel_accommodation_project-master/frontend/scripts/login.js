// Login Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Clear redirect flag
    sessionStorage.removeItem('redirecting');
    
    // Sign out any existing user when landing on login page
    if (window.firebaseAuth && window.firebaseAuth.currentUser) {
        const { signOut } = window.firebaseFunctions;
        signOut(window.firebaseAuth).catch(() => {});
    }
    
    // Initialize auth manager
    authManager.init();

    // Setup form validation
    setupFormValidation();
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon && savedTheme === 'dark') {
        themeIcon.className = 'fas fa-sun';
    }
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

    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!identifier || !password) {
        showToast('Please enter your email/ID and password.', 'error');
        return;
    }

    showLoading(true);

    try {
        const result = await authManager.signIn(identifier, password);
        
        if (result.success) {
            showToast('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1000);
        } else {
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

    const name = document.getElementById('registerName').value.trim();
    const regNo = document.getElementById('registerRegNo').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const gender = document.getElementById('registerGender').value;
    const course = document.getElementById('registerCourse').value.trim();
    const roleElement = document.querySelector('input[name="registerRole"]:checked');
    const role = roleElement ? roleElement.value : 'student';
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters long.', 'error');
        return;
    }

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
            gender: gender,
            role: role,
            registration_number: regNo,
            program: course,
            created_at: new Date()
        };

        const result = await authManager.signUp(email, password, userData);

        if (result.success) {
            showToast('Account created successfully! Please login with your 6-digit ID and password.', 'success');

            setTimeout(() => {
                switchTab('login');
                document.getElementById('loginIdentifier').value = regNo;
            }, 2000);

        } else {
            showToast(result.error || 'Registration failed. Please try again.', 'error');
        }

    } catch (error) {
        console.error('Registration error:', error);
        showToast('An error occurred during registration. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Redirect to appropriate dashboard
function redirectToDashboard() {
    window.location.href = '../index.html';
}

// Show forgot password
function showForgotPassword() {
    showToast('Password reset functionality coming soon. Please contact administrator.', 'info');
}

// Form validation setup
function setupFormValidation() {
    const identifierInput = document.getElementById('loginIdentifier');
    if (identifierInput) {
        identifierInput.addEventListener('blur', function() {
            const val = this.value.trim();
            if (val && !isValidEmail(val) && !/^\d{6}$/.test(val)) {
                this.classList.add('error');
                showFieldError(this, 'Please enter a valid email address or 6-digit ID');
            } else {
                this.classList.remove('error');
                hideFieldError(this);
            }
        });
    }

    const emailInputs = document.querySelectorAll('#registerEmail');
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
    hideFieldError(input);
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
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Theme Toggle
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}
