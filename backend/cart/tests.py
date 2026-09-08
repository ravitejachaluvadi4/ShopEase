import json
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from products.models import Category, Product

from .models import Cart, CartItem


class CartTests(TestCase):

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

    def test_cart_requires_login(self):
        self.client.logout()

        response = self.client.get(
            reverse("cart_detail")
        )

        self.assertEqual(response.status_code, 302)

    def test_empty_cart(self):
        response = self.client.get(
            reverse("cart_detail")
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertEqual(data["items"], [])
        self.assertEqual(data["total"], "0.00")
        self.assertEqual(data["item_count"], 0)

    def test_add_product_to_cart(self):
        response = self.client.post(
            reverse("add_to_cart"),
            data=json.dumps({
                "product_id": self.product.id,
                "quantity": 2,
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)

        cart = Cart.objects.get(user=self.user)

        item = CartItem.objects.get(
            cart=cart,
            product=self.product,
        )

        self.assertEqual(item.quantity, 2)

    def test_add_same_product_updates_quantity(self):
        self.client.post(
            reverse("add_to_cart"),
            data=json.dumps({
                "product_id": self.product.id,
                "quantity": 2,
            }),
            content_type="application/json",
        )

        self.client.post(
            reverse("add_to_cart"),
            data=json.dumps({
                "product_id": self.product.id,
                "quantity": 3,
            }),
            content_type="application/json",
        )

        cart = Cart.objects.get(user=self.user)

        self.assertEqual(
            CartItem.objects.filter(
                cart=cart,
                product=self.product,
            ).count(),
            1,
        )

        item = CartItem.objects.get(
            cart=cart,
            product=self.product,
        )

        self.assertEqual(item.quantity, 5)

    def test_quantity_cannot_exceed_stock(self):
        response = self.client.post(
            reverse("add_to_cart"),
            data=json.dumps({
                "product_id": self.product.id,
                "quantity": 11,
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

        cart = Cart.objects.filter(
            user=self.user
        ).first()

        self.assertIsNone(cart)

    def test_zero_quantity_rejected(self):
        response = self.client.post(
            reverse("add_to_cart"),
            data=json.dumps({
                "product_id": self.product.id,
                "quantity": 0,
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    def test_negative_quantity_rejected(self):
        response = self.client.post(
            reverse("add_to_cart"),
            data=json.dumps({
                "product_id": self.product.id,
                "quantity": -1,
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    def test_out_of_stock_product_rejected(self):
        self.product.stock = 0
        self.product.save()

        response = self.client.post(
            reverse("add_to_cart"),
            data=json.dumps({
                "product_id": self.product.id,
                "quantity": 1,
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    def test_inactive_product_rejected(self):
        self.product.is_active = False
        self.product.save()

        response = self.client.post(
            reverse("add_to_cart"),
            data=json.dumps({
                "product_id": self.product.id,
                "quantity": 1,
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    def test_update_cart_item(self):
        cart = Cart.objects.create(
            user=self.user
        )

        item = CartItem.objects.create(
            cart=cart,
            product=self.product,
            quantity=2,
        )

        response = self.client.post(
            reverse(
                "update_cart_item",
                args=[item.id],
            ),
            data=json.dumps({
                "quantity": 5,
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)

        item.refresh_from_db()

        self.assertEqual(item.quantity, 5)

    def test_update_quantity_above_stock_rejected(self):
        cart = Cart.objects.create(
            user=self.user
        )

        item = CartItem.objects.create(
            cart=cart,
            product=self.product,
            quantity=2,
        )

        response = self.client.post(
            reverse(
                "update_cart_item",
                args=[item.id],
            ),
            data=json.dumps({
                "quantity": 11,
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

        item.refresh_from_db()

        self.assertEqual(item.quantity, 2)

    def test_remove_cart_item(self):
        cart = Cart.objects.create(
            user=self.user
        )

        item = CartItem.objects.create(
            cart=cart,
            product=self.product,
            quantity=2,
        )

        response = self.client.post(
            reverse(
                "remove_from_cart",
                args=[item.id],
            )
        )

        self.assertEqual(response.status_code, 200)

        self.assertFalse(
            CartItem.objects.filter(
                id=item.id
            ).exists()
        )

    def test_user_cannot_modify_another_users_cart(self):
        other_cart = Cart.objects.create(
            user=self.other_user
        )

        item = CartItem.objects.create(
            cart=other_cart,
            product=self.product,
            quantity=2,
        )

        response = self.client.post(
            reverse(
                "update_cart_item",
                args=[item.id],
            ),
            data=json.dumps({
                "quantity": 5,
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 404)

        item.refresh_from_db()

        self.assertEqual(item.quantity, 2)

    def test_cart_total(self):
        cart = Cart.objects.create(
            user=self.user
        )

        CartItem.objects.create(
            cart=cart,
            product=self.product,
            quantity=2,
        )

        response = self.client.get(
            reverse("cart_detail")
        )

        data = response.json()

        self.assertEqual(
            data["total"],
            "1598.00",
        )

        self.assertEqual(
            data["item_count"],
            2,
        )