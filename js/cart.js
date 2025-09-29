// Cart functionality
let cart = [];
let glassBottleAddon = false; // ₹7 add-on state
let appliedCoupon = null; // Store applied coupon data

// Define products array if it's not already defined
let products;
if (typeof window.products === 'undefined') {
    products = [
        { id: 1, name: 'Fresh Boiled Milk', quantity: '100 ml', price: 17, image: 'images/garam-doodh-logo.png' },
        { id: 2, name: 'Fresh Boiled Milk', quantity: '250 ml', price: 32, image: 'images/garam-doodh-logo.png' },
        { id: 3, name: 'Fresh Boiled Milk', quantity: '500 ml', price: 52, image: 'images/garam-doodh-logo.png' },
        { id: 4, name: 'Fresh Boiled Milk', quantity: '1 L', price: 92, image: 'images/garam-doodh-logo.png' },
        { id: 5, name: 'Fresh Boiled Milk', quantity: '2 L', price: 172, image: 'images/garam-doodh-logo.png' },
        { id: 6, name: 'Fresh Boiled Milk', quantity: '5 L', price: 402, image: 'images/garam-doodh-logo.png' }
    ];
} else {
    products = window.products;
}

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('garamdoodhCart');
    const savedAddon = localStorage.getItem('garamdoodhGlassBottleAddon');
    const savedCoupon = localStorage.getItem('garamdoodhAppliedCoupon');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
    glassBottleAddon = savedAddon === 'true';
    appliedCoupon = savedCoupon ? JSON.parse(savedCoupon) : null;
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('garamdoodhCart', JSON.stringify(cart));
    localStorage.setItem('garamdoodhGlassBottleAddon', String(glassBottleAddon));
    localStorage.setItem('garamdoodhAppliedCoupon', appliedCoupon ? JSON.stringify(appliedCoupon) : '');
    updateCartCount();
}

// Update cart count in header
function updateCartCount() {
    const cartCountElements = document.querySelectorAll('#cart-count');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

    cartCountElements.forEach(element => {
        element.textContent = totalItems;
    });
}

// Add item to cart
function addToCart(productId, quantity) {
    const product = window.products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            quantity: quantity,
            price: product.price,
            image: product.image,
            productQuantity: product.quantity
        });
    }

    saveCart();
}

// Remove item from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    displayCart();
}

// Update item quantity in cart
function updateCartItemQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = quantity;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            displayCart();
        }
    }
}

// Calculate cart totals
function calculateCartTotals() {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const deliveryFee = 0;
    const addonFee = glassBottleAddon ? 7 : 0;
    
    // Calculate coupon discount
    let couponDiscount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.type === 'percentage') {
            couponDiscount = (subtotal + addonFee) * (appliedCoupon.value / 100);
        } else if (appliedCoupon.type === 'fixed') {
            couponDiscount = appliedCoupon.value;
        }
        // Ensure discount doesn't exceed total
        couponDiscount = Math.min(couponDiscount, subtotal + addonFee);
    }
    
    const total = subtotal + deliveryFee + addonFee - couponDiscount;

    return { subtotal, deliveryFee, addonFee, couponDiscount, total };
}

// Display cart items
function displayCart() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartEmptyMessage = document.getElementById('cart-empty-message');
    const cartSummary = document.getElementById('cart-summary');

    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.classList.add('hidden');
        cartSummary.classList.add('hidden');
        cartEmptyMessage.classList.remove('hidden');
        return;
    }

    cartItemsContainer.classList.remove('hidden');
    cartSummary.classList.remove('hidden');
    cartEmptyMessage.classList.add('hidden');

    cartItemsContainer.innerHTML = '';

    cart.forEach(item => {
        cartItemsContainer.innerHTML += `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}" onerror="this.onerror=null; this.src='images/logo.svg';">
                </div>
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <p>${item.productQuantity}</p>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn decrease">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="20">
                    <button class="quantity-btn increase">+</button>
                </div>
                <div class="cart-item-price">₹${(item.price * item.quantity).toFixed(2)}</div>
                <button class="remove-item"><i class="fas fa-trash"></i></button>
            </div>
        `;
    });

    addCartEventListeners();

    // sync addon checkbox if present
    const addonCheckbox = document.getElementById('glass-bottle-addon');
    if (addonCheckbox) {
        addonCheckbox.checked = glassBottleAddon;
        addonCheckbox.addEventListener('change', function() {
            glassBottleAddon = this.checked;
            localStorage.setItem('garamdoodhGlassBottleAddon', String(glassBottleAddon));
            updateCartTotals();
        });
    }

    updateCartTotals();
}

