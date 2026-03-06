import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, TrendingDown, Package, Truck, Star, ArrowLeft, Loader2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import supabaseService from '../services/supabaseService';
import blockchainService from '../services/blockchainService';
import ReviewSection from '../components/ReviewSection';
import TransactionSuccessOverlay from '../components/TransactionSuccessOverlay';
import SellerProfile from '../components/SellerProfile';
import CheckoutModal from '../components/CheckoutModal';
import { useCart } from '../contexts/CartContext';

/**
 * Product Detail Page with blockchain purchase flow
 */
function ProductDetail({ user, isDemoMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [transactionData, setTransactionData] = useState(null);
  const [showSellerProfile, setShowSellerProfile] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const { addToCart } = useCart();

  // Import coupon codes
  const COUPON_CODES = {
    'FUTURE10': { discount: 10, description: '10% off on all products' },
    'WELCOME20': { discount: 20, description: '20% off for new users' },
    'BLOCKCHAIN15': { discount: 15, description: '15% off blockchain verified products' }
  };

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    const data = await supabaseService.getProduct(id);
    setProduct(data);
    setLoading(false);
  };

  const applyCoupon = () => {
    const code = couponCode.toUpperCase().trim();
    if (COUPON_CODES[code]) {
      setAppliedCoupon({ code, ...COUPON_CODES[code] });
      setCouponError('');
      toast.success(`🎉 Coupon Applied!`, {
        description: `${COUPON_CODES[code].description}`,
        duration: 3000
      });
    } else {
      setCouponError('Invalid coupon code');
      setAppliedCoupon(null);
      toast.error('Invalid coupon code');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const calculateFinalPrice = () => {
    let price = product.price;
    if (appliedCoupon) {
      price = price * (1 - appliedCoupon.discount / 100);
    }
    return price.toFixed(4);
  };

  const handleBuyNowClick = () => {
    if (!user) {
      toast.error('Please login to make a purchase');
      return;
    }

    if (user.role === 'seller') {
      toast.error('Sellers cannot purchase products');
      return;
    }

    // Show checkout modal to collect shipping details
    setShowCheckoutModal(true);
  };

  const handleCheckoutComplete = async (orderData) => {
    // W3 MART WORKFLOW: Direct purchase with MetaMask after collecting shipping details
    setPurchasing(true);
    setShowCheckoutModal(false);

    console.log('🛒 Checkout completed with data:', orderData);

    try {
      const finalPrice = calculateFinalPrice();

      // Prepare order data (used for both demo and real blockchain)
      const orderDataWithShipping = {
        product_id: product.id,
        product_name: product.name,
        product_description: product.description,
        product_category: product.category,
        product_image: product.image,
        amount: finalPrice,
        quantity: 1,
        status: 'pending', // Pending seller approval
        buyer_id: user.id,
        buyer_name: user.name || user.email.split('@')[0],
        buyer_email: user.email,
        seller_id: product.seller_id,
        seller_name: product.seller_name,
        seller_email: product.seller_email || 'seller@test.com',
        shipping_address: orderData.shipping_address,
        payment_method: orderData.payment_method,
        blockchain_verified: true
      };

      // Step 1: Show loading toast
      toast.info('Processing payment...', {
        description: 'Please wait',
        duration: 3000,
        id: 'payment-processing'
      });

      // Step 2: Create blockchain transaction
      const result = await blockchainService.createOrder(
        product.seller_id,
        product.id,
        finalPrice,
        // onPending callback (only for real MetaMask)
        () => {
          toast.loading('Transaction pending...', {
            description: 'Waiting for blockchain confirmation',
            id: 'tx-pending'
          });
        },
        // onSuccess callback (only for real MetaMask)
        async (txResult) => {
          toast.dismiss('tx-pending');
          
          // Add blockchain data
          orderDataWithShipping.blockchain_order_id = txResult.orderId;
          orderDataWithShipping.blockchain_tx = txResult.txHash;

          // Create order in database
          const orderResult = await supabaseService.createOrder(orderDataWithShipping);
          
          console.log('📦 Order creation result (MetaMask):', orderResult);
          
          if (orderResult.success) {
            console.log('✅ Order created successfully:', orderResult.order.id);
            
            toast.success('Payment Successful!', {
              description: `Order created! Waiting for seller approval.`,
              duration: 5000
            });

            // Navigate to success page
            navigate('/transaction-success', {
              state: {
                txHash: txResult.txHash,
                orderId: orderResult.order.id,
                product: product,
                blockNumber: txResult.blockNumber,
                appliedCoupon: appliedCoupon
              }
            });
          } else {
            console.error('❌ Order creation failed:', orderResult.error);
            toast.error('Order creation failed', {
              description: orderResult.error || 'Please try again'
            });
          }
          setPurchasing(false);
        },
        // onError callback
        (error) => {
          toast.dismiss('tx-pending');
          toast.dismiss('payment-processing');
          toast.error('Transaction Failed', {
            description: error.message || 'Please try again',
            duration: 5000
          });
          setPurchasing(false);
        }
      );

      // DEMO MODE: If result is returned directly (not using callbacks)
      if (result && result.success) {
        toast.dismiss('payment-processing');
        
        // Add blockchain data from demo mode
        orderDataWithShipping.blockchain_order_id = result.orderId;
        orderDataWithShipping.blockchain_tx = result.txHash;

        // Create order in database ONCE
        const orderResult = await supabaseService.createOrder(orderDataWithShipping);
        
        console.log('📦 Order creation result (Demo):', orderResult);
        
        if (orderResult.success) {
          console.log('✅ Order created successfully:', orderResult.order.id);
          
          toast.success('Order Placed Successfully!', {
            description: 'Waiting for seller approval',
            duration: 5000
          });
          
          // Show success overlay
          setTransactionData({
            txHash: result.txHash,
            blockNumber: result.blockNumber,
            orderId: orderResult.order.id,
            amount: finalPrice
          });
          setShowSuccessOverlay(true);
        } else {
          console.error('❌ Order creation failed:', orderResult.error);
          toast.error('Order creation failed', {
            description: orderResult.error || 'Please try again'
          });
        }
        setPurchasing(false);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.dismiss('payment-processing');
      toast.dismiss('tx-pending');
      toast.error('Transaction Failed', {
        description: error.message || 'Please try again'
      });
      setPurchasing(false);
    }
  };

  const handleOverlayClose = () => {
    setShowSuccessOverlay(false);
    navigate('/orders');
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add to cart');
      return;
    }

    if (user.role === 'seller') {
      toast.error('Sellers cannot add to cart');
      return;
    }

    addToCart(product);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
      </div>
    );
  }

  return (
    <>
      {/* Transaction Success Overlay */}
      <TransactionSuccessOverlay
        isOpen={showSuccessOverlay}
        onClose={handleOverlayClose}
        txHash={transactionData?.txHash}
        blockNumber={transactionData?.blockNumber}
        orderId={transactionData?.orderId}
        amount={transactionData?.amount}
        network="ganache"
      />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6"
            data-testid="back-button"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Product Image */}
            <div className="relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg"
                data-testid="product-image"
              />
              {product.blockchain_verified && (
                <Badge className="absolute top-4 left-4 bg-green-500 text-white blockchain-badge">
                  <ShieldCheck className="h-4 w-4 mr-1" />
                  Blockchain Verified
                </Badge>
              )}
            </div>

            {/* Product Details */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4" data-testid="product-title">
                {product.name}
              </h1>

              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-2 text-gray-600">4.5 (234 reviews)</span>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline space-x-3">
                  <span className="text-4xl font-bold text-gray-900" data-testid="product-detail-price">
                    {appliedCoupon ? calculateFinalPrice() : product.price} ETH
                  </span>
                  {(product.discount > 0 || appliedCoupon) && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        {product.price} ETH
                      </span>
                      {appliedCoupon && (
                        <Badge className="bg-green-500 text-white">
                          {appliedCoupon.discount}% COUPON
                        </Badge>
                      )}
                      {product.discount > 0 && !appliedCoupon && (
                        <Badge className="bg-red-500 text-white">
                          {product.discount}% OFF
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                <p className="text-gray-600 mt-2">Inclusive of all taxes</p>
              </div>

              {/* Coupon Code Section */}
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-dashed border-green-300">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <TrendingDown className="h-5 w-5 mr-2 text-green-600" />
                  Have a Coupon Code?
                </h3>
                {!appliedCoupon ? (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter code (e.g., FUTURE10)"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <Button
                      onClick={applyCoupon}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Apply
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div>
                      <p className="font-semibold text-green-600">✅ {appliedCoupon.code} Applied</p>
                      <p className="text-sm text-gray-600">{appliedCoupon.description}</p>
                    </div>
                    <Button
                      onClick={removeCoupon}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                )}
                {couponError && (
                  <p className="text-red-500 text-sm mt-2">{couponError}</p>
                )}
                <div className="mt-3 text-xs text-gray-600">
                  <p>💡 Try: <span className="font-mono font-semibold">FUTURE10</span> for 10% off</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{product.description}</p>
              </div>

              {/* Seller Info - Clickable */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer" onClick={() => setShowSellerProfile(true)}>
                <p className="text-sm text-gray-600">Sold by</p>
                <p className="font-semibold text-blue-600 hover:text-blue-700 flex items-center">
                  {product.seller_name}
                  <span className="ml-2 text-xs text-gray-500">(View Profile)</span>
                </p>
              </div>

              {/* Blockchain Features */}
              <div className="mb-6 space-y-3">
                <div className="flex items-start space-x-3">
                  <ShieldCheck className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Escrow Protected</p>
                    <p className="text-sm text-gray-600">Payment held in smart contract until delivery</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Package className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Blockchain Verified</p>
                    <p className="text-sm text-gray-600">All transactions recorded on immutable ledger</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Truck className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Free Delivery</p>
                    <p className="text-sm text-gray-600">Estimated 3-5 business days</p>
                  </div>
                </div>
              </div>

              {/* Purchase Button */}
              <div className="space-y-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="w-full bg-[#ff9f00] hover:bg-[#e68a00] text-white font-semibold py-6 text-lg mb-2"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
                <Button
                  onClick={handleBuyNowClick}
                  disabled={purchasing || product.stock === 0}
                  className="w-full bg-[#2874f0] hover:bg-[#1e5bb8] text-white font-semibold py-6 text-lg"
                  data-testid="purchase-button"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing Transaction...
                    </>
                  ) : product.stock === 0 ? (
                    'Out of Stock'
                  ) : (
                    'Buy Now with Escrow'
                  )}
                </Button>
                <p className="text-xs text-center text-gray-500">
                  {product.stock} items available
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="container mx-auto px-4 mt-8">
          <ReviewSection
            productId={product.id}
            user={user}
            canReview={user && user.role === 'buyer'}
          />
        </div>
      </div>
    </div>

      {/* Seller Profile Modal */}
      {showSellerProfile && (
        <SellerProfile
          sellerId={product.seller_id}
          sellerName={product.seller_name}
          onClose={() => setShowSellerProfile(false)}
        />
      )}

      {/* Checkout Modal for Direct Purchase */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        cartItems={[{ ...product, quantity: 1 }]}
        user={user}
        onCheckoutComplete={handleCheckoutComplete}
      />
    </>
  );
}

export default ProductDetail;
