import { useState, useEffect } from 'react';
import { Package, Clock, Truck, CheckCircle, XCircle, MapPin, Phone, User, Loader2, Sparkles, Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../contexts/NotificationContext';
import SellerProfile from '../components/SellerProfile';
import EscrowHoldModal from '../components/EscrowHoldModal';
import supabaseService from '../services/supabaseService';
import blockchainService from '../services/blockchainService';

/**
 * Enhanced Orders Page with Approval Workflow and Tracking
 */
export default function OrdersEnhanced({ user, isDemoMode }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [escrowOrderData, setEscrowOrderData] = useState(null);
  const { simulateOrderApproval } = useNotifications();
  const [checkingNotifications, setCheckingNotifications] = useState(false);

  useEffect(() => {
    loadOrders();
    // Auto-check for notifications when page loads (for both buyers and sellers)
    checkForApprovals();
  }, []);

  const checkForApprovals = () => {
    setCheckingNotifications(true);
    // The NotificationContext will automatically pick up any pending notifications
    setTimeout(() => {
      setCheckingNotifications(false);
      toast.info('Checked for new notifications', {
        duration: 2000
      });
    }, 1000);
  };

  const loadOrders = async () => {
    setLoading(true);
    const data = user.role === 'seller' 
      ? await supabaseService.getSellerOrders(user.id)
      : await supabaseService.getUserOrders(user.id);
    setOrders(data);
    setLoading(false);
  };

  const handleApproveOrder = async (order) => {
    // Show confirmation dialog with buyer info
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

    // Start processing animation
    setProcessingOrderId(order.id);

    // Simulate processing delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = await supabaseService.updateOrderStatus(order.id, 'approved');
    
    if (result.success) {
      // Trigger confetti animation
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#fbbf24']
      });

      // Show success toast
      toast.success('✅ Order Accepted!', {
        description: '🔔 Buyer has been notified and can now make payment',
        duration: 5000
      });

      // Send notification to buyer (store in localStorage for demo)
      const buyerEmail = order.buyer_email || 'rishi.buyer@blockshop.com';
      
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
      
      // Store notification for buyer to pick up
      localStorage.setItem(`buyer_notifications_${buyerEmail}`, JSON.stringify(notificationData));
      
      console.log('📧 Notification sent to buyer:', buyerEmail);

      // Update orders with animation
      await loadOrders();
      
      // If modal is open, update it
      if (selectedOrder && selectedOrder.id === order.id) {
        const updatedOrders = await (user.role === 'seller' 
          ? supabaseService.getSellerOrders(user.id)
          : supabaseService.getUserOrders(user.id));
        const updatedOrder = updatedOrders.find(o => o.id === order.id);
        if (updatedOrder) {
          setSelectedOrder(updatedOrder);
        }
      }
    } else {
      toast.error('Failed to approve order');
    }

    setProcessingOrderId(null);
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
      `• Process REFUND of ${order.amount} ETH to buyer\n` +
      `• Notify buyer about rejection and refund\n\n` +
      `Continue with rejection?`
    );

    if (!confirmRefund) return;

    setProcessingOrderId(order.id);

    // Show processing toast
    toast.info('Processing rejection and refund...', {
      description: 'Please wait while we process the refund',
      duration: 3000
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Process refund if order was paid
    let refundResult = null;
    if (order.status === 'paid' || order.blockchain_tx) {
      refundResult = await blockchainService.refundOrder(
        order.blockchain_order_id || order.id,
        order.amount,
        order.buyer_wallet || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
      );
    }

    // Update order status to rejected
    const result = await supabaseService.updateOrderStatus(order.id, 'rejected', reason);
    
    if (result.success) {
      toast.error('Order Rejected & Refund Processed', {
        description: refundResult ? `${order.amount} ETH refunded to buyer` : 'Buyer has been notified',
        duration: 5000
      });

      // Send rejection + refund notification to buyer
      const buyerEmail = order.buyer_email || 'rishi.buyer@blockshop.com';
      
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
      
      localStorage.setItem(`buyer_notifications_${buyerEmail}`, JSON.stringify(notificationData));
      console.log('📧 Rejection + Refund notification sent to buyer:', buyerEmail);

      loadOrders();
    } else {
      toast.error('Failed to reject order');
    }

    setProcessingOrderId(null);
  };

  const handleConfirmPayment = async (order) => {
    const confirmed = window.confirm(
      `💳 CONFIRM PAYMENT\n\n` +
      `Product: ${order.product_name}\n` +
      `Amount: ${order.amount} ETH\n\n` +
      `✅ Seller has APPROVED your order!\n\n` +
      `Payment Process:\n` +
      `• ${order.amount} ETH will be deducted from your wallet\n` +
      `• Funds held in ESCROW (smart contract)\n` +
      `• Seller ships the product\n` +
      `• You confirm delivery\n` +
      `• Payment released to seller\n\n` +
      `Proceed with payment?`
    );

    if (!confirmed) return;

    setProcessingOrderId(order.id);

    // Show processing animation
    toast.info('Processing payment...', {
      description: 'Please confirm in MetaMask',
      duration: 3000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate blockchain transaction
    const result = await blockchainService.createOrder(
      order.seller_id,
      order.product_id,
      order.amount
    );

    if (result.success) {
      await supabaseService.updateOrderStatus(order.id, 'paid', null, result.txHash);
      
      // Show Escrow Hold Modal instead of just toast
      setEscrowOrderData({
        ...order,
        txHash: result.txHash
      });
      setShowEscrowModal(true);

      // Send notification to seller about payment
      const sellerEmail = order.seller_email || 'priya.seller@blockshop.com';
      
      const notificationData = {
        type: 'payment_received',
        title: '💰 Payment Received!',
        orderId: order.id,
        productName: order.product_name,
        amount: order.amount,
        buyerName: order.buyer_name || 'Customer',
        txHash: result.txHash,
        message: `Payment of ${order.amount} ETH received for ${order.product_name}. Funds are in escrow. Please ship the order.\n\nTransaction Hash: ${result.txHash}`,
        timestamp: new Date().toISOString(),
        icon: '💰'
      };
      
      localStorage.setItem(`seller_notifications_${sellerEmail}`, JSON.stringify(notificationData));
      console.log('📧 Payment notification sent to seller:', sellerEmail);

      loadOrders();
    } else {
      toast.error('Payment Failed', {
        description: result.message
      });
    }

    setProcessingOrderId(null);
  };

  const handleMarkAsShipped = async (order) => {
    const trackingId = window.prompt('📦 Enter tracking ID (optional):') || `TRACK-${Date.now()}`;
    
    const confirmed = window.confirm(
      `🚚 MARK AS SHIPPED\n\n` +
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

    // Show processing toast
    toast.info('Updating shipment status...', {
      description: 'Notifying buyer',
      duration: 2000
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = await supabaseService.updateOrderStatus(order.id, 'shipped', null, null, trackingId);
    
    if (result.success) {
      toast.success('🚚 Order Marked as Shipped!', {
        description: 'Buyer has been notified - Order is out for delivery',
        duration: 5000
      });

      // Send shipment notification to buyer
      const buyerEmail = order.buyer_email || 'rishi.buyer@blockshop.com';
      
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
      
      localStorage.setItem(`buyer_notifications_${buyerEmail}`, JSON.stringify(notificationData));
      console.log('📧 Shipment notification sent to buyer:', buyerEmail);

      loadOrders();
    } else {
      toast.error('Failed to update order');
    }

    setProcessingOrderId(null);
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

    // Show processing toast
    toast.info('Confirming delivery...', {
      description: 'Releasing payment to seller',
      duration: 3000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = await blockchainService.confirmDelivery(order.blockchain_order_id);
    
    if (result.success) {
      await supabaseService.updateOrderStatus(order.id, 'delivered');
      
      // Confetti for successful delivery
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

      // Send "Order Collected" notification to buyer
      const buyerEmail = order.buyer_email || 'rishi.buyer@blockshop.com';
      
      const buyerNotificationData = {
        type: 'order_collected',
        title: '🎉 Order Collected - Thank you!',
        orderId: order.id,
        productName: order.product_name,
        amount: order.amount,
        txHash: result.txHash,
        message: `Thank you for confirming delivery of ${order.product_name}!\n\n✅ Payment of ${order.amount} ETH has been released from escrow to the seller.\n\n🙏 Thank you for using BlockShop!\n\nTransaction Hash: ${result.txHash}`,
        timestamp: new Date().toISOString(),
        icon: '🎉'
      };
      
      localStorage.setItem(`buyer_notifications_${buyerEmail}`, JSON.stringify(buyerNotificationData));
      console.log('📧 Order collected notification sent to buyer:', buyerEmail);

      // Send "Product Delivered! Payment Released" notification to seller
      const sellerEmail = order.seller_email || 'priya.seller@blockshop.com';
      
      const sellerNotificationData = {
        type: 'product_delivered_payment_released',
        title: '🎉 Product Delivered! Payment Released',
        orderId: order.id,
        productName: order.product_name,
        amount: order.amount,
        buyerName: order.buyer_name || 'Customer',
        txHash: result.txHash,
        message: `Excellent news! Buyer confirmed delivery of ${order.product_name}.\n\n💰 Payment of ${order.amount} ETH has been released to your wallet.\n\n✅ Transaction Complete!\n\nTransaction Hash: ${result.txHash}`,
        timestamp: new Date().toISOString(),
        icon: '💰'
      };
      
      localStorage.setItem(`seller_notifications_${sellerEmail}`, JSON.stringify(sellerNotificationData));
      console.log('📧 Payment released notification sent to seller:', sellerEmail);

      loadOrders();
    } else {
      toast.error('Failed to confirm delivery', {
        description: result.message
      });
    }

    setProcessingOrderId(null);
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {user.role === 'seller' ? 'Customer Orders' : 'My Orders'}
          </h1>
          
          {/* Check for Notifications Button (Both Buyers and Sellers) */}
          <Button
            onClick={checkForApprovals}
            disabled={checkingNotifications}
            className={`${
              user.role === 'seller' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white transform hover:scale-105 transition-transform`}
          >
            {checkingNotifications ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                {user.role === 'seller' ? 'Check New Orders' : 'Check for Approvals'}
              </>
            )}
          </Button>
        </div>

        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600">
              {user.role === 'seller' 
                ? 'Orders will appear here when customers place orders'
                : 'Start shopping to see your orders here'}
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                userRole={user.role}
                onApprove={handleApproveOrder}
                onReject={handleRejectOrder}
                onConfirmPayment={handleConfirmPayment}
                onMarkAsShipped={handleMarkAsShipped}
                onConfirmDelivery={handleConfirmDelivery}
                onViewDetails={setSelectedOrder}
                isProcessing={processingOrderId === order.id}
              />
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}

        {/* Escrow Hold Modal */}
        <EscrowHoldModal
          isOpen={showEscrowModal}
          onClose={() => {
            setShowEscrowModal(false);
            setEscrowOrderData(null);
          }}
          orderData={escrowOrderData}
        />
      </div>
    </div>
  );
}

function OrderCard({ order, userRole, onApprove, onReject, onConfirmPayment, onMarkAsShipped, onConfirmDelivery, onViewDetails, isProcessing }) {
  const getStatusConfig = (status) => {
    const configs = {
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending Approval' },
      approved: { icon: CheckCircle, color: 'bg-blue-100 text-blue-800', label: 'Seller is Preparing Your Order' },
      paid: { icon: Package, color: 'bg-purple-100 text-purple-800', label: 'Paid - Ready to Ship' },
      shipped: { icon: Truck, color: 'bg-indigo-100 text-indigo-800', label: 'Out for Delivery 🚚' },
      delivered: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Delivered' },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Rejected' }
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className={`p-6 hover:shadow-lg transition-all duration-300 ${isProcessing ? 'ring-2 ring-green-500 shadow-xl scale-105' : ''}`}>
      {isProcessing && (
        <div className="absolute inset-0 bg-green-50 bg-opacity-50 rounded-lg flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center space-y-3">
            <Loader2 className="h-12 w-12 text-green-600 animate-spin" />
            <p className="text-lg font-semibold text-gray-900">Processing Order...</p>
            <p className="text-sm text-gray-600">Notifying buyer</p>
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

          <div className="space-y-2 text-sm text-gray-600">
            <p>Order ID: <span className="font-mono">{order.id.substring(0, 16)}...</span></p>
            <p>Amount: <span className="font-semibold text-gray-900">{order.amount} ETH</span></p>
            <p>Date: {new Date(order.created_at).toLocaleString()}</p>
            {userRole === 'seller' && order.buyer_name && (
              <p>Buyer: <span className="font-semibold text-gray-900">{order.buyer_name}</span></p>
            )}
            {order.blockchain_tx && (
              <p className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Blockchain Verified
              </p>
            )}
            {order.tracking_id && (
              <p>Tracking ID: <span className="font-mono">{order.tracking_id}</span></p>
            )}
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex flex-col space-y-2 md:ml-4">
          {/* Seller Actions */}
          {userRole === 'seller' && (
            <>
              {order.status === 'pending' && (
                <>
                  <Button
                    onClick={() => onViewDetails(order)}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                    disabled={isProcessing}
                  >
                    📋 View Order Details
                  </Button>
                  <Button
                    onClick={() => onApprove(order)}
                    className="bg-green-600 hover:bg-green-700 relative"
                    size="sm"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Accept Order
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => onReject(order)}
                    variant="destructive"
                    size="sm"
                    disabled={isProcessing}
                  >
                    ❌ Reject Order
                  </Button>
                </>
              )}
              {order.status === 'approved' && (
                <Button
                  onClick={() => onViewDetails(order)}
                  variant="outline"
                  size="sm"
                >
                  View Details
                </Button>
              )}
              {order.status === 'paid' && (
                <>
                  <Button
                    onClick={() => onViewDetails(order)}
                    variant="outline"
                    size="sm"
                  >
                    View Details
                  </Button>
                  <Button
                    onClick={() => onMarkAsShipped(order)}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Mark as Shipped
                  </Button>
                </>
              )}
              {(order.status === 'shipped' || order.status === 'delivered') && (
                <Button
                  onClick={() => onViewDetails(order)}
                  variant="outline"
                  size="sm"
                >
                  View Details
                </Button>
              )}
            </>
          )}

          {/* Buyer Actions */}
          {userRole === 'buyer' && (
            <>
              <Button
                onClick={() => onViewDetails(order)}
                variant="outline"
                size="sm"
              >
                View Details
              </Button>
              {order.status === 'approved' && (
                <Button
                  onClick={() => onConfirmPayment(order)}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  💳 Pay Now
                </Button>
              )}
              {/* CRITICAL: Only show Confirm Delivery button when status is 'shipped' */}
              {order.status === 'shipped' && (
                <Button
                  onClick={() => onConfirmDelivery(order)}
                  className="bg-green-600 hover:bg-green-700 animate-pulse"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Delivery
                </Button>
              )}
              {/* Show status message for other states */}
              {order.status === 'paid' && (
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <Truck className="h-4 w-4 inline mr-2 text-blue-600" />
                  Waiting for seller to ship
                </div>
              )}
              {order.status === 'delivered' && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg font-medium">
                  <CheckCircle className="h-4 w-4 inline mr-2" />
                  Order Completed
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function OrderDetailsModal({ order, onClose }) {
  const [showSellerProfile, setShowSellerProfile] = useState(false);

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ✕
            </button>
          </div>

          {/* Order Status */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Order Status</h3>
            <p className="text-lg font-medium text-blue-600 capitalize">{order.status}</p>
            <p className="text-sm text-gray-600 mt-1">
              Order ID: <span className="font-mono">{order.id}</span>
            </p>
          </div>

          {/* Product Information */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Product Information
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-lg text-gray-900 mb-2">{order.product_name}</h4>
              {order.product_description && (
                <p className="text-gray-700 mb-3">{order.product_description}</p>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Price</p>
                  <p className="font-semibold text-gray-900">{order.amount} ETH</p>
                </div>
                <div>
                  <p className="text-gray-600">Quantity</p>
                  <p className="font-semibold text-gray-900">{order.quantity || 1}</p>
                </div>
                <div>
                  <p className="text-gray-600">Category</p>
                  <p className="font-semibold text-gray-900">{order.product_category || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Order Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Seller Information - Clickable */}
          {order.seller_name && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Seller Information
              </h3>
              <div 
                className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                onClick={() => setShowSellerProfile(true)}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-600" />
                      <span className="font-semibold text-blue-600 hover:text-blue-700">{order.seller_name}</span>
                    </div>
                    {order.seller_email && (
                      <p className="text-gray-700">Email: {order.seller_email}</p>
                    )}
                  </div>
                  <span className="text-xs text-blue-600 font-medium">View Profile →</span>
                </div>
              </div>
            </div>
          )}

          {/* Buyer Information (Seller View) */}
          {order.buyer_name && !order.seller_name && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Buyer Information
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="font-semibold text-gray-900">{order.buyer_name}</span>
                </div>
                {order.buyer_email && (
                  <p className="text-gray-700">Email: {order.buyer_email}</p>
                )}
                {order.buyer_phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-600" />
                    <span className="text-gray-700">{order.buyer_phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Shipping Address
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <p className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="font-semibold">{order.shipping_address.fullName}</span>
                </p>
                <p className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-600" />
                  {order.shipping_address.phone}
                </p>
                <p className="text-gray-700">
                  {order.shipping_address.address}
                </p>
                <p className="text-gray-700">
                  {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                </p>
                {order.shipping_address.landmark && (
                  <p className="text-gray-600">Landmark: {order.shipping_address.landmark}</p>
                )}
              </div>
            </div>
          )}

          {/* Payment Information */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Payment Information
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium">Blockchain ({order.blockchain_network || 'Ethereum'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-gray-900">{order.amount} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status:</span>
                <span className={`font-medium ${order.blockchain_tx ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.blockchain_tx ? 'Paid (In Escrow)' : 'Pending'}
                </span>
              </div>
              {order.blockchain_tx && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-gray-600 mb-1">Transaction Hash:</p>
                  <p className="font-mono text-xs break-all text-gray-700">
                    {order.blockchain_tx}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Timeline */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Order Timeline
            </h3>
            <div className="space-y-4">
              <TimelineItem
                icon={<Package />}
                title="Order Placed"
                time={new Date(order.created_at).toLocaleString()}
                completed={true}
                isActive={false}
              />
              <TimelineItem
                icon={<CheckCircle />}
                title="Seller Approval"
                time={order.status !== 'pending' ? `Approved on ${new Date(order.updated_at || order.created_at).toLocaleString()}` : 'Waiting for seller approval'}
                completed={order.status !== 'pending' && order.status !== 'rejected'}
                isActive={order.status === 'pending'}
              />
              <TimelineItem
                icon={<CheckCircle />}
                title="Payment Confirmed"
                time={order.blockchain_tx ? `Payment received (In Escrow) - ${new Date(order.payment_date || order.updated_at).toLocaleString()}` : 'Awaiting payment'}
                completed={!!order.blockchain_tx}
                isActive={order.status === 'approved'}
              />
              <TimelineItem
                icon={<Truck />}
                title="Shipped"
                time={order.tracking_id ? `Tracking: ${order.tracking_id} - Shipped on ${new Date(order.shipped_date || order.updated_at).toLocaleString()}` : 'Not shipped yet'}
                completed={order.status === 'shipped' || order.status === 'delivered'}
                isActive={order.status === 'paid'}
              />
              <TimelineItem
                icon={<CheckCircle />}
                title="Delivered"
                time={order.status === 'delivered' ? `Delivered & Payment Released - ${new Date(order.delivered_date || order.updated_at).toLocaleString()}` : 'In transit'}
                completed={order.status === 'delivered'}
                isActive={order.status === 'shipped'}
              />
            </div>
          </div>

          {/* Close Button */}
          <div className="mt-6 pt-6 border-t">
            <Button
              onClick={onClose}
              className="w-full bg-gray-600 hover:bg-gray-700"
            >
              Close
            </Button>
          </div>
        </div>
      </Card>
    </div>

      {/* Seller Profile Modal */}
      {showSellerProfile && order.seller_id && (
        <SellerProfile
          sellerId={order.seller_id}
          sellerName={order.seller_name}
          onClose={() => setShowSellerProfile(false)}
        />
      )}
    </>
  );
}

function TimelineItem({ icon, title, time, completed, isActive }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex items-start space-x-3 transition-all duration-500 ${isActive ? 'scale-105' : ''}`}
    >
      <motion.div 
        animate={isActive ? { 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        } : {}}
        transition={{ 
          duration: 2,
          repeat: isActive ? Infinity : 0,
          repeatType: "reverse"
        }}
        className={`relative p-2 rounded-full transition-all duration-500 ${
          completed 
            ? 'bg-green-100 text-green-600 shadow-lg' 
            : isActive 
            ? 'bg-blue-100 text-blue-600 animate-pulse' 
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        {icon}
        {completed && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5"
          >
            <CheckCircle className="h-3 w-3 text-white" />
          </motion.div>
        )}
        {isActive && (
          <div className="absolute -top-1 -right-1">
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          </div>
        )}
      </motion.div>
      <div className="flex-1">
        <motion.p 
          animate={isActive ? { x: [0, 5, 0] } : {}}
          transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
          className={`font-medium transition-colors duration-300 ${
            completed 
              ? 'text-gray-900' 
              : isActive 
              ? 'text-blue-600 font-semibold' 
              : 'text-gray-500'
          }`}
        >
          {title}
          {isActive && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-2 text-xs text-blue-500"
            >
              (Current Step)
            </motion.span>
          )}
        </motion.p>
        <p className={`text-sm transition-colors duration-300 ${
          completed 
            ? 'text-gray-700' 
            : isActive 
            ? 'text-blue-600' 
            : 'text-gray-500'
        }`}>
          {time}
        </p>
      </div>
    </motion.div>
  );
}
