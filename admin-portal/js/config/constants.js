// Configuration constants for the admin portal

export const CONFIG = {
    // API Configuration
    API_BASE_URL: '/.netlify/functions/api',
    API_ADMIN_URL: '/.netlify/functions/api/admin',
    
    // Authentication
    TOKEN_KEY: 'admin_token',
    REFRESH_TOKEN_KEY: 'admin_refresh_token',
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
    
    // Pagination
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    
    // Real-time Updates
    WEBSOCKET_URL: process.env.NODE_ENV === 'production' 
        ? 'wss://your-websocket-url.com' 
        : 'ws://localhost:8080',
    REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
    
    // File Upload
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    
    // Notifications
    TOAST_DURATION: 5000, // 5 seconds
    MAX_NOTIFICATIONS: 50,
    
    // Chart Colors
    CHART_COLORS: {
        primary: '#4F46E5',
        secondary: '#6B7280',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6'
    }
};

export const ROUTES = {
    DASHBOARD: 'dashboard',
    ORDERS: 'orders',
    PRODUCTS: 'products',
    CUSTOMERS: 'customers',
    ANALYTICS: 'analytics',
    SETTINGS: 'settings',
    NOTIFICATIONS: 'notifications'
};

export const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
};

export const PAYMENT_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};

export const CUSTOMER_TYPES = {
    COLLEGE: 'college',
    OUTSIDER: 'outsider'
};

export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

export const PERMISSIONS = {
    VIEW_DASHBOARD: 'view_dashboard',
    MANAGE_ORDERS: 'manage_orders',
    MANAGE_PRODUCTS: 'manage_products',
    MANAGE_CUSTOMERS: 'manage_customers',
    VIEW_ANALYTICS: 'view_analytics',
    MANAGE_SETTINGS: 'manage_settings',
    MANAGE_USERS: 'manage_users'
};

export const NAVIGATION_ITEMS = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'fas fa-tachometer-alt',
        route: ROUTES.DASHBOARD,
        permission: PERMISSIONS.VIEW_DASHBOARD
    },
    {
        id: 'orders',
        label: 'Orders',
        icon: 'fas fa-shopping-cart',
        route: ROUTES.ORDERS,
        permission: PERMISSIONS.MANAGE_ORDERS,
        badge: 'orderCount'
    },
    {
        id: 'products',
        label: 'Products',
        icon: 'fas fa-box',
        route: ROUTES.PRODUCTS,
        permission: PERMISSIONS.MANAGE_PRODUCTS
    },
    {
        id: 'customers',
        label: 'Customers',
        icon: 'fas fa-users',
        route: ROUTES.CUSTOMERS,
        permission: PERMISSIONS.MANAGE_CUSTOMERS
    },
    {
        id: 'analytics',
        label: 'Analytics',
        icon: 'fas fa-chart-bar',
        route: ROUTES.ANALYTICS,
        permission: PERMISSIONS.VIEW_ANALYTICS
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: 'fas fa-cog',
        route: ROUTES.SETTINGS,
        permission: PERMISSIONS.MANAGE_SETTINGS
    }
];

export const DELIVERY_TIMES = {
    MORNING: 'morning',
    EVENING: 'evening'
};

export const PRODUCT_QUANTITIES = [
    '100 ml',
    '250 ml', 
    '500 ml',
    '1 L',
    '2 L',
    '5 L'
];

export const VALIDATION_RULES = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[6-9]\d{9}$/,
    PASSWORD_MIN_LENGTH: 6,
    NAME_MAX_LENGTH: 50,
    DESCRIPTION_MAX_LENGTH: 500
};

export const DATE_FORMATS = {
    DISPLAY: 'MMM DD, YYYY',
    INPUT: 'YYYY-MM-DD',
    DATETIME: 'MMM DD, YYYY HH:mm',
    TIME: 'HH:mm'
};

export const CURRENCY = {
    SYMBOL: '₹',
    CODE: 'INR'
};

export const STOCK_THRESHOLDS = {
    LOW_STOCK: 10,
    OUT_OF_STOCK: 0
};