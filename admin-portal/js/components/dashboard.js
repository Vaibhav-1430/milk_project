// Dashboard component for admin portal

import { CONFIG } from '../config/constants.js';
import authManager from '../utils/auth.js';
import { formatCurrency, formatNumber, formatRelativeTime } from '../utils/formatting.js';

export class Dashboard {
    constructor() {
        this.metrics = {};
        this.recentOrders = [];
        this.refreshInterval = null;
    }

    /**
     * Render the dashboard
     */
    async render() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        mainContent.innerHTML = this.getTemplate();
        
        // Load initial data
        await this.loadData();
        
        // Set up auto-refresh
        this.setupAutoRefresh();
    }

    /**
     * Get dashboard template
     */
    getTemplate() {
        return `
            <!-- Metrics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="metric-card">
                    <div class="metric-value" id="todayOrders">-</div>
                    <div class="metric-label">Today's Orders</div>
                    <div class="metric-change positive" id="ordersChange">-</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-value" id="todayRevenue">-</div>
                    <div class="metric-label">Today's Revenue</div>
                    <div class="metric-change positive" id="revenueChange">-</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-value" id="totalCustomers">-</div>
                    <div class="metric-label">Total Customers</div>
                    <div class="metric-change positive" id="customersChange">-</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-value" id="pendingOrders">-</div>
                    <div class="metric-label">Pending Orders</div>
                    <div class="metric-change" id="pendingChange">-</div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <!-- Recent Orders -->
                <div class="lg:col-span-2 admin-card">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">Recent Orders</h3>
                        <button class="btn-primary btn-sm" onclick="window.AdminApp.navigateTo('orders')">
                            View All Orders
                        </button>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody id="recentOrdersTable">
                                <tr>
                                    <td colspan="5" class="text-center py-8 text-gray-500">
                                        <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                        <div>Loading orders...</div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="admin-card">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                    
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <span class="text-gray-600">This Week</span>
                            <span class="font-semibold" id="weeklyRevenue">-</span>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <span class="text-gray-600">This Month</span>
                            <span class="font-semibold" id="monthlyRevenue">-</span>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <span class="text-gray-600">Low Stock Items</span>
                            <span class="font-semibold text-orange-600" id="lowStockCount">-</span>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <span class="text-gray-600">Failed Payments</span>
                            <span class="font-semibold text-red-600" id="failedPayments">-</span>
                        </div>
                    </div>

                    <div class="mt-6 pt-4 border-t border-gray-200">
                        <button class="btn-secondary w-full" onclick="window.AdminApp.navigateTo('analytics')">
                            <i class="fas fa-chart-bar mr-2"></i>
                            View Analytics
                        </button>
                    </div>
                </div>
            </div>

            <!-- Alerts Section -->
            <div class="admin-card">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                    <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
                    Alerts & Notifications
                </h3>
                
                <div id="alertsContainer">
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                        <div>Loading alerts...</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Load dashboard data
     */
    async loadData() {
        try {
            await Promise.all([
                this.loadMetrics(),
                this.loadRecentOrders(),
                this.loadAlerts()
            ]);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    /**
     * Load dashboard data from API
     */
    async loadMetrics() {
        try {
            // Import API client dynamically
            const { adminAPI } = await import('../api/admin-api.js');
            
            console.log('📊 Loading real-time dashboard metrics...');
            
            // Fetch real dashboard data
            const response = await adminAPI.getDashboardData();
            
            if (response.success) {
                this.metrics = response.data.metrics;
                this.renderMetrics();
                console.log('✅ Real-time metrics loaded successfully');
            } else {
                throw new Error(response.message || 'Failed to load metrics');
            }
        } catch (error) {
            console.error('❌ Failed to load metrics:', error);
            this.showError('Failed to load dashboard metrics. Please check your database connection.');
            // Show empty state instead of demo data
            this.renderEmptyMetrics();
        }
    }

    /**
     * Load recent orders from API
     */
    async loadRecentOrders() {
        try {
            // Import API client dynamically
            const { adminAPI } = await import('../api/admin-api.js');
            
            console.log('📋 Loading real-time recent orders...');
            
            // Fetch real dashboard data (includes recent orders)
            const response = await adminAPI.getDashboardData();
            
            if (response.success && response.data.recentOrders) {
                this.recentOrders = response.data.recentOrders;
                this.renderRecentOrders();
                console.log('✅ Recent orders loaded successfully:', this.recentOrders.length, 'orders');
            } else {
                console.log('ℹ️ No recent orders found');
                this.recentOrders = [];
                this.renderRecentOrders();
            }
        } catch (error) {
            console.error('❌ Failed to load recent orders:', error);
            this.showError('Failed to load recent orders. Please check your database connection.');
            this.recentOrders = [];
            this.renderRecentOrders();
        }
    }

    /**
     * Load alerts from API
     */
    async loadAlerts() {
        try {
            // Import API client dynamically
            const { adminAPI } = await import('../api/admin-api.js');
            
            console.log('🚨 Loading real-time alerts...');
            
            // Fetch real dashboard data (includes alerts)
            const response = await adminAPI.getDashboardData();
            
            if (response.success && response.data.alerts) {
                this.renderAlerts(response.data.alerts);
                console.log('✅ Alerts loaded successfully:', response.data.alerts.length, 'alerts');
            } else {
                console.log('ℹ️ No alerts found');
                this.renderAlerts([]);
            }
        } catch (error) {
            console.error('❌ Failed to load alerts:', error);
            this.renderAlerts([]);
        }
    }

    /**
     * Render empty metrics state
     */
    renderEmptyMetrics() {
        this.metrics = {
            todayOrders: 0,
            todayRevenue: 0,
            totalCustomers: 0,
            pendingOrders: 0,
            weeklyRevenue: 0,
            monthlyRevenue: 0,
            lowStockCount: 0,
            failedPayments: 0,
            ordersChange: 0,
            revenueChange: 0,
            customersChange: 0
        };
        this.renderMetrics();
    }

    /**
     * Render metrics cards
     */
    renderMetrics() {
        console.log('🎨 Rendering metrics:', this.metrics);
        
        const elements = {
            todayOrders: document.getElementById('todayOrders'),
            todayRevenue: document.getElementById('todayRevenue'),
            totalCustomers: document.getElementById('totalCustomers'),
            pendingOrders: document.getElementById('pendingOrders'),
            weeklyRevenue: document.getElementById('weeklyRevenue'),
            monthlyRevenue: document.getElementById('monthlyRevenue'),
            lowStockCount: document.getElementById('lowStockCount'),
            failedPayments: document.getElementById('failedPayments'),
            ordersChange: document.getElementById('ordersChange'),
            revenueChange: document.getElementById('revenueChange'),
            customersChange: document.getElementById('customersChange')
        };

        // Check if elements exist
        Object.keys(elements).forEach(key => {
            if (!elements[key]) {
                console.warn(`❌ Element not found: ${key}`);
            }
        });

        if (elements.todayOrders) {
            elements.todayOrders.textContent = formatNumber(this.metrics.todayOrders);
            console.log('✅ Updated todayOrders:', this.metrics.todayOrders);
        }
        if (elements.todayRevenue) {
            elements.todayRevenue.textContent = formatCurrency(this.metrics.todayRevenue);
            console.log('✅ Updated todayRevenue:', this.metrics.todayRevenue);
        }
        if (elements.totalCustomers) {
            elements.totalCustomers.textContent = formatNumber(this.metrics.totalCustomers);
            console.log('✅ Updated totalCustomers:', this.metrics.totalCustomers);
        }
        if (elements.pendingOrders) {
            elements.pendingOrders.textContent = formatNumber(this.metrics.pendingOrders);
            console.log('✅ Updated pendingOrders:', this.metrics.pendingOrders);
        }
        if (elements.weeklyRevenue) elements.weeklyRevenue.textContent = formatCurrency(this.metrics.weeklyRevenue);
        if (elements.monthlyRevenue) elements.monthlyRevenue.textContent = formatCurrency(this.metrics.monthlyRevenue);
        if (elements.lowStockCount) elements.lowStockCount.textContent = formatNumber(this.metrics.lowStockCount);
        if (elements.failedPayments) elements.failedPayments.textContent = formatNumber(this.metrics.failedPayments);

        // Update change indicators
        if (elements.ordersChange) {
            elements.ordersChange.textContent = `+${this.metrics.ordersChange}%`;
            elements.ordersChange.className = 'metric-change positive';
        }
        if (elements.revenueChange) {
            elements.revenueChange.textContent = `+${this.metrics.revenueChange}%`;
            elements.revenueChange.className = 'metric-change positive';
        }
        if (elements.customersChange) {
            elements.customersChange.textContent = `+${this.metrics.customersChange}%`;
            elements.customersChange.className = 'metric-change positive';
        }
        
        console.log('✅ Metrics rendering complete');
    }

    /**
     * Render recent orders table
     */
    renderRecentOrders() {
        console.log('📋 Rendering recent orders:', this.recentOrders);
        
        const tableBody = document.getElementById('recentOrdersTable');
        if (!tableBody) {
            console.error('❌ recentOrdersTable element not found');
            return;
        }

        if (this.recentOrders.length === 0) {
            console.log('ℹ️ No recent orders to display');
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-8 text-gray-500">
                        No recent orders found
                    </td>
                </tr>
            `;
            return;
        }

        console.log(`✅ Rendering ${this.recentOrders.length} recent orders`);
        
        tableBody.innerHTML = this.recentOrders.map(order => {
            console.log('📋 Rendering order:', order);
            return `
                <tr class="hover:bg-gray-50">
                    <td class="font-medium">${order.id}</td>
                    <td>${order.customer}</td>
                    <td>${formatCurrency(order.amount)}</td>
                    <td>
                        <span class="status-badge status-${order.status}">
                            ${this.formatStatus(order.status)}
                        </span>
                    </td>
                    <td class="text-gray-500">${formatRelativeTime(order.createdAt)}</td>
                </tr>
            `;
        }).join('');
        
        console.log('✅ Recent orders rendering complete');
    }

    /**
     * Render alerts
     */
    renderAlerts(alerts) {
        const container = document.getElementById('alertsContainer');
        if (!container) return;

        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-check-circle text-green-500 text-2xl mb-2"></i>
                    <div>No alerts at this time</div>
                </div>
            `;
            return;
        }

        container.innerHTML = alerts.map(alert => {
            const iconMap = {
                error: 'fas fa-exclamation-circle text-red-500',
                warning: 'fas fa-exclamation-triangle text-yellow-500',
                info: 'fas fa-info-circle text-blue-500'
            };

            return `
                <div class="flex items-start p-4 border border-gray-200 rounded-lg mb-3 bg-gray-50">
                    <div class="flex-shrink-0 mr-3">
                        <i class="${iconMap[alert.type]}"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-medium text-gray-900">${alert.title}</h4>
                        <p class="text-gray-600 text-sm">${alert.message}</p>
                        <p class="text-gray-400 text-xs mt-1">${formatRelativeTime(alert.time)}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Format order status
     */
    formatStatus(status) {
        const statusMap = {
            pending: 'Pending',
            confirmed: 'Confirmed',
            preparing: 'Preparing',
            delivered: 'Delivered',
            cancelled: 'Cancelled'
        };
        return statusMap[status] || status;
    }

    /**
     * Set up auto-refresh
     */
    setupAutoRefresh() {
        // Refresh data every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.refresh();
        }, CONFIG.REFRESH_INTERVAL);
    }

    /**
     * Refresh dashboard data
     */
    async refresh() {
        try {
            await this.loadData();
        } catch (error) {
            console.error('Failed to refresh dashboard:', error);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        // This would typically show a toast notification
        console.error(message);
    }

    /**
     * Cleanup when component is destroyed
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
}