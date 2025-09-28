const GOOGLE_OAUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  authorizedOrigins: [
    'http://localhost:5500',
    'http://localhost:3000',
    'https://garamdoodh.netlify.app'
  ],
  scopes: ['openid','email','profile']
};

export { GOOGLE_OAUTH_CONFIG };