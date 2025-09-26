// Cart functionality
let cart = [];
let glassBottleAddon = false; // ₹7 add-on state

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
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
    glassBottleAddon = savedAddon === 'true';
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('garamdoodhCart', JSON.stringify(cart));
    localStorage.setItem('garamdoodhGlassBottleAddon', String(glassBottleAddon));
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
    const total = subtotal + deliveryFee + addonFee;

    return { subtotal, deliveryFee, addonFee, total };
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
    const { subtotal, deliveryFee, addonFee, total } = calculateCartTotals();

    const subEl = document.getElementById('cart-subtotal');
    const delEl = document.getElementById('delivery-fee');
    const totEl = document.getElementById('cart-total');

    if (subEl) subEl.textContent = `₹${subtotal.toFixed(2)}`;
    if (delEl) delEl.textContent = `₹${deliveryFee.toFixed(2)}`;
    if (totEl) totEl.textContent = `₹${total.toFixed(2)}`;

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

// ---------- Checkout ----------
function setupCheckout() {
    const checkoutBtn = document.getElementById('checkout-btn');
    if (!checkoutBtn) return;

    checkoutBtn.addEventListener('click', function () {
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
            const submitBtn = checkoutForm.querySelector('button[type="submit"]');
            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Placing...'; }

            // Warm up API to reduce cold start
            if (window.api && typeof window.api.warmUp === 'function') {
                try { await window.api.warmUp(); } catch (_) {}
            }

            const contactInfo = {
                name: checkoutForm.name.value,
                phone: checkoutForm.phone.value,
                email: checkoutForm.email.value
            };
            const address = checkoutForm.address.value;
            const paymentMethod = checkoutForm.paymentMethod.value;
            const hostel = checkoutForm.hostel.value;

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
                        payment: { method: paymentMethod }
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
                    
                    // Step 2: Create Razorpay order
                    const orderResponse = await fetch('/.netlify/functions/create-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ items: itemsPayload, currency: 'INR' })
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
                                    payment: { method: 'online', razorpayOrderId: orderData.order.id }
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

    const { subtotal, deliveryFee, total } = calculateCartTotals();
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
