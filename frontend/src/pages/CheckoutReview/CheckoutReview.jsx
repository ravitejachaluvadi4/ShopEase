import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../../config/Api";
import { getProductImage } from "../../utils/ProductImages";
import "./CheckoutReview.css";

function CheckoutReview() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    buyNow = false,
    product,
    quantity = 1,
    cart,
    shipping,
    coupon,
  } = location.state || {};

  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  const items =
    buyNow && product
      ? [
          {
            id: `buy-${product.id}`,
            product,
            quantity: Number(quantity),
          },
        ]
      : cart?.items || [];

  const hasValidCheckoutState =
    Boolean(shipping) && items.length > 0;

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

  const discount = Number(
    coupon?.discount || 0
  );

  const finalTotal = Math.max(
    subtotal - discount,
    0
  );

  const handleEditAddress = () => {
    navigate("/checkout", {
      state: {
        buyNow,
        product,
        quantity,
        cart,
        shipping,
        coupon,
      },
    });
  };

  const handlePlaceOrder = async () => {
    if (!hasValidCheckoutState || placingOrder) {
      return;
    }

    try {
      setPlacingOrder(true);
      setError("");

      const payload = {
        full_name:
          shipping.full_name.trim(),

        phone:
          shipping.phone.trim(),

        address_line1:
          shipping.address_line1.trim(),

        address_line2:
          shipping.address_line2.trim(),

        city:
          shipping.city.trim(),

        state:
          shipping.state.trim(),

        pincode:
          shipping.pincode.trim(),
      };

      if (coupon?.code) {
        payload.coupon_code =
          coupon.code;
      }

      /*
       * Buy Now:
       * Send only the selected product.
       *
       * Normal checkout:
       * Do not send items so the backend uses
       * the authenticated user's cart.
       */
      if (buyNow && product) {
        payload.items = [
          {
            product_id: product.id,
            quantity: Number(quantity),
          },
        ];
      }

      const response = await apiRequest(
        "/orders/checkout/",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      const text = await response.text();

      let data = {};

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            "Unable to read the order response."
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Unable to place your order."
        );
      }

      const orderData =
        data.order || data;

      navigate("/order-success", {
        replace: true,
        state: {
          order: orderData,
        },
      });
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong while placing your order."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  /*
   * Prevent rendering invalid review state.
   * Navigation is handled outside the render cycle.
   */
  if (!hasValidCheckoutState) {
    return (
      <main className="checkout-review-page">
        <div className="checkout-review-container">
          <div className="review-error">
            <span>!</span>

            <p>
              Your checkout session has expired
              or is incomplete.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/cart", {
                  replace: true,
                })
              }
            >
              Back to Cart
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-review-page">
      <div className="checkout-review-container">

        <header className="checkout-review-header">

          <div>
            <span className="checkout-review-eyebrow">
              FINAL REVIEW
            </span>

            <h1>
              Review your order
            </h1>

            <p>
              Check your delivery details
              and order total before placing
              your order.
            </p>
          </div>

          <div className="review-progress">

            <div className="review-progress-step completed">
              <span>✓</span>
              <strong>Address</strong>
            </div>

            <div className="review-progress-line active"></div>

            <div className="review-progress-step current">
              <span>02</span>
              <strong>Review</strong>
            </div>

            <div className="review-progress-line"></div>

            <div className="review-progress-step">
              <span>03</span>
              <strong>Complete</strong>
            </div>

          </div>

        </header>

        {error && (
          <div className="review-error">
            <span>!</span>
            <p>{error}</p>
          </div>
        )}

        <div className="checkout-review-layout">

          <div className="review-main">

            <section className="review-card">

              <div className="review-card-heading">

                <div>
                  <span className="review-card-number">
                    01
                  </span>

                  <div>
                    <small>
                      DELIVERY
                    </small>

                    <h2>
                      Shipping address
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleEditAddress}
                  disabled={placingOrder}
                >
                  Edit
                </button>

              </div>

              <div className="review-address">

                <strong>
                  {shipping.full_name}
                </strong>

                <p>
                  {shipping.address_line1}
                </p>

                {shipping.address_line2 && (
                  <p>
                    {shipping.address_line2}
                  </p>
                )}

                <p>
                  {shipping.city},{" "}
                  {shipping.state} -{" "}
                  {shipping.pincode}
                </p>

                <span>
                  Phone: {shipping.phone}
                </span>

              </div>

            </section>

            <section className="review-card">

              <div className="review-card-heading">

                <div>
                  <span className="review-card-number">
                    02
                  </span>

                  <div>
                    <small>
                      PRODUCTS
                    </small>

                    <h2>
                      Items in your order
                    </h2>
                  </div>
                </div>

                <span className="review-item-count">
                  {totalItems}{" "}
                  {totalItems === 1
                    ? "item"
                    : "items"}
                </span>

              </div>

              <div className="review-items">

                {items.map((item) => {

                  const itemPrice =
                    Number(
                      item.product?.price || 0
                    );

                  const itemQuantity =
                    Number(
                      item.quantity || 0
                    );

                  const itemTotal =
                    itemPrice *
                    itemQuantity;

                  return (
                    <div
                      className="review-product"
                      key={item.id}
                    >

                      <div className="review-product-image">

                        <img
                          src={getProductImage(
                            item.product
                          )}
                          alt={
                            item.product.name
                          }
                        />

                        <span>
                          {itemQuantity}
                        </span>

                      </div>

                      <div className="review-product-info">

                        <small>
                          PRODUCT
                        </small>

                        <h3>
                          {item.product.name}
                        </h3>

                        <p>
                          ₹
                          {itemPrice.toLocaleString(
                            "en-IN"
                          )}
                          {" "}×{" "}
                          {itemQuantity}
                        </p>

                      </div>

                      <strong>
                        ₹
                        {itemTotal.toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>
                  );
                })}

              </div>

            </section>

          </div>

          <aside className="review-summary">

            <div className="review-summary-heading">

              <span>
                BILLING
              </span>

              <h2>
                Order total
              </h2>

            </div>

            <div className="review-summary-lines">

              <div>
                <span>
                  Items ({totalItems})
                </span>

                <strong>
                  ₹
                  {subtotal.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              {coupon?.code && (
                <div className="review-coupon">

                  <span>
                    Coupon
                    <small>
                      {coupon.code}
                    </small>
                  </span>

                  <strong>
                    Applied
                  </strong>

                </div>
              )}

              {discount > 0 && (
                <div className="review-discount">

                  <span>
                    Discount
                  </span>

                  <strong>
                    -₹
                    {discount.toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                </div>
              )}

              <div>
                <span>
                  Delivery
                </span>

                <strong>
                  Free
                </strong>
              </div>

            </div>

            <div className="review-divider"></div>

            <div className="review-total">

              <span>
                Total
              </span>

              <strong>
                ₹
                {finalTotal.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

            {coupon?.code && discount > 0 && (
              <div className="review-savings">

                <span>✓</span>

                <div>
                  <strong>
                    You saved ₹
                    {discount.toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                  <p>
                    Coupon{" "}
                    {coupon.code} applied
                    to this order.
                  </p>
                </div>

              </div>
            )}

            <div className="review-payment">

              <span>✓</span>

              <div>
                <strong>
                  Secure checkout
                </strong>

                <p>
                  No online payment is
                  required for this demo.
                  Your order will be
                  confirmed securely.
                </p>
              </div>

            </div>

            <button
              type="button"
              className="place-order-button"
              onClick={handlePlaceOrder}
              disabled={placingOrder}
            >
              {placingOrder
                ? "Placing order..."
                : "Place Order"}

              {!placingOrder && (
                <span>→</span>
              )}
            </button>

            <button
              type="button"
              className="review-back-button"
              onClick={handleEditAddress}
              disabled={placingOrder}
            >
              ← Back to delivery
            </button>

          </aside>

        </div>

      </div>
    </main>
  );
}

export default CheckoutReview;