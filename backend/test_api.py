"""
Test script for BlockShop Backend API
Run this to verify all endpoints are working
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def test_health():
    """Test health check endpoint"""
    print("\n🔍 Testing Health Check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_create_product():
    """Test product creation"""
    print("\n🔍 Testing Product Creation...")
    product_data = {
        "name": "Test iPhone 15",
        "description": "Test product for API verification",
        "price": 0.5,
        "image": "https://images.unsplash.com/photo-1592286927505-2fd0d113e4e4?w=500",
        "category": "Mobiles",
        "discount": 10,
        "seller_id": "test-seller-001",
        "seller_name": "Test Seller",
        "seller_email": "seller@test.com",
        "stock": 50
    }
    
    response = requests.post(f"{BASE_URL}/products", json=product_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        product = response.json()
        print(f"Product Created: {product['id']}")
        return product['id']
    else:
        print(f"Error: {response.text}")
        return None

def test_get_products():
    """Test getting all products"""
    print("\n🔍 Testing Get Products...")
    response = requests.get(f"{BASE_URL}/products")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        products = response.json()
        print(f"Total Products: {len(products)}")
        return True
    return False

def test_create_order(product_id):
    """Test order creation"""
    print("\n🔍 Testing Order Creation...")
    order_data = {
        "user_id": "test-buyer-001",
        "buyer_email": "buyer@test.com",
        "buyer_name": "Test Buyer",
        "product_id": product_id,
        "product_name": "Test iPhone 15",
        "product_description": "Test product",
        "product_image": "https://images.unsplash.com/photo-1592286927505-2fd0d113e4e4?w=500",
        "category": "Mobiles",
        "quantity": 1,
        "original_amount": 0.5,
        "coupon_discount": 0,
        "platform_fee": 0.01,
        "amount": 0.51,
        "seller_id": "test-seller-001",
        "seller_name": "Test Seller",
        "seller_email": "seller@test.com",
        "shipping_address": {
            "fullName": "Test Buyer",
            "phone": "1234567890",
            "address": "123 Test St",
            "city": "Test City",
            "state": "Test State",
            "pincode": "123456"
        },
        "payment_method": "blockchain",
        "blockchain_network": "ethereum"
    }
    
    response = requests.post(f"{BASE_URL}/orders", json=order_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        order = response.json()
        print(f"Order Created: {order['id']}")
        return order['id']
    else:
        print(f"Error: {response.text}")
        return None

def test_get_orders():
    """Test getting orders"""
    print("\n🔍 Testing Get Orders...")
    response = requests.get(f"{BASE_URL}/orders")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        orders = response.json()
        print(f"Total Orders: {len(orders)}")
        return True
    return False

def test_update_order_status(order_id):
    """Test order status update"""
    print("\n🔍 Testing Order Status Update...")
    status_data = {
        "status": "paid",
        "tracking_id": "TRACK123456"
    }
    
    response = requests.patch(f"{BASE_URL}/orders/{order_id}/status", json=status_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        order = response.json()
        print(f"Order Status Updated: {order['status']}")
        return True
    else:
        print(f"Error: {response.text}")
        return False

def run_all_tests():
    """Run all API tests"""
    print("=" * 60)
    print("🚀 BlockShop Backend API Test Suite")
    print("=" * 60)
    
    try:
        # Test 1: Health Check
        if not test_health():
            print("❌ Health check failed!")
            return
        
        # Test 2: Create Product
        product_id = test_create_product()
        if not product_id:
            print("❌ Product creation failed!")
            return
        
        # Test 3: Get Products
        if not test_get_products():
            print("❌ Get products failed!")
            return
        
        # Test 4: Create Order
        order_id = test_create_order(product_id)
        if not order_id:
            print("❌ Order creation failed!")
            return
        
        # Test 5: Get Orders
        if not test_get_orders():
            print("❌ Get orders failed!")
            return
        
        # Test 6: Update Order Status
        if not test_update_order_status(order_id):
            print("❌ Order status update failed!")
            return
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("=" * 60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to backend server!")
        print("Please start the backend server first:")
        print("  cd backend")
        print("  uvicorn server:app --reload --port 8000")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")

if __name__ == "__main__":
    run_all_tests()
