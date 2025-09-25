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
        const { name, email, phone, password, customerType, hostel, address } = parseBody(event);

        if (!name || !email || !phone || !password || !customerType) {
            return json({ success: false, message: 'Validation failed' }, 400);
        }

        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            return json({ success: false, message: 'User with this email or phone already exists' }, 400);
        }

        const user = new User({
            name,
            email,
            phone,
            password,
            customerType,
            hostel: customerType === 'college' ? hostel : undefined,
            address
        });
        await user.save();

        const token = generateToken(user._id);
        return json({ success: true, message: 'User registered successfully', data: { user, token } }, 201);
    } catch (e) {
        return json({ success: false, message: 'Server error during registration' }, 500);
    }
};


