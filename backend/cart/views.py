import json
from decimal import Decimal

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET, require_POST

from products.models import Product

from .models import Cart, CartItem


def get_or_create_user_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


def cart_response(cart):
    items = cart.items.select_related(
        "product",
        "product__category",
    )

    data = []

    for item in items:
        data.append({
            "id": item.id,
            "product": {
                "id": item.product.id,
                "name": item.product.name,
                "price": str(item.product.price),
                "stock": item.product.stock,
                "image": (
                    item.product.image.url
                    if item.product.image
                    else None
                ),
            },
            "quantity": item.quantity,
            "subtotal": str(item.subtotal),
        })

    total = sum(
        (
            Decimal(item["subtotal"])
            for item in data
        ),
        Decimal("0.00"),
    )

    return {
        "id": cart.id,
        "items": data,
        "total": str(total),
        "item_count": sum(
            item["quantity"] for item in data
        ),
    }


@login_required
@require_GET
def cart_detail(request):
    cart = get_or_create_user_cart(request.user)

    return JsonResponse(cart_response(cart))


@login_required
@require_POST
def add_to_cart(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid JSON."},
            status=400,
        )

    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)

    if not product_id:
        return JsonResponse(
            {"error": "Product ID is required."},
            status=400,
        )

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return JsonResponse(
            {"error": "Quantity must be a valid integer."},
            status=400,
        )

    if quantity <= 0:
        return JsonResponse(
            {"error": "Quantity must be greater than zero."},
            status=400,
        )

    product = get_object_or_404(
        Product,
        id=product_id,
    )

    if not product.is_active:
        return JsonResponse(
            {"error": "This product is not available."},
            status=400,
        )

    if product.stock <= 0:
        return JsonResponse(
            {"error": "This product is out of stock."},
            status=400,
        )

    # Check for an existing cart without creating one yet.
    cart = Cart.objects.filter(
        user=request.user
    ).first()

    cart_item = None

    if cart:
        cart_item = cart.items.filter(
            product=product
        ).first()

    current_quantity = (
        cart_item.quantity
        if cart_item
        else 0
    )

    new_quantity = current_quantity + quantity

    # Validate stock BEFORE creating a cart.
    if new_quantity > product.stock:
        return JsonResponse(
            {
                "error": (
                    f"Only {product.stock} items "
                    "are available."
                )
            },
            status=400,
        )

    # Create cart only after all validation succeeds.
    if cart is None:
        cart = Cart.objects.create(
            user=request.user
        )

    if cart_item:
        cart_item.quantity = new_quantity
        cart_item.save(
            update_fields=["quantity"]
        )
    else:
        CartItem.objects.create(
            cart=cart,
            product=product,
            quantity=quantity,
        )

    return JsonResponse(
        {
            "message": "Product added to cart.",
            "cart": cart_response(cart),
        },
        status=201,
    )


@login_required
@require_POST
def update_cart_item(request, item_id):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid JSON."},
            status=400,
        )

    quantity = data.get("quantity")

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return JsonResponse(
            {"error": "Quantity must be a valid integer."},
            status=400,
        )

    if quantity <= 0:
        return JsonResponse(
            {"error": "Quantity must be greater than zero."},
            status=400,
        )

    cart = get_or_create_user_cart(request.user)

    item = get_object_or_404(
        CartItem.objects.select_related("product"),
        id=item_id,
        cart=cart,
    )

    product = item.product

    if not product.is_active:
        return JsonResponse(
            {
                "error": (
                    "This product is no longer available."
                )
            },
            status=400,
        )

    if quantity > product.stock:
        return JsonResponse(
            {
                "error": (
                    f"Only {product.stock} items "
                    "are available."
                )
            },
            status=400,
        )

    item.quantity = quantity
    item.save(
        update_fields=["quantity"]
    )

    return JsonResponse({
        "message": "Cart updated.",
        "cart": cart_response(cart),
    })


@login_required
@require_POST
def remove_from_cart(request, item_id):
    cart = get_or_create_user_cart(request.user)

    item = get_object_or_404(
        CartItem,
        id=item_id,
        cart=cart,
    )

    item.delete()

    return JsonResponse({
        "message": "Product removed from cart.",
        "cart": cart_response(cart),
    })