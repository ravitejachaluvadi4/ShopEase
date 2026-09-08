from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password


class RegisterForm(forms.Form):
    username = forms.CharField(
        max_length=150
    )

    email = forms.EmailField()

    password = forms.CharField(
        widget=forms.PasswordInput,
        validators=[validate_password],
    )

    password_confirm = forms.CharField(
        widget=forms.PasswordInput,
    )

    def clean_username(self):
        username = (
            self.cleaned_data["username"]
            .strip()
        )

        if not username:
            raise forms.ValidationError(
                "Username is required."
            )

        if User.objects.filter(
            username__iexact=username
        ).exists():
            raise forms.ValidationError(
                "Username already exists."
            )

        return username

    def clean_email(self):
        email = (
            self.cleaned_data["email"]
            .strip()
            .lower()
        )

        if not email:
            raise forms.ValidationError(
                "Email is required."
            )

        if User.objects.filter(
            email__iexact=email
        ).exists():
            raise forms.ValidationError(
                "Email already exists."
            )

        return email

    def clean(self):
        cleaned_data = super().clean()

        password = cleaned_data.get(
            "password"
        )

        password_confirm = cleaned_data.get(
            "password_confirm"
        )

        if (
            password
            and password_confirm
            and password != password_confirm
        ):
            raise forms.ValidationError(
                "Passwords do not match."
            )

        return cleaned_data