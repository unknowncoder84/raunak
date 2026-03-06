# 🚀 Start Local Server - Quick Guide

## Step 1: Clean Duplicates First
```
1. Open ULTIMATE_DUPLICATE_CLEANER.html in your browser
2. Click "Clean Duplicates" 
3. This removes any existing duplicate orders
```

## Step 2: Start the Frontend Server
```bash
cd frontend
npm start
```

## Step 3: Access the Application
```
URL: http://localhost:3000
```

## Step 4: Test Accounts
```
Buyer Account:
- Email: buyer1@test.com
- Password: buy01

Seller Account:
- Email: Seller1@test.com  
- Password: user1
```

## Step 5: Test the Duplicate Fix
```
1. Login as buyer
2. Add any product to cart
3. Checkout → Click "Place Order" 5 TIMES RAPIDLY
4. ✅ Should see warning message
5. ✅ Should create ONLY 1 order
6. Check "My Orders" → Should see 1 order
7. Try to cancel the order (should work if pending)
```

## If You See Errors:
```bash
# Clear cache and restart
npm run build
npm start

# Or install dependencies
npm install
npm start
```

## Expected Console Output:
```
Compiled successfully!

You can now view the app in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

Ready to start!