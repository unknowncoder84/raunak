/**
 * MetaMask Integration Service
 * Handles wallet connection, account management, and transactions
 */

class MetaMaskService {
  constructor() {
    this.isConnected = false;
    this.currentAccount = null;
    this.chainId = null;
    this.provider = null;
  }

  /**
   * Check if MetaMask is installed
   */
  isMetaMaskInstalled() {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  /**
   * Connect to MetaMask wallet
   */
  async connectWallet() {
    try {
      if (!this.isMetaMaskInstalled()) {
        return {
          success: false,
          error: 'MetaMask is not installed. Please install MetaMask extension.',
          installUrl: 'https://metamask.io/download/'
        };
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        return {
          success: false,
          error: 'No accounts found. Please create an account in MetaMask.'
        };
      }

      this.currentAccount = accounts[0];
      this.isConnected = true;
      this.provider = window.ethereum;

      // Get chain ID
      this.chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });

      // Set up event listeners
      this.setupEventListeners();

      return {
        success: true,
        address: this.currentAccount,
        chainId: this.chainId,
        message: 'Wallet connected successfully!'
      };
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      
      if (error.code === 4001) {
        return {
          success: false,
          error: 'Connection rejected by user'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to connect to MetaMask'
      };
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet() {
    this.isConnected = false;
    this.currentAccount = null;
    this.chainId = null;
    this.provider = null;
    
    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeAllListeners();
    }

    return {
      success: true,
      message: 'Wallet disconnected successfully'
    };
  }

  /**
   * Get current account
   */
  async getCurrentAccount() {
    try {
      if (!this.isMetaMaskInstalled()) {
        return null;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });

      if (accounts.length > 0) {
        this.currentAccount = accounts[0];
        this.isConnected = true;
        return accounts[0];
      }

      return null;
    } catch (error) {
      console.error('Error getting current account:', error);
      return null;
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(address = null) {
    try {
      const account = address || this.currentAccount;
      if (!account) {
        return { success: false, error: 'No account connected' };
      }

      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [account, 'latest']
      });

      // Convert from wei to ETH
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);

      return {
        success: true,
        balance: balanceInEth,
        balanceWei: balance,
        formatted: balanceInEth.toFixed(4) + ' ETH'
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      return {
        success: false,
        error: error.message || 'Failed to get balance'
      };
    }
  }

  /**
   * Get network information
   */
  async getNetworkInfo() {
    try {
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });

      const networks = {
        '0x1': { name: 'Ethereum Mainnet', currency: 'ETH' },
        '0x3': { name: 'Ropsten Testnet', currency: 'ETH' },
        '0x4': { name: 'Rinkeby Testnet', currency: 'ETH' },
        '0x5': { name: 'Goerli Testnet', currency: 'ETH' },
        '0xaa36a7': { name: 'Sepolia Testnet', currency: 'ETH' },
        '0x89': { name: 'Polygon Mainnet', currency: 'MATIC' },
        '0x13881': { name: 'Polygon Mumbai', currency: 'MATIC' }
      };

      const network = networks[chainId] || { 
        name: 'Unknown Network', 
        currency: 'ETH' 
      };

      return {
        success: true,
        chainId,
        network: network.name,
        currency: network.currency
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return {
        success: false,
        error: error.message || 'Failed to get network info'
      };
    }
  }

  /**
   * Switch to a specific network
   */
  async switchNetwork(chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }]
      });

      return {
        success: true,
        message: 'Network switched successfully'
      };
    } catch (error) {
      console.error('Error switching network:', error);
      return {
        success: false,
        error: error.message || 'Failed to switch network'
      };
    }
  }

  /**
   * Send transaction
   */
  async sendTransaction(to, value, data = '0x') {
    try {
      if (!this.currentAccount) {
        return {
          success: false,
          error: 'No account connected'
        };
      }

      const transactionParameters = {
        to,
        from: this.currentAccount,
        value: value.toString(16), // Convert to hex
        data
      };

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters]
      });

      return {
        success: true,
        txHash,
        message: 'Transaction sent successfully'
      };
    } catch (error) {
      console.error('Error sending transaction:', error);
      
      if (error.code === 4001) {
        return {
          success: false,
          error: 'Transaction rejected by user'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to send transaction'
      };
    }
  }

  /**
   * Sign message
   */
  async signMessage(message) {
    try {
      if (!this.currentAccount) {
        return {
          success: false,
          error: 'No account connected'
        };
      }

      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, this.currentAccount]
      });

      return {
        success: true,
        signature,
        message: 'Message signed successfully'
      };
    } catch (error) {
      console.error('Error signing message:', error);
      
      if (error.code === 4001) {
        return {
          success: false,
          error: 'Signing rejected by user'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to sign message'
      };
    }
  }

  /**
   * Set up event listeners for account and network changes
   */
  setupEventListeners() {
    if (!window.ethereum) return;

    // Account changed
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        this.disconnectWallet();
        window.dispatchEvent(new CustomEvent('walletDisconnected'));
      } else {
        this.currentAccount = accounts[0];
        window.dispatchEvent(new CustomEvent('walletAccountChanged', {
          detail: { account: accounts[0] }
        }));
      }
    });

    // Network changed
    window.ethereum.on('chainChanged', (chainId) => {
      this.chainId = chainId;
      window.dispatchEvent(new CustomEvent('walletNetworkChanged', {
        detail: { chainId }
      }));
      // Reload page to avoid issues
      window.location.reload();
    });

    // Connection changed
    window.ethereum.on('connect', (connectInfo) => {
      console.log('MetaMask connected:', connectInfo);
    });

    window.ethereum.on('disconnect', (error) => {
      console.log('MetaMask disconnected:', error);
      this.disconnectWallet();
      window.dispatchEvent(new CustomEvent('walletDisconnected'));
    });
  }

  /**
   * Open MetaMask in browser
   */
  openMetaMask() {
    if (this.isMetaMaskInstalled()) {
      // Focus on MetaMask extension
      window.ethereum.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
    } else {
      // Open MetaMask download page
      window.open('https://metamask.io/download/', '_blank');
    }
  }

  /**
   * Get transaction history (limited by MetaMask API)
   */
  async getTransactionHistory() {
    // Note: MetaMask doesn't provide transaction history directly
    // This would typically require an external service like Etherscan API
    return {
      success: false,
      error: 'Transaction history requires external API integration'
    };
  }
}

// Create singleton instance
const metamaskService = new MetaMaskService();

export default metamaskService;