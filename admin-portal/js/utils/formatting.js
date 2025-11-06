// Formatting utilities for admin portal

import { CURRENCY, DATE_FORMATS } from '../config/constants.js';

/**
 * Format currency value
 */
export function formatCurrency(amount, showSymbol = true) {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return showSymbol ? `${CURRENCY.SYMBOL}0.00` : '0.00';
    }

    const formatted = parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return showSymbol ? `${CURRENCY.SYMBOL}${formatted}` : formatted;
}

/**
 * Format date
 */
export function formatDate(date, format = DATE_FORMATS.DISPLAY) {
    if (!date) return '';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';

    const options = {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
    };

    switch (format) {
        case DATE_FORMATS.DISPLAY:
            return dateObj.toLocaleDateString('en-US', options);
        case DATE_FORMATS.INPUT:
            return dateObj.toISOString().split('T')[0];
        case DATE_FORMATS.DATETIME:
            return dateObj.toLocaleDateString('en-US', {
                ...options,
                hour: '2-digit',
                minute: '2-digit'
            });
        case DATE_FORMATS.TIME:
            return dateObj.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        default:
            return dateObj.toLocaleDateString('en-US', options);
    }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date) {
    if (!date) return '';
    
    const now = new Date();
    const dateObj = new Date(date);
    const diffInSeconds = Math.floor((now - dateObj) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
        return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    }

    return formatDate(date);
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone) {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
        return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    
    return phone;
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format percentage
 */
export function formatPercentage(value, decimals = 1) {
    if (value === null || value === undefined || isNaN(value)) {
        return '0%';
    }
    
    return `${parseFloat(value).toFixed(decimals)}%`;
}

/**
 * Format number with commas
 */
export function formatNumber(number, decimals = 0) {
    if (number === null || number === undefined || isNaN(number)) {
        return '0';
    }
    
    return parseFloat(number).toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Truncate text
 */
export function truncateText(text, maxLength = 50, suffix = '...') {
    if (!text || text.length <= maxLength) {
        return text || '';
    }
    
    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalize first letter
 */
export function capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convert camelCase to Title Case
 */
export function camelToTitle(text) {
    if (!text) return '';
    
    return text
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

/**
 * Format order status for display
 */
export function formatOrderStatus(status) {
    if (!status) return '';
    
    const statusMap = {
        'pending': 'Pending',
        'confirmed': 'Confirmed',
        'preparing': 'Preparing',
        'out_for_delivery': 'Out for Delivery',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
    };
    
    return statusMap[status] || capitalize(status);
}

/**
 * Format payment status for display
 */
export function formatPaymentStatus(status) {
    if (!status) return '';
    
    const statusMap = {
        'pending': 'Pending',
        'paid': 'Paid',
        'failed': 'Failed',
        'refunded': 'Refunded'
    };
    
    return statusMap[status] || capitalize(status);
}

/**
 * Format customer type for display
 */
export function formatCustomerType(type) {
    if (!type) return '';
    
    const typeMap = {
        'college': 'College Student',
        'outsider': 'Outsider'
    };
    
    return typeMap[type] || capitalize(type);
}

/**
 * Format delivery time for display
 */
export function formatDeliveryTime(time) {
    if (!time) return '';
    
    const timeMap = {
        'morning': 'Morning (6:00 AM - 10:00 AM)',
        'evening': 'Evening (5:00 PM - 8:00 PM)'
    };
    
    return timeMap[time] || capitalize(time);
}

/**
 * Generate initials from name
 */
export function getInitials(name) {
    if (!name) return '';
    
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
}

/**
 * Format address for display
 */
export function formatAddress(address) {
    if (!address) return '';
    
    const parts = [
        address.street,
        address.landmark,
        address.city,
        address.state,
        address.pincode
    ].filter(Boolean);
    
    return parts.join(', ');
}

/**
 * Format order items for display
 */
export function formatOrderItems(items) {
    if (!items || !Array.isArray(items)) return '';
    
    return items
        .map(item => `${item.name} x${item.quantity}`)
        .join(', ');
}

/**
 * Generate random color for charts
 */
export function generateRandomColor(opacity = 1) {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Convert hex color to rgba
 */
export function hexToRgba(hex, opacity = 1) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    
    if (!result) return hex;
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Format search query for highlighting
 */
export function highlightSearchTerm(text, searchTerm) {
    if (!text || !searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
}

/**
 * Debounce function for search inputs
 */
export function debounce(func, wait) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function for scroll events
 */
export function throttle(func, limit) {
    let inThrottle;
    
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Generate slug from text
 */
export function generateSlug(text) {
    if (!text) return '';
    
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Parse CSV data
 */
export function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',').map(value => value.trim());
            const row = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            
            data.push(row);
        }
    }
    
    return { headers, data };
}

/**
 * Convert data to CSV format
 */
export function convertToCSV(data, headers = null) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return '';
    }
    
    const csvHeaders = headers || Object.keys(data[0]);
    const csvRows = [csvHeaders.join(',')];
    
    data.forEach(row => {
        const values = csvHeaders.map(header => {
            const value = row[header] || '';
            return typeof value === 'string' && value.includes(',') 
                ? `"${value}"` 
                : value;
        });
        csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
}