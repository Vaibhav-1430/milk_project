// API Integration for GaramDoodh Frontend
class GaramDoodhAPI {
    constructor() {
        const isLocalHost =
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1" ||
            window.location.protocol === "file:";

        this.baseURL = "/.netlify/functions";

        this.token = localStorage.getItem("garamdoodh_token");
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem("garamdoodh_token", token);
    }

    removeToken() {
        this.token = null;
        localStorage.removeItem("garamdoodh_token");
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const attempt = async (attemptNo) => {
            const controller = new AbortController();
            const baseTimeout = typeof options.timeoutMs === "number" ? options.timeoutMs : 60000;
            const timeoutMs = attemptNo === 1 ? baseTimeout : Math.max(baseTimeout, 90000); // retry waits longer
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const config = {
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            mode: "cors",
            credentials: "omit",
            signal: controller.signal,
            cache: "no-store",
            referrerPolicy: "no-referrer",
            ...options,
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            clearTimeout(timeoutId);
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (_) {
                data = { message: text || "Unknown error" };
            }

            if (!response.ok) {
                const msg =
                    Array.isArray(data.errors) && data.errors.length
                        ? `${data.message || "Request failed"}: ${data.errors
                              .map((e) => e.msg)
                              .join(", ")}`
                        : data.message || "API request failed";
                throw new Error(msg);
            }

            return data;
        } catch (error) {
            const isAbort = error?.name === "AbortError";
            const message = isAbort ? "Network timeout. Please try again." : (error?.message || "Network error");
            if (attemptNo === 1) {
                // Retry once after a short delay
                await new Promise(r => setTimeout(r, 500));
                return attempt(2);
            }
            console.error("API Error:", message);
            throw new Error(message);
        }
        };

        return attempt(1);
    }

    // Warm up server (prevents cold-start timeouts on Railway)
    async warmUp() {
        try {
            await this.request("/health", { method: "GET", timeoutMs: 5000 });
        } catch (_) {
            // ignore warmup failures
        }
    }

    // ---------- Authentication ----------
    async register(userData) {
        return this.request("/auth/register", {
            method: "POST",
            body: JSON.stringify(userData),
        });
    }

    async login(email, password) {
        const response = await this.request("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });

        if (response.success && response.data.token) {
            this.setToken(response.data.token);
        }

        return response;
    }

    async logout() {
        this.removeToken();
        window.location.href = "index.html";
    }

    async getCurrentUser() {
        return this.request("/auth/me");
    }

    async updateProfile(profileData) {
        return this.request("/auth/profile", {
            method: "PUT",
            body: JSON.stringify(profileData),
        });
    }

    // ---------- Products ----------
    async getProducts(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams
            ? `/products?${queryParams}`
            : "/products";
        return this.request(endpoint);
    }

    async getFeaturedProducts() {
        return this.request("/products-featured");
    }

    async getProduct(id) {
        return this.request(`/product-get/${id}`);
    }

    // ---------- Orders ----------
    async createOrder(orderData) {
        // Protected (logged-in users)
        return this.request("/orders", {
            method: "POST",
            body: JSON.stringify(orderData),
        });
    }

    async createGuestOrder(orderData) {
        // Always call Railway API directly
        return this.request("/orders-guest", {
            method: "POST",
            body: JSON.stringify(orderData),
            timeoutMs: 30000,
        });
    }

    async getOrders(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/orders?${queryParams}` : "/orders";
        return this.request(endpoint);
    }

    async getOrder(id) {
        return this.request(`/orders/${id}`);
    }

    async cancelOrder(id, reason = "") {
        return this.request(`/orders/${id}/cancel`, {
            method: "PUT",
            body: JSON.stringify({ reason }),
        });
    }

    // ---------- Payments ----------
    async createPaymentOrder(amount, orderId) {
        return this.request("/payments-create-order", {
            method: "POST",
            body: JSON.stringify({ amount, orderId }),
        });
    }

    async verifyPayment(paymentData) {
        return this.request("/payments-verify", {
            method: "POST",
            body: JSON.stringify(paymentData),
        });
    }

    async confirmCOD(orderId) {
        return this.request("/payments-cod-confirm", {
            method: "POST",
            body: JSON.stringify({ orderId }),
        });
    }

    async getRazorpayKey() {
        return this.request("/payments-razorpay-key");
    }

    // ---------- Utilities ----------
    isAuthenticated() {
        return !!this.token;
    }

    formatPrice(price) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(price);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    formatDateTime(date) {
        return new Date(date).toLocaleString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
}

const api = new GaramDoodhAPI();
window.api = api;
