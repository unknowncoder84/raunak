// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title EcommerceEscrow
 * @dev Smart Contract for blockchain-powered e-commerce escrow system
 * @notice This contract holds buyer payments in escrow until delivery confirmation
 * 
 * KAIRO INTEGRATION NOTES:
 * - Deploy this contract to your chosen network (Ethereum, Polygon, BSC)
 * - Save the deployed contract address to REACT_APP_ESCROW_CONTRACT_ADDRESS
 * - Contract emits events for all state changes (trackable on blockchain)
 * - All transactions are immutable and verifiable
 */
contract EcommerceEscrow {
    
    // Order states for escrow lifecycle
    enum OrderState { Created, Paid, Shipped, Delivered, Disputed, Refunded, Completed }
    
    // Order structure with immutable blockchain records
    struct Order {
        uint256 orderId;
        address buyer;
        address seller;
        uint256 amount;
        OrderState state;
        uint256 createdAt;
        uint256 lastUpdated;
        string productHash; // IPFS hash or product identifier
        bool exists;
    }
    
    // Review structure for immutable product reviews
    struct Review {
        uint256 reviewId;
        uint256 orderId;
        address reviewer;
        uint256 rating; // 1-5 stars
        string reviewHash; // Hash of review content for immutability
        uint256 timestamp;
        bool verified; // Only buyers who completed orders can review
    }
    
    // State variables
    mapping(uint256 => Order) public orders;
    mapping(uint256 => Review[]) public orderReviews;
    mapping(address => uint256[]) public buyerOrders;
    mapping(address => uint256[]) public sellerOrders;
    
    uint256 public orderCounter;
    uint256 public reviewCounter;
    uint256 public platformFeePercent = 2; // 2% platform fee
    address public platformOwner;
    
    // Events for blockchain transparency (KAIRO: These are visible in Transparency Dashboard)
    event OrderCreated(uint256 indexed orderId, address indexed buyer, address indexed seller, uint256 amount, uint256 timestamp);
    event PaymentEscrowed(uint256 indexed orderId, address indexed buyer, uint256 amount, uint256 timestamp);
    event OrderShipped(uint256 indexed orderId, address indexed seller, uint256 timestamp);
    event OrderDelivered(uint256 indexed orderId, address indexed buyer, uint256 timestamp);
    event PaymentReleased(uint256 indexed orderId, address indexed seller, uint256 amount, uint256 platformFee, uint256 timestamp);
    event OrderDisputed(uint256 indexed orderId, address indexed initiator, uint256 timestamp);
    event OrderRefunded(uint256 indexed orderId, address indexed buyer, uint256 amount, uint256 timestamp);
    event ReviewSubmitted(uint256 indexed reviewId, uint256 indexed orderId, address indexed reviewer, uint256 rating, string reviewHash, uint256 timestamp);
    
    // Modifiers
    modifier onlyBuyer(uint256 _orderId) {
        require(orders[_orderId].buyer == msg.sender, "Only buyer can call this");
        _;
    }
    
    modifier onlySeller(uint256 _orderId) {
        require(orders[_orderId].seller == msg.sender, "Only seller can call this");
        _;
    }
    
    modifier onlyPlatformOwner() {
        require(msg.sender == platformOwner, "Only platform owner can call this");
        _;
    }
    
    modifier orderExists(uint256 _orderId) {
        require(orders[_orderId].exists, "Order does not exist");
        _;
    }
    
    constructor() {
        platformOwner = msg.sender;
        orderCounter = 1;
        reviewCounter = 1;
    }
    
    /**
     * @dev Create a new order and escrow payment
     * @param _seller Address of the seller
     * @param _productHash IPFS hash or unique product identifier
     * KAIRO: Call this when buyer confirms purchase
     */
    function createOrderWithPayment(address _seller, string memory _productHash) external payable returns (uint256) {
        require(msg.value > 0, "Payment amount must be greater than 0");
        require(_seller != address(0), "Invalid seller address");
        require(_seller != msg.sender, "Buyer and seller cannot be the same");
        
        uint256 orderId = orderCounter++;
        
        orders[orderId] = Order({
            orderId: orderId,
            buyer: msg.sender,
            seller: _seller,
            amount: msg.value,
            state: OrderState.Paid,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp,
            productHash: _productHash,
            exists: true
        });
        
        buyerOrders[msg.sender].push(orderId);
        sellerOrders[_seller].push(orderId);
        
        emit OrderCreated(orderId, msg.sender, _seller, msg.value, block.timestamp);
        emit PaymentEscrowed(orderId, msg.sender, msg.value, block.timestamp);
        
        return orderId;
    }
    
    /**
     * @dev Seller marks order as shipped
     * @param _orderId Order ID to mark as shipped
     * KAIRO: Call this when seller ships the product
     */
    function markAsShipped(uint256 _orderId) external orderExists(_orderId) onlySeller(_orderId) {
        require(orders[_orderId].state == OrderState.Paid, "Order must be in Paid state");
        
        orders[_orderId].state = OrderState.Shipped;
        orders[_orderId].lastUpdated = block.timestamp;
        
        emit OrderShipped(_orderId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Buyer confirms delivery and releases payment to seller
     * @param _orderId Order ID to confirm delivery
     * KAIRO: This is the KEY ESCROW RELEASE function - payment held until this is called
     */
    function confirmDelivery(uint256 _orderId) external orderExists(_orderId) onlyBuyer(_orderId) {
        require(orders[_orderId].state == OrderState.Shipped, "Order must be in Shipped state");
        
        Order storage order = orders[_orderId];
        order.state = OrderState.Delivered;
        order.lastUpdated = block.timestamp;
        
        emit OrderDelivered(_orderId, msg.sender, block.timestamp);
        
        // Calculate platform fee and seller payment
        uint256 platformFee = (order.amount * platformFeePercent) / 100;
        uint256 sellerPayment = order.amount - platformFee;
        
        // Transfer payments
        payable(order.seller).transfer(sellerPayment);
        payable(platformOwner).transfer(platformFee);
        
        order.state = OrderState.Completed;
        
        emit PaymentReleased(_orderId, order.seller, sellerPayment, platformFee, block.timestamp);
    }
    
    /**
     * @dev Initiate a dispute for an order
     * @param _orderId Order ID to dispute
     * KAIRO: Buyer or seller can dispute - requires manual platform intervention
     */
    function initiateDispute(uint256 _orderId) external orderExists(_orderId) {
        Order storage order = orders[_orderId];
        require(msg.sender == order.buyer || msg.sender == order.seller, "Only buyer or seller can dispute");
        require(order.state == OrderState.Paid || order.state == OrderState.Shipped, "Order state invalid for dispute");
        
        order.state = OrderState.Disputed;
        order.lastUpdated = block.timestamp;
        
        emit OrderDisputed(_orderId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Platform owner resolves dispute with refund
     * @param _orderId Order ID to refund
     * KAIRO: Platform owner can refund buyer in case of dispute
     */
    function refundOrder(uint256 _orderId) external orderExists(_orderId) onlyPlatformOwner {
        Order storage order = orders[_orderId];
        require(order.state == OrderState.Disputed, "Order must be disputed");
        
        order.state = OrderState.Refunded;
        order.lastUpdated = block.timestamp;
        
        payable(order.buyer).transfer(order.amount);
        
        emit OrderRefunded(_orderId, order.buyer, order.amount, block.timestamp);
    }
    
    /**
     * @dev Submit an immutable product review
     * @param _orderId Order ID for the review
     * @param _rating Rating from 1-5
     * @param _reviewHash Hash of the review content (for immutability)
     * KAIRO: Reviews are blockchain-verified and tamper-proof
     */
    function submitReview(uint256 _orderId, uint256 _rating, string memory _reviewHash) external orderExists(_orderId) {
        Order storage order = orders[_orderId];
        require(msg.sender == order.buyer, "Only buyer can review");
        require(order.state == OrderState.Completed, "Order must be completed");
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1 and 5");
        
        uint256 reviewId = reviewCounter++;
        
        Review memory newReview = Review({
            reviewId: reviewId,
            orderId: _orderId,
            reviewer: msg.sender,
            rating: _rating,
            reviewHash: _reviewHash,
            timestamp: block.timestamp,
            verified: true
        });
        
        orderReviews[_orderId].push(newReview);
        
        emit ReviewSubmitted(reviewId, _orderId, msg.sender, _rating, _reviewHash, block.timestamp);
    }
    
    // View functions for KAIRO integration
    
    function getOrder(uint256 _orderId) external view returns (Order memory) {
        require(orders[_orderId].exists, "Order does not exist");
        return orders[_orderId];
    }
    
    function getBuyerOrders(address _buyer) external view returns (uint256[] memory) {
        return buyerOrders[_buyer];
    }
    
    function getSellerOrders(address _seller) external view returns (uint256[] memory) {
        return sellerOrders[_seller];
    }
    
    function getOrderReviews(uint256 _orderId) external view returns (Review[] memory) {
        return orderReviews[_orderId];
    }
    
    function getOrderState(uint256 _orderId) external view returns (OrderState) {
        require(orders[_orderId].exists, "Order does not exist");
        return orders[_orderId].state;
    }
}