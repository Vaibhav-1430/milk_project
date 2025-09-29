const { json, parseBody } = require('./_utils');
const { connectToDatabase } = require('../../db');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

// Import the shared OTP store from a separate module for persistence between functions
const { otpStore } = require('./_otp-store');

function generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return json({ success: false, message: 'Method Not Allowed' }, 405);
    }
    
    try {
        console.log('🔍 Starting OTP verification process...');
        await connectToDatabase();
        
        const { email, otp } = parseBody(event);
        console.log('📧 OTP verification for email:', email);
        
        if (!email || !otp) {
            return json({ success: false, message: 'Email and OTP are required' }, 400);
        }
        
        // Check if OTP exists for this email
        const otpData = await otpStore.get(email);
        
        if (!otpData) {
            return json({ success: false, message: 'No OTP found for this email' }, 400);
        }
        
        // Check if OTP is expired
        const now = new Date();
        if (now > otpData.expiry) {
            // Remove expired OTP
            await otpStore.delete(email);
            return json({ success: false, message: 'OTP has expired' }, 400);
        }
        
        // Verify OTP
        if (otp !== otpData.otp) {
            return json({ success: false, message: 'Invalid OTP' }, 400);
        }
        
        // OTP is valid, find user
        const user = await User.findOne({ email });
        
        if (!user) {
            return json({ success: false, message: 'User not found' }, 404);
        }
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        
        // Generate JWT token
        const token = generateToken(user._id);
        
        // Remove OTP from store after successful verification
        await otpStore.delete(email);
        
        // Remove password from response
        const userResponse = user.toObject();
        if (userResponse.password) {
            delete userResponse.password;
        }
        
        return json({ 
            success: true, 
            message: 'OTP verification successful', 
            data: { user: userResponse, token } 
        });
    } catch (error) {
        console.error('💥 OTP verification error:', error);
        return json({ 
            success: false, 
            message: 'Server error during OTP verification',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, 500);
    }
};