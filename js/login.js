// login.js - Login page functionality for GaramDoodh

class LoginManager {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.googleBtn = document.getElementById('googleLoginBtn');
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupFormValidation();
    }

    bindEvents() {
        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Google login
        if (this.googleBtn) {
            this.googleBtn.addEventListener('click', (e) => this.handleGoogleLogin(e));
        }

        // Input focus effects
        document.querySelectorAll('.input-field').forEach(input => {
            input.addEventListener('focus', (e) => this.handleInputFocus(e));
            input.addEventListener('blur', (e) => this.handleInputBlur(e));
        });
    }

    setupFormValidation() {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        if (emailInput) {
            emailInput.addEventListener('input', (e) => this.validateEmail(e.target));
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => this.validatePassword(e.target));
        }
    }

    handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Validation
        if (!this.validateForm(email, password)) {
            return;
        }
        
        // Show loading state
        this.setButtonLoading(this.form.querySelector('button[type="submit"]'), true);
        
        // Simulate API call
        this.performLogin(email, password);
    }

    handleGoogleLogin(e) {
        e.preventDefault();
        
        this.setButtonLoading(this.googleBtn, true);
        this.showNotification('Redirecting to Google...', 'info');
        
        // Simulate Google OAuth
        setTimeout(() => {
            this.showNotification('Google login successful!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }, 2000);
    }

    validateForm(email, password) {
        if (!email || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return false;
        }
        
        if (!this.isValidEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return false;
        }
        
        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters', 'error');
            return false;
        }
        
        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validateEmail(input) {
        const isValid = this.isValidEmail(input.value);
        this.updateInputState(input, isValid);
        return isValid;
    }

    validatePassword(input) {
        const isValid = input.value.length >= 6;
        this.updateInputState(input, isValid);
        return isValid;
    }

    updateInputState(input, isValid) {
        if (input.value.length > 0) {
            input.classList.toggle('border-red-500', !isValid);
            input.classList.toggle('border-green-500', isValid);
        }
    }

    handleInputFocus(e) {
        e.target.parentElement.classList.add('ring-2', 'ring-primary', 'ring-opacity-20');
    }

    handleInputBlur(e) {
        e.target.parentElement.classList.remove('ring-2', 'ring-primary', 'ring-opacity-20');
    }

    async performLogin(email, password) {
        try {
            this.showNotification('Logging in...', 'info');
            
            // Use backend API call
            const response = await this.callLoginAPI(email, password);
            
            if (response.success) {
                this.showNotification('Login successful! Redirecting...', 'success');
                
                // Store user data using the auth manager format
                localStorage.setItem('garamdoodh_user', JSON.stringify(response.user));
                localStorage.setItem('garamdoodh_token', response.token);
                
                // Check for return URL
                const returnUrl = localStorage.getItem('garamdoodh_return_url');
                const redirectUrl = returnUrl || 'index.html';
                
                // Clear return URL
                if (returnUrl) {
                    localStorage.removeItem('garamdoodh_return_url');
                }
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1500);
            } else {
                this.showNotification(response.message || 'Login failed', 'error');
            }
        } catch (error) {
            this.showNotification('An error occurred. Please try again.', 'error');
        } finally {
            this.setButtonLoading(this.form.querySelector('button[type="submit"]'), false);
        }
    }

    // API call to backend
    async callLoginAPI(email, password) {
        try {
            const response = await fetch('/.netlify/functions/auth-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                return {
                    success: true,
                    user: data.data.user,
                    token: data.data.token
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Login failed'
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Network error. Please try again.'
            };
        }
    }

    // Simulate API call - fallback for testing
    async simulateApiCall(email, password) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate successful login
                resolve({
                    success: true,
                    user: {
                        id: 1,
                        email: email,
                        name: email.split('@')[0] // Use email prefix as name
                    },
                    token: 'mock-jwt-token-' + Date.now()
                });
            }, 2000);
        });
    }

    // Actual API call implementation (uncomment and modify as needed)
    /*
    async performLogin(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                this.showNotification('Login successful!', 'success');
                window.location.href = 'index.html';
            } else {
                this.showNotification(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            this.showNotification('Network error. Please try again.', 'error');
        } finally {
            this.setButtonLoading(this.form.querySelector('button[type="submit"]'), false);
        }
    }
    */

    setButtonLoading(button, loading = true) {
        if (!button) return;
        
        if (loading) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Loading...';
        } else {
            button.disabled = false;
            if (button.id === 'googleLoginBtn') {
                button.innerHTML = `
                    <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                `;
            } else {
                button.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Sign In';
            }
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transform transition-all duration-300 translate-x-full`;
        
        // Set colors based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#4F46E5'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// Initialize login manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoginManager;
}
