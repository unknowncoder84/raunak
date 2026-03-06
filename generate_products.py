"""
Generate 200 Products SQL Script for BlockShop
Run this to create SQL with 200 products
"""

categories = {
    'Mobiles': 40,
    'Electronics': 40,
    'Fashion': 40,
    'Home': 40,
    'Gaming': 20,
    'Books': 10,
    'Sports': 10
}

mobile_brands = ['iPhone', 'Samsung Galaxy', 'Google Pixel', 'OnePlus', 'Xiaomi', 'Realme', 'Motorola', 'Oppo', 'Vivo', 'Nothing Phone']
electronics = ['MacBook', 'Dell XPS', 'HP Laptop', 'Sony Headphones', 'Bose Speaker', 'iPad', 'Samsung Tablet', 'Canon Camera', 'Monitor', 'Mouse', 'Keyboard', 'Webcam']
fashion = ['Nike Shoes', 'Adidas Sneakers', 'Levi Jeans', 'Ray-Ban Sunglasses', 'Jacket', 'Polo Shirt', 'Watch', 'Backpack', 'Boots', 'Cap']
home = ['Dyson Vacuum', 'Coffee Maker', 'Air Fryer', 'Blender', 'Mixer', 'Air Purifier', 'Iron', 'Toaster', 'Microwave', 'Cookware']
gaming = ['PlayStation', 'Xbox', 'Nintendo Switch', 'Gaming Mouse', 'Gaming Keyboard', 'Gaming Chair', 'Headset', 'Monitor', 'Controller', 'VR Headset']
books = ['Atomic Habits', 'Rich Dad Poor Dad', 'Sapiens', 'Think Like a Monk', 'The Alchemist', '1984', 'Harry Potter', 'The Hobbit']
sports = ['Yoga Mat', 'Dumbbells', 'Resistance Bands', 'Basketball', 'Tennis Racket', 'Cycling Helmet', 'Swimming Goggles', 'Jump Rope']

images = {
    'Mobiles': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
    'Electronics': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
    'Fashion': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
    'Home': 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500',
    'Gaming': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500',
    'Books': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500',
    'Sports': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500'
}

print("-- 200 PRODUCTS FOR BLOCKSHOP")
print("DO $$")
print("DECLARE")
print("    seller1_id UUID;")
print("    seller2_id UUID;")
print("BEGIN")
print("    SELECT id INTO seller1_id FROM users WHERE email = 'seller1@test.com';")
print("    SELECT id INTO seller2_id FROM users WHERE email = 'seller2@test.com';")
print()

product_num = 1

for category, count in categories.items():
    print(f"    -- {category} ({count} products)")
    
    for i in range(count):
        seller = 'seller1_id' if i % 2 == 0 else 'seller2_id'
        seller_name = 'TechStore Pro' if i % 2 == 0 else 'MobileHub'
        seller_email = 'seller1@test.com' if i % 2 == 0 else 'seller2@test.com'
        
        name = f"{category} Product {product_num}"
        desc = f"High quality {category.lower()} product with premium features"
        price = round(0.05 + (i * 0.02), 3)
        discount = (i % 5) * 5 + 10
        stock = 10 + (i * 2)
        image = images[category]
        
        if i < count - 1:
            print(f"    ('{name}', '{desc}', {price}, '{category}', {discount}, {stock}, '{image}', {seller}, '{seller_name}', '{seller_email}', TRUE),")
        else:
            if category == list(categories.keys())[-1]:
                print(f"    ('{name}', '{desc}', {price}, '{category}', {discount}, {stock}, '{image}', {seller}, '{seller_name}', '{seller_email}', TRUE);")
            else:
                print(f"    ('{name}', '{desc}', {price}, '{category}', {discount}, {stock}, '{image}', {seller}, '{seller_name}', '{seller_email}', TRUE),")
        
        product_num += 1
    print()

print("END $$;")
print()
print(f"-- Total: {product_num - 1} products generated")
