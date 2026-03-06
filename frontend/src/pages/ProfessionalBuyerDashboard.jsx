import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, Package, Clock, Truck, CheckCircle, 
  TrendingUp, DollarSign, Eye, MapPin, Phone, User, X
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import supabaseService from '../services/supabaseService';
import blockchainService from '../services/blockchainService';

/**
 * Professional Buyer Dashboard
 * Simplified view with Cart and Orders only
 * Synced with seller dashboard
 */
export default function ProfessionalBuyerDashboard({ user }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [processingOrderId, setProcessingOrderId] = useState(null);

  useEffect(() => {
    if (user?.role !== 'buyer') {
      navigate('/dashboard');
      return;
    }
    
    loadOrders();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.getUserOrders(user.email || user.id);
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    total: orders.length,
    active: orders.filter(o => 
      o.status !== 'delivered' && o.status !== 'rejected'
    ).length,
    completed: orders.filter(o => o.status === 'delivered').length,
    totalSpent: orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + parseFloat(o.amount || 0), 0)
  };

  const handleConfirmDelivery = async (order) => {
    const confirmed = window.confirm(
      `✅ CONFIRM DELIVERY\n\n` +
      `Product: ${order.product_name}\n` +
      `Amount: ${order.amount} ETH\n\n` +
      `By confirming delivery:\n` +
      `• You acknowledge receiving the product\n` +
      `• ${order.amount} ETH will be RELEASED from escrow\n` +
      `• Payment will be sent to the seller\n` +
      `• This action CANNOT be reversed\n\n` +
      `Have you received the product in good condition?`
    );

    if (!confirmed) return;

    setProcessingOrderId(order.id);

    try {
      const result = await blockchainService.confirmDelivery(order.blockchain_order_id || order.id);
      
      if (result.success) {
        await supabaseService.updateOrderStatus(order.id, 'delivered');
        
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b']
        });

        toast.success('🎉 Delivery Confirmed!', {
          description: `Payment of ${order.amount} ETH released to seller`,
          duration: 5000
        });

        // Send notification to seller
        const notificationData = {
          type: 'product_delivered_payment_released',
          title: '🎉 Product Delivered! Payment Released',
          orderId: order.id,
          productName: order.product_name,
          amount: order.amount,
          buyerName: order.buyer_name || 'Customer',
          txHash: result.txHash,
          message: `Excellent news! Buyer confirmed delivery of ${order.product_name}.\n\n💰 Payment of ${order.amount} ETH has been released to your wallet.\n\n✅ Transaction Complete!`,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem(
          `seller_notifications_${order.seller_email}`,
          JSON.stringify(notificationData)
        );

        await loadOrders();
      } else {
        toast.error('Failed to confirm delivery', {
          description: result.message
        });
      }
    } catch (error) {
      console.error('Error confirming delivery:', error);
      toast.error('Failed to confirm delivery');
    } finally {
      setProcessingOrderId(null);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name || 'Buyer'}! 👋
          </h1>
          <p className="text-gray-600">
            Here's your shopping overview and order status
          </p>
        </div>

        {/* Total Spent Card */}
        <Card className="p-8 mb-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-2">
                💳 Total Spent (Completed Orders)
              </p>
              <h2 className="text-5xl font-bold mb-2">
                {stats.totalSpent.toFixed(4)} ETH
              </h2>
              <p className="text-blue-100 text-sm">
                From {stats.completed} completed orders
              </p>
            </div>
            <div className="bg-white/20 p-6 rounded-full">
              <ShoppingBag className="h-16 w-16" />
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<ShoppingBag className="h-8 w-8" />}
            title="Total Orders"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon={<Clock className="h-8 w-8" />}
            title="Active Orders"
            value={stats.active}
            color="yellow"
          />
          <StatCard
            icon={<CheckCircle className="h-8 w-8" />}
            title="Completed"
            value={stats.completed}
            color="green"
          />
          <StatCard
            icon={<TrendingUp className="h-8 w-8" />}
            title="Total Spent"
            value={`${stats.totalSpent.toFixed(3)} ETH`}
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-[#2874f0] to-purple-600 text-white">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              onClick={() => navigate('/cart')}
              className="w-full bg-white text-[#2874f0] hover:bg-gray-100 h-16 text-lg"
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              View Cart
            </Button>
            <Button
              onClick={() => navigate('/orders')}
              className="w-full bg-white text-green-700 hover:bg-green-50 h-16 text-lg"
            >
              <Package className="h-5 w-5 mr-2" />
              Track Orders
            </Button>
            <Button
              onClick={() => navigate('/home')}
              className="w-full bg-white text-[#2874f0] hover:bg-gray-100 h-16 text-lg"
            >
              <Package className="h-5 w-5 mr-2" />
              Browse Products
            </Button>
          </div>
        </Card>

        {/* Orders Section */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">My Orders</h2>
              <p className="text-sm text-gray-600">
                Track your purchases and deliveries
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={loadOrders}
                variant="outline"
                size="sm"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                </motion.div>
                Refresh
              </Button>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
              <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <ShoppingBag className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start shopping to see your orders here. Browse our collection of amazing products!
              </p>
              <Button
                onClick={() => navigate('/home')}
                className="bg-[#2874f0] hover:bg-blue-700"
                size="lg"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Start Shopping Now
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <OrderCard
                    order={order}
                    onConfirmDelivery={handleConfirmDelivery}
                    onViewDetails={setSelectedOrder}
                    isProcessing={processingOrderId === order.id}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {/* Order Details Modal */}
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onConfirmDelivery={handleConfirmDelivery}
          />
        )}
      </div>
    </div>
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
 * Order Card Component - Enhanced with Product Image
 */
