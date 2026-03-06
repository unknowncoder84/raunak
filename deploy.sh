#!/bin/bash

# BlockShop Marketplace - Netlify Deployment Script

echo "🚀 BlockShop Marketplace - Netlify Deployment"
echo "=============================================="
echo ""

# Check if netlify-cli is installed
if ! command -v netlify &> /dev/null
then
    echo "❌ Netlify CLI not found!"
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

echo "✅ Netlify CLI found"
echo ""

# Navigate to frontend directory
echo "📁 Navigating to frontend directory..."
cd frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    
    # Go back to root
    cd ..
    
    # Deploy to Netlify
    echo "🚀 Deploying to Netlify..."
    netlify deploy --prod
    
    echo ""
    echo "🎉 Deployment complete!"
    echo "🌐 Your site is now live!"
else
    echo "❌ Build failed!"
    echo "Please check the error messages above."
    exit 1
fi
