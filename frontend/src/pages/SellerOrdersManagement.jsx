import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, Clock, Truck, CheckCircle, XCircle, ArrowLeft, 
  Search, Filter, Download, RefreshCw, Check
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import supabaseService from '../services/supabaseService';

/**
 * Comprehensive Seller Orders Management
 * Shows ALL orders with full management capabilities
 */
export default function SellerOrdersManagement({ user }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingOrderId, setProcessingOrderId] = useState(null);

  useEffect(() => {
    loadOrders();
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const sellerId = user.email || user.id;
      const data = await supabaseService.getSellerOrders(sellerId);
      setOrders(data);
      console.log(`📦 Loaded ${data.length} orders for seller`);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (order) => {
    if (!window.confirm(`Accept order for ${order.product_name}?`)) return;
    
    setProcessingOrderId(order.id);
    try {
      const result = await supabaseService.updateOrderStatus(
        order.id,
        'accepted',
        null,
        `0x${Math.random().toString(16).substr(2, 64)}`
      );
      
      if (result.success) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        toast.success('Order Accepted!');
        await loadOrders();
      }
    } catch (error) {
      toast.error('Failed to accept order');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleRejectOrder = async (order) => {
    const reason = window.prompt('Reason for rejection:');
    if (!reason) return;
    
    setProcessingOrderId(order.id);
    try {
      const result = await supabaseService.updateOrderStatus(
        order.id,
        'rejected',
        reason
      );
      
      if (result.success) {
        toast.success('Order Rejected');
        await loadOrders();
      }
    } catch (error) {
      toast.error('Failed to reject order');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleMarkAsShipped = async (order) => {
    const trackingId = window.prompt('Enter tracking ID:') || `TRACK-${Date.now()}`;
    
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
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        toast.success('Order Marked as Shipped!');
        await loadOrders();
      }
    } catch (error) {
      toast.error('Failed to mark as shipped');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter !== 'all' && order.status !== filter) return false;
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

  const stats = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    accepted: orders.filter(o => o.status === 'accepted').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    rejected: orders.filter(o => o.status === 'rejected').length
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/seller/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
              <p className="text-gray-600">Manage all your orders in one place</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={loadOrders} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-6 gap-4 mb-8">
          <StatCard label="All Orders" count={stats.all} color="blue" active={filter === 'all'} onClick={() => setFilter('all')} />
          <StatCard label="Pending" count={stats.pending} color="yellow" active={filter === 'pending'} onClick={() => setFilter('pending')} />
          <StatCard label="Accepted" count={stats.accepted} color="green" active={filter === 'accepted'} onClick={() => setFilter('accepted')} />
          <StatCard label="Shipped" count={stats.shipped} color="purple" active={filter === 'shipped'} onClick={() => setFilter('shipped')} />
          <StatCard label="Delivered" count={stats.delivered} color="emerald" active={filter === 'delivered'} onClick={() => setFilter('delivered')} />
          <StatCard label="Rejected" count={stats.rejected} color="red" active={filter === 'rejected'} onClick={() => setFilter('rejected')} />
        </div>

        {/* Search Bar */}
        <Card className="p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by product, buyer, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            {searchQuery && (
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                Clear
              </Button>
            )}
          </div>
        </Card>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
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
                  onAccept={handleAcceptOrder}
                  onReject={handleRejectOrder}
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

function StatCard({ label, count, color, active, onClick }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <Card
      className={`p-4 cursor-pointer transition-all ${active ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'}`}
      onClick={onClick}
    >
      <p className="text-2xl font-bold text-gray-900">{count}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </Card>
  );
}

function OrderCard({ order, onAccept, onReject, onMarkAsShipped, isProcessing }) {
  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      accepted: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Accepted' },
      shipped: { color: 'bg-purple-100 text-purple-800', icon: Truck, label: 'Shipped' },
      delivered: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle, label: 'Delivered' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' }
    };
    return configs[status] || configs.pending;
  };

  const config = getStatusConfig(order.status);
  const StatusIcon = config.icon;

  return (
    <Card className="p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <h3 className="text-lg font-semibold text-gray-900">{order.product_name}</h3>
            <Badge className={config.color}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {config.label}
            </Badge>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-900">Order ID</p>
              <p className="font-mono text-xs">{order.id.substring(0, 16)}...</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Buyer</p>
              <p>{order.buyer_name || 'Customer'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Amount</p>
              <p className="font-semibold">{order.amount} ETH</p>
            </div>
          </div>

          {order.tracking_id && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">Tracking: {order.tracking_id}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2 ml-4">
          {order.status === 'pending' && (
            <>
              <Button onClick={() => onAccept(order)} className="bg-green-600 hover:bg-green-700" size="sm" disabled={isProcessing}>
                <Check className="h-4 w-4 mr-2" />
                Accept
              </Button>
              <Button onClick={() => onReject(order)} variant="destructive" size="sm" disabled={isProcessing}>
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}
          {order.status === 'accepted' && (
            <Button onClick={() => onMarkAsShipped(order)} className="bg-blue-600 hover:bg-blue-700" size="sm" disabled={isProcessing}>
              <Truck className="h-4 w-4 mr-2" />
              Mark Shipped
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
