// netlify/functions/api.js
const serverless = require('serverless-http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import your existing routes
const orderRoutes = require('../../routes/orders');
const adminRoutes = require('../../routes/admin');
const authRoutes = require('../../routes/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err.message));

// ✅ Mount routes without `/api` prefix
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('🚀 GaramDoodh API running on Netlify Functions!');
});

// Export Netlify handler
module.exports.handler = serverless(app);
