/**
 * Generate high-quality products for BlockShop
 * 200+ products with realistic data
 */

const categories = ['Electronics', 'Mobiles', 'Fashion', 'Home', 'Books', 'Sports', 'Gaming'];

// Realistic product templates for each category
const productTemplates = {
  Electronics: [
    'MacBook Pro', 'Dell XPS', 'HP Laptop', 'Asus ROG', 'Sony Headphones', 'Bose Speaker',
    'iPad Pro', 'Samsung Tablet', 'Canon Camera', 'Nikon DSLR', 'GoPro', 'DJI Drone',
    'LG Monitor', 'Samsung Monitor', 'Logitech Mouse', 'Razer Keyboard', 'Webcam HD',
    'External SSD', 'Power Bank', 'WiFi Router', 'Smart Speaker', 'Ring Doorbell',
    'Philips Hue', 'Kindle', 'Apple Watch', 'Fitbit', 'AirPods', 'Gaming Headset'
  ],
  Mobiles: [
    'iPhone 15 Pro', 'iPhone 14', 'iPhone SE', 'Samsung Galaxy S24', 'Samsung A54',
    'Google Pixel 8', 'Google Pixel 7a', 'OnePlus 12', 'OnePlus Nord', 'Xiaomi 14',
    'Xiaomi Redmi', 'Realme GT', 'Oppo Find X', 'Vivo V29', 'Motorola Edge',
    'Nothing Phone', 'Asus ROG Phone', 'Sony Xperia', 'Nokia XR', 'Poco F5',
    'Honor Magic', 'Galaxy Z Fold', 'Galaxy Z Flip', 'Infinix Note', 'Tecno Phantom'
  ],
  Fashion: [
    'Nike Air Max', 'Adidas Ultraboost', 'Puma Suede', 'Converse Chuck Taylor',
    'Vans Old Skool', 'Reebok Classic', 'Under Armour Shoes', 'Skechers',
    'Levi\'s Jeans', 'Diesel Jeans', 'Tommy Hilfiger Polo', 'Ralph Lauren Shirt',
    'Lacoste Polo', 'Champion Hoodie', 'Gap Hoodie', 'Uniqlo Jacket',
    'North Face Jacket', 'Columbia Fleece', 'Patagonia Backpack', 'Herschel Bag',
    'Ray-Ban Sunglasses', 'Oakley Sunglasses', 'Casio Watch', 'Seiko Watch',
    'Michael Kors Bag', 'Fossil Belt', 'Timberland Boots', 'Crocs Clogs'
  ],
  Home: [
    'Dyson Vacuum', 'iRobot Roomba', 'Shark Steam Mop', 'Bissell Cleaner',
    'Nespresso Machine', 'Keurig Coffee Maker', 'Cuisinart Maker', 'Breville Toaster',
    'Philips Air Fryer', 'Ninja Foodi', 'Instant Pot', 'KitchenAid Mixer',
    'Vitamix Blender', 'Ninja Blender', 'Calphalon Cookware', 'Lodge Cast Iron',
    'Pyrex Storage', 'Rubbermaid Set', 'Oxo Utensils', 'Wusthof Knives',
    'Levoit Air Purifier', 'Honeywell Purifier', 'Lasko Fan', 'Simplehuman Trash Can'
  ],
  Books: [
    'Atomic Habits', 'Psychology of Money', 'Sapiens', 'Think Like a Monk',
    'The Alchemist', 'Rich Dad Poor Dad', 'The 5 AM Club', 'Deep Work',
    'Subtle Art', '1984', 'Power of Now', 'Educated', '7 Habits',
    'Thinking Fast and Slow', 'Lean Startup', 'Zero to One', '4-Hour Workweek',
    'Shoe Dog', 'Becoming', 'Dune', 'The Hobbit', 'Harry Potter Set',
    'Da Vinci Code', 'Catcher in the Rye', 'Great Gatsby', 'To Kill a Mockingbird'
  ],
  Sports: [
    'Yoga Mat', 'Dumbbells Set', 'Resistance Bands', 'Fitbit Tracker',
    'Wilson Basketball', 'Adidas Soccer Ball', 'Tennis Racket', 'Foam Roller',
    'Jump Rope', 'Kettlebell', 'Gym Gloves', 'Protein Shaker', 'Cycling Helmet',
    'Swimming Goggles', 'Badminton Set', 'Ab Roller', 'Bowflex Bench',
    'TRX Trainer', 'Garmin Watch', 'Spalding Ball', 'Nike Shorts',
    'Yonex Racket', 'Boxing Gloves', 'Swim Cap', 'Volleyball', 'Lifting Straps'
  ],
  Gaming: [
    'PlayStation 5', 'Xbox Series X', 'Nintendo Switch', 'Steam Deck',
    'Gaming Headset', 'Razer Mouse', 'Corsair Keyboard', 'Gaming Chair',
    'VR Headset', 'Gaming Monitor', 'Xbox Controller', 'PS5 Controller',
    'Gaming Desk', 'Capture Card', 'Gaming Mousepad', 'Steering Wheel',
    'RGB LED Strip', 'Elgato Stream Deck', 'HyperX Headset', 'Logitech G Pro',
    'Secretlab Chair', 'BenQ Monitor', 'Valve Index', 'Scuf Controller'
  ]
};

