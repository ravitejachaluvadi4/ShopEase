import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../../config/Api";
import { getProductImage } from "../../utils/ProductImages";
import "./OrderDetails.css";

function OrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] =
    useState("");
  const [showCancelModal, setShowCancelModal] =
    useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiRequest(
          `/orders/${id}/`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load order."
          );
        }

        setOrder(
          data.order || data
        );
      } catch (err) {
        setError(
          err.message ||
            "Unable to load order details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  const formatTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const getStatusClass = (status) => {
    const normalized = String(
      status || "Pending"
    )
      .trim()
      .toLowerCase();

    if (normalized === "confirmed") {
      return "confirmed";
    }

    if (normalized === "shipped") {
      return "shipped";
    }

    if (normalized === "delivered") {
      return "delivered";
    }

    if (normalized === "cancelled") {
      return "cancelled";
    }

    return "pending";
  };

  const canCancelOrder = (status) => {
    const normalized = String(
      status || ""
    )
      .trim()
      .toLowerCase();

    return (
      normalized === "pending" ||
      normalized === "confirmed"
    );
  };

  const openCancelModal = () => {
    setError("");
    setCancelMessage("");
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    if (!cancelling) {
      setShowCancelModal(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    try {
      setCancelling(true);
      setError("");
      setCancelMessage("");

      const response = await apiRequest(
        `/orders/${order.id}/cancel/`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to cancel this order."
        );
      }

      setOrder((previousOrder) => ({
        ...previousOrder,
        ...(data.order || {}),
        status:
          data.order?.status ||
          "Cancelled",
      }));

      setShowCancelModal(false);

      setCancelMessage(
        "Your order has been cancelled successfully."
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to cancel your order."
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <main className="order-details-page">
        <div className="order-details-loading">
          <div className="order-details-spinner"></div>
          <p>
            Loading order details...
          </p>
        </div>
      </main>
    );
  }

  if (error && !order) {
    return (
      <main className="order-details-page">
        <div className="order-details-error">

          <div className="order-error-icon">
            !
          </div>

          <h2>
            Order not found
          </h2>

          <p>
            {error}
          </p>

          <Link to="/orders">
            Back to Orders
          </Link>

        </div>
      </main>
    );
  }

  if (!order) {
    return null;
  }

  const items =
    order.items ||
    order.order_items ||
    [];

  const total = Number(
    order.total_amount || 0
  );

  const subtotal = Number(
    order.subtotal_amount ?? total
  );

  const discount = Number(
    order.discount_amount || 0
  );

  const itemCount = items.reduce(
    (sum, item) =>
      sum +
      Number(item.quantity || 0),
    0
  );

  const status =
    order.status || "Pending";

  const statusClass =
    getStatusClass(status);

  const normalizedStatus =
    String(status)
      .trim()
      .toLowerCase();

  return (
    <main className="order-details-page">

      <div className="order-details-container">

        <Link
          to="/orders"
          className="order-details-back"
        >
          <span>←</span>
          Back to Orders
        </Link>

        {error && (
          <div className="order-details-error-banner">
            <span>!</span>
            <p>{error}</p>
          </div>
        )}

        {cancelMessage && (
          <div className="order-details-success-banner">
            <span>✓</span>
            <p>{cancelMessage}</p>
          </div>
        )}

        <header className="order-details-header">

          <div>

            <span className="order-details-eyebrow">
              Order confirmation
            </span>

            <h1>
              Order #{order.id}
            </h1>

            <p>
              Placed on{" "}
              {formatDate(
                order.created_at
              )}
              {" "}at{" "}
              {formatTime(
                order.created_at
              )}
            </p>

          </div>

          <div
            className={`large-order-status ${statusClass}`}
          >
            <span></span>
            {status}
          </div>

        </header>

        <section className="order-progress-card">

          <div className="order-progress-heading">

            <div>

              <span>
                Order progress
              </span>

              <h2>
                {normalizedStatus ===
                "cancelled"
                  ? "Order cancelled"
                  : normalizedStatus ===
                    "delivered"
                  ? "Order delivered"
                  : normalizedStatus ===
                    "shipped"
                  ? "Order is on the way"
                  : normalizedStatus ===
                    "confirmed"
                  ? "Your order is confirmed"
                  : "Your order is being processed"}
              </h2>

            </div>

          </div>

          {normalizedStatus !==
          "cancelled" ? (
            <div className="order-progress">

              <div className="progress-stage completed">
                <div>✓</div>
                <span>Confirmed</span>
              </div>

              <div className="stage-line completed"></div>

              <div
                className={`progress-stage ${
                  normalizedStatus ===
                    "shipped" ||
                  normalizedStatus ===
                    "delivered"
                    ? "completed"
                    : "current"
                }`}
              >
                <div>
                  {normalizedStatus ===
                    "shipped" ||
                  normalizedStatus ===
                    "delivered"
                    ? "✓"
                    : "02"}
                </div>

                <span>
                  Shipped
                </span>
              </div>

              <div
                className={`stage-line ${
                  normalizedStatus ===
                  "delivered"
                    ? "completed"
                    : ""
                }`}
              ></div>

              <div
                className={`progress-stage ${
                  normalizedStatus ===
                  "delivered"
                    ? "completed"
                    : ""
                }`}
              >
                <div>
                  {normalizedStatus ===
                  "delivered"
                    ? "✓"
                    : "03"}
                </div>

                <span>
                  Delivered
                </span>
              </div>

            </div>
          ) : (
            <div className="cancelled-progress">
              This order has been cancelled.
            </div>
          )}

        </section>

        <div className="order-details-layout">

          <div className="order-details-main">

            <section className="details-card">

              <div className="details-card-heading">

                <div>

                  <span>
                    01
                  </span>

                  <div>

                    <small>
                      Products
                    </small>

                    <h2>
                      Items in your order
                    </h2>

                  </div>

                </div>

                <strong>
                  {itemCount}{" "}
                  {itemCount === 1
                    ? "item"
                    : "items"}
                </strong>

              </div>

              <div className="details-items">

                {items.length > 0 ? (
                  items.map(
                    (item, index) => {

                      const product =
                        item.product ||
                        {};

                      const productName =
                        item.product_name ||
                        product.name ||
                        "Product";

                      const price =
                        Number(
                          item.price_at_purchase ??
                          item.price ??
                          product.price ??
                          0
                        );

                      const quantity =
                        Number(
                          item.quantity || 0
                        );

                      const itemTotal =
                        price * quantity;

                      return (
                        <div
                          className="details-item"
                          key={
                            item.id ||
                            `${order.id}-${index}`
                          }
                        >

                          <div className="details-item-image">

                            {product.id ? (
                              <Link
                                to={`/products/${product.id}`}
                              >
                                <img
                                  src={getProductImage(
                                    product
                                  )}
                                  alt={
                                    productName
                                  }
                                />
                              </Link>
                            ) : (
                              <div className="image-fallback">
                                ShopEase
                              </div>
                            )}

                          </div>

                          <div className="details-item-info">

                            <span>
                              Product
                            </span>

                            <strong>
                              {productName}
                            </strong>

                            <p>
                              ₹
                              {price.toLocaleString(
                                "en-IN"
                              )}
                              {" "}×{" "}
                              {quantity}
                            </p>

                          </div>

                          <strong className="details-item-total">
                            ₹
                            {itemTotal.toLocaleString(
                              "en-IN"
                            )}
                          </strong>

                        </div>
                      );
                    }
                  )
                ) : (
                  <div className="no-order-items">
                    Order item information unavailable.
                  </div>
                )}

              </div>

            </section>

            <section className="details-card">

              <div className="details-card-heading">

                <div>

                  <span>
                    02
                  </span>

                  <div>

                    <small>
                      Delivery
                    </small>

                    <h2>
                      Shipping Address
                    </h2>

                  </div>

                </div>

              </div>

              <div className="shipping-details">

                <div className="shipping-name">
                  {order.full_name || "—"}
                </div>

                <p>
                  {order.address_line1 || "—"}
                </p>

                {order.address_line2 && (
                  <p>
                    {order.address_line2}
                  </p>
                )}

                <p>
                  {order.city || "—"},{" "}
                  {order.state || "—"}{" "}
                  - {order.pincode || "—"}
                </p>

                <span>
                  +91 {order.phone || "—"}
                </span>

              </div>

            </section>

          </div>

          <aside className="order-total-card">

            <span className="order-total-eyebrow">
              Payment summary
            </span>

            <h2>
              Order Total
            </h2>

            <div className="order-total-lines">

              <div>
                <span>
                  Subtotal
                </span>

                <strong>
                  ₹
                  {subtotal.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              {order.coupon_code && (
                <div className="order-coupon-line">

                  <span>
                    Coupon

                    <small>
                      {order.coupon_code}
                    </small>
                  </span>

                  <strong>
                    Applied
                  </strong>

                </div>
              )}

              {discount > 0 && (
                <div className="order-discount-line">

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

            <div className="order-total-divider"></div>

            <div className="grand-order-total">

              <span>
                Total
              </span>

              <strong>
                ₹
                {total.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

            {normalizedStatus ===
            "cancelled" ? (
              <div className="order-confirmed-note cancelled-note">

                <span>
                  !
                </span>

                <div>

                  <strong>
                    Order cancelled
                  </strong>

                  <p>
                    This order has been
                    cancelled successfully.
                  </p>

                </div>

              </div>
            ) : (
              <div className="order-confirmed-note">

                <span>
                  ✓
                </span>

                <div>

                  <strong>
                    Order confirmed
                  </strong>

                  <p>
                    No additional payment is
                    required for this demo
                    checkout.
                  </p>

                </div>

              </div>
            )}

            {canCancelOrder(status) && (
              <button
                type="button"
                className="cancel-order-button"
                onClick={
                  openCancelModal
                }
                disabled={cancelling}
              >
                Cancel Order
              </button>
            )}

            <Link
              to="/products"
              className="order-shop-button"
            >
              Shop More
              <span>→</span>
            </Link>

          </aside>

        </div>

      </div>

      {showCancelModal && (
        <div
          className="cancel-modal-overlay"
          onMouseDown={
            closeCancelModal
          }
        >

          <div
            className="cancel-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="cancel-modal-icon">
              !
            </div>

            <div className="cancel-modal-content">

              <span className="cancel-modal-eyebrow">
                Cancel order
              </span>

              <h2>
                Cancel this order?
              </h2>

              <p>
                Are you sure you want to cancel
                order #{order.id}? This action
                cannot be undone.
              </p>

            </div>

            <div className="cancel-modal-actions">

              <button
                type="button"
                className="cancel-keep-button"
                onClick={
                  closeCancelModal
                }
                disabled={cancelling}
              >
                Keep Order
              </button>

              <button
                type="button"
                className="cancel-confirm-button"
                onClick={
                  handleCancelOrder
                }
                disabled={cancelling}
              >
                {cancelling
                  ? "Cancelling..."
                  : "Cancel Order"}
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}

export default OrderDetails;