import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import "./OrderSuccess.css";

function OrderSuccess() {
  const location = useLocation();

  const receivedOrder = location.state?.order;

  /*
   * Supports both:
   *
   * { id, total_amount, status }
   *
   * and:
   *
   * { order: { id, total_amount, status } }
   */
  const order =
    receivedOrder?.order || receivedOrder;

  const orderId =
    order?.id ??
    order?.order_id ??
    null;

  const total = Number(
    order?.total_amount ??
      order?.total ??
      0
  );

  const status =
    order?.status || "Confirmed";

  /*
   * If the user directly opens the page without
   * an order, redirect after render.
   */
  useEffect(() => {
    if (!receivedOrder) {
      window.history.replaceState(
        null,
        "",
        "/orders"
      );
      window.location.href = "/orders";
    }
  }, [receivedOrder]);

  if (!receivedOrder) {
    return null;
  }

  /*
   * Never allow /orders/undefined.
   */
  if (!orderId) {
    return (
      <main className="success-page">
        <div className="success-container">

          <div className="success-card">

            <div className="success-icon">
              <span>!</span>
            </div>

            <span className="success-eyebrow">
              Order processing
            </span>

            <h1>
              Order created successfully.
            </h1>

            <p className="success-description">
              Your order was created, but the order
              number could not be loaded.
            </p>

            <div className="success-actions">

              <Link
                to="/orders"
                className="view-order-button"
              >
                Go to Orders
                <span>→</span>
              </Link>

              <Link
                to="/products"
                className="shop-more-button"
              >
                Continue Shopping
              </Link>

            </div>

          </div>

        </div>
      </main>
    );
  }

  return (
    <main className="success-page">
      <div className="success-container">

        <div className="success-card">

          <div className="success-icon">
            <span>✓</span>
          </div>

          <span className="success-eyebrow">
            Order confirmed
          </span>

          <h1>
            Thank you for your order.
          </h1>

          <p className="success-description">
            Your order has been placed successfully.
            We’ve received your request and it is now
            being prepared.
          </p>

          <div className="order-confirmation-box">

            <div>
              <span>Order number</span>

              <strong>
                #{orderId}
              </strong>
            </div>

            <div>
              <span>Total amount</span>

              <strong>
                ₹
                {total.toLocaleString("en-IN")}
              </strong>
            </div>

            <div>
              <span>Status</span>

              <strong className="status-confirmed">
                {status}
              </strong>
            </div>

          </div>

          <div className="success-actions">

            <Link
              to={`/orders/${orderId}`}
              className="view-order-button"
            >
              View Order
              <span>→</span>
            </Link>

            <Link
              to="/products"
              className="shop-more-button"
            >
              Continue Shopping
            </Link>

          </div>

          <div className="success-message">

            <div className="message-icon">
              ✓
            </div>

            <div>
              <strong>
                What's next?
              </strong>

              <p>
                You can track and review your order
                anytime from your Orders section.
              </p>
            </div>

          </div>

        </div>

        <div className="success-footer">

          <div>
            <span>01</span>
            <strong>
              Order confirmed
            </strong>
          </div>

          <div>
            <span>02</span>
            <strong>
              Being prepared
            </strong>
          </div>

          <div>
            <span>03</span>
            <strong>
              Delivered
            </strong>
          </div>

        </div>

      </div>
    </main>
  );
}

export default OrderSuccess;