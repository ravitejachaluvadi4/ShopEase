import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../../config/Api";

import "./Orders.css";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiRequest(
          "/orders/"
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
              "Unable to load orders."
          );
        }

        setOrders(
          Array.isArray(data)
            ? data
            : data.orders || []
        );
      } catch (err) {
        setError(
          err.message ||
            "Unable to load orders."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /*
   * Normalize every possible backend
   * representation into the CSS class
   * that Orders.css expects.
   */
  const normalizeStatus = (status) => {
    return String(status || "Pending")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");
  };

  const getStatusClass = (status) => {
    const normalized =
      normalizeStatus(status);

    if (normalized === "confirmed") {
      return "confirmed";
    }

    if (normalized === "shipped") {
      return "shipped";
    }

    if (normalized === "delivered") {
      return "delivered";
    }

    if (
      normalized === "cancelled" ||
      normalized === "canceled"
    ) {
      return "cancelled";
    }

    return "pending";
  };

  const getStatusLabel = (status) => {
    const statusClass =
      getStatusClass(status);

    if (statusClass === "confirmed") {
      return "Confirmed";
    }

    if (statusClass === "shipped") {
      return "Shipped";
    }

    if (statusClass === "delivered") {
      return "Delivered";
    }

    if (statusClass === "cancelled") {
      return "Cancelled";
    }

    return "Pending";
  };

  const getStatusMessage = (status) => {
    const statusClass =
      getStatusClass(status);

    if (statusClass === "cancelled") {
      return "This order was cancelled.";
    }

    if (statusClass === "delivered") {
      return "Your order has been delivered.";
    }

    if (statusClass === "shipped") {
      return "Your order is on the way.";
    }

    if (statusClass === "confirmed") {
      return "Your order has been confirmed.";
    }

    return "Your order is being processed.";
  };

  if (loading) {
    return (
      <main className="orders-page">
        <div className="orders-loading">
          <div className="orders-spinner"></div>

          <p>
            Loading your orders...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="orders-page">
        <div className="orders-error">

          <div className="orders-error-icon">
            !
          </div>

          <h2>
            Unable to load orders
          </h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
          >
            Try Again
          </button>

        </div>
      </main>
    );
  }

  return (
    <main className="orders-page">

      <div className="orders-container">

        <header className="orders-header">

          <div>

            <span className="orders-eyebrow">
              Your account
            </span>

            <h1>
              Orders
            </h1>

            <p>
              View and manage everything
              you've purchased.
            </p>

          </div>

          <Link
            to="/products"
            className="orders-shop-link"
          >
            Continue Shopping

            <span>
              →
            </span>
          </Link>

        </header>

        {orders.length === 0 ? (
          <section className="orders-empty">

            <div className="orders-empty-icon">
              <span>
                ◌
              </span>
            </div>

            <span className="orders-empty-label">
              No orders yet
            </span>

            <h2>
              Your order history is empty.
            </h2>

            <p>
              Once you place an order,
              you'll be able to see its
              status and details here.
            </p>

            <Link
              to="/products"
              className="start-shopping"
            >
              Start Shopping

              <span>
                →
              </span>
            </Link>

          </section>
        ) : (
          <section className="orders-content">

            <div className="orders-overview">

              <div className="overview-card">

                <span>
                  Total Orders
                </span>

                <strong>
                  {orders.length}
                </strong>

              </div>

              <div className="overview-card">

                <span>
                  Latest Order
                </span>

                <strong>
                  {formatDate(
                    orders[0]?.created_at ||
                      orders[0]?.created
                  )}
                </strong>

              </div>

              <div className="overview-card">

                <span>
                  Account Status
                </span>

                <strong>
                  Active
                </strong>

              </div>

            </div>

            <div className="orders-list">

              {orders.map((order) => {

                const items =
                  order.items ||
                  order.order_items ||
                  [];

                const itemCount =
                  items.reduce(
                    (sum, item) =>
                      sum +
                      Number(
                        item.quantity || 0
                      ),
                    0
                  );

                const total = Number(
                  order.total_amount ||
                    order.total ||
                    0
                );

                const rawStatus =
                  order.status ||
                  "Pending";

                const statusClass =
                  getStatusClass(
                    rawStatus
                  );

                const statusLabel =
                  getStatusLabel(
                    rawStatus
                  );

                return (
                  <article
                    className="order-card"
                    key={order.id}
                  >

                    <div className="order-card-top">

                      <div className="order-id-block">

                        <span>
                          Order
                        </span>

                        <strong>
                          #{order.id}
                        </strong>

                      </div>

                      <div className="order-date-block">

                        <span>
                          Placed on
                        </span>

                        <strong>
                          {formatDate(
                            order.created_at ||
                              order.created
                          )}
                        </strong>

                      </div>

                      <div
                        className={`order-status ${statusClass}`}
                      >

                        <span></span>

                        {statusLabel}

                      </div>

                    </div>

                    <div className="order-card-divider"></div>

                    <div className="order-card-middle">

                      <div className="order-items-preview">

                        {items.length > 0 ? (
                          items
                            .slice(0, 3)
                            .map(
                              (
                                item,
                                index
                              ) => (
                                <div
                                  className="mini-item"
                                  key={
                                    item.id ||
                                    `${order.id}-${index}`
                                  }
                                >

                                  <span>
                                    {item.product_name ||
                                      item.product
                                        ?.name ||
                                      "Product"}
                                  </span>

                                  <small>
                                    ×{" "}
                                    {item.quantity}
                                  </small>

                                </div>
                              )
                            )
                        ) : (
                          <div className="mini-item">

                            <span>
                              Order items
                            </span>

                          </div>
                        )}

                        {items.length > 3 && (
                          <span className="more-items">
                            +{items.length - 3} more
                          </span>
                        )}

                      </div>

                      <div className="order-meta">

                        <div>

                          <span>
                            Items
                          </span>

                          <strong>
                            {itemCount || "—"}
                          </strong>

                        </div>

                        <div>

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

                      </div>

                    </div>

                    <div className="order-card-bottom">

                      <span
                        className={`order-message ${statusClass}-message`}
                      >
                        {getStatusMessage(
                          rawStatus
                        )}
                      </span>

                      <Link
                        to={`/orders/${order.id}`}
                        className="view-order-link"
                      >
                        View Order

                        <span>
                          →
                        </span>
                      </Link>

                    </div>

                  </article>
                );
              })}

            </div>

          </section>
        )}

      </div>

    </main>
  );
}

export default Orders;