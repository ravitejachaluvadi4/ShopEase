import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-main">

          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              ShopEase
            </Link>

            <p>
              A simple, modern shopping experience
              built for everyday needs.
            </p>
          </div>

          <div className="footer-column">
            <h3>Shop</h3>

            <Link to="/products">
              All Products
            </Link>

            <Link to="/products">
              Categories
            </Link>

            <Link to="/cart">
              Cart
            </Link>
          </div>

          <div className="footer-column">
            <h3>Account</h3>

            <Link to="/orders">
              Orders
            </Link>

            <Link to="/profile">
              Profile
            </Link>

            <Link to="/login">
              Login
            </Link>
          </div>

          <div className="footer-column">
            <h3>ShopEase</h3>

            <span>Quality Products</span>
            <span>Simple Checkout</span>
            <span>Secure Shopping</span>
          </div>

        </div>

        <div className="footer-bottom">
  <span>© 2026 ShopEase</span>

  <span>
    Created by Ravi Teja Chaluvadi
  </span>

  <span>
    Built with React + Django
  </span>
</div>

      </div>

    </footer>
  );
}

export default Footer;