# 🖥️ Terminal Setup - Add Admin Credentials to MongoDB Atlas

## Quick Setup Commands

### Option 1: NPM Script (Recommended)
```bash
npm run create-admin
```

### Option 2: Direct Node.js
```bash
node scripts/add-admin.js
```

### Option 3: Windows Batch File
```cmd
create-admin.bat
```

### Option 4: Unix/Linux/Mac Shell Script
```bash
chmod +x create-admin.sh
./create-admin.sh
```

## Prerequisites

1. **Node.js installed** (v14 or higher)
2. **Dependencies installed**:
   ```bash
   npm install
   ```
3. **Environment variables set** in `.env` file:
   ```env
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret
   ```

## What the Script Does

The terminal script will:

1. ✅ **Connect** to your MongoDB Atlas database
2. ✅ **Remove** any existing admin user (clean slate)
3. ✅ **Create** new admin user with:
   - Email: `admin@garamdoodh.com`
   - Password: `admin123`
   - Role: `admin`
   - Status: `active`
4. ✅ **Test** password hashing and verification
5. ✅ **Confirm** everything works
6. ✅ **Display** login credentials

## Expected Output

```
🚀 Adding admin user to MongoDB Atlas...
📡 Connecting to MongoDB Atlas...
✅ Connected successfully
🗑️ Removing any existing admin user...
👤 Creating admin user...
✅ Admin user created successfully
🔐 Testing password...
✅ Password test passed

🎉 SUCCESS! Admin credentials added to MongoDB Atlas

📋 Admin Details:
   ID: 507f1f77bcf86cd799439011
   Name: Admin User
   Email: admin@garamdoodh.com
   Role: admin
   Active: true

🔑 Login Credentials:
   📧 Email: admin@garamdoodh.com
   🔒 Password: admin123

🌐 Login URL:
   https://garamdoodh.netlify.app/login.html

✨ You can now login to your admin portal!
```

## Troubleshooting

### Error: "MONGODB_URI is not defined"
**Fix:** Add your MongoDB Atlas connection string to `.env` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

### Error: "Cannot connect to MongoDB"
**Fix:** 
1. Check your MongoDB Atlas connection string
2. Ensure your IP is whitelisted in MongoDB Atlas
3. Verify database user has read/write permissions

### Error: "Module not found"
**Fix:** Install dependencies:
```bash
npm install
```

### Error: "Permission denied"
**Fix:** On Unix/Linux/Mac, make script executable:
```bash
chmod +x create-admin.sh
```

## Verification Steps

After running the script:

1. **Test Login:**
   - Go to: https://garamdoodh.netlify.app/login.html
   - Email: `admin@garamdoodh.com`
   - Password: `admin123`

2. **Check Database:**
   - Open MongoDB Atlas dashboard
   - Navigate to your database
   - Check `users` collection
   - Look for admin user with role: "admin"

3. **Verify Admin Portal:**
   - After login, you should see real-time admin dashboard
   - Check if orders, customers, and products load from database

## Alternative Methods

If terminal doesn't work, you can also:

1. **Web Interface:** https://garamdoodh.netlify.app/setup-admin-instant.html
2. **Debug Page:** https://garamdoodh.netlify.app/admin-debug.html
3. **API Call:** https://garamdoodh.netlify.app/.netlify/functions/setup-admin-now

## Security Notes

- The script creates a default admin password (`admin123`)
- **Change this password** after first login for security
- The password is automatically hashed using bcrypt
- Admin role gives full access to the portal

## Next Steps

After successful admin creation:

1. ✅ Login to admin portal
2. ✅ Change default password
3. ✅ Explore real-time dashboard
4. ✅ Manage orders, products, and customers
5. ✅ Set up additional admin users if needed

---

**Need Help?** 
- Check the console output for detailed error messages
- Verify your `.env` file configuration
- Ensure MongoDB Atlas connection is working