import json

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse


class AccountTests(TestCase):

    def test_user_registration(self):
        response = self.client.post(
            reverse("register"),
            data=json.dumps({
                "username": "ravi",
                "email": "ravi@example.com",
                "password": "StrongPassword123!",
                "password_confirm": "StrongPassword123!",
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            User.objects.filter(username="ravi").exists()
        )

    def test_duplicate_username(self):
        User.objects.create_user(
            username="ravi",
            email="old@example.com",
            password="StrongPassword123!",
        )

        response = self.client.post(
            reverse("register"),
            data=json.dumps({
                "username": "ravi",
                "email": "new@example.com",
                "password": "StrongPassword123!",
                "password_confirm": "StrongPassword123!",
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    def test_password_mismatch(self):
        response = self.client.post(
            reverse("register"),
            data=json.dumps({
                "username": "ravi",
                "email": "ravi@example.com",
                "password": "StrongPassword123!",
                "password_confirm": "DifferentPassword123!",
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    def test_login_success(self):
        User.objects.create_user(
            username="ravi",
            email="ravi@example.com",
            password="StrongPassword123!",
        )

        response = self.client.post(
            reverse("login"),
            data=json.dumps({
                "username": "ravi",
                "password": "StrongPassword123!",
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)

    def test_login_invalid_password(self):
        User.objects.create_user(
            username="ravi",
            password="StrongPassword123!",
        )

        response = self.client.post(
            reverse("login"),
            data=json.dumps({
                "username": "ravi",
                "password": "WrongPassword123!",
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 401)

    def test_current_user_requires_login(self):
        response = self.client.get(
            reverse("current_user")
        )

        self.assertEqual(response.status_code, 401)

    def test_current_user_after_login(self):
        user = User.objects.create_user(
            username="ravi",
            email="ravi@example.com",
            password="StrongPassword123!",
        )

        self.client.login(
            username="ravi",
            password="StrongPassword123!",
        )

        response = self.client.get(
            reverse("current_user")
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertTrue(data["authenticated"])
        self.assertEqual(
            data["user"]["id"],
            user.id,
        )

    def test_logout(self):
        User.objects.create_user(
            username="ravi",
            password="StrongPassword123!",
        )

        self.client.login(
            username="ravi",
            password="StrongPassword123!",
        )

        response = self.client.post(
            reverse("logout")
        )

        self.assertEqual(response.status_code, 200)

        response = self.client.get(
            reverse("current_user")
        )

        self.assertEqual(response.status_code, 401)