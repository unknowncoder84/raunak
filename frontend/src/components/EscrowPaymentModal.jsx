import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Professional Escrow Payment Modal
 * Shows blockchain escrow security message during checkout
 */
export default function EscrowPaymentModal({ isOpen, onClose, orderDetails }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated Shield Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <Shield className="h-10 w-10 text-white" />
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-center text-gray-900 mb-3"
          >
            Payment Securely Held in Escrow
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center text-gray-600 mb-6"
          >
            Your payment is protected by blockchain smart contract
          </motion.p>

          {/* Order Details */}
          {orderDetails && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2"
            >
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Product:</span>
                <span className="font-semibold text-gray-900">{orderDetails.productName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-gray-900">{orderDetails.amount} ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono text-xs text-gray-700">
                  {orderDetails.orderId?.substring(0, 16)}...
                </span>
              </div>
            </motion.div>
          )}

          {/* Security Features */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3 mb-6"
          >
            <SecurityFeature
              icon={<Lock className="h-5 w-5" />}
              text="Funds locked in smart contract"
              delay={0.7}
            />
            <SecurityFeature
              icon={<Clock className="h-5 w-5" />}
              text="Waiting for seller to accept order"
              delay={0.8}
            />
            <SecurityFeature
              icon={<CheckCircle className="h-5 w-5" />}
              text="Released only after delivery confirmation"
              delay={0.9}
            />
          </motion.div>

          {/* Current Step Indicator */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center justify-center space-x-3">
              <div className="relative">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
              <div>
                <p className="font-semibold text-blue-900">Current Step: Seller Approval</p>
                <p className="text-xs text-blue-700">You'll be notified once seller accepts</p>
              </div>
            </div>
          </motion.div>

          {/* Order Timeline Stepper */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="mb-6"
          >
            <p className="text-sm font-semibold text-gray-900 mb-3">Order Timeline:</p>
            <div className="space-y-2">
              <TimelineStep step={1} label="Payment Submitted" status="completed" />
              <TimelineStep step={2} label="Seller Approval" status="current" />
              <TimelineStep step={3} label="Shipment" status="pending" />
              <TimelineStep step={4} label="Delivery" status="pending" />
            </div>
          </motion.div>

          {/* Close Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-[#2874f0] to-blue-600 hover:from-blue-600 hover:to-[#2874f0] text-white font-semibold py-6 text-lg"
            >
              Got It - Track My Order
            </Button>
          </motion.div>

          {/* Footer Note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="text-xs text-center text-gray-500 mt-4"
          >
            🔒 Your payment is 100% secure and protected by blockchain technology
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Security Feature Component
 */
function SecurityFeature({ icon, text, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center space-x-3 text-sm text-gray-700"
    >
      <div className="bg-green-100 p-2 rounded-full text-green-600">
        {icon}
      </div>
      <span>{text}</span>
    </motion.div>
  );
}

/**
 * Timeline Step Component
 */
function TimelineStep({ step, label, status }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          bgColor: 'bg-green-500',
          textColor: 'text-green-700',
          icon: <CheckCircle className="h-4 w-4 text-white" />
        };
      case 'current':
        return {
          bgColor: 'bg-blue-500',
          textColor: 'text-blue-700',
          icon: <Loader2 className="h-4 w-4 text-white animate-spin" />
        };
      case 'pending':
        return {
          bgColor: 'bg-gray-300',
          textColor: 'text-gray-500',
          icon: <div className="h-2 w-2 bg-white rounded-full" />
        };
      default:
        return {
          bgColor: 'bg-gray-300',
          textColor: 'text-gray-500',
          icon: null
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center space-x-3">
      <div className={`${config.bgColor} w-8 h-8 rounded-full flex items-center justify-center shadow-sm`}>
        {config.icon}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${config.textColor}`}>
          {step}. {label}
        </p>
      </div>
      {status === 'completed' && (
        <CheckCircle className="h-5 w-5 text-green-500" />
      )}
    </div>
  );
}
