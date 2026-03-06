import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, Clock, Truck, CheckCircle, XCircle, MapPin, Phone, 
  User, ArrowLeft, Filter, Search, Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import supabaseService from '../services/supabaseService';
import blockchainService from '../services/blockchainService';

/**
 * Manage Orders Page - Seller's Order Management Hub
 * Tracks: Accepted → Mark as Shipped → Delivered
 */
export default function ManageOrders({ user }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, approved, paid, shipped
  const [searchQuery, setSearchQuery] = useState('');
  const [processingOrderId, setProcessingOrderId] = useState(null);

  useEffect(() => {
    if (user?.role !== 'seller') {
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
      const data = await supabaseService.getSellerOrders(user.id || user.email);
      // Filter to show only accepted orders and beyond (not pending or rejected)
      const managedOrders = data.filter(order => 
        order.status !== 'pending' && order.status !== 'rejected'
      );
      setOrders(managedOrders);
      
      console.log('📦 Manage Orders loaded:', managedOrders.length, 'orders');
      console.log('Status breakdown:', {
        accepted: managedOrders.filter(o => o.status === 'accepted').length,
        shipped: managedOrders.filter(o => o.status === 'shipped').length,
        delivered: managedOrders.filter(o => o.status === 'delivered').length
      });
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsShipped = async (order) => {
    const trackingId = window.prompt(
      '📦 MARK AS SHIPPED\n\n' +
      `Product: ${order.product_name}\n` +
      `Buyer: ${order.buyer_name}\n\n` +
      'Enter tracking ID (optional):'
    ) || `TRACK-${Date.now()}`;

    if (!trackingId) return;

    const confirmed = window.confirm(
      `🚚 CONFIRM SHIPMENT\n\n` +
      `Product: ${order.product_name}\n` +
      `Tracking ID: ${trackingId}\n\n` +
      `This will:\n` +
      `• Update order status to "Out for Delivery"\n` +
      `• Notify buyer that shipment is on the way\n` +
      `• Enable buyer to confirm delivery\n\n` +
      `Proceed with marking as shipped?`
    );

    if (!confirmed) return;

    setProcessingOrderId(order.id);

    try {
      const result = await supabaseService.updateOrderStatus(
        order.id, 
        'shipped', 
        null, 
        null, 
        trackingId
      );

      if (result.success) {
        // Confetti animation
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2874f0', '#34d399', '#6ee7b7']
        });

        toast.success('🚚 Order Marked as Shipped!', {
          description: 'Buyer has been notified - Order is out for delivery',
          duration: 5000
        });

        // Send shipment notification to buyer
        const notificationData = {
          type: 'order_shipped',
          title: '🚚 Order Shipped - Out for Delivery!',
          orderId: order.id,
          productName: order.product_name,
          amount: order.amount,
          trackingId: trackingId,
          message: `Great news! Your order for ${order.product_name} has been shipped and is out for delivery.\n\n📦 Tracking ID: ${trackingId}\n\nYou can confirm delivery once you receive the product.`,
          timestamp: new Date().toISOString(),
          icon: '🚚'
        };

        localStorage.setItem(
          `buyer_notifications_${order.buyer_email}`,
          JSON.stringify(notificationData)
        );

        await loadOrders();
      } else {
        toast.error('Failed to update order');
      }
    } catch (error) {
      console.error('Error marking as shipped:', error);
      toast.error('Failed to mark as shipped');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    // Filter by status
    if (filter !== 'all' && order.status !== filter) return false;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.product_name?.toLowerCase().includes(query) ||
        order.buyer_name?.toLowerCase().includes(query) ||
        order.id?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const getStatusCounts = () => {
    return {
      all: orders.length,
      accepted: orders.filter(o => o.status === 'accepted').length, // Ready to Ship
      shipped: orders.filter(o => o.status === 'shipped').length,   // Out for Delivery
      delivered: orders.filter(o => o.status === 'delivered').length
    };
  };

  const counts = getStatusCounts();

  if (loading) {
    return <ManageOrdersSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Orders</h1>
              <p className="text-gray-600">Track and manage your accepted orders</p>
            </div>
          </div>
          
          <Button
            onClick={loadOrders}
            variant="outline"
            className="hover:bg-gray-100"
          >
            <Package className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="All Orders"
            count={counts.all}
            icon={<Package className="h-6 w-6" />}
            color="blue"
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <StatCard
            label="Ready to Ship"
            count={counts.accepted}
            icon={<Package className="h-6 w-6" />}
            color="green"
            active={filter === 'accepted'}
            onClick={() => setFilter('accepted')}
          />
          <StatCard
            label="Out for Delivery"
            count={counts.shipped}
            icon={<Truck className="h-6 w-6" />}
            color="purple"
            active={filter === 'shipped'}
            onClick={() => setFilter('shipped')}
          />
          <StatCard
            label="Delivered"
            count={counts.delivered}
            icon={<CheckCircle className="h-6 w-6" />}
            color="emerald"
            active={filter === 'delivered'}
            onClick={() => setFilter('delivered')}
          />
        </div>

        {/* Search Bar */}
        <Card className="p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product name, buyer name, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 outline-none text-gray-900"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
              >
                Clear
              </Button>
            )}
          </div>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No orders to manage' : `No ${filter} orders`}
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'Accepted orders will appear here for management'
                : `Orders with status "${filter}" will appear here`}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <OrderManagementCard
                  order={order}
                  onMarkAsShipped={handleMarkAsShipped}
                  isProcessing={processingOrderId === order.id}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 */
function StatCard({ label, count, icon, color, active, onClick }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 border-blue-300',
    yellow: 'bg-yellow-100 text-yellow-600 border-yellow-300',
    green: 'bg-green-100 text-green-600 border-green-300',
    purple: 'bg-purple-100 text-purple-600 border-purple-300',
    emerald: 'bg-emerald-100 text-emerald-600 border-emerald-300'
  };

  return (
    <Card
      className={`p-4 cursor-pointer transition-all duration-300 hover:shadow-lg ${
        active ? `ring-2 ring-[#2874f0] ${colorClasses[color]}` : 'hover:scale-105'
      }`}
      onClick={onClick}
    >
      <div className={`p-2 rounded-lg ${colorClasses[color]} w-fit mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{count}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </Card>
  );
}

/**
 * Order Management Card Component with Stage Progression
 */
function OrderManagementCard({ order, onMarkAsShipped, isProcessing }) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusConfig = (status) => {
    const configs = {
      accepted: { 
        icon: Package, 
        color: 'bg-green-100 text-green-800', 
        label: 'Ready to Ship',
        action: 'ship',
        buttonText: 'Mark as Shipped',
        buttonColor: 'bg-blue-600 hover:bg-blue-700'
      },
      shipped: { 
        icon: Truck, 
        color: 'bg-purple-100 text-purple-800', 
        label: 'Out for Delivery',
        action: null,
        buttonText: null,
        buttonColor: null
      },
      delivered: { 
        icon: CheckCircle, 
        color: 'bg-emerald-100 text-emerald-800', 
        label: 'Delivered',
        action: null,
        buttonText: null,
        buttonColor: null
      }
    };
    return configs[status] || configs.accepted;
  };

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className={`p-6 hover:shadow-lg transition-all duration-300 ${
      isProcessing ? 'ring-2 ring-blue-500 shadow-xl' : ''
    }`}>
      {isProcessing && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-50 rounded-lg flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center space-y-3">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            <p className="text-lg font-semibold text-gray-900">Processing...</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-4 md:space-y-0">
        {/* Left Section */}
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <h3 className="text-lg font-semibold text-gray-900">{order.product_name}</h3>
            <Badge className={statusConfig.color}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-900 mb-1">Order Details</p>
              <p>Order ID: <span className="font-mono text-xs">{order.id.substring(0, 16)}...</span></p>
              <p>Amount: <span className="font-semibold text-gray-900">{order.amount} ETH</span></p>
              <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
            </div>

            <div>
              <p className="font-medium text-gray-900 mb-1">Buyer Information</p>
              <p className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                {order.buyer_name}
              </p>
              {order.shipping_address && (
                <>
                  <p className="flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    {order.shipping_address.phone}
                  </p>
                  <p className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {order.shipping_address.city}, {order.shipping_address.state}
                  </p>
                </>
              )}
            </div>
          </div>

          {order.tracking_id && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">Tracking ID:</p>
              <p className="text-sm font-mono text-blue-600">{order.tracking_id}</p>
            </div>
          )}

          {order.blockchain_tx && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">Blockchain Transaction:</p>
              <p className="text-xs font-mono text-green-600 break-all">{order.blockchain_tx}</p>
            </div>
          )}
        </div>

        {/* Right Section - Actions with Stage Progression */}
        <div className="flex flex-col space-y-2 md:ml-4 min-w-[200px]">
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="outline"
            size="sm"
          >
            {showDetails ? 'Hide' : 'View'} Details
          </Button>

          {/* STAGE PROGRESSION BUTTONS */}
          {statusConfig.action && statusConfig.buttonText && (
            <Button
              onClick={() => {
                if (statusConfig.action === 'ship') {
                  onMarkAsShipped(order);
                }
              }}
              className={`${statusConfig.buttonColor} text-white font-semibold`}
              size="sm"
              disabled={isProcessing}
            >
              {statusConfig.action === 'ship' && <Truck className="h-4 w-4 mr-2" />}
              {statusConfig.buttonText}
            </Button>
          )}

          {/* Status Messages */}
          {order.status === 'accepted' && (
            <div className="text-xs text-center text-green-700 bg-green-50 p-2 rounded border border-green-200">
              ✅ Order accepted - Ready to ship
            </div>
          )}

          {order.status === 'shipped' && (
            <div className="text-xs text-center text-purple-700 bg-purple-50 p-2 rounded border border-purple-200">
              🚚 Waiting for delivery confirmation
            </div>
          )}

          {order.status === 'delivered' && (
            <div className="text-xs text-center text-green-700 bg-green-50 p-2 rounded border border-green-200 font-medium">
              ✅ Order Completed
            </div>
          )}
        </div>
      </div>

      {/* Expandable Details */}
      {showDetails && order.shipping_address && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t"
        >
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
            Complete Shipping Address
          </h4>
          <div className="bg-blue-50 p-4 rounded-lg space-y-1 text-sm">
            <p className="font-semibold text-gray-900">{order.shipping_address.fullName}</p>
            <p className="text-gray-700">{order.shipping_address.phone}</p>
            <p className="text-gray-700">{order.shipping_address.address}</p>
            <p className="text-gray-700">
              {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
            </p>
            {order.shipping_address.landmark && (
              <p className="text-gray-600">Landmark: {order.shipping_address.landmark}</p>
            )}
          </div>
        </motion.div>
      )}
    </Card>
  );
}

/**
 * Loading Skeleton
 */
function ManageOrdersSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid md:grid-cols-5 gap-4 mb-8">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i} className="p-4">
              <Skeleton className="h-12 w-12 rounded-lg mb-3" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>

        <Card className="p-4 mb-6">
          <Skeleton className="h-10 w-full" />
        </Card>

        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6">
              <Skeleton className="h-24 w-full" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
