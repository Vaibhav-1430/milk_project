// Product data
window.products = [
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

// Function to create product card HTML
function createProductCard(product) {
    const delay = product.id * 50;
    return `
        <div class="product-card" data-id="${product.id}" data-aos="fade-up" data-aos-delay="${delay}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name} ${product.quantity}" onerror="this.onerror=null; this.src='images/logo.svg';">
            </div>
            <div class="product-info">
                <div class="badges">
                    <span class="badge green">Fresh</span>
                    ${product.id === 4 ? '<span class="badge blue">Best Value</span>' : ''}
                    ${product.id === 2 ? '<span class="badge">Popular</span>' : ''}
                </div>
                <h3 class="product-title">${product.name}</h3>
                <p class="product-quantity">${product.quantity}</p>
                <p class="product-price">₹${product.price.toFixed(2)}</p>
                <div class="product-actions">
                    <div class="quantity-selector">
                        <button class="quantity-btn decrease">-</button>
                        <input type="number" class="quantity-input" value="1" min="1" max="20">
                        <button class="quantity-btn increase">+</button>
                    </div>
                    <button class="btn add-to-cart">Add to Cart</button>
                </div>
            </div>
        </div>
    `;
}

// Function to display products on the homepage
function displayFeaturedProducts() {
    const featuredProductsContainer = document.querySelector('.featured-products .product-grid');
    if (!featuredProductsContainer) return;

    // Display only first 3 products on homepage
    const featuredProducts = window.products.slice(0, 3);
    
    featuredProducts.forEach(product => {
        featuredProductsContainer.innerHTML += createProductCard(product);
    });

    // Add event listeners to the featured products
    addProductEventListeners();
}

// Function to display all products on the products page
function displayAllProducts() {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return;

    productsContainer.innerHTML = '';
    
    window.products.forEach(product => {
        productsContainer.innerHTML += createProductCard(product);
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
            const productCard = this.closest('.product-card');
            const productId = parseInt(productCard.dataset.id);
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
document.addEventListener('DOMContentLoaded', function() {
    displayFeaturedProducts();
    displayAllProducts();
    setupSorting();
});