const imageUrls = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500',
  'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500',
  'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500',
  'https://images.unsplash.com/photo-1592286927505-b0c2e0a13e60?w=500',
  'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500',
  'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500'
];

export function generateSampleProducts(sellerId, sellerName, sellerEmail, count = 200) {
  const products = [];
  const timestamp = Date.now();
  let productIndex = 0;
  
  // Generate products for each category
  categories.forEach(category => {
    const templates = productTemplates[category];
    const productsPerCategory = Math.ceil(count / categories.length);
    
    for (let i = 0; i < productsPerCategory && productIndex < count; i++) {
      const template = templates[i % templates.length];
      const variant = Math.floor(i / templates.length) + 1;
      const productName = variant > 1 ? `${template} ${variant}` : template;
      
      // Price ranges by category
      let priceRange = { min: 0.01, max: 0.5 };
      if (category === 'Electronics') priceRange = { min: 0.05, max: 2.5 };
      else if (category === 'Mobiles') priceRange = { min: 0.3, max: 1.5 };
      else if (category === 'Fashion') priceRange = { min: 0.04, max: 0.4 };
      else if (category === 'Home') priceRange = { min: 0.03, max: 0.5 };
      else if (category === 'Books') priceRange = { min: 0.005, max: 0.05 };
      else if (category === 'Sports') priceRange = { min: 0.01, max: 1.0 };
      else if (category === 'Gaming') priceRange = { min: 0.05, max: 1.0 };
      
      const price = parseFloat((Math.random() * (priceRange.max - priceRange.min) + priceRange.min).toFixed(4));
      
      const product = {
        id: `${category.toLowerCase()}-${timestamp}-${productIndex}`,
        name: productName,
        description: `High quality ${productName.toLowerCase()} with excellent features and performance. Perfect for daily use.`,
        price: price,
        image: imageUrls[productIndex % imageUrls.length],
        category: category,
        discount: [0, 5, 10, 15, 20, 25][productIndex % 6],
        seller_id: sellerId,
        seller_name: sellerName,
        seller_email: sellerEmail,
        stock: Math.floor(Math.random() * 80) + 10, // 10 to 90 stock
        blockchain_verified: true,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      products.push(product);
      productIndex++;
    }
  });
  
  return products;
}

export function addSampleProductsToLocalStorage(sellerId, sellerName, sellerEmail, count = 1000) {
  const existingProducts = JSON.parse(localStorage.getItem('w3mart_seller_products') || '[]');
  
  // Remove existing products for this seller
  const otherProducts = existingProducts.filter(p => p.seller_id !== sellerId && p.seller_email !== sellerEmail);
  
  // Generate new products
  const newProducts = generateSampleProducts(sellerId, sellerName, sellerEmail, count);
  
  // Combine and save
  const allProducts = [...otherProducts, ...newProducts];
  localStorage.setItem('w3mart_seller_products', JSON.stringify(allProducts));
  
  console.log(`✅ Added ${count} sample products for seller: ${sellerName}`);
  return newProducts;
}

// Initialize demo products on app load (200 products across all categories)
export function initializeDemoProducts() {
  const existingProducts = JSON.parse(localStorage.getItem('w3mart_seller_products') || '[]');
  
  // ULTIMATE FIX: Auto-fix old products with wrong seller email
  let needsUpdate = false;
  const fixedProducts = existingProducts.map(p => {
    if (p.seller_email === 'seller@test.com' || p.seller_id === 'seller@test.com') {
      needsUpdate = true;
      return {
        ...p,
        seller_id: 'Seller1@test.com',
        seller_email: 'Seller1@test.com',
        seller_name: 'Demo Seller'
      };
    }
    return p;
  });
  
  if (needsUpdate) {
    console.log('🔧 Auto-fixing products with wrong seller email...');
    localStorage.setItem('w3mart_seller_products', JSON.stringify(fixedProducts));
    console.log(`✅ Fixed ${fixedProducts.length} products to use Seller1@test.com`);
  }
  
  // Check if demo products already exist (check for both old and new seller emails)
  const demoProductsExist = fixedProducts.some(p => 
    p.seller_email?.toLowerCase() === 'seller1@test.com' || 
    p.seller_email === 'seller@test.com'
  );
  
  if (!demoProductsExist || fixedProducts.length < 100) {
    console.log('🎬 Initializing 200 demo products across all categories...');
    // Use Seller1@test.com to match the demo seller account
    const demoProducts = generateSampleProducts('Seller1@test.com', 'Demo Seller', 'Seller1@test.com', 200);
    localStorage.setItem('w3mart_seller_products', JSON.stringify(demoProducts));
    console.log(`✅ ${demoProducts.length} demo products initialized for Seller1@test.com`);
    return demoProducts;
  }
  
  console.log(`✅ Found ${existingProducts.length} existing products`);
  return existingProducts;
}
