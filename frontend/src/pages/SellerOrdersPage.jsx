import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, Clock, Truck, CheckCircle, DollarSign, 
  Eye, User, X, RefreshCw, Search, Filter, Phone, MapPin, Plus
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import supabaseService from '../services/supabaseService';

/**
 * Seller Orders Page - Organized by Status
 * Shows orders in 4 categories: Pending, Accepted, Paid, Shipped
 */
export default function SellerOrdersPage({ user }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

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

  // Categorize orders
  const categorizedOrders = {
    pending: orders.filter(o => o.status === 'pending'),
    accepted: orders.filter(o => o.status === 'approved'),
    paid: orders.filter(o => o.status === 'paid'),
    shipped: orders.filter(o => o.status === 'shipped'),
    delivered: orders.filter(o => o.status === 'delivered')
  };

  const handleAcceptOrder = async (order) => {
    const confirmed = window.confirm(
      `Accept Order?\n\n` +
      `Product: ${order.product_name}\n` +
      `Amount: ${order.amount} ETH\n` +
      `Buyer: ${order.buyer_name}\n\n` +
      `This will notify the buyer to make payment.`
    );

    if (!confirmed) return;

    setProcessingOrderId(order.id);

    try {
      const result = await supabaseService.updateOrderStatus(order.id, 'approved');
      
      if (result.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        toast.success('Order Accepted!', {
          description: 'Buyer has been notified to make payment',
          duration: 5000
        });

        // Send notification to buyer
        const notificationData = {
          type: 'order_approved',
          title: '✅ Order Approved!',
          orderId: order.id,
          productName: order.product_name,
          amount: order.amount,
          message: `Your order has been approved! Please proceed with payment.`,
          timestamp: new Date().toISOString()
        };

        localStorage.setItem(
          `buyer_notifications_${order.buyer_email}`,
          JSON.stringify(notificationData)
        );

        await loadOrders();
      } else {
        toast.error('Failed to accept order');
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Failed to accept order');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleMarkAsShipped = async (order) => {
    const trackingId = window.prompt('Enter tracking ID:') || `TRACK-${Date.now()}`;
    
    const confirmed = window.confirm(
      `Mark as Shipped?\n\n` +
      `Product: ${order.product_name}\n` +
      `Tracking ID: ${trackingId}\n\n` +
      `Buyer will be notified.`
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
        toast.success('Order Marked as Shipped!', {
          description: 'Buyer has been notified',
          duration: 5000
        });

        // Send notification to buyer
        const notificationData = {
          type: 'order_shipped',
          title: '🚚 Order Shipped!',
          orderId: order.id,
          productName: order.product_name,
          trackingId: trackingId,
          message: `Your order has been shipped! Tracking ID: ${trackingId}`,
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

  const tabs = [
    { id: 'pending', label: 'Pending Orders', count: categorizedOrders.pending.length, color: 'yellow' },
    { id: 'accepted', label: 'Accepted Orders', count: categorizedOrders.accepted.length, color: 'blue' },
    { id: 'paid', label: 'Paid Orders', count: categorizedOrders.paid.length, color: 'green' },
    { id: 'shipped', label: 'Shipped Orders', count: categorizedOrders.shipped.length, color: 'purple' }
  ];

  const currentOrders = categorizedOrders[selectedTab] || [];

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
                Manage your orders and inventory
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => navigate('/products/manage')} 
                className="bg-green-600 hover:bg-green-700"
              >
                <Package className="h-4 w-4 mr-2" />
                View Inventory
              </Button>
              <Button onClick={loadOrders} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-[#2874f0] to-purple-600 text-white">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              onClick={() => navigate('/products/manage')}
              className="w-full bg-white text-[#2874f0] hover:bg-gray-100 h-14 text-base font-semibold"
            >
              <Package className="h-5 w-5 mr-2" />
              Manage Products
            </Button>
            <Button
              onClick={() => setShowAddProductModal(true)}
              className="w-full bg-white text-green-700 hover:bg-green-50 h-14 text-base font-semibold"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Product
            </Button>
            <Button
              onClick={() => navigate('/reviews')}
              className="w-full bg-white text-purple-700 hover:bg-purple-50 h-14 text-base font-semibold"
            >
              <Eye className="h-5 w-5 mr-2" />
              View Reviews
            </Button>
          </div>
        </Card>

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex space-x-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  selectedTab === tab.id
                    ? 'bg-[#2874f0] text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  selectedTab === tab.id
                    ? 'bg-white text-[#2874f0]'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {currentOrders.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No {selectedTab} orders
              </h3>
              <p className="text-gray-600">
                Orders will appear here when customers place them
              </p>
            </Card>
          ) : (
            currentOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <OrderCard
                  order={order}
                  selectedTab={selectedTab}
                  onAccept={handleAcceptOrder}
                  onMarkAsShipped={handleMarkAsShipped}
                  onViewDetails={setSelectedOrder}
                  isProcessing={processingOrderId === order.id}
                />
              </motion.div>
            ))
          )}
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}

        {/* Add Product Modal */}
        {showAddProductModal && (
          <AddProductModal
            user={user}
            onClose={() => setShowAddProductModal(false)}
            onSuccess={() => {
              setShowAddProductModal(false);
              toast.success('Product added successfully!');
            }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Order Card Component
 */
function OrderCard({ order, selectedTab, onAccept, onMarkAsShipped, onViewDetails, isProcessing }) {
  return (
    <Card className={`p-6 hover:shadow-lg transition-all ${
      isProcessing ? 'ring-2 ring-blue-500 shadow-xl' : ''
    }`}>
      {isProcessing && (
        <div className="absolute inset-0 bg-blue-50/90 rounded-lg flex items-center justify-center z-10">
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
            <div className="p-3 bg-purple-50 rounded-lg mb-4">
              <p className="text-sm font-medium text-gray-900">Tracking ID:</p>
              <p className="text-sm font-mono text-purple-600">{order.tracking_id}</p>
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

          {selectedTab === 'pending' && (
            <Button
              onClick={() => onAccept(order)}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
              disabled={isProcessing}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept Order
            </Button>
          )}

          {selectedTab === 'paid' && (
            <Button
              onClick={() => onMarkAsShipped(order)}
              className="bg-purple-600 hover:bg-purple-700"
              size="sm"
              disabled={isProcessing}
            >
              <Truck className="h-4 w-4 mr-2" />
              Mark as Shipped
            </Button>
          )}

          {selectedTab === 'accepted' && (
            <div className="text-xs text-center text-blue-600 bg-blue-50 p-2 rounded">
              <Clock className="h-4 w-4 inline mr-1" />
              Waiting for payment
            </div>
          )}

          {selectedTab === 'shipped' && (
            <div className="text-xs text-center text-purple-600 bg-purple-50 p-2 rounded">
              <Truck className="h-4 w-4 inline mr-1" />
              Out for delivery
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
function OrderDetailsModal({ order, onClose }) {
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

        <Button onClick={onClose} className="w-full">
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
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4">
        <div className="h-10 bg-gray-200 rounded w-64 mb-6 animate-pulse"></div>
        <div className="flex space-x-2 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded w-40 animate-pulse"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Add Product Modal
 */
function AddProductModal({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: 'Electronics',
    stock: '',
    discount: '0'
  });
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'Electronics', 'Mobiles', 'Fashion', 'Home', 'Books', 
    'Sports', 'Toys', 'Beauty', 'Automotive', 'Grocery'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.stock) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const productData = {
        id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        image: formData.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        category: formData.category,
        discount: parseInt(formData.discount) || 0,
        seller_id: user.id || user.email,
        seller_name: user.name || 'Seller',
        seller_email: user.email,
        stock: parseInt(formData.stock),
        blockchain_verified: true,
        created_at: new Date().toISOString()
      };

      const result = await supabaseService.addProduct(productData);

      if (result.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        onSuccess();
      } else {
        toast.error('Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., iPhone 15 Pro Max"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your product..."
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Price and Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (ETH) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.05"
                step="0.001"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="10"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Category and Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount (%)
              </label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                placeholder="0"
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use default image
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={submitting}
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </div>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
