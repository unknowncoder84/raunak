import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, TrendingUp, Clock, CheckCircle, Truck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import supabaseService from '../services/supabaseService';

/**
 * Buyer Dashboard - Personalized buyer experience
 */
export default function BuyerDashboard({ user, isDemoMode }) {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBuyerData();
  }, []);

  const loadBuyerData = async () => {
    setLoading(true);
    const orderData = await supabaseService.getUserOrders(user.id);
    setOrders(orderData.slice(0, 5)); // Latest 5 orders
    
    // Calculate stats
    const totalOrders = orderData.length;
    const activeOrders = orderData.filter(o => o.status !== 'delivered').length;
    const completedOrders = orderData.filter(o => o.status === 'delivered').length;
    const totalSpent = orderData.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
    
    setStats({ totalOrders, activeOrders, completedOrders, totalSpent });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name || 'Buyer'}! 👋
          </h1>
          <p className="text-gray-600">
            Here's your shopping overview and recent orders
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<ShoppingBag className="h-8 w-8" />}
            title="Total Orders"
            value={stats.totalOrders}
            color="blue"
          />
          <StatCard
            icon={<Clock className="h-8 w-8" />}
            title="Active Orders"
            value={stats.activeOrders}
            color="yellow"
          />
          <StatCard
            icon={<CheckCircle className="h-8 w-8" />}
            title="Completed"
            value={stats.completedOrders}
            color="green"
          />
          <StatCard
            icon={<TrendingUp className="h-8 w-8" />}
            title="Total Spent"
            value={`${stats.totalSpent.toFixed(3)} ETH`}
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/">
              <Button className="w-full bg-white text-blue-600 hover:bg-gray-100">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Browse Products
              </Button>
            </Link>
            <Link to="/orders">
              <Button className="w-full bg-white text-blue-600 hover:bg-gray-100">
                <Package className="h-4 w-4 mr-2" />
                View All Orders
              </Button>
            </Link>
            <Link to="/transparency">
              <Button className="w-full bg-white text-blue-600 hover:bg-gray-100">
                <TrendingUp className="h-4 w-4 mr-2" />
                Transparency Dashboard
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recent Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
            <Link to="/orders">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-4">Start shopping to see your orders here</p>
              <Link to="/">
                <Button className="bg-[#2874f0] hover:bg-[#1e5bc6]">
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </Card>

        {/* Shopping Tips */}
        <Card className="mt-8 p-6 bg-gradient-to-br from-green-50 to-blue-50">
          <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Shopping Tips</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Tip
              icon="🛡️"
              title="Escrow Protection"
              description="Your payment is safe until delivery confirmation"
            />
            <Tip
              icon="⛓️"
              title="Blockchain Verified"
              description="All transactions recorded on immutable ledger"
            />
            <Tip
              icon="✅"
              title="Confirm Delivery"
              description="Release payment only after receiving your order"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className={`p-3 rounded-lg ${colorClasses[color]} w-fit mb-4`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
    </Card>
  );
}

function OrderCard({ order }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <Clock className="h-5 w-5" />;
      case 'shipped': return <Truck className="h-5 w-5" />;
      case 'delivered': return <CheckCircle className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-4">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <Package className="h-6 w-6 text-[#2874f0]" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{order.product_name}</h4>
          <p className="text-sm text-gray-600">
            {new Date(order.created_at).toLocaleDateString()} • {order.amount} ETH
          </p>
        </div>
      </div>
      <Badge className={getStatusColor(order.status)}>
        {getStatusIcon(order.status)}
        <span className="ml-1 capitalize">{order.status}</span>
      </Badge>
    </div>
  );
}

function Tip({ icon, title, description }) {
  return (
    <div className="text-center">
      <div className="text-4xl mb-2">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
