// Product data - will be loaded from API
window.products = [];

// Fetch products from API
async function fetchProducts() {
    try {
        console.log('🔄 Fetching products from API...');
        const response = await fetch('/.netlify/functions/products');
        const data = await response.json();
        
        if (data.success && data.data && data.data.products) {
            window.products = data.data.products.map(product => ({
                id: product._id,
                name: product.name,
                quantity: product.quantity,
                price: product.price,
                image: product.image,
                description: product.description,
                category: product.category,
                stock: product.stock,
                isAvailable: product.isAvailable
            }));
            console.log('✅ Loaded', window.products.length, 'products from database');
            return true;
        } else {
            console.warn('⚠️ No products found in API response, using fallback');
            loadFallbackProducts();
            return false;
        }
    } catch (error) {
        console.error('❌ Error fetching products:', error);
        loadFallbackProducts();
        return false;
    }
}

// Fallback products if API fails
function loadFallbackProducts() {
    window.products = [
        {
            id: 1,
            name: 'Fresh Boiled Milk',
            quantity: '100 ml',
            price: 17,
            image: 'images/garam-doodh-logo.png'
        },
        {
            id: 2,
            name: 'Fresh Boiled Milk',
            quantity: '250 ml',
            price: 32,
            image: 'images/garam-doodh-logo.png'
        },
        {
            id: 3,
            name: 'Fresh Boiled Milk',
            quantity: '500 ml',
            price: 52,
            image: 'images/garam-doodh-logo.png'
        },
        {
            id: 4,
            name: 'Fresh Boiled Milk',
            quantity: '1 L',
            price: 92,
            image: 'images/garam-doodh-logo.png'
        },
        {
            id: 5,
            name: 'Fresh Boiled Milk',
            quantity: '2 L',
            price: 172,
            image: 'images/garam-doodh-logo.png'
        },
        {
            id: 6,
            name: 'Fresh Boiled Milk',
            quantity: '5 L',
            price: 402,
            image: 'images/garam-doodh-logo.png'
        }
    ];
}

// Function to create product card HTML
function createProductCard(product, index = 0) {
    const delay = index * 50;
    const isAvailable = product.isAvailable !== false && product.stock > 0;
    
    // Determine badges based on product properties
    let badges = '';
    if (product.category === 'eggs') {
        badges += '<span class="badge green">Fresh</span>';
    } else {
        badges += '<span class="badge green">Fresh</span>';
        if (product.quantity === '1 L') {
            badges += '<span class="badge blue">Best Value</span>';
        }
        if (product.quantity === '250 ml') {
            badges += '<span class="badge">Popular</span>';
        }
    }
    
    return `
        <div class="product-card" data-id="${product.id}" data-aos="fade-up" data-aos-delay="${delay}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name} ${product.quantity}" onerror="this.onerror=null; this.src='images/logo.svg';">
                ${!isAvailable ? '<div class="out-of-stock-overlay">Out of Stock</div>' : ''}
            </div>
            <div class="product-info">
                <div class="badges">
                    ${badges}
                </div>
                <h3 class="product-title">${product.name}</h3>
                <p class="product-quantity">${product.quantity}</p>
                ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
                <p class="product-price">₹${product.price.toFixed(2)}</p>
                ${product.stock <= 10 && product.stock > 0 ? `<p class="stock-warning">Only ${product.stock} left!</p>` : ''}
                <div class="product-actions">
                    <div class="quantity-selector">
                        <button class="quantity-btn decrease" ${!isAvailable ? 'disabled' : ''}>-</button>
                        <input type="number" class="quantity-input" value="1" min="1" max="${Math.min(product.stock || 20, 20)}" ${!isAvailable ? 'disabled' : ''}>
                        <button class="quantity-btn increase" ${!isAvailable ? 'disabled' : ''}>+</button>
                    </div>
                    <button class="btn add-to-cart" ${!isAvailable ? 'disabled' : ''}>${isAvailable ? 'Add to Cart' : 'Out of Stock'}</button>
                </div>
            </div>
        </div>
    `;
}

