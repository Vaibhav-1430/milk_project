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
        const { googleId, email, name, picture } = parseBody(event);

        if (!googleId || !email || !name) {
            return json({ success: false, message: 'Missing required Google data' }, 400);
        }

        // Check if user already exists
        let user = await User.findOne({ 
            $or: [
                { email: email },
                { googleId: googleId }
            ]
        });

        if (user) {
            // Update existing user with Google ID if not already set
            if (!user.googleId) {
                user.googleId = googleId;
                user.picture = picture;
                await user.save();
            }
        } else {
            // Create new user
            user = new User({
                name: name,
                email: email,
                googleId: googleId,
                picture: picture,
                customerType: 'outsider', // Default type
                address: 'Address to be updated',
                phone: '0000000000', // Placeholder
                password: 'google-oauth-user', // Placeholder password
                isActive: true
            });
            await user.save();
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user._id);
        
        return json({ 
            success: true, 
            message: 'Google login successful', 
            data: { user, token } 
        });
    } catch (error) {
        console.error('Google auth error:', error);
        return json({ 
            success: false, 
            message: 'Server error during Google authentication' 
        }, 500);
    }
};
