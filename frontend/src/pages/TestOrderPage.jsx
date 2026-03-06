import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import supabaseService from '../services/supabaseService';

/**
 * Test Order Page - Create test orders for debugging
 * Access at /test-order
 */
export default function TestOrderPage({ user }) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    const allOrders = JSON.parse(localStorage.getItem('w3mart_orders') || '[]');
    setOrders(allOrders);
  };

  const createTestOrder = async () => {
    if (!user) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }

    // Prevent double clicks with stronger protection
    if (creating) {
      console.log('⚠️ Already creating order, ignoring duplicate click');
      toast.warning('Please wait, order is being created...');
      return;
    }

    setCreating(true);

    try {
      // Add small delay to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 100));

      const testProduct = {
        id: 'test-prod-' + Date.now(),
        name: 'Test Product ' + Math.floor(Math.random() * 1000),
        description: 'This is a test product created for debugging',
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        price: 0.05,
        seller_email: 'Seller1@test.com',
        seller_name: 'Demo Seller'
      };

      const orderData = {
        product_id: testProduct.id,
        product_name: testProduct.name,
        product_description: testProduct.description,
        product_category: testProduct.category,
        product_image: testProduct.image,
        amount: '0.0500',
        total_amount: '0.0500',
        quantity: 1,
        status: 'pending',
        payment_status: 'pending',
        buyer_id: null,
        buyer_name: user.name || user.full_name || user.email.split('@')[0],
        buyer_email: user.email,
        seller_id: null,
        seller_email: testProduct.seller_email,
        seller_name: testProduct.seller_name,
        shipping_address: JSON.stringify({
          fullName: 'Test User',
          phone: '1234567890',
          address: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '12345',
          landmark: 'Near Test Mall'
        }),
        payment_method: 'demo',
        applied_coupon: null,
        discount_amount: 0,
        blockchain_verified: false
      };

      console.log('Creating test order:', orderData);

      const result = await supabaseService.createOrder(orderData);

      if (result.success) {
        toast.success('✅ Test order created!', {
          description: `Order ID: ${result.order.id.substring(0, 12)}...`
        });
        loadOrders();
      } else {
        toast.error('Failed to create order: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating test order:', error);
      toast.error('Error: ' + error.message);
    } finally {
      // Re-enable button after 2 seconds to prevent rapid clicking
      setTimeout(() => {
        setCreating(false);
      }, 2000);
    }
  };

  const clearAllOrders = () => {
    if (window.confirm('Clear all orders? This cannot be undone.')) {
      localStorage.removeItem('w3mart_orders');
      setOrders([]);
      toast.success('All orders cleared');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please login to create test orders</p>
          <Button onClick={() => navigate('/login')} className="bg-[#2874f0]">
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🧪 Test Order Creator</h1>
            <p className="text-gray-600">Create test orders to verify the order system</p>
          </div>

          {/* User Info */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Logged in as:</h3>
            <p className="text-gray-700">Email: {user.email}</p>
            <p className="text-gray-700">Role: {user.role || 'buyer'}</p>
          </div>

          {/* Actions */}
          <div className="space-y-4 mb-8">
            <Button
              onClick={createTestOrder}
              disabled={creating}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Order...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Create Test Order
                </>
              )}
            </Button>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => navigate('/buyer/orders')}
                variant="outline"
                className="py-4"
              >
                View My Orders
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                onClick={clearAllOrders}
                variant="outline"
                className="py-4 text-red-600 hover:bg-red-50"
              >
                Clear All Orders
              </Button>
            </div>
          </div>

          {/* Orders List */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Orders in Storage ({orders.length})
            </h3>
            
            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No orders yet. Create a test order above!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {orders.slice().reverse().map((order, index) => (
                  <div key={order.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{order.product_name}</h4>
                        <p className="text-sm text-gray-600">
                          Buyer: {order.buyer_email}
                        </p>
                        <p className="text-sm text-gray-600">
                          Seller: {order.seller_email}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {order.status}
                        </span>
                        <p className="text-sm font-semibold text-gray-900 mt-2">
                          {order.amount} ETH
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-green-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">📝 How to Test:</h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li>1. Click "Create Test Order" above</li>
              <li>2. Click "View My Orders" to see the order</li>
              <li>3. Logout and login as seller (Seller1@test.com / user1)</li>
              <li>4. Check seller dashboard - order should appear there</li>
              <li>5. Accept and process the order</li>
            </ol>
          </div>
        </Card>
      </div>
    </div>
  );
}
