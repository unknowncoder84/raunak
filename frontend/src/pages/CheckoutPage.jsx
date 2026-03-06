import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Wallet, MapPin, Phone, User, ArrowLeft, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import supabaseService from '../services/supabaseService';
import blockchainService from '../services/blockchainService';
import EscrowPaymentModal from '../components/EscrowPaymentModal';

/**
 * Checkout Page - Complete order placement with shipping details
 */
export default function CheckoutPage({ user, isDemoMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const product = location.state?.product;

  const [loading, setLoading] = useState(false);
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'blockchain',
    blockchainNetwork: 'ethereum'
  });

  if (!product) {
    navigate('/');
    return null;
  }

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === 'FUTURE10') {
      setDiscount(0.10); // 10% discount
      setCouponApplied(true);
      toast.success('🎉 Coupon Applied!', {
        description: '10% discount added to your order'
      });
    } else {
      toast.error('Invalid coupon code', {
        description: 'Please check and try again'
      });
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponApplied(false);
    setDiscount(0);
    toast.info('Coupon removed');
  };

  // Calculate final amounts
  const originalPrice = parseFloat(product.price);
  const couponDiscount = originalPrice * discount;
  const platformFee = originalPrice * 0.02;
  const finalAmount = originalPrice - couponDiscount + platformFee;

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePlaceOrder = async () => {
    // Validate form
    if (!formData.fullName || !formData.phone || !formData.address || 
        !formData.city || !formData.state || !formData.pincode) {
      toast.error('Please fill all shipping details');
      return;
    }

    if (formData.phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      // Create order in database with "pending" status
      const orderData = {
        id: `order-${Date.now()}`,
        user_id: user.id || user.email,
        buyer_id: user.id || user.email,
        buyer_email: user.email,
        buyer_name: formData.fullName,
        product_id: product.id,
        product_name: product.name,
        product_description: product.description,
        product_image: product.image,
        category: product.category,
        quantity: 1,
        original_amount: originalPrice,
        coupon_code: couponApplied ? couponCode : null,
        coupon_discount: couponDiscount,
        platform_fee: platformFee,
        amount: finalAmount.toFixed(4),
        status: 'pending', // Pending seller approval
        seller_id: product.seller_id || product.seller_email || 'Seller1@test.com',
        seller_name: product.seller_name || 'Demo Seller',
        seller_email: product.seller_email || product.seller_id || 'Seller1@test.com',
        shipping_address: {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
        },
        payment_method: formData.paymentMethod,
        blockchain_network: formData.blockchainNetwork,
        blockchain_verified: false,
        created_at: new Date().toISOString()
      };

      console.log('📦 Creating order for buyer:', user.email);
      console.log('🏪 Order seller info:', {
        seller_id: orderData.seller_id,
        seller_email: orderData.seller_email,
        seller_name: orderData.seller_name
      });
      console.log('📋 Full order data:', orderData);
      const result = await supabaseService.createOrder(orderData);

      if (result.success) {
        // Store order details for modal
        setOrderDetails({
          orderId: orderData.id,
          productName: product.name,
          amount: finalAmount.toFixed(4)
        });

        // Show Escrow Modal
        setShowEscrowModal(true);

        // Send notification to seller about new order
        const sellerEmail = orderData.seller_email;
        
        const notificationData = {
          type: 'new_order',
          title: '🛍️ New Order Received!',
          orderId: orderData.id,
          productName: product.name,
          amount: finalAmount.toFixed(4),
          buyerName: formData.fullName,
          message: `New order for ${product.name} from ${formData.fullName}. Please review and approve or reject.`,
          timestamp: new Date().toISOString(),
          icon: '🛍️'
        };
        
        localStorage.setItem(`seller_notifications_${sellerEmail}`, JSON.stringify(notificationData));
        console.log('📧 New order notification sent to seller:', sellerEmail);

        // Navigate to orders page after modal is closed
        setTimeout(() => {
          navigate('/orders');
        }, 3000);
      } else {
        toast.error('Order Failed', {
          description: result.error
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <EscrowPaymentModal
        isOpen={showEscrowModal}
        onClose={() => {
          setShowEscrowModal(false);
          navigate('/orders');
        }}
        orderDetails={orderDetails}
      />
      
      <motion.div 
        className="min-h-screen bg-gray-50 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <motion.h1 
          className="text-3xl font-bold text-gray-900 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Checkout
        </motion.h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Details */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Shipping Details</h2>
                  <p className="text-sm text-gray-600">Enter your delivery address</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="1234567890"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="House No, Street Name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Mumbai"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="Maharashtra"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="400001"
                    required
                  />
                </div>
              </div>
            </Card>

            {/* Payment Method */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Wallet className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                  <p className="text-sm text-gray-600">Choose your payment option</p>
                </div>
              </div>

              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              >
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="blockchain" id="blockchain" />
                  <Label htmlFor="blockchain" className="flex-1 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <Wallet className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-semibold">Blockchain Payment</p>
                        <p className="text-sm text-gray-600">Pay with cryptocurrency (Recommended)</p>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer opacity-50">
                  <RadioGroupItem value="card" id="card" disabled />
                  <Label htmlFor="card" className="flex-1 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-semibold">Credit/Debit Card</p>
                        <p className="text-sm text-gray-600">Coming soon</p>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {formData.paymentMethod === 'blockchain' && (
                <div className="mt-4">
                  <Label>Select Blockchain Network</Label>
                  <RadioGroup
                    value={formData.blockchainNetwork}
                    onValueChange={(value) => setFormData({ ...formData, blockchainNetwork: value })}
                    className="mt-2 space-y-2"
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="ethereum" id="ethereum" />
                      <Label htmlFor="ethereum" className="flex-1 cursor-pointer">
                        <p className="font-medium">Ethereum (ETH)</p>
                        <p className="text-xs text-gray-600">Sepolia Testnet</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg opacity-50">
                      <RadioGroupItem value="polygon" id="polygon" disabled />
                      <Label htmlFor="polygon" className="flex-1 cursor-pointer">
                        <p className="font-medium">Polygon (MATIC)</p>
                        <p className="text-xs text-gray-600">Coming soon</p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              {/* Product Info */}
              <div className="flex space-x-4 mb-6 pb-6 border-b">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">Qty: 1</p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Price</span>
                  <span>{originalPrice.toFixed(4)} ETH</span>
                </div>
                {product.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Product Discount ({product.discount}%)</span>
                    <span>-{(originalPrice * product.discount / 100).toFixed(4)} ETH</span>
                  </div>
                )}
                
                {/* Coupon Section */}
                {!couponApplied ? (
                  <div className="border-t border-b py-3 my-3">
                    <Label htmlFor="coupon" className="text-sm font-medium">Have a coupon code?</Label>
                    <div className="flex space-x-2 mt-2">
                      <Input
                        id="coupon"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter code (e.g., FUTURE10)"
                        className="flex-1"
                      />
                      <Button
                        onClick={applyCoupon}
                        variant="outline"
                        size="sm"
                        disabled={!couponCode}
                      >
                        Apply
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">💡 Try: FUTURE10 for 10% off</p>
                  </div>
                ) : (
                  <div className="border-t border-b py-3 my-3 bg-green-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-green-800">🎉 Coupon Applied: {couponCode}</p>
                        <p className="text-xs text-green-600">You saved {couponDiscount.toFixed(4)} ETH!</p>
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
                  </div>
                )}
                
                {couponApplied && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Coupon Discount (10%)</span>
                    <span>-{couponDiscount.toFixed(4)} ETH</span>
                  </div>
                )}
                
                <div className="flex justify-between text-gray-700">
                  <span>Delivery Charges</span>
                  <span className="text-green-600">FREE</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Platform Fee (2%)</span>
                  <span>{platformFee.toFixed(4)} ETH</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total Amount</span>
                  <div className="text-right">
                    {couponApplied && (
                      <div className="text-sm text-gray-500 line-through font-normal">
                        {originalPrice.toFixed(4)} ETH
                      </div>
                    )}
                    <span className={couponApplied ? 'text-green-600' : ''}>
                      {finalAmount.toFixed(4)} ETH
                    </span>
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <Button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-[#2874f0] hover:bg-[#1e5bc6] text-white font-semibold py-6 text-lg"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </Button>

              {/* Security Info */}
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-800 text-center">
                  🔒 Your payment will be held in escrow until delivery confirmation
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
    </>
  );
}
