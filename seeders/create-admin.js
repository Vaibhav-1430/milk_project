// Create admin user seeder
const { connectToDatabase } = require('../db');
const User = require('../models/User');

async function createAdminUser() {
    try {
        console.log('🔗 Connecting to database...');
        await connectToDatabase();
        console.log('✅ Database connected');

        // Check if admin user already exists
        const existingAdmin = await User.findOne({ email: 'admin@garamdoodh.com' });
        
        if (existingAdmin) {
            console.log('👤 Admin user already exists');
            
            // Update existing user to admin role
            existingAdmin.role = 'admin';
            await existingAdmin.save();
            console.log('✅ Updated existing user to admin role');
            
            return existingAdmin;
        }

        // Create new admin user
        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@garamdoodh.com',
            phone: '9999999999',
            password: 'admin123', // This will be hashed automatically by the User model
            role: 'admin',
            customerType: 'outsider',
            address: {
                street: 'Admin Office',
                city: 'Admin City',
                state: 'Admin State',
                pincode: '123456'
            },
            isActive: true
        });

        await adminUser.save();
        console.log('✅ Admin user created successfully');
        console.log('📧 Email: admin@garamdoodh.com');
        console.log('🔐 Password: admin123');
        console.log('👤 Role:', adminUser.role);

        return adminUser;
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    createAdminUser()
        .then(() => {
            console.log('🎉 Admin user setup complete');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Failed to create admin user:', error);
            process.exit(1);
        });
}

module.exports = { createAdminUser };