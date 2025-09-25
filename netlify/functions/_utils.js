const jwt = require('jsonwebtoken');
const { connectToDatabase } = require('../../db');
const User = require('../../models/User');

function json(body, statusCode = 200, headers = {}) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body)
    };
}

function parseBody(event) {
    try {
        return JSON.parse(event.body || '{}');
    } catch (_) {
        return {};
    }
}

async function requireAuth(event) {
    await connectToDatabase();
    const authHeader = event.headers && (event.headers.authorization || event.headers.Authorization);
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
        const err = new Error('No token provided, authorization denied');
        err.statusCode = 401;
        throw err;
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            const err = new Error('Token is not valid');
            err.statusCode = 401;
            throw err;
        }
        return user;
    } catch (e) {
        const err = new Error('Token is not valid');
        err.statusCode = 401;
        throw err;
    }
}

module.exports = { json, parseBody, requireAuth };


