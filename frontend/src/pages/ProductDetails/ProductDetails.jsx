import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./ProductDetails.css";

import { apiRequest } from "../../config/Api";
import { getProductImage } from "../../utils/ProductImages";
import AuthPrompt from "../../components/AuthPrompt/AuthPrompt";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [message, setMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiRequest(`/products/${id}/`);

        const text = await response.text();

        let data = {};

        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            throw new Error("Invalid product response.");
          }
        }

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.message ||
              "Unable to load product."
          );
        }

        setProduct(data.product || data);
      } catch (err) {
        setError(
          err.message || "Unable to load product."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const checkAuthentication = async () => {
    try {
      const response = await apiRequest("/accounts/me/");

      const text = await response.text();

      let data = {};

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          return false;
        }
      }

      return response.ok && data.authenticated;
    } catch {
      return false;
    }
  };

  const showAuthPrompt = (action) => {
    setPendingAction(action);
    setAuthPromptOpen(true);
  };

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0 || actionLoading) {
      return;
    }

    const authenticated = await checkAuthentication();

    if (!authenticated) {
      showAuthPrompt({
        type: "add_to_cart",
        product,
        productId: product.id,
        quantity,
      });
      return;
    }

    try {
      setActionLoading(true);
      setMessage("");

      const response = await apiRequest("/cart/add/", {
        method: "POST",
        body: JSON.stringify({
          product_id: product.id,
          quantity,
        }),
      });

      const text = await response.text();

      let data = {};

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            "Unable to read the cart response."
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Unable to add product to cart."
        );
      }

      setMessage(
        `${product.name} added to your cart.`
      );
    } catch (err) {
      setMessage(
        err.message ||
          "Unable to add product to cart."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product || product.stock <= 0 || actionLoading) {
      return;
    }

    const authenticated = await checkAuthentication();

    if (!authenticated) {
      showAuthPrompt({
        type: "buy_now",
        product,
        quantity,
      });
      return;
    }

    navigate("/checkout", {
      state: {
        buyNow: true,
        product,
        quantity,
      },
    });
  };

  const increaseQuantity = () => {
    if (!product) {
      return;
    }

    setQuantity((current) =>
      Math.min(current + 1, product.stock)
    );
  };

  const decreaseQuantity = () => {
    setQuantity((current) =>
      Math.max(current - 1, 1)
    );
  };

  if (loading) {
    return (
      <main className="product-details-page">
        <div className="product-details-container">
          <div className="details-loading">
            <div className="loading-spinner"></div>
            <p>Loading product...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="product-details-page">
        <div className="product-details-container">
          <div className="details-error">
            <span>!</span>

            <h2>
              Product unavailable
            </h2>

            <p>
              {error ||
                "We couldn't find this product."}
            </p>

            <Link
              to="/products"
              className="details-back-button"
            >
              Back to Products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isOutOfStock =
    Number(product.stock) <= 0;

  const totalPrice =
    Number(product.price || 0) * quantity;

  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : product.category;

  const image = getProductImage(product);

  return (
    <>
      <main className="product-details-page">
        <div className="product-details-container">

          <Link
            to="/products"
            className="back-products"
          >
            <span>←</span>
            Back to Products
          </Link>

          <section className="product-details-card">

            <div className="product-image-section">

              <div className="image-badge">
                {categoryName || "Product"}
              </div>

              <div className="main-product-image">
                <img
                  src={image}
                  alt={product.name}
                />
              </div>

              <div className="image-caption">
                <span>ShopEase Collection</span>
                <span>01 / 01</span>
              </div>

            </div>

            <div className="product-info-section">

              <div className="product-category">
                {categoryName || "Product"}
              </div>

              <h1>
                {product.name}
              </h1>

              <div className="product-rating">
                <div className="stars">
                  ★★★★★
                </div>

                <span>
                  Premium ShopEase selection
                </span>
              </div>

              <div className="product-price">
                ₹{Number(product.price).toLocaleString("en-IN")}
              </div>

              <p className="product-description">
                {product.description ||
                  "A carefully selected ShopEase product designed to bring quality, value, and convenience to your everyday shopping."}
              </p>

              <div className="product-stock">
                <span
                  className={`stock-dot ${
                    isOutOfStock ? "out" : ""
                  }`}
                ></span>

                {isOutOfStock
                  ? "Out of stock"
                  : `${product.stock} units available`}
              </div>

              {!isOutOfStock ? (
                <>
                  <div className="quantity-label">
                    Quantity
                  </div>

                  <div className="purchase-row">

                    <div className="quantity-control">
                      <button
                        type="button"
                        onClick={decreaseQuantity}
                        disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>

                      <span>
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={increaseQuantity}
                        disabled={
                          quantity >=
                          Number(product.stock)
                        }
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div className="selected-total">
                      <span>
                        Selected total
                      </span>

                      <strong>
                        ₹
                        {totalPrice.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </div>

                  </div>

                  <div className="product-actions">

                    <button
                      type="button"
                      className="add-cart-button"
                      onClick={handleAddToCart}
                      disabled={actionLoading}
                    >
                      {actionLoading
                        ? "Processing..."
                        : "Add to Cart"}
                    </button>

                    <button
                      type="button"
                      className="buy-now-button"
                      onClick={handleBuyNow}
                      disabled={actionLoading}
                    >
                      Buy Now
                      <span>→</span>
                    </button>

                  </div>

                  {message && (
                    <div className="product-message">
                      <span>✓</span>
                      {message}
                    </div>
                  )}
                </>
              ) : (
                <div className="out-of-stock-message">
                  This product is currently
                  unavailable. Please check back
                  later.
                </div>
              )}

              <div className="product-benefits">

                <div className="benefit-item">
                  <div className="benefit-icon">
                    ✓
                  </div>

                  <div>
                    <strong>
                      Secure Checkout
                    </strong>

                    <span>
                      Safe and reliable ordering
                    </span>
                  </div>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon">
                    ↻
                  </div>

                  <div>
                    <strong>
                      Easy Shopping
                    </strong>

                    <span>
                      Simple and convenient experience
                    </span>
                  </div>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon">
                    ◆
                  </div>

                  <div>
                    <strong>
                      Quality Selection
                    </strong>

                    <span>
                      Products selected for ShopEase
                    </span>
                  </div>
                </div>

              </div>

            </div>
          </section>

          <section className="product-information-strip">

            <div>
              <span className="info-number">
                01
              </span>

              <div>
                <strong>
                  Product Quality
                </strong>

                <p>
                  Carefully selected products
                  available through ShopEase.
                </p>
              </div>
            </div>

            <div>
              <span className="info-number">
                02
              </span>

              <div>
                <strong>
                  Secure Ordering
                </strong>

                <p>
                  Your order is processed securely
                  through our checkout system.
                </p>
              </div>
            </div>

            <div>
              <span className="info-number">
                03
              </span>

              <div>
                <strong>
                  Shop With Confidence
                </strong>

                <p>
                  Track your purchases directly
                  from your ShopEase account.
                </p>
              </div>
            </div>

          </section>

        </div>
      </main>

      <AuthPrompt
        open={authPromptOpen}
        onClose={() => {
          setAuthPromptOpen(false);
          setPendingAction(null);
        }}
        returnPath={`/products/${product.id}`}
        pendingAction={pendingAction}
      />
    </>
  );
}

export default ProductDetails;