// Update totals in UI
function updateCartTotals() {
    const { subtotal, deliveryFee, addonFee, couponDiscount, total } = calculateCartTotals();

    const subEl = document.getElementById('cart-subtotal');
    const delEl = document.getElementById('delivery-fee');
    const totEl = document.getElementById('cart-total');
    const couponDiscountEl = document.getElementById('coupon-discount-amount');
    const couponDiscountRow = document.getElementById('coupon-discount-row');

    if (subEl) subEl.textContent = `₹${subtotal.toFixed(2)}`;
    if (delEl) delEl.textContent = `₹${deliveryFee.toFixed(2)}`;
    if (totEl) totEl.textContent = `₹${total.toFixed(2)}`;
    
    // Show/hide coupon discount row
    if (couponDiscountRow) {
        if (couponDiscount > 0) {
            couponDiscountRow.classList.remove('hidden');
            if (couponDiscountEl) couponDiscountEl.textContent = `-₹${couponDiscount.toFixed(2)}`;
        } else {
            couponDiscountRow.classList.add('hidden');
        }
    }

    // Reflect addon on checkout panel if available
    const checkoutAddonRow = document.getElementById('checkout-addon-fee');
    if (checkoutAddonRow) {
        checkoutAddonRow.textContent = `₹${addonFee.toFixed(2)}`;
    }
}

// Add event listeners
function addCartEventListeners() {
    document.querySelectorAll('.cart-item .quantity-btn').forEach(button => {
        button.addEventListener('click', function () {
            const cartItem = this.closest('.cart-item');
            const productId = parseInt(cartItem.dataset.id);
            const input = cartItem.querySelector('.quantity-input');
            let value = parseInt(input.value);

            if (this.classList.contains('increase')) {
                value = Math.min(value + 1, 20);
            } else {
                value = Math.max(value - 1, 1);
            }

            input.value = value;
            updateCartItemQuantity(productId, value);
        });
    });

    document.querySelectorAll('.cart-item .quantity-input').forEach(input => {
        input.addEventListener('change', function () {
            const cartItem = this.closest('.cart-item');
            const productId = parseInt(cartItem.dataset.id);
            let value = parseInt(this.value);

            value = Math.max(1, Math.min(value, 20));
            this.value = value;

            updateCartItemQuantity(productId, value);
        });
    });

    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function () {
            const cartItem = this.closest('.cart-item');
            const productId = parseInt(cartItem.dataset.id);

            removeFromCart(productId);
        });
    });
}

// ---------- Coupon Functions ----------
async function validateCoupon(couponCode) {
    try {
        const { subtotal, addonFee } = calculateCartTotals();
        const orderAmount = subtotal + addonFee;
        
        const response = await fetch('/.netlify/functions/validate-coupon', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                couponCode: couponCode,
                orderAmount: orderAmount
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.valid) {
            return { 
                valid: true, 
                coupon: { 
                    ...result.coupon, 
                    code: couponCode.toUpperCase() 
                } 
            };
        } else {
            return { valid: false, message: result.message || 'Invalid coupon code' };
        }
    } catch (error) {
        console.error('Coupon validation error:', error);
        // Fallback to client-side validation if API fails
        return validateCouponFallback(couponCode);
    }
}

