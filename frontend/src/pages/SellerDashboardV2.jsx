import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Package, ShoppingCart, Star, DollarSign,
  Users, Eye, Clock, CheckCircle, Truck
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import supabaseServiceV2 from '../services/supabaseService_v2';
import SellerMenu from '../components/SellerMenu';

export default function SellerDashboardV2() {
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const currentUser = supabaseServiceV2.getCurrentUser();
    if (!currentUser) return;

    setUser(currentUser);

    // Load analytics
    const analyticsData = await supabaseServiceV2.getSellerAnalytics(currentUser.id);
    setAnalytics(analyticsData);

    // Load recent orders
    const orders = await supabaseServiceV2.getOrders(currentUser.id, 'seller');
    setRecentOrders(orders.slice(0, 5));

    setLoading(false);
  };

  const stats = [
    {
      label: 'Total Revenue',
      value: `${analytics?.totalRevenue?.toFixed(4) || '0.0000'} ETH`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+12.5%'
    },
    {
      label: 'Total Sales',
      value: analytics?.totalSales || 0,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      change: '+8.2%'
    },
    {
      label: 'Active Products',
      value: analytics?.activeProducts || 0,
      icon: Package,
      color: 'bg-purple-500',
      change: '+3'
    },
    {
      label: 'Avg Rating',
      value: analytics?.avgRating?.toFixed(1) || '0.0',
      icon: Star,
      color: 'bg-yellow-500',
      change: '+0.3'
    },
    {
      label: 'Pending Orders',
      value: analytics?.pendingOrders || 0,
      icon: Clock,
      color: 'bg-orange-500',
      change: 'New'
    },
    {
      label: 'Total Reviews',
      value: analytics?.totalReviews || 0,
      icon: Users,
      color: 'bg-indigo-500',
      change: '+5'
    }
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2874f0] mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Seller Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Welcome back, {user?.full_name}!
            </p>
          </div>
          {user && <SellerMenu user={user} />}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {stat.change}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Orders
              </h2>
              <Link to="/seller/orders">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <img
                      src={order.product_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}
                      alt={order.product_name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {order.product_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.total_amount} ETH
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link to="/seller/products/add">
                <Button className="w-full justify-start bg-[#2874f0] hover:bg-[#1e5bb8]">
                  <Package className="h-5 w-5 mr-3" />
                  Add New Product
                </Button>
              </Link>
              <Link to="/seller/products">
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="h-5 w-5 mr-3" />
                  Manage Products
                </Button>
              </Link>
              <Link to="/seller/orders">
                <Button variant="outline" className="w-full justify-start">
                  <ShoppingCart className="h-5 w-5 mr-3" />
                  View Orders
                </Button>
              </Link>
              <Link to="/seller/reviews">
                <Button variant="outline" className="w-full justify-start">
                  <Star className="h-5 w-5 mr-3" />
                  Check Reviews
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Performance Chart Placeholder */}
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Sales Performance
          </h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                Sales chart coming soon
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
