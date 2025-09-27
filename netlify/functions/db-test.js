const { json } = require('./_utils');
const { connectToDatabase } = require('../../db');
const User = require('../../models/User');

exports.handler = async (event) => {
    try {
        // Test database connection
        const connection = await connectToDatabase();
        
        // Test user count
        const userCount = await User.countDocuments();
        
        // Test creating a simple user (without saving)
        const testUser = new User({
            name: 'Test User',
            email: `test${Date.now()}@example.com`,
            phone: '9876543210',
            password: 'test123',
            customerType: 'outsider',
            address: 'Test Address'
        });
        
        // Validate the user (this will test the schema)
        const validationError = testUser.validateSync();
        
        return json({
            success: true,
            message: 'Database connection successful',
            data: {
                connectionState: connection.readyState,
                databaseName: connection.name,
                userCount: userCount,
                validationTest: validationError ? 'Failed' : 'Passed',
                validationError: validationError ? validationError.message : null,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Database test error:', error);
        return json({
            success: false,
            message: 'Database connection failed',
            error: error.message,
            timestamp: new Date().toISOString()
        }, 500);
    }
};