import json
from decimal import Decimal

from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.http import require_GET, require_POST

from cart.models import Cart
from coupons.models import Coupon
from products.models import Product

from .models import Order, OrderItem


def calculate_coupon_discount(
    coupon,
    subtotal,
):
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
    )

    return discount.quantize(
        Decimal("0.01")
    )


@login_required
@require_POST
def checkout(request):
    try:
        data = json.loads(
            request.body or "{}"
        )
    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid JSON."},
            status=400,
        )

    required_fields = [
        "full_name",
        "phone",
        "address_line1",
        "city",
        "state",
        "pincode",
    ]

    for field in required_fields:
        value = str(
            data.get(field, "")
        ).strip()

        if not value:
            return JsonResponse(
                {
                    "error": (
                        f"{field.replace('_', ' ').title()} "
                        "is required."
                    )
                },
                status=400,
            )

    full_name = data["full_name"].strip()
    phone = data["phone"].strip()
    address_line1 = data["address_line1"].strip()

    address_line2 = str(
        data.get("address_line2", "")
    ).strip()

    city = data["city"].strip()
    state = data["state"].strip()
    pincode = data["pincode"].strip()

    coupon_code = str(
        data.get("coupon_code", "")
    ).strip().upper()

    buy_now_items = data.get("items")

    if len(full_name) < 2:
        return JsonResponse(
            {
                "error":
                    "Please enter a valid name."
            },
            status=400,
        )

    if not phone.isdigit() or len(phone) != 10:
        return JsonResponse(
            {
                "error":
                    "Please enter a valid "
                    "10-digit phone number."
            },
            status=400,
        )

    if not pincode.isdigit() or len(pincode) != 6:
        return JsonResponse(
            {
                "error":
                    "Please enter a valid "
                    "6-digit pincode."
            },
            status=400,
        )

    try:
        with transaction.atomic():

            # =========================================
            # NORMAL CART CHECKOUT
            # =========================================

            if buy_now_items is None:
                cart = (
                    Cart.objects
                    .select_for_update()
                    .prefetch_related(
                        "items__product"
                    )
                    .get(
                        user=request.user
                    )
                )

                cart_items = list(
                    cart.items.all()
                )

                if not cart_items:
                    return JsonResponse(
                        {
                            "error":
                                "Your cart is empty."
                        },
                        status=400,
                    )

            # =========================================
            # BUY NOW CHECKOUT
            # =========================================

            else:
                if (
                    not isinstance(
                        buy_now_items,
                        list,
                    )
                    or not buy_now_items
                ):
                    return JsonResponse(
                        {
                            "error":
                                "No checkout items provided."
                        },
                        status=400,
                    )

                quantities = {}

                for item in buy_now_items:

                    try:
                        product_id = int(
                            item.get(
                                "product_id"
                            )
                        )

                        quantity = int(
                            item.get(
                                "quantity"
                            )
                        )

                    except (
                        TypeError,
                        ValueError,
                    ):
                        return JsonResponse(
                            {
                                "error":
                                    "Invalid checkout item."
                            },
                            status=400,
                        )

                    if quantity <= 0:
                        return JsonResponse(
                            {
                                "error":
                                    "Quantity must be greater than zero."
                            },
                            status=400,
                        )

                    quantities[product_id] = (
                        quantities.get(
                            product_id,
                            0,
                        )
                        + quantity
                    )

                locked_products = {
                    product.id: product
                    for product in (
                        Product.objects
                        .select_for_update()
                        .filter(
                            id__in=quantities.keys()
                        )
                    )
                }

                if len(locked_products) != len(
                    quantities
                ):
                    return JsonResponse(
                        {
                            "error":
                                "One or more products are unavailable."
                        },
                        status=400,
                    )

                cart_items = []

                for product_id, quantity in (
                    quantities.items()
                ):

                    product = locked_products[
                        product_id
                    ]

                    if not product.is_active:
                        return JsonResponse(
                            {
                                "error":
                                    f"{product.name} "
                                    "is no longer available."
                            },
                            status=400,
                        )

                    if quantity > product.stock:
                        return JsonResponse(
                            {
                                "error":
                                    f"Only {product.stock} "
                                    f"units of {product.name} "
                                    "are available."
                            },
                            status=400,
                        )

                    cart_items.append(
                        {
                            "product":
                                product,

                            "quantity":
                                quantity,
                        }
                    )

            # =========================================
            # LOCK CART PRODUCTS
            # =========================================

            if buy_now_items is None:

                product_ids = [
                    item.product_id
                    for item in cart_items
                ]

                locked_products = {
                    product.id: product
                    for product in (
                        Product.objects
                        .select_for_update()
                        .filter(
                            id__in=product_ids
                        )
                    )
                }

            # =========================================
            # CALCULATE SUBTOTAL
            # =========================================

            subtotal_amount = Decimal(
                "0.00"
            )

            normalized_items = []

            for item in cart_items:

                if buy_now_items is None:

                    product = locked_products.get(
                        item.product_id
                    )

                    quantity = item.quantity

                else:

                    product = item["product"]

                    quantity = item["quantity"]

                if product is None:
                    return JsonResponse(
                        {
                            "error":
                                "A product is no longer available."
                        },
                        status=400,
                    )

                if not product.is_active:
                    return JsonResponse(
                        {
                            "error":
                                f"{product.name} "
                                "is no longer available."
                        },
                        status=400,
                    )

                if quantity <= 0:
                    return JsonResponse(
                        {
                            "error":
                                f"Invalid quantity "
                                f"for {product.name}."
                        },
                        status=400,
                    )

                if quantity > product.stock:
                    return JsonResponse(
                        {
                            "error":
                                f"Only {product.stock} "
                                f"units of {product.name} "
                                "are available."
                        },
                        status=400,
                    )

                subtotal_amount += (
                    product.price * quantity
                )

                normalized_items.append(
                    {
                        "product":
                            product,

                        "quantity":
                            quantity,
                    }
                )

            # =========================================
            # COUPON VALIDATION
            # =========================================

            discount_amount = Decimal(
                "0.00"
            )

            applied_coupon_code = ""

            if coupon_code:

                try:
                    coupon = (
                        Coupon.objects
                        .select_for_update()
                        .get(
                            code=coupon_code,
                            is_active=True,
                        )
                    )

                except Coupon.DoesNotExist:
                    return JsonResponse(
                        {
                            "error":
                                "Invalid or inactive coupon code."
                        },
                        status=400,
                    )

                now = timezone.now()

                if now < coupon.start_date:
                    return JsonResponse(
                        {
                            "error":
                                "This coupon is not active yet."
                        },
                        status=400,
                    )

                if now > coupon.expiry_date:
                    return JsonResponse(
                        {
                            "error":
                                "This coupon has expired."
                        },
                        status=400,
                    )

                if (
                    subtotal_amount
                    < coupon.minimum_order_amount
                ):
                    return JsonResponse(
                        {
                            "error":
                                (
                                    "Minimum order amount is "
                                    f"₹{coupon.minimum_order_amount:,.2f}."
                                )
                        },
                        status=400,
                    )

                discount_amount = (
                    calculate_coupon_discount(
                        coupon,
                        subtotal_amount,
                    )
                )

                applied_coupon_code = coupon.code

            # =========================================
            # FINAL TOTAL
            # =========================================

            total_amount = (
                subtotal_amount
                - discount_amount
            ).quantize(
                Decimal("0.01")
            )

            # =========================================
            # CREATE ORDER
            # =========================================

            order = Order.objects.create(
                user=request.user,

                subtotal_amount=
                    subtotal_amount,

                discount_amount=
                    discount_amount,

                coupon_code=
                    applied_coupon_code,

                total_amount=
                    total_amount,

                full_name=
                    full_name,

                phone=
                    phone,

                address_line1=
                    address_line1,

                address_line2=
                    address_line2,

                city=
                    city,

                state=
                    state,

                pincode=
                    pincode,

                status=
                    Order.Status.CONFIRMED,
            )

            # =========================================
            # CREATE ITEMS + REDUCE STOCK
            # =========================================

            order_items = []

            for item in normalized_items:

                product = item["product"]
                quantity = item["quantity"]

                order_items.append(
                    OrderItem(
                        order=order,
                        product=product,
                        quantity=quantity,
                        price_at_purchase=
                            product.price,
                    )
                )

                product.stock -= quantity

                product.save(
                    update_fields=[
                        "stock",
                        "updated_at",
                    ]
                )

            OrderItem.objects.bulk_create(
                order_items
            )

            # =========================================
            # CLEAR CART
            # =========================================

            if buy_now_items is None:
                cart.items.all().delete()

        return JsonResponse(
            {
                "message":
                    "Order placed successfully.",

                "order": {
                    "id":
                        order.id,

                    "subtotal_amount":
                        str(
                            order.subtotal_amount
                        ),

                    "discount_amount":
                        str(
                            order.discount_amount
                        ),

                    "coupon_code":
                        order.coupon_code,

                    "total_amount":
                        str(
                            order.total_amount
                        ),

                    "status":
                        order.status,

                    "created_at":
                        order.created_at.isoformat(),
                },
            },
            status=201,
        )

    except Cart.DoesNotExist:

        return JsonResponse(
            {
                "error":
                    "Your cart is empty."
            },
            status=400,
        )

    except Exception as exc:

        return JsonResponse(
            {
                "error":
                    str(exc)
            },
            status=500,
        )


