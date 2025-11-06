// Authentication utilities for admin portal

import { CONFIG } from '../config/constants.js';

class AuthManager {
    constructor() {
        this.token = localStorage.getItem(CONFIG.TOKEN_KEY);
        this.refreshToken = localStorage.getItem(CONFIG.REFRESH_TOKEN_KEY);
        this.sessionTimer = null;
        this.adminInfo = null;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.token && !this.isTokenExpired();
    }

    /**
     * Get current admin token
     */
    getToken() {
        return this.token;
    }

    /**
     * Get admin information
     */
    getAdminInfo() {
        return this.adminInfo;
    }

    /**
     * Set authentication tokens and admin info
     */
    setAuth(token, refreshToken, adminInfo) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.adminInfo = adminInfo;
        
        localStorage.setItem(CONFIG.TOKEN_KEY, token);
        if (refreshToken) {
            localStorage.setItem(CONFIG.REFRESH_TOKEN_KEY, refreshToken);
        }
        
        this.startSessionTimer();
    }

    /**
     * Clear authentication data
     */
    clearAuth() {
        this.token = null;
        this.refreshToken = null;
        this.adminInfo = null;
        
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.REFRESH_TOKEN_KEY);
        
        this.clearSessionTimer();
    }

    /**
     * Check if token is expired
     */
    isTokenExpired() {
        if (!this.token) return true;
        
        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp < currentTime;
        } catch (error) {
            console.error('Error parsing token:', error);
            return true;
        }
    }

    /**
     * Get authorization headers for API requests
     */
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Start session timeout timer
     */
    startSessionTimer() {
        this.clearSessionTimer();
        
        this.sessionTimer = setTimeout(() => {
            this.handleSessionTimeout();
        }, CONFIG.SESSION_TIMEOUT);
    }

    /**
     * Clear session timeout timer
     */
    clearSessionTimer() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
    }

    /**
     * Reset session timer (call on user activity)
     */
    resetSessionTimer() {
        if (this.isAuthenticated()) {
            this.startSessionTimer();
        }
    }

    /**
     * Handle session timeout
     */
    handleSessionTimeout() {
        this.clearAuth();
        this.redirectToLogin('Session expired. Please login again.');
    }

    /**
     * Redirect to login page
     */
    redirectToLogin(message = null) {
        if (message) {
            sessionStorage.setItem('loginMessage', message);
        }
        // Use relative path to ensure it works in all environments
        window.location.href = 'login.html';
    }

    /**
     * Refresh authentication token
     */
    async refreshAuthToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refreshToken: this.refreshToken
                })
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            this.setAuth(data.token, data.refreshToken, data.admin);
            
            return data.token;
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.clearAuth();
            this.redirectToLogin('Session expired. Please login again.');
            throw error;
        }
    }

    /**
     * Login with credentials
     */
    async login(email, password) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            this.setAuth(data.token, data.refreshToken, data.admin);
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            if (this.token) {
                await fetch(`${CONFIG.API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: this.getAuthHeaders()
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearAuth();
            this.redirectToLogin();
        }
    }

    /**
     * Validate current session
     */
    async validateSession() {
        if (!this.isAuthenticated()) {
            return false;
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/validate`, {
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.adminInfo = data.admin;
                this.resetSessionTimer();
                return true;
            } else {
                this.clearAuth();
                return false;
            }
        } catch (error) {
            console.error('Session validation error:', error);
            this.clearAuth();
            return false;
        }
    }

    /**
     * Check if admin has specific permission
     */
    hasPermission(permission) {
        if (!this.adminInfo || !this.adminInfo.permissions) {
            return false;
        }
        return this.adminInfo.permissions.includes(permission);
    }

    /**
     * Initialize authentication on page load
     */
    async initialize() {
        // Set up activity listeners to reset session timer
        this.setupActivityListeners();

        // Check for stored admin info (demo mode)
        const storedAdminInfo = localStorage.getItem('admin_info');
        if (storedAdminInfo) {
            try {
                this.adminInfo = JSON.parse(storedAdminInfo);
            } catch (error) {
                console.error('Failed to parse stored admin info:', error);
            }
        }

        // Validate existing session
        if (this.token) {
            // For demo mode, just check if token exists and admin info is available
            if (this.adminInfo) {
                this.startSessionTimer();
                return true;
            } else {
                this.clearAuth();
                this.redirectToLogin();
                return false;
            }
        } else {
            this.redirectToLogin();
            return false;
        }
    }

    /**
     * Set up user activity listeners
     */
    setupActivityListeners() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.resetSessionTimer();
            }, { passive: true });
        });
    }
}

// Create singleton instance
export const authManager = new AuthManager();

// Export for use in other modules
export default authManager;