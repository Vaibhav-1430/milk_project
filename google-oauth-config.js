// ✅ Google OAuth Configuration
// All sensitive values are now loaded from environment variables (.env or Netlify settings)

const GOOGLE_OAUTH_CONFIG = {
    // Google OAuth Client ID
    clientId: process.env.GOOGLE_CLIENT_ID,

    // Google Client Secret (server-side only, do not expose in frontend)
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,

    // Callback URL for OAuth flow
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'https://garamdoodh.netlify.app/auth/google/callback',

    // Authorized domain URLs (must also be added in Google Cloud Console)
    authorizedOrigins: [
        'http://localhost:5500',        
        'http://localhost:3000',        
        'https://garamdoodh.netlify.app'
    ],

    // Scopes for Google login
    scopes: [
        'openid',
        'email',
        'profile'
    ]
};

// ✅ Initialize Google Sign-In
function initializeGoogleSignIn() {
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
            client_id: GOOGLE_OAUTH_CONFIG.clientId,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true
        });

        console.log('✅ Google Sign-In initialized');
        return true;
    } else {
        console.error('❌ Google Sign-In library not loaded');
        return false;
    }
}

// ✅ Validate if config is set properly
function checkGoogleOAuthConfig() {
    if (!GOOGLE_OAUTH_CONFIG.clientId) {
        console.warn('⚠️ GOOGLE_CLIENT_ID is missing. Please set it in environment variables.');
        return false;
    }
    if (!GOOGLE_OAUTH_CONFIG.callbackUrl) {
        console.warn('⚠️ GOOGLE_CALLBACK_URL is missing. Please set it in environment variables.');
        return false;
    }

    console.log('✅ Google OAuth configuration looks good');
    return true;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GOOGLE_OAUTH_CONFIG,
        initializeGoogleSignIn,
        checkGoogleOAuthConfig
    };
}
