import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Zap, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import metamaskService from '../services/metamaskService';

/**
 * Connection Modal - Dual Mode Selection
 * Allows users to choose between MetaMask connection or Demo Mode
 */
export default function ConnectionModal({ onClose, onConnect }) {
  const [connecting, setConnecting] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);

  const handleMetaMaskConnect = async () => {
    setConnecting(true);
    setSelectedMode('metamask');
    
    try {
      const result = await metamaskService.connectWallet();
      
      if (result.success) {
        toast.success('MetaMask Connected!', {
          description: `Address: ${result.address.substring(0, 6)}...${result.address.substring(38)}`,
          duration: 4000
        });
        
        // Keep demo mode active for orders, but use real MetaMask for wallet
        // localStorage.setItem('REACT_APP_DEMO_MODE', 'false');
        
        onConnect({ mode: 'metamask', address: result.address });
        onClose();
      } else {
        if (result.installUrl) {
          toast.error('MetaMask Not Installed', {
            description: result.error,
            action: {
              label: 'Install MetaMask',
              onClick: () => window.open(result.installUrl, '_blank')
            }
          });
        } else {
          toast.error('Connection Failed', {
            description: result.error || 'Please try again'
          });
        }
      }
    } catch (error) {
      console.error('MetaMask connection error:', error);
      toast.error('Connection Error', {
        description: 'Failed to connect to MetaMask'
      });
    } finally {
      setConnecting(false);
      setSelectedMode(null);
    }
  };

  const handleDemoMode = () => {
    setConnecting(true);
    setSelectedMode('demo');
    
    // Set demo mode to true
    localStorage.setItem('REACT_APP_DEMO_MODE', 'true');
    
    toast.success('Demo Mode Activated', {
      description: 'Using mock blockchain data for presentation',
      duration: 4000
    });
    
    onConnect({ mode: 'demo', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' });
    
    setTimeout(() => {
      setConnecting(false);
      setSelectedMode(null);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="w-full max-w-md relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-8 w-8 text-[#2874f0]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect to BlockShop</h2>
              <p className="text-gray-600">Choose your connection method</p>
            </div>

            {/* Connection Options */}
            <div className="space-y-4">
              {/* MetaMask Option */}
              <motion.button
                onClick={handleMetaMaskConnect}
                disabled={connecting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-6 border-2 rounded-xl transition-all ${
                  selectedMode === 'metamask'
                    ? 'border-[#2874f0] bg-blue-50'
                    : 'border-gray-200 hover:border-[#2874f0] hover:bg-blue-50'
                } ${connecting && selectedMode !== 'metamask' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-3 rounded-lg">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-gray-900 text-lg">Connect MetaMask</h3>
                    <p className="text-sm text-gray-600">Real testnet transactions</p>
                  </div>
                  {selectedMode === 'metamask' && connecting && (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2874f0]"></div>
                  )}
                </div>
                <div className="mt-3 text-xs text-gray-500 text-left">
                  • Requires MetaMask extension
                  • Real blockchain transactions
                  • Sepolia testnet supported
                </div>
              </motion.button>

              {/* Demo Mode Option */}
              <motion.button
                onClick={handleDemoMode}
                disabled={connecting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-6 border-2 rounded-xl transition-all ${
                  selectedMode === 'demo'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-500 hover:bg-green-50'
                } ${connecting && selectedMode !== 'demo' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-green-400 to-green-600 p-3 rounded-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-gray-900 text-lg">Use Demo Mode</h3>
                    <p className="text-sm text-gray-600">Mock data for presentation</p>
                  </div>
                  {selectedMode === 'demo' && connecting && (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                  )}
                </div>
                <div className="mt-3 text-xs text-gray-500 text-left">
                  • No wallet required
                  • Instant transactions
                  • Perfect for demos
                </div>
              </motion.button>
            </div>

            {/* Info Footer */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 text-center">
                🔒 Your connection is secure. We never store your private keys.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
