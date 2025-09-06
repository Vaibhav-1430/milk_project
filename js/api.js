// API Integration for GaramDoodh Frontend
class GaramDoodhAPI {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.token = localStorage.getItem('garamdoodh_token');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        localStorage.setItem('garamdoodh_token', token);
    }

    // Remove authentication token
    removeToken() {
        this.token = null;
        localStorage.removeItem('garamdoodh_token');
    }

    // Make API request
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add authorization header if token exists
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Authentication APIs
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (response.success && response.data.token) {
            this.setToken(response.data.token);
        }
        
        return response;
    }

    async logout() {
        this.removeToken();
        // Redirect to home page
        window.location.href = 'index.html';
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    async updateProfile(profileData) {
        return this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    // Product APIs
    async getProducts(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/products?${queryParams}` : '/products';
        return this.request(endpoint);
    }

    async getFeaturedProducts() {
        return this.request('/products/featured');
    }

    async getProduct(id) {
        return this.request(`/products/${id}`);
    }

    // Order APIs
    async createOrder(orderData) {
        return this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async getOrders(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/orders?${queryParams}` : '/orders';
        return this.request(endpoint);
    }

    async getOrder(id) {
        return this.request(`/orders/${id}`);
    }

    async cancelOrder(id, reason = '') {
        return this.request(`/orders/${id}/cancel`, {
            method: 'PUT',
            body: JSON.stringify({ reason })
        });
    }

    // Payment APIs
    async createPaymentOrder(amount, orderId) {
        return this.request('/payments/create-order', {
            method: 'POST',
            body: JSON.stringify({ amount, orderId })
        });
    }

    async verifyPayment(paymentData) {
        return this.request('/payments/verify', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    async confirmCOD(orderId) {
        return this.request('/payments/cod-confirm', {
            method: 'POST',
            body: JSON.stringify({ orderId })
        });
    }

    async getRazorpayKey() {
        return this.request('/payments/razorpay-key');
    }

    // Utility methods
    isAuthenticated() {
        return !!this.token;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(price);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatDateTime(date) {
        return new Date(date).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Initialize API instance
const api = new GaramDoodhAPI();

// Authentication helper functions
async function checkAuth() {
    if (api.isAuthenticated()) {
        try {
            const response = await api.getCurrentUser();
            if (response.success) {
                return response.data.user;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            api.removeToken();
        }
    }
    return null;
}

async function requireAuth() {
    const user = await checkAuth();
    if (!user) {
        // Redirect to login or show login modal
        showLoginModal();
        return null;
    }
    return user;
}

// Show login modal
function showLoginModal() {
    // Create login modal HTML
    const modalHTML = `
        <div id="login-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Login Required</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Please login to continue with your order.</p>
                    <div class="auth-buttons">
                        <button class="btn" onclick="showLoginForm()">Login</button>
                        <button class="btn btn-secondary" onclick="showRegisterForm()">Register</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listeners
    document.getElementById('login-modal').addEventListener('click', (e) => {
        if (e.target.id === 'login-modal' || e.target.classList.contains('modal-close')) {
            closeModal();
        }
    });
}

function closeModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.remove();
    }
}

// Show login form
function showLoginForm() {
    const modalBody = document.querySelector('#login-modal .modal-body');
    modalBody.innerHTML = `
        <form id="login-form">
            <div class="form-group">
                <label for="login-email">Email</label>
                <input type="email" id="login-email" required>
            </div>
            <div class="form-group">
                <label for="login-password">Password</label>
                <input type="password" id="login-password" required>
            </div>
            <button type="submit" class="btn">Login</button>
            <button type="button" class="btn btn-secondary" onclick="showRegisterForm()">Register Instead</button>
        </form>
    `;
    
    document.getElementById('login-form').addEventListener('submit', handleLogin);
}

// Show register form
function showRegisterForm() {
    const modalBody = document.querySelector('#login-modal .modal-body');
    modalBody.innerHTML = `
        <form id="register-form">
            <div class="form-group">
                <label for="register-name">Full Name</label>
                <input type="text" id="register-name" required>
            </div>
            <div class="form-group">
                <label for="register-email">Email</label>
                <input type="email" id="register-email" required>
            </div>
            <div class="form-group">
                <label for="register-phone">Phone Number</label>
                <input type="tel" id="register-phone" required>
            </div>
            <div class="form-group">
                <label for="register-password">Password</label>
                <input type="password" id="register-password" required>
            </div>
            <div class="form-group">
                <label for="register-customer-type">Customer Type</label>
                <select id="register-customer-type" required>
                    <option value="">Select Type</option>
                    <option value="outsider">Outsider</option>
                    <option value="college">College Student</option>
                </select>
            </div>
            <div class="form-group" id="hostel-group" style="display: none;">
                <label for="register-hostel">Hostel</label>
                <select id="register-hostel">
                    <option value="">Select Hostel</option>
                    <option value="boys-hostel-a">Vivekanand Hostel</option>
                    <option value="boys-hostel-b">Mandela Boys Hostel</option>
                    <option value="boys-hostel-c">Vardhman Hostel</option>
                    <option value="boys-hostel-d">Tagore Hostel</option>
                </select>
            </div>
            <button type="submit" class="btn">Register</button>
            <button type="button" class="btn btn-secondary" onclick="showLoginForm()">Login Instead</button>
        </form>
    `;
    
    // Show/hide hostel selection based on customer type
    document.getElementById('register-customer-type').addEventListener('change', (e) => {
        const hostelGroup = document.getElementById('hostel-group');
        hostelGroup.style.display = e.target.value === 'college' ? 'block' : 'none';
    });
    
    document.getElementById('register-form').addEventListener('submit', handleRegister);
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await api.login(email, password);
        if (response.success) {
            closeModal();
            // Refresh page or update UI
            location.reload();
        } else {
            alert('Login failed: ' + response.message);
        }
    } catch (error) {
        alert('Login error: ' + error.message);
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('register-name').value,
        email: document.getElementById('register-email').value,
        phone: document.getElementById('register-phone').value,
        password: document.getElementById('register-password').value,
        customerType: document.getElementById('register-customer-type').value,
        hostel: document.getElementById('register-hostel').value
    };
    
    try {
        const response = await api.register(formData);
        if (response.success) {
            closeModal();
            alert('Registration successful! Please login.');
            showLoginForm();
        } else {
            alert('Registration failed: ' + response.message);
        }
    } catch (error) {
        alert('Registration error: ' + error.message);
    }
}

// Export for use in other files
window.api = api;
window.checkAuth = checkAuth;
window.requireAuth = requireAuth;
