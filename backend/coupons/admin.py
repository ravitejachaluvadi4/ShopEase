from django.contrib import admin
from .models import Coupon


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):

    list_display = (
        "code",
        "discount_type",
        "discount_value",
        "minimum_order_amount",
        "maximum_discount_amount",
        "start_date",
        "expiry_date",
        "is_active",
    )

    list_filter = (
        "discount_type",
        "is_active",
    )

    search_fields = (
        "code",
    )

    ordering = (
        "-created_at",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    fieldsets = (
        (
            "Coupon Information",
            {
                "fields": (
                    "code",
                    "is_active",
                )
            }
        ),
        (
            "Discount",
            {
                "fields": (
                    "discount_type",
                    "discount_value",
                    "minimum_order_amount",
                    "maximum_discount_amount",
                )
            }
        ),
        (
            "Validity",
            {
                "fields": (
                    "start_date",
                    "expiry_date",
                )
            }
        ),
        (
            "System Information",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                )
            }
        ),
    )