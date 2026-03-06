import { useState } from 'react';
import { Wallet, Copy, ExternalLink, TrendingUp, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import metamaskService from '../services/metamaskService';

export default function SellerWallet({ user }) {
  const [walletAddress, setWalletAddress] = useState(user?.walletAddress || null);
  const [balance, setBalance] = useState('0.0000');
  const [earnings, setEarnings] = useState('0.0000');
  const [connecting, setConnecting] = useState(false);

  const handleConnectWallet = async () => {
    setConnecting(true);
    try {
      const result = await metamaskService.connectWallet();
      if (result.success) {
        setWalletAddress(result.address);
        toast.success('Wallet connected successfully!');
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
      toast.error('Error connecting wallet');
    } finally {
      setConnecting(false);
    }
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.success('Address copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Seller Wallet</h1>
          <p className="text-gray-600">Manage your earnings and wallet</p>
        </div>

        {!walletAddress ? (
          <Card className="p-12 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Connect your MetaMask wallet to receive payments from customers
            </p>
            <Button
              onClick={handleConnectWallet}
              disabled={connecting}
              className="bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {connecting ? 'Connecting...' : 'Connect MetaMask Wallet'}
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <Card className="p-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm mb-2">Total Earnings</p>
                    <h2 className="text-4xl font-bold mb-2">{earnings} ETH</h2>
                    <p className="text-green-100 text-sm">From completed orders</p>
                  </div>
                  <div className="bg-white/20 p-4 rounded-full">
                    <DollarSign className="h-12 w-12" />
                  </div>
                </div>
              </Card>

              <Card className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm mb-2">Wallet Balance</p>
                    <h2 className="text-4xl font-bold mb-2">{balance} ETH</h2>
                    <p className="text-blue-100 text-sm">≈ $0.00 USD</p>
                  </div>
                  <div className="bg-white/20 p-4 rounded-full">
                    <Wallet className="h-12 w-12" />
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Wallet Address</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-100 p-4 rounded-lg font-mono text-sm">
                  {walletAddress}
                </div>
                <Button
                  onClick={copyAddress}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => window.open(`https://etherscan.io/address/${walletAddress}`, '_blank')}
                  variant="outline"
                  size="sm"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Button className="h-16 bg-green-600 hover:bg-green-700">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Withdraw Earnings
                </Button>
                <Button className="h-16 bg-blue-600 hover:bg-blue-700">
                  <ExternalLink className="h-5 w-5 mr-2" />
                  View on Etherscan
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
