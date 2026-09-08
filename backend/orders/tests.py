import json
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from cart.models import Cart, CartItem
from products.models import Category, Product

from .models import Order, OrderItem


class OrderTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="ravi",
            password="StrongPassword123!",
        )

        self.other_user = User.objects.create_user(
            username="other",
            password="StrongPassword123!",
        )

        self.category = Category.objects.create(
            name="Electronics",
        )

        self.product = Product.objects.create(
            name="Wireless Mouse",
            description="Wireless mouse",
            price=Decimal("799.00"),
            category=self.category,
            stock=10,
            is_active=True,
        )

        self.client.login(
            username="ravi",
            password="StrongPassword123!",
        )

    def create_cart(self, quantity=2):
        cart = Cart.objects.create(
            user=self.user,
        )

        CartItem.objects.create(
            cart=cart,
            product=self.product,
            quantity=quantity,
        )

        return cart

    def test_checkout_requires_login(self):
        self.client.logout()

        response = self.client.post(
            reverse("checkout"),
            data=json.dumps({}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 302)

    def test_empty_cart_checkout(self):
        response = self.client.post(
            reverse("checkout"),
            data=json.dumps({}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

        self.assertEqual(
            Order.objects.count(),
            0,
        )

    def test_successful_checkout(self):
        self.create_cart(quantity=2)

        response = self.client.post(
            reverse("checkout"),
            data=json.dumps({}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)

        order = Order.objects.get(
            user=self.user,
        )

        self.assertEqual(
            order.total_amount,
            Decimal("1598.00"),
        )

        self.assertEqual(
            order.status,
            Order.Status.PENDING,
        )

    def test_order_item_created(self):
        self.create_cart(quantity=2)

        self.client.post(
            reverse("checkout"),
            data=json.dumps({}),
            content_type="application/json",
        )

        order = Order.objects.get(
            user=self.user,
        )

        item = OrderItem.objects.get(
            order=order,
        )

        self.assertEqual(
            item.product,
            self.product,
        )

        self.assertEqual(
            item.quantity,
            2,
        )

    def test_price_at_purchase_is_stored(self):
        self.create_cart(quantity=2)

        original_price = self.product.price

        self.client.post(
            reverse("checkout"),
            data=json.dumps({}),
            content_type="application/json",
        )

        order = Order.objects.get(
            user=self.user,
        )

        item = OrderItem.objects.get(
            order=order,
        )

        self.assertEqual(
            item.price_at_purchase,
            original_price,
        )

    def test_stock_is_reduced_after_checkout(self):
        self.create_cart(quantity=3)

        self.client.post(
            reverse("checkout"),
            data=json.dumps({}),
            content_type="application/json",
        )

        self.product.refresh_from_db()

        self.assertEqual(
            self.product.stock,
            7,
        )

    def test_cart_is_cleared_after_checkout(self):
        cart = self.create_cart(quantity=2)

        response = self.client.post(
            reverse("checkout"),
            data=json.dumps({}),
            content_type="application/json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        self.assertEqual(
            cart.items.count(),
            0,
        )

    def test_insufficient_stock_rejected(self):
        self.create_cart(quantity=11)

        response = self.client.post(
            reverse("checkout"),
            data=json.dumps({}),
            content_type="application/json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertEqual(
            Order.objects.count(),
            0,
        )

        self.product.refresh_from_db()

        self.assertEqual(
            self.product.stock,
            10,
        )

    def test_inactive_product_rejected(self):
        self.product.is_active = False
        self.product.save()

        self.create_cart(quantity=2)

        response = self.client.post(
            reverse("checkout"),
            data=json.dumps({}),
            content_type="application/json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertEqual(
            Order.objects.count(),
            0,
        )

        self.product.refresh_from_db()

        self.assertEqual(
            self.product.stock,
            10,
        )

    def test_order_list_only_returns_current_users_orders(self):
        self.create_cart(quantity=2)

        self.client.post(
            reverse("checkout"),
            data=json.dumps({}),
            content_type="application/json",
        )

        other_order = Order.objects.create(
            user=self.other_user,
            total_amount=Decimal("500.00"),
        )

        response = self.client.get(
            reverse("order_list"),
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        data = response.json()

        self.assertEqual(
            len(data["orders"]),
            1,
        )

        self.assertNotEqual(
            data["orders"][0]["id"],
            other_order.id,
        )

    def test_user_cannot_view_another_users_order(self):
        order = Order.objects.create(
            user=self.other_user,
            total_amount=Decimal("500.00"),
        )

        response = self.client.get(
            reverse(
                "order_detail",
                args=[order.id],
            ),
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_order_detail(self):
        self.create_cart(quantity=2)

        self.client.post(
            reverse("checkout"),
            data=json.dumps({}),
            content_type="application/json",
        )

        order = Order.objects.get(
            user=self.user,
        )

        response = self.client.get(
            reverse(
                "order_detail",
                args=[order.id],
            ),
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        data = response.json()

        self.assertEqual(
            data["id"],
            order.id,
        )

        self.assertEqual(
            data["total_amount"],
            "1598.00",
        )

        self.assertEqual(
            len(data["items"]),
            1,
        )