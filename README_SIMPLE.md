# 🛒 W3 Mart - E-commerce Platform

## ✅ READY TO USE - Demo Mode Active

All features are working in demo mode with localStorage. No database setup needed!

## 🚀 Quick Start

```bash
cd frontend
npm start
```

The app will open at `http://localhost:3000`

## 👥 Test Accounts

### Buyer Account
- Email: `buyer1@test.com`
- Password: `buy01`

### Seller Account
- Email: `Seller1@test.com` (note capital 'S')
- Password: `user1`

## 🎯 Features

### For Buyers
- Browse 200+ products across 7 categories
- Add products to cart
- Secure checkout with escrow payment
- Track orders in real-time
- View order history
- Filter orders by status
- Leave reviews after delivery

### For Sellers
- View all orders in dashboard
- Accept/reject orders
- Mark orders as shipped
- Track earnings and sales
- Manage inventory (200 products)
- View customer reviews
- Analytics dashboard

## 📦 Order Flow

1. **Buyer places order** → Status: Pending
2. **Seller accepts** → Status: Accepted (Ready to Ship)
3. **Seller ships** → Status: Shipped
4. **Delivered** → Status: Delivered (Payment released)

## 🔄 Real-time Sync

- Buyer orders auto-refresh every 10 seconds
- Seller dashboard auto-refresh every 3 seconds
- Changes sync automatically between buyer and seller

## 📊 What's Included

- 200 demo products (Mobiles, Electronics, Fashion, Home, Books, Sports, Gaming)
- Complete order management system
- Escrow payment protection
- Real-time notifications
- Order tracking
- Review system
- Analytics dashboard

## 🧪 Testing

### Quick Test
1. Login as buyer (`buyer1@test.com` / `buy01`)
2. Add product to cart
3. Checkout and place order
4. Go to "My Orders" → **Order appears!**
5. Logout and login as seller (`Seller1@test.com` / `user1`)
6. Check dashboard → **Order appears!**
7. Accept order → Mark as shipped → Complete

### Debug Tool
Open `TEST_NOW.html` in browser for:
- Create test orders instantly
- View all orders
- Check storage
- Clear orders

### Visual Guide
Open `VISUAL_TEST_GUIDE.html` for complete visual walkthrough

## 📁 Project Structure

```
blockchain-main/
├── frontend/
│   ├── src/
│   │   ├── pages/           # All pages (Home, Cart, Orders, Dashboard)
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API services (supabaseService.js)
│   │   ├── contexts/        # React contexts (Cart, Notifications)
│   │   └── data/            # Mock data (200 products)
│   ├── .env                 # Config (DEMO_MODE=true)
│   └── package.json
├── backend/                 # Python backend (optional)
├── TEST_NOW.html           # Debug tool
├── VISUAL_TEST_GUIDE.html  # Visual guide
└── ORDER_FLOW_WORKING.md   # Detailed documentation
```

## 🎨 Key Files

- `frontend/src/services/supabaseService.js` - Order management
- `frontend/src/pages/CartPage.jsx` - Order creation
- `frontend/src/pages/BuyerOrdersPage.jsx` - Buyer order view
- `frontend/src/pages/SellerDashboard.jsx` - Seller order view
- `frontend/src/data/sampleProducts.js` - 200 demo products

## 💾 Data Storage

All data stored in browser localStorage:
- `w3mart_orders` - All orders
- `w3mart_seller_products` - All products
- `w3mart_cart` - Shopping cart

## 🔧 Configuration

Edit `frontend/.env`:
```env
REACT_APP_DEMO_MODE=true  # Demo mode (localStorage)
```

## 📝 Important Notes

1. **Demo Mode**: All data in localStorage (no database)
2. **Persistence**: Data survives page refresh
3. **Real-time**: Auto-refresh keeps data synced
4. **Credentials**: Use exact credentials (case-sensitive!)
5. **Products**: 200 products auto-initialized for Seller1@test.com

## 🎉 Everything Works!

- ✅ Order creation
- ✅ Order display (buyer & seller)
- ✅ Order tracking
- ✅ Status updates
- ✅ Real-time sync
- ✅ Inventory management
- ✅ Payment escrow
- ✅ Notifications

## 🚀 Deploy to Netlify

See `DEPLOY.html` for deployment instructions.

## 📖 Documentation

- `ORDER_FLOW_WORKING.md` - Complete order flow guide
- `VISUAL_TEST_GUIDE.html` - Visual walkthrough
- `TEST_NOW.html` - Debug tool
- `DEPLOY.html` - Deployment guide

## 🆘 Troubleshooting

### Orders not showing?
1. Check browser console for logs
2. Open `TEST_NOW.html` → Click "Check Storage"
3. Verify you're using correct credentials
4. Clear localStorage and try again

### Products not showing?
1. Login as `Seller1@test.com` (capital 'S')
2. Go to Inventory Management
3. Products auto-initialize on first load

### Need fresh start?
```javascript
// In browser console:
localStorage.clear();
location.reload();
```

## 💡 Tips

- Use browser console to see detailed logs
- Orders auto-refresh (no manual refresh needed)
- All 200 products belong to Seller1@test.com
- Demo mode = no database setup required
- Everything persists in localStorage

---

**Ready to test? Start the app and login!** 🚀
