from django.conf import settings
from django.db import models

from products.models import Product


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "Pending", "Pending"
        CONFIRMED = "Confirmed", "Confirmed"
        SHIPPED = "Shipped", "Shipped"
        DELIVERED = "Delivered", "Delivered"
        CANCELLED = "Cancelled", "Cancelled"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders",
    )

    subtotal_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    coupon_code = models.CharField(
        max_length=50,
        blank=True,
        default="",
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    full_name = models.CharField(
        max_length=150,
        default="",
    )

    phone = models.CharField(
        max_length=10,
        default="",
    )

    address_line1 = models.CharField(
        max_length=255,
        default="",
    )

    address_line2 = models.CharField(
        max_length=255,
        default="",
    )

    city = models.CharField(
        max_length=100,
        default="",
    )

    state = models.CharField(
        max_length=100,
        default="",
    )

    pincode = models.CharField(
        max_length=6,
        default="",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.id} - {self.user.username}"


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="order_items",
    )

    quantity = models.PositiveIntegerField()

    price_at_purchase = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["order", "product"],
                name="unique_order_product",
            )
        ]

    @property
    def subtotal(self):
        return self.price_at_purchase * self.quantity

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"