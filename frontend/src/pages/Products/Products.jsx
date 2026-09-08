import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useSearchParams,
} from "react-router-dom";

import { apiRequest } from "../../config/Api";
import { getProductImage } from "../../utils/ProductImages";

import AuthPrompt from "../../components/AuthPrompt/AuthPrompt";

import "./Products.css";

function Products() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const location = useLocation();

  const [products, setProducts] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [feedback, setFeedback] =
    useState("");

  const [showAuthPrompt, setShowAuthPrompt] =
    useState(false);

  const [pendingAction, setPendingAction] =
    useState(null);

  const search =
    searchParams.get("search") || "";

  const category =
    searchParams.get("category") || "";

  const [searchInput, setSearchInput] =
    useState(search);

  /*
   * =========================================
   * SHOW SUCCESS AFTER LOGIN
   * =========================================
   */

  useEffect(() => {
    const message =
      location.state?.cartSuccess;

    if (!message) {
      return;
    }

    setFeedback(message);

    window.history.replaceState(
      {},
      document.title,
      window.location.href
    );

    const timer = setTimeout(() => {
      setFeedback("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [location.state]);

  /*
   * =========================================
   * LOAD CATEGORIES
   * =========================================
   */

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response =
          await apiRequest(
            "/products/categories/"
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load categories."
          );
        }

        const categoryList =
          Array.isArray(data)
            ? data
            : data.categories || [];

        setCategories(categoryList);
      } catch (err) {
        console.error(
          "Category error:",
          err
        );

        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  /*
   * =========================================
   * LOAD PRODUCTS
   * =========================================
   */

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        setProducts([]);

        const params =
          new URLSearchParams();

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        if (category.trim()) {
          params.set(
            "category",
            category.trim()
          );
        }

        const query =
          params.toString();

        const endpoint = query
          ? `/products/?${query}`
          : "/products/";

        const response =
          await apiRequest(endpoint);

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load products."
          );
        }

        const productList =
          Array.isArray(data)
            ? data
            : data.products || [];

        setProducts(productList);
      } catch (err) {
        console.error(
          "Products error:",
          err
        );

        setProducts([]);

        setError(
          err.message ||
            "Couldn't load the products. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [search, category]);

  /*
   * =========================================
   * SYNC SEARCH
   * =========================================
   */

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  /*
   * =========================================
   * SEARCH
   * =========================================
   */

  const handleSearch = (event) => {
    event.preventDefault();

    const params = {};

    if (searchInput.trim()) {
      params.search =
        searchInput.trim();
    }

    if (category) {
      params.category =
        category;
    }

    setSearchParams(params);
  };

  /*
   * =========================================
   * CATEGORY
   * =========================================
   */

  const handleCategoryChange = (
    event
  ) => {
    const selectedCategory =
      event.target.value;

    const params = {};

    if (search.trim()) {
      params.search =
        search.trim();
    }

    if (selectedCategory) {
      params.category =
        selectedCategory;
    }

    setSearchParams(params);
  };

  /*
   * =========================================
   * CLEAR FILTERS
   * =========================================
   */

  const clearFilters = () => {
    setSearchInput("");
    setSearchParams({});
  };

  /*
   * =========================================
   * ADD TO CART
   * =========================================
   */

  const handleAddToCart = async (
    product
  ) => {
    try {
      setFeedback("");

      /*
       * Check authentication first.
       */

      const authResponse =
        await apiRequest(
          "/accounts/me/"
        );

      const authData =
        await authResponse.json();

      /*
       * Guest user
       */

      if (
        !authResponse.ok ||
        !authData.authenticated
      ) {
        setPendingAction({
          type: "add_to_cart",
          product,
          productId: product.id,
          quantity: 1,
        });

        setShowAuthPrompt(true);

        return;
      }

      /*
       * Logged-in user
       */

      const response =
        await apiRequest(
          "/cart/add/",
          {
            method: "POST",

            body: JSON.stringify({
              product_id:
                product.id,

              quantity: 1,
            }),
          }
        );

      const text =
        await response.text();

      let data = {};

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = {};
        }
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to add product to cart."
        );
      }

      setFeedback(
        `${product.name} added to cart.`
      );

      setTimeout(() => {
        setFeedback("");
      }, 2500);

    } catch (err) {
      setFeedback(
        err.message ||
          "Unable to add product to cart."
      );

      setTimeout(() => {
        setFeedback("");
      }, 3000);
    }
  };

  /*
   * =========================================
   * CLOSE AUTH PROMPT
   * =========================================
   */

  const closeAuthPrompt = () => {
    setShowAuthPrompt(false);
    setPendingAction(null);
  };

  const hasFilters =
    Boolean(
      search || category
    );

  /*
   * =========================================
   * RENDER
   * =========================================
   */

  return (
    <main className="products-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="products-header">

        <div className="products-heading">

          <span className="products-overline">
            ShopEase Collection
          </span>

          <h1>
            Find what you need.
          </h1>

          <p>
            Browse our collection of
            products for everyday life.
          </p>

        </div>

        <div className="products-count">

          <strong>
            {products.length}
          </strong>

          <span>
            {products.length === 1
              ? "Product"
              : "Products"}
          </span>

        </div>

      </header>

      {/* =====================================
          CONTROLS
      ===================================== */}

      <section className="products-controls">

        <form
          className="products-search"
          onSubmit={handleSearch}
        >

          <span className="search-icon">
            ⌕
          </span>

          <input
            type="search"
            value={searchInput}
            onChange={(event) =>
              setSearchInput(
                event.target.value
              )
            }
            placeholder="Search products..."
          />

          {searchInput && (
            <button
              type="button"
              className="search-clear"
              onClick={() =>
                setSearchInput("")
              }
              aria-label="Clear search"
            >
              ×
            </button>
          )}

          <button
            type="submit"
            className="search-button"
          >
            Search
          </button>

        </form>

        <div className="products-filter">

          <select
            value={category}
            onChange={
              handleCategoryChange
            }
          >
            <option value="">
              All Categories
            </option>

            {categories.map(
              (item) => {

                const value =
                  typeof item ===
                  "string"
                    ? item
                    : item.name;

                return (
                  <option
                    key={
                      item.id ||
                      value
                    }
                    value={value}
                  >
                    {value}
                  </option>
                );
              }
            )}

          </select>

        </div>

      </section>

      {/* =====================================
          ACTIVE FILTERS
      ===================================== */}

      {hasFilters && (
        <div className="products-active-filters">

          <span>
            {search &&
              `Search: ${search}`}

            {search &&
              category &&
              " · "}

            {category &&
              `Category: ${category}`}
          </span>

          <button
            type="button"
            onClick={
              clearFilters
            }
          >
            Clear filters
          </button>

        </div>
      )}

      {/* =====================================
          CONTENT
      ===================================== */}

      <section className="products-content">

        {/* ERROR */}

        {error && (
          <div className="products-state">

            <div className="state-icon">
              !
            </div>

            <h2>
              Couldn't load products
            </h2>

            <p>
              {error}
            </p>

            <button
              type="button"
              className="state-button"
              onClick={() =>
                window.location.reload()
              }
            >
              Try Again
            </button>

          </div>
        )}

        {/* LOADING */}

        {!error && loading && (
          <div className="products-state">

            <div className="products-spinner"></div>

            <p>
              Loading products...
            </p>

          </div>
        )}

        {/* EMPTY */}

        {!error &&
          !loading &&
          products.length === 0 && (
            <div className="products-state">

              <div className="state-icon">
                ⌕
              </div>

              <h2>
                No products found
              </h2>

              <p>
                We couldn't find any
                products matching your
                selection.
              </p>

              {hasFilters && (
                <button
                  type="button"
                  className="state-button"
                  onClick={
                    clearFilters
                  }
                >
                  View All Products
                </button>
              )}

            </div>
          )}

        {/* PRODUCTS */}

        {!error &&
          !loading &&
          products.length > 0 && (

            <div className="products-grid">

              {products.map(
                (
                  product,
                  index
                ) => {

                  const stock =
                    Number(
                      product.stock ||
                        0
                    );

                  const outOfStock =
                    stock <= 0;

                  const categoryName =
                    product.category_name ||
                    product.category?.name ||
                    "Collection";

                  return (
                    <article
                      className="product-card"
                      key={product.id}
                    >

                      {/* IMAGE */}

                      <Link
                        to={`/products/${product.id}`}
                        className="product-image-link"
                      >

                        <div className="product-image">

                          <img
                            src={getProductImage(
                              product
                            )}
                            alt={
                              product.name
                            }
                            loading="lazy"
                          />

                          <span className="product-index">
                            {String(
                              index + 1
                            ).padStart(
                              2,
                              "0"
                            )}
                          </span>

                          <span className="product-view">
                            ↗
                          </span>

                          <span className="product-stock">
                            {outOfStock
                              ? "Out of stock"
                              : `${stock} available`}
                          </span>

                        </div>

                      </Link>

                      {/* INFORMATION */}

                      <div className="product-information">

                        <span className="product-category">
                          {categoryName}
                        </span>

                        <Link
                          to={`/products/${product.id}`}
                          className="product-name"
                        >
                          {product.name}
                        </Link>

                        <div className="product-bottom">

                          <strong className="product-price">
                            ₹
                            {Number(
                              product.price
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </strong>

                          <button
                            type="button"
                            className="add-cart-button"
                            disabled={
                              outOfStock
                            }
                            onClick={() =>
                              handleAddToCart(
                                product
                              )
                            }
                          >
                            {outOfStock
                              ? "Out of Stock"
                              : "Add to Cart"}

                            {!outOfStock && (
                              <span>
                                +
                              </span>
                            )}

                          </button>

                        </div>

                      </div>

                    </article>
                  );
                }
              )}

            </div>

          )}

      </section>

      {/* =====================================
          SUCCESS TOAST
      ===================================== */}

      {feedback && (
        <div className="products-toast success">

          <span>
            ✓
          </span>

          <div className="toast-content">

            <span>
              {feedback}
            </span>

            <Link to="/cart">
              Go to Cart →
            </Link>

          </div>

        </div>
      )}

      {/* =====================================
          AUTH PROMPT
      ===================================== */}

      <AuthPrompt
        open={showAuthPrompt}
        onClose={
          closeAuthPrompt
        }
        returnPath="/products"
        pendingAction={
          pendingAction
        }
      />

    </main>
  );
}

export default Products;