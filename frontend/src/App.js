import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import Header from './components/Header';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import OrdersEnhanced from './pages/OrdersEnhanced';
import TransparencyDashboard from './pages/TransparencyDashboard';
import TransactionSuccess from './pages/TransactionSuccess';
import SellerDashboard from './pages/SellerDashboard'; // Original Seller Dashboard
import BuyerDashboard from './pages/BuyerDashboard'; // Buyer Dashboard with stats and recent orders
import ManageOrders from './pages/ManageOrders';
import BuyerProfile from './pages/BuyerProfile';
import BuyerWallet from './pages/BuyerWallet';
import BuyerReviews from './pages/BuyerReviews';
import BuyerOrdersPage from './pages/BuyerOrdersPage';
import TestOrderPage from './pages/TestOrderPage';
import UserSettings from './pages/UserSettings';
import SellerProfile from './pages/SellerProfile';
import SellerWallet from './pages/SellerWallet';
import SellerProducts from './pages/SellerProducts';
import SellerReviews from './pages/SellerReviews';
import SellerReviewsManagement from './pages/SellerReviewsManagement';
import SellerInventoryManagement from './pages/SellerInventoryManagement';
import SellerOrdersManagement from './pages/SellerOrdersManagement';
import SettingsPage from './pages/SettingsPage';
import CheckoutPage from './pages/CheckoutPage';
import CartPage from './pages/CartPage';
import OrderConfirmation from './pages/OrderConfirmation';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AuthCallback from './pages/AuthCallback';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import WishlistPage from './pages/WishlistPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import { CartProvider } from './contexts/CartContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import NotificationModal from './components/NotificationModal';
import blockchainService from './services/blockchainService';
import supabaseService from './services/supabaseService';
import { initializeDemoProducts } from './data/sampleProducts';
import './App.css';

/**
 * Main App Component
 * KAIRO INTEGRATION: This is the entry point for the blockchain e-commerce platform
 */