// Fallback client-side validation
function validateCouponFallback(couponCode) {
    const validCoupons = {
        'WELCOME10': { type: 'percentage', value: 10, description: '10% off on your first order' },
        'SAVE20': { type: 'fixed', value: 20, description: '₹20 off on orders above ₹100' },
        'MILK15': { type: 'percentage', value: 15, description: '15% off on milk orders' },
        'FIRST50': { type: 'fixed', value: 50, description: '₹50 off on orders above ₹200' },
        // Hidden special coupon - not shown in suggestions
        'LILY': { type: 'percentage', value: 100, description: 'Special 100% off' }
    };
    
    const coupon = validCoupons[couponCode.toUpperCase()];
    if (!coupon) {
        return { valid: false, message: 'Invalid coupon code' };
    }
    
    // Check minimum order amount for fixed discounts
    const { subtotal, addonFee } = calculateCartTotals();
    const orderTotal = subtotal + addonFee;
    
    if (coupon.type === 'fixed' && couponCode.toUpperCase() === 'SAVE20' && orderTotal < 100) {
        return { valid: false, message: 'Minimum order amount of ₹100 required for this coupon' };
    }
    
    if (coupon.type === 'fixed' && couponCode.toUpperCase() === 'FIRST50' && orderTotal < 200) {
        return { valid: false, message: 'Minimum order amount of ₹200 required for this coupon' };
    }
    
    return { valid: true, coupon: { ...coupon, code: couponCode.toUpperCase() } };
}

function applyCoupon() {
    const couponInput = document.getElementById('coupon-code');
    const applyBtn = document.getElementById('apply-coupon-btn');
    const messageEl = document.getElementById('coupon-message');
    
    if (!couponInput || !applyBtn || !messageEl) return;
    
    const couponCode = couponInput.value.trim();
    if (!couponCode) {
        showCouponMessage('Please enter a coupon code', 'error');
        return;
    }
    
    applyBtn.disabled = true;
    applyBtn.textContent = 'Applying...';
    
    // Simulate API call delay
    setTimeout(async () => {
        try {
            const result = await validateCoupon(couponCode);
            
            if (result.valid) {
                appliedCoupon = result.coupon;
                saveCart();
                updateCartTotals();
                showCouponMessage(`✅ ${result.coupon.description} applied successfully!`, 'success');
                couponInput.value = '';
                couponInput.disabled = true;
                applyBtn.textContent = 'Applied';
                applyBtn.disabled = true;
                
                // Add remove coupon button
                addRemoveCouponButton();
            } else {
                showCouponMessage(`❌ ${result.message}`, 'error');
            }
        } catch (error) {
            showCouponMessage('❌ Error validating coupon. Please try again.', 'error');
        } finally {
            applyBtn.disabled = false;
            applyBtn.textContent = 'Apply';
        }
    }, 1000);
}

function removeCoupon() {
    appliedCoupon = null;
    saveCart();
    updateCartTotals();
    
    const couponInput = document.getElementById('coupon-code');
    const applyBtn = document.getElementById('apply-coupon-btn');
    const messageEl = document.getElementById('coupon-message');
    
    if (couponInput) couponInput.disabled = false;
    if (applyBtn) {
        applyBtn.textContent = 'Apply';
        applyBtn.disabled = false;
    }
    
    showCouponMessage('Coupon removed', 'success');
    
    // Remove remove button
    const removeBtn = document.getElementById('remove-coupon-btn');
    if (removeBtn) removeBtn.remove();
}

function showCouponMessage(message, type) {
    const messageEl = document.getElementById('coupon-message');
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `coupon-message ${type}`;
    }
}

function addRemoveCouponButton() {
    const couponSection = document.querySelector('.coupon-section');
    const existingRemoveBtn = document.getElementById('remove-coupon-btn');
    
    if (!couponSection || existingRemoveBtn) return;
    
    const removeBtn = document.createElement('button');
    removeBtn.id = 'remove-coupon-btn';
    removeBtn.className = 'btn-coupon remove-coupon';
    removeBtn.textContent = 'Remove';
    removeBtn.style.marginLeft = '10px';
    removeBtn.style.background = '#dc3545';
    
    removeBtn.addEventListener('click', removeCoupon);
    
    const inputGroup = couponSection.querySelector('.coupon-input-group');
    if (inputGroup) {
        inputGroup.appendChild(removeBtn);
    }
}

