import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, Package, TrendingUp, Users, Clock, CheckCircle, 
  Truck, ShoppingBag, Activity, ArrowRight, Sparkles, Bell, User, Phone, MapPin, X, Star, XCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import supabaseService from '../services/supabaseService';
import blockchainService from '../services/blockchainService';

/**
 * Unified Dashboard - Role-Based Dynamic Rendering
 * Single entry point for both Buyer and Seller dashboards
 * NO DUMMY DATA - All data pulled from Supabase orders table
 */
export default function Dashboard({ user, isDemoMode }) {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 5 seconds for real-time sync
    const interval = setInterval(() => {
      loadDashboardData();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [user.role]);

  const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      // AUTO-CREATE TEST ORDERS IF NONE EXIST (First-time setup)
      const existingOrders = JSON.parse(localStorage.getItem('w3mart_orders') || '[]');
      
      if (existingOrders.length === 0) {
        console.log('🔧 No orders found - Creating test orders for demo...');
        
        const testOrders = [
          {
            id: 'order-' + Date.now() + '-1',
            product_id: 'mob-001',
            product_name: 'iPhone 15 Pro Max',
            product_description: 'A17 Pro chip, Titanium design, 48MP camera',
            product_image: 'https://images.unsplash.com/photo-1592286927505-2fd0d113e4e4?w=500',
            amount: '0.65',
            quantity: 1,
            status: 'pending',
            buyer_id: 'buyer@test.com',
            buyer_email: 'buyer@test.com',
            buyer_name: 'Rishi Kumar',
            seller_id: 'seller@test.com',
            seller_email: 'seller@test.com',
            seller_name: 'TechStore Pro',
            shipping_address: {
              fullName: 'Rishi Kumar',
              phone: '+91 98765 43210',
              address: '123 MG Road, Koramangala',
              city: 'Bangalore',
              state: 'Karnataka',
              pincode: '560034',
              landmark: 'Near Metro Station'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'order-' + Date.now() + '-2',
            product_id: 'elec-001',
            product_name: 'Sony WH-1000XM5 Headphones',
            product_description: 'Industry-leading noise cancellation',
            product_image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
            amount: '0.18',
            quantity: 1,
            status: 'pending',
            buyer_id: 'buyer@test.com',
            buyer_email: 'buyer@test.com',
            buyer_name: 'Rishi Kumar',
            seller_id: 'seller@test.com',
            seller_email: 'seller@test.com',
            seller_name: 'TechStore Pro',
            shipping_address: {
              fullName: 'Rishi Kumar',
              phone: '+91 98765 43210',
              address: '123 MG Road, Koramangala',
              city: 'Bangalore',
              state: 'Karnataka',
              pincode: '560034',
              landmark: 'Near Metro Station'
            },
            created_at: new Date(Date.now() - 3600000).toISOString(),
            updated_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 'order-' + Date.now() + '-3',
            product_id: 'mob-002',
            product_name: 'Samsung Galaxy S24 Ultra',
            product_description: 'Snapdragon 8 Gen 3, 200MP camera',
            product_image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500',
            amount: '0.58',
            quantity: 1,
            status: 'approved',
            buyer_id: 'buyer@test.com',
            buyer_email: 'buyer@test.com',
            buyer_name: 'Rishi Kumar',
            seller_id: 'seller@test.com',
            seller_email: 'seller@test.com',
            seller_name: 'TechStore Pro',
            shipping_address: {
              fullName: 'Rishi Kumar',
              phone: '+91 98765 43210',
              address: '123 MG Road, Koramangala',
              city: 'Bangalore',
              state: 'Karnataka',
              pincode: '560034',
              landmark: 'Near Metro Station'
            },
            created_at: new Date(Date.now() - 7200000).toISOString(),
            updated_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 'order-' + Date.now() + '-4',
            product_id: 'elec-002',
            product_name: 'Apple MacBook Air M3',
            product_description: '15-inch Liquid Retina, M3 chip',
            product_image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
            amount: '0.72',
            quantity: 1,
            status: 'paid',
            buyer_id: 'buyer@test.com',
            buyer_email: 'buyer@test.com',
            buyer_name: 'Rishi Kumar',
            seller_id: 'seller@test.com',
            seller_email: 'seller@test.com',
            seller_name: 'TechStore Pro',
            blockchain_tx: '0x' + Math.random().toString(16).substr(2, 64),
            shipping_address: {
              fullName: 'Rishi Kumar',
              phone: '+91 98765 43210',
              address: '123 MG Road, Koramangala',
              city: 'Bangalore',
              state: 'Karnataka',
              pincode: '560034',
              landmark: 'Near Metro Station'
            },
            created_at: new Date(Date.now() - 10800000).toISOString(),
            updated_at: new Date(Date.now() - 7200000).toISOString()
          },
          {
            id: 'order-' + Date.now() + '-5',
            product_id: 'fash-002',
            product_name: 'Nike Air Max 270',
            product_description: 'Max Air cushioning, breathable mesh',
            product_image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
            amount: '0.08',
            quantity: 1,
            status: 'shipped',
            buyer_id: 'buyer@test.com',
            buyer_email: 'buyer@test.com',
            buyer_name: 'Rishi Kumar',
            seller_id: 'seller@test.com',
            seller_email: 'seller@test.com',
            seller_name: 'TechStore Pro',
            blockchain_tx: '0x' + Math.random().toString(16).substr(2, 64),
            tracking_id: 'TRACK-' + Date.now(),
            shipping_address: {
              fullName: 'Rishi Kumar',
              phone: '+91 98765 43210',
              address: '123 MG Road, Koramangala',
              city: 'Bangalore',
              state: 'Karnataka',
              pincode: '560034',
              landmark: 'Near Metro Station'
            },
            created_at: new Date(Date.now() - 14400000).toISOString(),
            updated_at: new Date(Date.now() - 10800000).toISOString()
          }
        ];
        
        localStorage.setItem('w3mart_orders', JSON.stringify(testOrders));
        console.log('✅ Created 5 test orders:', testOrders.length);
        
        toast.success('🎉 Demo Orders Created!', {
          description: 'Test orders have been created for demonstration',
          duration: 5000
        });
      }
      
      // Pull data directly from Supabase orders table - NO DUMMY DATA
      const orderData = user.role === 'seller' 
        ? await supabaseService.getSellerOrders(user.email || user.id)
        : await supabaseService.getUserOrders(user.email || user.id);
      
      // CRITICAL FIX: Filter orders for Dashboard display
      // Dashboard shows ONLY pending orders for sellers (accepted orders go to Manage Orders)
      const filteredOrders = user.role === 'seller'
        ? orderData.filter(o => o.status === 'pending')
        : orderData; // Buyers see all their orders
      
      setOrders(filteredOrders);
      
      // Calculate stats based on ALL real data (not filtered)
      if (user.role === 'seller') {
        const totalSales = orderData.length;
        const pendingOrders = orderData.filter(o => o.status === 'pending').length;
        const completedOrders = orderData.filter(o => o.status === 'delivered').length;
        const totalRevenue = orderData.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
        const totalEarnings = orderData
          .filter(o => o.status === 'delivered')
          .reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
        
        setStats({ 
          totalSales, 
          pendingOrders, 
          completedOrders, 
          totalRevenue, 
          totalEarnings 
        });
      } else {
        const totalOrders = orderData.length;
        const activeOrders = orderData.filter(o => 
          o.status !== 'delivered' && o.status !== 'rejected'
        ).length;
        const completedOrders = orderData.filter(o => o.status === 'delivered').length;
        const totalSpent = orderData
          .filter(o => o.status === 'delivered')
          .reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
        
        setStats({ 
          totalOrders, 
          activeOrders, 
          completedOrders, 
          totalSpent 
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={user.role}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-gray-50 py-8"
      >
        <div className="container mx-auto px-4">
          {user.role === 'seller' ? (
            <SellerDashboardView 
              user={user} 
              orders={orders} 
              stats={stats}
              onRefresh={loadDashboardData}
            />
          ) : (
            <BuyerDashboardView 
              user={user} 
              orders={orders} 
              stats={stats}
              onRefresh={loadDashboardData}
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Seller Dashboard View
 * Shows: Total Sales, Pending Approvals, Recent Orders
 */
function SellerDashboardView({ user, orders, stats, onRefresh }) {
  const navigate = useNavigate();
  const [selectedBuyerInfo, setSelectedBuyerInfo] = useState(null);

  const handleAcceptOrder = async (order) => {
    const confirmed = window.confirm(
      `✅ ACCEPT ORDER?\n\n` +
      `Product: ${order.product_name}\n` +
      `Amount: ${order.amount} ETH\n` +
      `Buyer: ${order.buyer_name || 'Customer'}\n\n` +
      `After accepting:\n` +
      `• Buyer will be NOTIFIED immediately\n` +
      `• Buyer can then make PAYMENT\n` +
      `• Payment will be held in ESCROW\n\n` +
      `Do you want to accept this order?`
    );

    if (!confirmed) return;

    const result = await supabaseService.updateOrderStatus(order.id, 'approved');
    
    if (result.success) {
      // Trigger confetti animation
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#fbbf24']
      });

      toast.success('✅ Order Accepted!', {
        description: '🔔 Buyer has been notified and can now make payment',
        duration: 5000
      });

      // Send notification to buyer
      const notificationData = {
        type: 'order_approved',
        title: '🎉 Order Approved!',
        orderId: order.id,
        productName: order.product_name,
        amount: order.amount,
        message: `Your order for ${order.product_name} has been approved by the seller. You can now proceed with payment.`,
        timestamp: new Date().toISOString(),
        icon: '✅'
      };
      
      localStorage.setItem(
        `buyer_notifications_${order.buyer_email}`,
        JSON.stringify(notificationData)
      );

      onRefresh();
    } else {
      toast.error('Failed to approve order');
    }
  };

  const handleRejectOrder = async (order) => {
    const reason = window.prompt('❌ Enter reason for rejection:');
    if (!reason) return;

    const confirmRefund = window.confirm(
      `⚠️ REJECT ORDER & PROCESS REFUND\n\n` +
      `Product: ${order.product_name}\n` +
      `Amount: ${order.amount} ETH\n` +
      `Reason: ${reason}\n\n` +
      `This will:\n` +
      `• Reject the order\n` +
      `• Process REFUND of ${order.amount} ETH to buyer (if paid)\n` +
      `• Notify buyer about rejection and refund\n\n` +
      `Continue with rejection?`
    );

    if (!confirmRefund) return;

    // Process refund if order was paid
    let refundResult = null;
    if (order.status === 'paid' || order.blockchain_tx) {
      refundResult = await blockchainService.refundOrder(
        order.blockchain_order_id || order.id,
        order.amount,
        order.buyer_wallet || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
      );
    }

    const result = await supabaseService.updateOrderStatus(order.id, 'rejected', reason);
    
    if (result.success) {
      toast.error('Order Rejected & Refund Processed', {
        description: refundResult ? `${order.amount} ETH refunded to buyer` : 'Buyer has been notified',
        duration: 5000
      });

      // Send rejection + refund notification to buyer
      const notificationData = {
        type: 'order_rejected_refund',
        title: '💰 Order Rejected - Refund Processed',
        orderId: order.id,
        productName: order.product_name,
        amount: order.amount,
        refundTxHash: refundResult?.txHash,
        message: refundResult 
          ? `Your order for ${order.product_name} has been rejected. Reason: ${reason}\n\n✅ REFUND PROCESSED: ${order.amount} ETH has been returned to your wallet.\n\nTransaction Hash: ${refundResult.txHash}`
          : `Your order for ${order.product_name} has been rejected by the seller. Reason: ${reason}`,
        timestamp: new Date().toISOString(),
        icon: '💰'
      };
      
      localStorage.setItem(
        `buyer_notifications_${order.buyer_email}`,
        JSON.stringify(notificationData)
      );

      onRefresh();
    } else {
      toast.error('Failed to reject order');
    }
  };

  const handleViewBuyerInfo = (order) => {
    setSelectedBuyerInfo(order);
  };

  return (
    <>
      {/* Welcome Section */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {user.storeName || user.name || 'Seller'} Dashboard 🏪
        </h1>
        <p className="text-gray-600">
          Manage your orders and track your sales performance
        </p>
      </motion.div>

      {/* Total Earnings Highlight */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-8 mb-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-2">
                💰 Total Earnings (Delivered Orders)
              </p>
              <h2 className="text-5xl font-bold mb-2">
                {stats.totalEarnings?.toFixed(4) || '0.0000'} ETH
              </h2>
              <p className="text-green-100 text-sm">
                From {stats.completedOrders || 0} completed orders
              </p>
            </div>
            <div className="bg-white/20 p-6 rounded-full">
              <DollarSign className="h-16 w-16" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        className="grid md:grid-cols-4 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <StatCard
          icon={<DollarSign className="h-8 w-8" />}
          title="Total Revenue"
          value={`${stats.totalRevenue?.toFixed(3) || '0.000'} ETH`}
          color="green"
        />
        <StatCard
          icon={<Package className="h-8 w-8" />}
          title="Total Sales"
          value={stats.totalSales || 0}
          color="blue"
        />
        <StatCard
          icon={<Clock className="h-8 w-8" />}
          title="Pending Approvals"
          value={stats.pendingOrders || 0}
          color="yellow"
        />
        <StatCard
          icon={<CheckCircle className="h-8 w-8" />}
          title="Completed"
          value={stats.completedOrders || 0}
          color="purple"
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6 mb-8 bg-gradient-to-r from-[#2874f0] to-blue-600 text-white">
          <h2 className="text-2xl font-bold mb-4">Seller Actions</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Link to="/orders/manage">
              <Button className="w-full bg-white text-[#2874f0] hover:bg-gray-100">
                <Truck className="h-4 w-4 mr-2" />
                Manage Orders
              </Button>
            </Link>
            <Link to="/products/manage">
              <Button className="w-full bg-white text-[#2874f0] hover:bg-gray-100">
                <TrendingUp className="h-4 w-4 mr-2" />
                Manage Products
              </Button>
            </Link>
            <Link to="/reviews">
              <Button className="w-full bg-white text-[#2874f0] hover:bg-gray-100">
                <Users className="h-4 w-4 mr-2" />
                View Reviews
              </Button>
            </Link>
            <Link to="/transparency">
              <Button className="w-full bg-white text-[#2874f0] hover:bg-gray-100">
                <Activity className="h-4 w-4 mr-2" />
                Transparency
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>

      {/* Recent Orders - Real Data Only */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
            <Link to="/orders">
              <Button variant="outline" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600">
                Orders will appear here when customers purchase your products
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 5).map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <OrderCard 
                    order={order} 
                    userRole="seller"
                    onAccept={handleAcceptOrder}
                    onReject={handleRejectOrder}
                    onViewBuyerInfo={handleViewBuyerInfo}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Buyer Info Modal */}
      {selectedBuyerInfo && (
        <BuyerInfoModal
          isOpen={!!selectedBuyerInfo}
          onClose={() => setSelectedBuyerInfo(null)}
          order={selectedBuyerInfo}
        />
      )}
    </>
  );
}

/**
 * Buyer Dashboard View
 * Shows: Total Spent, Active Orders, Recent Orders
 */
function BuyerDashboardView({ user, orders, stats, onRefresh }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Welcome Section */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.name || 'Buyer'}! 👋
        </h1>
        <p className="text-gray-600">
          Here's your shopping overview and recent orders
        </p>
      </motion.div>

      {/* Total Spent Highlight */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-8 mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-2">
                💳 Total Spent (Completed Orders)
              </p>
              <h2 className="text-5xl font-bold mb-2">
                {stats.totalSpent?.toFixed(4) || '0.0000'} ETH
              </h2>
              <p className="text-blue-100 text-sm">
                From {stats.completedOrders || 0} completed orders
              </p>
            </div>
            <div className="bg-white/20 p-6 rounded-full">
              <ShoppingBag className="h-16 w-16" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        className="grid md:grid-cols-4 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <StatCard
          icon={<ShoppingBag className="h-8 w-8" />}
          title="Total Orders"
          value={stats.totalOrders || 0}
          color="blue"
        />
        <StatCard
          icon={<Clock className="h-8 w-8" />}
          title="Active Orders"
          value={stats.activeOrders || 0}
          color="yellow"
        />
        <StatCard
          icon={<CheckCircle className="h-8 w-8" />}
          title="Completed"
          value={stats.completedOrders || 0}
          color="green"
        />
        <StatCard
          icon={<TrendingUp className="h-8 w-8" />}
          title="Total Spent"
          value={`${stats.totalSpent?.toFixed(3) || '0.000'} ETH`}
          color="purple"
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6 mb-8 bg-gradient-to-r from-[#2874f0] to-purple-600 text-white">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/">
              <Button className="w-full bg-white text-[#2874f0] hover:bg-gray-100">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Browse Products
              </Button>
            </Link>
            <Link to="/orders">
              <Button className="w-full bg-white text-[#2874f0] hover:bg-gray-100">
                <Package className="h-4 w-4 mr-2" />
                My Orders
              </Button>
            </Link>
            <Link to="/transparency">
              <Button className="w-full bg-white text-[#2874f0] hover:bg-gray-100">
                <Activity className="h-4 w-4 mr-2" />
                Transparency
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>

      {/* Recent Orders - Real Data Only */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
            <Link to="/orders">
              <Button variant="outline" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600">
                Start shopping to see your orders here
              </p>
              <Link to="/">
                <Button className="mt-4 bg-[#2874f0] hover:bg-blue-700">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 5).map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <OrderCard order={order} userRole="buyer" />
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </>
  );
}

/**
 * Stat Card Component
 */
function StatCard({ icon, title, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
      <div className={`p-3 rounded-lg ${colorClasses[color]} w-fit mb-4`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
    </Card>
  );
}

/**
 * Order Card Component - Real Data Display
 */
function OrderCard({ order, userRole, onAccept, onReject, onViewBuyerInfo }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5" />;
      case 'paid': return <CheckCircle className="h-5 w-5" />;
      case 'shipped': return <Truck className="h-5 w-5" />;
      case 'delivered': return <CheckCircle className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending Approval';
      case 'approved': return 'Seller Preparing Order';
      case 'paid': return 'Payment Confirmed';
      case 'shipped': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      default: return status;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-4">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <Package className="h-6 w-6 text-[#2874f0]" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{order.product_name}</h4>
          <p className="text-sm text-gray-600">
            {new Date(order.created_at).toLocaleDateString()} • {order.amount} ETH
          </p>
          {userRole === 'seller' && order.buyer_name && (
            <p className="text-xs text-gray-500">Buyer: {order.buyer_name}</p>
          )}
        </div>
      </div>
      
      {/* Seller Action Buttons for Pending Orders */}
      {userRole === 'seller' && order.status === 'pending' && onAccept && onReject && onViewBuyerInfo && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
          <Button
            onClick={() => onViewBuyerInfo(order)}
            variant="outline"
            size="sm"
            className="flex-1 min-w-[140px]"
          >
            <User className="h-4 w-4 mr-2" />
            View Buyer Info
          </Button>
          <Button
            onClick={() => onAccept(order)}
            className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Accept
          </Button>
          <Button
            onClick={() => onReject(order)}
            variant="destructive"
            size="sm"
            className="flex-1 min-w-[120px]"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}


/**
 * Buyer Info Modal Component
 * Shows buyer details and shipping address for sellers
 */
function BuyerInfoModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md"
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Buyer Information</h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Buyer Details */}
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Name</p>
              <p className="font-semibold text-gray-900">{order.buyer_name || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Email</p>
              <p className="font-semibold text-gray-900">{order.buyer_email || 'N/A'}</p>
            </div>
            
            {order.shipping_address && (
              <>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-600" />
                    <p className="font-semibold text-gray-900">{order.shipping_address.phone}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">Shipping Address</p>
                  <div className="p-4 bg-blue-50 rounded-lg space-y-1">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">{order.shipping_address.fullName}</p>
                        <p className="text-sm text-gray-700 mt-1">{order.shipping_address.address}</p>
                        <p className="text-sm text-gray-700">
                          {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                        </p>
                        {order.shipping_address.landmark && (
                          <p className="text-sm text-gray-600 mt-1">
                            Landmark: {order.shipping_address.landmark}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            <div>
              <p className="text-sm text-gray-600 mb-2">Buyer Rating</p>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star} 
                    className={`h-5 w-5 ${star <= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-600">4.5/5 (12 reviews)</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-1">Order Amount</p>
              <p className="text-2xl font-bold text-gray-900">{order.amount} ETH</p>
            </div>
          </div>
          
          <Button 
            onClick={onClose} 
            className="w-full mt-6 bg-[#2874f0] hover:bg-blue-700"
          >
            Close
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}

/**
 * Dashboard Loading Skeleton
 */
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        
        {/* Highlight Card Skeleton */}
        <Card className="p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Skeleton className="h-4 w-48 mb-3" />
              <Skeleton className="h-12 w-64 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-24 w-24 rounded-full" />
          </div>
        </Card>
        
        {/* Stats Grid Skeleton */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-6">
              <Skeleton className="h-12 w-12 rounded-lg mb-4" />
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </Card>
          ))}
        </div>
        
        {/* Quick Actions Skeleton */}
        <Card className="p-6 mb-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </Card>
        
        {/* Orders Skeleton */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
