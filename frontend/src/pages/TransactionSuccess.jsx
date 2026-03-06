import { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, ExternalLink, Package, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import confetti from 'canvas-confetti';

/**
 * Transaction Success Page - W3 Mart Standard
 * Shows real transaction hash and blockchain confirmation
 */
export default function TransactionSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { txHash, orderId, product, blockNumber } = location.state || {};

  useEffect(() => {
    // Redirect if no transaction data
    if (!txHash) {
      navigate('/');
      return;
    }

    // W3 Mart Standard: Celebration animation on success
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#2874f0', '#ff9f00', '#10b981']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#2874f0', '#ff9f00', '#10b981']
      });
    }, 250);

    return () => clearInterval(interval);
  }, [txHash, navigate]);

  if (!txHash) {
    return null;
  }

  // Format transaction hash for display
  const shortTxHash = `${txHash.substring(0, 10)}...${txHash.substring(txHash.length - 8)}`;
  const explorerUrl = `https://etherscan.io/tx/${txHash}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white rounded-full p-4 animate-bounce">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
            <p className="text-green-100 text-lg">Your order has been confirmed on the blockchain</p>
          </div>

          {/* Transaction Details */}
          <div className="p-8 space-y-6">
            {/* Transaction Hash */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Transaction Hash</p>
                  <p className="font-mono text-lg font-semibold text-gray-900 break-all">
                    {txHash}
                  </p>
                </div>
                <Badge className="bg-green-500 text-white">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View on Etherscan
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </div>

            {/* Order Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Order ID</p>
                <p className="font-semibold text-gray-900">#{orderId || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Block Number</p>
                <p className="font-semibold text-gray-900">#{blockNumber || 'Pending'}</p>
              </div>
            </div>

            {/* Product Info */}
            {product && (
              <div className="border-2 border-gray-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />
                  Order Summary
                </h3>
                <div className="flex items-start space-x-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{product.name}</h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">{product.price} ETH</span>
                      <Badge className="bg-blue-500 text-white">
                        Escrow Protected
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* What's Next */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                What Happens Next?
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Payment Locked in Escrow</p>
                    <p className="text-sm text-gray-600">Your funds are securely held in the smart contract</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Seller Prepares Order</p>
                    <p className="text-sm text-gray-600">The seller will process and ship your order</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Delivery & Confirmation</p>
                    <p className="text-sm text-gray-600">Confirm delivery to release payment to seller</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                asChild
                className="flex-1 bg-[#2874f0] hover:bg-[#1e5bb8] text-white h-12"
              >
                <Link to="/orders">
                  <Package className="h-5 w-5 mr-2" />
                  Track Order
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex-1 h-12"
              >
                <Link to="/">
                  Continue Shopping
                </Link>
              </Button>
            </div>

            {/* Security Note */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                <ShieldCheck className="h-4 w-4 inline mr-1 text-green-500" />
                Your transaction is secured by blockchain technology
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help? <Link to="/support" className="text-blue-600 hover:underline">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
