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
            
            // Fetch real dashboard data
            const response = await adminAPI.getDashboardData();
            
            if (response.success) {
                this.metrics = response.data.metrics;
                this.renderMetrics();
            } else {
                throw new Error(response.message || 'Failed to load metrics');
            }
        } catch (error) {
            console.error('Failed to load metrics:', error);
            // Fallback to demo data if API fails
            this.loadDemoMetrics();
        }
    }

    /**
     * Load recent orders from API
     */
    async loadRecentOrders() {
        try {
            // Import API client dynamically
            const { adminAPI } = await import('../api/admin-api.js');
            
            // Fetch real dashboard data (includes recent orders)
            const response = await adminAPI.getDashboardData();
            
            if (response.success && response.data.recentOrders) {
                this.recentOrders = response.data.recentOrders;
                this.renderRecentOrders();
            } else {
                throw new Error('No recent orders data');
            }
        } catch (error) {
            console.error('Failed to load recent orders:', error);
            // Fallback to demo data if API fails
            this.loadDemoOrders();
        }
    }

    /**
     * Load alerts from API
     */
    async loadAlerts() {
        try {
            // Import API client dynamically
            const { adminAPI } = await import('../api/admin-api.js');
            
            // Fetch real dashboard data (includes alerts)
            const response = await adminAPI.getDashboardData();
            
            if (response.success && response.data.alerts) {
                this.renderAlerts(response.data.alerts);
            } else {
                // No alerts or failed to load
                this.renderAlerts([]);
            }
        } catch (error) {
            console.error('Failed to load alerts:', error);
            // Fallback to demo alerts if API fails
            this.loadDemoAlerts();
        }
    }

    /**
     * Fallback demo metrics
     */
    loadDemoMetrics() {
        console.log('📊 Loading demo metrics as fallback');
        this.metrics = {
            todayOrders: 24,
            todayRevenue: 4800,
            totalCustomers: 156,
            pendingOrders: 8,
            weeklyRevenue: 28500,
            monthlyRevenue: 125000,
            lowStockCount: 3,
            failedPayments: 2,
            ordersChange: 12.5,
            revenueChange: 8.3,
            customersChange: 5.2
        };
        this.renderMetrics();
    }

    /**
     * Fallback demo orders
     */
    loadDemoOrders() {
        console.log('📋 Loading demo orders as fallback');
        this.recentOrders = [
            {
                id: 'GD000123',
                customer: 'John Doe',
                amount: 250,
                status: 'confirmed',
                createdAt: new Date(Date.now() - 30 * 60 * 1000)
            },
            {
                id: 'GD000124',
                customer: 'Jane Smith',
                amount: 180,
                status: 'pending',
                createdAt: new Date(Date.now() - 45 * 60 * 1000)
            },
            {
                id: 'GD000125',
                customer: 'Mike Johnson',
                amount: 320,
                status: 'delivered',
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
            }
        ];
        this.renderRecentOrders();
    }

    /**
     * Fallback demo alerts
     */
    loadDemoAlerts() {
        console.log('🚨 Loading demo alerts as fallback');
        const demoAlerts = [
            {
                type: 'warning',
                title: 'Demo Mode',
                message: 'Admin portal is running in demo mode with sample data',
                time: new Date()
            },
            {
                type: 'info',
                title: 'Database Connection',
                message: 'Connect to database to see real-time data',
                time: new Date(Date.now() - 5 * 60 * 1000)
            }
        ];
        this.renderAlerts(demoAlerts);
    }

    /**
     * Render metrics cards
     */
    renderMetrics() {
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

        if (elements.todayOrders) elements.todayOrders.textContent = formatNumber(this.metrics.todayOrders);
        if (elements.todayRevenue) elements.todayRevenue.textContent = formatCurrency(this.metrics.todayRevenue);
        if (elements.totalCustomers) elements.totalCustomers.textContent = formatNumber(this.metrics.totalCustomers);
        if (elements.pendingOrders) elements.pendingOrders.textContent = formatNumber(this.metrics.pendingOrders);
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
    }

    /**
     * Render recent orders table
     */
    renderRecentOrders() {
        const tableBody = document.getElementById('recentOrdersTable');
        if (!tableBody) return;

        if (this.recentOrders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-8 text-gray-500">
                        No recent orders found
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = this.recentOrders.map(order => `
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
        `).join('');
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