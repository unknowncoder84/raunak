import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Building, Globe, Save, 
  Wallet, Bell, Moon, Sun, Shield, Lock, Eye, EyeOff,
  ArrowLeft, CheckCircle, AlertCircle, Trash2, Download,
  Camera, Edit3, CreditCard, History, Settings as SettingsIcon,
  Star, Award, TrendingUp, Package, ShoppingCart, ExternalLink
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import metamaskService from '../services/metamaskService';

/**
 * Comprehensive Settings Page for Both Buyer and Seller
 * Works dynamically with localStorage
 */
export default function SettingsPage({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser || JSON.parse(localStorage.getItem('blockshop_user') || '{}'));
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPassword, setShowPassword] = useState(false);
  
  // Profile Data
  const [profileData, setProfileData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    city: user.city || '',
    state: user.state || '',
    zipCode: user.zipCode || '',
    country: user.country || 'USA',
    bio: user.bio || '',
    storeName: user.storeName || '',
    storeDescription: user.storeDescription || ''
  });

  // Security Data
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Wallet Data
  const [walletData, setWalletData] = useState({
    address: user.walletAddress || '',
    connected: !!user.walletAddress,
    balance: '0.0000',
    network: 'Unknown',
    chainId: null
  });

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    orderUpdates: true,
    promotions: false,
    newsletter: false,
    smsNotifications: false
  });

  // Theme
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Statistics (for display)
  const [userStats, setUserStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    totalEarned: 0,
    rating: 0,
    reviewCount: 0
  });

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedPrefs = JSON.parse(localStorage.getItem(`${user.email}_preferences`) || '{}');
    if (savedPrefs.notifications) {
      setNotifications(savedPrefs.notifications);
    }
    if (savedPrefs.theme) {
      setTheme(savedPrefs.theme);
    }

    // Load user statistics
    loadUserStats();
    
    // Check if wallet is already connected
    checkWalletConnection();
  }, [user.email]);

  const checkWalletConnection = async () => {
    try {
      const account = await metamaskService.getCurrentAccount();
      if (account) {
        const balance = await metamaskService.getBalance(account);
        const network = await metamaskService.getNetworkInfo();
        
        setWalletData({
          address: account,
          connected: true,
          balance: balance.success ? balance.formatted : '0.0000 ETH',
          network: network.success ? network.network : 'Unknown',
          chainId: network.success ? network.chainId : null
        });
        
        // Update user data
        const updatedUser = { ...user, walletAddress: account };
        localStorage.setItem('blockshop_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const loadUserStats = () => {
    try {
      // Get orders from localStorage
      const allOrders = JSON.parse(localStorage.getItem('w3mart_orders') || '[]');
      
      if (user.role === 'buyer') {
        const userOrders = allOrders.filter(order => 
          order.buyer_email?.toLowerCase() === user.email?.toLowerCase()
        );
        
        const totalSpent = userOrders.reduce((sum, order) => 
          sum + parseFloat(order.amount || 0), 0
        );
        
        setUserStats({
          totalOrders: userOrders.length,
          totalSpent: totalSpent,
          totalEarned: 0,
          rating: 4.8, // Mock rating
          reviewCount: Math.floor(userOrders.length * 0.7)
        });
      } else if (user.role === 'seller') {
        const sellerOrders = allOrders.filter(order => 
          order.seller_email?.toLowerCase() === user.email?.toLowerCase()
        );
        
        const totalEarned = sellerOrders
          .filter(order => ['delivered', 'completed'].includes(order.status))
          .reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
        
        setUserStats({
          totalOrders: sellerOrders.length,
          totalSpent: 0,
          totalEarned: totalEarned,
          rating: 4.9, // Mock rating
          reviewCount: Math.floor(sellerOrders.length * 0.8)
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Update user in localStorage
      const updatedUser = {
        ...user,
        ...profileData
      };
      
      localStorage.setItem('blockshop_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Save to preferences
      const prefs = JSON.parse(localStorage.getItem(`${user.email}_preferences`) || '{}');
      prefs.profile = profileData;
      localStorage.setItem(`${user.email}_preferences`, JSON.stringify(prefs));
      
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (securityData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // In demo mode, just show success
      toast.success('Password changed successfully!');
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    setLoading(true);
    try {
      const result = await metamaskService.connectWallet();
      
      if (result.success) {
        const balance = await metamaskService.getBalance(result.address);
        const network = await metamaskService.getNetworkInfo();
        
        setWalletData({
          address: result.address,
          connected: true,
          balance: balance.success ? balance.formatted : '0.0000 ETH',
          network: network.success ? network.network : 'Unknown',
          chainId: result.chainId
        });
        
        // Update user
        const updatedUser = { ...user, walletAddress: result.address };
        localStorage.setItem('blockshop_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        toast.success('MetaMask wallet connected successfully!');
      } else {
        if (result.installUrl) {
          toast.error(result.error, {
            action: {
              label: 'Install MetaMask',
              onClick: () => window.open(result.installUrl, '_blank')
            }
          });
        } else {
          toast.error(result.error);
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      const result = await metamaskService.disconnectWallet();
      
      setWalletData({ 
        address: '', 
        connected: false, 
        balance: '0.0000 ETH',
        network: 'Unknown',
        chainId: null
      });
      
      const updatedUser = { ...user, walletAddress: '' };
      localStorage.setItem('blockshop_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      toast.success('Wallet disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

  const handleManageMetaMask = () => {
    if (metamaskService.isMetaMaskInstalled()) {
      metamaskService.openMetaMask();
      toast.success('Opening MetaMask...');
    } else {
      toast.error('MetaMask is not installed', {
        action: {
          label: 'Install MetaMask',
          onClick: () => window.open('https://metamask.io/download/', '_blank')
        }
      });
    }
  };

  const handleSaveNotifications = () => {
    const prefs = JSON.parse(localStorage.getItem(`${user.email}_preferences`) || '{}');
    prefs.notifications = notifications;
    localStorage.setItem(`${user.email}_preferences`, JSON.stringify(prefs));
    toast.success('Notification preferences saved!');
  };

  const handleToggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark');
    
    const prefs = JSON.parse(localStorage.getItem(`${user.email}_preferences`) || '{}');
    prefs.theme = newTheme;
    localStorage.setItem(`${user.email}_preferences`, JSON.stringify(prefs));
    
    toast.success(`Switched to ${newTheme} mode`);
  };

  const handleExportData = () => {
    const userData = {
      profile: profileData,
      notifications,
      theme,
      wallet: walletData,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `w3mart-settings-${user.email}-${Date.now()}.json`;
    link.click();
    
    toast.success('Settings exported successfully!');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      if (window.confirm('This will permanently delete all your data. Are you absolutely sure?')) {
        // Clear user data
        localStorage.removeItem('blockshop_user');
        localStorage.removeItem(`${user.email}_preferences`);
        toast.success('Account deleted. Redirecting...');
        setTimeout(() => navigate('/login'), 2000);
      }
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: SettingsIcon },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: theme === 'light' ? Sun : Moon }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate(user.role === 'seller' ? '/seller/dashboard' : '/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your account preferences</p>
            </div>
          </div>
          
          <Button onClick={handleExportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <Card className="p-4 h-fit">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Content */}
          <div className="md:col-span-3 space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* User Info Card */}
                <Card className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{user.name || user.email}</h2>
                        <p className="text-gray-600">{user.email}</p>
                        <Badge className={`mt-2 ${user.role === 'seller' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                          {user.role === 'seller' ? '🏪 Seller' : '🛒 Buyer'}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Camera className="h-4 w-4 mr-2" />
                      Change Photo
                    </Button>
                  </div>
                </Card>

                {/* Statistics Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900">{userStats.totalOrders}</p>
                      </div>
                    </div>
                  </Card>

                  {user.role === 'buyer' ? (
                    <Card className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <ShoppingCart className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Spent</p>
                          <p className="text-2xl font-bold text-gray-900">{userStats.totalSpent.toFixed(4)} ETH</p>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Earned</p>
                          <p className="text-2xl font-bold text-gray-900">{userStats.totalEarned.toFixed(4)} ETH</p>
                        </div>
                      </div>
                    </Card>
                  )}

                  <Card className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Star className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Rating</p>
                        <p className="text-2xl font-bold text-gray-900">{userStats.rating}/5</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Award className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Reviews</p>
                        <p className="text-2xl font-bold text-gray-900">{userStats.reviewCount}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                      onClick={() => setActiveTab('profile')}
                    >
                      <Edit3 className="h-6 w-6" />
                      <span>Edit Profile</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                      onClick={() => setActiveTab('wallet')}
                    >
                      <Wallet className="h-6 w-6" />
                      <span>Manage Wallet</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                      onClick={() => setActiveTab('security')}
                    >
                      <Shield className="h-6 w-6" />
                      <span>Security Settings</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                      onClick={() => navigate(user.role === 'seller' ? '/seller/orders' : '/buyer/orders')}
                    >
                      <History className="h-6 w-6" />
                      <span>Order History</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                      onClick={handleExportData}
                    >
                      <Download className="h-6 w-6" />
                      <span>Export Data</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                      onClick={() => setActiveTab('notifications')}
                    >
                      <Bell className="h-6 w-6" />
                      <span>Notifications</span>
                    </Button>
                  </div>
                </Card>

                {/* Account Status */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-900">Email Verified</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-600" />
                        <span className="text-gray-900">Phone Number</span>
                      </div>
                      <Badge className="bg-gray-100 text-gray-800">
                        {profileData.phone ? 'Added' : 'Not Added'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Wallet className="h-5 w-5 text-gray-600" />
                        <span className="text-gray-900">Wallet Connected</span>
                      </div>
                      <Badge className={walletData.connected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {walletData.connected ? 'Connected' : 'Not Connected'}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profileData.city}
                        onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                        placeholder="New York"
                      />
                    </div>

                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={profileData.state}
                        onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                        placeholder="NY"
                      />
                    </div>

                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={profileData.zipCode}
                        onChange={(e) => setProfileData({ ...profileData, zipCode: e.target.value })}
                        placeholder="10001"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      placeholder="123 Main Street, Apt 4B"
                    />
                  </div>

                  {user.role === 'seller' && (
                    <>
                      <div className="mt-4">
                        <Label htmlFor="storeName">Store Name</Label>
                        <Input
                          id="storeName"
                          value={profileData.storeName}
                          onChange={(e) => setProfileData({ ...profileData, storeName: e.target.value })}
                          placeholder="My Awesome Store"
                        />
                      </div>

                      <div className="mt-4">
                        <Label htmlFor="storeDescription">Store Description</Label>
                        <Textarea
                          id="storeDescription"
                          value={profileData.storeDescription}
                          onChange={(e) => setProfileData({ ...profileData, storeDescription: e.target.value })}
                          placeholder="Tell customers about your store..."
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  <div className="mt-4">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                      {loading ? 'Saving...' : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Profile
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={securityData.currentPassword}
                          onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={securityData.newPassword}
                        onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                        placeholder="Enter new password"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={securityData.confirmPassword}
                        onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button onClick={handleChangePassword} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </div>
                </Card>

                <Card className="p-6 border-red-200 bg-red-50">
                  <h3 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h3>
                  <p className="text-sm text-red-700 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button onClick={handleDeleteAccount} variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </Card>
              </motion.div>
            )}

            {/* Wallet Tab */}
            {activeTab === 'wallet' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Blockchain Wallet</h2>
                  
                  {walletData.connected ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-900">Wallet Connected</span>
                        </div>
                        <p className="text-sm font-mono text-gray-700 break-all">
                          {walletData.address}
                        </p>
                      </div>

                      {/* Wallet Stats */}
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-blue-900">Balance</span>
                          </div>
                          <p className="text-lg font-bold text-blue-900">{walletData.balance}</p>
                          <p className="text-sm text-blue-700">Network: {walletData.network}</p>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <TrendingUp className="h-5 w-5 text-purple-600" />
                            <span className="font-medium text-purple-900">Transactions</span>
                          </div>
                          <p className="text-lg font-bold text-purple-900">{userStats.totalOrders}</p>
                          <p className="text-sm text-purple-700">Total completed</p>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Shield className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-green-900">Security</span>
                          </div>
                          <p className="text-lg font-bold text-green-900">High</p>
                          <p className="text-sm text-green-700">MetaMask secured</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button onClick={handleManageMetaMask} className="bg-orange-500 hover:bg-orange-600">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Manage MetaMask Account
                        </Button>
                        <Button onClick={handleDisconnectWallet} variant="outline">
                          Disconnect Wallet
                        </Button>
                        <Button onClick={handleConnectWallet} variant="outline" disabled={loading}>
                          {loading ? 'Connecting...' : 'Change Wallet'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                          <span className="font-semibold text-yellow-900">No Wallet Connected</span>
                        </div>
                        <p className="text-sm text-gray-700">
                          Connect your MetaMask wallet to enable blockchain transactions and secure payments.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">Benefits of connecting your wallet:</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Secure blockchain transactions</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Escrow protection for payments</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Transparent transaction history</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Lower transaction fees</span>
                          </li>
                        </ul>
                      </div>

                      <Button onClick={handleConnectWallet} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                        <Wallet className="h-4 w-4 mr-2" />
                        {loading ? 'Connecting...' : 'Connect Wallet'}
                      </Button>
                    </div>
                  )}
                </Card>

                {/* Wallet Security Tips */}
                <Card className="p-6 bg-blue-50 border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">🔒 Wallet Security Tips</h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p>• Never share your private keys or seed phrase with anyone</p>
                    <p>• Always verify transaction details before confirming</p>
                    <p>• Use hardware wallets for large amounts</p>
                    <p>• Keep your wallet software updated</p>
                    <p>• Enable two-factor authentication when available</p>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification Preferences</h2>
                  
                  <div className="space-y-4">
                    {[
                      { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email' },
                      { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications' },
                      { key: 'orderUpdates', label: 'Order Updates', desc: 'Get notified about order status changes' },
                      { key: 'promotions', label: 'Promotional Offers', desc: 'Receive special deals and discounts' },
                      { key: 'newsletter', label: 'Newsletter', desc: 'Weekly newsletter with updates' },
                      { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Text message alerts' }
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{label}</p>
                          <p className="text-sm text-gray-600">{desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[key]}
                            onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button onClick={handleSaveNotifications} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="h-4 w-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Appearance Settings</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Theme</p>
                        <p className="text-sm text-gray-600">
                          Current: {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                        </p>
                      </div>
                      <Button onClick={handleToggleTheme} variant="outline">
                        {theme === 'light' ? (
                          <>
                            <Moon className="h-4 w-4 mr-2" />
                            Switch to Dark
                          </>
                        ) : (
                          <>
                            <Sun className="h-4 w-4 mr-2" />
                            Switch to Light
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <strong>Note:</strong> Theme preference is saved locally and will persist across sessions.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
