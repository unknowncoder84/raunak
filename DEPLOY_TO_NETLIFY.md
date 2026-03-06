# 🚀 DEPLOY TO NETLIFY - Complete Guide

## ✅ Prerequisites

Before deploying, you MUST complete these steps:

### Step 1: Run SQL Schema in Supabase ⚠️ CRITICAL
1. Open https://supabase.com/dashboard
2. Select your project
3. Go to "SQL Editor" → "New Query"
4. Copy ALL content from `RUN_THIS_IN_SUPABASE.sql`
5. Paste and click "Run"
6. Wait for "Success" message
7. Go to "Table Editor" and verify you see:
   - ✅ users (3 rows)
   - ✅ products (20 rows)
   - ✅ orders (0 rows - empty)
   - ✅ reviews (0 rows - empty)

### Step 2: Enable Realtime
1. In Supabase dashboard, go to "Database" → "Replication"
2. Find "orders" table
3. Toggle "Enable" for realtime
4. Click "Save"

### Step 3: Verify Local Setup
```bash
cd frontend
npm start
```

Test locally:
1. Login: `buyer1@test.com` / `buy01`
2. Go to `/test-order`
3. Create test order
4. Check Supabase dashboard → orders table
5. ✅ Order should appear in database!

## 🌐 Deploy to Netlify

### Method 1: Netlify CLI (Recommended)

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Build the app**:
   ```bash
   cd frontend
   npm run build
   ```

4. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

5. **Follow prompts**:
   - Choose "Create & configure a new site"
   - Select your team
   - Site name: `w3mart-blockchain` (or your choice)
   - Publish directory: `build`

### Method 2: Netlify Dashboard

1. **Build locally**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Go to Netlify**:
   - Open https://app.netlify.com
   - Click "Add new site" → "Deploy manually"
   - Drag and drop the `build` folder
   - Wait for deployment

3. **Configure environment variables**:
   - Go to Site settings → Environment variables
   - Add these variables:
     ```
     REACT_APP_SUPABASE_URL=https://ddytpnlvtjcymlqekbda.supabase.co
     REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeXRwbmx2dGpjeW1scWVrYmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTk4NjYsImV4cCI6MjA4Nzg3NTg2Nn0.abxicjNc-n3oWzsljI-bbrc3d9mTcEb2Aa_cqewEi1I
     REACT_APP_DEMO_MODE=false
     REACT_APP_BLOCKCHAIN_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
     REACT_APP_ESCROW_CONTRACT_ADDRESS=0xYourDeployedContractAddress
     ```
   - Click "Save"

4. **Redeploy**:
   - Go to "Deploys" tab
   - Click "Trigger deploy" → "Deploy site"

### Method 3: GitHub Integration (Best for CI/CD)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/w3mart.git
   git push -u origin main
   ```

2. **Connect to Netlify**:
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub"
   - Select your repository
   - Configure build settings:
     - Base directory: `frontend`
     - Build command: `npm run build`
     - Publish directory: `frontend/build`

3. **Add environment variables** (same as Method 2)

4. **Deploy**:
   - Click "Deploy site"
   - Netlify will auto-deploy on every push!

## 📋 Build Configuration

Create `frontend/netlify.toml`:
```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

## 🔧 Environment Variables

Make sure these are set in Netlify:

```env
REACT_APP_SUPABASE_URL=https://ddytpnlvtjcymlqekbda.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeXRwbmx2dGpjeW1scWVrYmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTk4NjYsImV4cCI6MjA4Nzg3NTg2Nn0.abxicjNc-n3oWzsljI-bbrc3d9mTcEb2Aa_cqewEi1I
REACT_APP_DEMO_MODE=false
```

## ✅ Post-Deployment Checklist

After deployment, test these:

1. **Visit your site**: `https://your-site.netlify.app`

2. **Test login**:
   - Email: `buyer1@test.com`
   - Password: `buy01`

3. **Test order creation**:
   - Go to `/test-order`
   - Create test order
   - Check if it appears in "My Orders"

4. **Verify Supabase**:
   - Go to Supabase dashboard
   - Check orders table
   - Order should be there!

5. **Test seller side**:
   - Logout
   - Login: `Seller1@test.com` / `user1`
   - Check dashboard
   - Order should appear!

## 🔍 Troubleshooting

### Build fails
```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment variables not working
- Make sure they're set in Netlify dashboard
- Redeploy after adding variables
- Check variable names (must start with REACT_APP_)

### Orders not persisting
- Verify SQL schema was run
- Check Supabase connection in browser console
- Verify `REACT_APP_DEMO_MODE=false`

### 404 errors on refresh
- Make sure `netlify.toml` has redirects
- Or add `_redirects` file in `public` folder:
  ```
  /*    /index.html   200
  ```

## 📊 Deployment Checklist

- [ ] SQL schema run in Supabase
- [ ] Tables verified (users, products, orders, reviews)
- [ ] Realtime enabled on orders table
- [ ] Local testing successful
- [ ] Environment variables configured
- [ ] Build successful locally
- [ ] Deployed to Netlify
- [ ] Site accessible
- [ ] Login works
- [ ] Orders persist after refresh
- [ ] Buyer/seller sync works

## 🎯 Quick Deploy Commands

```bash
# 1. Build
cd frontend
npm run build

# 2. Deploy with Netlify CLI
netlify deploy --prod

# 3. Or deploy manually
# Drag 'build' folder to Netlify dashboard
```

## 🌟 Your Site is Live!

Once deployed:
- ✅ Data persists permanently
- ✅ No more data loss on refresh
- ✅ Real-time sync between users
- ✅ Accessible from anywhere
- ✅ Production-ready!

---

**Next Steps**:
1. Run SQL schema in Supabase
2. Test locally
3. Deploy to Netlify
4. Share your live site!
