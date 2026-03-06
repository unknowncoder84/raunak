import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Package, Users, ShoppingCart, Star, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import supabaseService from '../services/supabaseService';

/**
 * Analytics Dashboard - Seller insights and statistics
 */
export default function AnalyticsDashboard({ user }) {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    avgOrderValue: 0,
    completedOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    totalCustomers: 0,
    avgRating: 0,
    totalReviews: 0
  });
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    
    // Load seller orders
    const sellerId = user.email || user.id;
    const orderData = await supabaseService.getSellerOrders(sellerId);
    setOrders(orderData);

    // Load seller products
    const productData = await supabaseService.getSellerProducts(sellerId);
    setProducts(productData);

    // Calculate statistics
    const totalRevenue = orderData
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);

    const totalOrders = orderData.length;
    const completedOrders = orderData.filter(o => o.status === 'delivered').length;
    const pendingOrders = orderData.filter(o => o.status === 'pending').length;
    const cancelledOrders = orderData.filter(o => o.status === 'rejected' || o.status === 'cancelled').length;
    
    const avgOrderValue = totalOrders > 0 ? totalRevenue / completedOrders : 0;
    
    // Unique customers
    const uniqueCustomers = new Set(orderData.map(o => o.buyer_email)).size;

    // Calculate average rating
    const reviews = await supabaseService.getSellerReviews(sellerId);
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    setStats({
      totalRevenue,
      totalOrders,
      totalProducts: productData.length,
      avgOrderValue,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      totalCustomers: uniqueCustomers,
      avgRating,
      totalReviews: reviews.length
    });

    // Calculate revenue by month (last 6 months)
    const monthlyRevenue = calculateMonthlyRevenue(orderData);
    setRevenueData(monthlyRevenue);

    // Find top selling products
    const productSales = calculateProductSales(orderData);
    setTopProducts(productSales.slice(0, 5));

    setLoading(false);
  };

  const calculateMonthlyRevenue = (orders) => {
    const months = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), revenue: 0, orders: 0 };
    }

    // Aggregate orders by month
    orders.filter(o => o.status === 'delivered').forEach(order => {
      const date = new Date(order.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (months[key]) {
        months[key].revenue += parseFloat(order.amount || 0);
        months[key].orders += 1;
      }
    });

    return Object.values(months);
  };

  const calculateProductSales = (orders) => {
    const productMap = {};
    
    orders.filter(o => o.status === 'delivered').forEach(order => {
      const productId = order.product_id;
      if (!productMap[productId]) {
        productMap[productId] = {
          id: productId,
          name: order.product_name,
          image: order.product_image,
          sales: 0,
          revenue: 0,
          quantity: 0
        };
      }
      productMap[productId].sales += 1;
      productMap[productId].revenue += parseFloat(order.amount || 0);
      productMap[productId].quantity += order.quantity || 1;
    });

    return Object.values(productMap).sort((a, b) => b.revenue - a.revenue);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your sales performance and insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<DollarSign className="h-6 w-6" />}
            title="Total Revenue"
            value={`${stats.totalRevenue.toFixed(4)} ETH`}
            change="+12.5%"
            positive={true}
            color="blue"
          />
          <StatCard
            icon={<ShoppingCart className="h-6 w-6" />}
            title="Total Orders"
            value={stats.totalOrders}
            subtitle={`${stats.completedOrders} completed`}
            color="green"
          />
          <StatCard
            icon={<Package className="h-6 w-6" />}
            title="Products Listed"
            value={stats.totalProducts}
            subtitle={`${stats.pendingOrders} pending orders`}
            color="purple"
          />
          <StatCard
            icon={<Users className="h-6 w-6" />}
            title="Total Customers"
            value={stats.totalCustomers}
            subtitle={`${stats.avgRating.toFixed(1)} ⭐ avg rating`}
            color="orange"
          />
        </div>

        {/* Revenue Chart */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Revenue Trend (Last 6 Months)
          </h2>
          <div className="space-y-4">
            {revenueData.map((data, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-600">{data.month}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full flex items-center justify-end pr-2 text-white text-sm font-medium"
                        style={{ width: `${Math.min((data.revenue / Math.max(...revenueData.map(d => d.revenue))) * 100, 100)}%` }}
                      >
                        {data.revenue > 0 && `${data.revenue.toFixed(4)} ETH`}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 w-20">{data.orders} orders</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Products */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Top Selling Products
            </h2>
            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No sales data yet</p>
              ) : (
                topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                    {product.image && (
                      <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.sales} sales • {product.quantity} units</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{product.revenue.toFixed(4)} ETH</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Order Status Breakdown */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Order Status Breakdown
            </h2>
            <div className="space-y-4">
              <StatusBar
                label="Completed"
                count={stats.completedOrders}
                total={stats.totalOrders}
                color="green"
              />
              <StatusBar
                label="Pending"
                count={stats.pendingOrders}
                total={stats.totalOrders}
                color="yellow"
              />
              <StatusBar
                label="Cancelled/Rejected"
                count={stats.cancelledOrders}
                total={stats.totalOrders}
                color="red"
              />
            </div>

            {/* Additional Stats */}
            <div className="mt-6 pt-6 border-t space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Order Value</span>
                <span className="font-semibold">{stats.avgOrderValue.toFixed(4)} ETH</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-semibold">
                  {stats.totalOrders > 0 ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Reviews</span>
                <span className="font-semibold">{stats.totalReviews} reviews</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Order ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-mono">#{order.id.substring(0, 8)}</td>
                    <td className="py-3 px-4 text-sm">{order.product_name}</td>
                    <td className="py-3 px-4 text-sm">{order.buyer_name}</td>
                    <td className="py-3 px-4 text-sm font-semibold">{order.amount} ETH</td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        order.status === 'delivered' ? 'success' :
                        order.status === 'pending' ? 'warning' :
                        order.status === 'shipped' ? 'info' : 'destructive'
                      }>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, change, positive, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
            {positive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            {change}
          </div>
        )}
      </div>
      <h3 className="text-sm text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </Card>
  );
}

function StatusBar({ label, count, total, color }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
