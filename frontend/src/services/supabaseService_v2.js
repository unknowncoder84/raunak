import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Service V2 - Dynamic Marketplace
 * Full integration with database for buyer/seller workflows
 */

class SupabaseServiceV2 {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isDemoMode = true; // Start in demo mode by default
    this.initialize();
  }

  initialize() {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && 
        supabaseUrl !== 'https://your-project.supabase.co' &&
        supabaseKey !== 'your-anon-key-here') {
      try {
        this.client = createClient(supabaseUrl, supabaseKey);
        this.isConnected = true;
        console.log('✅ Supabase connected');
      } catch (error) {
        console.warn('⚠️ Supabase connection failed, using demo mode:', error);
        this.isConnected = false;
      }
    } else {
      console.log('📦 Supabase not configured - Demo Mode active');
      this.isConnected = false;
    }
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  async login(email, password, role) {
    if (!this.isConnected || this.isDemoMode) {
      // Demo login
      const demoUsers = {
        'buyer1@test.com': { password: 'buy01', role: 'buyer', name: 'Demo Buyer' },
        'Seller1@test.com': { password: 'user1', role: 'seller', name: 'Demo Seller' },
        'admin@test.com': { password: 'admin123', role: 'admin', name: 'Admin User' }
      };

      const user = demoUsers[email];
      if (user && user.password === password) {
        const userData = {
          id: `demo-${user.role}-${Date.now()}`,
          email,
          role: user.role,
          full_name: user.name,
          wallet_address: user.role === 'seller' ? '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063' : '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          theme: 'light',
          created_at: new Date().toISOString()
        };
        
        localStorage.setItem('w3mart_user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      
      return { success: false, error: 'Invalid credentials' };
    }

    try {
      const { data, error } = await this.client.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Get user profile
      const { data: profile } = await this.client
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();

      return { success: true, user: profile || data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signup(email, password, role, fullName) {
    if (!this.isConnected || this.isDemoMode) {
      const userData = {
        id: `demo-${role}-${Date.now()}`,
        email,
        role,
        full_name: fullName,
        wallet_address: null,
        theme: 'light',
        created_at: new Date().toISOString()
      };
      
      localStorage.setItem('w3mart_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }

    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: { role, full_name: fullName }
        }
      });

      if (error) throw error;

      // Create user profile
      await this.client.from('user_profiles').insert([{
        email,
        full_name: fullName,
        role,
        password_hash: 'hashed' // In production, hash properly
      }]);

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async logout() {
    localStorage.removeItem('w3mart_user');
    if (this.isConnected && !this.isDemoMode) {
      await this.client.auth.signOut();
    }
    return { success: true };
  }

  getCurrentUser() {
    const userData = localStorage.getItem('w3mart_user');
    return userData ? JSON.parse(userData) : null;
  }

  // ============================================
  // USER PROFILE
  // ============================================

  async getUserProfile(userId) {
    if (!this.isConnected || this.isDemoMode) {
      return this.getCurrentUser();
    }

    try {
      const { data, error } = await this.client
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  async updateUserProfile(userId, updates) {
    if (!this.isConnected || this.isDemoMode) {
      const currentUser = this.getCurrentUser();
      const updatedUser = { ...currentUser, ...updates };
      localStorage.setItem('w3mart_user', JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
    }

    try {
      const { data, error } = await this.client
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, user: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateTheme(userId, theme) {
    return this.updateUserProfile(userId, { theme });
  }

  async linkWallet(userId, walletAddress) {
    return this.updateUserProfile(userId, { wallet_address: walletAddress });
  }

  // ============================================
  // PRODUCTS
  // ============================================

  async getProducts(filters = {}) {
    if (!this.isConnected || this.isDemoMode) {
      let products = JSON.parse(localStorage.getItem('w3mart_products') || '[]');
      
      // Apply filters
      if (filters.category && filters.category !== 'All') {
        products = products.filter(p => p.category === filters.category);
      }
      if (filters.seller_id) {
        products = products.filter(p => p.seller_id === filters.seller_id);
      }
      if (filters.status) {
        products = products.filter(p => p.status === filters.status);
      }
      
      return products;
    }

    try {
      let query = this.client.from('products').select('*, user_profiles(full_name, seller_rating)');
      
      if (filters.category && filters.category !== 'All') {
        query = query.eq('category', filters.category);
      }
      if (filters.seller_id) {
        query = query.eq('seller_id', filters.seller_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  async getProduct(productId) {
    if (!this.isConnected || this.isDemoMode) {
      const products = JSON.parse(localStorage.getItem('w3mart_products') || '[]');
      return products.find(p => p.id === productId);
    }

    try {
      const { data, error } = await this.client
        .from('products')
        .select('*, user_profiles(full_name, seller_rating, email)')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  async addProduct(productData) {
    if (!this.isConnected || this.isDemoMode) {
      const products = JSON.parse(localStorage.getItem('w3mart_products') || '[]');
      const newProduct = {
        id: `prod-${Date.now()}`,
        ...productData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active',
        views: 0,
        sales: 0,
        rating: 0,
        review_count: 0
      };
      products.push(newProduct);
      localStorage.setItem('w3mart_products', JSON.stringify(products));
      return { success: true, product: newProduct };
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
      return { success: false, error: error.message };
    }
  }

  async updateProduct(productId, updates) {
    if (!this.isConnected || this.isDemoMode) {
      const products = JSON.parse(localStorage.getItem('w3mart_products') || '[]');
      const index = products.findIndex(p => p.id === productId);
      if (index !== -1) {
        products[index] = { ...products[index], ...updates, updated_at: new Date().toISOString() };
        localStorage.setItem('w3mart_products', JSON.stringify(products));
        return { success: true, product: products[index] };
      }
      return { success: false, error: 'Product not found' };
    }

    try {
      const { data, error } = await this.client
        .from('products')
        .update(updates)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, product: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteProduct(productId) {
    if (!this.isConnected || this.isDemoMode) {
      const products = JSON.parse(localStorage.getItem('w3mart_products') || '[]');
      const filtered = products.filter(p => p.id !== productId);
      localStorage.setItem('w3mart_products', JSON.stringify(filtered));
      return { success: true };
    }

    try {
      const { error } = await this.client
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // ORDERS
  // ============================================

  async createOrder(orderData) {
    if (!this.isConnected || this.isDemoMode) {
      const orders = JSON.parse(localStorage.getItem('w3mart_orders') || '[]');
      const newOrder = {
        id: `order-${Date.now()}`,
        ...orderData,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      orders.push(newOrder);
      localStorage.setItem('w3mart_orders', JSON.stringify(orders));
      return { success: true, order: newOrder };
    }

    try {
      const { data, error } = await this.client
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;
      return { success: true, order: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getOrders(userId, role) {
    if (!this.isConnected || this.isDemoMode) {
      const orders = JSON.parse(localStorage.getItem('w3mart_orders') || '[]');
      return orders.filter(o => 
        role === 'buyer' ? o.buyer_id === userId : o.seller_id === userId
      ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    try {
      const field = role === 'buyer' ? 'buyer_id' : 'seller_id';
      const { data, error } = await this.client
        .from('orders')
        .select('*, products(*), user_profiles!buyer_id(*)')
        .eq(field, userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  async updateOrderStatus(orderId, status, additionalData = {}) {
    if (!this.isConnected || this.isDemoMode) {
      const orders = JSON.parse(localStorage.getItem('w3mart_orders') || '[]');
      const index = orders.findIndex(o => o.id === orderId);
      if (index !== -1) {
        orders[index] = {
          ...orders[index],
          status,
          ...additionalData,
          updated_at: new Date().toISOString(),
          [`${status}_at`]: new Date().toISOString()
        };
        localStorage.setItem('w3mart_orders', JSON.stringify(orders));
        return { success: true, order: orders[index] };
      }
      return { success: false, error: 'Order not found' };
    }

    try {
      const updates = {
        status,
        ...additionalData,
        [`${status}_at`]: new Date().toISOString()
      };

      const { data, error } = await this.client
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, order: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // REVIEWS
  // ============================================

  async addReview(reviewData) {
    if (!this.isConnected || this.isDemoMode) {
      const reviews = JSON.parse(localStorage.getItem('w3mart_reviews') || '[]');
      const newReview = {
        id: `review-${Date.now()}`,
        ...reviewData,
        created_at: new Date().toISOString()
      };
      reviews.push(newReview);
      localStorage.setItem('w3mart_reviews', JSON.stringify(reviews));
      return { success: true, review: newReview };
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
      return { success: false, error: error.message };
    }
  }

  async getReviews(filters = {}) {
    if (!this.isConnected || this.isDemoMode) {
      let reviews = JSON.parse(localStorage.getItem('w3mart_reviews') || '[]');
      
      if (filters.product_id) {
        reviews = reviews.filter(r => r.product_id === filters.product_id);
      }
      if (filters.seller_id) {
        reviews = reviews.filter(r => r.seller_id === filters.seller_id);
      }
      if (filters.buyer_id) {
        reviews = reviews.filter(r => r.buyer_id === filters.buyer_id);
      }
      
      return reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    try {
      let query = this.client.from('reviews').select('*, user_profiles(full_name), products(name)');
      
      if (filters.product_id) query = query.eq('product_id', filters.product_id);
      if (filters.seller_id) query = query.eq('seller_id', filters.seller_id);
      if (filters.buyer_id) query = query.eq('buyer_id', filters.buyer_id);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  }

  // ============================================
  // ANALYTICS
  // ============================================

  async getSellerAnalytics(sellerId) {
    const orders = await this.getOrders(sellerId, 'seller');
    const products = await this.getProducts({ seller_id: sellerId });
    const reviews = await this.getReviews({ seller_id: sellerId });

    const totalSales = orders.filter(o => o.status === 'delivered').length;
    const totalRevenue = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const activeProducts = products.filter(p => p.status === 'active').length;

    return {
      totalSales,
      totalRevenue,
      avgRating,
      pendingOrders,
      activeProducts,
      totalProducts: products.length,
      totalReviews: reviews.length
    };
  }

  isDemo() {
    return this.isDemoMode || !this.isConnected;
  }
}

const supabaseServiceV2 = new SupabaseServiceV2();
export default supabaseServiceV2;
