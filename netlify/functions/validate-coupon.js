const { json, parseBody } = require('./_utils');

// Coupon database - in a real app, this would be stored in MongoDB
const coupons = {
    'WELCOME10': {
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        description: '10% off on your first order',
        minOrderAmount: 0,
        maxDiscount: 50,
        isActive: true,
        usageLimit: 1000,
        usedCount: 0,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2025-12-31')
    },
    'SAVE20': {
        code: 'SAVE20',
        type: 'fixed',
        value: 20,
        description: '₹20 off on orders above ₹100',
        minOrderAmount: 100,
        maxDiscount: 20,
        isActive: true,
        usageLimit: 500,
        usedCount: 0,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2025-12-31')
    },
    'MILK15': {
        code: 'MILK15',
        type: 'percentage',
        value: 15,
        description: '15% off on milk orders',
        minOrderAmount: 0,
        maxDiscount: 100,
        isActive: true,
        usageLimit: 200,
        usedCount: 0,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2025-12-31')
    },
    'FIRST50': {
        code: 'FIRST50',
        type: 'fixed',
        value: 50,
        description: '₹50 off on orders above ₹200',
        minOrderAmount: 200,
        maxDiscount: 50,
        isActive: true,
        usageLimit: 100,
        usedCount: 0,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2025-12-31')
    },
    'STUDENT10': {
        code: 'STUDENT10',
        type: 'percentage',
        value: 10,
        description: '10% off for students',
        minOrderAmount: 50,
        maxDiscount: 30,
        isActive: true,
        usageLimit: 1000,
        usedCount: 0,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2025-12-31')
    },
    'LILY': {
        code: 'LILY',
        type: 'percentage',
        value: 100,
        description: 'Special 100% off',
        minOrderAmount: 0,
        // extremely high maxDiscount to effectively allow free orders
        maxDiscount: 1000000,
        isActive: true,
        usageLimit: 1000000,
        usedCount: 0,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2026-12-31')
    }
};

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return json({ success: false, message: 'Method Not Allowed' }, 405);
    }

    try {
        const { couponCode, orderAmount } = parseBody(event);

        if (!couponCode) {
            return json({ success: false, message: 'Coupon code is required' }, 400);
        }

        const coupon = coupons[couponCode.toUpperCase()];
        
        if (!coupon) {
            return json({ 
                success: false, 
                message: 'Invalid coupon code',
                valid: false 
            }, 400);
        }

        // Check if coupon is active
        if (!coupon.isActive) {
            return json({ 
                success: false, 
                message: 'This coupon is no longer active',
                valid: false 
            }, 400);
        }

        // Check validity period
        const now = new Date();
        if (now < coupon.validFrom || now > coupon.validUntil) {
            return json({ 
                success: false, 
                message: 'This coupon has expired',
                valid: false 
            }, 400);
        }

        // Check usage limit
        if (coupon.usedCount >= coupon.usageLimit) {
            return json({ 
                success: false, 
                message: 'This coupon has reached its usage limit',
                valid: false 
            }, 400);
        }

        // Check minimum order amount
        if (orderAmount && orderAmount < coupon.minOrderAmount) {
            return json({ 
                success: false, 
                message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`,
                valid: false 
            }, 400);
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.type === 'percentage') {
            discountAmount = (orderAmount || 0) * (coupon.value / 100);
            // Apply max discount limit
            discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        } else if (coupon.type === 'fixed') {
            discountAmount = Math.min(coupon.value, coupon.maxDiscount);
        }

        // Ensure discount doesn't exceed order amount
        if (orderAmount) {
            discountAmount = Math.min(discountAmount, orderAmount);
        }

        return json({
            success: true,
            valid: true,
            coupon: {
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                description: coupon.description,
                discountAmount: discountAmount
            }
        });

    } catch (error) {
        console.error('Coupon validation error:', error);
        return json({ 
            success: false, 
            message: 'Server error while validating coupon',
            valid: false 
        }, 500);
    }
};
