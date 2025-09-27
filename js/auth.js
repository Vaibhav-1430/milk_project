// Authentication Manager for GaramDoodh
class AuthManager {
    constructor() {
        this.user = null;
        this.token = null;
        this.init();
    }

    init() {
        this.loadUserData();
        this.updateNavigation();
        this.bindEvents();
    }

    // Load user data from localStorage
    loadUserData() {
        const savedUser = localStorage.getItem('garamdoodh_user');
        const savedToken = localStorage.getItem('garamdoodh_token');
        
        if (savedUser && savedToken) {
            this.user = JSON.parse(savedUser);
            this.token = savedToken;
        }
    }

    // Save user data to localStorage
    saveUserData(user, token) {
        this.user = user;
        this.token = token;
        localStorage.setItem('garamdoodh_user', JSON.stringify(user));
        localStorage.setItem('garamdoodh_token', token);
        this.updateNavigation();
    }

    // Clear user data from localStorage
    clearUserData() {
        this.user = null;
        this.token = null;
        localStorage.removeItem('garamdoodh_user');
        localStorage.removeItem('garamdoodh_token');
        this.updateNavigation();
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.user && this.token;
    }

    // Get current user
    getCurrentUser() {
        return this.user;
    }

    // Get current token
    getCurrentToken() {
        return this.token;
    }

    // Update navigation based on login status
    updateNavigation() {
        const authContainer = document.getElementById('auth-container');
        if (!authContainer) return;

        if (this.isLoggedIn()) {
            // Show user menu with logout option
            authContainer.innerHTML = `
                <div class="user-menu">
                    <div class="user-info">
                        <i class="fas fa-user-circle"></i>
                        <span class="user-name">${this.user.name || this.user.email}</span>
                    </div>
                    <div class="user-dropdown">
                        <a href="#" class="dropdown-item" id="profile-link">
                            <i class="fas fa-user"></i> Profile
                        </a>
                        <a href="#" class="dropdown-item" id="orders-link">
                            <i class="fas fa-shopping-bag"></i> My Orders
                        </a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item logout-btn" id="logout-btn">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </a>
                    </div>
                </div>
            `;
        } else {
            // Show login button
            authContainer.innerHTML = `
                <a href="login.html" class="login-btn">
                    <i class="fas fa-sign-in-alt"></i> Login
                </a>
            `;
        }

        this.bindAuthEvents();
    }

    // Bind authentication-related events
    bindAuthEvents() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // User menu toggle
        const userInfo = document.querySelector('.user-info');
        const userDropdown = document.querySelector('.user-dropdown');
        
        if (userInfo && userDropdown) {
            userInfo.addEventListener('click', (e) => {
                e.preventDefault();
                userDropdown.classList.toggle('active');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!userInfo.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.remove('active');
                }
            });
        }
    }

    // Logout function
    logout() {
        // Show confirmation dialog
        if (confirm('Are you sure you want to logout?')) {
            // Clear user data
            this.clearUserData();
            
            // Clear cart data (optional - you might want to keep cart for guest users)
            // localStorage.removeItem('garamdoodhCart');
            
            // Show logout notification
            this.showNotification('Logged out successfully!', 'success');
            
            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.auth-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `auth-notification fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transform transition-all duration-300 translate-x-full`;
        
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

    // Bind general events
    bindEvents() {
        // Listen for storage changes (for multi-tab logout)
        window.addEventListener('storage', (e) => {
            if (e.key === 'garamdoodh_user' || e.key === 'garamdoodh_token') {
                this.loadUserData();
                this.updateNavigation();
            }
        });
    }

    // API call with authentication
    async apiCall(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, mergedOptions);
            
            // If unauthorized, logout user
            if (response.status === 401) {
                this.logout();
                throw new Error('Session expired. Please login again.');
            }
            
            return response;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }
}

// Initialize auth manager when DOM is loaded
let authManager;
document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
