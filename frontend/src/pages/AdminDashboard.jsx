import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, Users, Package, TrendingUp, AlertTriangle, CheckCircle, 
  XCircle, Eye, Ban, LogOut, Activity, DollarSign, ShoppingBag,
  Clock, Search, Filter
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import supabaseService from '../services/supabaseService';

/**
 * Admin Dashboard - High-Fidelity Flipkart-Style Admin Panel
 * Features: User Management, Product Approval, Transaction Monitoring, Fraud Detection
 */
export default function AdminDashboard({ adminUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAdminData();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadAdminData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    
    try {
      // Load all orders for transaction monitoring
      const allOrders = JSON.parse(localStorage.getItem('w3mart_orders') || '[]');
      
      // Calculate stats
      const totalUsers = 50; // Mock data - in production, fetch from Supabase
      const totalProducts = await supabaseService.getProducts();
      const totalTransactions = allOrders.length;
      const totalRevenue = allOrders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
      
      setStats({
        totalUsers,
        totalProducts: totalProducts.length,
        totalTransactions,
        totalRevenue,
        pendingApprovals: allOrders.filter(o => o.status === 'pending').length,
        fraudAlerts: 3 // Mock data
      });

      // Load users (mock data - in production, fetch from Supabase)
      setUsers([
        { id: 1, name: 'Rishi Sawant', email: 'buyer@test.com', role: 'buyer', status: 'active', orders: 5, joined: '2024-01-15' },
        { id: 2, name: 'Priya Seller', email: 'seller@test.com', role: 'seller', status: 'active', products: 12, joined: '2024-01-10' },
        { id: 3, name: 'Amit Kumar', email: 'amit@test.com', role: 'buyer', status: 'active', orders: 3, joined: '2024-02-01' },
        { id: 4, name: 'Suspicious User', email: 'suspicious@test.com', role: 'buyer', status: 'flagged', orders: 15, joined: '2024-02-20' }
      ]);

      // Load products
      setProducts(totalProducts.slice(0, 10));

      // Load transactions
      setTransactions(allOrders.slice(0, 10));

      // Load fraud alerts (mock data)
      setFraudAlerts([
        { id: 1, type: 'Multiple Failed Payments', user: 'suspicious@test.com', severity: 'high', timestamp: new Date().toISOString() },
        { id: 2, type: 'Unusual Order Pattern', user: 'buyer@test.com', severity: 'medium', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, type: 'Rapid Account Creation', ip: '192.168.1.100', severity: 'low', timestamp: new Date(Date.now() - 7200000).toISOString() }
      ]);

    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('blockshop_admin');
    toast.info('Logged out from Admin Portal');
    onLogout();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#2874f0] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-[#2874f0] to-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <Shield className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Portal</h1>
                <p className="text-blue-100 text-sm">BlockShop Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold">{adminUser.name}</p>
                <p className="text-xs text-blue-100">{adminUser.email}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-6 gap-6 mb-8"
        >
          <StatCard
            icon={<Users className="h-8 w-8" />}
            title="Total Users"
            value={stats.totalUsers}
            color="blue"
          />
          <StatCard
            icon={<Package className="h-8 w-8" />}
            title="Products"
            value={stats.totalProducts}
            color="purple"
          />
          <StatCard
            icon={<ShoppingBag className="h-8 w-8" />}
            title="Transactions"
            value={stats.totalTransactions}
            color="green"
          />
          <StatCard
            icon={<DollarSign className="h-8 w-8" />}
            title="Total Revenue"
            value={`${stats.totalRevenue?.toFixed(2)} ETH`}
            color="yellow"
          />
          <StatCard
            icon={<Clock className="h-8 w-8" />}
            title="Pending"
            value={stats.pendingApprovals}
            color="orange"
          />
          <StatCard
            icon={<AlertTriangle className="h-8 w-8" />}
            title="Fraud Alerts"
            value={stats.fraudAlerts}
            color="red"
          />
        </motion.div>

        {/* Navigation Tabs */}
        <div className="mb-6 flex space-x-2 overflow-x-auto">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={<Activity />}
            label="Overview"
          />
          <TabButton
            active={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
            icon={<Users />}
            label="User Management"
          />
          <TabButton
            active={activeTab === 'products'}
            onClick={() => setActiveTab('products')}
            icon={<Package />}
            label="Product Approval"
          />
          <TabButton
            active={activeTab === 'transactions'}
            onClick={() => setActiveTab('transactions')}
            icon={<TrendingUp />}
            label="Transactions"
          />
          <TabButton
            active={activeTab === 'fraud'}
            onClick={() => setActiveTab('fraud')}
            icon={<AlertTriangle />}
            label="Fraud Detection"
          />
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && <OverviewTab stats={stats} transactions={transactions} />}
          {activeTab === 'users' && <UserManagementTab users={users} onRefresh={loadAdminData} />}
          {activeTab === 'products' && <ProductApprovalTab products={products} onRefresh={loadAdminData} />}
          {activeTab === 'transactions' && <TransactionsTab transactions={transactions} />}
          {activeTab === 'fraud' && <FraudDetectionTab alerts={fraudAlerts} />}
        </motion.div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, title, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300">
      <div className={`p-3 rounded-lg ${colorClasses[color]} w-fit mb-4`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
    </Card>
  );
}

// Tab Button Component
function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
        active
          ? 'bg-[#2874f0] text-white shadow-lg'
          : 'bg-white text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// Overview Tab
function OverviewTab({ stats, transactions }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {transactions.slice(0, 5).map((tx, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-2 rounded-full">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{tx.product_name}</p>
                  <p className="text-sm text-gray-600">{tx.buyer_name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{tx.amount} ETH</p>
                <Badge className={getStatusColor(tx.status)}>
                  {tx.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// User Management Tab
function UserManagementTab({ users, onRefresh }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge className={user.role === 'seller' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                    {user.role}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge className={user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {user.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.orders ? `${user.orders} orders` : `${user.products} products`}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(user.joined).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600">
                      <Ban className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// Product Approval Tab
function ProductApprovalTab({ products, onRefresh }) {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Approval List</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
            <div className="flex space-x-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                <p className="text-lg font-bold text-[#2874f0] mb-2">{product.price} ETH</p>
                <div className="flex space-x-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600">
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Transactions Tab
function TransactionsTab({ transactions }) {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Transaction Monitoring</h2>
      <div className="space-y-4">
        {transactions.map((tx) => (
          <div key={tx.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{tx.product_name}</h3>
                  <Badge className={getStatusColor(tx.status)}>{tx.status}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <p className="font-medium">Buyer:</p>
                    <p>{tx.buyer_name}</p>
                  </div>
                  <div>
                    <p className="font-medium">Amount:</p>
                    <p className="font-semibold text-gray-900">{tx.amount} ETH</p>
                  </div>
                  <div>
                    <p className="font-medium">Date:</p>
                    <p>{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {tx.blockchain_tx && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">TX Hash:</p>
                    <p className="text-xs font-mono text-gray-700 truncate">{tx.blockchain_tx}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Fraud Detection Tab
function FraudDetectionTab({ alerts }) {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Fraud Detection Alerts</h2>
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`border-l-4 p-4 rounded-lg ${
              alert.severity === 'high'
                ? 'border-red-500 bg-red-50'
                : alert.severity === 'medium'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-blue-500 bg-blue-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <AlertTriangle
                    className={`h-5 w-5 ${
                      alert.severity === 'high'
                        ? 'text-red-600'
                        : alert.severity === 'medium'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`}
                  />
                  <h3 className="font-semibold text-gray-900">{alert.type}</h3>
                  <Badge
                    className={
                      alert.severity === 'high'
                        ? 'bg-red-100 text-red-800'
                        : alert.severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }
                  >
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  {alert.user && `User: ${alert.user}`}
                  {alert.ip && `IP: ${alert.ip}`}
                </p>
                <p className="text-xs text-gray-600">
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-1" />
                  Investigate
                </Button>
                <Button size="sm" className="bg-red-600 hover:bg-red-700">
                  <Ban className="h-4 w-4 mr-1" />
                  Block
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Helper function
function getStatusColor(status) {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'paid': return 'bg-green-100 text-green-800';
    case 'shipped': return 'bg-blue-100 text-blue-800';
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
