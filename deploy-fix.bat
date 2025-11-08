@echo off
echo ========================================
echo   GaramDoodh Admin Portal - Deploy Fix
echo ========================================
echo.

echo Step 1: Checking Git status...
git status
echo.

echo Step 2: Adding all changes...
git add .
echo.

echo Step 3: Committing changes...
git commit -m "Fix admin portal - display real database data from MongoDB"
echo.

echo Step 4: Pushing to trigger Netlify deployment...
git push origin main
echo.

echo ========================================
echo   Deployment initiated!
echo ========================================
echo.
echo Your changes are being deployed to Netlify.
echo This usually takes 2-5 minutes.
echo.
echo Next steps:
echo 1. Go to https://app.netlify.com
echo 2. Check the "Deploys" tab
echo 3. Wait for "Published" status
echo 4. Clear browser cache (Ctrl+Shift+Delete)
echo 5. Visit https://garamdoodh.netlify.app/admin.html
echo.
echo Press any key to exit...
pause > nul