/**
 * Persistent OTP store for serverless functions
 * 
 * This module provides a storage mechanism for OTPs that persists between function invocations
 * For Netlify serverless functions, we'll use MongoDB to store OTPs
 */

const mongoose = require('mongoose');
const { connectToDatabase } = require('../../db');

// Define a schema for OTP storage
const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  otp: {
    type: String,
    required: true
  },
  expiry: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // Auto-delete after 5 minutes (300 seconds)
  }
});

// Create the model (or get it if it already exists)
let OTPModel;
try {
  OTPModel = mongoose.model('OTP');
} catch (error) {
  OTPModel = mongoose.model('OTP', otpSchema);
}

// OTP store interface that mimics Map but uses MongoDB
const otpStore = {
  async set(email, { otp, expiry }) {
    await connectToDatabase();
    
    // Upsert the OTP (update if exists, insert if not)
    await OTPModel.findOneAndUpdate(
      { email },
      { email, otp, expiry, createdAt: new Date() },
      { upsert: true, new: true }
    );
  },
  
  async get(email) {
    await connectToDatabase();
    
    const otpData = await OTPModel.findOne({ email });
    if (!otpData) return null;
    
    return {
      otp: otpData.otp,
      expiry: otpData.expiry
    };
  },
  
  async delete(email) {
    await connectToDatabase();
    await OTPModel.deleteOne({ email });
  }
};

// Export the store for use in other functions
module.exports = {
  otpStore
};