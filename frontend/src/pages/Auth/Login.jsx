import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import { apiRequest } from "../../config/Api";

import "./Auth.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  const returnPath =
    location.state?.returnPath || "/";

  const pendingAction =
    location.state?.pendingAction || null;

  const registered =
    location.state?.registered || false;

  const [formData, setFormData] =
    useState({
      username: "",
      password: "",
    });

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState(
      registered
        ? "Account created successfully. Please sign in."
        : ""
    );

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

    if (message) {
      setMessage("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.username.trim()) {
      setError(
        "Username is required."
      );
      return;
    }

    if (!formData.password) {
      setError(
        "Password is required."
      );
      return;
    }

    try {
      setLoading(true);

      /*
       * IMPORTANT:
       * Use AuthContext login().
       *
       * This updates the global user state,
       * so Navbar immediately knows that
       * the user is authenticated.
       */
      await login(
        formData.username.trim(),
        formData.password
      );

      /*
       * Resume the action that caused
       * the authentication prompt.
       */

      if (
        pendingAction?.type ===
        "add_to_cart"
      ) {
        const response =
          await apiRequest(
            "/cart/add/",
            {
              method: "POST",

              body: JSON.stringify({
                product_id:
                  pendingAction.productId,

                quantity:
                  pendingAction.quantity ||
                  1,
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
          throw new Error(
            data.error ||
              "Could not add the product to cart."
          );
        }

        navigate(returnPath, {
          replace: true,

          state: {
            cartSuccess:
              data.message ||
              "Product added to cart successfully.",
          },
        });

        return;
      }

      if (
        pendingAction?.type ===
        "buy_now"
      ) {
        navigate("/checkout", {
          replace: true,

          state: {
            buyNow: true,

            product:
              pendingAction.product,

            quantity:
              pendingAction.quantity ||
              1,
          },
        });

        return;
      }

      /*
       * Normal login.
       */
      navigate(returnPath, {
        replace: true,
      });
    } catch (err) {
      setError(
        err.message ||
          "Invalid username or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">

      <div className="auth-decoration auth-decoration-one" />

      <div className="auth-decoration auth-decoration-two" />

      <section className="auth-card">

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
            WELCOME BACK
          </p>

          <h1 className="auth-title">
            Sign in to your account
          </h1>

          <p className="auth-subtitle">
            Sign in to continue shopping
            with ShopEase.
          </p>

        </div>

        {message && (
          <div
            className="auth-success"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "25px",
              padding: "14px 16px",
              border: "1px solid #bbf7d0",
              borderRadius: "13px",
              background: "#f0fdf4",
              color: "#15803d",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            <span>✓</span>

            <span>
              {message}
            </span>
          </div>
        )}

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
              placeholder="Enter your username"
              autoComplete="username"
              disabled={loading}
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
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
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

                Signing in...
              </>
            ) : (
              <>
                <span>
                  Sign in
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
            Don't have an account?
          </span>

          <Link
            to="/register"
            state={{
              returnPath,
              pendingAction,
            }}
          >
            Create account
          </Link>

        </div>

      </section>

    </main>
  );
}

export default Login;