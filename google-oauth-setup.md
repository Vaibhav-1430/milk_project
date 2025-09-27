# Google OAuth Setup Guide

## 🔧 Setting up Google OAuth for GaramDoodh

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API

### Step 2: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Add authorized origins:
   - `http://localhost:5500` (for local development)
   - `https://your-site.netlify.app` (for production)
5. Copy the **Client ID**

### Step 3: Update Your Code
Replace `YOUR_GOOGLE_CLIENT_ID` in `login.html` with your actual Client ID:

```javascript
google.accounts.id.initialize({
    client_id: 'your-actual-client-id-here.apps.googleusercontent.com',
    callback: handleGoogleResponse,
    auto_select: false,
    cancel_on_tap_outside: true
});
```

### Step 4: Test Google OAuth
1. Open `test-login.html`
2. Click "Test Google Auth"
3. Follow the setup instructions

## 🚨 Common Issues

### Issue 1: "Invalid Client ID"
- Make sure you copied the correct Client ID
- Check that your domain is in authorized origins

### Issue 2: "Redirect URI Mismatch"
- Add your exact domain to authorized origins
- Include both HTTP (localhost) and HTTPS (production) versions

### Issue 3: "Google Sign-In Not Available"
- Check if Google API is enabled
- Verify the script is loaded correctly

## 📝 Environment Variables for Netlify

Add these to your Netlify environment variables:
```
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

## 🧪 Testing

Use the test pages to verify everything works:
- `test-login.html` - Test login functionality
- `test-signup.html` - Test signup functionality
- `debug-database.html` - Test database connection
