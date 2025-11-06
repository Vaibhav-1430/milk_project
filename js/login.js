// login.js - Enhanced Login page functionality for GaramDoodh with OTP and Admin support

class LoginManager {
  constructor() {
    // Form elements
    this.passwordForm = document.getElementById("passwordLoginForm");
    this.otpForm = document.getElementById("otpLoginForm");
    this.apiBase = this.getApiBaseUrl();
    
    // State management
    this.currentLoginMethod = 'password';
    this.otpTimer = null;
    this.otpExpiryTime = null;

    this.init();
  }

  init() {
    if (!this.passwordForm || !this.otpForm) {
      console.error("❌ Login forms not found.");
      return;
    }

    this.bindEvents();
    this.setupValidation();
    this.setupTabs();
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
    // Password form events
    this.passwordForm.addEventListener("submit", (e) => this.handlePasswordLogin(e));
    
    // OTP form events
    this.otpForm.addEventListener("submit", (e) => this.handleOtpVerification(e));
    document.getElementById("sendOtpBtn").addEventListener("click", (e) => this.handleSendOtp(e));
    document.getElementById("resendOtpLink").addEventListener("click", (e) => this.handleResendOtp(e));
    
    // Password toggle
    const togglePassword = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("password");
    const passwordIcon = document.getElementById("passwordIcon");
    
    if (togglePassword) {
      togglePassword.addEventListener("click", () => {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);
        passwordIcon.className = type === "password" ? "fas fa-eye" : "fas fa-eye-slash";
      });
    }
    
    // Admin demo button
    const adminDemoBtn = document.getElementById("adminDemoBtn");
    if (adminDemoBtn) {
      adminDemoBtn.addEventListener("click", () => this.useAdminCredentials());
    }

