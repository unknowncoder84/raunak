import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Clock, Truck, CheckCircle, DollarSign, TrendingUp,
  ShoppingBag, ArrowRight, Eye, User, Phone, MapPin, X, Search,
  Filter, RefreshCw, Plus, Settings, BarChart3, AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import supabaseService from '../services/supabaseService';

/**
 * Professional Seller Dashboard
 * Order Phase Management System
 * Inspired by modern e-commerce dashboards
 */
export default function ProfessionalSellerDashboard({ user }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
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
      const data = await supabaseService.getSellerOrders(user.email || user.id);
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Calculate phase counts
  const phaseCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    awaiting_payment: orders.filter(o => o.status === 'approved').length,
    ready_to_ship: orders.filter(o => o.status === 'paid').length,
    out_for_delivery: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length
  };

  // Calculate revenue
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
  const deliveredRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);

  // Filter orders based on selected phase
  const getFilteredOrders = () => {
    let filtered = orders;
    
    // Filter by phase
    if (selectedPhase !== 'all') {
      const phaseMap = {
        'pending': 'pending',
        'awaiting_payment': 'approved',
        'ready_to_ship': 'paid',
        'out_for_delivery': 'shipped',
        'delivered': 'delivered'
      };
      filtered = filtered.filter(o => o.status === phaseMap[selectedPhase]);
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        o.product_name?.toLowerCase().includes(query) ||
        o.buyer_name?.toLowerCase().includes(query) ||
        o.id?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const moveToNextPhase = async (order) => {
    const phaseTransitions = {
      'pending': { next: 'approved', action: 'Accept Order', message: 'Order accepted! Buyer can now make payment.' },
      'approved': { next: 'paid', action: 'Confirm Payment', message: 'Payment confirmed! Order ready to ship.' },
      'paid': { next: 'shipped', action: 'Mark as Shipped', message: 'Order marked as shipped! Out for delivery.' },
      'shipped': { next: 'delivered', action: 'Confirm Delivery', message: 'Order delivered! Payment released.' }
    };

    const transition = phaseTransitions[order.status];
    if (!transition) {
      toast.info('Order is already in final stage');
      return;
    }

    const confirmed = window.confirm(
      `${transition.action}?\n\n` +
      `Product: ${order.product_name}\n` +
      `Amount: ${order.amount} ETH\n` +
      `Buyer: ${order.buyer_name}\n\n` +
      `This will move the order to the next phase.`
    );

    if (!confirmed) return;

    setProcessingOrderId(order.id);

    try {
      let trackingId = null;
      if (order.status === 'paid') {
        trackingId = window.prompt('Enter tracking ID (optional):') || `TRACK-${Date.now()}`;
      }

      const result = await supabaseService.updateOrderStatus(
        order.id,
        transition.next,
        null,
        null,
        trackingId
      );

      if (result.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#6ee7b7']
        });

        toast.success(transition.message, {
          duration: 5000
        });

        // Send notification to buyer
        const notificationData = {
          type: `order_${transition.next}`,
          title: `Order ${transition.next}!`,
          orderId: order.id,
          productName: order.product_name,
          amount: order.amount,
          trackingId: trackingId,
          message: transition.message,
          timestamp: new Date().toISOString()
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
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const filteredOrders = getFilteredOrders();

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Seller Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Track and manage your accepted orders
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={loadOrders}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
              <Button
                onClick={() => navigate('/orders')}
                variant="outline"
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300 flex items-center space-x-2"
              >
                <Package className="h-4 w-4" />
                <span>View All Orders</span>
              </Button>
              <Button
                onClick={() => navigate('/products/manage')}
                className="bg-[#2874f0] hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </Button>
            </div>
          </div>

          {/* Revenue Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Total Revenue</p>
                  <h2 className="text-4xl font-bold">{totalRevenue.toFixed(4)} ETH</h2>
                  <p className="text-blue-100 text-sm mt-1">From {orders.length} orders</p>
                </div>
                <div className="bg-white/20 p-4 rounded-full">
                  <DollarSign className="h-10 w-10" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Delivered Revenue</p>
                  <h2 className="text-4xl font-bold">{deliveredRevenue.toFixed(4)} ETH</h2>
                  <p className="text-green-100 text-sm mt-1">From {phaseCounts.delivered} delivered orders</p>
                </div>
                <div className="bg-white/20 p-4 rounded-full">
                  <CheckCircle className="h-10 w-10" />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Order Phase Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <PhaseCard
            icon={<Package className="h-6 w-6" />}
            label="All Orders"
            count={phaseCounts.all}
            color="blue"
            active={selectedPhase === 'all'}
            onClick={() => setSelectedPhase('all')}
          />
          <PhaseCard
            icon={<Clock className="h-6 w-6" />}
            label="Awaiting Payment"
            count={phaseCounts.awaiting_payment}
            color="yellow"
            active={selectedPhase === 'awaiting_payment'}
            onClick={() => setSelectedPhase('awaiting_payment')}
          />
          <PhaseCard
            icon={<ShoppingBag className="h-6 w-6" />}
            label="Ready to Ship"
            count={phaseCounts.ready_to_ship}
            color="purple"
            active={selectedPhase === 'ready_to_ship'}
            onClick={() => setSelectedPhase('ready_to_ship')}
          />
          <PhaseCard
            icon={<Truck className="h-6 w-6" />}
            label="Out for Delivery"
            count={phaseCounts.out_for_delivery}
            color="indigo"
            active={selectedPhase === 'out_for_delivery'}
            onClick={() => setSelectedPhase('out_for_delivery')}
          />
          <PhaseCard
            icon={<CheckCircle className="h-6 w-6" />}
            label="Delivered"
            count={phaseCounts.delivered}
            color="green"
            active={selectedPhase === 'delivered'}
            onClick={() => setSelectedPhase('delivered')}
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
              {searchQuery ? 'No orders found' : 'No orders in this phase'}
            </h3>
            <p className="text-gray-600">
              {searchQuery 
                ? 'Try adjusting your search query'
                : 'Orders will appear here when customers place orders'}
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
                <OrderCard
                  order={order}
                  onMoveToNext={moveToNextPhase}
                  onViewDetails={setSelectedOrder}
                  isProcessing={processingOrderId === order.id}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onMoveToNext={moveToNextPhase}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Phase Card Component
 */
function PhaseCard({ icon, label, count, color, active, onClick }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100',
    green: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
  };

  const activeClasses = {
    blue: 'ring-2 ring-blue-500 bg-blue-100',
    yellow: 'ring-2 ring-yellow-500 bg-yellow-100',
    purple: 'ring-2 ring-purple-500 bg-purple-100',
    indigo: 'ring-2 ring-indigo-500 bg-indigo-100',
    green: 'ring-2 ring-green-500 bg-green-100'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={`p-4 cursor-pointer transition-all border-2 ${
          active ? activeClasses[color] : colorClasses[color]
        }`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
          {count > 0 && (
            <Badge className={`${colorClasses[color]} font-bold`}>
              {count}
            </Badge>
          )}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{count}</h3>
        <p className="text-sm text-gray-600 font-medium">{label}</p>
      </Card>
    </motion.div>
  );
}

/**
 * Order Card Component
 */
function OrderCard({ order, onMoveToNext, onViewDetails, isProcessing }) {
  const getStatusConfig = (status) => {
    const configs = {
      pending: { 
        label: 'Pending', 
        color: 'bg-yellow-100 text-yellow-800',
        nextAction: 'Accept Order'
      },
      approved: { 
        label: 'Awaiting Payment', 
        color: 'bg-blue-100 text-blue-800',
        nextAction: 'Confirm Payment'
      },
      paid: { 
        label: 'Ready to Ship', 
        color: 'bg-purple-100 text-purple-800',
        nextAction: 'Mark as Shipped'
      },
      shipped: { 
        label: 'Out for Delivery', 
        color: 'bg-indigo-100 text-indigo-800',
        nextAction: 'Waiting for Buyer'
      },
      delivered: { 
        label: 'Delivered', 
        color: 'bg-green-100 text-green-800',
        nextAction: null
      }
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = getStatusConfig(order.status);

  return (
    <Card className={`p-6 hover:shadow-lg transition-all ${
      isProcessing ? 'ring-2 ring-blue-500 shadow-xl' : ''
    }`}>
      {isProcessing && (
        <div className="absolute inset-0 bg-blue-50/50 rounded-lg flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center space-y-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="h-12 w-12 text-blue-600" />
            </motion.div>
            <p className="text-lg font-semibold text-gray-900">Processing...</p>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900">{order.product_name}</h4>
              <p className="text-sm text-gray-600">
                Order ID: {order.id.substring(0, 16)}...
              </p>
            </div>
            <Badge className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Amount</p>
              <p className="font-bold text-lg text-gray-900">{order.amount} ETH</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Buyer</p>
              <p className="font-semibold text-gray-900">{order.buyer_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold text-gray-900">
                {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {order.tracking_id && (
            <div className="p-3 bg-blue-50 rounded-lg mb-4">
              <p className="text-sm font-medium text-gray-900">Tracking ID:</p>
              <p className="text-sm font-mono text-blue-600">{order.tracking_id}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2 ml-4">
          <Button
            onClick={() => onViewDetails(order)}
            variant="outline"
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>

          {statusConfig.nextAction && order.status !== 'shipped' && (
            <Button
              onClick={() => onMoveToNext(order)}
              className="bg-[#2874f0] hover:bg-blue-700"
              size="sm"
              disabled={isProcessing}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              {statusConfig.nextAction}
            </Button>
          )}

          {order.status === 'shipped' && (
            <div className="text-xs text-center text-gray-600 bg-yellow-50 p-2 rounded">
              ⏳ Waiting for buyer to confirm delivery
            </div>
          )}

          {order.status === 'delivered' && (
            <div className="text-xs text-center text-green-600 bg-green-50 p-2 rounded font-medium">
              ✅ Completed
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Order Details Modal
 */
function OrderDetailsModal({ order, onClose, onMoveToNext }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Product Info */}
        <Card className="p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Product Information
          </h3>
          <h4 className="font-bold text-xl text-gray-900 mb-2">{order.product_name}</h4>
          <p className="text-gray-700 mb-4">{order.product_description}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Price</p>
              <p className="font-bold text-lg text-gray-900">{order.amount} ETH</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Quantity</p>
              <p className="font-bold text-lg text-gray-900">{order.quantity || 1}</p>
            </div>
          </div>
        </Card>

        {/* Buyer Info */}
        <Card className="p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
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
        </Card>

        <div className="flex space-x-3">
          <Button 
            onClick={onClose} 
            variant="outline"
            className="flex-1"
          >
            Close
          </Button>
          {order.status !== 'delivered' && order.status !== 'shipped' && (
            <Button 
              onClick={() => {
                onMoveToNext(order);
                onClose();
              }}
              className="flex-1 bg-[#2874f0] hover:bg-blue-700"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Move to Next Phase
            </Button>
          )}
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
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {[1, 2].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