@login_required
@require_GET
def order_list(request):

    orders = (
        Order.objects
        .filter(
            user=request.user
        )
        .prefetch_related(
            "items__product"
        )
    )

    data = []

    for order in orders:

        data.append(
            {
                "id":
                    order.id,

                "full_name":
                    order.full_name,

                "phone":
                    order.phone,

                "address_line1":
                    order.address_line1,

                "address_line2":
                    order.address_line2,

                "city":
                    order.city,

                "state":
                    order.state,

                "pincode":
                    order.pincode,

                "subtotal_amount":
                    str(
                        order.subtotal_amount
                    ),

                "discount_amount":
                    str(
                        order.discount_amount
                    ),

                "coupon_code":
                    order.coupon_code,

                "total_amount":
                    str(
                        order.total_amount
                    ),

                "status":
                    order.status,

                "created_at":
                    order.created_at.isoformat(),

                "items": [
                    {
                        "id":
                            item.id,

                        "product": {
                            "id":
                                item.product.id,

                            "name":
                                item.product.name,
                        },

                        "quantity":
                            item.quantity,

                        "price_at_purchase":
                            str(
                                item.price_at_purchase
                            ),

                        "subtotal":
                            str(
                                item.subtotal
                            ),
                    }

                    for item in order.items.all()
                ],
            }
        )

    return JsonResponse(
        {
            "orders":
                data
        }
    )


