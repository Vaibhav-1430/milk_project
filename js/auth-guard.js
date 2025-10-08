// Authentication Guard for Order Protection
class AuthGuard {
    constructor() {
        this.returnUrl = null;
        this.init();
    }

    init() {
        this.setupOrderProtection();
        this.handleReturnUrl();
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('garamdoodh_token');
        const user = localStorage.getItem('garamdoodh_user');
        return !!(token && user);
    }

    // Get current user
    getCurrentUser() {
        const userStr = localStorage.getItem('garamdoodh_user');
        return userStr ? JSON.parse(userStr) : null;
    }

    // Get current token
    getCurrentToken() {
        return localStorage.getItem('garamdoodh_token');
    }

    // Require authentication for order actions
    requireAuth(action = 'place an order', returnUrl = null) {
        if (!this.isAuthenticated()) {
            this.showLoginRequiredModal(action, returnUrl);
            return false;
        }
        return true;
    }

    // Show login required modal
    showLoginRequiredModal(action, returnUrl = null) {
        // Store return URL for after login
        if (returnUrl) {
            this.returnUrl = returnUrl;
            localStorage.setItem('garamdoodh_return_url', returnUrl);
        } else {
            this.returnUrl = window.location.href;
            localStorage.setItem('garamdoodh_return_url', window.location.href);
        }

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'auth-required-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Login Required</h3>
                        <button class="modal-close" onclick="this.closest('.auth-required-modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="login-icon">
                            <i class="fas fa-lock"></i>
                        </div>
                        <p>You need to be logged in to ${action}.</p>
                        <p>Please login to continue with your order.</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="this.closest('.auth-required-modal').remove()">
                            Cancel
                        </button>
                        <button class="btn-primary" onclick="window.location.href='login.html'">
                            <i class="fas fa-sign-in-alt"></i> Login Now
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Close modal when clicking overlay
        modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                modal.remove();
            }
        });

        // Add modal styles if not already added
        this.addModalStyles();
    }

    // Add modal styles
    addModalStyles() {
        if (document.getElementById('auth-modal-styles')) return;

        const style = document.createElement('style');
        style.id = 'auth-modal-styles';
        style.textContent = `
            .auth-required-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                font-family: var(--font-primary, 'Inter', sans-serif);
            }

            .auth-required-modal .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                backdrop-filter: blur(4px);
            }

            .auth-required-modal .modal-content {
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                max-width: 400px;
                width: 100%;
                max-height: 90vh;
                overflow: hidden;
                animation: modalSlideIn 0.3s ease-out;
            }

            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            .auth-required-modal .modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 20px 24px 16px;
                border-bottom: 1px solid #e5e7eb;
            }

            .auth-required-modal .modal-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #111827;
            }

            .auth-required-modal .modal-close {
                background: none;
                border: none;
                font-size: 18px;
                color: #6b7280;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .auth-required-modal .modal-close:hover {
                background: #f3f4f6;
                color: #374151;
            }

            .auth-required-modal .modal-body {
                padding: 24px;
                text-align: center;
            }

            .auth-required-modal .login-icon {
                width: 64px;
                height: 64px;
                background: linear-gradient(135deg, #4F46E5, #6366F1);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 16px;
                color: white;
                font-size: 24px;
            }

            .auth-required-modal .modal-body p {
                margin: 0 0 12px;
                color: #374151;
                line-height: 1.5;
            }

            .auth-required-modal .modal-body p:last-child {
                margin-bottom: 0;
                color: #6b7280;
                font-size: 14px;
            }

            .auth-required-modal .modal-footer {
                display: flex;
                gap: 12px;
                padding: 16px 24px 24px;
                justify-content: flex-end;
            }

            .auth-required-modal .btn-secondary {
                padding: 10px 20px;
                background: #f3f4f6;
                color: #374151;
                border: none;
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .auth-required-modal .btn-secondary:hover {
                background: #e5e7eb;
            }

            .auth-required-modal .btn-primary {
                padding: 10px 20px;
                background: linear-gradient(135deg, #4F46E5, #6366F1);
                color: white;
                border: none;
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .auth-required-modal .btn-primary:hover {
                background: linear-gradient(135deg, #3730A3, #4F46E5);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
            }

            @media (max-width: 480px) {
                .auth-required-modal .modal-content {
                    margin: 10px;
                    max-width: none;
                }
                
                .auth-required-modal .modal-footer {
                    flex-direction: column;
                }
                
                .auth-required-modal .btn-secondary,
                .auth-required-modal .btn-primary {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Handle return URL after login
    handleReturnUrl() {
        const returnUrl = localStorage.getItem('garamdoodh_return_url');
        if (returnUrl && this.isAuthenticated()) {
            // Clear return URL
            localStorage.removeItem('garamdoodh_return_url');
            
            // Show success message
            this.showNotification('Login successful! Redirecting...', 'success');
            
            // Redirect after short delay
            setTimeout(() => {
                window.location.href = returnUrl;
            }, 1500);
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.auth-guard-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `auth-guard-notification fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transform transition-all duration-300 translate-x-full`;
        
        // Set colors based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#4F46E5'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Setup order protection for various elements
    setupOrderProtection() {
        // Protect "Order Now" buttons
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a, button');
            if (!target) return;

            // Check for order-related buttons/links
            const orderTexts = ['order now', 'checkout', 'place order', 'proceed to checkout', 'buy now'];
            const buttonText = target.textContent.toLowerCase().trim();
            const href = target.getAttribute('href');
            
            // Check if it's an order action
            const isOrderAction = orderTexts.some(text => 
                buttonText.includes(text) || 
                (href && href.includes('cart')) ||
                target.id === 'checkout-btn' ||
                target.classList.contains('checkout-btn') ||
                target.classList.contains('order-btn')
            );

            if (isOrderAction) {
                // If user is not authenticated, block the action and show login modal
                if (!this.requireAuth('place an order', window.location.href)) {
                    e.preventDefault();
                    return;
                }

                // If authenticated, allow the native action to proceed (form submit / link navigation / button click).
                // Do not call e.preventDefault() here so event listeners (e.g. form submit) run normally.
            }
        });
    }

    // Protect specific functions
    protectFunction(originalFunction, action = 'perform this action') {
        return (...args) => {
            if (!this.requireAuth(action)) {
                return Promise.reject(new Error('Authentication required'));
            }
            return originalFunction.apply(this, args);
        };
    }
}

// Initialize auth guard when DOM is loaded
let authGuard;
document.addEventListener('DOMContentLoaded', () => {
    authGuard = new AuthGuard();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthGuard;
}
