import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Package, TrendingUp, Users, Clock, CheckCircle, Truck, Check, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import supabaseService from '../services/supabaseService';
import blockchainService from '../services/blockchainService';
import { useNotifications } from '../contexts/NotificationContext';

/**
 * Seller Dashboard - Personalized seller experience
 */
export default function SellerDashboard({ user, isDemoMode }) {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadSellerData();
    
    // Poll for new orders every 3 seconds
    const interval = setInterval(() => {
      loadSellerData();
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const loadSellerData = async () => {
    console.log('═══════════════════════════════════════════');
    console.log('🏪 LOADING SELLER ORDERS');
    console.log('═══════════════════════════════════════════');
    console.log('👤 Seller Email:', user.email);
    console.log('👤 Seller ID:', user.id);
    console.log('👤 User Object:', user);
    
    setLoading(true);
    
    // Get seller orders using seller email
    const sellerId = user.email || user.id;
    console.log('🔍 Querying orders for seller:', sellerId);
    
    const orderData = await supabaseService.getSellerOrders(sellerId);
    
    console.log('✅ Orders returned:', orderData.length);
    if (orderData.length > 0) {
      console.log('📋 Order details:');
      orderData.forEach((order, index) => {
        console.log(`  ${index + 1}. ${order.product_name} - Buyer: ${order.buyer_email} - ${order.status} - ${order.amount} ETH`);
      });
    } else {
      console.log('⚠️ NO ORDERS FOUND FOR THIS SELLER!');
      console.log('Possible reasons:');
      console.log('  1. No orders have been placed yet');
      console.log('  2. Orders were placed for different seller');
      console.log('  3. localStorage was cleared');
      
      // Check localStorage directly
      const allOrders = JSON.parse(localStorage.getItem('w3mart_orders') || '[]');
      console.log(`📊 Total orders in localStorage: ${allOrders.length}`);
      if (allOrders.length > 0) {
        console.log('📋 All seller emails in orders:');
        const sellerEmails = [...new Set(allOrders.map(o => o.seller_email))];
        sellerEmails.forEach(email => {
          const count = allOrders.filter(o => o.seller_email === email).length;
          console.log(`  - ${email}: ${count} orders`);
        });
      }
    }
    console.log('═══════════════════════════════════════════\n');
    
    setOrders(orderData.slice(0, 5)); // Latest 5 orders
    
    // Calculate stats
    const totalSales = orderData.length;
    const pendingOrders = orderData.filter(o => o.status === 'pending').length;
    const completedOrders = orderData.filter(o => o.status === 'delivered').length;
    const totalRevenue = orderData.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
    const totalEarnings = orderData
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
    
    setStats({ totalSales, pendingOrders, completedOrders, totalRevenue, totalEarnings });
    setLoading(false);
  };

  const handleAcceptOrder = async (order) => {
    const confirmed = window.confirm(
      `✅ ACCEPT ORDER?\n\n` +
      `Product: ${order.product_name}\n` +
      `Amount: ${order.amount} ETH\n` +
      `Buyer: ${order.buyer_name || 'Customer'}\n\n` +
      `This will:\n` +
      `• Move order to "Ready to Ship" status\n` +
      `• Notify buyer that order is accepted\n` +
      `• Add product to your inventory\n\n` +
      `Accept this order?`
    );

    if (!confirmed) return;

    try {
      // Update order status to 'accepted' (Ready to Ship)
      const result = await supabaseService.updateOrderStatus(
        order.id,
        'accepted',
        null,
        `0x${Math.random().toString(16).substr(2, 64)}` // Mock blockchain tx
      );
      
      if (result.success) {
        // Add product to seller's inventory
        const productData = {
          id: order.product_id || `prod-${Date.now()}`,
          name: order.product_name,
          description: order.product_description || `Product from order #${order.id.substring(0, 8)}`,
          price: parseFloat(order.amount),
          image: order.product_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
          category: order.category || 'General',
          discount: 0,
          seller_id: order.seller_id || user.email || user.id,
          seller_name: order.seller_name || user.storeName || user.name,
          seller_email: order.seller_email || user.email,
          stock: order.quantity || 1,
          blockchain_verified: true,
          from_order: true,
          order_id: order.id,
          created_at: new Date().toISOString()
        };
        
        await supabaseService.addProduct(productData);
        
        toast.success('✅ Order Accepted!', {
          description: `Order moved to "Ready to Ship" - Buyer has been notified`,
          duration: 5000
        });
        
        // Send real-time notification to buyer
        const buyerNotificationKey = `buyer_notifications_${order.buyer_email}`;
        localStorage.setItem(buyerNotificationKey, JSON.stringify({
          type: 'order_accepted',
          title: '✅ Order Accepted - Ready to Ship!',
          message: `Great news! Your order #${order.id.substring(0, 8)} for ${order.product_name} has been accepted by the seller.\n\nThe seller will ship your order soon.`,
          orderId: order.id,
          productName: order.product_name,
          amount: order.amount,
          timestamp: new Date().toISOString(),
          icon: '✅'
        }));
        
        // Reload data to reflect changes
        await loadSellerData();
      } else {
        toast.error('Action failed', {
          description: result.message || 'Failed to accept order'
        });
      }
    } catch (error) {
      console.error('Accept order error:', error);
      toast.error('Failed to accept order', {
        description: error.message || 'Please try again'
      });
    }
  };

  const handleRejectOrder = async (order) => {
    // Confirm rejection with clear warning
    if (!window.confirm(
      `⚠️ Reject Order #${order.id.substring(0, 8)}?\n\n` +
      `Product: ${order.product_name}\n` +
      `Amount: ${order.amount} ETH\n\n` +
      `The buyer will receive a full refund to their wallet.`
    )) {
      return;
    }
    
    try {
      // Show processing toast
      const processingToast = toast.loading('Processing refund...', {
        description: 'Initiating blockchain transaction'
      });
      
      // Call blockchain refund function
      const result = await blockchainService.refundOrder(
        order.blockchain_order_id,
        order.amount,
        order.buyer_address
      );
      
      toast.dismiss(processingToast);
      
      if (result.success) {
        // Update order status to 'rejected'
        await supabaseService.updateOrderStatus(
          order.id,
          'rejected',
          'Rejected by seller - Refund processed',
          result.txHash
        );
        
        toast.success('💰 Refund Processed', {
          description: `${order.amount} ETH refunded to buyer's wallet`,
          duration: 6000,
          action: result.txHash ? {
            label: 'View TX',
            onClick: () => window.open(`https://etherscan.io/tx/${result.txHash}`, '_blank')
          } : undefined
        });
        
        // Send real-time notification to buyer about refund
        const buyerNotificationKey = `buyer_notifications_${order.buyer_email}`;
        localStorage.setItem(buyerNotificationKey, JSON.stringify({
          type: 'order_rejected_refund',
          title: '💰 Order Rejected - Refund Processed',
          message: `Order #${order.id.substring(0, 8)} rejected. Refund of ${order.amount} ETH has been processed to your wallet.`,
          orderId: order.id,
          productName: order.product_name,
          amount: order.amount,
          txHash: result.txHash,
          icon: '💰'
        }));
        
        // Reload data to reflect changes
        await loadSellerData();
      } else {
        toast.error('Refund Failed', {
          description: result.message || 'Unable to process refund'
        });
      }
    } catch (error) {
      console.error('Reject order error:', error);
      toast.error('Failed to reject order', {
        description: error.message || 'Please try again'
      });
    }
  };

  const handleMarkAsShipped = async (order) => {
    try {
      const result = await blockchainService.markAsShipped(order.blockchain_order_id);
      
      if (result.success) {
        await supabaseService.updateOrderStatus(
          order.id,
          'shipped',
          null,
          result.txHash
        );
        
        toast.success('🚚 Order Shipped', {
          description: `Order #${order.id.substring(0, 8)} marked as shipped`,
          duration: 5000
        });
        
        // Send real-time notification to buyer
        const buyerNotificationKey = `buyer_notifications_${order.buyer_email}`;
        localStorage.setItem(buyerNotificationKey, JSON.stringify({
          type: 'order_shipped',
          title: '🚚 Order Shipped!',
          message: `Your order #${order.id.substring(0, 8)} for ${order.product_name} has been shipped and is on its way.`,
          orderId: order.id,
          productName: order.product_name,
          amount: order.amount,
          icon: '🚚'
        }));
        
        await loadSellerData();
      } else {
        toast.error('Action failed', {
          description: result.message
        });
      }
    } catch (error) {
      console.error('Mark shipped error:', error);
      toast.error('Failed to mark as shipped', {
        description: error.message || 'Please try again'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user.storeName || 'Seller'} Dashboard 🏪
          </h1>
          <p className="text-gray-600">
            Manage your orders and track your sales performance
          </p>
        </div>

        {/* Total Earnings Highlight */}
        <Card className="p-8 mb-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-2">💰 Total Earnings (Delivered Orders)</p>
              <h2 className="text-5xl font-bold mb-2">{stats.totalEarnings.toFixed(4)} ETH</h2>
              <p className="text-green-100 text-sm">
                From {stats.completedOrders} completed orders
              </p>
            </div>
            <div className="bg-white/20 p-6 rounded-full">
              <DollarSign className="h-16 w-16" />
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<DollarSign className="h-8 w-8" />}
            title="Total Revenue"
            value={`${stats.totalRevenue.toFixed(3)} ETH`}
            color="green"
          />
          <StatCard
            icon={<Package className="h-8 w-8" />}
            title="Total Sales"
            value={stats.totalSales}
            color="blue"
          />
          <StatCard
            icon={<Clock className="h-8 w-8" />}
            title="Pending Orders"
            value={stats.pendingOrders}
            color="yellow"
          />
          <StatCard
            icon={<CheckCircle className="h-8 w-8" />}
            title="Completed"
            value={stats.completedOrders}
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-green-500 to-teal-600 text-white">
          <h2 className="text-2xl font-bold mb-4">Seller Actions</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Link to="/seller/orders/manage">
              <Button className="w-full bg-white text-green-600 hover:bg-gray-100">
                <Package className="h-4 w-4 mr-2" />
                Manage Orders
              </Button>
            </Link>
            <Link to="/seller/inventory">
              <Button className="w-full bg-white text-green-600 hover:bg-gray-100">
                <TrendingUp className="h-4 w-4 mr-2" />
                Manage Products
              </Button>
            </Link>
            <Link to="/seller/reviews/manage">
              <Button className="w-full bg-white text-green-600 hover:bg-gray-100">
                <Users className="h-4 w-4 mr-2" />
                View Reviews
              </Button>
            </Link>
            <Link to="/seller/analytics">
              <Button className="w-full bg-white text-green-600 hover:bg-gray-100">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </Link>
          </div>
        </Card>

        {/* Pending Orders - Awaiting Seller Approval */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Pending Orders - Awaiting Your Approval</h2>
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              {stats.pendingOrders} Pending
            </Badge>
          </div>

          {orders.filter(o => o.status === 'pending').length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">No pending orders. All orders have been processed!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.filter(o => o.status === 'pending').map(order => (
                <PendingOrderCard 
                  key={order.id} 
                  order={order}
                  onAccept={handleAcceptOrder}
                  onReject={handleRejectOrder}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Accepted Orders - Ready to Ship */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Accepted Orders - Ready to Ship</h2>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              {orders.filter(o => o.status === 'accepted').length} Ready
            </Badge>
          </div>

          {orders.filter(o => o.status === 'accepted').length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No orders ready to ship</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.filter(o => o.status === 'accepted').map(order => (
                <SellerOrderCard 
                  key={order.id} 
                  order={order}
                  onMarkAsShipped={handleMarkAsShipped}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Recent Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
            <Link to="/orders">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600">Orders will appear here when customers purchase your products</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </Card>

        {/* Seller Tips */}
        <Card className="mt-8 p-6 bg-gradient-to-br from-yellow-50 to-green-50">
          <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Seller Tips</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Tip
              icon="📦"
              title="Ship Promptly"
              description="Mark orders as shipped quickly to maintain good ratings"
            />
            <Tip
              icon="💰"
              title="Escrow Payment"
              description="Payment released automatically after delivery confirmation"
            />
            <Tip
              icon="⭐"
              title="Quality Service"
              description="Provide excellent service for blockchain-verified reviews"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className={`p-3 rounded-lg ${colorClasses[color]} w-fit mb-4`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
    </Card>
  );
}

function PendingOrderCard({ order, onAccept, onReject }) {
  return (
    <div className="flex items-center justify-between p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <Clock className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{order.product_name}</h4>
          <p className="text-sm text-gray-600">
            Order #{order.id.substring(0, 8)} • {order.amount} ETH
          </p>
          <p className="text-xs text-gray-500">
            From: {order.buyer_name || 'Customer'} • {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button
          onClick={() => onAccept(order)}
          className="bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <Check className="h-4 w-4 mr-2" />
          Accept Order
        </Button>
        <Button
          onClick={() => onReject(order)}
          variant="destructive"
          size="sm"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Reject Order
        </Button>
      </div>
    </div>
  );
}

function SellerOrderCard({ order, onMarkAsShipped }) {
  return (
    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <Package className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{order.product_name}</h4>
          <p className="text-sm text-gray-600">
            Order #{order.id.substring(0, 8)} • {order.amount} ETH
          </p>
          <p className="text-xs text-gray-500">
            {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <Button
        onClick={() => onMarkAsShipped(order)}
        className="bg-green-600 hover:bg-green-700"
        size="sm"
      >
        <Truck className="h-4 w-4 mr-2" />
        Mark as Shipped
      </Button>
    </div>
  );
}

function OrderCard({ order }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5" />;
      case 'paid': return <CheckCircle className="h-5 w-5" />;
      case 'shipped': return <Truck className="h-5 w-5" />;
      case 'delivered': return <CheckCircle className="h-5 w-5" />;
      case 'rejected': return <XCircle className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending Approval';
      case 'accepted': return 'Ready to Ship';
      case 'shipped': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'rejected': return 'Rejected';
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
        </div>
      </div>
      <Badge className={getStatusColor(order.status)}>
        {getStatusIcon(order.status)}
        <span className="ml-1">{getStatusText(order.status)}</span>
      </Badge>
    </div>
  );
}

function Tip({ icon, title, description }) {
  return (
    <div className="text-center">
      <div className="text-4xl mb-2">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
