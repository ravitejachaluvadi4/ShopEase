from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET

from .models import Category, Product


def product_to_dict(product, request=None):
    image_url = None

    if product.image:
        image_url = product.image.url

        if request is not None:
            image_url = request.build_absolute_uri(
                image_url
            )

    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": str(product.price),
        "stock": product.stock,
        "is_active": product.is_active,
        "image": image_url,
        "category": {
            "id": product.category.id,
            "name": product.category.name,
        },
        "category_id": product.category.id,
        "category_name": product.category.name,
        "created_at": product.created_at.isoformat(),
        "updated_at": product.updated_at.isoformat(),
    }


@require_GET
def product_list(request):
    search = request.GET.get(
        "search",
        "",
    ).strip()

    category = request.GET.get(
        "category",
        "",
    ).strip()

    products = (
        Product.objects
        .filter(is_active=True)
        .select_related("category")
        .order_by("id")
    )

    # -----------------------------
    # SEARCH
    # -----------------------------

    if search:
        products = products.filter(
            name__icontains=search
        ) | products.filter(
            description__icontains=search
        )

        products = products.distinct()

    # -----------------------------
    # CATEGORY FILTER
    # -----------------------------

    if category:
        # Support category ID
        if category.isdigit():
            products = products.filter(
                category_id=int(category)
            )

        # Support category name
        else:
            products = products.filter(
                category__name__iexact=category
            )

    data = [
        product_to_dict(
            product,
            request,
        )
        for product in products
    ]

    return JsonResponse({
        "products": data,
    })


@require_GET
def product_detail(request, product_id):
    product = get_object_or_404(
        Product.objects.select_related(
            "category"
        ),
        id=product_id,
        is_active=True,
    )

    return JsonResponse(
        product_to_dict(
            product,
            request,
        )
    )


@require_GET
def category_list(request):
    categories = (
        Category.objects
        .order_by("name")
    )

    data = [
        {
            "id": category.id,
            "name": category.name,
        }
        for category in categories
    ]

    return JsonResponse({
        "categories": data,
    })