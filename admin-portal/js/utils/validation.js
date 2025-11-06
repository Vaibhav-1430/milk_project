// Validation utilities for admin portal

import { VALIDATION_RULES } from '../config/constants.js';

/**
 * Validation utility class
 */
export class Validator {
    constructor() {
        this.errors = {};
    }

    /**
     * Clear all validation errors
     */
    clearErrors() {
        this.errors = {};
    }

    /**
     * Add validation error
     */
    addError(field, message) {
        if (!this.errors[field]) {
            this.errors[field] = [];
        }
        this.errors[field].push(message);
    }

    /**
     * Get validation errors
     */
    getErrors() {
        return this.errors;
    }

    /**
     * Check if there are any validation errors
     */
    hasErrors() {
        return Object.keys(this.errors).length > 0;
    }

    /**
     * Get errors for a specific field
     */
    getFieldErrors(field) {
        return this.errors[field] || [];
    }

    /**
     * Validate required field
     */
    required(value, field, message = null) {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            this.addError(field, message || `${field} is required`);
            return false;
        }
        return true;
    }

    /**
     * Validate email format
     */
    email(value, field, message = null) {
        if (value && !VALIDATION_RULES.EMAIL.test(value)) {
            this.addError(field, message || 'Please enter a valid email address');
            return false;
        }
        return true;
    }

    /**
     * Validate phone number format
     */
    phone(value, field, message = null) {
        if (value && !VALIDATION_RULES.PHONE.test(value)) {
            this.addError(field, message || 'Please enter a valid 10-digit phone number');
            return false;
        }
        return true;
    }

    /**
     * Validate minimum length
     */
    minLength(value, minLength, field, message = null) {
        if (value && value.length < minLength) {
            this.addError(field, message || `${field} must be at least ${minLength} characters long`);
            return false;
        }
        return true;
    }

    /**
     * Validate maximum length
     */
    maxLength(value, maxLength, field, message = null) {
        if (value && value.length > maxLength) {
            this.addError(field, message || `${field} cannot exceed ${maxLength} characters`);
            return false;
        }
        return true;
    }

    /**
     * Validate numeric value
     */
    numeric(value, field, message = null) {
        if (value && (isNaN(value) || isNaN(parseFloat(value)))) {
            this.addError(field, message || `${field} must be a valid number`);
            return false;
        }
        return true;
    }

    /**
     * Validate minimum value
     */
    min(value, minValue, field, message = null) {
        if (value && parseFloat(value) < minValue) {
            this.addError(field, message || `${field} must be at least ${minValue}`);
            return false;
        }
        return true;
    }

    /**
     * Validate maximum value
     */
    max(value, maxValue, field, message = null) {
        if (value && parseFloat(value) > maxValue) {
            this.addError(field, message || `${field} cannot exceed ${maxValue}`);
            return false;
        }
        return true;
    }

    /**
     * Validate URL format
     */
    url(value, field, message = null) {
        if (value) {
            try {
                new URL(value);
            } catch {
                this.addError(field, message || 'Please enter a valid URL');
                return false;
            }
        }
        return true;
    }

    /**
     * Validate date format
     */
    date(value, field, message = null) {
        if (value && isNaN(Date.parse(value))) {
            this.addError(field, message || 'Please enter a valid date');
            return false;
        }
        return true;
    }

    /**
     * Validate that value is in allowed options
     */
    inArray(value, allowedValues, field, message = null) {
        if (value && !allowedValues.includes(value)) {
            this.addError(field, message || `${field} must be one of: ${allowedValues.join(', ')}`);
            return false;
        }
        return true;
    }

    /**
     * Validate file type
     */
    fileType(file, allowedTypes, field, message = null) {
        if (file && !allowedTypes.includes(file.type)) {
            this.addError(field, message || `${field} must be one of: ${allowedTypes.join(', ')}`);
            return false;
        }
        return true;
    }

    /**
     * Validate file size
     */
    fileSize(file, maxSize, field, message = null) {
        if (file && file.size > maxSize) {
            const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
            this.addError(field, message || `${field} size cannot exceed ${maxSizeMB}MB`);
            return false;
        }
        return true;
    }
}

