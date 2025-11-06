// Orders component for admin portal

import { formatCurrency, formatDate, formatRelativeTime, formatOrderStatus } from '../utils/formatting.js';

export class Orders {
    constructor() {
        this.orders = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.filters = {};
        this.selectedOrders = new Set();
    }

    /**
     * Render the orders page
     */
    async render() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        mainContent.innerHTML = this.getTemplate();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadOrders();
    }

    /**
     * Get orders template
     */
    getTemplate() {
        return `
            <!-- Orders Header -->
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Orders Management</h2>
                    <p class="text-gray-600">Manage customer orders and track deliveries</p>
                </div>
                <div class="flex space-x-3">
                    <button id="exportOrdersBtn" class="btn-secondary">
                        <i class="fas fa-download mr-2"></i>Export
                    </button>
                    <button id="refreshOrdersBtn" class="btn-primary">
                        <i class="fas fa-sync-alt mr-2"></i>Refresh
                    </button>
                </div>
            </div>

            <!-- Filters -->
            <div class="admin-card mb-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label class="form-label">Status</label>
                        <select id="statusFilter" class="form-select">
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Customer Type</label>
                        <select id="customerTypeFilter" class="form-select">
                            <option value="">All Types</option>
                            <option value="college">College</option>
                            <option value="outsider">Outsider</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Payment Status</label>
                        <select id="paymentStatusFilter" class="form-select">
                            <option value="">All Payments</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Search</label>
                        <input type="text" id="searchFilter" class="form-input" placeholder="Order #, customer name...">
                    </div>
                </div>
                <div class="mt-4 flex justify-between items-center">
                    <button id="applyFiltersBtn" class="btn-primary">Apply Filters</button>
                    <button id="clearFiltersBtn" class="btn-secondary">Clear Filters</button>
                </div>
            </div>

            <!-- Bulk Actions -->
            <div id="bulkActionsBar" class="admin-card mb-4 hidden">
                <div class="flex items-center justify-between">
                    <span id="selectedCount" class="text-gray-600">0 orders selected</span>
                    <div class="flex space-x-2">
                        <select id="bulkStatusUpdate" class="form-select">
                            <option value="">Update Status</option>
                            <option value="confirmed">Mark as Confirmed</option>
                            <option value="preparing">Mark as Preparing</option>
                            <option value="out_for_delivery">Mark as Out for Delivery</option>
                            <option value="delivered">Mark as Delivered</option>
                            <option value="cancelled">Mark as Cancelled</option>
                        </select>
                        <button id="applyBulkUpdate" class="btn-primary">Apply</button>
                    </div>
                </div>
            </div>

            <!-- Orders Table -->
            <div class="admin-card">
                <div class="overflow-x-auto">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>
                                    <input type="checkbox" id="selectAllOrders" class="rounded">
                                </th>
                                <th>Order #</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Payment</th>
                                <th>Delivery Date</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="ordersTableBody">
                            <tr>
                                <td colspan="10" class="text-center py-8">
                                    <i class="fas fa-spinner fa-spin text-2xl text-gray-400 mb-2"></i>
                                    <div class="text-gray-500">Loading orders...</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div id="ordersPagination" class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <div class="text-sm text-gray-600">
                        Showing <span id="ordersRange">0</span> orders
                    </div>
                    <div class="flex space-x-2">
                        <button id="prevPageBtn" class="btn-secondary btn-sm" disabled>Previous</button>
                        <span id="pageInfo" class="px-3 py-1 text-sm text-gray-600">Page 1 of 1</span>
                        <button id="nextPageBtn" class="btn-secondary btn-sm" disabled>Next</button>
                    </div>
                </div>
            </div>

            <!-- Order Details Modal -->
            <div id="orderDetailsModal" class="modal-overlay hidden">
                <div class="modal-container">
                    <div class="modal-header">
                        <h3 class="modal-title">Order Details</h3>
                        <button class="modal-close" id="closeOrderModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body" id="orderDetailsContent">
                        <!-- Order details will be loaded here -->
                    </div>
                    <div class="modal-footer">
                        <button id="closeOrderModalBtn" class="btn-secondary">Close</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Filter buttons
        document.getElementById('applyFiltersBtn').addEventListener('click', () => this.applyFilters());
        document.getElementById('clearFiltersBtn').addEventListener('click', () => this.clearFilters());
        
        // Refresh button
        document.getElementById('refreshOrdersBtn').addEventListener('click', () => this.loadOrders());
        
        // Export button
        document.getElementById('exportOrdersBtn').addEventListener('click', () => this.exportOrders());
        
        // Pagination
        document.getElementById('prevPageBtn').addEventListener('click', () => this.previousPage());
        document.getElementById('nextPageBtn').addEventListener('click', () => this.nextPage());
        
        // Select all checkbox
        document.getElementById('selectAllOrders').addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        
        // Bulk actions
        document.getElementById('applyBulkUpdate').addEventListener('click', () => this.applyBulkUpdate());
        
        // Modal close
        document.getElementById('closeOrderModal').addEventListener('click', () => this.closeOrderModal());
        document.getElementById('closeOrderModalBtn').addEventListener('click', () => this.closeOrderModal());
    }

    /**
     * Load orders from API
     */
    async loadOrders() {
        try {
            // Import API client dynamically
            const { adminAPI } = await import('../api/admin-api.js');
            
            const params = {
                page: this.currentPage,
                limit: 20,
                ...this.filters
            };
            
            const response = await adminAPI.getOrders(params);
            
            if (response.success) {
                this.orders = response.data.orders;
                this.updatePagination(response.data.pagination);
                this.renderOrders();
            } else {
                throw new Error(response.message || 'Failed to load orders');
            }
        } catch (error) {
            console.error('Failed to load orders:', error);
            this.showError('Failed to load orders. Please try again.');
        }
    }

    /**
     * Render orders table
     */
    renderOrders() {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        if (this.orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center py-8 text-gray-500">
                        <i class="fas fa-inbox text-2xl mb-2"></i>
                        <div>No orders found</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.orders.map(order => `
            <tr class="hover:bg-gray-50">
                <td>
                    <input type="checkbox" class="order-checkbox rounded" data-order-id="${order._id}">
                </td>
                <td class="font-medium">${order.orderNumber}</td>
                <td>
                    <div>
                        <div class="font-medium">${order.customer.name}</div>
                        <div class="text-sm text-gray-500">${order.customer.email}</div>
                    </div>
                </td>
                <td>
                    <div class="text-sm">
                        ${order.items.slice(0, 2).map(item => `${item.name} x${item.quantity}`).join(', ')}
                        ${order.items.length > 2 ? `... +${order.items.length - 2} more` : ''}
                    </div>
                </td>
                <td class="font-medium">${formatCurrency(order.pricing.total)}</td>
                <td>
                    <span class="status-badge status-${order.status}">
                        ${formatOrderStatus(order.status)}
                    </span>
                </td>
                <td>
                    <span class="status-badge status-${order.payment.status}">
                        ${order.payment.status}
                    </span>
                </td>
                <td>${formatDate(order.delivery.date)}</td>
                <td class="text-gray-500">${formatRelativeTime(order.createdAt)}</td>
                <td>
                    <div class="flex space-x-2">
                        <button class="text-blue-600 hover:text-blue-800" onclick="window.ordersComponent.viewOrder('${order._id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="text-green-600 hover:text-green-800" onclick="window.ordersComponent.updateOrderStatus('${order._id}', 'delivered')">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Add event listeners for checkboxes
        document.querySelectorAll('.order-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateSelection());
        });

        // Store reference for global access
        window.ordersComponent = this;
    }

    /**
     * Apply filters
     */
    applyFilters() {
        this.filters = {
            status: document.getElementById('statusFilter').value,
            customerType: document.getElementById('customerTypeFilter').value,
            paymentStatus: document.getElementById('paymentStatusFilter').value,
            search: document.getElementById('searchFilter').value
        };
        
        // Remove empty filters
        Object.keys(this.filters).forEach(key => {
            if (!this.filters[key]) delete this.filters[key];
        });
        
        this.currentPage = 1;
        this.loadOrders();
    }

    /**
     * Clear filters
     */
    clearFilters() {
        document.getElementById('statusFilter').value = '';
        document.getElementById('customerTypeFilter').value = '';
        document.getElementById('paymentStatusFilter').value = '';
        document.getElementById('searchFilter').value = '';
        
        this.filters = {};
        this.currentPage = 1;
        this.loadOrders();
    }

    /**
     * Update pagination
     */
    updatePagination(pagination) {
        this.totalPages = pagination.totalPages;
        
        document.getElementById('ordersRange').textContent = 
            `${((pagination.currentPage - 1) * pagination.limit) + 1}-${Math.min(pagination.currentPage * pagination.limit, pagination.totalOrders)} of ${pagination.totalOrders}`;
        
        document.getElementById('pageInfo').textContent = `Page ${pagination.currentPage} of ${pagination.totalPages}`;
        
        document.getElementById('prevPageBtn').disabled = !pagination.hasPrev;
        document.getElementById('nextPageBtn').disabled = !pagination.hasNext;
    }

    /**
     * Previous page
     */
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadOrders();
        }
    }

    /**
     * Next page
     */
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadOrders();
        }
    }

    /**
     * Update selection
     */
    updateSelection() {
        const checkboxes = document.querySelectorAll('.order-checkbox:checked');
        this.selectedOrders = new Set(Array.from(checkboxes).map(cb => cb.dataset.orderId));
        
        const bulkBar = document.getElementById('bulkActionsBar');
        const selectedCount = document.getElementById('selectedCount');
        
        if (this.selectedOrders.size > 0) {
            bulkBar.classList.remove('hidden');
            selectedCount.textContent = `${this.selectedOrders.size} orders selected`;
        } else {
            bulkBar.classList.add('hidden');
        }
    }

    /**
     * Toggle select all
     */
    toggleSelectAll(checked) {
        document.querySelectorAll('.order-checkbox').forEach(checkbox => {
            checkbox.checked = checked;
        });
        this.updateSelection();
    }

    /**
     * Apply bulk update
     */
    async applyBulkUpdate() {
        const status = document.getElementById('bulkStatusUpdate').value;
        if (!status || this.selectedOrders.size === 0) return;

        try {
            const { adminAPI } = await import('../api/admin-api.js');
            
            const response = await adminAPI.bulkUpdateOrders(
                Array.from(this.selectedOrders),
                { status }
            );
            
            if (response.success) {
                this.showSuccess(`${response.data.modifiedCount} orders updated successfully`);
                this.selectedOrders.clear();
                document.getElementById('bulkActionsBar').classList.add('hidden');
                document.getElementById('selectAllOrders').checked = false;
                await this.loadOrders();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Bulk update failed:', error);
            this.showError('Failed to update orders. Please try again.');
        }
    }

    /**
     * View order details
     */
    async viewOrder(orderId) {
        // Implementation for viewing order details
        console.log('View order:', orderId);
    }

    /**
     * Update order status
     */
    async updateOrderStatus(orderId, status) {
        try {
            const { adminAPI } = await import('../api/admin-api.js');
            
            const response = await adminAPI.updateOrder(orderId, { status });
            
            if (response.success) {
                this.showSuccess('Order status updated successfully');
                await this.loadOrders();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Failed to update order status:', error);
            this.showError('Failed to update order status. Please try again.');
        }
    }

    /**
     * Export orders
     */
    async exportOrders() {
        try {
            const { adminAPI } = await import('../api/admin-api.js');
            
            const response = await adminAPI.exportOrders(this.filters);
            
            // Create download link
            const blob = new Blob([response], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            
            this.showSuccess('Orders exported successfully');
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Failed to export orders. Please try again.');
        }
    }

    /**
     * Close order modal
     */
    closeOrderModal() {
        document.getElementById('orderDetailsModal').classList.add('hidden');
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        // Implementation depends on your notification system
        console.log('Success:', message);
    }

    /**
     * Show error message
     */
    showError(message) {
        // Implementation depends on your notification system
        console.error('Error:', message);
    }

    /**
     * Refresh component data
     */
    async refresh() {
        await this.loadOrders();
    }
}