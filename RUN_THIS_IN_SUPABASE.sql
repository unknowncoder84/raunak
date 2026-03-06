-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR NOW!
-- ============================================
-- This will create all tables and fix the foreign key issue
-- Copy this ENTIRE file and paste in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. DROP EXISTING TABLES (if any)
-- ============================================
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- 2. CREATE USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
  phone TEXT,
  avatar_url TEXT,
  wallet_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- 3. CREATE PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 4) NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  stock INTEGER DEFAULT 0,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  seller_email TEXT NOT NULL,
  seller_name TEXT,
  discount INTEGER DEFAULT 0,
  blockchain_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_seller_email ON products(seller_email);
CREATE INDEX idx_products_category ON products(category);

-- ============================================
-- 4. CREATE ORDERS TABLE (NO FOREIGN KEYS!)
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  
  -- Product Info
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_description TEXT,
  product_category TEXT,
  product_image TEXT,
  
  -- Buyer Info (NO FOREIGN KEY - uses email as identifier)
  buyer_id TEXT,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  
  -- Seller Info (NO FOREIGN KEY - uses email as identifier)
  seller_id TEXT,
  seller_email TEXT NOT NULL,
  seller_name TEXT,
  
  -- Order Details
  quantity INTEGER DEFAULT 1,
  amount DECIMAL(10, 4) NOT NULL,
  total_amount DECIMAL(10, 4) NOT NULL,
  discount_amount DECIMAL(10, 4) DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  
  -- Additional Info
  shipping_address JSONB,
  payment_method TEXT,
  applied_coupon TEXT,
  tracking_id TEXT,
  rejection_reason TEXT,
  blockchain_tx TEXT,
  blockchain_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer_email ON orders(buyer_email);
CREATE INDEX idx_orders_seller_email ON orders(seller_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- ============================================
-- 5. CREATE REVIEWS TABLE
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id TEXT,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  seller_id TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_buyer_email ON reviews(buyer_email);

-- ============================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. CREATE PERMISSIVE POLICIES (ALLOW ALL)
-- ============================================
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 8. AUTO-UPDATE TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. INSERT DEMO USERS
-- ============================================
INSERT INTO users (email, full_name, role, wallet_address) VALUES
  ('buyer1@test.com', 'Test Buyer', 'buyer', '0x1234567890123456789012345678901234567890'),
  ('Seller1@test.com', 'Demo Seller', 'seller', '0x0987654321098765432109876543210987654321'),
  ('admin@test.com', 'Admin User', 'admin', '0xABCDEF1234567890ABCDEF1234567890ABCDEF12');

-- ============================================
-- 10. INSERT DEMO PRODUCTS (20 products)
-- ============================================
DO $$
DECLARE
  seller_uuid UUID;
BEGIN
  -- Get seller UUID
  SELECT id INTO seller_uuid FROM users WHERE email = 'Seller1@test.com';
  
  -- Insert products
  INSERT INTO products (name, description, price, category, image, stock, seller_id, seller_email, seller_name, discount, blockchain_verified) VALUES
    ('iPhone 15 Pro Max', 'A17 Pro chip, Titanium design, 48MP camera', 0.65, 'Mobiles', 'https://images.unsplash.com/photo-1592286927505-2fd0d113e4e4?w=500', 50, seller_uuid, 'Seller1@test.com', 'Demo Seller', 8, true),
    ('Samsung Galaxy S24 Ultra', 'Snapdragon 8 Gen 3, 200MP camera', 0.58, 'Mobiles', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500', 45, seller_uuid, 'Seller1@test.com', 'Demo Seller', 12, true),
    ('MacBook Air M3', '15-inch Liquid Retina, M3 chip', 0.72, 'Electronics', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500', 30, seller_uuid, 'Seller1@test.com', 'Demo Seller', 8, true),
    ('iPad Pro 12.9"', 'M2 chip, Liquid Retina XDR', 0.55, 'Electronics', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500', 40, seller_uuid, 'Seller1@test.com', 'Demo Seller', 10, true),
    ('Sony WH-1000XM5', 'Noise cancellation, 30hr battery', 0.18, 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 60, seller_uuid, 'Seller1@test.com', 'Demo Seller', 15, true),
    ('AirPods Pro 2', 'Active noise cancellation', 0.12, 'Electronics', 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=500', 80, seller_uuid, 'Seller1@test.com', 'Demo Seller', 12, true),
    ('Nike Air Max 270', 'Max Air cushioning, breathable mesh', 0.08, 'Fashion', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', 100, seller_uuid, 'Seller1@test.com', 'Demo Seller', 20, true),
    ('Levi''s 501 Jeans', 'Classic straight fit, button fly', 0.045, 'Fashion', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', 150, seller_uuid, 'Seller1@test.com', 'Demo Seller', 25, true),
    ('Ray-Ban Aviator', 'Classic metal frame, UV protection', 0.035, 'Fashion', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500', 120, seller_uuid, 'Seller1@test.com', 'Demo Seller', 15, true),
    ('Leather Crossbody Bag', 'Genuine leather, adjustable strap', 0.055, 'Fashion', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500', 80, seller_uuid, 'Seller1@test.com', 'Demo Seller', 30, true),
    ('Smart LED Bulb', 'WiFi enabled, 16 million colors', 0.015, 'Home', 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=500', 200, seller_uuid, 'Seller1@test.com', 'Demo Seller', 20, true),
    ('Robot Vacuum', 'Auto-charging, app control', 0.22, 'Home', 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500', 40, seller_uuid, 'Seller1@test.com', 'Demo Seller', 15, true),
    ('Air Purifier', 'HEPA filter, quiet operation', 0.18, 'Home', 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500', 50, seller_uuid, 'Seller1@test.com', 'Demo Seller', 18, true),
    ('Coffee Maker', 'Programmable, 12-cup capacity', 0.045, 'Home', 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500', 90, seller_uuid, 'Seller1@test.com', 'Demo Seller', 25, true),
    ('Atomic Habits Book', 'James Clear - Bestseller', 0.008, 'Books', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500', 300, seller_uuid, 'Seller1@test.com', 'Demo Seller', 10, true),
    ('The Psychology of Money', 'Morgan Housel - Finance', 0.007, 'Books', 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=500', 250, seller_uuid, 'Seller1@test.com', 'Demo Seller', 15, true),
    ('Yoga Mat', 'Non-slip, eco-friendly', 0.025, 'Sports', 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500', 150, seller_uuid, 'Seller1@test.com', 'Demo Seller', 20, true),
    ('Dumbbells Set', '5-50 lbs adjustable', 0.15, 'Sports', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500', 60, seller_uuid, 'Seller1@test.com', 'Demo Seller', 12, true),
    ('PlayStation 5', 'Ultra HD Blu-ray, 825GB SSD', 0.28, 'Gaming', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500', 35, seller_uuid, 'Seller1@test.com', 'Demo Seller', 5, true),
    ('Gaming Headset', '7.1 surround sound, RGB lighting', 0.065, 'Gaming', 'https://images.unsplash.com/photo-1599669454699-248893623440?w=500', 100, seller_uuid, 'Seller1@test.com', 'Demo Seller', 18, true);
END $$;

-- ============================================
-- 11. ENABLE REALTIME FOR ORDERS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ============================================
-- DONE! ✅
-- ============================================
-- Tables created successfully!
-- Now go back to your code and set REACT_APP_DEMO_MODE=false
