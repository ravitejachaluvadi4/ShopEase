import json
from decimal import Decimal

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_POST

from cart.models import Cart
from products.models import Product

from .models import Coupon


@login_required
@require_POST
def apply_coupon(request):
    try:
        data = json.loads(request.body or "{}")

        code = str(data.get("code", "")).strip().upper()

        if not code:
            return JsonResponse(
                {"error": "Please enter a coupon code."},
                status=400,
            )

        try:
            coupon = Coupon.objects.get(
                code=code,
                is_active=True,
            )
        except Coupon.DoesNotExist:
            return JsonResponse(
                {"error": "Invalid or inactive coupon code."},
                status=400,
            )

        now = timezone.now()

        if now < coupon.start_date:
            return JsonResponse(
                {"error": "This coupon is not active yet."},
                status=400,
            )

        if now > coupon.expiry_date:
            return JsonResponse(
                {"error": "This coupon has expired."},
                status=400,
            )

        submitted_items = data.get("items")

        # Normal cart checkout
        if submitted_items is None:
            try:
                cart = Cart.objects.get(user=request.user)
            except Cart.DoesNotExist:
                return JsonResponse(
                    {"error": "Your cart is empty."},
                    status=400,
                )

            cart_items = list(
                cart.items.select_related("product").filter(
                    product__is_active=True
                )
            )

            if not cart_items:
                return JsonResponse(
                    {"error": "Your cart is empty."},
                    status=400,
                )

            subtotal = Decimal("0.00")

            for item in cart_items:
                subtotal += item.product.price * item.quantity

        # Buy Now checkout
        else:
            if not isinstance(submitted_items, list) or not submitted_items:
                return JsonResponse(
                    {"error": "No checkout items were provided."},
                    status=400,
                )

            quantities = {}

            for item in submitted_items:
                try:
                    product_id = int(item.get("product_id"))
                    quantity = int(item.get("quantity"))
                except (TypeError, ValueError):
                    return JsonResponse(
                        {"error": "Invalid checkout item."},
                        status=400,
                    )

                if quantity <= 0:
                    return JsonResponse(
                        {"error": "Quantity must be greater than zero."},
                        status=400,
                    )

                quantities[product_id] = (
                    quantities.get(product_id, 0) + quantity
                )

            products = Product.objects.filter(
                id__in=quantities.keys(),
                is_active=True,
            )

            products_by_id = {
                product.id: product
                for product in products
            }

            if len(products_by_id) != len(quantities):
                return JsonResponse(
                    {"error": "One or more products are unavailable."},
                    status=400,
                )

            subtotal = Decimal("0.00")

            for product_id, quantity in quantities.items():
                product = products_by_id[product_id]
                subtotal += product.price * quantity

        if subtotal < coupon.minimum_order_amount:
            return JsonResponse(
                {
                    "error": (
                        f"Minimum order amount is "
                        f"₹{coupon.minimum_order_amount:,.2f}."
                    )
                },
                status=400,
            )

        if coupon.discount_type == Coupon.DiscountType.PERCENTAGE:
            discount = (
                subtotal
                * coupon.discount_value
                / Decimal("100")
            )

            if coupon.maximum_discount_amount is not None:
                discount = min(
                    discount,
                    coupon.maximum_discount_amount,
                )

        else:
            discount = coupon.discount_value

        discount = min(
            discount,
            subtotal,
        ).quantize(Decimal("0.01"))

        final_total = (
            subtotal - discount
        ).quantize(Decimal("0.01"))

        return JsonResponse(
            {
                "success": True,
                "coupon": {
                    "code": coupon.code,
                    "discount_type": coupon.discount_type,
                    "discount_value": str(
                        coupon.discount_value
                    ),
                },
                "subtotal": str(subtotal),
                "discount": str(discount),
                "final_total": str(final_total),
                "message": (
                    f"Coupon {coupon.code} "
                    "applied successfully."
                ),
            },
            status=200,
        )

    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid request data."},
            status=400,
        )

    except Exception as exc:
        return JsonResponse(
            {"error": str(exc)},
            status=500,
        )