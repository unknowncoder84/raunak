import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// V2 Components
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPageV2 from './pages/LoginPageV2';
import SignupPageV2 from './pages/SignupPageV2';
import BuyerOrdersPage from './pages/BuyerOrdersPage';
import UserSettings from './pages/UserSettings';
import SellerDashboardV2 from './pages/SellerDashboardV2';
import SellerProductsV2 from './pages/SellerProductsV2';

// Existing Components (keep for compatibility)
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmation from './pages/OrderConfirmation';
import SellerOrdersPage from './pages/SellerOrdersPage';
import SellerReviews from './pages/SellerReviews';
import TransactionSuccess from './pages/TransactionSuccess';

// Contexts
import { CartProvider } from './contexts/CartContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Services
import supabaseServiceV2 from './services/supabaseService_v2';
import blockchainService from './services/blockchainService';
import { initializeDemoProducts } from './data/sampleProducts';

import './App.css';

function AppV2() {
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Force demo mode
      if (!localStorage.getItem('REACT_APP_DEMO_MODE')) {
        localStorage.setItem('REACT_APP_DEMO_MODE', 'true');
      }

      // Initialize blockchain
      try {
        await blockchainService.initialize();
      } catch (error) {
        console.warn('Blockchain init skipped:', error);
      }

      // Initialize demo products
      initializeDemoProducts();

      // Check demo mode
      const isDemo = blockchainService.isDemo() || supabaseServiceV2.isDemo();
      setIsDemoMode(isDemo);

      if (isDemo) {
        toast.info('Demo Mode Active', {
          description: 'Using mock data for presentation',
          duration: 3000
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('App initialization error:', error);
      setIsDemoMode(true);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
            Initializing W3 Mart...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="App min-h-screen bg-gray-50 dark:bg-gray-900">
        <BrowserRouter>
          <NotificationProvider>
            <CartProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPageV2 />} />
                <Route path="/signup" element={<SignupPageV2 />} />

                {/* Buyer Routes */}
                <Route path="/buyer/dashboard" element={<ProtectedRoute role="buyer"><BuyerOrdersPage /></ProtectedRoute>} />
                <Route path="/buyer/orders" element={<ProtectedRoute role="buyer"><BuyerOrdersPage /></ProtectedRoute>} />
                <Route path="/buyer/history" element={<ProtectedRoute role="buyer"><BuyerOrdersPage /></ProtectedRoute>} />
                <Route path="/buyer/settings" element={<ProtectedRoute role="buyer"><UserSettings /></ProtectedRoute>} />
                <Route path="/buyer/profile" element={<ProtectedRoute role="buyer"><UserSettings /></ProtectedRoute>} />
                <Route path="/buyer/wallet" element={<ProtectedRoute role="buyer"><UserSettings /></ProtectedRoute>} />

                {/* Buyer Shopping Routes */}
                <Route path="/home" element={<ProtectedRoute role="buyer"><Home isDemoMode={isDemoMode} /></ProtectedRoute>} />
                <Route path="/product/:id" element={<ProtectedRoute role="buyer"><ProductDetail isDemoMode={isDemoMode} /></ProtectedRoute>} />
                <Route path="/cart" element={<ProtectedRoute role="buyer"><CartPage /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute role="buyer"><CheckoutPage isDemoMode={isDemoMode} /></ProtectedRoute>} />
                <Route path="/order-confirmation" element={<ProtectedRoute role="buyer"><OrderConfirmation /></ProtectedRoute>} />
                <Route path="/transaction-success" element={<ProtectedRoute role="buyer"><TransactionSuccess /></ProtectedRoute>} />

                {/* Seller Routes */}
                <Route path="/seller/dashboard" element={<ProtectedRoute role="seller"><SellerDashboardV2 /></ProtectedRoute>} />
                <Route path="/seller/products" element={<ProtectedRoute role="seller"><SellerProductsV2 /></ProtectedRoute>} />
                <Route path="/seller/products/add" element={<ProtectedRoute role="seller"><SellerProductsV2 /></ProtectedRoute>} />
                <Route path="/seller/orders" element={<ProtectedRoute role="seller"><SellerOrdersPage /></ProtectedRoute>} />
                <Route path="/seller/reviews" element={<ProtectedRoute role="seller"><SellerReviews /></ProtectedRoute>} />
                <Route path="/seller/settings" element={<ProtectedRoute role="seller"><UserSettings /></ProtectedRoute>} />
                <Route path="/seller/profile" element={<ProtectedRoute role="seller"><UserSettings /></ProtectedRoute>} />
                <Route path="/seller/wallet" element={<ProtectedRoute role="seller"><UserSettings /></ProtectedRoute>} />

                {/* Default Route */}
                <Route path="/" element={<DefaultRedirect />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>

              <Toaster position="top-right" richColors />
            </CartProvider>
          </NotificationProvider>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

// Protected Route Component
function ProtectedRoute({ children, role }) {
  const user = supabaseServiceV2.getCurrentUser();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'seller' ? '/seller/dashboard' : '/buyer/dashboard'} />;
  }

  return children;
}

// Default Redirect Component
function DefaultRedirect() {
  const user = supabaseServiceV2.getCurrentUser();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role === 'seller') {
    return <Navigate to="/seller/dashboard" />;
  }

  return <Navigate to="/home" />;
}

export default AppV2;