function setupCouponEventListeners() {
    const applyBtn = document.getElementById('apply-coupon-btn');
    const couponInput = document.getElementById('coupon-code');
    
    if (applyBtn) {
        applyBtn.addEventListener('click', applyCoupon);
    }
    
    if (couponInput) {
        couponInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                applyCoupon();
            }
        });
    }
    
    // Show applied coupon on page load
    if (appliedCoupon) {
        const couponInput = document.getElementById('coupon-code');
        const applyBtn = document.getElementById('apply-coupon-btn');
        
        if (couponInput && applyBtn) {
            couponInput.value = appliedCoupon.code;
            couponInput.disabled = true;
            applyBtn.textContent = 'Applied';
            applyBtn.disabled = true;
            addRemoveCouponButton();
            showCouponMessage(`✅ ${appliedCoupon.description} applied`, 'success');
        }
    }
}

// ---------- Checkout ----------
function setupCheckout() {
    const checkoutBtn = document.getElementById('checkout-btn');
    if (!checkoutBtn) return;

    checkoutBtn.addEventListener('click', function (e) {
        // Check authentication before proceeding to checkout
        if (window.authGuard && !window.authGuard.requireAuth('proceed to checkout', window.location.href)) {
            return;
        }

        const checkoutFormSection = document.getElementById('checkout-form-section');
        const cartSection = document.querySelector('.cart-section');

        if (checkoutFormSection && cartSection) {
            checkoutFormSection.classList.remove('hidden');
            cartSection.classList.add('hidden');
            displayCheckoutItems();

            // init payment card selection visuals
            const paymentCards = document.querySelectorAll('.payment-card');
            const radios = document.querySelectorAll('input[name="paymentMethod"]');
            function updateSelected() {
                paymentCards.forEach(card => {
                    const input = card.querySelector('input[type="radio"]');
                    if (input && input.checked) {
                        card.classList.add('selected');
                    } else {
                        card.classList.remove('selected');
                    }
                });
            }
            radios.forEach(r => r.addEventListener('change', updateSelected));
            updateSelected();
        }
    });

    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            
            // Check authentication before placing order
            if (window.authGuard && !window.authGuard.requireAuth('place this order', window.location.href)) {
                return;
            }
            
            const submitBtn = checkoutForm.querySelector('button[type="submit"]');
            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Placing...'; }

            // Warm up API to reduce cold start
            if (window.api && typeof window.api.warmUp === 'function') {
                try { await window.api.warmUp(); } catch (_) {}
            }

            // Validate required fields
            const name = checkoutForm.name.value.trim();
            const phone = checkoutForm.phone.value.trim();
            const email = checkoutForm.email.value.trim();
            const address = checkoutForm.address.value.trim();
            const paymentMethod = checkoutForm.paymentMethod.value;
            const hostel = checkoutForm.hostel.value.trim();
            
            // Check if required fields are filled
            if (!name || !phone || !email || !address) {
                alert("Please fill in all required fields");
                if (submitBtn) { 
                    submitBtn.disabled = false; 
                    submitBtn.textContent = 'Place Order'; 
                }
                return;
            }
            
            // Validate phone number format (10 digits)
            if (!/^\d{10}$/.test(phone)) {
                alert("Please enter a valid 10-digit phone number");
                if (submitBtn) { 
                    submitBtn.disabled = false; 
                    submitBtn.textContent = 'Place Order'; 
                }
                return;
            }
            
            // Validate email format
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                alert("Please enter a valid email address");
                if (submitBtn) { 
                    submitBtn.disabled = false; 
                    submitBtn.textContent = 'Place Order'; 
                }
                return;
            }
            
            const contactInfo = {
                name: name,
                phone: phone,
                email: email
            };

            let itemsPayload = cart.map(item => ({
                name: `${item.name} (${item.productQuantity})`,
                quantity: item.quantity,
                price: item.price
            }));
            if (glassBottleAddon) {
                itemsPayload.push({ name: 'Reusable Glass Bottle', quantity: 1, price: 7 });
            }

            // Default to 'college' if hostel is provided, otherwise 'outsider'
            const customerType = hostel ? 'college' : 'outsider';

            try {
                if (paymentMethod === 'cod') {
                    // ✅ Cash on Delivery - directly create order
                    const response = await api.createGuestOrder({
                        items: itemsPayload,
                        customerType,
                        hostel: hostel || undefined,
                        address,
                        contactInfo,
                        payment: { method: paymentMethod },
                        coupon: appliedCoupon ? { code: appliedCoupon.code, discount: appliedCoupon.value, type: appliedCoupon.type } : undefined
                    });

                    if (response.success) {
                        triggerOrderPlacedAnimation();
                        document.getElementById('order-id').textContent = response.data.orderNumber;
                        document.getElementById('order-confirmation').classList.remove('hidden');
                        cart = [];
                        saveCart();
                    } else {
                        alert('Could not place order: ' + (response.message || 'Unknown error'));
                    }
                } else {
                    // ✅ Online Payment - Razorpay flow
                    // Step 1: Calculate total amount
                    const { subtotal, deliveryFee, total } = calculateCartTotals();
                    
                    // Step 1.5: If total is zero (free order), skip Razorpay and place order directly
                    if (total <= 0) {
                        const freeOrderResponse = await api.createGuestOrder({
                            items: itemsPayload,
                            customerType,
                            hostel: hostel || undefined,
                            address,
                            contactInfo,
                            payment: { method: 'online', status: 'paid' },
                            coupon: appliedCoupon ? { code: appliedCoupon.code, discount: appliedCoupon.value, type: appliedCoupon.type } : undefined
                        });

                        if (freeOrderResponse.success) {
                            triggerOrderPlacedAnimation();
                            document.getElementById('order-id').textContent = freeOrderResponse.data.orderNumber;
                            document.getElementById('order-confirmation').classList.remove('hidden');
                            cart = [];
                            saveCart();
                            return;
                        } else {
                            throw new Error('Failed to create free order: ' + (freeOrderResponse.message || 'Unknown error'));
                        }
                    }

                    // Step 2: Create Razorpay order
                    const orderResponse = await fetch('/.netlify/functions/create-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            items: itemsPayload, 
                            currency: 'INR',
                            coupon: appliedCoupon ? { code: appliedCoupon.code, discount: appliedCoupon.value, type: appliedCoupon.type } : undefined
                        })
                    });
                    const orderData = await orderResponse.json();
                    
                    if (!orderData.success) {
                        throw new Error('Failed to create payment order: ' + (orderData.message || 'Unknown error'));
                    }

                    // Step 3: Open Razorpay checkout
                    const options = {
                        key: 'rzp_live_RLKa3dYIPnE2b8', // Public key - safe to use in frontend
                        amount: orderData.order.amount,
                        currency: orderData.order.currency,
                        name: 'Garam Doodh',
                        description: 'Milk Order Payment',
                        order_id: orderData.order.id,
                        handler: async function (response) {
                            try {
                                // Step 4: Create order in database after successful payment
                                const orderResponse = await api.createGuestOrder({
                                    items: itemsPayload,
                                    customerType,
                                    hostel: hostel || undefined,
                                    address,
                                    contactInfo,
                                    payment: { method: 'online', razorpayOrderId: orderData.order.id },
                                    coupon: appliedCoupon ? { code: appliedCoupon.code, discount: appliedCoupon.value, type: appliedCoupon.type } : undefined
                                });

                                if (orderResponse.success) {
                                    triggerOrderPlacedAnimation();
                                    document.getElementById('order-id').textContent = orderResponse.data.orderNumber;
                                    document.getElementById('order-confirmation').classList.remove('hidden');
                                    cart = [];
                                    saveCart();
                                } else {
                                    alert('Payment successful but order creation failed: ' + orderResponse.message);
                                }
                            } catch (err) {
                                alert('Payment successful but order creation failed: ' + err.message);
                                console.error('Order creation error:', err);
                            }
                        },
                        prefill: {
                            name: contactInfo.name,
                            email: contactInfo.email,
                            contact: contactInfo.phone
                        },
                        theme: { color: '#3399cc' }
                    };

                    const rzp = new Razorpay(options);
                    rzp.open();
                }
            } catch (err) {
                alert('Failed to place order: ' + (err?.message || 'Please try again.'));
                console.error('Order error:', err);
            }
            finally {
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Place Order'; }
            }
        });
    }
}

