import { createClient } from '@supabase/supabase-js';
import { MOCK_PRODUCTS } from '../data/mockData';

/**
 * Supabase Service for E-commerce Data
 * KAIRO INTEGRATION: Configure Supabase URL and key in .env
 * This service handles products, users, orders, and reviews
 * W3 MART STANDARD: Uses high-quality mock data from mockData.js
 */

class SupabaseService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isDemoMode = process.env.REACT_APP_DEMO_MODE === 'true';
    this.orderCreationLock = false; // Global lock to prevent concurrent order creation
    this.recentOrders = new Map(); // Track recent orders to prevent duplicates
    this.initialize();
  }

  /**
   * Initialize Supabase client
   * KAIRO: Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in .env
   */
  initialize() {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

    // FORCE DEMO MODE if enabled - ignore Supabase connection
    if (this.isDemoMode) {
      console.log('🎮 DEMO MODE ACTIVE - Using localStorage only');
      this.isConnected = false;
      this.client = null;
      return;
    }

    if (supabaseUrl && supabaseKey && 
        supabaseUrl !== 'https://your-project.supabase.co' &&
        supabaseKey !== 'your-anon-key-here') {
      try {
        this.client = createClient(supabaseUrl, supabaseKey);
        this.isConnected = true;
        console.log('Supabase connected');
      } catch (error) {
        console.warn('Supabase connection failed, using demo mode:', error);
        this.isConnected = false;
      }
    } else {
      console.log('Supabase not configured - Demo Mode active');
      this.isConnected = false;
    }
  }

  /**
   * Get all products
   * KAIRO: Replace with your Supabase products table query
   */
  async getProducts() {
    if (!this.isConnected || this.isDemoMode) {
      return this.getMockProducts();
    }

    try {
      const { data, error } = await this.client
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching products:', error);
      return this.getMockProducts();
    }
  }

  /**
   * Get product by ID
   */
  async getProduct(productId) {
    if (!this.isConnected || this.isDemoMode) {
      return this.getMockProducts().find(p => p.id === productId);
    }

    try {
      const { data, error } = await this.client
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching product:', error);
      return this.getMockProducts().find(p => p.id === productId);
    }
  }

  /**
   * Create order record
   * PRODUCTION MODE: Stores in Supabase with real-time sync
   * DEMO MODE: Stores in localStorage
   */
  async createOrder(orderData) {
    // ULTRA-AGGRESSIVE DUPLICATE PREVENTION
    const orderKey = `${orderData.product_id}-${orderData.buyer_email}-${orderData.quantity}`;
    
    // Check if we've processed this exact order in the last 10 seconds
    if (this.recentOrders.has(orderKey)) {
      const lastTime = this.recentOrders.get(orderKey);
      const timeDiff = Date.now() - lastTime;
      if (timeDiff < 10000) { // 10 seconds
        console.log('⚠️ ULTRA-DUPLICATE PREVENTION - Order blocked');
        console.log(`   Same order attempted ${timeDiff}ms ago`);
        return { success: false, error: 'Duplicate order detected. Please wait before trying again.' };
      }
    }

    // CRITICAL: Global lock to prevent concurrent order creation
    if (this.orderCreationLock) {
      console.log('⚠️ ORDER CREATION LOCKED - Another order is being processed');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check again after waiting
      if (this.orderCreationLock) {
        console.log('⚠️ Still locked, rejecting duplicate order creation');
        return { success: false, error: 'Order creation in progress, please wait' };
      }
    }

    this.orderCreationLock = true;
    this.recentOrders.set(orderKey, Date.now());

    try {
      console.log('🔵 CREATE ORDER - Starting...');
      console.log('   isConnected:', this.isConnected);
      console.log('   isDemoMode:', this.isDemoMode);

      // DEMO MODE: Use localStorage
      if (this.isDemoMode || !this.isConnected) {
        try {
          // CRITICAL: Check for duplicate orders within last 5 seconds (more aggressive)
          const existingOrders = JSON.parse(localStorage.getItem('w3mart_orders') || '[]');
          const now = Date.now();
          const recentDuplicate = existingOrders.find(order => {
            const orderTime = new Date(order.created_at).getTime();
            const timeDiff = now - orderTime;
            
            // Check if same product, buyer, and seller within 5 seconds (reduced from 3)
            const sameOrder = timeDiff < 5000 &&
                   order.product_id === orderData.product_id &&
                   order.buyer_email === orderData.buyer_email &&
                   order.seller_email === orderData.seller_email &&
                   order.quantity === orderData.quantity;
            
            // IDEMPOTENCY: Also check blockchain transaction hash if provided
            const sameTxHash = orderData.blockchain_tx && 
                              order.blockchain_tx === orderData.blockchain_tx;
            
            return sameOrder || sameTxHash;
          });

          if (recentDuplicate) {
            console.log('⚠️ DUPLICATE ORDER DETECTED - Returning existing order');
            console.log('   Existing Order ID:', recentDuplicate.id);
            console.log('   Time difference:', now - new Date(recentDuplicate.created_at).getTime(), 'ms');
            return { success: true, order: recentDuplicate, isDuplicate: true };
          }

          const orderId = 'order-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
          const orderNumber = 'ORD-' + new Date().toISOString().slice(0,10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
          
          const newOrder = {
            id: orderId,
            order_number: orderNumber,
            ...orderData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          existingOrders.push(newOrder);
          localStorage.setItem('w3mart_orders', JSON.stringify(existingOrders));

          console.log('✅ Order created in localStorage (DEMO MODE)');
          return { success: true, order: newOrder };
        } catch (error) {
          console.error('❌ Error in demo mode:', error);
          return { success: false, error: error.message };
        }
      }

      // PRODUCTION MODE: Use Supabase
      // IDEMPOTENCY: Check for duplicate by blockchain_tx_hash if provided
      if (orderData.blockchain_tx) {
        console.log('🔍 Checking for existing order with tx hash:', orderData.blockchain_tx);
        const { data: existingOrder, error: checkError } = await this.client
          .from('orders')
          .select('*')
          .eq('blockchain_tx', orderData.blockchain_tx)
          .single();
        
        if (existingOrder && !checkError) {
          console.log('⚠️ DUPLICATE ORDER DETECTED - Order with this tx hash already exists');
          console.log('   Existing Order ID:', existingOrder.id);
          return { success: true, order: existingOrder, isDuplicate: true };
        }
      }

      // Generate order number
      const orderNumber = 'ORD-' + new Date().toISOString().slice(0,10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      
      // Prepare data for Supabase (no null foreign keys)
      const supabaseOrder = {
        order_number: orderNumber,
        product_id: orderData.product_id || 'unknown',
        product_name: orderData.product_name,
        product_description: orderData.product_description || '',
        product_category: orderData.product_category || 'General',
        product_image: orderData.product_image || '',
        buyer_id: orderData.buyer_email, // Use email as ID
        buyer_email: orderData.buyer_email,
        buyer_name: orderData.buyer_name || orderData.buyer_email.split('@')[0],
        seller_id: orderData.seller_email, // Use email as ID
        seller_email: orderData.seller_email,
        seller_name: orderData.seller_name || 'Seller',
        quantity: orderData.quantity || 1,
        amount: parseFloat(orderData.amount),
        total_amount: parseFloat(orderData.total_amount || orderData.amount),
        discount_amount: parseFloat(orderData.discount_amount || 0),
        status: orderData.status || 'pending',
        payment_status: orderData.payment_status || 'pending',
        shipping_address: orderData.shipping_address,
        payment_method: orderData.payment_method || 'demo',
        applied_coupon: orderData.applied_coupon || null,
        blockchain_verified: orderData.blockchain_verified || false,
        blockchain_tx: orderData.blockchain_tx || null // Store tx hash for idempotency
      };

      console.log('💾 Inserting into Supabase...');
      console.log('   Data:', JSON.stringify(supabaseOrder, null, 2));

      const { data, error } = await this.client
        .from('orders')
        .insert([supabaseOrder])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Order created in Supabase!');
      console.log('   Order ID:', data.id);
      console.log('   Order Number:', data.order_number);
      
      return { success: true, order: data };
    } catch (error) {
      console.error('❌ Error creating order:', error);
      return { success: false, error: error.message };
    } finally {
      // CRITICAL: Always release the lock
      setTimeout(() => {
        this.orderCreationLock = false;
        console.log('🔓 Order creation lock released');
      }, 2000); // Increased to 2 seconds for more aggressive prevention
    }
  }

  /**
   * Get user orders
   * Enhanced: Reads from localStorage for demo mode
   */
  async getUserOrders(userId) {
    if (!this.isConnected || this.isDemoMode) {
      // Get orders from localStorage
      const storedOrders = JSON.parse(localStorage.getItem('w3mart_orders') || '[]');
      
      // Filter by buyer email/ID (case-insensitive)
      const userIdLower = userId?.toLowerCase();
      const userOrders = storedOrders.filter(order => {
        const buyerEmailLower = order.buyer_email?.toLowerCase();
        const userIdOrderLower = order.user_id?.toLowerCase();
        const buyerIdLower = order.buyer_id?.toLowerCase();
        
        return buyerEmailLower === userIdLower ||
               userIdOrderLower === userIdLower ||
               buyerIdLower === userIdLower ||
               order.buyer_email === userId || 
               order.user_id === userId ||
               order.buyer_id === userId;
      });

      console.log(`🔍 Buyer ${userId} has ${userOrders.length} orders`);

      // Return real orders only - NO DUMMY DATA
      return userOrders.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
    }

    try {
      // Use buyer_email for querying (more reliable)
      const { data, error } = await this.client
        .from('orders')
        .select('*')
        .eq('buyer_email', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log(`✅ Fetched ${data.length} orders for buyer: ${userId}`);
      return data || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      
      // Fallback: try with buyer_id
      try {
        const { data, error: error2 } = await this.client
          .from('orders')
          .select('*')
          .eq('buyer_id', userId)
          .order('created_at', { ascending: false });
        
        if (error2) throw error2;
        console.log(`✅ Fetched ${data.length} orders using buyer_id`);
        return data || [];
      } catch (error2) {
        console.error('Error fetching with buyer_id:', error2);
        return [];
      }
    }
  }

  /**
   * Get seller orders
   * Enhanced: Reads from localStorage for demo mode
   */
  async getSellerOrders(sellerId) {
    if (!this.isConnected || this.isDemoMode) {
      // Get orders from localStorage
      const storedOrders = JSON.parse(localStorage.getItem('w3mart_orders') || '[]');
      
      // ULTIMATE FIX: Handle ALL possible seller email variations
      const sellerIdLower = sellerId?.toLowerCase();
      const sellerOrders = storedOrders.filter(order => {
        const orderSellerIdLower = order.seller_id?.toLowerCase();
        const orderSellerEmailLower = order.seller_email?.toLowerCase();
        
        // Match against all possible variations
        return orderSellerIdLower === sellerIdLower ||
               orderSellerEmailLower === sellerIdLower ||
               order.seller_id === sellerId ||
               order.seller_email === sellerId ||
               // ALSO match 'seller@test.com' if user is 'Seller1@test.com'
               (sellerIdLower === 'seller1@test.com' && orderSellerEmailLower === 'seller@test.com') ||
               (sellerIdLower === 'seller@test.com' && orderSellerEmailLower === 'seller1@test.com');
      });

      console.log(`🔍 Seller ${sellerId} has ${sellerOrders.length} orders`);
      console.log(`📊 Checked ${storedOrders.length} total orders`);
      
      // Return real orders only - NO DUMMY DATA
      return sellerOrders.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
    }

    try {
      // Use seller_email for querying (more reliable than seller_id)
      const { data, error} = await this.client
        .from('orders')
        .select('*')
        .eq('seller_email', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log(`✅ Fetched ${data.length} orders for seller: ${sellerId}`);
      return data || [];
    } catch (error) {
      console.error('Error fetching seller orders:', error);
      
      // Fallback: try with seller_id if seller_email fails
      try {
        const { data, error: error2 } = await this.client
          .from('orders')
          .select('*')
          .eq('seller_id', sellerId)
          .order('created_at', { ascending: false });
        
        if (error2) throw error2;
        console.log(`✅ Fetched ${data.length} orders using seller_id`);
        return data || [];
      } catch (error2) {
        console.error('Error fetching with seller_id:', error2);
        return [];
      }
    }
  }

  /**
   * Update order status
   * Enhanced: Updates localStorage for demo mode
   */
  async updateOrderStatus(orderId, status, reason = null, txHash = null, trackingId = null) {
    if (!this.isConnected || this.isDemoMode) {
      // Update in localStorage
      const storedOrders = JSON.parse(localStorage.getItem('w3mart_orders') || '[]');
      const orderIndex = storedOrders.findIndex(o => o.id === orderId);
      
      if (orderIndex !== -1) {
        storedOrders[orderIndex].status = status;
        storedOrders[orderIndex].updated_at = new Date().toISOString();
        
        if (reason) storedOrders[orderIndex].rejection_reason = reason;
        if (txHash) storedOrders[orderIndex].blockchain_tx = txHash;
        if (trackingId) storedOrders[orderIndex].tracking_id = trackingId;
        
        localStorage.setItem('w3mart_orders', JSON.stringify(storedOrders));
        console.log('✅ Order status updated:', orderId, '→', status);
      }
      
      return { success: true };
    }

    try {
      const updateData = { status };
      if (reason) updateData.rejection_reason = reason;
      if (txHash) updateData.blockchain_tx = txHash;
      if (trackingId) updateData.tracking_id = trackingId;

      const { error } = await this.client
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating order:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel order (only if status is 'pending')
   * Enhanced: Works with both localStorage and Supabase
   */
  async cancelOrder(orderId, buyerEmail, reason = 'Cancelled by buyer') {
    console.log('🚫 CANCEL ORDER - Starting...');
    console.log('   Order ID:', orderId);
    console.log('   Buyer Email:', buyerEmail);
    console.log('   Reason:', reason);

    if (!this.isConnected || this.isDemoMode) {
      // Cancel in localStorage
      const storedOrders = JSON.parse(localStorage.getItem('w3mart_orders') || '[]');
      const orderIndex = storedOrders.findIndex(o => o.id === orderId);
      
      if (orderIndex === -1) {
        console.error('❌ Order not found:', orderId);
        return { success: false, error: 'Order not found' };
      }

      const order = storedOrders[orderIndex];
      
      // Check if buyer owns this order
      if (order.buyer_email !== buyerEmail) {
        console.error('❌ Unauthorized: Buyer email mismatch');
        return { success: false, error: 'You can only cancel your own orders' };
      }

      // Check if order can be cancelled
      if (order.status !== 'pending') {
        console.error('❌ Cannot cancel: Order status is', order.status);
        return { success: false, error: `Cannot cancel order with status: ${order.status}. Only pending orders can be cancelled.` };
      }

      // Update order status to cancelled
      storedOrders[orderIndex].status = 'cancelled';
      storedOrders[orderIndex].cancellation_reason = reason;
      storedOrders[orderIndex].cancelled_at = new Date().toISOString();
      storedOrders[orderIndex].updated_at = new Date().toISOString();
      
      localStorage.setItem('w3mart_orders', JSON.stringify(storedOrders));
      console.log('✅ Order cancelled successfully:', orderId);
      
      return { success: true, order: storedOrders[orderIndex] };
    }

    try {
      // First, get the order to verify ownership and status
      const { data: order, error: fetchError } = await this.client
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError || !order) {
        console.error('❌ Order not found:', orderId);
        return { success: false, error: 'Order not found' };
      }

      // Check if buyer owns this order
      if (order.buyer_email !== buyerEmail) {
        console.error('❌ Unauthorized: Buyer email mismatch');
        return { success: false, error: 'You can only cancel your own orders' };
      }

      // Check if order can be cancelled
      if (order.status !== 'pending') {
        console.error('❌ Cannot cancel: Order status is', order.status);
        return { success: false, error: `Cannot cancel order with status: ${order.status}. Only pending orders can be cancelled.` };
      }

      // Update order status to cancelled
      const { data: updatedOrder, error: updateError } = await this.client
        .from('orders')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error cancelling order:', updateError);
        throw updateError;
      }

      console.log('✅ Order cancelled successfully:', orderId);
      return { success: true, order: updatedOrder };
    } catch (error) {
      console.error('❌ Error cancelling order:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get seller products
   * Enhanced: Includes products from accepted orders
   */
  async getSellerProducts(sellerId) {
    if (!this.isConnected || this.isDemoMode) {
      // Get products from localStorage
      const storedProducts = JSON.parse(localStorage.getItem('w3mart_seller_products') || '[]');
      
      // Case-insensitive seller matching
      const sellerIdLower = sellerId?.toLowerCase();
      const sellerProducts = storedProducts.filter(p => {
        const pSellerIdLower = p.seller_id?.toLowerCase();
        const pSellerEmailLower = p.seller_email?.toLowerCase();
        
        return pSellerIdLower === sellerIdLower ||
               pSellerEmailLower === sellerIdLower ||
               p.seller_id === sellerId ||
               p.seller_email === sellerId ||
               // Handle Seller1@test.com variations
               (sellerIdLower === 'seller1@test.com' && pSellerEmailLower === 'seller@test.com') ||
               (sellerIdLower === 'seller@test.com' && pSellerEmailLower === 'seller1@test.com');
      });
      
      console.log(`🔍 Found ${sellerProducts.length} products for seller ${sellerId} from ${storedProducts.length} total`);
      
      // Also get products from accepted orders
      const storedOrders = JSON.parse(localStorage.getItem('w3mart_orders') || '[]');
      const acceptedOrders = storedOrders.filter(order => {
        const orderSellerIdLower = order.seller_id?.toLowerCase();
        const orderSellerEmailLower = order.seller_email?.toLowerCase();
        
        return (orderSellerIdLower === sellerIdLower ||
                orderSellerEmailLower === sellerIdLower ||
                order.seller_id === sellerId ||
                order.seller_email === sellerId) &&
               (order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered');
      });
      
      // Convert accepted orders to products
      const productsFromOrders = acceptedOrders.map(order => ({
        id: order.product_id || order.id,
        name: order.product_name,
        description: order.product_description || 'Product from order',
        price: parseFloat(order.amount),
        image: order.product_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        category: order.category || 'General',
        discount: 0,
        seller_id: order.seller_id,
        seller_name: order.seller_name || 'Seller',
        stock: order.quantity || 1,
        blockchain_verified: true,
        from_order: true,
        order_id: order.id,
        order_status: order.status,
        created_at: order.created_at
      }));
      
      // Merge and deduplicate
      const allProducts = [...sellerProducts, ...productsFromOrders];
      const uniqueProducts = allProducts.reduce((acc, product) => {
        const existing = acc.find(p => p.id === product.id);
        if (!existing) {
          acc.push(product);
        }
        return acc;
      }, []);
      
      // If no products, initialize demo products
      if (uniqueProducts.length === 0) {
        console.log('🎬 No products found, initializing demo products...');
        const { initializeDemoProducts } = require('../data/sampleProducts');
        const demoProducts = initializeDemoProducts();
        
        // Filter for current seller
        const sellerDemoProducts = demoProducts.filter(p => {
          const pSellerEmailLower = p.seller_email?.toLowerCase();
          return pSellerEmailLower === sellerIdLower;
        });
        
        console.log(`✅ Returning ${sellerDemoProducts.length} demo products`);
        return sellerDemoProducts;
      }
      
      return uniqueProducts.sort((a, b) => 
        new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
    }

    try {
      const { data, error } = await this.client
        .from('products')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching seller products:', error);
      return this.getMockProducts().filter(p => p.seller_id === sellerId);
    }
  }

  /**
   * Add product
   * Enhanced: Stores in localStorage for demo mode
   */
  async addProduct(productData) {
    if (!this.isConnected || this.isDemoMode) {
      // Store in localStorage
      const storedProducts = JSON.parse(localStorage.getItem('w3mart_seller_products') || '[]');
      storedProducts.push(productData);
      localStorage.setItem('w3mart_seller_products', JSON.stringify(storedProducts));
      
      console.log('✅ Product added to seller inventory:', productData.id);
      return { success: true, product: productData };
    }

    try {
      const { data, error } = await this.client
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;
      return { success: true, product: data };
    } catch (error) {
      console.error('Error adding product:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add product review
   */
  async addReview(reviewData) {
    if (!this.isConnected || this.isDemoMode) {
      return { 
        success: true, 
        review: {
          id: Math.floor(Math.random() * 10000),
          ...reviewData,
          created_at: new Date().toISOString()
        }
      };
    }

    try {
      const { data, error } = await this.client
        .from('reviews')
        .insert([reviewData])
        .select()
        .single();

      if (error) throw error;
      return { success: true, review: data };
    } catch (error) {
      console.error('Error adding review:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get product reviews
   */
  async getProductReviews(productId) {
    if (!this.isConnected || this.isDemoMode) {
      return this.getMockReviews(productId);
    }

    try {
      const { data, error } = await this.client
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return this.getMockReviews(productId);
    }
  }

  /**
   * Get seller reviews
   */
  async getSellerReviews(sellerId) {
    if (!this.isConnected || this.isDemoMode) {
      // Return mock reviews for seller
      return [
        { id: 1, rating: 5, comment: 'Excellent seller!', created_at: new Date().toISOString() },
        { id: 2, rating: 4, comment: 'Good service', created_at: new Date().toISOString() },
        { id: 3, rating: 5, comment: 'Fast shipping', created_at: new Date().toISOString() }
      ];
    }

    try {
      const { data, error} = await this.client
        .from('reviews')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching seller reviews:', error);
      return [];
    }
  }

  /**
   * Authenticate user
   * KAIRO: Implement your auth logic or use Supabase Auth
   */
  async login(email, password) {
    if (!this.isConnected || this.isDemoMode) {
      return {
        success: true,
        user: {
          id: 'demo-user-123',
          email: email,
          role: email.includes('seller') ? 'seller' : 'buyer',
          name: email.split('@')[0]
        },
        message: 'Demo login successful'
      };
    }

    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return {
        success: true,
        user: data.user,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get user by email from users table
   * Returns the actual user UUID from database
   */
  async getUserByEmail(email) {
    if (!this.isConnected || this.isDemoMode) {
      return {
        id: null,
        email: email,
        role: email.includes('seller') ? 'seller' : 'buyer'
      };
    }

    try {
      const { data, error } = await this.client
        .from('users')
        .select('id, email, role, full_name')
        .eq('email', email)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  }

  /**
   * Register user
   */
  async register(email, password, role, name) {
    if (!this.isConnected || this.isDemoMode) {
      return {
        success: true,
        user: {
          id: 'demo-user-' + Date.now(),
          email,
          role,
          name
        },
        message: 'Demo registration successful'
      };
    }

    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            name
          }
        }
      });

      if (error) throw error;

      return {
        success: true,
        user: data.user,
        message: 'Registration successful'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle() {
    if (!this.isConnected || this.isDemoMode) {
      return {
        success: false,
        message: 'Google OAuth requires Supabase configuration. Using demo mode instead.'
      };
    }

    try {
      const { data, error } = await this.client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Redirecting to Google...'
      };
    } catch (error) {
      console.error('Google login error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    if (!this.isConnected || this.isDemoMode) {
      return null;
    }

    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    if (!this.isConnected || this.isDemoMode) {
      return { success: true };
    }

    try {
      const { error } = await this.client.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }


  // Demo products - Load from localStorage or generate
  getMockProducts() {
    // Check if products exist in localStorage
    const storedProducts = JSON.parse(localStorage.getItem('w3mart_seller_products') || '[]');
    
    if (storedProducts.length > 0) {
      console.log(`✅ Loaded ${storedProducts.length} products from localStorage`);
      return storedProducts;
    }
    
    // If no products, return legacy mock products
    console.log('📦 Using legacy mock products');
    return this.getLegacyMockProducts();
  }

  // Legacy mock data (kept for backward compatibility)
  getLegacyMockProducts() {
    return [
      // Mobiles Category (5 products)
      {
        id: 'mob-001',
        name: 'iPhone 15 Pro Max',
        description: 'A17 Pro chip, Titanium design, 48MP camera with 5x optical zoom',
        price: 0.65,
        image: 'https://images.unsplash.com/photo-1592286927505-2fd0d113e4e4?w=500',
        category: 'Mobiles',
        discount: 8,
        seller_id: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
        seller_name: 'TechStore Pro',
        stock: 12,
        blockchain_verified: true
      },
      {
        id: 'mob-002',
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Snapdragon 8 Gen 3, 200MP camera, S Pen included, AI features',
        price: 0.58,
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500',
        category: 'Mobiles',
        discount: 12,
        seller_id: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
        seller_name: 'TechStore Pro',
        stock: 18,
        blockchain_verified: true
      },
      {
        id: 'mob-003',
        name: 'OnePlus 12 Pro',
        description: 'Hasselblad camera, 120Hz AMOLED, 100W fast charging',
        price: 0.42,
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
        category: 'Mobiles',
        discount: 15,
        seller_id: '0x9735f6940E2eb28930eFb4CeF49B2d1F2C9C2288',
        seller_name: 'MobileHub',
        stock: 25,
        blockchain_verified: true
      },
      {
        id: 'mob-004',
        name: 'Google Pixel 8 Pro',
        description: 'Tensor G3 chip, Best-in-class AI photography, 7 years updates',
        price: 0.48,
        image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500',
        category: 'Mobiles',
        discount: 10,
        seller_id: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
        seller_name: 'TechStore Pro',
        stock: 15,
        blockchain_verified: true
      },
      {
        id: 'mob-005',
        name: 'Xiaomi 14 Ultra',
        description: 'Leica optics, Snapdragon 8 Gen 3, 120W HyperCharge',
        price: 0.38,
        image: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=500',
        category: 'Mobiles',
        discount: 18,
        seller_id: '0x9735f6940E2eb28930eFb4CeF49B2d1F2C9C2288',
        seller_name: 'MobileHub',
        stock: 30,
        blockchain_verified: true
      },

      // Fashion Category (5 products)
      {
        id: 'fash-001',
        name: 'Levi\'s 501 Original Jeans',
        description: 'Classic straight fit, button fly, authentic denim',
        price: 0.045,
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
        category: 'Fashion',
        discount: 25,
        seller_id: '0xa123f6940E2eb28930eFb4CeF49B2d1F2C9C3344',
        seller_name: 'FashionVault',
        stock: 50,
        blockchain_verified: true
      },
      {
        id: 'fash-002',
        name: 'Nike Air Max 270',
        description: 'Max Air cushioning, breathable mesh, iconic style',
        price: 0.08,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        category: 'Fashion',
        discount: 20,
        seller_id: '0xa123f6940E2eb28930eFb4CeF49B2d1F2C9C3344',
        seller_name: 'FashionVault',
        stock: 35,
        blockchain_verified: true
      },
      {
        id: 'fash-003',
        name: 'Ray-Ban Aviator Sunglasses',
        description: 'Classic metal frame, UV protection, polarized lenses',
        price: 0.035,
        image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500',
        category: 'Fashion',
        discount: 15,
        seller_id: '0xb234f6940E2eb28930eFb4CeF49B2d1F2C9C4455',
        seller_name: 'StyleZone',
        stock: 60,
        blockchain_verified: true
      },
      {
        id: 'fash-004',
        name: 'Leather Crossbody Bag',
        description: 'Genuine leather, adjustable strap, multiple compartments',
        price: 0.055,
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500',
        category: 'Fashion',
        discount: 30,
        seller_id: '0xa123f6940E2eb28930eFb4CeF49B2d1F2C9C3344',
        seller_name: 'FashionVault',
        stock: 28,
        blockchain_verified: true
      },
      {
        id: 'fash-005',
        name: 'Casio G-Shock Watch',
        description: 'Shock resistant, 200m water resistant, world time',
        price: 0.065,
        image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=500',
        category: 'Fashion',
        discount: 12,
        seller_id: '0xb234f6940E2eb28930eFb4CeF49B2d1F2C9C4455',
        seller_name: 'StyleZone',
        stock: 42,
        blockchain_verified: true
      },

      // Electronics Category (5 products)
      {
        id: 'elec-001',
        name: 'Sony WH-1000XM5 Headphones',
        description: 'Industry-leading noise cancellation, 30hr battery, premium sound',
        price: 0.18,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        category: 'Electronics',
        discount: 15,
        seller_id: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
        seller_name: 'TechStore Pro',
        stock: 22,
        blockchain_verified: true
      },
      {
        id: 'elec-002',
        name: 'Apple MacBook Air M3',
        description: '15-inch Liquid Retina, M3 chip, 18hr battery, fanless design',
        price: 0.72,
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
        category: 'Electronics',
        discount: 8,
        seller_id: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
        seller_name: 'TechStore Pro',
        stock: 10,
        blockchain_verified: true
      },
      {
        id: 'elec-003',
        name: 'iPad Pro 12.9" M2',
        description: 'Liquid Retina XDR, M2 chip, Apple Pencil support, 5G',
        price: 0.55,
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500',
        category: 'Electronics',
        discount: 10,
        seller_id: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
        seller_name: 'TechStore Pro',
        stock: 16,
        blockchain_verified: true
      },
      {
        id: 'elec-004',
        name: 'Canon EOS R6 Mark II',
        description: '24.2MP full-frame, 40fps burst, 6K video, in-body stabilization',
        price: 1.2,
        image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500',
        category: 'Electronics',
        discount: 5,
        seller_id: '0xc345f6940E2eb28930eFb4CeF49B2d1F2C9C5566',
        seller_name: 'CameraWorld',
        stock: 8,
        blockchain_verified: true
      },
      {
        id: 'elec-005',
        name: 'DJI Mini 4 Pro Drone',
        description: '4K/60fps HDR, 34min flight time, omnidirectional obstacle sensing',
        price: 0.42,
        image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=500',
        category: 'Electronics',
        discount: 12,
        seller_id: '0xc345f6940E2eb28930eFb4CeF49B2d1F2C9C5566',
        seller_name: 'CameraWorld',
        stock: 14,
        blockchain_verified: true
      },

      // Home Appliances Category (5 products)
      {
        id: 'home-001',
        name: 'Dyson V15 Detect Vacuum',
        description: 'Laser dust detection, 60min runtime, HEPA filtration',
        price: 0.32,
        image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500',
        category: 'Home',
        discount: 18,
        seller_id: '0xd456f6940E2eb28930eFb4CeF49B2d1F2C9C6677',
        seller_name: 'HomeEssentials',
        stock: 20,
        blockchain_verified: true
      },
      {
        id: 'home-002',
        name: 'Nespresso Vertuo Next',
        description: 'One-touch brewing, 5 cup sizes, centrifusion technology',
        price: 0.085,
        image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500',
        category: 'Home',
        discount: 22,
        seller_id: '0xd456f6940E2eb28930eFb4CeF49B2d1F2C9C6677',
        seller_name: 'HomeEssentials',
        stock: 35,
        blockchain_verified: true
      },
      {
        id: 'home-003',
        name: 'Philips Air Fryer XXL',
        description: '7.3L capacity, rapid air technology, dishwasher safe',
        price: 0.12,
        image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=500',
        category: 'Home',
        discount: 25,
        seller_id: '0xd456f6940E2eb28930eFb4CeF49B2d1F2C9C6677',
        seller_name: 'HomeEssentials',
        stock: 28,
        blockchain_verified: true
      },
      {
        id: 'home-004',
        name: 'iRobot Roomba j7+',
        description: 'Self-emptying, AI obstacle avoidance, smart mapping',
        price: 0.38,
        image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500',
        category: 'Home',
        discount: 15,
        seller_id: '0xe567f6940E2eb28930eFb4CeF49B2d1F2C9C7788',
        seller_name: 'SmartHome Plus',
        stock: 18,
        blockchain_verified: true
      },
      {
        id: 'home-005',
        name: 'LG 27" UltraGear Monitor',
        description: '4K IPS, 144Hz, 1ms response, HDR10, G-Sync compatible',
        price: 0.28,
        image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500',
        category: 'Home',
        discount: 20,
        seller_id: '0xe567f6940E2eb28930eFb4CeF49B2d1F2C9C7788',
        seller_name: 'SmartHome Plus',
        stock: 24,
        blockchain_verified: true
      },

      // Books Category (10 products)
      {
        id: 'book-001',
        name: 'Atomic Habits by James Clear',
        description: 'Transform your life with tiny changes that deliver remarkable results',
        price: 0.008,
        image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500',
        category: 'Books',
        discount: 15,
        seller_id: '0xf678f6940E2eb28930eFb4CeF49B2d1F2C9C8899',
        seller_name: 'BookHaven',
        stock: 100,
        blockchain_verified: true
      },
      {
        id: 'book-002',
        name: 'The Psychology of Money',
        description: 'Timeless lessons on wealth, greed, and happiness by Morgan Housel',
        price: 0.007,
        image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=500',
        category: 'Books',
        discount: 20,
        seller_id: '0xf678f6940E2eb28930eFb4CeF49B2d1F2C9C8899',
        seller_name: 'BookHaven',
        stock: 85,
        blockchain_verified: true
      },
      {
        id: 'book-003',
        name: 'Sapiens by Yuval Noah Harari',
        description: 'A brief history of humankind from Stone Age to modern age',
        price: 0.009,
        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500',
        category: 'Books',
        discount: 10,
        seller_id: '0xf678f6940E2eb28930eFb4CeF49B2d1F2C9C8899',
        seller_name: 'BookHaven',
        stock: 75,
        blockchain_verified: true
      },
      {
        id: 'book-004',
        name: 'Think Like a Monk',
        description: 'Train your mind for peace and purpose by Jay Shetty',
        price: 0.0065,
        image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500',
        category: 'Books',
        discount: 25,
        seller_id: '0xg789f6940E2eb28930eFb4CeF49B2d1F2C9C9900',
        seller_name: 'ReadMore',
        stock: 90,
        blockchain_verified: true
      },
      {
        id: 'book-005',
        name: 'The Alchemist by Paulo Coelho',
        description: 'A magical fable about following your dreams',
        price: 0.006,
        image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500',
        category: 'Books',
        discount: 18,
        seller_id: '0xg789f6940E2eb28930eFb4CeF49B2d1F2C9C9900',
        seller_name: 'ReadMore',
        stock: 110,
        blockchain_verified: true
      },
      {
        id: 'book-006',
        name: 'Rich Dad Poor Dad',
        description: 'What the rich teach their kids about money by Robert Kiyosaki',
        price: 0.0075,
        image: 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=500',
        category: 'Books',
        discount: 22,
        seller_id: '0xf678f6940E2eb28930eFb4CeF49B2d1F2C9C8899',
        seller_name: 'BookHaven',
        stock: 95,
        blockchain_verified: true
      },
      {
        id: 'book-007',
        name: 'The 5 AM Club',
        description: 'Own your morning, elevate your life by Robin Sharma',
        price: 0.007,
        image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500',
        category: 'Books',
        discount: 15,
        seller_id: '0xg789f6940E2eb28930eFb4CeF49B2d1F2C9C9900',
        seller_name: 'ReadMore',
        stock: 80,
        blockchain_verified: true
      },
      {
        id: 'book-008',
        name: 'Deep Work by Cal Newport',
        description: 'Rules for focused success in a distracted world',
        price: 0.008,
        image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500',
        category: 'Books',
        discount: 12,
        seller_id: '0xf678f6940E2eb28930eFb4CeF49B2d1F2C9C8899',
        seller_name: 'BookHaven',
        stock: 70,
        blockchain_verified: true
      },
      {
        id: 'book-009',
        name: 'Ikigai: Japanese Secret',
        description: 'The Japanese secret to a long and happy life',
        price: 0.0055,
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
        category: 'Books',
        discount: 20,
        seller_id: '0xg789f6940E2eb28930eFb4CeF49B2d1F2C9C9900',
        seller_name: 'ReadMore',
        stock: 105,
        blockchain_verified: true
      },
      {
        id: 'book-010',
        name: 'The Power of Now',
        description: 'A guide to spiritual enlightenment by Eckhart Tolle',
        price: 0.0065,
        image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=500',
        category: 'Books',
        discount: 18,
        seller_id: '0xf678f6940E2eb28930eFb4CeF49B2d1F2C9C8899',
        seller_name: 'BookHaven',
        stock: 88,
        blockchain_verified: true
      },

      // Sports Category (10 products)
      {
        id: 'sport-001',
        name: 'Adidas Predator Elite FG',
        description: 'Professional football boots with HybridTouch upper',
        price: 0.095,
        image: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=500',
        category: 'Sports',
        discount: 15,
        seller_id: '0xh890f6940E2eb28930eFb4CeF49B2d1F2C9C0011',
        seller_name: 'SportsPro',
        stock: 45,
        blockchain_verified: true
      },
      {
        id: 'sport-002',
        name: 'Wilson Pro Staff Tennis Racket',
        description: 'Professional grade racket, 97 sq in head, 315g weight',
        price: 0.12,
        image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=500',
        category: 'Sports',
        discount: 20,
        seller_id: '0xh890f6940E2eb28930eFb4CeF49B2d1F2C9C0011',
        seller_name: 'SportsPro',
        stock: 32,
        blockchain_verified: true
      },
      {
        id: 'sport-003',
        name: 'Spalding NBA Official Basketball',
        description: 'Official size 7, composite leather, indoor/outdoor',
        price: 0.035,
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500',
        category: 'Sports',
        discount: 10,
        seller_id: '0xi901f6940E2eb28930eFb4CeF49B2d1F2C9C1122',
        seller_name: 'GameOn Sports',
        stock: 60,
        blockchain_verified: true
      },
      {
        id: 'sport-004',
        name: 'Yonex Badminton Racket',
        description: 'Astrox 99 Pro, 4U weight, isometric head shape',
        price: 0.085,
        image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500',
        category: 'Sports',
        discount: 18,
        seller_id: '0xh890f6940E2eb28930eFb4CeF49B2d1F2C9C0011',
        seller_name: 'SportsPro',
        stock: 38,
        blockchain_verified: true
      },
      {
        id: 'sport-005',
        name: 'Fitbit Charge 6 Fitness Tracker',
        description: 'Heart rate, GPS, sleep tracking, 7-day battery',
        price: 0.075,
        image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500',
        category: 'Sports',
        discount: 25,
        seller_id: '0xi901f6940E2eb28930eFb4CeF49B2d1F2C9C1122',
        seller_name: 'GameOn Sports',
        stock: 55,
        blockchain_verified: true
      },
      {
        id: 'sport-006',
        name: 'Decathlon Yoga Mat Premium',
        description: '6mm thick, non-slip, eco-friendly TPE material',
        price: 0.022,
        image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500',
        category: 'Sports',
        discount: 30,
        seller_id: '0xi901f6940E2eb28930eFb4CeF49B2d1F2C9C1122',
        seller_name: 'GameOn Sports',
        stock: 75,
        blockchain_verified: true
      },
      {
        id: 'sport-007',
        name: 'Puma Running Shoes Velocity',
        description: 'Lightweight mesh, NITRO foam, breathable design',
        price: 0.065,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        category: 'Sports',
        discount: 22,
        seller_id: '0xh890f6940E2eb28930eFb4CeF49B2d1F2C9C0011',
        seller_name: 'SportsPro',
        stock: 48,
        blockchain_verified: true
      },
      {
        id: 'sport-008',
        name: 'Bowflex Adjustable Dumbbells',
        description: '5-52.5 lbs per dumbbell, space-saving design',
        price: 0.18,
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500',
        category: 'Sports',
        discount: 15,
        seller_id: '0xi901f6940E2eb28930eFb4CeF49B2d1F2C9C1122',
        seller_name: 'GameOn Sports',
        stock: 28,
        blockchain_verified: true
      },
      {
        id: 'sport-009',
        name: 'Garmin Forerunner 265',
        description: 'GPS running watch, AMOLED display, training metrics',
        price: 0.22,
        image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500',
        category: 'Sports',
        discount: 12,
        seller_id: '0xh890f6940E2eb28930eFb4CeF49B2d1F2C9C0011',
        seller_name: 'SportsPro',
        stock: 35,
        blockchain_verified: true
      },
      {
        id: 'sport-010',
        name: 'Speedo Competition Goggles',
        description: 'Anti-fog, UV protection, hydrodynamic design',
        price: 0.028,
        image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=500',
        category: 'Sports',
        discount: 20,
        seller_id: '0xi901f6940E2eb28930eFb4CeF49B2d1F2C9C1122',
        seller_name: 'GameOn Sports',
        stock: 65,
        blockchain_verified: true
      },

      // Gaming Category (10 products)
      {
        id: 'game-001',
        name: 'PlayStation 5 Console',
        description: 'Ultra-high speed SSD, 4K gaming, ray tracing, 825GB storage',
        price: 0.25,
        image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500',
        category: 'Gaming',
        discount: 5,
        seller_id: '0xj012f6940E2eb28930eFb4CeF49B2d1F2C9C2233',
        seller_name: 'GameZone',
        stock: 15,
        blockchain_verified: true
      },
      {
        id: 'game-002',
        name: 'Xbox Series X',
        description: '12 teraflops GPU, 4K 120fps, 1TB SSD, Game Pass ready',
        price: 0.24,
        image: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=500',
        category: 'Gaming',
        discount: 8,
        seller_id: '0xj012f6940E2eb28930eFb4CeF49B2d1F2C9C2233',
        seller_name: 'GameZone',
        stock: 18,
        blockchain_verified: true
      },
      {
        id: 'game-003',
        name: 'Nintendo Switch OLED',
        description: '7-inch OLED screen, enhanced audio, 64GB storage',
        price: 0.16,
        image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=500',
        category: 'Gaming',
        discount: 10,
        seller_id: '0xk123f6940E2eb28930eFb4CeF49B2d1F2C9C3344',
        seller_name: 'PixelPlay',
        stock: 25,
        blockchain_verified: true
      },
      {
        id: 'game-004',
        name: 'Razer BlackWidow V4 Pro',
        description: 'Mechanical gaming keyboard, RGB, programmable keys',
        price: 0.11,
        image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500',
        category: 'Gaming',
        discount: 15,
        seller_id: '0xj012f6940E2eb28930eFb4CeF49B2d1F2C9C2233',
        seller_name: 'GameZone',
        stock: 40,
        blockchain_verified: true
      },
      {
        id: 'game-005',
        name: 'Logitech G Pro X Superlight',
        description: 'Wireless gaming mouse, 25K sensor, 63g weight',
        price: 0.075,
        image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500',
        category: 'Gaming',
        discount: 18,
        seller_id: '0xj012f6940E2eb28930eFb4CeF49B2d1F2C9C2233',
        seller_name: 'GameZone',
        stock: 50,
        blockchain_verified: true
      },
      {
        id: 'game-006',
        name: 'SteelSeries Arctis Nova Pro',
        description: 'Premium gaming headset, active noise cancellation, Hi-Res audio',
        price: 0.15,
        image: 'https://images.unsplash.com/photo-1599669454699-248893623440?w=500',
        category: 'Gaming',
        discount: 20,
        seller_id: '0xk123f6940E2eb28930eFb4CeF49B2d1F2C9C3344',
        seller_name: 'PixelPlay',
        stock: 35,
        blockchain_verified: true
      },
      {
        id: 'game-007',
        name: 'ASUS ROG Swift PG27AQDM',
        description: '27" OLED gaming monitor, 240Hz, 0.03ms response',
        price: 0.45,
        image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500',
        category: 'Gaming',
        discount: 10,
        seller_id: '0xj012f6940E2eb28930eFb4CeF49B2d1F2C9C2233',
        seller_name: 'GameZone',
        stock: 12,
        blockchain_verified: true
      },
      {
        id: 'game-008',
        name: 'Elgato Stream Deck XL',
        description: '32 customizable LCD keys, streaming control center',
        price: 0.12,
        image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=500',
        category: 'Gaming',
        discount: 15,
        seller_id: '0xk123f6940E2eb28930eFb4CeF49B2d1F2C9C3344',
        seller_name: 'PixelPlay',
        stock: 30,
        blockchain_verified: true
      },
      {
        id: 'game-009',
        name: 'Secretlab Titan Evo 2024',
        description: 'Premium gaming chair, 4D armrests, magnetic memory foam',
        price: 0.28,
        image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=500',
        category: 'Gaming',
        discount: 12,
        seller_id: '0xj012f6940E2eb28930eFb4CeF49B2d1F2C9C2233',
        seller_name: 'GameZone',
        stock: 20,
        blockchain_verified: true
      },
      {
        id: 'game-010',
        name: 'Meta Quest 3 VR Headset',
        description: 'Mixed reality, 4K+ display, 128GB, wireless freedom',
        price: 0.25,
        image: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=500',
        category: 'Gaming',
        discount: 8,
        seller_id: '0xk123f6940E2eb28930eFb4CeF49B2d1F2C9C3344',
        seller_name: 'PixelPlay',
        stock: 22,
        blockchain_verified: true
      }
    ];
  }

  getMockReviews(productId) {
    return [
      {
        id: 'rev-001',
        product_id: productId,
        user_name: 'Rishi Sawant',
        rating: 5,
        comment: 'Excellent product! Delivered on time and exactly as described. Blockchain verification gave me confidence.',
        blockchain_verified: true,
        created_at: new Date(Date.now() - 259200000).toISOString() // 3 days ago
      },
      {
        id: 'rev-002',
        product_id: productId,
        user_name: 'Priya Sharma',
        rating: 4,
        comment: 'Good quality product. The escrow system worked perfectly. Highly recommend!',
        blockchain_verified: true,
        created_at: new Date(Date.now() - 432000000).toISOString() // 5 days ago
      },
      {
        id: 'rev-003',
        product_id: productId,
        user_name: 'Amit Kumar',
        rating: 5,
        comment: 'Amazing experience with blockchain-powered shopping. Fast delivery and secure payment.',
        blockchain_verified: true,
        created_at: new Date(Date.now() - 604800000).toISOString() // 7 days ago
      }
    ];
  }

  isDemo() {
    return !this.isConnected || this.isDemoMode;
  }
}

// Export singleton instance
const supabaseService = new SupabaseService();
export default supabaseService;