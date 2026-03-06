import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, MapPin, CreditCard, ArrowRight, Home } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import confetti from 'canvas-confetti';

/**
 * Order Confirmation Page
 * Shown after successful checkout
 */
export default function OrderConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    // Trigger confetti on mount
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b']
    });

    // Get order data from navigation state
    if (location.state?.orderData) {
      setOrderData(location.state.orderData);
    } else {
      // If no order data, redirect to home
      setTimeout(() => navigate('/'), 2000);
    }
  }, [location, navigate]);

  if (!orderData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#2874f0] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-block mb-4"
          >
            <div className="bg-green-100 p-6 rounded-full">
              <CheckCircle className="h-20 w-20 text-green-600" />
            </div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-gray-900 mb-2"
          >
            Order Placed Successfully! 🎉
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-gray-600"
          >
            Thank you for your order. We've sent the details to the seller for approval.
          </motion.p>
        </motion.div>

        {/* Order Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-8 mb-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Package className="h-6 w-6 mr-2 text-[#2874f0]" />
              Order Summary
            </h2>

            {/* Order Items */}
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Items Ordered ({orderData.items.length})</h3>
              {orderData.items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-xs text-gray-500">Seller: {item.seller_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{(item.price * item.quantity).toFixed(4)} ETH</p>
                    <Badge className="bg-yellow-100 text-yellow-800 mt-1">
                      Pending Approval
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Shipping Address */}
            {orderData.shipping_address && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mb-6 p-4 bg-blue-50 rounded-lg"
              >
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                  Shipping Address
                </h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-semibold">{orderData.shipping_address.fullName}</p>
                  <p>{orderData.shipping_address.phone}</p>
                  <p>{orderData.shipping_address.address}</p>
                  <p>
                    {orderData.shipping_address.city}, {orderData.shipping_address.state} - {orderData.shipping_address.pincode}
                  </p>
                  {orderData.shipping_address.landmark && (
                    <p className="text-gray-600">Landmark: {orderData.shipping_address.landmark}</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Payment Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mb-6 p-4 bg-green-50 rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                Payment Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium text-gray-900">
                    {orderData.payment_method === 'metamask' ? 'MetaMask Wallet' : 'Demo Credits'}
                  </span>
                </div>
                {orderData.applied_coupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Applied:</span>
                    <span className="font-semibold">{orderData.applied_coupon}</span>
                  </div>
                )}
                {orderData.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span className="font-semibold">-{orderData.discount_amount} ETH</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t text-lg font-bold">
                  <span className="text-gray-900">Total Amount:</span>
                  <span className="text-gray-900">{orderData.total_amount} ETH</span>
                </div>
              </div>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200"
            >
              <h3 className="font-semibold text-gray-900 mb-3">📋 What Happens Next?</h3>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="font-bold text-purple-600 mr-2">1.</span>
                  <span>Seller will review and approve your order</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-purple-600 mr-2">2.</span>
                  <span>You'll receive a notification when approved</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-purple-600 mr-2">3.</span>
                  <span>Make payment (funds held in escrow for your protection)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-purple-600 mr-2">4.</span>
                  <span>Seller ships the product</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-purple-600 mr-2">5.</span>
                  <span>Confirm delivery to release payment to seller</span>
                </li>
              </ol>
            </motion.div>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            onClick={() => navigate('/orders')}
            className="bg-[#2874f0] hover:bg-blue-700 text-white px-8 py-6 text-lg"
          >
            <Package className="h-5 w-5 mr-2" />
            View My Orders
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="px-8 py-6 text-lg"
          >
            <Home className="h-5 w-5 mr-2" />
            Continue Shopping
          </Button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-8 text-center"
        >
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span>Escrow Protected</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-blue-500 mr-2" />
              <span>Blockchain Verified</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-purple-500 mr-2" />
              <span>Secure Payment</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
