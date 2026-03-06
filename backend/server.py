from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="BlockShop E-Commerce API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ============================================================================
# MODELS
# ============================================================================

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: f"prod-{uuid.uuid4()}")
    name: str
    description: str
    price: float
    image: str
    category: str
    discount: int = 0
    seller_id: str
    seller_name: str
    seller_email: str
    stock: int = 0
    blockchain_verified: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    image: str
    category: str
    discount: int = 0
    seller_id: str
    seller_name: str
    seller_email: str
    stock: int = 0

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: f"order-{uuid.uuid4()}")
    user_id: str
    buyer_email: str
    buyer_name: str
    product_id: str
    product_name: str
    product_description: Optional[str] = None
    product_image: Optional[str] = None
    category: Optional[str] = None
    quantity: int = 1
    original_amount: float
    coupon_code: Optional[str] = None
    coupon_discount: float = 0
    platform_fee: float = 0
    amount: float
    status: str = "pending"
    seller_id: str
    seller_name: str
    seller_email: str
    shipping_address: Dict[str, Any]
    payment_method: str = "blockchain"
    blockchain_network: str = "ethereum"
    blockchain_verified: bool = False
    tracking_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    user_id: str
    buyer_email: str
    buyer_name: str
    product_id: str
    product_name: str
    product_description: Optional[str] = None
    product_image: Optional[str] = None
    category: Optional[str] = None
    quantity: int = 1
    original_amount: float
    coupon_code: Optional[str] = None
    coupon_discount: float = 0
    platform_fee: float = 0
    amount: float
    seller_id: str
    seller_name: str
    seller_email: str
    shipping_address: Dict[str, Any]
    payment_method: str = "blockchain"
    blockchain_network: str = "ethereum"

class OrderStatusUpdate(BaseModel):
    status: str
    tracking_id: Optional[str] = None
    reason: Optional[str] = None

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: f"user-{uuid.uuid4()}")
    email: str
    name: str
    role: str  # "buyer" or "seller"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: str
    name: str
    role: str

# ============================================================================
# ROUTES
# ============================================================================

@api_router.get("/")
async def root():
    return {
        "message": "BlockShop E-Commerce API",
        "version": "1.0.0",
        "endpoints": {
            "products": "/api/products",
            "orders": "/api/orders",
            "users": "/api/users"
        }
    }

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ============================================================================
# PRODUCT ENDPOINTS
# ============================================================================

@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate):
    """Create a new product"""
    product_obj = Product(**product.model_dump())
    doc = product_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.products.insert_one(doc)
    logger.info(f"Product created: {product_obj.id}")
    return product_obj

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None, seller_id: Optional[str] = None):
    """Get all products with optional filters"""
    query = {}
    if category:
        query['category'] = category
    if seller_id:
        query['seller_id'] = seller_id
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    """Get a specific product by ID"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_update: ProductCreate):
    """Update a product"""
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": product_update.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated_product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated_product.get('created_at'), str):
        updated_product['created_at'] = datetime.fromisoformat(updated_product['created_at'])
    
    return updated_product

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    """Delete a product"""
    result = await db.products.delete_one({"id": product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted successfully"}

# ============================================================================
# ORDER ENDPOINTS
# ============================================================================

@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    """Create a new order"""
    order_obj = Order(**order.model_dump())
    doc = order_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.orders.insert_one(doc)
    logger.info(f"Order created: {order_obj.id} for buyer: {order_obj.buyer_email}")
    return order_obj

@api_router.get("/orders", response_model=List[Order])
async def get_orders(
    buyer_email: Optional[str] = None,
    seller_email: Optional[str] = None,
    status: Optional[str] = None
):
    """Get orders with optional filters"""
    query = {}
    if buyer_email:
        query['buyer_email'] = buyer_email
    if seller_email:
        query['seller_email'] = seller_email
    if status:
        query['status'] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order.get('updated_at'), str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    """Get a specific order by ID"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if isinstance(order.get('created_at'), str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    if isinstance(order.get('updated_at'), str):
        order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return order

@api_router.patch("/orders/{order_id}/status", response_model=Order)
async def update_order_status(order_id: str, status_update: OrderStatusUpdate):
    """Update order status"""
    update_data = {"status": status_update.status, "updated_at": datetime.now(timezone.utc).isoformat()}
    
    if status_update.tracking_id:
        update_data['tracking_id'] = status_update.tracking_id
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    updated_order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if isinstance(updated_order.get('created_at'), str):
        updated_order['created_at'] = datetime.fromisoformat(updated_order['created_at'])
    if isinstance(updated_order.get('updated_at'), str):
        updated_order['updated_at'] = datetime.fromisoformat(updated_order['updated_at'])
    
    logger.info(f"Order {order_id} status updated to: {status_update.status}")
    return updated_order

# ============================================================================
# USER ENDPOINTS
# ============================================================================

@api_router.post("/users", response_model=User)
async def create_user(user: UserCreate):
    """Create a new user"""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    user_obj = User(**user.model_dump())
    doc = user_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    logger.info(f"User created: {user_obj.email}")
    return user_obj

@api_router.get("/users/{email}", response_model=User)
async def get_user(email: str):
    """Get user by email"""
    user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return user

# ============================================================================
# LEGACY STATUS CHECK ENDPOINTS
# ============================================================================

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()