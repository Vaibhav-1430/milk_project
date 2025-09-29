const { json, parseBody } = require('./_utils');
const { connectToDatabase } = require('../../db');
const User = require('../../models/User');
const nodemailer = require('nodemailer');

// Import the shared OTP store from a separate module for persistence between functions
const { otpStore } = require('./_otp-store');

// Generate a random 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Configure nodemailer transporter
// For development/testing, use a mock transporter if credentials aren't available
let transporter;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
} else {
    // Mock transporter for testing
    console.warn('⚠️ Email credentials not found. Using mock email transport for testing.');
    transporter = {
        sendMail: (mailOptions) => {
            console.log('📧 MOCK EMAIL SENT:', {
                to: mailOptions.to,
                subject: mailOptions.subject,
                otp: mailOptions.html.match(/(\d{6})/)[0] // Extract OTP from HTML
            });
            return Promise.resolve({ messageId: 'mock-email-id-' + Date.now() });
        }
    };
}

// Send OTP via email
async function sendOTPEmail(email, otp) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your GaramDoodh Login OTP',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4F46E5;">GaramDoodh</h1>
                </div>
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="margin-top: 0; color: #111827;">Your One-Time Password</h2>
                    <p style="color: #4b5563; margin-bottom: 20px;">Use the following OTP to complete your login:</p>
                    <div style="background-color: #4F46E5; color: white; font-size: 24px; font-weight: bold; text-align: center; padding: 12px; border-radius: 6px; letter-spacing: 4px;">
                        ${otp}
                    </div>
                    <p style="color: #4b5563; margin-top: 20px; font-size: 14px;">This OTP will expire in 5 minutes.</p>
                </div>
                <div style="text-align: center; color: #6b7280; font-size: 12px;">
                    <p>If you didn't request this OTP, please ignore this email.</p>
                    <p>&copy; ${new Date().getFullYear()} GaramDoodh. All rights reserved.</p>
                </div>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return json({ success: false, message: 'Method Not Allowed' }, 405);
    }
    
    try {
        console.log('🔍 Starting OTP generation process...');
        await connectToDatabase();
        
        const { email } = parseBody(event);
        console.log('📧 OTP request for email:', email);
        
        if (!email) {
            return json({ success: false, message: 'Email is required' }, 400);
        }
        
        // Check if user exists
        const user = await User.findOne({ email });
        
        if (!user) {
            return json({ success: false, message: 'User not found' }, 404);
        }
        
        // Generate OTP
        const otp = generateOTP();
        console.log('🔢 Generated OTP for user:', otp);
        
        // Store OTP with expiry time (5 minutes)
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + 5);
        
        await otpStore.set(email, {
            otp,
            expiry: expiryTime
        });
        
        // Send OTP via email
        await sendOTPEmail(email, otp);
        console.log('✉️ OTP sent to email:', email);
        
        return json({ 
            success: true, 
            message: 'OTP sent successfully',
            expiresIn: 300 // 5 minutes in seconds
        });
    } catch (error) {
        console.error('💥 OTP generation error:', error);
        return json({ 
            success: false, 
            message: 'Server error during OTP generation',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, 500);
    }
};