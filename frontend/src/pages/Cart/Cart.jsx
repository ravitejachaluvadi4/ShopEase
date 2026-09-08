import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../../config/Api";
import { getProductImage } from "../../utils/ProductImages";
import AuthPrompt from "../../components/AuthPrompt/AuthPrompt";
import "./Cart.css";

function normalizeCartResponse(data) {
  if (!data) {
    return { items: [] };
  }

  if (Array.isArray(data.items)) {
    return data;
  }

  if (data.cart && Array.isArray(data.cart.items)) {
    return data.cart;
  }

  if (data.data && Array.isArray(data.data.items)) {
    return data.data;
  }

  return { items: [] };
}

function Cart() {
  const navigate = useNavigate();

  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState("");

  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest("/cart/");

      const data = await response.json().catch(() => ({}));

      /*
       * Guests do not have a server-side cart.
       * Treat an unauthenticated cart request as an empty cart
       * instead of showing an error page.
       */
      if (response.status === 401 || response.status === 403) {
        setCart({ items: [] });
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load cart."
        );
      }

      setCart(normalizeCartResponse(data));
    } catch (err) {
      setError(
        err.message || "Unable to load cart."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (item, newQuantity) => {
    const maxStock = Number(item?.product?.stock);

    if (
      !item?.id ||
      !Number.isFinite(newQuantity) ||
      newQuantity < 1 ||
      (Number.isFinite(maxStock) &&
        newQuantity > maxStock)
    ) {
      return;
    }

    try {
      setUpdatingId(item.id);
      setError("");

      const response = await apiRequest(
        `/cart/${item.id}/update/`,
        {
          method: "POST",
          body: JSON.stringify({
            quantity: newQuantity,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to update quantity."
        );
      }

      const updatedCart =
        normalizeCartResponse(data);

      if (Array.isArray(updatedCart.items)) {
        setCart(updatedCart);
      } else {
        await fetchCart();
      }
    } catch (err) {
      setError(
        err.message || "Unable to update quantity."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (itemId) => {
    try {
      setRemovingId(itemId);
      setError("");

      const response = await apiRequest(
        `/cart/${itemId}/remove/`,
        {
          method: "POST",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to remove item."
        );
      }

      const updatedCart =
        normalizeCartResponse(data);

      if (Array.isArray(updatedCart.items)) {
        setCart(updatedCart);
      } else {
        await fetchCart();
      }
    } catch (err) {
      setError(
        err.message || "Unable to remove item."
      );
    } finally {
      setRemovingId(null);
    }
  };

  const checkAuthentication = async () => {
    try {
      const response = await apiRequest(
        "/accounts/me/"
      );

      const data = await response
        .json()
        .catch(() => ({}));

      return (
        response.ok &&
        data.authenticated === true
      );
    } catch {
      return false;
    }
  };

  const handleCheckout = async () => {
    const authenticated =
      await checkAuthentication();

    if (!authenticated) {
      setAuthPromptOpen(true);
      return;
    }

    navigate("/checkout");
  };

  if (loading) {
    return (
      <main className="cart-page">
        <div className="cart-container">
          <div className="cart-loading">
            <div className="cart-spinner"></div>
            <p>Loading your cart...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="cart-page">
        <div className="cart-container">
          <div className="cart-error">
            <div className="cart-error-icon">
              !
            </div>

            <h2>
              Unable to load cart
            </h2>

            <p>{error}</p>

            <button
              type="button"
              onClick={fetchCart}
              className="retry-button"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const items = Array.isArray(cart?.items)
    ? cart.items.filter(
        (item) => item && item.product
      )
    : [];

  const isEmpty = items.length === 0;

  const totalItems = items.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0),
    0
  );

  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      Number(item.product?.price || 0) *
        Number(item.quantity || 0),
    0
  );

  if (isEmpty) {
    return (
      <>
        <main className="cart-page">
          <div className="cart-container">

            <div className="cart-heading">
              <div>
                <span className="section-eyebrow">
                  Your shopping bag
                </span>

                <h1>
                  Shopping Cart
                </h1>
              </div>

              <Link
                to="/products"
                className="continue-link"
              >
                Continue Shopping
                <span>→</span>
              </Link>
            </div>

            <div className="empty-cart">
              <div className="empty-cart-icon">
                <span>🛒</span>
              </div>

              <h2>
                Your cart is empty
              </h2>

              <p>
                Looks like you haven't added
                anything yet. Discover something
                you'll love.
              </p>

              <Link
                to="/products"
                className="continue-shopping"
              >
                Explore Products
                <span>→</span>
              </Link>
            </div>

          </div>
        </main>

        <AuthPrompt
          open={authPromptOpen}
          onClose={() =>
            setAuthPromptOpen(false)
          }
          returnPath="/cart"
        />
      </>
    );
  }

  return (
    <>
      <main className="cart-page">
        <div className="cart-container">

          <div className="cart-heading">
            <div>
              <span className="section-eyebrow">
                Your shopping bag
              </span>

              <h1>
                Shopping Cart
              </h1>

              <p>
                {totalItems}{" "}
                {totalItems === 1
                  ? "item"
                  : "items"}{" "}
                selected
              </p>
            </div>

            <Link
              to="/products"
              className="continue-link"
            >
              Continue Shopping
              <span>→</span>
            </Link>
          </div>

          {error && (
            <div className="cart-alert">
              <span>!</span>
              {error}
            </div>
          )}

          <div className="cart-layout">

            <section className="cart-items-section">

              <div className="cart-list-header">
                <span>Product</span>
                <span>Quantity</span>
                <span>Total</span>
              </div>

              <div className="cart-items">

                {items.map((item) => {
                  const product =
                    item.product;

                  const quantity =
                    Number(
                      item.quantity || 0
                    );

                  const price =
                    Number(
                      product.price || 0
                    );

                  const maxStock =
                    Number(
                      product.stock || 0
                    );

                  const itemTotal =
                    price * quantity;

                  const isUpdating =
                    updatingId === item.id;

                  const isRemoving =
                    removingId === item.id;

                  return (
                    <article
                      className="cart-item"
                      key={item.id}
                    >

                      <div className="cart-product">

                        <Link
                          to={`/products/${product.id}`}
                          className="cart-product-image"
                        >
                          <img
                            src={getProductImage(
                              product
                            )}
                            alt={product.name}
                          />
                        </Link>

                        <div className="cart-product-info">

                          <span className="cart-product-category">
                            {product.category_name ||
                              product.category?.name ||
                              "Collection"}
                          </span>

                          <Link
                            to={`/products/${product.id}`}
                            className="cart-product-name"
                          >
                            {product.name}
                          </Link>

                          <span className="cart-product-price">
                            ₹
                            {price.toLocaleString(
                              "en-IN"
                            )}
                          </span>

                          <button
                            type="button"
                            className="remove-button mobile-remove"
                            onClick={() =>
                              removeItem(
                                item.id
                              )
                            }
                            disabled={
                              isRemoving ||
                              isUpdating
                            }
                          >
                            {isRemoving
                              ? "Removing..."
                              : "Remove"}
                          </button>

                        </div>
                      </div>

                      <div className="cart-quantity-wrapper">

                        <div className="cart-quantity">

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item,
                                quantity - 1
                              )
                            }
                            disabled={
                              quantity <= 1 ||
                              isUpdating ||
                              isRemoving
                            }
                            aria-label={`Decrease quantity of ${product.name}`}
                          >
                            −
                          </button>

                          <span>
                            {isUpdating
                              ? "..."
                              : quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item,
                                quantity + 1
                              )
                            }
                            disabled={
                              quantity >=
                                maxStock ||
                              isUpdating ||
                              isRemoving
                            }
                            aria-label={`Increase quantity of ${product.name}`}
                          >
                            +
                          </button>

                        </div>

                        {quantity >= maxStock && (
                          <small>
                            Max stock
                          </small>
                        )}

                      </div>

                      <div className="cart-item-total">

                        <strong>
                          ₹
                          {itemTotal.toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                        <button
                          type="button"
                          className="remove-button desktop-remove"
                          onClick={() =>
                            removeItem(
                              item.id
                            )
                          }
                          disabled={
                            isRemoving ||
                            isUpdating
                          }
                        >
                          {isRemoving
                            ? "Removing..."
                            : "Remove"}
                        </button>

                      </div>

                    </article>
                  );
                })}

              </div>

            </section>

            <aside className="cart-summary">

              <div className="summary-top">
                <span className="summary-eyebrow">
                  Order summary
                </span>

                <h2>
                  Cart Total
                </h2>
              </div>

              <div className="summary-lines">

                <div>
                  <span>
                    Subtotal ({totalItems}{" "}
                    {totalItems === 1
                      ? "item"
                      : "items"})
                  </span>

                  <strong>
                    ₹
                    {subtotal.toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Delivery
                  </span>

                  <strong>
                    Free
                  </strong>
                </div>

              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span>
                  Total
                </span>

                <strong>
                  ₹
                  {subtotal.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              <button
                type="button"
                className="checkout-button"
                onClick={handleCheckout}
              >
                Proceed to Checkout
                <span>→</span>
              </button>

              <div className="checkout-note">
                <span>✓</span>
                Secure checkout • No hidden charges
              </div>

            </aside>

          </div>

          <section className="cart-trust-strip">

            <div>
              <span>✓</span>

              <div>
                <strong>
                  Quality products
                </strong>

                <p>
                  Carefully selected for you
                </p>
              </div>
            </div>

            <div>
              <span>⚡</span>

              <div>
                <strong>
                  Fast processing
                </strong>

                <p>
                  Quick order confirmation
                </p>
              </div>
            </div>

            <div>
              <span>↺</span>

              <div>
                <strong>
                  Easy shopping
                </strong>

                <p>
                  Simple checkout experience
                </p>
              </div>
            </div>

          </section>

        </div>
      </main>

      <AuthPrompt
        open={authPromptOpen}
        onClose={() =>
          setAuthPromptOpen(false)
        }
        returnPath="/cart"
        pendingAction={null}
      />
    </>
  );
}

export default Cart;