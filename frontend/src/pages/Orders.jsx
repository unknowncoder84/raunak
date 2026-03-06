import { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, Clock, ExternalLink, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import supabaseService from '../services/supabaseService';
import blockchainService from '../services/blockchainService';
import { useNotifications } from '../contexts/NotificationContext';

/**
 * Orders Page with Trust Timeline
 */
export default function Orders({ user, isDemoMode }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadOrders();
    
    // Poll for order updates every 3 seconds
    const interval = setInterval(() => {
      loadOrders();
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const data = await supabaseService.getUserOrders(user.id);
    setOrders(data);
    setLoading(false);
  };

  const handleConfirmDelivery = async (order) => {
    // Confirm action with user
    if (!window.confirm(
      `✅ Confirm Delivery?\n\n` +
      `Order: #${order.id.substring(0, 8)}\n` +
      `Product: ${order.product_name}\n` +
      `Amount: ${order.amount} ETH\n\n` +
      `This will release payment to the seller.`
    )) {
      return;
    }
    
    try {
      // Show processing toast
      const processingToast = toast.loading('Processing payment release...', {
        description: 'Confirming delivery on blockchain'
      });
      
      const result = await blockchainService.confirmDelivery(
        order.blockchain_order_id,
        order.amount,
        order.seller_address
      );
      
      toast.dismiss(processingToast);
      
      if (result.success) {
        // Update order status in database
        await supabaseService.updateOrderStatus(
          order.id,
          'delivered',
          null,
          result.txHash
        );
        
        toast.success('✅ Delivery Confirmed', {
          description: `Payment of ${order.amount} ETH released to seller`,
          duration: 6000,
          action: result.txHash ? {
            label: 'View TX',
            onClick: () => window.open(`https://etherscan.io/tx/${result.txHash}`, '_blank')
          } : undefined
        });
        
        // Send notification to buyer about payment release
        addNotification({
          type: 'payment_released',
          title: '💰 Payment Released',
          message: `Payment of ${order.amount} ETH has been successfully released to the seller for order #${order.id.substring(0, 8)}.`,
          orderId: order.id,
          productName: order.product_name,
          amount: order.amount,
          icon: '💰'
        });
        
        // Send notification to seller about payment received
        const sellerNotificationKey = `seller_notifications_${order.seller_email}`;
        localStorage.setItem(sellerNotificationKey, JSON.stringify({
          type: 'payment_released_seller',
          title: '💰 Payment Received',
          message: `Payment of ${order.amount} ETH has been released for order #${order.id.substring(0, 8)}. Funds are now in your wallet.`,
          orderId: order.id,
          productName: order.product_name,
          amount: order.amount,
          buyerName: user.name || user.email,
          icon: '💰'
        }));
        
        await loadOrders();
      } else {
        toast.error('Action failed', {
          description: result.message || 'Unable to confirm delivery'
        });
      }
    } catch (error) {
      console.error('Confirm delivery error:', error);
      toast.error('Failed to confirm delivery', {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8" data-testid="orders-title">My Orders</h1>

        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600">Start shopping to see your orders here</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onConfirmDelivery={handleConfirmDelivery}
                onViewDetails={setSelectedOrder}
              />
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal with Trust Timeline */}
      {selectedOrder && (
        <TrustTimelineModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)}
          isDemoMode={isDemoMode}
        />
      )}
    </div>
  );
}

function OrderCard({ order, onConfirmDelivery, onViewDetails }) {
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
      case 'pending': return 'Pending Seller Approval';
      case 'paid': return 'Payment Confirmed';
      case 'shipped': return 'Shipped';
      case 'delivered': return 'Delivered';
      case 'rejected': return 'Rejected - Refunded';
      default: return status;
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow" data-testid={`order-card-${order.id}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900" data-testid="order-product-name">
              {order.product_name}
            </h3>
            <Badge className={getStatusColor(order.status)} data-testid="order-status">
              {getStatusIcon(order.status)}
              <span className="ml-1">{getStatusText(order.status)}</span>
            </Badge>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <p>Order ID: <span className="font-mono">{order.id}</span></p>
            <p>Amount: <span className="font-semibold">{order.amount} ETH</span></p>
            <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
            {order.blockchain_verified && (
              <p className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Blockchain Verified
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <Button
            onClick={() => onViewDetails(order)}
            variant="outline"
            size="sm"
            data-testid="view-timeline-btn"
          >
            View Trust Timeline
          </Button>
          
          {order.status === 'shipped' && (
            <Button
              onClick={() => onConfirmDelivery(order)}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
              data-testid="confirm-delivery-btn"
            >
              Confirm Delivery
            </Button>
          )}
          
          {order.blockchain_tx && (
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600"
              onClick={() => window.open(`https://etherscan.io/tx/${order.blockchain_tx}`, '_blank')}
              data-testid="view-blockchain-btn"
            >
              View on Blockchain
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function TrustTimelineModal({ order, onClose, isDemoMode }) {
  const events = isDemoMode ? blockchainService.getMockBlockchainEvents() : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" data-testid="trust-timeline-modal">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Trust Timeline</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              data-testid="close-timeline-btn"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Blockchain-verified order tracking for {order.product_name}
          </p>
        </div>

        {/* Timeline */}
        <div className="p-6">
          <div className="space-y-6">
            {events.map((event, index) => (
              <div key={index} className="trust-timeline-item relative pl-12" data-testid={`timeline-event-${index}`}>
                <div className="absolute left-0 top-0 bg-blue-600 rounded-full p-3">
                  {getEventIcon(event.type)}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{event.type}</h4>
                    <Badge variant="outline" className="text-xs">
                      Block #{event.blockNumber}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{event.details}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(event.timestamp).toLocaleString()}</span>
                    <button
                      className="text-blue-600 hover:underline flex items-center"
                      onClick={() => window.open(`https://etherscan.io/tx/${event.txHash}`, '_blank')}
                    >
                      View TX
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getEventIcon(type) {
  switch (type) {
    case 'OrderCreated':
      return <Package className="h-5 w-5 text-white" />;
    case 'PaymentEscrowed':
      return <Clock className="h-5 w-5 text-white" />;
    case 'OrderShipped':
      return <Truck className="h-5 w-5 text-white" />;
    case 'OrderDelivered':
      return <CheckCircle className="h-5 w-5 text-white" />;
    default:
      return <Package className="h-5 w-5 text-white" />;
  }
}