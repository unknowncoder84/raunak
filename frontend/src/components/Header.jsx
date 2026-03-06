import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Wallet, Activity, Loader2, Search, Bell, Home, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useRef, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useNotifications } from '../contexts/NotificationContext';
import { NotificationDropdown } from './NotificationModal';
import ConnectionModal from './ConnectionModal';
import BuyerMenu from './BuyerMenu';
import SellerMenu from './SellerMenu';

/**
 * Header Component - Flipkart-inspired blue theme with blockchain features
 */
export default function Header({ user, isDemoMode, walletConnected, onLogin, onLogout, onConnectWallet, onSearch, onCategorySelect }) {
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const { getCartCount } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const notificationRef = useRef(null);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConnectWallet = async () => {
    setShowConnectionModal(true);
  };

  const handleConnectionComplete = async (connectionData) => {
    if (connectionData.mode === 'metamask') {
      setConnectingWallet(false);
      if (onConnectWallet) {
        await onConnectWallet();
      }
    } else {
      // Demo mode - just update state
      setConnectingWallet(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleCategoryClick = (category) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#2874f0] shadow-lg">
      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          {/* Logo */}
          <div 
            onClick={() => navigate(user?.role === 'seller' ? '/dashboard' : '/')} 
            className="flex items-center space-x-2 group cursor-pointer" 
            data-testid="header-logo"
          >
            <div className="bg-white p-2 rounded-lg shadow-md group-hover:shadow-xl transition-shadow">
              <Activity className="h-6 w-6 text-[#2874f0]" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">BlockShop</h1>
              <p className="text-blue-100 text-xs">Blockchain E-Commerce</p>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, brands and more..."
                className="w-full px-4 py-2 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#ff9f00] hover:bg-[#e68a00] text-white p-2 rounded-md transition-colors"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Navigation - Removed as per user request */}

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Notification Bell - For Both Buyers and Sellers */}
            {user && (
              <div className="relative" ref={notificationRef}>
                <Button
                  onClick={() => setShowNotifications(!showNotifications)}
                  variant="outline"
                  size="sm"
                  className="bg-white text-[#2874f0] hover:bg-blue-50 border-0 relative"
                  data-testid="notifications-btn"
                >
                  <Bell className={`h-4 w-4 ${unreadCount > 0 ? 'animate-wiggle' : ''}`} />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
                {showNotifications && (
                  <NotificationDropdown
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onMarkAsRead={markAsRead}
                    onMarkAllAsRead={markAllAsRead}
                    onClear={clearNotification}
                  />
                )}
              </div>
            )}

            {/* Cart Icon */}
            {user && user.role === 'buyer' && (
              <Button
                onClick={() => navigate('/cart')}
                variant="outline"
                size="sm"
                className="bg-white text-[#2874f0] hover:bg-blue-50 border-0 relative"
                data-testid="cart-btn"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {getCartCount() > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {getCartCount()}
                  </Badge>
                )}
              </Button>
            )}

            {/* Wallet Connection */}
            {user && !walletConnected && (
              <Button 
                onClick={handleConnectWallet}
                disabled={connectingWallet}
                variant="outline"
                size="sm"
                className="bg-white text-[#2874f0] hover:bg-blue-50 border-0"
                data-testid="connect-wallet-btn"
              >
                {connectingWallet ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            )}

            {walletConnected && (
              <Badge variant="secondary" className="bg-green-500 text-white" data-testid="wallet-connected-badge">
                <Wallet className="h-3 w-3 mr-1" />
                Wallet Connected
              </Badge>
            )}

            {/* User Section */}
            {user ? (
              <div className="flex items-center space-x-3">
                {/* User Menu Dropdown */}
                {user.role === 'buyer' ? (
                  <BuyerMenu user={user} onLogout={onLogout} />
                ) : (
                  <SellerMenu user={user} onLogout={onLogout} />
                )}
              </div>
            ) : (
              <Button 
                onClick={onLogin}
                className="bg-yellow-400 text-gray-900 hover:bg-yellow-500 font-semibold"
                data-testid="login-btn"
              >
                <User className="h-4 w-4 mr-2" />
                Login
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Category Menu Bar */}
      <div className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-8 py-3 overflow-x-auto">
            <CategoryLink icon="💻" label="Electronics" onClick={() => handleCategoryClick('Electronics')} />
            <CategoryLink icon="📱" label="Mobiles" onClick={() => handleCategoryClick('Mobiles')} />
            <CategoryLink icon="👕" label="Fashion" onClick={() => handleCategoryClick('Fashion')} />
            <CategoryLink icon="🏠" label="Home" onClick={() => handleCategoryClick('Home')} />
            <CategoryLink icon="📚" label="Books" onClick={() => handleCategoryClick('Books')} />
            <CategoryLink icon="⚽" label="Sports" onClick={() => handleCategoryClick('Sports')} />
            <CategoryLink icon="🎮" label="Gaming" onClick={() => handleCategoryClick('Gaming')} />
          </div>
        </div>
      </div>

      {/* Connection Modal */}
      {showConnectionModal && (
        <ConnectionModal
          onClose={() => setShowConnectionModal(false)}
          onConnect={handleConnectionComplete}
        />
      )}
    </header>
  );
}

function CategoryLink({ icon, label, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center space-x-2 text-gray-700 hover:text-[#2874f0] font-medium transition-colors whitespace-nowrap group"
    >
      <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  );
}