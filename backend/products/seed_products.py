from products.models import Category, Product


categories = {
    "Electronics": (
        "Smart devices and everyday technology."
    ),
    "Fashion": (
        "Modern clothing and fashion accessories."
    ),
    "Home & Living": (
        "Products designed for a comfortable home."
    ),
    "Sports": (
        "Fitness and active lifestyle essentials."
    ),
}


for name, description in categories.items():
    Category.objects.get_or_create(
        name=name,
        defaults={
            "description": description,
        },
    )


products = [
    {
        "category": "Electronics",
        "name": "Wireless Headphones",
        "description": "Premium wireless headphones with comfortable over-ear cushions.",
        "price": "2499.00",
        "stock": 25,
    },
    {
        "category": "Electronics",
        "name": "Smart Watch",
        "description": "Modern smartwatch for fitness tracking, notifications and everyday use.",
        "price": "3999.00",
        "stock": 18,
    },
    {
        "category": "Electronics",
        "name": "Wireless Keyboard",
        "description": "Slim wireless keyboard designed for comfortable everyday typing.",
        "price": "1499.00",
        "stock": 30,
    },
    {
        "category": "Electronics",
        "name": "Bluetooth Speaker",
        "description": "Portable Bluetooth speaker delivering rich sound for everyday listening.",
        "price": "1999.00",
        "stock": 20,
    },
    {
        "category": "Electronics",
        "name": "Premium Laptop",
        "description": "Slim high-performance laptop for work, study and entertainment.",
        "price": "64999.00",
        "stock": 10,
    },
    {
        "category": "Electronics",
        "name": "Smartphone",
        "description": "Modern smartphone with a vibrant display and powerful performance.",
        "price": "24999.00",
        "stock": 16,
    },
    {
        "category": "Electronics",
        "name": "Wireless Mouse",
        "description": "Ergonomic wireless mouse with smooth and accurate tracking.",
        "price": "899.00",
        "stock": 35,
    },
    {
        "category": "Electronics",
        "name": "Digital Camera",
        "description": "Compact digital camera for capturing high-quality everyday moments.",
        "price": "32999.00",
        "stock": 8,
    },
    {
        "category": "Electronics",
        "name": "Tablet",
        "description": "Lightweight tablet designed for entertainment, reading and productivity.",
        "price": "18999.00",
        "stock": 14,
    },
    {
        "category": "Fashion",
        "name": "Classic Cotton T-Shirt",
        "description": "Soft premium cotton T-shirt designed for everyday comfort.",
        "price": "799.00",
        "stock": 50,
    },
    {
        "category": "Fashion",
        "name": "Casual Sneakers",
        "description": "Comfortable everyday sneakers with a clean modern design.",
        "price": "2499.00",
        "stock": 22,
    },
    {
        "category": "Fashion",
        "name": "Classic Denim Jacket",
        "description": "Timeless denim jacket that works with casual everyday outfits.",
        "price": "2199.00",
        "stock": 15,
    },
    {
        "category": "Fashion",
        "name": "Premium Sunglasses",
        "description": "Minimal sunglasses combining everyday style and comfort.",
        "price": "1299.00",
        "stock": 24,
    },
    {
        "category": "Fashion",
        "name": "Casual Backpack",
        "description": "Spacious everyday backpack suitable for college, work and travel.",
        "price": "1799.00",
        "stock": 28,
    },
    {
        "category": "Fashion",
        "name": "Classic Wrist Watch",
        "description": "Elegant classic wrist watch with a timeless minimalist design.",
        "price": "2999.00",
        "stock": 12,
    },
    {
        "category": "Home & Living",
        "name": "Modern Table Lamp",
        "description": "Minimal table lamp that adds warm ambient lighting to your space.",
        "price": "1299.00",
        "stock": 28,
    },
    {
        "category": "Home & Living",
        "name": "Ceramic Coffee Mug",
        "description": "Premium ceramic coffee mug designed for everyday beverages.",
        "price": "399.00",
        "stock": 60,
    },
    {
        "category": "Home & Living",
        "name": "Minimal Wall Clock",
        "description": "Clean modern wall clock designed for contemporary interiors.",
        "price": "999.00",
        "stock": 25,
    },
    {
        "category": "Home & Living",
        "name": "Modern Lounge Chair",
        "description": "Comfortable lounge chair with a modern minimalist appearance.",
        "price": "8999.00",
        "stock": 7,
    },
    {
        "category": "Home & Living",
        "name": "Modern Sofa",
        "description": "Comfortable contemporary sofa designed for modern living spaces.",
        "price": "24999.00",
        "stock": 5,
    },
    {
        "category": "Home & Living",
        "name": "Indoor Green Plant",
        "description": "Decorative indoor plant that adds a natural touch to your room.",
        "price": "699.00",
        "stock": 35,
    },
    {
        "category": "Sports",
        "name": "Yoga Mat",
        "description": "Non-slip exercise mat suitable for yoga, stretching and home workouts.",
        "price": "899.00",
        "stock": 35,
    },
    {
        "category": "Sports",
        "name": "Insulated Water Bottle",
        "description": "Durable insulated bottle designed to keep drinks at the right temperature.",
        "price": "699.00",
        "stock": 40,
    },
    {
        "category": "Sports",
        "name": "Running Shoes",
        "description": "Lightweight running shoes designed for daily training and active lifestyles.",
        "price": "2999.00",
        "stock": 20,
    },
    {
        "category": "Sports",
        "name": "Gym Dumbbells",
        "description": "Compact dumbbells for strength training and home workouts.",
        "price": "1999.00",
        "stock": 18,
    },
]


for item in products:
    category = Category.objects.get(
        name=item["category"]
    )

    product, created = Product.objects.update_or_create(
        name=item["name"],
        defaults={
            "category": category,
            "description": item["description"],
            "price": item["price"],
            "stock": item["stock"],
            "is_active": True,
        },
    )

    print(
        "Created:" if created else "Updated:",
        product.name,
    )


print()
print("Product seeding completed.")
print(
    "Total products:",
    Product.objects.count(),
)