@login_required
@require_GET
def order_detail(
    request,
    order_id,
):

    order = get_object_or_404(
        Order.objects.prefetch_related(
            "items__product"
        ),
        id=order_id,
        user=request.user,
    )

    return JsonResponse(
        {
            "id":
                order.id,

            "full_name":
                order.full_name,

            "phone":
                order.phone,

            "address_line1":
                order.address_line1,

            "address_line2":
                order.address_line2,

            "city":
                order.city,

            "state":
                order.state,

            "pincode":
                order.pincode,

            "subtotal_amount":
                str(
                    order.subtotal_amount
                ),

            "discount_amount":
                str(
                    order.discount_amount
                ),

            "coupon_code":
                order.coupon_code,

            "total_amount":
                str(
                    order.total_amount
                ),

            "status":
                order.status,

            "created_at":
                order.created_at.isoformat(),

            "updated_at":
                order.updated_at.isoformat(),

            "items": [
                {
                    "id":
                        item.id,

                    "product": {
                        "id":
                            item.product.id,

                        "name":
                            item.product.name,
                    },

                    "quantity":
                        item.quantity,

                    "price_at_purchase":
                        str(
                            item.price_at_purchase
                        ),

                    "subtotal":
                        str(
                            item.subtotal
                        ),
                }

                for item in order.items.all()
            ],
        }
    )


@login_required
@require_POST
def cancel_order(
    request,
    order_id,
):
    try:
        with transaction.atomic():

            # =========================================
            # LOCK THE ORDER
            # =========================================

            order = (
                Order.objects
                .select_for_update()
                .get(
                    id=order_id,
                    user=request.user,
                )
            )

            # =========================================
            # ALREADY CANCELLED
            # =========================================

            if order.status == Order.Status.CANCELLED:
                return JsonResponse(
                    {
                        "error":
                            "This order is already cancelled."
                    },
                    status=400,
                )

            # =========================================
            # ONLY PENDING / CONFIRMED CAN CANCEL
            # =========================================

            if order.status not in [
                Order.Status.PENDING,
                Order.Status.CONFIRMED,
            ]:
                return JsonResponse(
                    {
                        "error":
                            "This order cannot be cancelled."
                    },
                    status=400,
                )

            # =========================================
            # GET ORDER ITEMS
            # =========================================

            items = list(
                OrderItem.objects
                .filter(
                    order=order
                )
            )

            # =========================================
            # LOCK PRODUCTS
            # =========================================

            product_ids = [
                item.product_id
                for item in items
            ]

            locked_products = {
                product.id: product
                for product in (
                    Product.objects
                    .select_for_update()
                    .filter(
                        id__in=product_ids
                    )
                )
            }

            # =========================================
            # RESTORE STOCK
            # =========================================

            for item in items:

                product = locked_products.get(
                    item.product_id
                )

                if product is None:
                    return JsonResponse(
                        {
                            "error":
                                (
                                    f"Product for order item "
                                    f"{item.id} no longer exists."
                                )
                        },
                        status=400,
                    )

                product.stock += item.quantity

                product.save(
                    update_fields=[
                        "stock",
                        "updated_at",
                    ]
                )

            # =========================================
            # CANCEL ORDER
            # =========================================

            order.status = (
                Order.Status.CANCELLED
            )

            order.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )

        return JsonResponse(
            {
                "message":
                    "Order cancelled successfully.",

                "order": {
                    "id":
                        order.id,

                    "status":
                        order.status,
                },
            }
        )

    except Order.DoesNotExist:

        return JsonResponse(
            {
                "error":
                    "Order not found."
            },
            status=404,
        )

    except Exception as exc:

        return JsonResponse(
            {
                "error":
                    str(exc)
            },
            status=500,
        )