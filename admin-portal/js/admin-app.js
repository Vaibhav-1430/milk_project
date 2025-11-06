// Main admin application controller

import { CONFIG, ROUTES, NAVIGATION_ITEMS } from './config/constants.js';
import authManager from './utils/auth.js';
import { formatDate, formatRelativeTime } from './utils/formatting.js';

class AdminApp {
    constructor() {
        this.currentRoute = ROUTES.DASHBOARD;
        this.components = new Map();
        this.isInitialized = false;
        
        // Bind methods
        this.handleRouteChange = this.handleRouteChange.bind(this);
        this.handleMobileMenu = this.handleMobileMenu.bind(this);
        this.handleNotifications = this.handleNotifications.bind(this);
        this.handleProfile = this.handleProfile.bind(this);
    }

    /**
     * Initialize the admin application
     */
    async initialize() {
        try {
            // Show loading screen
            this.showLoading();

            console.log('Initializing admin portal...');

            // Initialize authentication
            const isAuthenticated = await authManager.initialize();
            console.log('Authentication result:', isAuthenticated);
            
            if (!isAuthenticated) {
                console.log('Not authenticated, should redirect to login');
                return;
            }

            // Set up the application
            await this.setupApplication();
            
            // Hide loading screen and show app
            this.hideLoading();
            
            this.isInitialized = true;
            console.log('Admin portal initialized successfully');
        } catch (error) {
            console.error('Failed to initialize admin portal:', error);
            this.hideLoading();
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Set up the main application
     */
    async setupApplication() {
        // Set up navigation
        this.setupNavigation();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up admin info
        this.setupAdminInfo();
        
        // Load initial route
        await this.loadRoute(this.getCurrentRoute());
        
        // Set up real-time updates
        this.setupRealTimeUpdates();
    }

    /**
     * Set up navigation menu
     */
    setupNavigation() {
        const navigationMenu = document.getElementById('navigationMenu');
        if (!navigationMenu) return;

        navigationMenu.innerHTML = '';

        NAVIGATION_ITEMS.forEach(item => {
            // Check permissions
            if (item.permission && !authManager.hasPermission(item.permission)) {
                return;
            }

            const navItem = document.createElement('div');
            navItem.className = 'nav-item';
            navItem.dataset.route = item.route;
            
            navItem.innerHTML = `
                <i class="${item.icon}"></i>
                <span>${item.label}</span>
                ${item.badge ? `<span id="${item.badge}" class="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 hidden">0</span>` : ''}
            `;

            navItem.addEventListener('click', () => {
                this.navigateTo(item.route);
            });

            navigationMenu.appendChild(navItem);
        });
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', this.handleMobileMenu);
        }
        
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', this.handleMobileMenu);
        }

        // Notification dropdown
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', this.handleNotifications);
        }

