// login.js - Login page functionality for GaramDoodh (Fixed + Optimized)

class LoginManager {
  constructor() {
    // Match actual HTML element IDs
    this.form = document.getElementById("passwordLoginForm");
    this.submitBtn = this.form?.querySelector('button[type="submit"]');
    this.apiBase = this.getApiBaseUrl(); // Detect correct backend base URL

    this.init();
  }

  init() {
    if (!this.form) {
      console.error("❌ Login form not found. Check your form ID (should be 'passwordLoginForm').");
      return;
    }

    this.bindEvents();
    this.setupValidation();
  }

  // Detect backend base URL (works for local + Netlify)
  getApiBaseUrl() {
    if (window.location.hostname === "localhost") {
      // local development
      return "http://localhost:8888/.netlify/functions";
    }
    // production (Netlify)
    return "/.netlify/functions";
  }

  bindEvents() {
    this.form.addEventListener("submit", (e) => this.handleLogin(e));

    document.querySelectorAll(".input-field")?.forEach((input) => {
      input.addEventListener("focus", (e) => this.handleFocus(e));
      input.addEventListener("blur", (e) => this.handleBlur(e));
    });
  }

  setupValidation() {
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    if (emailInput) emailInput.addEventListener("input", () => this.validateEmail(emailInput));
    if (passwordInput) passwordInput.addEventListener("input", () => this.validatePassword(passwordInput));
  }

  handleFocus(e) {
    e.target.classList.add("ring-2", "ring-indigo-500", "ring-opacity-30");
  }

  handleBlur(e) {
    e.target.classList.remove("ring-2", "ring-indigo-500", "ring-opacity-30");
  }

  validateEmail(input) {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
    input.classList.toggle("border-green-500", valid);
    input.classList.toggle("border-red-500", !valid && input.value.length > 0);
    return valid;
  }

  validatePassword(input) {
    const valid = input.value.length >= 6;
    input.classList.toggle("border-green-500", valid);
    input.classList.toggle("border-red-500", !valid && input.value.length > 0);
    return valid;
  }

  validateForm(email, password) {
    if (!email || !password) {
      this.notify("Please fill in all fields", "error");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.notify("Please enter a valid email", "error");
      return false;
    }
    if (password.length < 6) {
      this.notify("Password must be at least 6 characters", "error");
      return false;
    }
    return true;
  }

  async handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!this.validateForm(email, password)) return;

    this.setButtonLoading(true, "Signing in...");

    try {
      // Check for admin demo credentials first
      if (email === 'admin@garamdoodh.com' && password === 'admin123') {
        await this.handleAdminLogin(email, password);
        return;
      }

      const res = await fetch(`${this.apiBase}/auth-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("📨 Login response:", data);

      if (res.ok && data.success) {
        // Check if user is admin
        if (data.data.user.role === 'admin') {
          await this.handleAdminLogin(email, password, data.data);
        } else {
          // Regular user login
          this.notify("Login successful! Redirecting...", "success");
          localStorage.setItem("garamdoodh_user", JSON.stringify(data.data.user));
          localStorage.setItem("garamdoodh_token", data.data.token);

          setTimeout(() => (window.location.href = "index.html"), 1500);
        }
      } else {
        this.notify(data.message || "Invalid credentials", "error");
      }
    } catch (err) {
      console.error("💥 Login Error:", err);
      this.notify("Network error. Please try again.", "error");
    } finally {
      this.setButtonLoading(false, "Sign In");
    }
  }

  async handleAdminLogin(email, password, userData = null) {
    try {
      this.notify("Admin login detected. Redirecting to admin portal...", "success");

      // Set up admin authentication
      const mockToken = 'admin-token-' + Date.now();
      const adminInfo = userData ? userData.user : {
        id: 'admin1',
        name: 'Admin User',
        email: email,
        role: 'admin',
        permissions: ['view_dashboard', 'manage_orders', 'manage_products', 'manage_customers', 'view_analytics', 'manage_settings']
      };

      localStorage.setItem('admin_token', userData ? userData.token : mockToken);
      localStorage.setItem('admin_info', JSON.stringify(adminInfo));

      // Redirect to admin portal
      setTimeout(() => {
        window.location.href = 'admin.html';
      }, 2000);
    } catch (error) {
      console.error('Admin login error:', error);
      this.notify('Admin login failed. Please try again.', 'error');
    }
  }

  // Loading Button Handler
  setButtonLoading(loading = true, label = "Sign In") {
    if (!this.submitBtn) return;
    if (loading) {
      this.submitBtn.disabled = true;
      this.submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${label}`;
    } else {
      this.submitBtn.disabled = false;
      this.submitBtn.innerHTML = `<i class="fas fa-sign-in-alt mr-2"></i>${label}`;
    }
  }

  // Universal Notification System
  notify(message, type = "info") {
    const existing = document.querySelector(".notification");
    if (existing) existing.remove();

    const div = document.createElement("div");
    div.className =
      "notification fixed top-4 right-4 z-50 px-5 py-3 rounded-lg text-white font-medium shadow-lg transition-all transform translate-x-full";
    div.style.backgroundColor =
      type === "success"
        ? "#22c55e"
        : type === "error"
        ? "#ef4444"
        : "#4f46e5";
    div.textContent = message;
    document.body.appendChild(div);

    setTimeout(() => (div.style.transform = "translateX(0)"), 100);
    setTimeout(() => {
      div.style.transform = "translateX(100%)";
      setTimeout(() => div.remove(), 300);
    }, 3000);
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => new LoginManager());
