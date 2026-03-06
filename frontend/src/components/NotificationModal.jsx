import { X, CheckCircle, Package, Truck, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

/**
 * Notification Modal - Shows order approval notifications to buyers
 */
export default function NotificationModal({ notification, onClose, onMarkAsRead }) {
  const navigate = useNavigate();

  if (!notification) return null;

  const handleViewOrder = () => {
    if (notification.orderId) {
      onMarkAsRead(notification.id);
      navigate('/orders');
      onClose();
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'order_approved':
        return <CheckCircle className="h-12 w-12 text-green-500 animate-bounce-slow" />;
      case 'order_rejected':
        return <X className="h-12 w-12 text-red-500 animate-pulse" />;
      case 'new_order':
        return <Package className="h-12 w-12 text-blue-500 animate-bounce-slow" />;
      case 'payment_received':
        return <CheckCircle className="h-12 w-12 text-green-500 animate-bounce-slow" />;
      case 'order_shipped':
        return <Truck className="h-12 w-12 text-blue-500 animate-bounce-slow" />;
      case 'order_delivered':
        return <Package className="h-12 w-12 text-purple-500 animate-bounce-slow" />;
      default:
        return <Bell className="h-12 w-12 text-gray-500" />;
    }
  };

  const getHeaderColor = () => {
    switch (notification.type) {
      case 'order_rejected':
        return 'from-red-500 to-red-600';
      case 'new_order':
        return 'from-blue-500 to-blue-600';
      case 'payment_received':
        return 'from-green-500 to-emerald-600';
      default:
        return 'from-green-500 to-emerald-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
      <Card className="w-full max-w-md bg-white rounded-xl shadow-2xl animate-scale-in md:max-w-md sm:max-w-full sm:h-auto md:h-auto overflow-y-auto max-h-[95vh]">
        {/* Header */}
        <div className={`relative bg-gradient-to-r ${getHeaderColor()} text-white p-6 rounded-t-xl`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-full">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">New Notification</h2>
              <p className="text-sm text-green-100">
                {new Date(notification.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="bg-green-50 p-4 rounded-full animate-bounce-slow">
              {getIcon()}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-3">
            {notification.title}
          </h3>

          {/* Message */}
          <p className="text-center text-gray-700 mb-6 leading-relaxed">
            {notification.message}
          </p>

          {/* Order Details */}
          {notification.productName && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Product:</span>
                <span className="font-semibold text-gray-900">{notification.productName}</span>
              </div>
              {notification.amount && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="font-semibold text-gray-900">{notification.amount} ETH</span>
                </div>
              )}
              {notification.buyerName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Buyer:</span>
                  <span className="font-semibold text-gray-900">{notification.buyerName}</span>
                </div>
              )}
              {notification.orderId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Order ID:</span>
                  <span className="font-mono text-xs text-gray-700">
                    {notification.orderId.substring(0, 16)}...
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            {notification.type === 'order_approved' && (
              <Button
                onClick={handleViewOrder}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 transform hover:scale-105 transition-transform"
              >
                <Package className="h-5 w-5 mr-2" />
                View Order & Pay Now
              </Button>
            )}
            {notification.type === 'new_order' && (
              <Button
                onClick={handleViewOrder}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 transform hover:scale-105 transition-transform"
              >
                <Package className="h-5 w-5 mr-2" />
                View Order & Respond
              </Button>
            )}
            {notification.type === 'payment_received' && (
              <Button
                onClick={handleViewOrder}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 transform hover:scale-105 transition-transform"
              >
                <Truck className="h-5 w-5 mr-2" />
                View Order & Ship
              </Button>
            )}
            {notification.type === 'order_rejected' && (
              <Button
                onClick={handleViewOrder}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 transform hover:scale-105 transition-transform"
              >
                <Package className="h-5 w-5 mr-2" />
                View Order Details
              </Button>
            )}
            <Button
              onClick={() => {
                onMarkAsRead(notification.id);
                onClose();
              }}
              variant="outline"
              className="w-full"
            >
              Mark as Read
            </Button>
          </div>

          {/* Info Box */}
          {notification.type === 'order_approved' && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 animate-fade-in">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">Next Steps:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Go to Orders page</li>
                    <li>• Click "Pay Now" button</li>
                    <li>• Complete payment with MetaMask</li>
                    <li>• Your payment will be held in escrow</li>
                    <li>• Seller will ship your order</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          {notification.type === 'new_order' && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 animate-fade-in">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">Action Required:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Review order details</li>
                    <li>• Accept or reject the order</li>
                    <li>• Buyer will be notified of your decision</li>
                    <li>• If accepted, buyer can make payment</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          {notification.type === 'payment_received' && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200 animate-fade-in">
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 mb-1">Next Steps:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Payment is secured in escrow</li>
                    <li>• Prepare the product for shipping</li>
                    <li>• Mark as shipped with tracking ID</li>
                    <li>• Payment released after delivery</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          {notification.type === 'order_rejected' && (
            <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200 animate-fade-in">
              <div className="flex items-start space-x-3">
                <div className="bg-red-100 p-2 rounded-full flex-shrink-0">
                  <X className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 mb-1">Order Rejected:</h4>
                  <p className="text-sm text-red-800">
                    The seller has rejected your order. You can browse other products or contact the seller for more information.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t">
          <p className="text-xs text-center text-gray-600">
            🔒 Your payment is protected by blockchain escrow
          </p>
        </div>
      </Card>
    </div>
  );
}

/**
 * Notification Bell Dropdown - Shows list of all notifications
 */
export function NotificationDropdown({ notifications, unreadCount, onMarkAsRead, onMarkAllAsRead, onClear }) {
  const navigate = useNavigate();

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[500px] overflow-hidden z-50 animate-slide-down">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {unreadCount}
              </Badge>
            )}
          </div>
          {notifications.length > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-blue-100 hover:text-white transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No notifications</p>
            <p className="text-sm text-gray-500 mt-1">
              You'll be notified when sellers approve your orders
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
                onClick={() => {
                  onMarkAsRead(notification.id);
                  if (notification.orderId) {
                    navigate('/orders');
                  }
                }}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full flex-shrink-0 ${
                    notification.type === 'order_approved' ? 'bg-green-100' :
                    notification.type === 'order_shipped' ? 'bg-blue-100' :
                    'bg-gray-100'
                  }`}>
                    {notification.type === 'order_approved' && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {notification.type === 'order_shipped' && <Truck className="h-5 w-5 text-blue-600" />}
                    {notification.type === 'order_delivered' && <Package className="h-5 w-5 text-purple-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0 ml-2 mt-1"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClear(notification.id);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="bg-gray-50 p-3 border-t">
          <button
            onClick={() => navigate('/orders')}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All Orders →
          </button>
        </div>
      )}
    </div>
  );
}
