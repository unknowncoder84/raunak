import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ExternalLink, X } from 'lucide-react';
import { Button } from './ui/button';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

/**
 * Transaction Success Overlay
 * Displays after successful blockchain transaction with TX hash and block explorer link
 */
export default function TransactionSuccessOverlay({ 
  isOpen, 
  onClose, 
  txHash, 
  blockNumber,
  orderId,
  amount,
  network = 'sepolia' 
}) {
  
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti celebration
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#2874f0']
      });
    }
  }, [isOpen]);

  const getExplorerUrl = () => {
    const explorers = {
      mainnet: 'https://etherscan.io',
      sepolia: 'https://sepolia.etherscan.io',
      polygon: 'https://polygonscan.com',
      amoy: 'https://amoy.polygonscan.com',
      ganache: '#' // Local network
    };
    
    const baseUrl = explorers[network] || explorers.sepolia;
    return `${baseUrl}/tx/${txHash}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Success Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-6"
              >
                <div className="bg-green-100 rounded-full p-4">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-center text-gray-900 mb-2"
              >
                Transaction Successful! 🎉
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center text-gray-600 mb-6"
              >
                Your payment has been confirmed on the blockchain
              </motion.p>

              {/* Transaction Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 mb-6 space-y-4"
              >
                {/* Order ID */}
                {orderId && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Order ID</p>
                    <p className="font-mono text-sm font-semibold text-gray-900 break-all">
                      {orderId}
                    </p>
                  </div>
                )}

                {/* Amount */}
                {amount && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Amount</p>
                    <p className="text-2xl font-bold text-green-600">
                      {amount} ETH
                    </p>
                  </div>
                )}

                {/* Transaction Hash */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Transaction Hash</p>
                  <p className="font-mono text-xs text-gray-700 break-all bg-white p-2 rounded border border-gray-200">
                    {txHash}
                  </p>
                </div>

                {/* Block Number */}
                {blockNumber && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Block Number</p>
                    <p className="font-mono text-sm font-semibold text-gray-900">
                      #{blockNumber}
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-3"
              >
                {/* View on Block Explorer */}
                {network !== 'ganache' && (
                  <a
                    href={getExplorerUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-5 w-5" />
                    <span>View on Block Explorer</span>
                  </a>
                )}

                {/* Close Button */}
                <Button
                  onClick={onClose}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3"
                >
                  Continue Shopping
                </Button>
              </motion.div>

              {/* Security Note */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-xs text-center text-gray-500 mt-4"
              >
                🔒 Your transaction is secured by blockchain technology
              </motion.p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