function OrderCard({ order, onConfirmDelivery, onViewDetails, isProcessing }) {
  const getStatusConfig = (status) => {
    const configs = {
      pending: { 
        label: 'Pending Approval', 
        color: 'bg-yellow-100 text-yellow-800',
        icon: <Clock className="h-4 w-4" />,
        message: 'Waiting for seller approval'
      },
      approved: { 
        label: 'Payment Required', 
        color: 'bg-blue-100 text-blue-800',
        icon: <DollarSign className="h-4 w-4" />,
        message: 'Seller accepted! Please complete payment'
      },
      paid: { 
        label: 'Payment Confirmed', 
        color: 'bg-green-100 text-green-800',
        icon: <Package className="h-4 w-4" />,
        message: 'Waiting for seller to ship'
      },
      shipped: { 
        label: 'Out for Delivery', 
        color: 'bg-purple-100 text-purple-800',
        icon: <Truck className="h-4 w-4" />,
        message: 'Your order is on the way'
      },
      delivered: { 
        label: 'Delivered', 
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="h-4 w-4" />,
        message: 'Order completed'
      },
      rejected: { 
        label: 'Rejected', 
        color: 'bg-red-100 text-red-800',
        icon: <X className="h-4 w-4" />,
        message: 'Order was rejected'
      }
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = getStatusConfig(order.status);

  return (
    <Card className={`overflow-hidden hover:shadow-xl transition-all duration-300 ${
      isProcessing ? 'ring-2 ring-green-500 shadow-xl' : ''
    }`}>
      {isProcessing && (
        <div className="absolute inset-0 bg-green-50/90 rounded-lg flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center space-y-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <CheckCircle className="h-12 w-12 text-green-600" />
            </motion.div>
            <p className="text-lg font-semibold text-gray-900">Processing...</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        {/* Product Image */}
        <div className="md:w-48 h-48 bg-gray-100 flex-shrink-0">
          {order.product_image ? (
            <img 
              src={order.product_image} 
              alt={order.product_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-16 w-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-xl font-bold text-gray-900">{order.product_name}</h4>
                <Badge className={`${statusConfig.color} flex items-center gap-1`}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Order ID: {order.id.substring(0, 20)}...
              </p>
              {order.product_description && (
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                  {order.product_description}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Amount</p>
              <p className="font-bold text-lg text-gray-900">{order.amount} ETH</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Quantity</p>
              <p className="font-bold text-lg text-gray-900">{order.quantity || 1}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Seller</p>
              <p className="font-semibold text-sm text-gray-900 truncate">{order.seller_name}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Order Date</p>
              <p className="font-semibold text-sm text-gray-900">
                {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {order.tracking_id && (
            <div className="p-3 bg-purple-50 rounded-lg mb-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <Truck className="h-4 w-4 text-purple-600" />
                <p className="text-sm font-semibold text-purple-900">Tracking Information</p>
              </div>
              <p className="text-sm font-mono text-purple-700">{order.tracking_id}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              {statusConfig.icon}
              {statusConfig.message}
            </p>

            <div className="flex gap-2">
              <Button
                onClick={() => onViewDetails(order)}
                variant="outline"
                size="sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                Details
              </Button>

              {order.status === 'shipped' && (
                <Button
                  onClick={() => onConfirmDelivery(order)}
                  className="bg-green-600 hover:bg-green-700 animate-pulse"
                  size="sm"
                  disabled={isProcessing}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Delivery
                </Button>
              )}

              {order.status === 'approved' && (
                <Button
                  className="bg-[#2874f0] hover:bg-blue-700 animate-pulse"
                  size="sm"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Pay Now
                </Button>
              )}

              {order.status === 'delivered' && (
                <div className="px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-green-700 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Completed
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Order Details Modal - Enhanced with Product Image
 */
function OrderDetailsModal({ order, onClose, onConfirmDelivery }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Product Image & Info */}
          <Card className="p-6 mb-6 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Product Image */}
              <div className="md:w-64 h-64 bg-white rounded-lg overflow-hidden shadow-lg flex-shrink-0">
                {order.product_image ? (
                  <img 
                    src={order.product_image} 
                    alt={order.product_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Package className="h-20 w-20 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-lg">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />
                  Product Information
                </h3>
                <h4 className="font-bold text-2xl text-gray-900 mb-3">{order.product_name}</h4>
                {order.product_description && (
                  <p className="text-gray-700 mb-4 leading-relaxed">{order.product_description}</p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Price</p>
                    <p className="font-bold text-2xl text-blue-600">{order.amount} ETH</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Quantity</p>
                    <p className="font-bold text-2xl text-gray-900">{order.quantity || 1}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Order Status */}
          <Card className="p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Truck className="h-5 w-5 mr-2 text-purple-600" />
              Order Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Order ID</span>
                <span className="font-mono text-sm text-gray-900">{order.id.substring(0, 24)}...</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className={
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                  order.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }>
                  {order.status.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Order Date</span>
                <span className="font-semibold text-gray-900">
                  {new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              {order.tracking_id && (
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <span className="text-sm text-purple-900 font-medium">Tracking ID</span>
                  <span className="font-mono text-sm text-purple-700">{order.tracking_id}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Seller Info */}
          <Card className="p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-green-600" />
              Seller Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 mr-3 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Seller Name</p>
                  <p className="font-semibold text-gray-900">{order.seller_name}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Shipping Address */}
          {order.shipping_address && (
            <Card className="p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-red-600" />
                Shipping Address
              </h3>
              <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 text-lg">{order.shipping_address.fullName}</p>
                <p className="text-gray-700 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  {order.shipping_address.phone}
                </p>
                <p className="text-gray-700">{order.shipping_address.address}</p>
                <p className="text-gray-700">
                  {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                </p>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={onClose} 
              variant="outline"
              className="flex-1"
            >
              Close
            </Button>
            {order.status === 'shipped' && (
              <Button 
                onClick={() => {
                  onConfirmDelivery(order);
                  onClose();
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Delivery
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Loading Skeleton
 */
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4">
        <div className="h-10 bg-gray-200 rounded w-64 mb-6 animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded mb-6 animate-pulse"></div>
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
