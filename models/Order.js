const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1']
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    },
    total: {
        type: Number,
        required: true
    }
});

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [orderItemSchema],
    customerType: {
        type: String,
        enum: ['college', 'outsider'],
        required: true
    },
    hostel: {
        type: String,
        required: function() {
            return this.customerType === 'college';
        }
    },
    deliveryAddress: {
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        pincode: {
            type: String,
            required: true
        },
        landmark: String
    },
    contactInfo: {
        name: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        }
    },
    pricing: {
        subtotal: {
            type: Number,
            required: true
        },
        deliveryFee: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            required: true
        }
    },
    payment: {
        method: {
            type: String,
            enum: ['cod', 'online'],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending'
        },
        razorpayOrderId: String,
        razorpayPaymentId: String,
        razorpaySignature: String
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'pending'
    },
    deliveryDate: {
        type: Date,
        required: true
    },
    deliveryTime: {
        type: String,
        enum: ['morning', 'evening'],
        default: 'morning'
    },
    notes: String,
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String
}, {
    timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = `GD${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

// Index for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ deliveryDate: 1 });

module.exports = mongoose.model('Order', orderSchema);
