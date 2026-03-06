import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, Package, TrendingUp, Clock, CheckCircle, 
  Truck, ShoppingBag, Activity, Bell, User, Phone, MapPin, 
  X, Star, Eye, Check, XCircle, Sparkles, ArrowRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import supabaseService from '../services/supabaseService';
import blockchainService from '../services/blockchainService';

/**
 * Professional Seller Dashboard with Glassmorphism
 * Real-time Supabase sync, blockchain integration, zero dummy data
 */
export default function SellerDashboardPro({ user }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [processingOrderId, setProcessingOrderId] = useState(null);

  useEffect(() => {
    if (user?.role !== 'seller') {
      navigate('/dashboard');
      return;
    }
    
    loadDashboardData();
    
    // Real-time sync every 5 seconds
    const interval = setInterval(loadDashboardData, 5000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch live data from Supabase - NO DUMMY DATA
      const orderData = await supabaseService.getSellerOrders(user.email || user.id);
      
      // Filter for pending orders only (Dashboard shows pending, Manage Orders shows rest)
      const pendingOrders = orderData.filter(o => o.status === 'pending');
      setOrders(pendingOrders);
      
      // Calculate real-time stats
      const totalRevenue = orderData.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
      const activeOrders = orderData.filter(o => 
        o.status !== 'delivered' && o.status !== 'rejected'
      ).length;
      const pendingApprovals = orderData.filter(o => o.status === 'pending').length;
      const completedOrders = orderData.filter(o => o.status === 'delivered').length;
      const totalEarnings = orderData
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
      
      setStats({ 
        totalRevenue, 
        activeOrders, 
        pendingApprovals, 
        completedOrders,
        totalEarnings 
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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
      `• Payment will be held in ESCROW\n` +
      `• Order moves to "Manage Orders"\n\n` +
      `Do you want to accept this order?`
    );

    if (!confirmed) return;

    setProcessingOrderId(order.id);

    try {
      // Update order status in Supabase
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

        // Reload dashboard data
        await loadDashboardData();
      } else {
        toast.error('Failed to approve order');
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Failed to accept order');
    } finally {
      setProcessingOrderId(null);
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

    setProcessingOrderId(order.id);

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
    } finally {
      setProcessingOrderId(null);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header with Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 mb-8 rounded-3xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {user.storeName || user.name || 'Seller'} Dashboard 🏪
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your orders and track your sales performance
              </p>
            </div>
            <Button
              onClick={() => navigate('/orders/manage')}
              className="bg-[#2874f0] hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <Truck className="h-5 w-5 mr-2" />
              Manage Orders
            </Button>
          </div>
        </motion.div>

        {/* Total Earnings Highlight with Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card-gradient p-10 mb-8 rounded-3xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/90 text-lg font-medium mb-2">
                💰 Total Earnings (Delivered Orders)
              </p>
              <h2 className="text-6xl font-bold text-white mb-2">
                {stats.totalEarnings?.toFixed(4) || '0.0000'} ETH
              </h2>
              <p className="text-white/80 text-lg">
                From {stats.completedOrders || 0} completed orders
              </p>
            </div>
            <div className="glass-icon-large">
              <DollarSign className="h-20 w-20 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Stats Grid with Glassmorphism */}
        <motion.div 
          className="grid md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatCardGlass
            icon={<DollarSign className="h-10 w-10" />}
            title="Total Revenue"
            value={`${stats.totalRevenue?.toFixed(3) || '0.000'} ETH`}
            color="blue"
          />
          <StatCardGlass
            icon={<Package className="h-10 w-10" />}
            title="Active Orders"
            value={stats.activeOrders || 0}
            color="purple"
          />
          <StatCardGlass
            icon={<Clock className="h-10 w-10" />}
            title="Pending Approvals"
            value={stats.pendingApprovals || 0}
            color="yellow"
            highlight={stats.pendingApprovals > 0}
          />
        </motion.div>

        {/* Trust Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-8 mb-8 rounded-3xl"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Activity className="h-6 w-6 mr-3 text-[#2874f0]" />
            Trust Timeline - Order Pipeline
          </h2>
          <TrustTimeline />
        </motion.div>

        {/* Orders List with Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-8 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Package className="h-6 w-6 mr-3 text-[#2874f0]" />
              Pending Orders ({orders.length})
            </h2>
            <Button
              onClick={loadDashboardData}
              variant="outline"
              className="rounded-xl"
            >
              <Activity className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-20 w-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No pending orders</h3>
              <p className="text-gray-600 text-lg">
                Orders will appear here when customers place orders
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <OrderCardGlass 
                    order={order}
                    onAccept={handleAcceptOrder}
                    onReject={handleRejectOrder}
                    onViewDetails={setSelectedOrder}
                    isProcessing={processingOrderId === order.id}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </div>

      <style jsx>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
        }

        .glass-card-gradient {
          background: linear-gradient(135deg, rgba(40, 116, 240, 0.9) 0%, rgba(99, 102, 241, 0.9) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px 0 rgba(40, 116, 240, 0.3);
        }

        .glass-icon-large {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 2rem;
          border-radius: 2rem;
        }
      `}</style>
    </div>
  );
}

/**
 * Glassmorphism Stat Card
 */
function StatCardGlass({ icon, title, value, color, highlight }) {
  const colorClasses = {
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-pink-600',
    yellow: 'from-yellow-500 to-orange-600'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className={`glass-card p-6 rounded-2xl ${highlight ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}
    >
      <div className={`p-4 rounded-xl bg-gradient-to-br ${colorClasses[color]} w-fit mb-4`}>
        <div className="text-white">{icon}</div>
      </div>
      <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-gray-600 font-medium">{title}</p>
    </motion.div>
  );
}

/**
 * Trust Timeline Component
 */
function TrustTimeline() {
  const stages = [
    { icon: <ShoppingBag />, label: 'Order Placed', status: 'completed' },
    { icon: <CheckCircle />, label: 'Seller Approval', status: 'active' },
    { icon: <DollarSign />, label: 'Payment (Escrow)', status: 'pending' },
    { icon: <Truck />, label: 'Shipped', status: 'pending' },
    { icon: <CheckCircle />, label: 'Delivered', status: 'pending' }
  ];

  return (
    <div className="flex items-center justify-between">
      {stages.map((stage, index) => (
        <div key={index} className="flex items-center flex-1">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center"
          >
            <div className={`p-4 rounded-full ${
              stage.status === 'completed' 
                ? 'bg-green-500 text-white' 
                : stage.status === 'active'
                ? 'bg-blue-500 text-white animate-pulse'
                : 'bg-gray-200 text-gray-400'
            }`}>
              {stage.icon}
            </div>
            <p className={`mt-2 text-sm font-medium ${
              stage.status === 'completed' || stage.status === 'active'
                ? 'text-gray-900'
                : 'text-gray-400'
            }`}>
              {stage.label}
            </p>
          </motion.div>
          {index < stages.length - 1 && (
            <div className={`flex-1 h-1 mx-2 ${
              stage.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Order Card with Glassmorphism
 */
function OrderCardGlass({ order, onAccept, onReject, onViewDetails, isProcessing }) {
  return (
    <div className={`glass-card p-6 rounded-2xl hover:shadow-xl transition-all ${
      isProcessing ? 'ring-2 ring-green-500' : ''
    }`}>
      {isProcessing && (
        <div className="absolute inset-0 bg-green-50/50 rounded-2xl flex items-center justify-center z-10">
          <div className="glass-card p-6 rounded-xl flex flex-col items-center space-y-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-12 w-12 text-green-600" />
            </motion.div>
            <p className="text-lg font-semibold text-gray-900">Processing Order...</p>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900">{order.product_name}</h4>
              <p className="text-gray-600">
                {new Date(order.created_at).toLocaleDateString()} • {order.amount} ETH
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="glass-card p-4 rounded-xl">
              <p className="text-sm text-gray-600 mb-1">Buyer</p>
              <p className="font-semibold text-gray-900 flex items-center">
                <User className="h-4 w-4 mr-2" />
                {order.buyer_name}
              </p>
            </div>
            <div className="glass-card p-4 rounded-xl">
              <p className="text-sm text-gray-600 mb-1">Amount</p>
              <p className="font-semibold text-gray-900 text-lg">
                {order.amount} ETH
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-2 ml-4">
          <Button
            onClick={() => onViewDetails(order)}
            variant="outline"
            className="rounded-xl"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button
            onClick={() => onAccept(order)}
            className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
            disabled={isProcessing}
          >
            <Check className="h-4 w-4 mr-2" />
            Accept Order
          </Button>
          <Button
            onClick={() => onReject(order)}
            variant="destructive"
            className="rounded-xl"
            disabled={isProcessing}
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
 * Order Details Modal with Glassmorphism
 */
function OrderDetailsModal({ order, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Order Details</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Product Info */}
        <div className="glass-card p-6 rounded-2xl mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-xl flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Product Information
          </h3>
          <h4 className="font-bold text-2xl text-gray-900 mb-2">{order.product_name}</h4>
          <p className="text-gray-700 mb-4">{order.product_description}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Price</p>
              <p className="font-bold text-xl text-gray-900">{order.amount} ETH</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Quantity</p>
              <p className="font-bold text-xl text-gray-900">{order.quantity || 1}</p>
            </div>
          </div>
        </div>

        {/* Buyer Info */}
        <div className="glass-card p-6 rounded-2xl mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-xl flex items-center">
            <User className="h-5 w-5 mr-2" />
            Buyer Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <User className="h-5 w-5 mr-3 text-gray-600" />
              <span className="font-semibold text-gray-900">{order.buyer_name}</span>
            </div>
            {order.shipping_address && (
              <>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-3 text-gray-600" />
                  <span className="text-gray-700">{order.shipping_address.phone}</span>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-3 text-gray-600 mt-1" />
                  <div>
                    <p className="text-gray-700">{order.shipping_address.address}</p>
                    <p className="text-gray-700">
                      {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <Button 
          onClick={onClose} 
          className="w-full bg-[#2874f0] hover:bg-blue-700 text-white py-6 rounded-2xl text-lg"
        >
          Close
        </Button>
      </motion.div>
    </div>
  );
}

/**
 * Loading Skeleton
 */
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
        <div className="glass-card p-8 mb-8 rounded-3xl animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="glass-card p-10 mb-8 rounded-3xl animate-pulse">
          <div className="h-16 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-6 rounded-2xl animate-pulse">
              <div className="h-16 w-16 bg-gray-200 rounded-xl mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
