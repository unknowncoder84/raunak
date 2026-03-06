import { useState, useEffect } from 'react';
import { Activity, TrendingUp, Shield, ExternalLink, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import blockchainService from '../services/blockchainService';

/**
 * Transparency Dashboard - Real-time blockchain visibility
 */
export default function TransparencyDashboard({ isDemoMode }) {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    escrowAmount: 0,
    verifiedReviews: 0
  });

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const loadBlockchainData = () => {
    // In demo mode, use mock data
    const mockEvents = blockchainService.getMockBlockchainEvents();
    setEvents(mockEvents);
    setStats({
      totalOrders: 1247,
      escrowAmount: 3.45,
      verifiedReviews: 892
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="transparency-title">
            Transparency Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time blockchain events and platform statistics
          </p>
        </div>

        {isDemoMode && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3" data-testid="demo-warning">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">Demo Mode Active</h3>
              <p className="text-sm text-yellow-800">
                Showing mock blockchain data. Connect your wallet and configure blockchain RPC to see live data.
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Activity className="h-8 w-8" />}
            title="Total Orders"
            value={stats.totalOrders.toLocaleString()}
            subtitle="On-chain transactions"
            color="blue"
          />
          <StatCard
            icon={<Shield className="h-8 w-8" />}
            title="Escrow Amount"
            value={`${stats.escrowAmount} ETH`}
            subtitle="Currently secured"
            color="green"
          />
          <StatCard
            icon={<TrendingUp className="h-8 w-8" />}
            title="Verified Reviews"
            value={stats.verifiedReviews.toLocaleString()}
            subtitle="Blockchain-verified"
            color="purple"
          />
        </div>

        {/* Recent Blockchain Events */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Blockchain Events</h2>
          
          <div className="space-y-4">
            {events.map((event, index) => (
              <BlockchainEvent key={index} event={event} />
            ))}
          </div>
        </Card>

        {/* How It Works */}
        <Card className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How Blockchain Escrow Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Step
              number="1"
              title="Payment Locked"
              description="When you purchase, your payment is locked in a smart contract, not sent to the seller."
            />
            <Step
              number="2"
              title="Seller Ships"
              description="Seller marks the order as shipped. Payment remains in escrow during transit."
            />
            <Step
              number="3"
              title="Delivery Confirmed"
              description="You confirm delivery, and the smart contract automatically releases payment to the seller."
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm font-medium text-gray-700">{title}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </Card>
  );
}

function BlockchainEvent({ event }) {
  const getEventColor = (type) => {
    switch (type) {
      case 'OrderCreated': return 'bg-blue-100 text-blue-800';
      case 'PaymentEscrowed': return 'bg-yellow-100 text-yellow-800';
      case 'OrderShipped': return 'bg-purple-100 text-purple-800';
      case 'OrderDelivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow" data-testid="blockchain-event">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <Badge className={getEventColor(event.type)}>
              {event.type}
            </Badge>
            <span className="text-xs text-gray-500">
              {new Date(event.timestamp).toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-2">{event.details}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>Block: #{event.blockNumber}</span>
            <span className="font-mono truncate max-w-[200px]">
              TX: {event.txHash.substring(0, 20)}...
            </span>
          </div>
        </div>
        <button
          className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
          onClick={() => window.open(`https://etherscan.io/tx/${event.txHash}`, '_blank')}
        >
          View
          <ExternalLink className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
}

function Step({ number, title, description }) {
  return (
    <div className="text-center">
      <div className="bg-[#2874f0] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
        {number}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}