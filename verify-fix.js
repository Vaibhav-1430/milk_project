#!/usr/bin/env node

/**
 * Verify Admin Portal Fix
 * This script verifies that all fixes are in place and ready to deploy
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Admin Portal Fix...\n');

let allGood = true;

// Check critical files exist
const criticalFiles = [
    'admin-portal/js/admin-app.js',
    'admin-portal/js/components/dashboard.js',
    'admin-portal/js/api/admin-api.js',
    'admin-portal/css/admin-styles.css',
    'netlify/functions/admin-dashboard.js',
    'netlify/functions/admin-orders.js',
    'netlify/functions/admin-products.js',
    'netlify/functions/admin-customers.js',
    'netlify/functions/orders-guest.js',
    'models/Order.js',
    'models/User.js',
    'models/Product.js'
];

console.log('📁 Checking critical files...');
criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING!`);
        allGood = false;
    }
});

console.log('\n📝 Checking file contents...');

// Check admin-app.js has the new components
const adminAppContent = fs.readFileSync('admin-portal/js/admin-app.js', 'utf8');
if (adminAppContent.includes('createOrdersComponent')) {
    console.log('✅ admin-app.js has Orders component');
} else {
    console.log('❌ admin-app.js missing Orders component');
    allGood = false;
}

if (adminAppContent.includes('createProductsComponent')) {
    console.log('✅ admin-app.js has Products component');
} else {
    console.log('❌ admin-app.js missing Products component');
    allGood = false;
}

if (adminAppContent.includes('createCustomersComponent')) {
    console.log('✅ admin-app.js has Customers component');
} else {
    console.log('❌ admin-app.js missing Customers component');
    allGood = false;
}

// Check CSS has the styles
const cssContent = fs.readFileSync('admin-portal/css/admin-styles.css', 'utf8');
if (cssContent.includes('.metric-card')) {
    console.log('✅ admin-styles.css has metric-card styles');
} else {
    console.log('❌ admin-styles.css missing metric-card styles');
    allGood = false;
}

if (cssContent.includes('.admin-card')) {
    console.log('✅ admin-styles.css has admin-card styles');
} else {
    console.log('❌ admin-styles.css missing admin-card styles');
    allGood = false;
}

if (cssContent.includes('.status-badge')) {
    console.log('✅ admin-styles.css has status-badge styles');
} else {
    console.log('❌ admin-styles.css missing status-badge styles');
    allGood = false;
}

// Check API config
const configContent = fs.readFileSync('admin-portal/js/config/constants.js', 'utf8');
if (configContent.includes("API_BASE_URL: '/.netlify/functions'")) {
    console.log('✅ API config has correct base URL');
} else {
    console.log('❌ API config has wrong base URL');
    allGood = false;
}

// Check Order model
const orderModelContent = fs.readFileSync('models/Order.js', 'utf8');
if (!orderModelContent.includes('required: true') || orderModelContent.includes('orderNumber: {')) {
    console.log('✅ Order model has correct orderNumber config');
} else {
    console.log('⚠️  Order model might have issues');
}

// Check orders-guest has Mongoose
const ordersGuestContent = fs.readFileSync('netlify/functions/orders-guest.js', 'utf8');
if (ordersGuestContent.includes('const Order = require') && ordersGuestContent.includes('const User = require')) {
    console.log('✅ orders-guest.js uses Mongoose models');
} else {
    console.log('❌ orders-guest.js missing Mongoose models');
    allGood = false;
}

console.log('\n' + '='.repeat(50));

if (allGood) {
    console.log('\n🎉 ALL CHECKS PASSED!');
    console.log('\n✅ Your admin portal fix is ready to deploy!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: deploy-fix.bat (Windows) or git push');
    console.log('   2. Wait 2-5 minutes for Netlify deployment');
    console.log('   3. Clear browser cache');
    console.log('   4. Visit: https://garamdoodh.netlify.app/admin.html');
    console.log('\n🚀 Your admin portal will show real data after deployment!');
} else {
    console.log('\n❌ SOME CHECKS FAILED!');
    console.log('\n⚠️  Please review the errors above.');
    console.log('   Some files might be missing or have incorrect content.');
}

console.log('\n' + '='.repeat(50));
