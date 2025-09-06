// Cart functionality
let cart = [];

// Define products array if it's not already defined
let products;
if (typeof window.products === 'undefined') {
    products = [
        {
            id: 1,
            name: 'Fresh Boiled Milk',
            quantity: '100 ml',
            price: 17,
            image: 'images/milk-100ml.svg'
        },
        {
            id: 2,
            name: 'Fresh Boiled Milk',
            quantity: '250 ml',
            price: 32,
            image: 'images/milk-250ml.svg'
        },
        {
            id: 3,
            name: 'Fresh Boiled Milk',
            quantity: '500 ml',
            price: 52,
            image: 'images/milk-500ml.svg'
        },
        {
            id: 4,
            name: 'Fresh Boiled Milk',
            quantity: '1 L',
            price: 92,
            image: 'images/milk-1l.svg'
        },
        {
            id: 5,
            name: 'Fresh Boiled Milk',
            quantity: '2 L',
            price: 172,
            image: 'images/milk-2l.svg'
        },
        {
            id: 6,
            name: 'Fresh Boiled Milk',
            quantity: '5 L',
            price: 402,
            image: 'images/milk-5l.svg'
        }
    ];
} else {
    products = window.products;
}

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('garamdoodhCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('garamdoodhCart', JSON.stringify(cart));
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

    // Check if product already in cart
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
    const deliveryFee = 0; // Free delivery
    const total = subtotal + deliveryFee;
    
    return { subtotal, deliveryFee, total };
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
                    <img src="${item.image}" alt="${item.name}">
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
    
    // Add event listeners to cart items
    addCartEventListeners();
    
    // Update totals
    updateCartTotals();
}

// Update cart totals in the UI
function updateCartTotals() {
    const { subtotal, deliveryFee, total } = calculateCartTotals();
    
    document.getElementById('cart-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('delivery-fee').textContent = `₹${deliveryFee.toFixed(2)}`;
    document.getElementById('cart-total').textContent = `₹${total.toFixed(2)}`;
}

// Add event listeners to cart items
function addCartEventListeners() {
    // Quantity buttons
    document.querySelectorAll('.cart-item .quantity-btn').forEach(button => {
        button.addEventListener('click', function() {
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
    
    // Quantity input
    document.querySelectorAll('.cart-item .quantity-input').forEach(input => {
        input.addEventListener('change', function() {
            const cartItem = this.closest('.cart-item');
            const productId = parseInt(cartItem.dataset.id);
            let value = parseInt(this.value);
            
            // Ensure value is between 1 and 20
            value = Math.max(1, Math.min(value, 20));
            this.value = value;
            
            updateCartItemQuantity(productId, value);
        });
    });
    
    // Remove buttons
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            const cartItem = this.closest('.cart-item');
            const productId = parseInt(cartItem.dataset.id);
            
            removeFromCart(productId);
        });
    });
}

// Handle checkout process
function setupCheckout() {
    const checkoutBtn = document.getElementById('checkout-btn');
    if (!checkoutBtn) return;
    
    checkoutBtn.addEventListener('click', function() {
        const customerTypeSection = document.getElementById('customer-type-section');
        const cartSection = document.querySelector('.cart-section');
        
        // Display customer type selection
        customerTypeSection.classList.remove('hidden');
        cartSection.classList.add('hidden');
        
        // Setup customer type selection
        setupCustomerTypeSelection();
    });
    
    // Setup checkout form submission
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Generate order ID
            const orderId = 'GD' + Date.now().toString().slice(-6);
            document.getElementById('order-id').textContent = orderId;
            
            // Show confirmation
            document.getElementById('order-confirmation').classList.remove('hidden');
            
            // Clear cart
            cart = [];
            saveCart();
        });
    }
}

// Display items in checkout
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
    
    // Update checkout totals
    const { subtotal, deliveryFee, total } = calculateCartTotals();
    document.getElementById('checkout-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('checkout-delivery-fee').textContent = `₹${deliveryFee.toFixed(2)}`;
    document.getElementById('checkout-total').textContent = `₹${total.toFixed(2)}`;
}

// Setup customer type selection
function setupCustomerTypeSelection() {
    const customerOptions = document.querySelectorAll('.customer-option');
    const customerTypeSection = document.getElementById('customer-type-section');
    const hostelSelectionSection = document.getElementById('hostel-selection-section');
    const checkoutSection = document.getElementById('checkout-form-section');
    
    customerOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            customerOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            const customerType = this.dataset.type;
            
            if (customerType === 'college') {
                // Show hostel selection
                setTimeout(() => {
                    customerTypeSection.classList.add('hidden');
                    hostelSelectionSection.classList.remove('hidden');
                    setupHostelSelection();
                }, 300);
            } else if (customerType === 'outsider') {
                // Go directly to checkout
                setTimeout(() => {
                    customerTypeSection.classList.add('hidden');
                    checkoutSection.classList.remove('hidden');
                    displayCheckoutItems();
                }, 300);
            }
        });
    });
}

// Setup hostel selection
function setupHostelSelection() {
    const hostelOptions = document.querySelectorAll('.hostel-option');
    const backBtn = document.getElementById('back-to-customer-type');
    const proceedBtn = document.getElementById('proceed-with-hostel');
    const hostelSelectionSection = document.getElementById('hostel-selection-section');
    const customerTypeSection = document.getElementById('customer-type-section');
    const checkoutSection = document.getElementById('checkout-form-section');
    
    let selectedHostel = null;
    
    hostelOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            hostelOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            selectedHostel = this.dataset.hostel;
            
            // Enable proceed button
            proceedBtn.disabled = false;
        });
    });
    
    // Back button
    backBtn.addEventListener('click', function() {
        hostelSelectionSection.classList.add('hidden');
        customerTypeSection.classList.remove('hidden');
    });
    
    // Proceed button
    proceedBtn.addEventListener('click', function() {
        if (selectedHostel) {
            hostelSelectionSection.classList.add('hidden');
            checkoutSection.classList.remove('hidden');
            displayCheckoutItems();
        }
    });
}

// Initialize cart functionality
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    displayCart();
    setupCheckout();
});