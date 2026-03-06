@echo off
REM BlockShop Marketplace - Netlify Deployment Script (Windows)

echo ========================================
echo BlockShop Marketplace - Netlify Deploy
echo ========================================
echo.

REM Check if netlify-cli is installed
where netlify >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Netlify CLI not found!
    echo Installing Netlify CLI...
    call npm install -g netlify-cli
)

echo Netlify CLI found
echo.

REM Navigate to frontend directory
echo Navigating to frontend directory...
cd frontend

REM Install dependencies
echo Installing dependencies...
call npm install

REM Build the project
echo Building project...
call npm run build

REM Check if build was successful
if %ERRORLEVEL% EQU 0 (
    echo Build successful!
    echo.
    
    REM Go back to root
    cd ..
    
    REM Deploy to Netlify
    echo Deploying to Netlify...
    call netlify deploy --prod
    
    echo.
    echo Deployment complete!
    echo Your site is now live!
) else (
    echo Build failed!
    echo Please check the error messages above.
    exit /b 1
)

pause