// Checkout display
function displayCheckoutItems() {
    const checkoutItems = document.getElementById('checkout-items');
    if (!checkoutItems) return;

    checkoutItems.innerHTML = '';

    cart.forEach(item => {
        checkoutItems.innerHTML += `
            <div class="checkout-item">
                <div class="checkout-item-name">
                    ${item.name} (${item.productQuantity})
                    <span class="checkout-item-quantity">x${item.quantity}</span>
                </div>
                <div class="checkout-item-price">₹${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `;
    });

    if (glassBottleAddon) {
        checkoutItems.innerHTML += `
            <div class="checkout-item">
                <div class="checkout-item-name">Reusable Glass Bottle <span class="checkout-item-quantity">x1</span></div>
                <div class="checkout-item-price">₹7.00</div>
            </div>`;
    }

    // Add-on row inside order summary if addon selected
    const addonFee = glassBottleAddon ? 7 : 0;
    if (addonFee > 0) {
        const addonRow = document.createElement('div');
        addonRow.className = 'summary-row';
        addonRow.innerHTML = `<span>Glass Bottle</span><span id="checkout-addon-fee">₹${addonFee.toFixed(2)}</span>`;
        const orderSummary = document.querySelector('.order-summary');
        const summaryRows = orderSummary ? orderSummary.querySelectorAll('.summary-row') : [];
        if (orderSummary && summaryRows.length) {
            orderSummary.insertBefore(addonRow, summaryRows[summaryRows.length - 1]);
        }
    }

    // Add coupon discount row if coupon is applied
    const { subtotal, deliveryFee, couponDiscount, total } = calculateCartTotals();
    if (couponDiscount > 0) {
        const couponRow = document.createElement('div');
        couponRow.className = 'summary-row coupon-discount';
        couponRow.innerHTML = `<span>Discount (${appliedCoupon.code}):</span><span>-₹${couponDiscount.toFixed(2)}</span>`;
        const orderSummary = document.querySelector('.order-summary');
        const summaryRows = orderSummary ? orderSummary.querySelectorAll('.summary-row') : [];
        if (orderSummary && summaryRows.length) {
            orderSummary.insertBefore(couponRow, summaryRows[summaryRows.length - 1]);
        }
    }
    const subtotalEl = document.getElementById('checkout-subtotal');
    const deliveryEl = document.getElementById('checkout-delivery-fee');
    const totalEl = document.getElementById('checkout-total');

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
    if (deliveryEl) deliveryEl.textContent = `₹${deliveryFee.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `₹${total.toFixed(2)}`;
}

// Simplified checkout - customer type and hostel selection removed

// Init
document.addEventListener('DOMContentLoaded', function () {
    loadCart();
    displayCart();
    setupCheckout();
    setupCouponEventListeners();
});

// Show the order placed animation overlay for ~10 seconds, then hide
function triggerOrderPlacedAnimation() {
    const overlay = document.getElementById('order-animation');
    if (!overlay) return;
    const button = overlay.querySelector('.order');
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    if (button && !button.classList.contains('animate')) {
        button.classList.add('animate');
        setTimeout(() => {
            button.classList.remove('animate');
            overlay.classList.add('hidden');
            overlay.setAttribute('aria-hidden', 'true');
        }, 10000);
    }
}

// Clear cart and reset all states
function clearCart() {
    cart = [];
    glassBottleAddon = false;
    appliedCoupon = null;
    saveCart();
    displayCart();
}

// Make functions available globally for testing
window.clearCart = clearCart;
window.appliedCoupon = () => appliedCoupon;
