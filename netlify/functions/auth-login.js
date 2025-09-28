const { json, parseBody } = require('./_utils');
const { connectToDatabase } = require('../../db');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

function generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        console.log('❌ Method not allowed:', event.httpMethod);
        return json({ success: false, message: 'Method Not Allowed' }, 405);
    }
    
    try {
        console.log('🔍 Starting login process...');
        await connectToDatabase();
        console.log('✅ Database connected');
        
        const { email, password } = parseBody(event);
        console.log('📧 Login attempt for email:', email);
        console.log('🔐 Password length:', password ? password.length : 0);
        
        if (!email || !password) {
            console.log('❌ Missing email or password');
            return json({ success: false, message: 'Email and password are required' }, 400);
        }
        
        // Find user with password field included
        const user = await User.findOne({ email }).select('+password');
        console.log('👤 User found:', user ? 'Yes' : 'No');
        
        if (!user) {
            console.log('❌ User not found for email:', email);
            return json({ success: false, message: 'Invalid credentials' }, 401);
        }
        
        if (!user.isActive) {
            console.log('❌ User account is inactive');
            return json({ success: false, message: 'Account is inactive' }, 401);
        }
        
        console.log('🔍 Comparing password...');
        const valid = await user.comparePassword(password);
        console.log('🔐 Password valid:', valid);
        
        if (!valid) {
            console.log('❌ Invalid password for user:', email);
            return json({ success: false, message: 'Invalid credentials' }, 401);
        }
        
        console.log('✅ Password verified, updating last login...');
        user.lastLogin = new Date();
        await user.save();
        
        console.log('🎫 Generating JWT token...');
        const token = generateToken(user._id);
        console.log('✅ Login successful for user:', user.email);
        
        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;
        
        return json({ 
            success: true, 
            message: 'Login successful', 
            data: { user: userResponse, token } 
        });
    } catch (error) {
        console.error('💥 Login error:', error);
        return json({ 
            success: false, 
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, 500);
    }
};


