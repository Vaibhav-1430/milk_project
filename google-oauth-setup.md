# Google OAuth Setup Guide

## 🔧 Setting up Google OAuth for GaramDoodh

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google+ API** (or **Google Identity Services**)

### Step 2: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Add authorized origins:
   - `http://localhost:5500` (for local development)
   - `http://localhost:3000` (alternative local port)
   - `https://your-site.netlify.app` (for production)
5. Copy the **Client ID** (it looks like: `123456789-abcdefg.apps.googleusercontent.com`)

### Step 3: Update Your Configuration
1. Open `google-oauth-config.js`
2. Replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID:

```javascript
const GOOGLE_OAUTH_CONFIG = {
    clientId: 'your-actual-client-id-here.apps.googleusercontent.com',
    // ... rest of config
};
```

### Step 4: Test Google OAuth
1. Open `test-login-flows.html`
2. Click "Check Google Config" to verify setup
3. Click "Test Google OAuth" to test the flow

## 🚨 Common Issues & Solutions

### Issue 1: "Invalid Client ID"
**Solution:**
- Make sure you copied the correct Client ID from Google Cloud Console
- Check that your domain is in authorized origins
- Verify the Client ID format: `number-string.apps.googleusercontent.com`

### Issue 2: "Redirect URI Mismatch"
**Solution:**
- Add your exact domain to authorized origins in Google Cloud Console
- Include both HTTP (localhost) and HTTPS (production) versions
- Make sure there are no trailing slashes

### Issue 3: "Google Sign-In Not Available"
**Solution:**
- Check if Google Identity Services API is enabled
- Verify the Google script is loaded: `<script src="https://accounts.google.com/gsi/client" async defer></script>`
- Check browser console for JavaScript errors

### Issue 4: "This app isn't verified"
**Solution:**
- This is normal for development. Click "Advanced" → "Go to [Your App] (unsafe)"
- For production, you need to verify your app with Google

## 📝 Environment Variables for Netlify

Add these to your Netlify environment variables (if needed for server-side validation):
```
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

## 🧪 Testing & Debugging

### Test Pages Available:
- `test-login-flows.html` - **Main testing page** with all login flows
- `debug-login.html` - Debug normal login issues
- `test-login.html` - Basic login testing
- `test-signup.html` - Signup testing

### Debugging Steps:
1. **Check Configuration**: Use "Check Google Config" button
2. **Test APIs**: Use "Test All APIs" to verify backend
3. **Check Console**: Open browser dev tools to see detailed logs
4. **Test Database**: Use "Test Database" to verify connection

### Console Logs to Look For:
- `✅ Google Sign-In initialized` - Configuration is working
- `📧 Google OAuth payload` - Data received from Google
- `📊 Backend response status` - API response status
- `✅ Google OAuth successful` - Complete flow working

## 🔧 Quick Fixes

### If Google OAuth Still Not Working:
1. **Clear browser cache** and try again
2. **Check Google Cloud Console** - make sure your domain is in authorized origins
3. **Verify Client ID** - copy it exactly from Google Cloud Console
4. **Test in incognito mode** - to avoid cached issues
5. **Check browser console** - look for JavaScript errors

### For Production Deployment:
1. Add your production domain to authorized origins
2. Update the Client ID in `google-oauth-config.js`
3. Test the flow on your live site
