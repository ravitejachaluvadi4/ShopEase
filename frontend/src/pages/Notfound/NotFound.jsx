import { Link } from "react-router-dom";
import "./NotFound.css";

function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-container">
        <span className="not-found-code">404</span>

        <h1>Page not found</h1>

        <p>
          The page you're looking for doesn't exist
          or may have been moved.
        </p>

        <div className="not-found-actions">
          <Link
            to="/"
            className="not-found-primary"
          >
            Back to home
          </Link>

          <Link
            to="/products"
            className="not-found-secondary"
          >
            Browse products
          </Link>
        </div>
      </div>
    </main>
  );
}

export default NotFound;