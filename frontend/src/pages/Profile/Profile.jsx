import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <main className="profile-page">
        <section className="profile-loading">
          <div className="profile-skeleton profile-skeleton-avatar"></div>
          <div className="profile-skeleton profile-skeleton-title"></div>
          <div className="profile-skeleton profile-skeleton-text"></div>
        </section>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    navigate("/login");
    return null;
  }

  const displayName =
    user.first_name || user.username;

  const initial =
    displayName.charAt(0).toUpperCase();

  return (
    <main className="profile-page">
      <div className="profile-container">

        <section className="profile-hero">
          <div className="profile-avatar">
            {initial}
          </div>

          <div className="profile-heading">
            <span className="profile-eyebrow">
              MY ACCOUNT
            </span>

            <h1>
              Welcome, {displayName}
            </h1>

            <p>
              Manage your ShopEase account and
              keep track of your orders.
            </p>
          </div>
        </section>

        <section className="profile-grid">

          <article className="profile-card">
            <div className="profile-card-header">
              <div>
                <span className="profile-card-eyebrow">
                  ACCOUNT
                </span>

                <h2>Personal information</h2>
              </div>

              <div className="profile-card-icon">
                👤
              </div>
            </div>

            <div className="profile-info-list">

              <div className="profile-info-row">
                <span>Username</span>
                <strong>
                  {user.username}
                </strong>
              </div>

              <div className="profile-info-row">
                <span>Email</span>
                <strong>
                  {user.email || "Not provided"}
                </strong>
              </div>

              {user.first_name && (
                <div className="profile-info-row">
                  <span>First name</span>
                  <strong>
                    {user.first_name}
                  </strong>
                </div>
              )}

              {user.last_name && (
                <div className="profile-info-row">
                  <span>Last name</span>
                  <strong>
                    {user.last_name}
                  </strong>
                </div>
              )}

            </div>
          </article>

          <article className="profile-card">
            <div className="profile-card-header">
              <div>
                <span className="profile-card-eyebrow">
                  SHOPPING
                </span>

                <h2>Your activity</h2>
              </div>

              <div className="profile-card-icon">
                🛍️
              </div>
            </div>

            <div className="profile-actions">

              <Link
                to="/orders"
                className="profile-action"
              >
                <div className="profile-action-icon">
                  📦
                </div>

                <div>
                  <strong>
                    My orders
                  </strong>

                  <span>
                    View your order history
                  </span>
                </div>

                <span className="profile-action-arrow">
                  →
                </span>
              </Link>

              <Link
                to="/cart"
                className="profile-action"
              >
                <div className="profile-action-icon">
                  🛒
                </div>

                <div>
                  <strong>
                    Shopping cart
                  </strong>

                  <span>
                    Review items in your cart
                  </span>
                </div>

                <span className="profile-action-arrow">
                  →
                </span>
              </Link>

              <Link
                to="/products"
                className="profile-action"
              >
                <div className="profile-action-icon">
                  ✨
                </div>

                <div>
                  <strong>
                    Continue shopping
                  </strong>

                  <span>
                    Explore our product collection
                  </span>
                </div>

                <span className="profile-action-arrow">
                  →
                </span>
              </Link>

            </div>
          </article>

        </section>

        <section className="profile-security">
          <div>
            <span className="profile-card-eyebrow">
              ACCOUNT SECURITY
            </span>

            <h2>
              Your account is protected
            </h2>

            <p>
              ShopEase uses secure session-based
              authentication to protect your account.
            </p>
          </div>

          <div className="security-badge">
            <span>✓</span>
            Secure session
          </div>
        </section>

      </div>
    </main>
  );
}

export default Profile;