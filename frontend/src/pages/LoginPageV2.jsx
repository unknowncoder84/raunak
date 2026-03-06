import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Store, Mail, Lock, Eye, EyeOff, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import supabaseServiceV2 from '../services/supabaseService_v2';
import metamaskService from '../services/metamaskService';

export default function LoginPageV2() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('buyer'); // 'buyer' or 'seller'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linkWallet, setLinkWallet] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await supabaseServiceV2.login(email, password, activeTab);
      
      if (result.success) {
        // Optional wallet linking
        if (linkWallet) {
          const walletResult = await metamaskService.connectWallet();
          if (walletResult.success) {
            await supabaseServiceV2.linkWallet(result.user.id, walletResult.address);
            toast.success('Wallet linked successfully!');
          }
        }

        toast.success(`Welcome back, ${result.user.full_name}!`);
        
        // Redirect based on role
        if (result.user.role === 'seller') {
          navigate('/seller/dashboard');
        } else if (result.user.role === 'buyer') {
          navigate('/buyer/dashboard');
        } else {
          navigate('/');
        }
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      toast.error('An error occurred during login');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    if (activeTab === 'buyer') {
      setEmail('buyer1@test.com');
      setPassword('buy01');
    } else {
      setEmail('Seller1@test.com');
      setPassword('user1');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-[#2874f0] to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">W3 Mart</h1>
            <p className="text-gray-600 mt-2">Decentralized Marketplace</p>
          </div>

          {/* Role Tabs */}
          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('buyer')}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'buyer'
                  ? 'bg-white text-[#2874f0] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Buyer
            </button>
            <button
              onClick={() => setActiveTab('seller')}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'seller'
                  ? 'bg-white text-[#2874f0] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Store className="h-4 w-4" />
              Seller
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={activeTab === 'buyer' ? 'buyer1@test.com' : 'Seller1@test.com'}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={activeTab === 'buyer' ? 'buy01' : 'user1'}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Optional Wallet Linking */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <input
                type="checkbox"
                id="linkWallet"
                checked={linkWallet}
                onChange={(e) => setLinkWallet(e.target.checked)}
                className="w-4 h-4 text-[#2874f0] rounded"
              />
              <label htmlFor="linkWallet" className="text-sm text-gray-700 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Link blockchain wallet (optional)
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#2874f0] hover:bg-[#1e5bb8] text-white py-6 text-lg"
              disabled={loading}
            >
              {loading ? 'Logging in...' : `Login as ${activeTab === 'buyer' ? 'Buyer' : 'Seller'}`}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-4">
            <button
              onClick={fillDemoCredentials}
              className="w-full text-sm text-[#2874f0] hover:underline"
            >
              Use demo credentials
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
            </div>
          </div>

          {/* Signup Link */}
          <Link to="/signup">
            <Button variant="outline" className="w-full">
              Create New Account
            </Button>
          </Link>

          {/* Demo Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              <strong>Demo Accounts:</strong><br />
              Buyer: buyer1@test.com / buy01<br />
              Seller: Seller1@test.com / user1
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