function App() {
  const [user, setUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);

  useEffect(() => {
    // Initialize app safely
    initializeApp();
  }, []);

  /**
   * Initialize app with error handling
   */
  const initializeApp = async () => {
    try {
      // Force demo mode for production stability
      localStorage.setItem('REACT_APP_DEMO_MODE', 'true');
      setIsDemoMode(true);
      
      // Check for existing user session
      const savedUser = localStorage.getItem('blockshop_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Error loading user from storage:', error);
          localStorage.removeItem('blockshop_user');
        }
      }

      // Check for admin session
      const savedAdmin = localStorage.getItem('blockshop_admin');
      if (savedAdmin) {
        try {
          setAdminUser(JSON.parse(savedAdmin));
        } catch (error) {
          console.error('Error loading admin from storage:', error);
          localStorage.removeItem('blockshop_admin');
        }
      }

      // Initialize demo products
      initializeDemoProducts();
      
      // App is ready
      setLoading(false);
      
    } catch (error) {
      console.error('App initialization error:', error);
      // Ensure app still loads even if there are errors
      setIsDemoMode(true);
      setLoading(false);
    }
  };

  /**
   * Connect Web3 wallet
   */
  const connectWallet = async () => {
    try {
      const result = await blockchainService.connectWallet();
      if (result.success) {
        setWalletConnected(true);
        toast.success('Wallet Connected', {
          description: `Address: ${result.address.substring(0, 6)}...${result.address.substring(38)}`,
          duration: 3000
        });
      } else {
        toast.warning('Wallet Connection Not Required', {
          description: 'App works in demo mode without MetaMask',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast.info('Demo Mode Active', {
        description: 'MetaMask not required - app works without it',
        duration: 3000
      });
    }
  };

  /**
   * Handle admin login
   */
  const handleAdminLogin = (adminData) => {
    setAdminUser(adminData);
    localStorage.setItem('blockshop_admin', JSON.stringify(adminData));
  };

  /**
   * Handle admin logout
   */
  const handleAdminLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('blockshop_admin');
  };

  /**
   * Handle user login
   */
  const handleLogin = (userData) => {
    setUser(userData);
    // Save to localStorage
    localStorage.setItem('blockshop_user', JSON.stringify(userData));
    toast.success('Welcome!', {
      description: `Logged in as ${userData.role}`
    });
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    await supabaseService.logout();
    setUser(null);
    setWalletConnected(false);
    localStorage.removeItem('blockshop_user');
    toast.info('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading BlockShop...</p>
        </div>
      </div>
    );
  }

  // Add error boundary
  try {

  return (
    <div className="App min-h-screen bg-gray-50">
      <BrowserRouter>
        <ThemeProvider>
          <NotificationProvider user={user}>
            <CartProvider>
              <NotificationModalWrapper />
              {user && (
                <Header 
                  user={user}
                  isDemoMode={isDemoMode}
                  walletConnected={walletConnected}
                  onLogin={() => {}}
                  onLogout={handleLogout}
                  onConnectWallet={connectWallet}
                  onSearch={setSearchQuery}
                  onCategorySelect={setSelectedCategory}
                />
              )}
          
          <Routes>
            {/* Admin Routes */}
            <Route path="/admin/login" element={
              adminUser ? <Navigate to="/admin/dashboard" /> : <AdminLogin onAdminLogin={handleAdminLogin} />
            } />
            <Route path="/admin/dashboard" element={
              adminUser ? <AdminDashboard adminUser={adminUser} onLogout={handleAdminLogout} /> : <Navigate to="/admin/login" />
            } />

            {/* Public Routes */}
            <Route path="/login" element={
              user ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />
            } />
            <Route path="/signup" element={
              user ? <Navigate to="/" /> : <SignupPage onLogin={handleLogin} />
            } />
            <Route path="/auth/callback" element={<AuthCallback onLogin={handleLogin} />} />

            {/* Protected Routes */}
            <Route path="/" element={
              user ? (
                user.role === 'seller' ? <Navigate to="/dashboard" /> : <Home user={user} isDemoMode={isDemoMode} searchQuery={searchQuery} selectedCategory={selectedCategory} />
              ) : <Navigate to="/login" />
            } />
            <Route path="/home" element={
              user && user.role === 'buyer' ? <Home user={user} isDemoMode={isDemoMode} searchQuery={searchQuery} selectedCategory={selectedCategory} /> : <Navigate to="/login" />
            } />
            <Route path="/product/:id" element={
              user && user.role === 'buyer' ? <ProductDetail user={user} isDemoMode={isDemoMode} /> : <Navigate to="/login" />
            } />
            <Route path="/cart" element={
              user && user.role === 'buyer' ? <CartPage user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/checkout" element={
              user && user.role === 'buyer' ? <CheckoutPage user={user} isDemoMode={isDemoMode} /> : <Navigate to="/login" />
            } />
            <Route path="/order-confirmation" element={
              user && user.role === 'buyer' ? <OrderConfirmation /> : <Navigate to="/login" />
            } />
            {/* Unified Dashboard - Role-Based Routing */}
            <Route path="/dashboard" element={
              user ? (
                user.role === 'seller' ? 
                  <SellerDashboard user={user} isDemoMode={isDemoMode} /> : 
                  <Navigate to="/" />
              ) : <Navigate to="/login" />
            } />
            {/* Seller Orders Management */}
            <Route path="/orders/manage" element={
              user && user.role === 'seller' ? <ManageOrders user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/products/manage" element={
              user && user.role === 'seller' ? <SellerProducts user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/reviews" element={
              user && user.role === 'seller' ? <SellerReviews user={user} /> : <Navigate to="/login" />
            } />
            {/* New Comprehensive Seller Management Routes */}
            <Route path="/seller/orders/manage" element={
              user && user.role === 'seller' ? <SellerOrdersManagement user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/seller/reviews/manage" element={
              user && user.role === 'seller' ? <SellerReviewsManagement user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/seller/inventory" element={
              user && user.role === 'seller' ? <SellerInventoryManagement user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/orders" element={
              user ? <OrdersEnhanced user={user} isDemoMode={isDemoMode} /> : <Navigate to="/login" />
            } />
            {/* Buyer Routes */}
            <Route path="/buyer/profile" element={
              user && user.role === 'buyer' ? <BuyerProfile user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/buyer/orders" element={
              user && user.role === 'buyer' ? <BuyerOrdersPage user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/test-order" element={
              user ? <TestOrderPage user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/buyer/history" element={
              user && user.role === 'buyer' ? <OrdersEnhanced user={user} isDemoMode={isDemoMode} /> : <Navigate to="/login" />
            } />
            <Route path="/buyer/reviews" element={
              user && user.role === 'buyer' ? <BuyerReviews user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/buyer/wallet" element={
              user && user.role === 'buyer' ? <BuyerWallet user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/buyer/settings" element={
              user && user.role === 'buyer' ? <SettingsPage user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/wishlist" element={
              user ? <WishlistPage user={user} /> : <Navigate to="/login" />
            } />
            {/* Seller Routes */}
            <Route path="/seller/dashboard" element={
              user && user.role === 'seller' ? <SellerDashboard user={user} isDemoMode={isDemoMode} /> : <Navigate to="/login" />
            } />
            <Route path="/seller/analytics" element={
              user && user.role === 'seller' ? <AnalyticsDashboard user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/seller/products" element={
              user && user.role === 'seller' ? <SellerProducts user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/seller/orders" element={
              user && user.role === 'seller' ? <ManageOrders user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/seller/reviews" element={
              user && user.role === 'seller' ? <SellerReviews user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/seller/profile" element={
              user && user.role === 'seller' ? <SellerProfile user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/seller/wallet" element={
              user && user.role === 'seller' ? <SellerWallet user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/seller/settings" element={
              user && user.role === 'seller' ? <SettingsPage user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/transparency" element={
              user ? <TransparencyDashboard isDemoMode={isDemoMode} /> : <Navigate to="/login" />
            } />
            <Route path="/transaction-success" element={
              user ? <TransactionSuccess /> : <Navigate to="/login" />
            } />
            
            {/* Fallback route */}
            <Route path="*" element={
              user ? <Navigate to="/" /> : <Navigate to="/login" />
            } />
          </Routes>

          <Toaster position="top-right" richColors />
          </CartProvider>
        </NotificationProvider>
      </ThemeProvider>
      </BrowserRouter>
    </div>
  );
  } catch (error) {
    console.error('App render error:', error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">BlockShop</h1>
          <p className="text-gray-600">Loading application...</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
}

// Wrapper component to use notification context
function NotificationModalWrapper() {
  const { notifications, showNotificationModal, setShowNotificationModal, markAsRead } = useNotifications();
  const latestNotification = notifications[0];

  return (
    <>
      {showNotificationModal && latestNotification && (
        <NotificationModal
          notification={latestNotification}
          onClose={() => setShowNotificationModal(false)}
          onMarkAsRead={markAsRead}
        />
      )}
    </>
  );
}

export default App;