import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Star, CheckCircle, TrendingUp, Package, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import supabaseService from '../services/supabaseService';

/**
 * Seller Profile Modal
 * Shows seller rating, total successful blockchain transactions, and stats
 */
export default function SellerProfile({ sellerId, sellerName, onClose }) {
  const [sellerData, setSellerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSellerProfile();
  }, [sellerId]);

  const loadSellerProfile = async () => {
    setLoading(true);
    
    try {
      // Get seller's orders to calculate stats
      const orders = await supabaseService.getSellerOrders(sellerId);
      
      // Get seller's reviews
      const reviews = await supabaseService.getSellerReviews(sellerId);
      
      // Calculate stats
      const totalOrders = orders.length;
      const completedOrders = orders.filter(o => o.status === 'delivered').length;
      const totalRevenue = orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
      
      // Calculate average rating from reviews
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
      
      // Count blockchain verified transactions
      const blockchainTransactions = orders.filter(o => o.blockchain_tx).length;
      
      setSellerData({
        name: sellerName,
        rating: avgRating,
        totalReviews: reviews.length,
        totalOrders,
        completedOrders,
        totalRevenue,
        blockchainTransactions,
        successRate: totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(1) : 0
      });
    } catch (error) {
      console.error('Error loading seller profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
        <Card className="w-full max-w-2xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#2874f0] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading seller profile...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl"
      >
        <Card className="relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="bg-gradient-to-br from-[#2874f0] to-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{sellerData.name}</h2>
              <div className="flex items-center justify-center space-x-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(sellerData.rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {sellerData.rating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-600">
                  ({sellerData.totalReviews} reviews)
                </span>
              </div>
            </div>

            {/* Blockchain Verified Badge */}
            <div className="mb-8 p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">
                    {sellerData.blockchainTransactions} Blockchain Verified Transactions
                  </p>
                  <p className="text-sm text-green-700">
                    All transactions secured on Ethereum blockchain
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatBox
                icon={<Package className="h-6 w-6" />}
                label="Total Orders"
                value={sellerData.totalOrders}
                color="blue"
              />
              <StatBox
                icon={<CheckCircle className="h-6 w-6" />}
                label="Completed"
                value={sellerData.completedOrders}
                color="green"
              />
              <StatBox
                icon={<TrendingUp className="h-6 w-6" />}
                label="Success Rate"
                value={`${sellerData.successRate}%`}
                color="purple"
              />
              <StatBox
                icon={<Award className="h-6 w-6" />}
                label="Total Revenue"
                value={`${sellerData.totalRevenue.toFixed(2)} ETH`}
                color="yellow"
              />
            </div>

            {/* Trust Indicators */}
            <div className="space-y-3">
              <TrustIndicator
                icon={<CheckCircle className="h-5 w-5 text-green-600" />}
                label="Verified Seller"
                description="Identity verified on blockchain"
              />
              <TrustIndicator
                icon={<CheckCircle className="h-5 w-5 text-green-600" />}
                label="Secure Escrow"
                description="All payments protected by smart contract"
              />
              <TrustIndicator
                icon={<CheckCircle className="h-5 w-5 text-green-600" />}
                label="Transparent Reviews"
                description="All reviews blockchain-verified"
              />
            </div>

            {/* Close Button */}
            <div className="mt-8">
              <Button
                onClick={onClose}
                className="w-full bg-[#2874f0] hover:bg-blue-700"
              >
                Close Profile
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

function StatBox({ icon, label, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600'
  };

  return (
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <div className={`${colorClasses[color]} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  );
}

function TrustIndicator({ icon, label, description }) {
  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
      {icon}
      <div>
        <p className="font-semibold text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
    </div>
  );
}
