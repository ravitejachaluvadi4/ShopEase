from django.urls import path

from . import views


urlpatterns = [
    path(
        "checkout/",
        views.checkout,
        name="checkout",
    ),

    path(
        "",
        views.order_list,
        name="order_list",
    ),

    path(
        "<int:order_id>/",
        views.order_detail,
        name="order_detail",
    ),

    path(
        "<int:order_id>/cancel/",
        views.cancel_order,
        name="order_cancel",
    ),
]