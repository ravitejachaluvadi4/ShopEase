import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { apiRequest } from "../../config/Api";

import "./Auth.css";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const returnPath =
    location.state?.returnPath || "/";

  const pendingAction =
    location.state?.pendingAction || null;

  const [formData, setFormData] =
    useState({
      username: "",
      email: "",
      password: "",
      confirm_password: "",
    });

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.username.trim()) {
      setError("Username is required.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!formData.password) {
      setError("Password is required.");
      return;
    }

    if (!formData.confirm_password) {
      setError(
        "Please confirm your password."
      );
      return;
    }

    if (
      formData.password !==
      formData.confirm_password
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await apiRequest(
        "/accounts/register/",
        {
          method: "POST",

          body: JSON.stringify({
            username:
              formData.username.trim(),

            email:
              formData.email.trim(),

            password:
              formData.password,

            password_confirm:
              formData.confirm_password,
          }),
        }
      );

      const responseText =
        await response.text();

      let data = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        if (data.errors) {
          const messages = [];

          Object.values(
            data.errors
          ).forEach((fieldErrors) => {
            if (
              Array.isArray(fieldErrors)
            ) {
              fieldErrors.forEach(
                (message) => {
                  messages.push(
                    String(message)
                  );
                }
              );
            }
          });

          if (messages.length > 0) {
            throw new Error(
              messages.join(" ")
            );
          }
        }

        throw new Error(
          data.error ||
            "Registration failed."
        );
      }

      navigate("/login", {
        replace: true,

        state: {
          returnPath,
          pendingAction,
          registered: true,
        },
      });
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">

      <div className="auth-decoration auth-decoration-one" />

      <div className="auth-decoration auth-decoration-two" />

      <section className="auth-card auth-register">

        <div className="auth-header">

          <div className="auth-logo">

            <span className="auth-logo-main">
              Shop
            </span>

            <span className="auth-logo-accent">
              Ease
            </span>

          </div>

          <p className="auth-eyebrow">
            JOIN SHOP EASE
          </p>

          <h1 className="auth-title">
            Create your account
          </h1>

          <p className="auth-subtitle">
            Create an account to start
            shopping with ShopEase.
          </p>

        </div>

        {error && (
          <div className="auth-error">

            <span className="auth-error-icon">
              !
            </span>

            <span>
              {error}
            </span>

          </div>
        )}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          <div className="auth-field">

            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              name="username"
              type="text"
              value={
                formData.username
              }
              onChange={handleChange}
              placeholder="Choose a username"
              autoComplete="username"
            />

          </div>

          <div className="auth-field">

            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={
                formData.email
              }
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="email"
            />

          </div>

          <div className="auth-field">

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              value={
                formData.password
              }
              onChange={handleChange}
              placeholder="Create a password"
              autoComplete="new-password"
            />

          </div>

          <div className="auth-field">

            <label htmlFor="confirm_password">
              Confirm password
            </label>

            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              value={
                formData.confirm_password
              }
              onChange={handleChange}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />

          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >

            {loading ? (
              <>
                <span className="auth-spinner" />

                Creating account...
              </>
            ) : (
              <>
                <span>
                  Create account
                </span>

                <span className="auth-arrow">
                  →
                </span>
              </>
            )}

          </button>

        </form>

       <div className="auth-footer">
  <span>
    Already have an account?
  </span>

  <button
    type="button"
    onClick={() => {
      window.location.href = "/login";
    }}
    style={{
      border: "none",
      background: "none",
      padding: 0,
      margin: 0,
      color: "#4f46e5",
      fontFamily: "inherit",
      fontSize: "inherit",
      fontWeight: 700,
      cursor: "pointer",
    }}
  >
    Sign in
  </button>
</div>
      </section>

    </main>
  );
}

export default Register;