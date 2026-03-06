-- ============================================
-- CLEANUP DUPLICATE ORDERS - SQL SCRIPT
-- ============================================
-- Run this in Supabase SQL Editor to remove duplicate orders

-- OPTION 1: Delete duplicates keeping the oldest order
-- This keeps the first order created and removes subsequent duplicates
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY product_id, buyer_email, seller_email, quantity, 
                   DATE_TRUNC('second', created_at)
      ORDER BY created_at ASC
    ) as row_num
  FROM orders
)
DELETE FROM orders
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- OPTION 2: Delete duplicates with same blockchain_tx_hash
-- This removes orders with duplicate transaction hashes
WITH tx_duplicates AS (
  SELECT 
    id,
    blockchain_tx,
    ROW_NUMBER() OVER (
      PARTITION BY blockchain_tx
      ORDER BY created_at ASC
    ) as row_num
  FROM orders
  WHERE blockchain_tx IS NOT NULL
)
DELETE FROM orders
WHERE id IN (
  SELECT id FROM tx_duplicates WHERE row_num > 1
);

-- OPTION 3: View duplicates before deleting (SAFE - READ ONLY)
-- Run this first to see what will be deleted
SELECT 
  product_name,
  buyer_email,
  seller_email,
  quantity,
  created_at,
  COUNT(*) as duplicate_count
FROM orders
GROUP BY product_name, buyer_email, seller_email, quantity, 
         DATE_TRUNC('second', created_at)
HAVING COUNT(*) > 1
ORDER BY created_at DESC;

-- OPTION 4: Delete orders created within 1 second of each other
-- More aggressive - removes orders that are suspiciously close in time
WITH time_duplicates AS (
  SELECT 
    o1.id as id1,
    o2.id as id2,
    o1.created_at as time1,
    o2.created_at as time2,
    EXTRACT(EPOCH FROM (o2.created_at - o1.created_at)) as time_diff
  FROM orders o1
  JOIN orders o2 ON 
    o1.product_id = o2.product_id AND
    o1.buyer_email = o2.buyer_email AND
    o1.seller_email = o2.seller_email AND
    o1.quantity = o2.quantity AND
    o1.id < o2.id AND
    o2.created_at - o1.created_at < INTERVAL '1 second'
)
DELETE FROM orders
WHERE id IN (SELECT id2 FROM time_duplicates);

-- OPTION 5: Delete all orders for a specific buyer (CAREFUL!)
-- Use this if you want to clean a specific user's orders
-- DELETE FROM orders WHERE buyer_email = 'buyer1@test.com';

-- OPTION 6: Count total duplicates (SAFE - READ ONLY)
SELECT 
  'Total Orders' as metric,
  COUNT(*) as count
FROM orders
UNION ALL
SELECT 
  'Unique Orders' as metric,
  COUNT(DISTINCT (product_id, buyer_email, seller_email, quantity, DATE_TRUNC('second', created_at)))
FROM orders
UNION ALL
SELECT 
  'Duplicate Orders' as metric,
  COUNT(*) - COUNT(DISTINCT (product_id, buyer_email, seller_email, quantity, DATE_TRUNC('second', created_at)))
FROM orders;

-- ============================================
-- PREVENTION: Add unique constraint (RECOMMENDED)
-- ============================================
-- This prevents future duplicates at the database level

-- Add unique constraint on blockchain_tx_hash
ALTER TABLE orders 
ADD CONSTRAINT unique_blockchain_tx 
UNIQUE (blockchain_tx);

-- Note: This will fail if you already have duplicate tx hashes
-- Clean duplicates first using OPTION 2 above

-- ============================================
-- JAVASCRIPT CLEANUP (for localStorage)
-- ============================================
-- Run this in browser console (F12) to clean localStorage

/*
// Remove all duplicate orders from localStorage
const orders = JSON.parse(localStorage.getItem('w3mart_orders') || '[]');
console.log('Before cleanup:', orders.length, 'orders');

// Create a Set to track unique orders
const seen = new Set();
const uniqueOrders = orders.filter(order => {
  // Create unique key
  const key = `${order.product_id}-${order.buyer_email}-${order.seller_email}-${order.quantity}-${new Date(order.created_at).getTime()}`;
  
  // Check if we've seen this order
  if (seen.has(key)) {
    console.log('Removing duplicate:', order.id);
    return false; // Remove duplicate
  }
  
  seen.add(key);
  return true; // Keep unique
});

console.log('After cleanup:', uniqueOrders.length, 'orders');
console.log('Removed:', orders.length - uniqueOrders.length, 'duplicates');

// Save cleaned orders
localStorage.setItem('w3mart_orders', JSON.stringify(uniqueOrders));
console.log('✅ Cleanup complete!');
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check for remaining duplicates
SELECT 
  product_name,
  buyer_email,
  COUNT(*) as count
FROM orders
GROUP BY product_name, buyer_email
HAVING COUNT(*) > 1;

-- View recent orders
SELECT 
  id,
  order_number,
  product_name,
  buyer_email,
  seller_email,
  status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- RECOMMENDED APPROACH
-- ============================================
-- 1. Run OPTION 3 to view duplicates (safe)
-- 2. Run OPTION 1 to delete duplicates (keeps oldest)
-- 3. Run verification query to confirm
-- 4. Add unique constraint to prevent future duplicates
-- ============================================
