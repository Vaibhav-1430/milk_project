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
            console.log('🔍 Validating admin session with database...');
            
            const response = await fetch(`/.netlify/functions/admin-validate`, {
                headers: this.getAuthHeaders()
            });

            console.log('📡 Validation response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('📋 Validation response data:', data);
                
                if (data.success) {
                    this.adminInfo = data.admin;
                    this.resetSessionTimer();
                    console.log('✅ Admin session validated:', data.admin.email);
                    return true;
                } else {
                    console.log('❌ Session validation failed:', data.message);
                    return false; // Don't clear auth immediately, let the fallback handle it
                }
            } else {
                console.log('❌ Session validation request failed:', response.status);
                const errorText = await response.text();
                console.log('❌ Error response:', errorText);
                return false; // Don't clear auth immediately, let the fallback handle it
            }
        } catch (error) {
            console.error('❌ Session validation error:', error);
            return false; // Don't clear auth immediately, let the fallback handle it
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

        console.log('🔍 Initializing authentication...');
        console.log('Token exists:', !!this.token);

        // Check for stored admin info
        const storedAdminInfo = localStorage.getItem('admin_info');
        if (storedAdminInfo) {
            try {
                this.adminInfo = JSON.parse(storedAdminInfo);
                console.log('✅ Admin info loaded:', this.adminInfo.email);
            } catch (error) {
                console.error('Failed to parse stored admin info:', error);
                this.clearAuth();
                this.redirectToLogin('Invalid session data. Please login again.');
                return false;
            }
        }

        // Check if we have both token and admin info
        if (this.token && this.adminInfo) {
            console.log('🔑 Token and admin info found, checking expiration...');
            
            // First check if token is expired before making any API calls
            if (this.isTokenExpired()) {
                console.log('❌ Token is expired');
                this.clearAuth();
                this.redirectToLogin('Your session has expired. Please login again.');
                return false;
            }
            
            console.log('✅ Token is not expired, validating with server...');
            
            // Try to validate session, but don't fail if validation endpoint has issues
            try {
                const isValid = await this.validateSession();
                if (isValid) {
                    console.log('✅ Session validation successful');
                    this.startSessionTimer();
                    return true;
                } else {
                    console.log('❌ Session validation failed, but checking token format...');
                    
                    // If validation fails, check if it's just a validation endpoint issue
                    // by checking if the token looks valid (JWT format)
                    if (this.isTokenFormatValid() && !this.isTokenExpired()) {
                        console.log('⚠️ Token format is valid and not expired, proceeding without validation');
                        this.startSessionTimer();
                        return true;
                    } else {
                        console.log('❌ Token format is invalid or expired');
                        this.clearAuth();
                        this.redirectToLogin('Session expired. Please login again.');
                        return false;
                    }
                }
            } catch (error) {
                console.error('❌ Session validation error:', error);
                
                // If validation endpoint fails, check token format as fallback
                if (this.isTokenFormatValid() && !this.isTokenExpired()) {
                    console.log('⚠️ Validation endpoint failed, but token format is valid and not expired. Proceeding...');
                    this.startSessionTimer();
                    return true;
                } else {
                    this.clearAuth();
                    this.redirectToLogin('Authentication error. Please login again.');
                    return false;
                }
            }
        } else {
            console.log('❌ Missing token or admin info');
            this.redirectToLogin('Please login to access the admin portal.');
            return false;
        }
    }

    /**
     * Check if token has valid JWT format
     */
    isTokenFormatValid() {
        if (!this.token) return false;
        
        try {
            // JWT tokens have 3 parts separated by dots
            const parts = this.token.split('.');
            if (parts.length !== 3) return false;
            
            // Try to decode the payload (middle part)
            const payload = JSON.parse(atob(parts[1]));
            
            // Check if it has required fields and is not expired
            const hasRequiredFields = payload.userId && payload.exp && payload.iat;
            const currentTime = Date.now() / 1000;
            const isNotExpired = payload.exp > currentTime;
            
            return hasRequiredFields && isNotExpired;
        } catch (error) {
            console.error('Token format validation error:', error);
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