/**
 * Form validation helper
 */
export class FormValidator {
    constructor(formElement) {
        this.form = formElement;
        this.validator = new Validator();
        this.setupRealTimeValidation();
    }

    /**
     * Set up real-time validation
     */
    setupRealTimeValidation() {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });

            input.addEventListener('input', () => {
                this.clearFieldError(input.name);
            });
        });
    }

    /**
     * Validate a single field
     */
    validateField(input) {
        const { name, value, type } = input;
        const rules = input.dataset.validation ? JSON.parse(input.dataset.validation) : {};

        this.validator.clearErrors();

        // Required validation
        if (rules.required) {
            this.validator.required(value, name);
        }

        // Type-specific validation
        if (value) {
            switch (type) {
                case 'email':
                    this.validator.email(value, name);
                    break;
                case 'tel':
                    this.validator.phone(value, name);
                    break;
                case 'number':
                    this.validator.numeric(value, name);
                    if (rules.min !== undefined) {
                        this.validator.min(value, rules.min, name);
                    }
                    if (rules.max !== undefined) {
                        this.validator.max(value, rules.max, name);
                    }
                    break;
                case 'url':
                    this.validator.url(value, name);
                    break;
                case 'date':
                    this.validator.date(value, name);
                    break;
            }

            // Length validation
            if (rules.minLength) {
                this.validator.minLength(value, rules.minLength, name);
            }
            if (rules.maxLength) {
                this.validator.maxLength(value, rules.maxLength, name);
            }

            // Custom validation
            if (rules.pattern) {
                const regex = new RegExp(rules.pattern);
                if (!regex.test(value)) {
                    this.validator.addError(name, rules.patternMessage || 'Invalid format');
                }
            }
        }

        this.displayFieldErrors(input);
        return !this.validator.hasErrors();
    }

    /**
     * Validate entire form
     */
    validateForm() {
        this.validator.clearErrors();
        const inputs = this.form.querySelectorAll('input, select, textarea');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * Display field errors
     */
    displayFieldErrors(input) {
        const errorContainer = this.form.querySelector(`[data-error-for="${input.name}"]`);
        const errors = this.validator.getFieldErrors(input.name);

        if (errorContainer) {
            if (errors.length > 0) {
                errorContainer.textContent = errors[0];
                errorContainer.classList.remove('hidden');
                input.classList.add('border-red-500');
            } else {
                errorContainer.textContent = '';
                errorContainer.classList.add('hidden');
                input.classList.remove('border-red-500');
            }
        }
    }

    /**
     * Clear field error
     */
    clearFieldError(fieldName) {
        const input = this.form.querySelector(`[name="${fieldName}"]`);
        const errorContainer = this.form.querySelector(`[data-error-for="${fieldName}"]`);

        if (errorContainer) {
            errorContainer.textContent = '';
            errorContainer.classList.add('hidden');
        }

        if (input) {
            input.classList.remove('border-red-500');
        }
    }

    /**
     * Clear all form errors
     */
    clearAllErrors() {
        const errorContainers = this.form.querySelectorAll('[data-error-for]');
        const inputs = this.form.querySelectorAll('input, select, textarea');

        errorContainers.forEach(container => {
            container.textContent = '';
            container.classList.add('hidden');
        });

        inputs.forEach(input => {
            input.classList.remove('border-red-500');
        });

        this.validator.clearErrors();
    }

    /**
     * Get form data as object
     */
    getFormData() {
        const formData = new FormData(this.form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        return data;
    }
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password) {
    const minLength = VALIDATION_RULES.PASSWORD_MIN_LENGTH;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const score = [
        password.length >= minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
    ].filter(Boolean).length;

    let strength = 'weak';
    let message = 'Password is too weak';

    if (score >= 4) {
        strength = 'strong';
        message = 'Password is strong';
    } else if (score >= 3) {
        strength = 'medium';
        message = 'Password is medium strength';
    }

    return {
        score,
        strength,
        message,
        isValid: password.length >= minLength
    };
}

// Export singleton validator instance
export const validator = new Validator();