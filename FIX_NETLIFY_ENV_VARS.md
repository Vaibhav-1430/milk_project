# 🔧 FIX: Set Environment Variables on Netlify

## The Problem
Your Netlify functions are returning 500 errors because they can't access environment variables like `MONGODB_URI`, `JWT_SECRET`, etc.

## ✅ Solution: Add Environment Variables to Netlify

### Step 1: Go to Netlify Dashboard
1. Open https://app.netlify.com
2. Click on your site (garamdoodh)
3. Go to **Site settings**
4. Click **Environment variables** (in the left sidebar)

### Step 2: Add These Variables

Click "Add a variable" and add each of these:

#### Required Variables:

**MONGODB_URI**
```
mongodb+srv://2024244563vaibhav_db_user:21abLqaeW66FqStq@garamdoodh-cluster.invjkhn.mongodb.net/?retryWrites=true&w=majority&appName=garamdoodh-cluster
```

**JWT_SECRET**
```
Gd9v!Xk7@3PzQ#1Lf8RvY6mB2WcZ0HsT
```

**JWT_EXPIRE**
```
7d
```

**RAZORPAY_KEY_ID**
```
rzp_live_RLKa3dYIPnE2b8
```

**RAZORPAY_KEY_SECRET**
```
PqzMNWNSd1YWEY9ixa7dxMfX
```

**FRONTEND_URL**
```
https://garamdoodh.netlify.app/
```

**ADMIN_EMAIL**
```
admin@garamdoodh.com
```

**ADMIN_PASSWORD**
```
admin123
```

#### Optional Variables (for email):

**EMAIL_HOST**
```
smtp.gmail.com
```

**EMAIL_PORT**
```
587
```

**EMAIL_USER**
```
garamdhoodh11@gmail.com
```

**EMAIL_PASS**
```
ehcz oyab hlpk eoio
```

**EMAIL_WORKER_URL**
```
https://garamdoodh.netlify.app/.netlify/functions/send-email
```

**EMAIL_WORKER_SECRET**
```
gd_worker_92jfhs8kls92kfjh38sl
```

### Step 3: Trigger Redeploy

After adding all variables:
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait 2-3 minutes for deployment

### Step 4: Test

After deployment completes:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Visit: https://garamdoodh.netlify.app/admin.html
3. Login and check if data appears

## 🎯 Quick Check

You can verify environment variables are set by:
1. Netlify Dashboard → Site Settings → Environment variables
2. You should see all the variables listed above

## ⚠️ Important Notes

- Environment variables are ONLY available to Netlify functions
- They are NOT accessible in frontend JavaScript
- Changes to environment variables require a redeploy
- Keep these values secret - don't share them publicly

## 🔍 How to Verify It's Working

After setting environment variables and redeploying:

1. Open browser console (F12)
2. Go to admin portal
3. You should see:
   - ✅ No 500 errors
   - ✅ Dashboard shows real numbers
   - ✅ Orders, products, customers load

## 🆘 If Still Not Working

Check Netlify function logs:
1. Netlify Dashboard → Functions tab
2. Click on a function (e.g., admin-dashboard)
3. View the logs to see the actual error
4. Look for "MONGODB_URI is not set" or similar errors

---

**This is the most common issue with Netlify deployments!**
Environment variables from your local `.env` file are NOT automatically copied to Netlify.
You MUST set them manually in the Netlify dashboard.