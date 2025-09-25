const mongoose = require('mongoose');

let isConnected = false;

async function connectToDatabase() {
    if (isConnected && mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI is not set');
    }

    // Reuse existing connection across Netlify function invocations
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    }

    isConnected = mongoose.connection.readyState === 1;
    return mongoose.connection;
}

module.exports = { connectToDatabase };


