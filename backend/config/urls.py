"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views.
"""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),

    # Health check
    path("health/", health_check),

    # Accounts
    path(
        "accounts/",
        include("accounts.urls"),
    ),

    # Products
    path(
        "products/",
        include("products.urls"),
    ),

    # Cart
    path(
        "cart/",
        include("cart.urls"),
    ),

    # Orders
    path(
        "orders/",
        include("orders.urls"),
    ),

    # Coupons
    path(
        "coupons/",
        include("coupons.urls"),
    ),
]