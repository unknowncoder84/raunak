import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useCart } from '../contexts/CartContext';
import CheckoutModal from '../components/CheckoutModal';
import supabaseService from '../services/supabaseService';

export default function CartPage({ user }) {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedOrderId, setProcessedOrderId] = useState(null);
  const [lastOrderTime, setLastOrderTime] = useState(0);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Login</h2>
        <p className="text-gray-600">You need to login to view your cart</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">Add some products to get started</p>
        <Button onClick={() => navigate('/')} className="bg-[#ff9f00] hover:bg-[#e68a00]">
          Browse Products
        </Button>
      </div>
    );
  }

  const handleCheckoutComplete = async (orderData) => {
    // ULTRA-AGGRESSIVE: Check time since last order
    const now = Date.now();
    if (now - lastOrderTime < 5000) { // 5 seconds
      console.log('⚠️ ULTRA-DUPLICATE PREVENTION - Too soon since last order');
      toast.warning('Please wait a moment before placing another order');
      return;
    }

    // CRITICAL: Prevent duplicate order processing
    if (isProcessing) {
      console.log('⚠️ Order already being processed, ignoring duplicate call');
      toast.warning('Order is already being processed...');
      return;
    }

    // Generate unique order batch ID
    const batchId = 'batch-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    
    // Check if this batch was already processed
    if (processedOrderId === batchId) {
      console.log('⚠️ This order batch was already processed');
      return;
    }

    setIsProcessing(true);
    setProcessedOrderId(batchId);
    setLastOrderTime(now);

    try {
      console.log('═══════════════════════════════════════════');
      console.log('🛒 CHECKOUT - Processing order...');
      console.log('═══════════════════════════════════════════');
      console.log('👤 Buyer Email:', user.email);
      console.log('👤 Buyer Name:', user.name || user.full_name || user.email.split('@')[0]);
      console.log('📦 Items to order:', orderData.items.length);
      console.log('💳 Payment Method:', orderData.payment_method);
      console.log('📍 Shipping Address:', orderData.shipping_address);

      const createdOrders = [];

      // Process each cart item as separate order
      for (const item of orderData.items) {
        console.log('\n--- Processing Item ---');
        console.log('Product ID:', item.id);
        console.log('Product Name:', item.name);
        console.log('Product Price:', item.price);
        console.log('Quantity:', item.quantity);
        
        // Get full product details to ensure we have seller info
        const productDetails = await supabaseService.getProduct(item.id);
        console.log('Product Details:', productDetails);
        
        const sellerEmail = productDetails?.seller_email || item.seller_email || 'Seller1@test.com';
        const sellerName = productDetails?.seller_name || item.seller_name || 'Demo Seller';
        
        console.log('✅ Seller Email:', sellerEmail);
        console.log('✅ Seller Name:', sellerName);

        const order = {
          product_id: item.id,
          product_name: item.name,
          product_description: item.description || productDetails?.description || 'No description',
          product_category: item.category || productDetails?.category || 'General',
          product_image: item.image || productDetails?.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
          amount: (item.price * item.quantity).toFixed(4),
          total_amount: (item.price * item.quantity).toFixed(4),
          quantity: item.quantity,
          status: 'pending',
          payment_status: 'pending',
          buyer_id: null,
          buyer_name: user.name || user.full_name || user.email.split('@')[0],
          buyer_email: user.email,
          seller_id: null,
          seller_email: sellerEmail,
          seller_name: sellerName,
          shipping_address: JSON.stringify(orderData.shipping_address),
          payment_method: orderData.payment_method || 'demo',
          applied_coupon: orderData.applied_coupon || null,
          discount_amount: orderData.discount_amount || 0,
          blockchain_verified: false,
          batch_id: batchId // Add batch ID for tracking
        };
        
        console.log('\n💾 Creating order in database...');
        console.log('Order Data:', JSON.stringify(order, null, 2));
        
        const result = await supabaseService.createOrder(order);
        
        if (result.success) {
          if (result.isDuplicate) {
            console.log('⚠️ DUPLICATE ORDER SKIPPED');
            console.log('   Using existing order:', result.order.id);
          } else {
            console.log('✅ ORDER CREATED SUCCESSFULLY!');
            console.log('   Order ID:', result.order.id);
            console.log('   Order Number:', result.order.order_number);
            console.log('   Buyer:', result.order.buyer_email);
            console.log('   Seller:', result.order.seller_email);
            console.log('   Status:', result.order.status);
          }
          createdOrders.push(result.order);
        } else {
          console.error('❌ ORDER CREATION FAILED!');
          console.error('   Error:', result.error);
          
          // If it's a duplicate error, don't throw - just continue
          if (result.error && result.error.includes('duplicate')) {
            console.log('⚠️ Duplicate detected, continuing...');
            continue;
          }
          
          throw new Error(result.error || 'Failed to create order');
        }
      }
      
      console.log('\n═══════════════════════════════════════════');
      console.log(`✅ ALL ORDERS PROCESSED: ${createdOrders.length}`);
      console.log('═══════════════════════════════════════════');
      
      // Verify orders are in localStorage
      const allOrders = JSON.parse(localStorage.getItem('w3mart_orders') || '[]');
      console.log(`📊 Total orders in localStorage: ${allOrders.length}`);
      console.log('📋 Latest orders:', allOrders.slice(-3));
      
      // Clear cart
      clearCart();
      
      toast.success(`🎉 Order placed successfully!`, {
        description: `${orderData.items.length} item(s) ordered. Check "My Orders" to track.`,
        duration: 5000
      });
      
      // Navigate to order confirmation page
      navigate('/order-confirmation', { 
        state: { orderData, createdOrders },
        replace: true 
      });
    } catch (error) {
      console.error('═══════════════════════════════════════════');
      console.error('❌ CHECKOUT ERROR');
      console.error('═══════════════════════════════════════════');
      console.error('Error:', error);
      console.error('Stack:', error.stack);
      toast.error(`Order failed: ${error.message || 'Please try again'}`);
    } finally {
      // Reset processing state after 3 seconds (increased from 2)
      setTimeout(() => {
        setIsProcessing(false);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          </div>
          <Button
            variant="outline"
            onClick={clearCart}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Cart
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-6 animate-fade-in">
                <div className="flex gap-6">
                  {/* Product Image */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-32 h-32 object-cover rounded-lg"
                  />

                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <div className="flex items-center space-x-2 mb-3">
                          {item.blockchain_verified && (
                            <Badge className="bg-green-500 text-white text-xs">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">by {item.seller_name}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Quantity and Price */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-medium text-gray-900 w-12 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-gray-500">
                          ({item.stock} available)
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {(item.price * item.quantity).toFixed(4)} ETH
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.price} ETH each
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Items ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
                  <span>{getCartTotal().toFixed(4)} ETH</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{getCartTotal().toFixed(4)} ETH</span>
                </div>
              </div>

              <Button
                onClick={() => setShowCheckout(true)}
                className="w-full bg-[#ff9f00] hover:bg-[#e68a00] text-white font-semibold py-6 text-lg mb-4"
              >
                Proceed to Checkout
              </Button>

              {/* Features */}
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <ShieldCheck className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Escrow Protected</p>
                    <p className="text-xs">Payment held until delivery</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <ShieldCheck className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Blockchain Verified</p>
                    <p className="text-xs">All transactions on-chain</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        cartItems={cart}
        user={user}
        onCheckoutComplete={handleCheckoutComplete}
      />
    </div>
  );
}
