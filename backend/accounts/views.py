import json

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from .forms import RegisterForm


@require_GET
@ensure_csrf_cookie
def csrf_token(request):
    token = get_token(request)

    return JsonResponse({
        "message": "CSRF cookie set successfully.",
        "csrfToken": token,
    })


@require_POST
def register_view(request):
    try:
        data = json.loads(
            request.body or "{}"
        )
    except json.JSONDecodeError:
        return JsonResponse(
            {
                "error": "Invalid JSON request."
            },
            status=400,
        )

    form = RegisterForm(data)

    if not form.is_valid():
        errors = {}

        for field, messages in form.errors.items():
            errors[field] = [
                str(message)
                for message in messages
            ]

        return JsonResponse(
            {
                "error": "Please correct the errors below.",
                "errors": errors,
            },
            status=400,
        )

    try:
        user = User.objects.create_user(
            username=form.cleaned_data["username"],
            email=form.cleaned_data["email"],
            password=form.cleaned_data["password"],
        )

        login(request, user)

        return JsonResponse(
            {
                "message": "Registration successful.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
            },
            status=201,
        )

    except Exception as error:
        return JsonResponse(
            {
                "error": str(error)
            },
            status=400,
        )


@require_POST
def login_view(request):
    try:
        data = json.loads(
            request.body or "{}"
        )
    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid JSON."},
            status=400,
        )

    username = data.get(
        "username",
        "",
    ).strip()

    password = data.get(
        "password",
        "",
    )

    if not username or not password:
        return JsonResponse(
            {
                "error": (
                    "Username and password "
                    "are required."
                )
            },
            status=400,
        )

    user = authenticate(
        request,
        username=username,
        password=password,
    )

    if user is None:
        return JsonResponse(
            {
                "error": (
                    "Invalid username or password."
                )
            },
            status=401,
        )

    login(request, user)

    return JsonResponse({
        "message": "Login successful.",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        },
    })


@require_POST
def logout_view(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {
                "error": "You are not logged in."
            },
            status=401,
        )

    logout(request)

    return JsonResponse({
        "message": "Logout successful."
    })


@require_GET
def current_user_view(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {
                "authenticated": False
            },
            status=401,
        )

    return JsonResponse({
        "authenticated": True,
        "user": {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
        },
    })