        // Profile dropdown
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', this.handleProfile);
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                authManager.logout();
            });
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', (event) => {
            this.closeDropdowns(event);
        });

        // Handle browser back/forward
        window.addEventListener('popstate', this.handleRouteChange);
    }

    /**
     * Set up admin information display
     */
    setupAdminInfo() {
        const adminInfo = authManager.getAdminInfo();
        if (!adminInfo) return;

        const adminNameElement = document.getElementById('adminName');
        if (adminNameElement) {
            adminNameElement.textContent = adminInfo.name || 'Admin';
        }
    }

    /**
     * Set up real-time updates
     */
    setupRealTimeUpdates() {
        // Set up periodic data refresh
        setInterval(() => {
            this.refreshData();
        }, CONFIG.REFRESH_INTERVAL);

        // Set up notification polling
        this.startNotificationPolling();
    }

    /**
     * Handle mobile menu toggle
     */
    handleMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar && overlay) {
            sidebar.classList.toggle('-translate-x-full');
            overlay.classList.toggle('hidden');
        }
    }

    /**
     * Handle notification dropdown
     */
    handleNotifications(event) {
        event.stopPropagation();
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
            if (!dropdown.classList.contains('hidden')) {
                this.loadNotifications();
            }
        }
    }

    /**
     * Handle profile dropdown
     */
    handleProfile(event) {
        event.stopPropagation();
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
    }

    /**
     * Close all dropdowns
     */
    closeDropdowns(event) {
        const dropdowns = ['notificationDropdown', 'profileDropdown'];
        
        dropdowns.forEach(dropdownId => {
            const dropdown = document.getElementById(dropdownId);
            if (dropdown && !dropdown.contains(event.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }

    /**
     * Navigate to a specific route
     */
    async navigateTo(route) {
        if (this.currentRoute === route) return;

        try {
            await this.loadRoute(route);
            this.updateURL(route);
            this.updateNavigation(route);
        } catch (error) {
            console.error('Navigation error:', error);
            this.showError('Failed to load page. Please try again.');
        }
    }

    /**
     * Load a specific route
     */
    async loadRoute(route) {
        console.log('🚀 Loading route:', route);
        
        // Show loading state
        this.showPageLoading();

        try {
            // Dynamically import and load component
            const component = await this.loadComponent(route);
            
            if (component) {
                console.log('✅ Component loaded for route:', route);
                
                // Update page title and description
                this.updatePageInfo(route);
                
                // Update breadcrumb
                this.updateBreadcrumb(route);
                
                // Render component
                console.log('🎨 Rendering component for route:', route);
                await component.render();
                
                this.currentRoute = route;
                console.log('✅ Route loaded successfully:', route);
            } else {
                console.error('❌ No component returned for route:', route);
            }
        } catch (error) {
            console.error(`❌ Failed to load route ${route}:`, error);
            throw error;
        } finally {
            this.hidePageLoading();
        }
    }

    /**
     * Load component for route
     */
    async loadComponent(route) {
        // Check if component is already loaded
        if (this.components.has(route)) {
            return this.components.get(route);
        }

        try {
            let ComponentClass;
            
            switch (route) {
                case ROUTES.DASHBOARD:
                    try {
                        const dashboardModule = await import('./components/dashboard.js');
                        ComponentClass = dashboardModule.Dashboard;
                    } catch (importError) {
                        console.error('Failed to import dashboard component:', importError);
                        // Fallback: create a simple dashboard component
                        ComponentClass = this.createFallbackDashboard();
                    }
                    break;
                case ROUTES.ORDERS:
                    ComponentClass = this.createOrdersComponent();
                    break;
                case ROUTES.PRODUCTS:
                    ComponentClass = this.createProductsComponent();
                    break;
                case ROUTES.CUSTOMERS:
                    ComponentClass = this.createCustomersComponent();
                    break;
                case ROUTES.ANALYTICS:
                case ROUTES.SETTINGS:
                    // For now, create placeholder components
                    ComponentClass = this.createPlaceholderComponent(route);
                    break;
                default:
                    throw new Error(`Unknown route: ${route}`);
            }

            const component = new ComponentClass();
            this.components.set(route, component);
            return component;
        } catch (error) {
            console.error(`Failed to load component for route ${route}:`, error);
            return this.createErrorComponent(error.message);
        }
    }

    /**
     * Create fallback dashboard component
     */
    createFallbackDashboard() {
        return class FallbackDashboard {
            async render() {
                const mainContent = document.getElementById('mainContent');
                if (mainContent) {
                    mainContent.innerHTML = `
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div class="bg-white rounded-lg shadow p-6 text-center">
                                <div class="text-3xl font-bold text-gray-900 mb-2">24</div>
                                <div class="text-sm text-gray-600 uppercase tracking-wide">Today's Orders</div>
                                <div class="text-sm font-medium mt-2 text-green-600">+12.5%</div>
                            </div>
                            <div class="bg-white rounded-lg shadow p-6 text-center">
                                <div class="text-3xl font-bold text-gray-900 mb-2">₹4,800</div>
                                <div class="text-sm text-gray-600 uppercase tracking-wide">Today's Revenue</div>
                                <div class="text-sm font-medium mt-2 text-green-600">+8.3%</div>
                            </div>
                            <div class="bg-white rounded-lg shadow p-6 text-center">
                                <div class="text-3xl font-bold text-gray-900 mb-2">156</div>
                                <div class="text-sm text-gray-600 uppercase tracking-wide">Total Customers</div>
                                <div class="text-sm font-medium mt-2 text-green-600">+5.2%</div>
                            </div>
                            <div class="bg-white rounded-lg shadow p-6 text-center">
                                <div class="text-3xl font-bold text-gray-900 mb-2">8</div>
                                <div class="text-sm text-gray-600 uppercase tracking-wide">Pending Orders</div>
                                <div class="text-sm font-medium mt-2 text-gray-600">-</div>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-lg shadow p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-200">
                                        <tr>
                                            <td class="px-6 py-4 whitespace-nowrap font-medium">GD000123</td>
                                            <td class="px-6 py-4 whitespace-nowrap">John Doe</td>
                                            <td class="px-6 py-4 whitespace-nowrap">₹250</td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    Confirmed
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="px-6 py-4 whitespace-nowrap font-medium">GD000124</td>
                                            <td class="px-6 py-4 whitespace-nowrap">Jane Smith</td>
                                            <td class="px-6 py-4 whitespace-nowrap">₹180</td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    Pending
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                }
            }
            async refresh() {}
        };
    }

    /**
     * Create Orders component
     */
    createOrdersComponent() {
        return class OrdersComponent {
            async render() {
                const mainContent = document.getElementById('mainContent');
                if (mainContent) {
                    mainContent.innerHTML = `
                        <div class="admin-card">
                            <div class="flex items-center justify-between mb-6">
                                <div>
                                    <h3 class="text-xl font-semibold text-gray-900">Orders Management</h3>
                                    <p class="text-gray-600">Manage customer orders and deliveries</p>
                                </div>
                                <button class="btn-primary">
                                    <i class="fas fa-plus mr-2"></i>New Order
                                </button>
                            </div>
                            
                            <div class="overflow-x-auto">
                                <table class="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Order #</th>
                                            <th>Customer</th>
                                            <th>Items</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="ordersTableBody">
                                        <tr>
                                            <td colspan="7" class="text-center py-8 text-gray-500">
                                                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                                <div>Loading orders...</div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                }
                await this.loadOrders();
            }
            
            async loadOrders() {
                try {
                    const { adminAPI } = await import('./api/admin-api.js');
                    const response = await adminAPI.getOrders();
                    
                    if (response.success) {
                        this.renderOrders(response.data.orders || []);
                    } else {
                        throw new Error(response.message);
                    }
                } catch (error) {
                    console.error('Failed to load orders:', error);
                    const tbody = document.getElementById('ordersTableBody');
                    if (tbody) {
                        tbody.innerHTML = `
                            <tr>
                                <td colspan="7" class="text-center py-8 text-red-500">
                                    Failed to load orders. Please refresh the page.
                                </td>
                            </tr>
                        `;
                    }
                }
            }
            
            renderOrders(orders) {
                const tbody = document.getElementById('ordersTableBody');
                if (!tbody) return;
                
                if (orders.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="7" class="text-center py-8 text-gray-500">
                                No orders found
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                tbody.innerHTML = orders.map(order => `
                    <tr class="hover:bg-gray-50">
                        <td class="font-medium">${order.orderNumber || order._id}</td>
                        <td>${order.customer || 'Unknown'}</td>
                        <td>${order.itemCount || 0} items</td>
                        <td>₹${order.total || 0}</td>
                        <td>
                            <span class="status-badge status-${order.status}">
                                ${order.status}
                            </span>
                        </td>
                        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                        <td>
                            <button class="btn-secondary btn-sm">View</button>
                        </td>
                    </tr>
                `).join('');
            }
            
            async refresh() {
                await this.loadOrders();
            }
        };
    }

    /**
     * Create Products component
     */
    createProductsComponent() {
        return class ProductsComponent {
            async render() {
                const mainContent = document.getElementById('mainContent');
                if (mainContent) {
                    mainContent.innerHTML = `
                        <div class="admin-card">
                            <div class="flex items-center justify-between mb-6">
                                <div>
                                    <h3 class="text-xl font-semibold text-gray-900">Products Management</h3>
                                    <p class="text-gray-600">Manage your product catalog and inventory</p>
                                </div>
                                <button class="btn-primary">
                                    <i class="fas fa-plus mr-2"></i>Add Product
                                </button>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="productsGrid">
                                <div class="text-center py-8 text-gray-500">
                                    <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                    <div>Loading products...</div>
                                </div>
                            </div>
                        </div>
                    `;
                }
                await this.loadProducts();
            }
            
            async loadProducts() {
                try {
                    const { adminAPI } = await import('./api/admin-api.js');
                    const response = await adminAPI.getProducts();
                    
                    if (response.success) {
                        this.renderProducts(response.data.products || []);
                    } else {
                        throw new Error(response.message);
                    }
                } catch (error) {
                    console.error('Failed to load products:', error);
                    const grid = document.getElementById('productsGrid');
                    if (grid) {
                        grid.innerHTML = `
                            <div class="col-span-full text-center py-8 text-red-500">
                                Failed to load products. Please refresh the page.
                            </div>
                        `;
                    }
                }
            }
            
            renderProducts(products) {
                const grid = document.getElementById('productsGrid');
                if (!grid) return;
                
                if (products.length === 0) {
                    grid.innerHTML = `
                        <div class="col-span-full text-center py-8 text-gray-500">
                            No products found
                        </div>
                    `;
                    return;
                }
                
                grid.innerHTML = products.map(product => `
                    <div class="admin-card">
                        <div class="aspect-w-16 aspect-h-9 mb-4">
                            <img src="${product.image || '/placeholder.jpg'}" alt="${product.name}" class="w-full h-32 object-cover rounded">
                        </div>
                        <h4 class="font-semibold text-gray-900">${product.name}</h4>
                        <p class="text-sm text-gray-600 mb-2">${product.quantity}</p>
                        <div class="flex items-center justify-between">
                            <span class="text-lg font-bold text-green-600">₹${product.price}</span>
                            <span class="text-sm text-gray-500">Stock: ${product.stock}</span>
                        </div>
                        <div class="mt-4 flex space-x-2">
                            <button class="btn-secondary btn-sm flex-1">Edit</button>
                            <button class="btn-secondary btn-sm">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            }
            
            async refresh() {
                await this.loadProducts();
            }
        };
    }

    /**
     * Create Customers component
     */
    createCustomersComponent() {
        return class CustomersComponent {
            async render() {
                const mainContent = document.getElementById('mainContent');
                if (mainContent) {
                    mainContent.innerHTML = `
                        <div class="admin-card">
                            <div class="flex items-center justify-between mb-6">
                                <div>
                                    <h3 class="text-xl font-semibold text-gray-900">Customers Management</h3>
                                    <p class="text-gray-600">Manage customer accounts and relationships</p>
                                </div>
                                <button class="btn-primary">
                                    <i class="fas fa-plus mr-2"></i>Add Customer
                                </button>
                            </div>
                            
                            <div class="overflow-x-auto">
                                <table class="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Type</th>
                                            <th>Orders</th>
                                            <th>Joined</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="customersTableBody">
                                        <tr>
                                            <td colspan="7" class="text-center py-8 text-gray-500">
                                                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                                <div>Loading customers...</div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                }
                await this.loadCustomers();
            }
            
            async loadCustomers() {
                try {
                    const { adminAPI } = await import('./api/admin-api.js');
                    const response = await adminAPI.getCustomers();
                    
                    if (response.success) {
                        this.renderCustomers(response.data.customers || []);
                    } else {
                        throw new Error(response.message);
                    }
                } catch (error) {
                    console.error('Failed to load customers:', error);
                    const tbody = document.getElementById('customersTableBody');
                    if (tbody) {
                        tbody.innerHTML = `
                            <tr>
                                <td colspan="7" class="text-center py-8 text-red-500">
                                    Failed to load customers. Please refresh the page.
                                </td>
                            </tr>
                        `;
                    }
                }
            }
            
            renderCustomers(customers) {
                const tbody = document.getElementById('customersTableBody');
                if (!tbody) return;
                
                if (customers.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="7" class="text-center py-8 text-gray-500">
                                No customers found
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                tbody.innerHTML = customers.map(customer => `
                    <tr class="hover:bg-gray-50">
                        <td class="font-medium">${customer.name}</td>
                        <td>${customer.email}</td>
                        <td>${customer.phone || 'N/A'}</td>
                        <td>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${customer.customerType === 'college' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">
                                ${customer.customerType}
                            </span>
                        </td>
                        <td>${customer.orderCount || 0}</td>
                        <td>${new Date(customer.createdAt).toLocaleDateString()}</td>
                        <td>
                            <button class="btn-secondary btn-sm">View</button>
                        </td>
                    </tr>
                `).join('');
            }
            
            async refresh() {
                await this.loadCustomers();
            }
        };
    }

    /**
     * Create placeholder component for unimplemented routes
     */
    createPlaceholderComponent(route) {
        return class PlaceholderComponent {
            async render() {
                const mainContent = document.getElementById('mainContent');
                if (mainContent) {
                    const routeNames = {
                        orders: 'Orders',
                        products: 'Products', 
                        customers: 'Customers',
                        analytics: 'Analytics',
                        settings: 'Settings'
                    };
                    
                    mainContent.innerHTML = `
                        <div class="bg-white rounded-lg shadow p-8 text-center">
                            <i class="fas fa-tools text-4xl text-gray-400 mb-4"></i>
                            <h3 class="text-xl font-semibold text-gray-900 mb-2">${routeNames[route]} Module</h3>
                            <p class="text-gray-600 mb-4">This module is under development and will be available soon.</p>
                            <button onclick="window.AdminApp.navigateTo('dashboard')" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                                Back to Dashboard
                            </button>
                        </div>
                    `;
                }
            }
            async refresh() {}
        };
    }

    /**
     * Create error component
     */
    createErrorComponent(errorMessage) {
        return class ErrorComponent {
            async render() {
                const mainContent = document.getElementById('mainContent');
                if (mainContent) {
                    mainContent.innerHTML = `
                        <div class="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                            <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                            <h3 class="text-xl font-semibold text-red-900 mb-2">Error Loading Component</h3>
                            <p class="text-red-700 mb-4">${errorMessage}</p>
                            <button onclick="location.reload()" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                                Reload Page
                            </button>
                        </div>
                    `;
                }
            }
            async refresh() {}
        };
    }

    /**
     * Update page information
     */
    updatePageInfo(route) {
        const pageTitle = document.getElementById('pageTitle');
        const pageDescription = document.getElementById('pageDescription');
        
        const routeInfo = {
            [ROUTES.DASHBOARD]: {
                title: 'Dashboard',
                description: 'Overview of your milk delivery business'
            },
            [ROUTES.ORDERS]: {
                title: 'Orders',
                description: 'Manage customer orders and deliveries'
            },
            [ROUTES.PRODUCTS]: {
                title: 'Products',
                description: 'Manage your product catalog and inventory'
            },
            [ROUTES.CUSTOMERS]: {
                title: 'Customers',
                description: 'Manage customer accounts and relationships'
            },
            [ROUTES.ANALYTICS]: {
                title: 'Analytics',
                description: 'Business insights and performance metrics'
            },
            [ROUTES.SETTINGS]: {
                title: 'Settings',
                description: 'System configuration and preferences'
            }
        };

        const info = routeInfo[route] || { title: 'Page', description: '' };
        
        if (pageTitle) pageTitle.textContent = info.title;
        if (pageDescription) pageDescription.textContent = info.description;
        
        document.title = `${info.title} - GaramDoodh Admin`;
    }

    /**
     * Update breadcrumb navigation
     */
    updateBreadcrumb(route) {
        const breadcrumb = document.getElementById('breadcrumb');
        if (!breadcrumb) return;

        const routeNames = {
            [ROUTES.DASHBOARD]: 'Dashboard',
            [ROUTES.ORDERS]: 'Orders',
            [ROUTES.PRODUCTS]: 'Products',
            [ROUTES.CUSTOMERS]: 'Customers',
            [ROUTES.ANALYTICS]: 'Analytics',
            [ROUTES.SETTINGS]: 'Settings'
        };

        breadcrumb.innerHTML = `
            <a href="#" class="text-indigo-600 hover:text-indigo-800" data-route="${ROUTES.DASHBOARD}">
                <i class="fas fa-home"></i>
            </a>
            <i class="fas fa-chevron-right text-gray-400"></i>
            <span class="text-gray-900">${routeNames[route] || 'Page'}</span>
        `;

        // Add click handler for home link
        const homeLink = breadcrumb.querySelector('[data-route]');
        if (homeLink) {
            homeLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(homeLink.dataset.route);
            });
        }
    }

    /**
     * Update navigation active state
     */
    updateNavigation(route) {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.route === route) {
                item.classList.add('active');
            }
        });
    }

    /**
     * Update URL without page reload
     */
    updateURL(route) {
        const url = new URL(window.location);
        url.searchParams.set('page', route);
        window.history.pushState({ route }, '', url);
    }

    /**
     * Get current route from URL
     */
    getCurrentRoute() {
        const urlParams = new URLSearchParams(window.location.search);
        const route = urlParams.get('page') || ROUTES.DASHBOARD;
        console.log('🔍 Current route:', route, 'URL params:', window.location.search);
        return route;
    }

    /**
     * Handle route change from browser navigation
     */
    handleRouteChange() {
        const route = this.getCurrentRoute();
        this.loadRoute(route);
        this.updateNavigation(route);
    }

    /**
     * Show loading screen
     */
    showLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        const app = document.getElementById('app');
        
        if (loadingScreen) loadingScreen.classList.remove('hidden');
        if (app) app.classList.add('hidden');
    }

    /**
     * Hide loading screen
     */
    hideLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        const app = document.getElementById('app');
        
        if (loadingScreen) loadingScreen.classList.add('hidden');
        if (app) app.classList.remove('hidden');
    }

    /**
     * Show page loading state
     */
    showPageLoading() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.classList.add('loading');
        }
    }

    /**
     * Hide page loading state
     */
    hidePageLoading() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.classList.remove('loading');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showToast(message, 'error');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = CONFIG.TOAST_DURATION) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const iconMap = {
            success: 'fas fa-check-circle text-green-500',
            error: 'fas fa-exclamation-circle text-red-500',
            warning: 'fas fa-exclamation-triangle text-yellow-500',
            info: 'fas fa-info-circle text-blue-500'
        };

        toast.innerHTML = `
            <div class="p-4">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <i class="${iconMap[type]}"></i>
                    </div>
                    <div class="ml-3 w-0 flex-1">
                        <p class="text-sm font-medium text-gray-900">${message}</p>
                    </div>
                    <div class="ml-4 flex-shrink-0 flex">
                        <button class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add close functionality
        const closeBtn = toast.querySelector('button');
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });

        toastContainer.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, duration);
    }

    /**
     * Load notifications
     */
    async loadNotifications() {
        try {
            // This would typically fetch from API
            const notifications = [
                {
                    id: 1,
                    title: 'New Order',
                    message: 'Order #GD000123 has been placed',
                    type: 'info',
                    time: new Date(Date.now() - 5 * 60 * 1000),
                    read: false
                },
                {
                    id: 2,
                    title: 'Low Stock Alert',
                    message: 'Milk 1L is running low (5 units left)',
                    type: 'warning',
                    time: new Date(Date.now() - 15 * 60 * 1000),
                    read: false
                }
            ];

            this.renderNotifications(notifications);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }

    /**
     * Render notifications
     */
    renderNotifications(notifications) {
        const notificationList = document.getElementById('notificationList');
        const notificationBadge = document.getElementById('notificationBadge');
        
        if (!notificationList) return;

        if (notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    <i class="fas fa-bell-slash text-2xl mb-2"></i>
                    <p>No notifications</p>
                </div>
            `;
        } else {
            notificationList.innerHTML = notifications.map(notification => `
                <div class="p-4 border-b border-gray-200 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}">
                    <div class="flex items-start">
                        <div class="flex-shrink-0">
                            <div class="w-2 h-2 bg-blue-500 rounded-full ${notification.read ? 'opacity-0' : ''}"></div>
                        </div>
                        <div class="ml-3 flex-1">
                            <p class="text-sm font-medium text-gray-900">${notification.title}</p>
                            <p class="text-sm text-gray-600">${notification.message}</p>
                            <p class="text-xs text-gray-400 mt-1">${formatRelativeTime(notification.time)}</p>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Update notification badge
        const unreadCount = notifications.filter(n => !n.read).length;
        if (notificationBadge) {
            if (unreadCount > 0) {
                notificationBadge.textContent = unreadCount;
                notificationBadge.classList.remove('hidden');
            } else {
                notificationBadge.classList.add('hidden');
            }
        }
    }

    /**
     * Start notification polling
     */
    startNotificationPolling() {
        // Poll for notifications every 30 seconds
        setInterval(() => {
            this.loadNotifications();
        }, 30000);
    }

    /**
     * Refresh current page data
     */
    async refreshData() {
        if (this.components.has(this.currentRoute)) {
            const component = this.components.get(this.currentRoute);
            if (component && typeof component.refresh === 'function') {
                await component.refresh();
            }
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new AdminApp();
    globalAdminApp = app; // Store global reference
    
    console.log('🚀 Initializing real-time admin portal...');
    app.initialize();
});

// Create global instance for navigation
let globalAdminApp = null;

// Export for global access
window.AdminApp = {
    navigateTo: (route) => {
        if (globalAdminApp) {
            globalAdminApp.navigateTo(route);
        }
    }
};