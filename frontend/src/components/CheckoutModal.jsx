import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, CreditCard, ShoppingBag, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

/**
 * Professional Multi-Step Checkout Modal
 * Step 1: Shipping Address
 * Step 2: Payment Method
 * Step 3: Order Summary with Coupon
 */
export default function CheckoutModal({ isOpen, onClose, cartItems, user, onCheckoutComplete }) {
  const [step, setStep] = useState(1);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [processing, setProcessing] = useState(false);

  const COUPON_CODES = {
    'FUTURE10': { discount: 10, description: '10% off on all products' },
    'WELCOME20': { discount: 20, description: '20% off for new users' },
    'BLOCKCHAIN15': { discount: 15, description: '15% off blockchain verified products' }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateFinalTotal = () => {
    let total = calculateTotal();
    if (appliedCoupon) {
      total = total * (1 - appliedCoupon.discount / 100);
    }
    return total.toFixed(4);
  };

  const handleAddressChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value
    });
  };

  const validateAddress = () => {
    const required = ['fullName', 'phone', 'address', 'city', 'state', 'pincode'];
    for (let field of required) {
      if (!shippingAddress[field].trim()) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!validateAddress()) return;
      setStep(2);
    } else if (step === 2) {
      if (!paymentMethod) {
        toast.error('Please select a payment method');
        return;
      }
      setStep(3);
    }
  };

  const applyCoupon = () => {
    const code = couponCode.toUpperCase().trim();
    if (COUPON_CODES[code]) {
      setAppliedCoupon({ code, ...COUPON_CODES[code] });
      toast.success(`🎉 Coupon Applied!`, {
        description: COUPON_CODES[code].description
      });
    } else {
      toast.error('Invalid coupon code');
      setAppliedCoupon(null);
    }
  };

  const handlePlaceOrder = async () => {
    // CRITICAL: Prevent double clicks and duplicate submissions
    if (processing) {
      console.log('⚠️ Already processing order, ignoring duplicate click');
      toast.warning('Order is already being processed, please wait...');
      return;
    }

    setProcessing(true);
    
    try {
      // Add small delay to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 100));

      // Prepare order data with shipping address
      const orderData = {
        items: cartItems,
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        applied_coupon: appliedCoupon?.code,
        discount_amount: appliedCoupon ? (calculateTotal() - parseFloat(calculateFinalTotal())).toFixed(4) : 0,
        total_amount: calculateFinalTotal()
      };

      console.log('📦 Submitting order to parent component...');

      // Call parent callback
      await onCheckoutComplete(orderData);
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Checkout failed. Please try again.');
      setProcessing(false); // Re-enable on error
    }
    // Note: Don't reset processing here - let parent component handle it
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
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
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h2>
              <div className="flex items-center space-x-4">
                <StepIndicator number={1} label="Address" active={step === 1} completed={step > 1} />
                <div className="flex-1 h-1 bg-gray-200">
                  <div className={`h-full bg-[#2874f0] transition-all ${step > 1 ? 'w-full' : 'w-0'}`} />
                </div>
                <StepIndicator number={2} label="Payment" active={step === 2} completed={step > 2} />
                <div className="flex-1 h-1 bg-gray-200">
                  <div className={`h-full bg-[#2874f0] transition-all ${step > 2 ? 'w-full' : 'w-0'}`} />
                </div>
                <StepIndicator number={3} label="Review" active={step === 3} completed={false} />
              </div>
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <ShippingAddressStep
                    address={shippingAddress}
                    onChange={handleAddressChange}
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <PaymentMethodStep
                    selected={paymentMethod}
                    onSelect={setPaymentMethod}
                  />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <OrderSummaryStep
                    cartItems={cartItems}
                    shippingAddress={shippingAddress}
                    paymentMethod={paymentMethod}
                    total={calculateTotal()}
                    finalTotal={calculateFinalTotal()}
                    couponCode={couponCode}
                    appliedCoupon={appliedCoupon}
                    onCouponChange={setCouponCode}
                    onApplyCoupon={applyCoupon}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              {step > 1 && (
                <Button
                  onClick={() => setStep(step - 1)}
                  variant="outline"
                  disabled={processing}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              
              {step < 3 ? (
                <Button
                  onClick={handleNextStep}
                  className="ml-auto bg-[#2874f0] hover:bg-blue-700"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handlePlaceOrder}
                  disabled={processing}
                  className="ml-auto bg-green-600 hover:bg-green-700"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Place Order
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

// Step Indicator Component
function StepIndicator({ number, label, active, completed }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
        completed ? 'bg-green-600 text-white' :
        active ? 'bg-[#2874f0] text-white' :
        'bg-gray-200 text-gray-600'
      }`}>
        {completed ? <CheckCircle className="h-5 w-5" /> : number}
      </div>
      <p className={`text-xs mt-1 ${active ? 'text-[#2874f0] font-semibold' : 'text-gray-600'}`}>
        {label}
      </p>
    </div>
  );
}

// Step 1: Shipping Address
function ShippingAddressStep({ address, onChange }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <MapPin className="h-5 w-5 text-[#2874f0]" />
        <h3 className="text-xl font-semibold text-gray-900">Shipping Address</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <input
          type="text"
          name="fullName"
          value={address.fullName}
          onChange={onChange}
          placeholder="Full Name *"
          required
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2874f0] focus:border-transparent"
        />
        <input
          type="tel"
          name="phone"
          value={address.phone}
          onChange={onChange}
          placeholder="Contact Number *"
          required
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2874f0] focus:border-transparent"
        />
      </div>

      <textarea
        name="address"
        value={address.address}
        onChange={onChange}
        placeholder="Full Address (House No, Building, Street) *"
        required
        rows={3}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2874f0] focus:border-transparent"
      />

      <div className="grid md:grid-cols-3 gap-4">
        <input
          type="text"
          name="city"
          value={address.city}
          onChange={onChange}
          placeholder="City *"
          required
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2874f0] focus:border-transparent"
        />
        <input
          type="text"
          name="state"
          value={address.state}
          onChange={onChange}
          placeholder="State *"
          required
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2874f0] focus:border-transparent"
        />
        <input
          type="text"
          name="pincode"
          value={address.pincode}
          onChange={onChange}
          placeholder="Pincode *"
          required
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2874f0] focus:border-transparent"
        />
      </div>

      <input
        type="text"
        name="landmark"
        value={address.landmark}
        onChange={onChange}
        placeholder="Landmark (Optional)"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2874f0] focus:border-transparent"
      />
    </div>
  );
}

// Step 2: Payment Method
function PaymentMethodStep({ selected, onSelect }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <CreditCard className="h-5 w-5 text-[#2874f0]" />
        <h3 className="text-xl font-semibold text-gray-900">Payment Method</h3>
      </div>

      <button
        onClick={() => onSelect('metamask')}
        className={`w-full p-6 border-2 rounded-lg transition-all ${
          selected === 'metamask'
            ? 'border-[#2874f0] bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center space-x-4">
          <div className="bg-orange-100 p-3 rounded-lg">
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="h-8 w-8" />
          </div>
          <div className="text-left flex-1">
            <h4 className="font-semibold text-gray-900">Connect MetaMask</h4>
            <p className="text-sm text-gray-600">Pay with cryptocurrency via MetaMask wallet</p>
          </div>
          {selected === 'metamask' && (
            <CheckCircle className="h-6 w-6 text-[#2874f0]" />
          )}
        </div>
      </button>

      <button
        onClick={() => onSelect('demo')}
        className={`w-full p-6 border-2 rounded-lg transition-all ${
          selected === 'demo'
            ? 'border-[#2874f0] bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center space-x-4">
          <div className="bg-green-100 p-3 rounded-lg">
            <CreditCard className="h-8 w-8 text-green-600" />
          </div>
          <div className="text-left flex-1">
            <h4 className="font-semibold text-gray-900">Pay with Demo Credits</h4>
            <p className="text-sm text-gray-600">Use demo mode for testing (no real payment)</p>
          </div>
          {selected === 'demo' && (
            <CheckCircle className="h-6 w-6 text-[#2874f0]" />
          )}
        </div>
      </button>
    </div>
  );
}

// Step 3: Order Summary
function OrderSummaryStep({ cartItems, shippingAddress, paymentMethod, total, finalTotal, couponCode, appliedCoupon, onCouponChange, onApplyCoupon }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <ShoppingBag className="h-5 w-5 text-[#2874f0]" />
        <h3 className="text-xl font-semibold text-gray-900">Order Summary</h3>
      </div>

      {/* Cart Items */}
      <div className="max-h-48 overflow-y-auto space-y-3">
        {cartItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
              <div>
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
              </div>
            </div>
            <p className="font-semibold text-gray-900">{(item.price * item.quantity).toFixed(4)} ETH</p>
          </div>
        ))}
      </div>

      {/* Shipping Address Summary */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="font-semibold text-gray-900 mb-2">Shipping To:</p>
        <p className="text-sm text-gray-700">{shippingAddress.fullName}</p>
        <p className="text-sm text-gray-700">{shippingAddress.address}</p>
        <p className="text-sm text-gray-700">{shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}</p>
      </div>

      {/* Coupon Code */}
      <div className="p-4 bg-green-50 rounded-lg border-2 border-dashed border-green-300">
        <h4 className="font-semibold text-gray-900 mb-3">Have a Coupon Code?</h4>
        {!appliedCoupon ? (
          <div className="flex space-x-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => onCouponChange(e.target.value.toUpperCase())}
              placeholder="Enter code (e.g., FUTURE10)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
            <Button onClick={onApplyCoupon} className="bg-green-600 hover:bg-green-700">
              Apply
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-white p-3 rounded-lg">
            <div>
              <p className="font-semibold text-green-600">✅ {appliedCoupon.code} Applied</p>
              <p className="text-sm text-gray-600">{appliedCoupon.description}</p>
            </div>
            <Badge className="bg-green-100 text-green-800">-{appliedCoupon.discount}%</Badge>
          </div>
        )}
      </div>

      {/* Price Summary */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-gray-700">
          <span>Subtotal:</span>
          <span>{total.toFixed(4)} ETH</span>
        </div>
        {appliedCoupon && (
          <div className="flex justify-between text-green-600">
            <span>Discount ({appliedCoupon.discount}%):</span>
            <span>-{(total - parseFloat(finalTotal)).toFixed(4)} ETH</span>
          </div>
        )}
        <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
          <span>Total:</span>
          <span>{finalTotal} ETH</span>
        </div>
      </div>
    </div>
  );
}