// Function to display products on the homepage
async function displayFeaturedProducts() {
    const featuredProductsContainer = document.querySelector('.featured-products .product-grid');
    if (!featuredProductsContainer) return;

    // Wait for products to load
    if (window.products.length === 0) {
        await fetchProducts();
    }

    // Display only first 3 products on homepage
    const featuredProducts = window.products.slice(0, 3);
    
    featuredProductsContainer.innerHTML = '';
    featuredProducts.forEach((product, index) => {
        featuredProductsContainer.innerHTML += createProductCard(product, index);
    });

    // Add event listeners to the featured products
    addProductEventListeners();
}

// Function to display all products on the products page
async function displayAllProducts() {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return;

    // Show loading state
    productsContainer.innerHTML = '<div class="loading-products"><i class="fas fa-spinner fa-spin"></i> Loading products...</div>';

    // Wait for products to load
    if (window.products.length === 0) {
        await fetchProducts();
    }

    productsContainer.innerHTML = '';
    
    window.products.forEach((product, index) => {
        productsContainer.innerHTML += createProductCard(product, index);
    });

    // Add event listeners to all products
    addProductEventListeners();
}

// Function to add event listeners to product cards
function addProductEventListeners() {
    // Quantity increase/decrease buttons
    document.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('.quantity-input');
            let value = parseInt(input.value);
            
            if (this.classList.contains('increase')) {
                value = Math.min(value + 1, 20); // Max 20
            } else {
                value = Math.max(value - 1, 1); // Min 1
            }
            
            input.value = value;
        });
    });

    // Add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            // Check authentication before adding to cart
            if (window.authGuard && !window.authGuard.requireAuth('add items to cart', window.location.href)) {
                return;
            }
            
            const productCard = this.closest('.product-card');
            const productId = productCard.dataset.id; // Keep as string (works with both number and ObjectID)
            const quantity = parseInt(productCard.querySelector('.quantity-input').value);
            
            addToCart(productId, quantity);
            
            // Show confirmation message
            const originalText = this.textContent;
            this.textContent = 'Added!';
            this.disabled = true;
            
            setTimeout(() => {
                this.textContent = originalText;
                this.disabled = false;
            }, 1500);
        });
    });
}

// Function to handle sorting products
function setupSorting() {
    const sortSelect = document.getElementById('sort-by');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', function() {
        const sortValue = this.value;
        let sortedProducts = [...window.products];

        switch(sortValue) {
            case 'price-low':
                sortedProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                sortedProducts.sort((a, b) => b.price - a.price);
                break;
            case 'quantity-low':
                sortedProducts.sort((a, b) => {
                    const aValue = parseFloat(a.quantity.replace(/[^0-9.]/g, ''));
                    const bValue = parseFloat(b.quantity.replace(/[^0-9.]/g, ''));
                    return aValue - bValue;
                });
                break;
            case 'quantity-high':
                sortedProducts.sort((a, b) => {
                    const aValue = parseFloat(a.quantity.replace(/[^0-9.]/g, ''));
                    const bValue = parseFloat(b.quantity.replace(/[^0-9.]/g, ''));
                    return bValue - aValue;
                });
                break;
            default:
                // Default sorting (by ID)
                sortedProducts.sort((a, b) => a.id - b.id);
        }

        const productsContainer = document.getElementById('products-container');
        productsContainer.innerHTML = '';
        
        sortedProducts.forEach(product => {
            productsContainer.innerHTML += createProductCard(product);
        });

        addProductEventListeners();
    });
}

// Initialize product displays
document.addEventListener('DOMContentLoaded', async function() {
    // Fetch products first
    await fetchProducts();
    
    // Then display them
    displayFeaturedProducts();
    displayAllProducts();
    setupSorting();
});