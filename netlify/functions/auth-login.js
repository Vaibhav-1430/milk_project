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
        return json({ success: false, message: 'Method Not Allowed' }, 405);
    }
    try {
        await connectToDatabase();
        const { email, password } = parseBody(event);
        if (!email || !password) {
            return json({ success: false, message: 'Validation failed' }, 400);
        }
        const user = await User.findOne({ email }).select('+password');
        if (!user || !user.isActive) {
            return json({ success: false, message: 'Invalid credentials' }, 401);
        }
        const valid = await user.comparePassword(password);
        if (!valid) {
            return json({ success: false, message: 'Invalid credentials' }, 401);
        }
        user.lastLogin = new Date();
        await user.save();
        const token = generateToken(user._id);
        return json({ success: true, message: 'Login successful', data: { user, token } });
    } catch (e) {
        return json({ success: false, message: 'Server error during login' }, 500);
    }
};


