/**
 * OTP Login Functionality
 * Handles the OTP-based authentication flow
 */

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const passwordTabBtn = document.getElementById('passwordTabBtn');
    const otpTabBtn = document.getElementById('otpTabBtn');
    const passwordLoginForm = document.getElementById('passwordLoginForm');
    const otpLoginForm = document.getElementById('otpLoginForm');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const otpInputContainer = document.getElementById('otpInputContainer');
    const otpTimer = document.getElementById('otpTimer');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    
    // Tab switching functionality
    passwordTabBtn.addEventListener('click', () => {
        passwordTabBtn.classList.add('border-primary', 'text-primary');
        passwordTabBtn.classList.remove('border-transparent', 'text-muted');
        otpTabBtn.classList.remove('border-primary', 'text-primary');
        otpTabBtn.classList.add('border-transparent', 'text-muted');
        
        passwordLoginForm.classList.remove('hidden');
        otpLoginForm.classList.add('hidden');
    });
    
    otpTabBtn.addEventListener('click', () => {
        otpTabBtn.classList.add('border-primary', 'text-primary');
        otpTabBtn.classList.remove('border-transparent', 'text-muted');
        passwordTabBtn.classList.remove('border-primary', 'text-primary');
        passwordTabBtn.classList.add('border-transparent', 'text-muted');
        
        otpLoginForm.classList.remove('hidden');
        passwordLoginForm.classList.add('hidden');
    });
    
    // Send OTP functionality
    sendOtpBtn.addEventListener('click', async () => {
        const email = document.getElementById('otpEmail').value;
        
        if (!email) {
            showNotification('Please enter your email address', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        try {
            sendOtpBtn.disabled = true;
            sendOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';
            
            const response = await fetch('/.netlify/functions/auth-otp-generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showNotification('OTP sent to your email', 'success');
                otpInputContainer.classList.remove('hidden');
                startOtpTimer();
            } else {
                showNotification(data.message || 'Failed to send OTP', 'error');
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            showNotification('An error occurred. Please try again.', 'error');
        } finally {
            sendOtpBtn.disabled = false;
            sendOtpBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Send OTP';
        }
    });
    
    // OTP verification form submission
    otpLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('otpEmail').value;
        const otp = document.getElementById('otpCode').value;
        const verifyOtpBtn = document.getElementById('verifyOtpBtn');
        
        if (!otp || otp.length !== 6) {
            showNotification('Please enter a valid 6-digit OTP', 'error');
            return;
        }
        
        try {
            verifyOtpBtn.disabled = true;
            verifyOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verifying...';
            
            const response = await fetch('/.netlify/functions/auth-otp-verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, otp })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showNotification('Login successful!', 'success');
                
                // Save auth token and user data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1000);
            } else {
                showNotification(data.message || 'Invalid or expired OTP', 'error');
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            showNotification('An error occurred. Please try again.', 'error');
        } finally {
            verifyOtpBtn.disabled = false;
            verifyOtpBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Verify & Login';
        }
    });
    
    // Resend OTP functionality
    resendOtpBtn.addEventListener('click', async () => {
        const email = document.getElementById('otpEmail').value;
        
        try {
            resendOtpBtn.disabled = true;
            
            const response = await fetch('/.netlify/functions/auth-otp-generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showNotification('New OTP sent to your email', 'success');
                startOtpTimer();
            } else {
                showNotification(data.message || 'Failed to resend OTP', 'error');
            }
        } catch (error) {
            console.error('Error resending OTP:', error);
            showNotification('An error occurred. Please try again.', 'error');
        }
    });
    
    // Helper functions
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function showNotification(message, type = 'info') {
        // Check if notification container exists, if not create it
        let notificationContainer = document.getElementById('notification-container');
        
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.className = 'fixed top-4 right-4 z-50';
            document.body.appendChild(notificationContainer);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification p-4 mb-4 rounded-lg shadow-lg flex items-center max-w-md transform transition-all duration-300 ease-in-out translate-x-full`;
        
        // Set background color based on type
        if (type === 'success') {
            notification.classList.add('bg-green-100', 'border-l-4', 'border-green-500', 'text-green-700');
        } else if (type === 'error') {
            notification.classList.add('bg-red-100', 'border-l-4', 'border-red-500', 'text-red-700');
        } else {
            notification.classList.add('bg-blue-100', 'border-l-4', 'border-blue-500', 'text-blue-700');
        }
        
        // Set icon based on type
        let icon;
        if (type === 'success') {
            icon = '<i class="fas fa-check-circle text-green-500 mr-3 text-xl"></i>';
        } else if (type === 'error') {
            icon = '<i class="fas fa-exclamation-circle text-red-500 mr-3 text-xl"></i>';
        } else {
            icon = '<i class="fas fa-info-circle text-blue-500 mr-3 text-xl"></i>';
        }
        
        // Set notification content
        notification.innerHTML = `
            ${icon}
            <div class="flex-1">${message}</div>
            <button class="ml-4 text-gray-400 hover:text-gray-500 focus:outline-none">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add notification to container
        notificationContainer.appendChild(notification);
        
        // Animate notification
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 10);
        
        // Add click event to close button
        const closeButton = notification.querySelector('button');
        closeButton.addEventListener('click', () => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('translate-x-full');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }
    
    // OTP timer functionality
    let timerInterval;
    
    function startOtpTimer() {
        // Clear any existing timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        // Enable resend button after 30 seconds
        setTimeout(() => {
            resendOtpBtn.disabled = false;
        }, 30000);
        
        // Set timer for 5 minutes (300 seconds)
        let timeLeft = 300;
        
        // Update timer text
        updateTimerText(timeLeft);
        
        // Start interval
        timerInterval = setInterval(() => {
            timeLeft--;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                otpTimer.textContent = 'OTP expired';
                otpTimer.classList.add('text-red-500');
            } else {
                updateTimerText(timeLeft);
            }
        }, 1000);
    }
    
    function updateTimerText(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        otpTimer.textContent = `OTP expires in: ${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
        otpTimer.classList.remove('text-red-500');
    }
});