/**
 * Shared OTP store module
 * This provides a persistent OTP store that can be shared between serverless functions
 */

// OTP storage (in-memory for simplicity, consider using a database in production)
const otpStore = new Map();

module.exports = {
    otpStore
};