// Admin API client for real-time data

import { CONFIG } from '../config/constants.js';
import authManager from '../utils/auth.js';

class AdminAPI {
    constructor() {
        this.baseURL = CONFIG.API_ADMIN_URL;
    }

    /**
     * Make authenticated API request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = authManager.getToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            },
            ...options
        };

        try {
            console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
            
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            console.log(`✅ API Response: ${endpoint}`, data);
            return data;
        } catch (error) {
            console.error(`❌ API Error: ${endpoint}`, error);
            
            // Handle authentication errors
            if (error.message.includes('Unauthorized') || error.message.includes('401')) {
                authManager.clearAuth();
                authManager.redirectToLogin('Session expired. Please login again.');
                return;
            }
            
            throw error;
        }
    }

    // Dashboard APIs
    async getDashboardData() {
        return this.request('/admin-dashboard');
    }

    // Order APIs
    async getOrders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/admin-orders${queryString ? `?${queryString}` : ''}`);
    }

    async getOrder(orderId) {
        return this.request(`/orders/${orderId}`);
    }

    async updateOrder(orderId, updates) {
        return this.request(`/orders/${orderId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    async bulkUpdateOrders(orderIds, updates) {
        return this.request('/orders/bulk', {
            method: 'POST',
            body: JSON.stringify({ orderIds, updates })
        });
    }

    // Product APIs
    async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/admin-products${queryString ? `?${queryString}` : ''}`);
    }

    async getProduct(productId) {
        return this.request(`/products/${productId}`);
    }

    async createProduct(productData) {
        return this.request('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    async updateProduct(productId, updates) {
        return this.request(`/products/${productId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    async deleteProduct(productId) {
        return this.request(`/products/${productId}`, {
            method: 'DELETE'
        });
    }

    // Customer APIs
    async getCustomers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/admin-customers${queryString ? `?${queryString}` : ''}`);
    }

    async getCustomer(customerId) {
        return this.request(`/admin-customers?customerId=${customerId}`);
    }

    async updateCustomer(customerId, updates) {
        return this.request(`/customers/${customerId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    // Analytics APIs
    async getAnalytics(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/analytics${queryString ? `?${queryString}` : ''}`);
    }

    async getRevenueData(period = 'month') {
        return this.request(`/analytics/revenue?period=${period}`);
    }

    async getProductPerformance() {
        return this.request('/analytics/products');
    }

    async getCustomerAnalytics() {
        return this.request('/analytics/customers');
    }

    // Settings APIs
    async getSettings() {
        return this.request('/settings');
    }

    async updateSettings(settings) {
        return this.request('/settings', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }

    // Notification APIs
    async getNotifications() {
        return this.request('/notifications');
    }

    async markNotificationRead(notificationId) {
        return this.request(`/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
    }

    // Export APIs
    async exportOrders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/export/orders${queryString ? `?${queryString}` : ''}`, {
            headers: {
                'Accept': 'text/csv'
            }
        });
    }

    async exportCustomers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/export/customers${queryString ? `?${queryString}` : ''}`, {
            headers: {
                'Accept': 'text/csv'
            }
        });
    }

    async exportProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/export/products${queryString ? `?${queryString}` : ''}`, {
            headers: {
                'Accept': 'text/csv'
            }
        });
    }
}

// Create singleton instance
export const adminAPI = new AdminAPI();
export default adminAPI;