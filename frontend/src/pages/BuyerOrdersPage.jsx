import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, Clock, CheckCircle, Truck, XCircle, 
  RefreshCw, Eye, Star, MapPin, AlertTriangle 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import supabaseService from '../services/supabaseService';

export default function BuyerOrdersPage({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancellingOrders, setCancellingOrders] = useState(new Set());

  useEffect(() => {
    if (user) {
      loadOrders();
      
      // Auto-refresh every 10 seconds
      const interval = setInterval(loadOrders, 10000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadOrders = async () => {
    if (!user) {
      console.log('⚠️ No user logged in, cannot load orders');
      return;
    }
    
    console.log('═══════════════════════════════════════════');
    console.log('📦 LOADING BUYER ORDERS');
    console.log('═══════════════════════════════════════════');
    console.log('👤 User Email:', user.email);
    console.log('👤 User ID:', user.id);
    console.log('👤 User Object:', user);
    
    setLoading(true);
    
    // Use user.email as primary identifier
    const userId = user.email || user.id;
    console.log('🔍 Querying orders for:', userId);
    
    const data = await supabaseService.getUserOrders(userId);
    
    console.log('✅ Orders returned:', data.length);
    if (data.length > 0) {
      console.log('📋 Order details:');
      data.forEach((order, index) => {
        console.log(`  ${index + 1}. ${order.product_name} - ${order.status} - ${order.amount} ETH`);
      });
    } else {
      console.log('⚠️ NO ORDERS FOUND!');
      console.log('Possible reasons:');
      console.log('  1. No orders have been placed yet');
      console.log('  2. Orders were placed with different email');
      console.log('  3. localStorage was cleared');
      
      // Check localStorage directly
      const allOrders = JSON.parse(localStorage.getItem('w3mart_orders') || '[]');
      console.log(`📊 Total orders in localStorage: ${allOrders.length}`);
      if (allOrders.length > 0) {
        console.log('📋 All buyer emails in orders:');
        const buyerEmails = [...new Set(allOrders.map(o => o.buyer_email))];
        buyerEmails.forEach(email => {
          const count = allOrders.filter(o => o.buyer_email === email).length;
          console.log(`  - ${email}: ${count} orders`);
        });
      }
    }
    console.log('═══════════════════════════════════════════\n');
    
    setOrders(data || []);
    setLoading(false);
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm(`Are you sure you want to cancel the order for "${order.product_name}"?`)) {
      return;
    }

    setCancellingOrders(prev => new Set([...prev, order.id]));

    try {
      console.log('🚫 Cancelling order:', order.id);
      
      const result = await supabaseService.cancelOrder(order.id, user.email, 'Cancelled by buyer');
      
      if (result.success) {
        toast.success('Order cancelled successfully', {
          description: `Your order for "${order.product_name}" has been cancelled.`
        });
        
        // Reload orders to reflect the change
        await loadOrders();
      } else {
        toast.error('Failed to cancel order', {
          description: result.error || 'Please try again later.'
        });
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order', {
        description: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setCancellingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(order.id);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="h-5 w-5" />,
      accepted: <CheckCircle className="h-5 w-5" />,
      paid: <CheckCircle className="h-5 w-5" />,
      shipped: <Truck className="h-5 w-5" />,
      delivered: <Package className="h-5 w-5" />,
      cancelled: <XCircle className="h-5 w-5" />,
      refunded: <RefreshCw className="h-5 w-5" />
    };
    return icons[status] || <Package className="h-5 w-5" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      accepted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    accepted: orders.filter(o => o.status === 'accepted').length,
    paid: orders.filter(o => o.status === 'paid').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Orders</h1>
            <Button
              onClick={loadOrders}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Status Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'All Orders' },
            { key: 'pending', label: 'Pending' },
            { key: 'accepted', label: 'Accepted' },
            { key: 'paid', label: 'Paid' },
            { key: 'shipped', label: 'Shipped' },
            { key: 'delivered', label: 'Delivered' },
            { key: 'cancelled', label: 'Cancelled' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === key
                  ? 'bg-[#2874f0] text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {label} ({statusCounts[key]})
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2874f0] mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No orders found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all' 
                ? 'You haven\'t placed any orders yet'
                : `No ${filter} orders`}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Product Image */}
                    <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      <img
                        src={order.product_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}
                        alt={order.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Order Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {order.product_name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Order ID: {order.id}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {order.amount || order.total_amount} ETH
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Quantity</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {order.quantity || 1}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Order Date</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Shipping Address */}
                      {order.shipping_address && (
                        <div className="mt-4 flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4 mt-0.5" />
                          <span>
                            {typeof order.shipping_address === 'string' 
                              ? order.shipping_address 
                              : `${order.shipping_address.address}, ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.pincode}`
                            }
                          </span>
                        </div>
                      )}

                      {/* Tracking Number */}
                      {order.tracking_id && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                            Tracking: {order.tracking_id}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                        
                        {/* Cancel Button - Only show for pending orders */}
                        {order.status === 'pending' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleCancelOrder(order)}
                            disabled={cancellingOrders.has(order.id)}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {cancellingOrders.has(order.id) ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4" />
                                Cancel Order
                              </>
                            )}
                          </Button>
                        )}
                        
                        {/* Show cancellation info for cancelled orders */}
                        {order.status === 'cancelled' && (
                          <div className="flex items-center gap-2 text-red-600 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Order Cancelled</span>
                            {order.cancelled_at && (
                              <span className="text-gray-500">
                                on {new Date(order.cancelled_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {order.status === 'delivered' && (
                          <Button size="sm" className="flex items-center gap-2 bg-[#2874f0]">
                            <Star className="h-4 w-4" />
                            Leave Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
