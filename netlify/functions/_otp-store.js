/**
 * Simple in-memory OTP store for serverless functions
 * 
 * This module provides a shared Map to store OTPs between function invocations
 * Note: This is suitable for development/testing but for production,
 * consider using a database or other persistent storage
 */

// Create a Map to store OTPs with email as key
// Each entry will contain: { otp: string, expiry: Date }
const otpStore = new Map();

// Export the store for use in other functions
module.exports = {
  otpStore
};