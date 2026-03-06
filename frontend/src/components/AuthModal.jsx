import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import supabaseService from '../services/supabaseService';

/**
 * Auth Modal - Login and Registration with role selection
 */
export default function AuthModal({ onClose, onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'buyer'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await supabaseService.login(formData.email, formData.password);
      } else {
        result = await supabaseService.register(
          formData.email,
          formData.password,
          formData.role,
          formData.name
        );
      }

      if (result.success) {
        onLogin(result.user);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    const demoUser = DEMO_USERS[role];
    onLogin(demoUser);
    toast.success(`Demo ${role} login successful!`, {
      description: `Welcome ${demoUser.name}`
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" data-testid="auth-modal">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900" data-testid="auth-modal-title">
            {isLogin ? 'Login' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            data-testid="auth-modal-close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isLogin && (
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required={!isLogin}
                data-testid="auth-name-input"
              />
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              data-testid="auth-email-input"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              data-testid="auth-password-input"
            />
          </div>

          {!isLogin && (
            <div>
              <Label>Account Type</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="buyer"
                    checked={formData.role === 'buyer'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="text-[#2874f0] focus:ring-[#2874f0]"
                    data-testid="role-buyer"
                  />
                  <span className="text-sm font-medium">Buyer</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="seller"
                    checked={formData.role === 'seller'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="text-[#2874f0] focus:ring-[#2874f0]"
                    data-testid="role-seller"
                  />
                  <span className="text-sm font-medium">Seller</span>
                </label>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-[#2874f0] hover:bg-[#1e5bc6] text-white font-semibold"
            disabled={loading}
            data-testid="auth-submit-btn"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </Button>
        </form>

        {/* Demo Login Buttons */}
        {isLogin && (
          <div className="px-6 pb-4">
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 text-center mb-3 font-medium">Quick Demo Login</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  onClick={() => handleDemoLogin('buyer')}
                  data-testid="demo-buyer-btn"
                >
                  👤 Demo Buyer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                  onClick={() => handleDemoLogin('seller')}
                  data-testid="demo-seller-btn"
                >
                  🏪 Demo Seller
                </Button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                No password required - instant access
              </p>
            </div>
          </div>
        )}

        {/* Toggle */}
        <div className="p-6 pt-0 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#2874f0] hover:underline text-sm font-medium"
            data-testid="auth-toggle"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Demo login credentials
const DEMO_USERS = {
  buyer: {
    id: 'demo-buyer-001',
    name: 'Rishi Sawant',
    email: 'rishi.buyer@blockshop.com',
    role: 'buyer',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    balance: 5.5
  },
  seller: {
    id: 'demo-seller-001',
    name: 'Priya Sharma',
    email: 'priya.seller@blockshop.com',
    role: 'seller',
    walletAddress: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    balance: 12.3,
    storeName: 'TechStore Pro'
  }
};