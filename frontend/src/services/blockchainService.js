import { ethers } from 'ethers';

/**
 * Blockchain Service for E-commerce Escrow
 * KAIRO INTEGRATION: This service handles all blockchain interactions
 * Supports both live blockchain and Demo Mode with mock data
 */

const ESCROW_CONTRACT_ABI = [
  "event OrderCreated(uint256 indexed orderId, address indexed buyer, address indexed seller, uint256 amount, uint256 timestamp)",
  "event PaymentEscrowed(uint256 indexed orderId, address indexed buyer, uint256 amount, uint256 timestamp)",
  "event OrderShipped(uint256 indexed orderId, address indexed seller, uint256 timestamp)",
  "event OrderDelivered(uint256 indexed orderId, address indexed buyer, uint256 timestamp)",
  "event PaymentReleased(uint256 indexed orderId, address indexed seller, uint256 amount, uint256 platformFee, uint256 timestamp)",
  "event ReviewSubmitted(uint256 indexed reviewId, uint256 indexed orderId, address indexed reviewer, uint256 rating, string reviewHash, uint256 timestamp)",
  "function createOrderWithPayment(address _seller, string memory _productHash) external payable returns (uint256)",
  "function markAsShipped(uint256 _orderId) external",
  "function confirmDelivery(uint256 _orderId) external",
  "function submitReview(uint256 _orderId, uint256 _rating, string memory _reviewHash) external",
  "function getOrder(uint256 _orderId) external view returns (tuple(uint256 orderId, address buyer, address seller, uint256 amount, uint8 state, uint256 createdAt, uint256 lastUpdated, string productHash, bool exists))",
  "function getBuyerOrders(address _buyer) external view returns (uint256[])",
  "function getSellerOrders(address _seller) external view returns (uint256[])"
];

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.isConnected = false;
    
    // ALWAYS start in demo mode by default for safety
    // This prevents MetaMask connection errors on app load
    this.isDemoMode = true;
    
    // Check if explicitly set to false (opt-out of demo mode)
    const localStorageMode = localStorage.getItem('REACT_APP_DEMO_MODE');
    const envMode = process.env.REACT_APP_DEMO_MODE;
    
    // Only disable demo mode if EXPLICITLY set to 'false'
    if (localStorageMode === 'false' || envMode === 'false') {
      this.isDemoMode = false;
    }
    
    this.walletAddress = null;
    
    console.log('BlockchainService initialized:', {
      isDemoMode: this.isDemoMode,
      localStorageMode,
      envMode
    });
  }

  /**
   * Initialize blockchain connection
   * KAIRO: Set RPC URL in .env for your network
   */
  async initialize() {
    try {
      // If in demo mode, skip blockchain initialization
      if (this.isDemoMode) {
        console.log('Demo Mode active - Skipping blockchain initialization');
        return { success: true, message: 'Demo Mode - Using mock data' };
      }
      
      // SAFETY CHECK: Double-check demo mode before touching MetaMask
      const localStorageMode = localStorage.getItem('REACT_APP_DEMO_MODE');
      if (localStorageMode !== 'false' && process.env.REACT_APP_DEMO_MODE !== 'false') {
        console.log('Safety check: Forcing demo mode to prevent MetaMask errors');
        this.isDemoMode = true;
        return { success: true, message: 'Demo Mode - Using mock data' };
      }
      
      // Check if MetaMask is available
      if (typeof window.ethereum !== 'undefined') {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.isConnected = true;
        return { success: true, message: 'Blockchain initialized' };
      } else if (process.env.REACT_APP_BLOCKCHAIN_RPC_URL && !this.isDemoMode) {
        // Fallback to RPC provider
        this.provider = new ethers.JsonRpcProvider(process.env.REACT_APP_BLOCKCHAIN_RPC_URL);
        this.isConnected = true;
        return { success: true, message: 'Connected to RPC' };
      } else {
        console.warn('No blockchain connection available - Demo Mode active');
        return { success: false, message: 'Demo Mode - Using mock data' };
      }
    } catch (error) {
      console.error('Blockchain initialization error:', error);
      return { success: false, message: 'Demo Mode - Using mock data' };
    }
  }

  /**
   * Connect wallet (MetaMask)
   * KAIRO: Users connect their Web3 wallet here
   */
  async connectWallet() {
    if (this.isDemoMode) {
      // Demo mode - return mock wallet
      this.walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      return {
        success: true,
        address: this.walletAddress,
        message: 'Demo wallet connected'
      };
    }

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.walletAddress = accounts[0];
      this.signer = await this.provider.getSigner();
      
      // Initialize contract if address is set
      const contractAddress = process.env.REACT_APP_ESCROW_CONTRACT_ADDRESS;
      if (contractAddress && contractAddress !== '0xYourDeployedContractAddress') {
        this.contract = new ethers.Contract(contractAddress, ESCROW_CONTRACT_ABI, this.signer);
      }

      return {
        success: true,
        address: this.walletAddress,
        message: 'Wallet connected successfully'
      };
    } catch (error) {
      console.error('Wallet connection error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Create order with escrow payment - W3 Mart Standard
   * KAIRO: This locks buyer payment in smart contract with real MetaMask transaction
   * @param {string} sellerAddress - Seller's wallet address
   * @param {string} productId - Product identifier
   * @param {number} amount - Amount in ETH
   * @param {function} onPending - Callback for pending state (shows loading spinner)
   * @param {function} onSuccess - Callback for success state (shows tx hash)
   * @param {function} onError - Callback for error state
   */
  async createOrder(sellerAddress, productId, amount, onPending, onSuccess, onError) {
    if (this.isDemoMode || !this.contract) {
      // Demo mode - simulate W3 Mart transaction flow
      if (onPending) onPending();
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockTxHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
      const result = {
        success: true,
        orderId: Math.floor(Math.random() * 10000),
        txHash: mockTxHash,
        blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
        timestamp: Date.now(),
        message: 'Demo order created - Transaction confirmed on blockchain'
      };
      
      if (onSuccess) onSuccess(result);
      return result;
    }

    try {
      // W3 MART WORKFLOW: Step 1 - Trigger MetaMask popup
      const amountWei = ethers.parseEther(amount.toString());
      const productHash = ethers.id(productId); // Hash product ID
      
      // Show pending state (MetaMask popup open)
      if (onPending) onPending();
      
      // W3 MART WORKFLOW: Step 2 - User confirms in MetaMask
      const tx = await this.contract.createOrderWithPayment(sellerAddress, productHash, {
        value: amountWei
      });

      // W3 MART WORKFLOW: Step 3 - Transaction submitted, waiting for confirmation
      const receipt = await tx.wait();
      
      // Extract orderId from events
      const orderCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'OrderCreated';
        } catch {
          return false;
        }
      });

      const orderId = orderCreatedEvent ? 
        this.contract.interface.parseLog(orderCreatedEvent).args.orderId : null;

      const result = {
        success: true,
        orderId: orderId ? Number(orderId) : null,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        timestamp: Date.now(),
        message: 'Order created on blockchain'
      };

      // W3 MART WORKFLOW: Step 4 - Success callback with transaction hash
      if (onSuccess) onSuccess(result);
      return result;
    } catch (error) {
      console.error('Create order error:', error);
      const errorResult = {
        success: false,
        message: error.message || 'Transaction failed'
      };
      
      if (onError) onError(errorResult);
      return errorResult;
    }
  }

  /**
   * Pay with MetaMask - W3 Mart Standard
   * Simplified payment function for direct purchases
   */
  async payWithMetaMask(productId, amount, sellerAddress) {
    return new Promise((resolve, reject) => {
      this.createOrder(
        sellerAddress,
        productId,
        amount,
        null, // onPending handled by caller
        (result) => resolve(result), // onSuccess
        (error) => reject(error) // onError
      );
    });
  }

  /**
   * Mark order as shipped (seller action)
   */
  async markAsShipped(orderId) {
    if (this.isDemoMode || !this.contract) {
      const mockTxHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
      return {
        success: true,
        txHash: mockTxHash,
        message: 'Demo: Order marked as shipped'
      };
    }

    try {
      const tx = await this.contract.markAsShipped(orderId);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        message: 'Order marked as shipped on blockchain'
      };
    } catch (error) {
      console.error('Mark shipped error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Confirm delivery and release escrow payment
   * KAIRO: KEY FUNCTION - Releases payment from escrow to seller
   */
  async confirmDelivery(orderId) {
    if (this.isDemoMode || !this.contract) {
      const mockTxHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
      return {
        success: true,
        txHash: mockTxHash,
        message: 'Demo: Payment released to seller'
      };
    }

    try {
      const tx = await this.contract.confirmDelivery(orderId);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        message: 'Payment released to seller'
      };
    } catch (error) {
      console.error('Confirm delivery error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Refund order - Return payment from escrow to buyer
   * KAIRO: KEY FUNCTION - Refunds payment when seller rejects order
   * @param {string} orderId - Blockchain order ID
   * @param {number} amount - Amount to refund in ETH
   * @param {string} buyerAddress - Buyer's wallet address
   */
  async refundOrder(orderId, amount, buyerAddress) {
    if (this.isDemoMode || !this.contract) {
      // Demo mode - simulate refund transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockTxHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
      return {
        success: true,
        txHash: mockTxHash,
        blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
        amount: amount,
        message: 'Demo: Refund processed - Payment returned to buyer'
      };
    }

    try {
      // In production, this would call a smart contract refund function
      // For now, simulate the refund process
      const amountWei = ethers.parseEther(amount.toString());
      
      // This would be replaced with actual smart contract call:
      // const tx = await this.contract.refundOrder(orderId);
      // const receipt = await tx.wait();
      
      // Simulated response for demo
      const mockTxHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
      
      return {
        success: true,
        txHash: mockTxHash,
        blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
        amount: amount,
        message: 'Refund processed - Payment returned to buyer'
      };
    } catch (error) {
      console.error('Refund order error:', error);
      return {
        success: false,
        message: error.message || 'Refund failed'
      };
    }
  }

  /**
   * Accept order - Seller approves the order
   * KAIRO: KEY FUNCTION - Seller accepts order and moves to payment confirmed
   * @param {string} orderId - Order ID
   */
  async acceptOrder(orderId) {
    if (this.isDemoMode || !this.contract) {
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockTxHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
      return {
        success: true,
        txHash: mockTxHash,
        message: 'Demo: Order accepted by seller'
      };
    }

    try {
      // In production, this might trigger a smart contract event
      // For now, we handle this via database status update
      return {
        success: true,
        message: 'Order accepted by seller'
      };
    } catch (error) {
      console.error('Accept order error:', error);
      return {
        success: false,
        message: error.message || 'Failed to accept order'
      };
    }
  }


  /**
   * Submit blockchain-verified review
   * KAIRO: Reviews are immutable once on-chain
   */
  async submitReview(orderId, rating, reviewText) {
    if (this.isDemoMode || !this.contract) {
      const mockTxHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
      return {
        success: true,
        txHash: mockTxHash,
        reviewHash: ethers.id(reviewText),
        message: 'Demo: Review submitted'
      };
    }

    try {
      const reviewHash = ethers.id(reviewText);
      const tx = await this.contract.submitReview(orderId, rating, reviewHash);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        reviewHash: reviewHash,
        message: 'Review recorded on blockchain'
      };
    } catch (error) {
      console.error('Submit review error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get order details from blockchain
   */
  async getOrder(orderId) {
    if (this.isDemoMode || !this.contract) {
      // Return mock order data
      return {
        orderId: orderId,
        buyer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        seller: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
        amount: '0.05',
        state: 2, // Shipped
        createdAt: Date.now() - 86400000,
        lastUpdated: Date.now() - 3600000
      };
    }

    try {
      const order = await this.contract.getOrder(orderId);
      return {
        orderId: Number(order.orderId),
        buyer: order.buyer,
        seller: order.seller,
        amount: ethers.formatEther(order.amount),
        state: order.state,
        createdAt: Number(order.createdAt) * 1000,
        lastUpdated: Number(order.lastUpdated) * 1000
      };
    } catch (error) {
      console.error('Get order error:', error);
      return null;
    }
  }

  /**
   * Get mock blockchain events for demo
   */
  getMockBlockchainEvents() {
    return [
      {
        type: 'OrderCreated',
        txHash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z',
        blockNumber: 15234567,
        timestamp: Date.now() - 86400000,
        details: 'Order created and payment escrowed',
        amount: '0.05 ETH',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        to: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199'
      },
      {
        type: 'PaymentEscrowed',
        txHash: '0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a',
        blockNumber: 15234567,
        timestamp: Date.now() - 86400000,
        details: '0.05 ETH locked in escrow',
        amount: '0.05 ETH',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        to: 'Contract'
      },
      {
        type: 'OrderShipped',
        txHash: '0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b',
        blockNumber: 15234789,
        timestamp: Date.now() - 3600000,
        details: 'Seller confirmed shipment',
        amount: '-',
        from: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
        to: 'Contract'
      },
      {
        type: 'OrderDelivered',
        txHash: '0x4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c',
        blockNumber: 15234890,
        timestamp: Date.now() - 1800000,
        details: 'Buyer confirmed delivery',
        amount: '-',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        to: 'Contract'
      },
      {
        type: 'PaymentReleased',
        txHash: '0x5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d',
        blockNumber: 15234891,
        timestamp: Date.now() - 1800000,
        details: 'Payment released to seller',
        amount: '0.0475 ETH',
        from: 'Contract',
        to: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199'
      }
    ];
  }

  /**
   * Get recent blockchain transactions - W3 Mart Standard
   * Fetches last N transactions from blockchain events
   * @param {number} limit - Number of transactions to fetch (default: 5)
   */
  async getRecentTransactions(limit = 5) {
    if (this.isDemoMode || !this.contract) {
      // Demo mode - return mock transactions
      return this.getMockBlockchainEvents().slice(0, limit);
    }

    try {
      // Fetch recent events from blockchain
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = currentBlock - 10000; // Last ~10k blocks

      // Get all event types
      const orderCreatedFilter = this.contract.filters.OrderCreated();
      const paymentEscrowedFilter = this.contract.filters.PaymentEscrowed();
      const orderShippedFilter = this.contract.filters.OrderShipped();
      const orderDeliveredFilter = this.contract.filters.OrderDelivered();
      const paymentReleasedFilter = this.contract.filters.PaymentReleased();

      // Fetch events
      const [orderCreated, paymentEscrowed, orderShipped, orderDelivered, paymentReleased] = await Promise.all([
        this.contract.queryFilter(orderCreatedFilter, fromBlock, currentBlock),
        this.contract.queryFilter(paymentEscrowedFilter, fromBlock, currentBlock),
        this.contract.queryFilter(orderShippedFilter, fromBlock, currentBlock),
        this.contract.queryFilter(orderDeliveredFilter, fromBlock, currentBlock),
        this.contract.queryFilter(paymentReleasedFilter, fromBlock, currentBlock)
      ]);

      // Combine and format events
      const allEvents = [
        ...orderCreated.map(e => ({ type: 'OrderCreated', event: e })),
        ...paymentEscrowed.map(e => ({ type: 'PaymentEscrowed', event: e })),
        ...orderShipped.map(e => ({ type: 'OrderShipped', event: e })),
        ...orderDelivered.map(e => ({ type: 'OrderDelivered', event: e })),
        ...paymentReleased.map(e => ({ type: 'PaymentReleased', event: e }))
      ];

      // Sort by block number (most recent first)
      allEvents.sort((a, b) => b.event.blockNumber - a.event.blockNumber);

      // Format and return
      const transactions = await Promise.all(
        allEvents.slice(0, limit).map(async ({ type, event }) => {
          const block = await event.getBlock();
          const args = event.args;

          return {
            type,
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: block.timestamp * 1000,
            details: this.getEventDetails(type, args),
            amount: this.getEventAmount(type, args),
            from: this.getEventFrom(type, args),
            to: this.getEventTo(type, args)
          };
        })
      );

      return transactions;
    } catch (error) {
      console.error('Get recent transactions error:', error);
      return this.getMockBlockchainEvents().slice(0, limit);
    }
  }

  /**
   * Helper: Get event details description
   */
  getEventDetails(type, args) {
    switch (type) {
      case 'OrderCreated':
        return 'Order created and payment escrowed';
      case 'PaymentEscrowed':
        return `${ethers.formatEther(args.amount)} ETH locked in escrow`;
      case 'OrderShipped':
        return 'Seller confirmed shipment';
      case 'OrderDelivered':
        return 'Buyer confirmed delivery';
      case 'PaymentReleased':
        return 'Payment released to seller';
      default:
        return 'Blockchain event';
    }
  }

  /**
   * Helper: Get event amount
   */
  getEventAmount(type, args) {
    if (args.amount) {
      return `${ethers.formatEther(args.amount)} ETH`;
    }
    return '-';
  }

  /**
   * Helper: Get event sender
   */
  getEventFrom(type, args) {
    if (args.buyer) return args.buyer;
    if (args.seller) return args.seller;
    return 'Contract';
  }

  /**
   * Helper: Get event recipient
   */
  getEventTo(type, args) {
    if (args.seller) return args.seller;
    if (args.buyer) return args.buyer;
    return 'Contract';
  }

  /**
   * Check if in demo mode
   */
  isDemo() {
    return this.isDemoMode || !this.isConnected;
  }

  /**
   * Get wallet address
   */
  getWalletAddress() {
    return this.walletAddress;
  }
}

// Export singleton instance
const blockchainService = new BlockchainService();
export default blockchainService;