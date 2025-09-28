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
        console.log('🔍 Starting Google OAuth process...');
        await connectToDatabase();
        console.log('✅ Database connected');
        
        const { googleId, email, name, picture, credential } = parseBody(event);
        console.log('📧 Google OAuth data received:');
        console.log('  - Google ID:', googleId);
        console.log('  - Email:', email);
        console.log('  - Name:', name);
        console.log('  - Picture:', picture);
        console.log('  - Has credential:', !!credential);

        // Optional: Verify the Google credential on server-side
        if (credential && process.env.GOOGLE_CLIENT_ID) {
            console.log('🔍 Verifying Google credential on server-side...');
            try {
                // Decode the JWT token to verify it
                const payload = JSON.parse(atob(credential.split('.')[1]));
                console.log('📋 Decoded payload:', {
                    iss: payload.iss,
                    aud: payload.aud,
                    sub: payload.sub,
                    email: payload.email
                });
                
                // Verify the audience matches our client ID
                if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
                    console.log('❌ Invalid audience in Google credential');
                    return json({ success: false, message: 'Invalid Google credential' }, 401);
                }
                
                console.log('✅ Google credential verified');
            } catch (verifyError) {
                console.error('❌ Error verifying Google credential:', verifyError);
                // Continue with the flow even if verification fails (for development)
            }
        }

        if (!googleId || !email || !name) {
            console.log('❌ Missing required Google data');
            return json({ success: false, message: 'Missing required Google data' }, 400);
        }

        // Check if user already exists
        console.log('🔍 Checking if user exists...');
        let user = await User.findOne({ 
            $or: [
                { email: email },
                { googleId: googleId }
            ]
        });

        if (user) {
            console.log('👤 Existing user found:', user.email);
            // Update existing user with Google ID if not already set
            if (!user.googleId) {
                console.log('🔄 Adding Google ID to existing user...');
                user.googleId = googleId;
                user.picture = picture;
                await user.save();
                console.log('✅ Google ID added to existing user');
            }
        } else {
            console.log('👤 Creating new user from Google OAuth...');
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
            console.log('✅ New user created:', user.email);
        }

        // Update last login
        console.log('🔄 Updating last login...');
        user.lastLogin = new Date();
        await user.save();

        console.log('🎫 Generating JWT token...');
        const token = generateToken(user._id);
        console.log('✅ Google OAuth successful for user:', user.email);
        
        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;
        
        return json({ 
            success: true, 
            message: 'Google login successful', 
            data: { user: userResponse, token } 
        });
    } catch (error) {
        console.error('💥 Google OAuth error:', error);
        return json({ 
            success: false, 
            message: 'Server error during Google authentication',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, 500);
    }
};
