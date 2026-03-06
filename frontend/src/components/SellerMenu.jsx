import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Package, ShoppingCart, Star, Settings, LogOut, 
  Moon, Sun, Wallet, BarChart3, ChevronDown, Store, TrendingUp
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';

export default function SellerMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsOpen(false);
    if (onLogout) {
      await onLogout();
    } else {
      localStorage.removeItem('blockshop_user');
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/seller/dashboard' },
    { icon: TrendingUp, label: 'Analytics', path: '/seller/analytics' },
    { icon: Package, label: 'My Products', path: '/seller/products' },
    { icon: ShoppingCart, label: 'Orders', path: '/seller/orders' },
    { icon: Star, label: 'Reviews & Ratings', path: '/seller/reviews' },
    { icon: User, label: 'Profile', path: '/seller/profile' },
    { icon: Wallet, label: 'Wallet', path: '/seller/wallet' },
    { icon: Settings, label: 'Settings', path: '/seller/settings' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white font-semibold">
          {user?.full_name?.charAt(0) || 'S'}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {user?.full_name || 'Seller'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Store className="h-3 w-3" />
            Seller Account
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
            >
              {/* User Info */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-700 dark:to-gray-800">
                <p className="font-semibold text-gray-900 dark:text-white">{user?.full_name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                {user?.seller_rating > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user.seller_rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      ({user.total_sales || 0} sales)
                    </span>
                  </div>
                )}
                {user?.wallet_address && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
                    {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                  </p>
                )}
              </div>

              {/* Menu Items */}
              <div className="py-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <item.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                  </Link>
                ))}

                {/* Theme Toggle */}
                <button
                  onClick={() => {
                    toggleTheme();
                    toast.success(`Switched to ${theme === 'light' ? 'dark' : 'light'} mode`);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {theme === 'light' ? (
                    <>
                      <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
                    </>
                  ) : (
                    <>
                      <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Light Mode</span>
                    </>
                  )}
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
