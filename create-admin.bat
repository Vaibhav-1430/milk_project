@echo off
echo.
echo ========================================
echo   GaramDoodh Admin User Creation
echo ========================================
echo.
echo Adding admin credentials to MongoDB Atlas...
echo.

node scripts/add-admin.js

echo.
echo Press any key to exit...
pause >nul