    // Input field styling
    document.querySelectorAll(".form-input")?.forEach((input) => {
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

  // Setup tab functionality
  setupTabs() {
    const passwordTab = document.getElementById("passwordTab");
    const otpTab = document.getElementById("otpTab");
    const passwordForm = document.getElementById("passwordLoginForm");
    const otpForm = document.getElementById("otpLoginForm");

    passwordTab.addEventListener("click", () => {
      this.switchTab('password', passwordTab, otpTab, passwordForm, otpForm);
    });

    otpTab.addEventListener("click", () => {
      this.switchTab('otp', otpTab, passwordTab, otpForm, passwordForm);
    });
  }

  switchTab(method, activeTab, inactiveTab, activeForm, inactiveForm) {
    this.currentLoginMethod = method;
    
    // Update tab appearance
    activeTab.classList.add('active');
    inactiveTab.classList.remove('active');
    
    // Show/hide forms
    activeForm.classList.remove('hidden');
    inactiveForm.classList.add('hidden');
    
    // Clear any alerts
    this.hideAlert();
  }

  // Password login handler
  async handlePasswordLogin(e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!this.validateForm(email, password)) return;

    this.setButtonLoading("passwordLoginBtn", "passwordLoginBtnText", true, "Signing in...");

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
          this.showAlert("Login successful! Redirecting...", "success");
          localStorage.setItem("garamdoodh_user", JSON.stringify(data.data.user));
          localStorage.setItem("garamdoodh_token", data.data.token);

          setTimeout(() => (window.location.href = "index.html"), 1500);
        }
      } else {
        this.showAlert(data.message || "Invalid credentials", "error");
      }
    } catch (err) {
      console.error("💥 Login Error:", err);
      this.showAlert("Network error. Please try again.", "error");
    } finally {
      this.setButtonLoading("passwordLoginBtn", "passwordLoginBtnText", false, "Sign In");
    }
  }

  // Send OTP handler
  async handleSendOtp(e) {
    e.preventDefault();

    const email = document.getElementById("otpEmail").value.trim();

    if (!email) {
      this.showAlert("Please enter your email address", "error");
      return;
    }

    if (!this.validateEmail(document.getElementById("otpEmail"))) {
      this.showAlert("Please enter a valid email address", "error");
      return;
    }

    this.setButtonLoading("sendOtpBtn", "sendOtpBtnText", true, "Sending OTP...");

    try {
      const res = await fetch(`${this.apiBase}/auth-otp-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      console.log("📨 OTP response:", data);

      if (res.ok && data.success) {
        this.showAlert("OTP sent successfully! Check your email.", "success");
        this.showOtpVerificationSection();
        this.startOtpTimer(300); // 5 minutes
      } else {
        this.showAlert(data.message || "Failed to send OTP", "error");
      }
    } catch (err) {
      console.error("💥 OTP Error:", err);
      this.showAlert("Network error. Please try again.", "error");
    } finally {
      this.setButtonLoading("sendOtpBtn", "sendOtpBtnText", false, "Send OTP");
    }
  }

  // Verify OTP handler
  async handleOtpVerification(e) {
    e.preventDefault();

    const email = document.getElementById("otpEmail").value.trim();
    const otp = document.getElementById("otpCode").value.trim();

    if (!email || !otp) {
      this.showAlert("Please enter both email and OTP", "error");
      return;
    }

    if (otp.length !== 6) {
      this.showAlert("Please enter a valid 6-digit OTP", "error");
      return;
    }

    this.setButtonLoading("verifyOtpBtn", "verifyOtpBtnText", true, "Verifying...");

    try {
      const res = await fetch(`${this.apiBase}/auth-otp-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      console.log("📨 OTP verification response:", data);

      if (res.ok && data.success) {
        // Check if user is admin
        if (data.data.user.role === 'admin') {
          await this.handleAdminLogin(email, null, data.data);
        } else {
          // Regular user login
          this.showAlert("Login successful! Redirecting...", "success");
          localStorage.setItem("garamdoodh_user", JSON.stringify(data.data.user));
          localStorage.setItem("garamdoodh_token", data.data.token);

          setTimeout(() => (window.location.href = "index.html"), 1500);
        }
      } else {
        this.showAlert(data.message || "Invalid or expired OTP", "error");
      }
    } catch (err) {
      console.error("💥 OTP Verification Error:", err);
      this.showAlert("Network error. Please try again.", "error");
    } finally {
      this.setButtonLoading("verifyOtpBtn", "verifyOtpBtnText", false, "Verify OTP");
    }
  }

  // Resend OTP handler
  async handleResendOtp(e) {
    e.preventDefault();
    await this.handleSendOtp(e);
  }

  // Admin login handler
  async handleAdminLogin(email, password, userData = null) {
    try {
      this.showAlert("Admin login detected. Redirecting to admin portal...", "success");

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
      this.showAlert('Admin login failed. Please try again.', 'error');
    }
  }

  // Use admin credentials
  useAdminCredentials() {
    // Switch to password tab
    const passwordTab = document.getElementById("passwordTab");
    const otpTab = document.getElementById("otpTab");
    const passwordForm = document.getElementById("passwordLoginForm");
    const otpForm = document.getElementById("otpLoginForm");
    
    this.switchTab('password', passwordTab, otpTab, passwordForm, otpForm);
    
    // Fill in admin credentials
    document.getElementById("email").value = 'admin@garamdoodh.com';
    document.getElementById("password").value = 'admin123';
    
    this.showAlert('Admin demo credentials loaded. Click Sign In to continue.', 'info');
  }

  // Show OTP verification section
  showOtpVerificationSection() {
    const section = document.getElementById("otpVerificationSection");
    section.classList.remove("hidden");
    document.getElementById("otpCode").focus();
  }

  // Start OTP timer
  startOtpTimer(seconds) {
    this.clearOtpTimer();
    
    this.otpExpiryTime = Date.now() + (seconds * 1000);
    const timerElement = document.getElementById("otpTimer");
    const resendLink = document.getElementById("resendOtpLink");
    
    resendLink.classList.add("hidden");
    
    this.otpTimer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((this.otpExpiryTime - Date.now()) / 1000));
      
      if (remaining > 0) {
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        timerElement.textContent = `OTP expires in ${minutes}:${seconds.toString().padStart(2, '0')}`;
      } else {
        timerElement.textContent = "OTP expired";
        resendLink.classList.remove("hidden");
        this.clearOtpTimer();
      }
    }, 1000);
  }

  // Clear OTP timer
  clearOtpTimer() {
    if (this.otpTimer) {
      clearInterval(this.otpTimer);
      this.otpTimer = null;
    }
  }

  // Loading Button Handler
  setButtonLoading(btnId, textId, loading = true, label = "Sign In") {
    const btn = document.getElementById(btnId);
    const textElement = document.getElementById(textId);
    
    if (!btn || !textElement) return;
    
    if (loading) {
      btn.disabled = true;
      textElement.innerHTML = `<span class="loading-spinner"></span>${label}`;
    } else {
      btn.disabled = false;
      textElement.textContent = label;
    }
  }

  // Alert system
  showAlert(message, type = "info") {
    const alertElement = document.getElementById("alertMessage");
    if (!alertElement) return;
    
    alertElement.className = `alert alert-${type}`;
    alertElement.textContent = message;
    alertElement.style.display = "block";
    
    // Auto-hide success and info messages
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        this.hideAlert();
      }, 5000);
    }
  }

  hideAlert() {
    const alertElement = document.getElementById("alertMessage");
    if (alertElement) {
      alertElement.style.display = "none";
    }
  }

  // Universal Notification System (legacy support)
  notify(message, type = "info") {
    this.showAlert(message, type);
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => new LoginManager());
