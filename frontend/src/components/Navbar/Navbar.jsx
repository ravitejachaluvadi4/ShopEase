import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const {
    user,
    isAuthenticated,
    loading,
    logout,
  } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar-container">

        <Link
          to="/"
          className="navbar-logo"
        >
          ShopEase
        </Link>

        <nav className="navbar-links">

          <Link to="/">
            Home
          </Link>

          <Link to="/products">
            Products
          </Link>

          <Link
            to="/cart"
            className="cart-link"
          >
            Cart
          </Link>

        </nav>

        <div className="navbar-actions">

          {loading ? (
            <div className="navbar-loading">
              Loading...
            </div>
          ) : isAuthenticated ? (
            <div className="navbar-account">

              <Link
                to="/profile"
                className="navbar-profile"
              >
                <span className="navbar-avatar">
                  {(
                    user?.first_name ||
                    user?.username ||
                    "U"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </span>

                <span className="navbar-username">
                  {user?.username}
                </span>
              </Link>

              <Link
                to="/orders"
                className="navbar-orders"
              >
                Orders
              </Link>

              <button
                type="button"
                className="navbar-logout"
                onClick={handleLogout}
              >
                Logout
              </button>

            </div>
          ) : (
            <Link
              to="/login"
              className="navbar-login"
            >
              Login
            </Link>
          )}

        </div>

      </div>
    </header>
  );
}

export default Navbar;