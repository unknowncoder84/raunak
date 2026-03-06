import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, Package, TrendingUp, Users, Clock, CheckCircle, 
  Truck, ShoppingBag, Activity, ArrowRight, Sparkles, Bell, 
  User, Phone, MapPin, X, Star, XCircle, RefreshCw, Zap
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import supabaseService from '../services/supabaseService';
import blockchainService from '../services/blockchainService';

/**
 * Enhanced Seller Dashboard with Glassmorphism & Real-time Sync
 * Features: Live Supabase updates, Trust Timeline, Zero dummy data
 */
export default function EnhancedSellerDashboard({ user, isDemoMode }) {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
    
    // Real-time sync every 3 seconds
    const interval = setInterval(() => {
      loadDashboardData(true); // Silent refresh
    }, 3000);
    
    return () => clearInterval(interval);
  }, [user]);

  const loadDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    
    try {
      // Fetch live data from Supabase - NO DUMMY DATA
      const orderData = await supabaseService.getSellerOrders(user.email || user.id);
      
      // Filter: Dashboard shows ONLY pending orders
      const pendingOrders = orderData.filter(o => o.status === 'pending');
      setOrders(pendingOrders);
      
      // Calculate real-time stats
      const totalSales = orderData.length;
      const pendingCount = pendingOrders.length;
      const completedOrders = orderData.filter(o => o.status === 'delivered').length;
      const totalRevenue = orderData.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
      const totalEarnings = orderData
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
      
      setStats({ 
        totalSales, 
        pendingOrders: pendingCount, 
        completedOrders, 
        totalRevenue, 
        totalEarnings 
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      if (!silent) toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
    toast.success('Dashboard refreshed!');
  };

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

    try {
      // Update order status to 'approved'
      const result = await supabaseService.updateOrderStatus(order.id, 'approved');
      
      if (result.success) {
        // Trigger confetti
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

        // Reload dashboard
        await loadDashboardData();
      } else {
        toast.error('Failed to approve order');
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Failed to accept order');
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

    try {
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

        await loadDashboardData();
      } else {
        toast.error('Failed to reject order');
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error('Failed to reject order');
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container mx-auto px-4">
        {/* Glass Header */}
        <motion.div 
          className="glass-card rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <Sparkles className="h-8 w-8 text-[#2874f0] mr-3" />
                {user.storeName || user.name || 'Seller'} Dashboard
              </h1>
              <p className="text-gray-600">
                Real-time order management with blockchain verification
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="glass-button"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Total Earnings - Glass Effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8 mb-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-white opacity-10"></div>
            <div className="relative z-10 flex items-center justify-between">
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
              <div className="bg-white/20 p-6 rounded-full backdrop-blur-sm">
                <DollarSign className="h-16 w-16" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats Grid - Glass Cards */}
        <motion.div 
          className="grid md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassStatCard
            icon={<DollarSign className="h-8 w-8" />}
            title="Total Revenue"
            value={`${stats.totalRevenue?.toFixed(3) || '0.000'} ETH`}
            color="green"
            delay={0.3}
          />
          <GlassStatCard
            icon={<Package className="h-8 w-8" />}
            title="Total Sales"
            value={stats.totalSales || 0}
            color="blue"
            delay={0.4}
          />
          <GlassStatCard
            icon={<Clock className="h-8 w-8" />}
            title="Pending Approvals"
            value={stats.pendingOrders || 0}
            color="yellow"
            delay={0.5}
            pulse={stats.pendingOrders > 0}
          />
          <GlassStatCard
            icon={<CheckCircle className="h-8 w-8" />}
            title="Completed"
            value={stats.completedOrders || 0}
            color="purple"
            delay={0.6}
          />
        </motion.div>

        {/* Quick Actions - Glass Effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="glass-card p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Zap className="h-6 w-6 text-[#2874f0] mr-2" />
              Quick Actions
            </h2>
            <div className="grid md:grid-cols-4 gap-4">
              <Link to="/orders/manage">
                <Button className="w-full bg-[#2874f0] hover:bg-blue-700 glass-shimmer">
                  <Truck className="h-4 w-4 mr-2" />
                  Manage Orders
                </Button>
              </Link>
              <Link to="/products/manage">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Manage Products
                </Button>
              </Link>
              <Link to="/reviews">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <Users className="h-4 w-4 mr-2" />
                  View Reviews
                </Button>
              </Link>
              <Link to="/transparency">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                  <Activity className="h-4 w-4 mr-2" />
                  Transparency
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Pending Orders - Glass Effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Bell className={`h-6 w-6 text-yellow-600 mr-2 ${stats.pendingOrders > 0 ? 'animate-wiggle' : ''}`} />
                Pending Orders
              </h2>
              <Badge className="glass-badge text-yellow-700 font-semibold">
                {stats.pendingOrders || 0} Awaiting Approval
              </Badge>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
                <p className="text-gray-600">
                  No pending orders. All orders have been processed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                  >
                    <PendingOrderCard 
                      order={order}
                      onAccept={handleAcceptOrder}
                      onReject={handleRejectOrder}
                      onViewDetails={setSelectedOrder}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Trust Timeline Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-8"
        >
          <Card className="glass-card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Activity className="h-6 w-6 text-[#2874f0] mr-2" />
              Trust Timeline
            </h2>
            <div className="space-y-4">
              <TrustTimelineItem
                icon={<Clock />}
                title="Order Received"
                description="Buyer places order and awaits your approval"
                status="active"
              />
              <TrustTimelineItem
                icon={<CheckCircle />}
                title="Accept Order"
                description="Approve order to allow buyer payment"
                status="pending"
              />
              <TrustTimelineItem
                icon={<DollarSign />}
                title="Payment in Escrow"
                description="Buyer pays, funds held securely in smart contract"
                status="pending"
              />
              <TrustTimelineItem
                icon={<Truck />}
                title="Mark as Shipped"
                description="Ship product and update status"
                status="pending"
              />
              <TrustTimelineItem
                icon={<CheckCircle />}
                title="Delivery Confirmed"
                description="Buyer confirms delivery, payment released to you"
                status="pending"
                isLast
              />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

/**
 * Glass Stat Card Component
 */
function GlassStatCard({ icon, title, value, color, delay, pulse }) {
  const colorClasses = {
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    purple: 'text-purple-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`glass-stat-card p-6 rounded-xl ${pulse ? 'animate-pulse-slow' : ''}`}
    >
      <div className={`p-3 rounded-lg bg-white/50 w-fit mb-4 ${colorClasses[color]}`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
    </motion.div>
  );
}

/**
 * Pending Order Card with Glass Effect
 */
function PendingOrderCard({ order, onAccept, onReject, onViewDetails }) {
  return (
    <div className="glass-card p-6 rounded-xl hover:shadow-xl transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-xl shadow-lg">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-lg">{order.product_name}</h4>
            <p className="text-sm text-gray-600">
              Order #{order.id.substring(0, 16)}... • {order.amount} ETH
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Buyer: {order.buyer_name || 'Customer'} • {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => onViewDetails(order)}
            variant="outline"
            size="sm"
            className="glass-button"
          >
            <User className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button
            onClick={() => onAccept(order)}
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Accept
          </Button>
          <Button
            onClick={() => onReject(order)}
            variant="destructive"
            size="sm"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Trust Timeline Item
 */
function TrustTimelineItem({ icon, title, description, status, isLast }) {
  const statusColors = {
    active: 'bg-blue-100 text-blue-600 border-blue-300',
    completed: 'bg-green-100 text-green-600 border-green-300',
    pending: 'bg-gray-100 text-gray-400 border-gray-300'
  };

  return (
    <div className={`flex items-start space-x-4 ${!isLast ? 'pb-4 border-l-2 border-gray-200 ml-4' : ''}`}>
      <div className={`p-2 rounded-lg ${statusColors[status]} border-2 -ml-6 bg-white`}>
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

/**
 * Order Details Modal
 */
function OrderDetailsModal({ order, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl"
      >
        <Card className="glass-modal p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Order Details</h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="glass-card p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Product</p>
              <p className="font-semibold text-gray-900">{order.product_name}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Amount</p>
                <p className="font-semibold text-gray-900">{order.amount} ETH</p>
              </div>
              <div className="glass-card p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <Badge className="glass-badge">{order.status}</Badge>
              </div>
            </div>
            
            <div className="glass-card p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Buyer Information</p>
              <div className="space-y-2">
                <p className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-gray-600" />
                  {order.buyer_name || 'N/A'}
                </p>
                <p className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-gray-600" />
                  {order.shipping_address?.phone || 'N/A'}
                </p>
              </div>
            </div>
            
            {order.shipping_address && (
              <div className="glass-card p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Shipping Address</p>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{order.shipping_address.fullName}</p>
                  <p>{order.shipping_address.address}</p>
                  <p>
                    {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                  </p>
                </div>
              </div>
            )}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container mx-auto px-4">
        <div className="glass-card rounded-2xl p-6 mb-8 animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-96"></div>
        </div>
        
        <div className="glass-card p-8 mb-8 animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </div>
        
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card p-6 rounded-xl animate-pulse">
              <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
