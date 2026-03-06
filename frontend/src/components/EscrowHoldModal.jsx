import { motion } from 'framer-motion';
import { Shield, Lock, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

/**
 * Escrow Hold Modal
 * Shows when buyer successfully pays - funds held in smart contract
 */
export default function EscrowHoldModal({ isOpen, onClose, orderData }) {
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti on open
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#2874f0']
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg"
      >
        <Card className="p-8 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 opacity-50"></div>
          
          {/* Content */}
          <div className="relative z-10">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <div className="bg-green-100 p-6 rounded-full">
                  <Shield className="h-16 w-16 text-green-600" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute -top-2 -right-2 bg-blue-500 p-2 rounded-full"
                >
                  <Lock className="h-6 w-6 text-white" />
                </motion.div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-center text-gray-900 mb-2"
            >
              Payment Successful! 🎉
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center text-gray-600 mb-6"
            >
              Your funds are now safely held in escrow
            </motion.p>

            {/* Amount Display */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-xl mb-6 text-center"
            >
              <p className="text-sm font-medium mb-2 text-green-100">Amount in Escrow</p>
              <p className="text-4xl font-bold">{orderData?.amount || '0.0000'} ETH</p>
              <Badge className="mt-3 bg-white/20 text-white border-white/30">
                <Lock className="h-3 w-3 mr-1" />
                Secured by Smart Contract
              </Badge>
            </motion.div>

            {/* Order Details */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-blue-50 p-4 rounded-lg mb-6"
            >
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                Order Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Product:</span>
                  <span className="font-semibold text-gray-900">{orderData?.product_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Seller:</span>
                  <span className="font-semibold text-gray-900">{orderData?.seller_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Awaiting Seller Approval
                  </Badge>
                </div>
              </div>
            </motion.div>

            {/* Protection Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200 mb-6"
            >
              <h3 className="font-semibold text-gray-900 mb-3">🛡️ Your Protection</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Funds held securely in blockchain smart contract</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Payment only released when you confirm delivery</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Seller must ship before you can release funds</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Full refund if seller doesn't fulfill order</span>
                </li>
              </ul>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-gray-50 p-4 rounded-lg mb-6"
            >
              <h3 className="font-semibold text-gray-900 mb-3">📋 What Happens Next?</h3>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="font-bold text-[#2874f0] mr-2">1.</span>
                  <span>Seller reviews and approves your order</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-[#2874f0] mr-2">2.</span>
                  <span>Seller ships the product to your address</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-[#2874f0] mr-2">3.</span>
                  <span>You receive the product and verify it</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-[#2874f0] mr-2">4.</span>
                  <span>You click "Confirm Delivery" to release payment</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-[#2874f0] mr-2">5.</span>
                  <span>Seller receives payment from escrow</span>
                </li>
              </ol>
            </motion.div>

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Button
                onClick={onClose}
                className="w-full bg-[#2874f0] hover:bg-blue-700 text-white py-6 text-lg font-semibold"
              >
                Track My Order
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </motion.div>

            {/* Transaction Hash */}
            {orderData?.txHash && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="mt-4 text-center"
              >
                <p className="text-xs text-gray-500">Transaction Hash:</p>
                <p className="text-xs font-mono text-gray-600 break-all">
                  {orderData.txHash}
                </p>
              </motion.div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
