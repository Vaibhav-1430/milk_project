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
        // Show loading state
        this.showPageLoading();

        try {
            // Dynamically import and load component
            const component = await this.loadComponent(route);
            
            if (component) {
                // Update page title and description
                this.updatePageInfo(route);
                
                // Update breadcrumb
                this.updateBreadcrumb(route);
                
                // Render component
                await component.render();
                
                this.currentRoute = route;
            }
        } catch (error) {
            console.error(`Failed to load route ${route}:`, error);
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
                    const { Dashboard } = await import('./components/dashboard.js');
                    ComponentClass = Dashboard;
                    break;
                case ROUTES.ORDERS:
                    const { Orders } = await import('./components/orders.js');
                    ComponentClass = Orders;
                    break;
                case ROUTES.PRODUCTS:
                    const { Products } = await import('./components/products.js');
                    ComponentClass = Products;
                    break;
                case ROUTES.CUSTOMERS:
                    const { Customers } = await import('./components/customers.js');
                    ComponentClass = Customers;
                    break;
                case ROUTES.ANALYTICS:
                    const { Analytics } = await import('./components/analytics.js');
                    ComponentClass = Analytics;
                    break;
                case ROUTES.SETTINGS:
                    const { Settings } = await import('./components/settings.js');
                    ComponentClass = Settings;
                    break;
                default:
                    throw new Error(`Unknown route: ${route}`);
            }

            const component = new ComponentClass();
            this.components.set(route, component);
            return component;
        } catch (error) {
            console.error(`Failed to load component for route ${route}:`, error);
            return null;
        }
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
        return urlParams.get('page') || ROUTES.DASHBOARD;
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
    
    // Check if we're in demo mode (URL parameter)
    const urlParams = new URLSearchParams(window.location.search);
    const demoMode = urlParams.get('demo') === 'true';
    
    if (demoMode) {
        // Set up demo authentication
        const mockToken = 'demo-admin-token-' + Date.now();
        const mockAdmin = {
            id: 'admin1',
            name: 'Demo Admin',
            email: 'admin@garamdoodh.com',
            role: 'admin',
            permissions: ['view_dashboard', 'manage_orders', 'manage_products', 'manage_customers', 'view_analytics', 'manage_settings']
        };
        
        localStorage.setItem('admin_token', mockToken);
        localStorage.setItem('admin_info', JSON.stringify(mockAdmin));
        
        console.log('Demo mode activated');
    }
    
    app.initialize();
});

// Export for global access
window.AdminApp = AdminApp;