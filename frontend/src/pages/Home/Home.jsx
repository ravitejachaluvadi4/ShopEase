import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../../config/Api";
import { getProductImage } from "../../utils/ProductImages";

import "./Home.css";

const HERO_COUNT = 5;
const CAROUSEL_COUNT = 8;

function Home() {
  const [products, setProducts] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (products.length < 2) {
      return;
    }

    const timer = setInterval(() => {
      setHeroIndex((current) => {
        const count = Math.min(products.length, HERO_COUNT);
        return (current + 1) % count;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [products]);

  useEffect(() => {
    if (products.length < 2) {
      return;
    }

    const timer = setInterval(() => {
      setCarouselIndex((current) => {
        const count = Math.max(
          1,
          Math.min(products.length, CAROUSEL_COUNT)
        );

        return (current + 1) % count;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [products]);

  const loadProducts = async () => {
    try {
      setLoading(true);

      const response = await apiRequest("/products/");

      if (!response.ok) {
        throw new Error("Unable to load products.");
      }

      const data = await response.json();

      const productList = Array.isArray(data)
        ? data
        : data.products || [];

      setProducts(productList);
    } catch (error) {
      console.error("Home products error:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const heroProducts = products.slice(0, HERO_COUNT);

  const heroProduct =
    heroProducts[heroIndex] || products[0] || null;

  const carouselProducts = products.slice(
    0,
    Math.min(products.length, CAROUSEL_COUNT)
  );

  const visibleCarouselProducts = [];

  if (carouselProducts.length > 0) {
    for (let i = 0; i < Math.min(4, carouselProducts.length); i++) {
      const index =
        (carouselIndex + i) % carouselProducts.length;

      visibleCarouselProducts.push(carouselProducts[index]);
    }
  }

  const previousCarousel = () => {
    if (carouselProducts.length === 0) return;

    setCarouselIndex((current) => {
      return (
        (current - 1 + carouselProducts.length) %
        carouselProducts.length
      );
    });
  };

  const nextCarousel = () => {
    if (carouselProducts.length === 0) return;

    setCarouselIndex((current) => {
      return (
        (current + 1) %
        carouselProducts.length
      );
    });
  };

  const getCategoryProduct = (category) => {
    return products.find((product) => {
      const productCategory =
        product.category?.name ||
        product.category ||
        "";

      return productCategory === category;
    });
  };

  const categories = [
    {
      name: "Electronics",
      description: "Technology for everyday life.",
      number: "01",
      icon: "◉",
    },
    {
      name: "Fashion",
      description: "Simple pieces for every occasion.",
      number: "02",
      icon: "◇",
    },
    {
      name: "Home & Living",
      description: "Make your space feel better.",
      number: "03",
      icon: "⌂",
    },
    {
      name: "Sports",
      description: "Gear for an active lifestyle.",
      number: "04",
      icon: "◎",
    },
  ];

  return (
    <main className="home-page">

      {/* =========================
          HERO
      ========================= */}

      <section className="home-hero">

        <div className="home-hero-content">

          <div className="home-hero-label">
            <span></span>
            SHOP SMARTER / LIVE BETTER
          </div>

          <h1>
            Everything you need.
            <br />
            <span>Nothing you don't.</span>
          </h1>

          <p>
            Discover a carefully selected collection of
            technology, fashion, home essentials and
            everyday products — all in one place.
          </p>

          <div className="home-hero-buttons">

            <Link
              to="/products"
              className="home-primary-button"
            >
              Shop the collection
              <span>↗</span>
            </Link>

            <Link
              to="/products"
              className="home-secondary-button"
            >
              Explore products
            </Link>

          </div>

          <div className="home-hero-assurance">

            <span>✓</span>
            Easy shopping
            <i></i>

            <span>✓</span>
            Secure account
            <i></i>

            <span>✓</span>
            Simple orders

          </div>

        </div>


        {/* HERO SLIDESHOW */}

        <div className="home-hero-showcase">

          {heroProduct ? (

            <Link
              to={`/products/${heroProduct.id}`}
              className="home-hero-product-card"
            >

              <div className="hero-card-top">

                <span>
                  SHOPEASE / 2026
                </span>

                <span>
                  {String(heroIndex + 1).padStart(2, "0")}
                  {" / "}
                  {String(heroProducts.length).padStart(2, "0")}
                </span>

              </div>


              <div className="hero-card-image">

                <img
                  key={heroProduct.id}
                  src={getProductImage(heroProduct)}
                  alt={heroProduct.name}
                />

              </div>


              <div className="hero-card-bottom">

                <div>

                  <span>
                    {heroProduct.category?.name ||
                      heroProduct.category ||
                      "COLLECTION"}
                  </span>

                  <h2>
                    {heroProduct.name}
                  </h2>

                </div>

                <div className="hero-card-arrow">
                  ↗
                </div>

              </div>

            </Link>

          ) : (

            <div className="home-hero-product-card home-empty-card">

              <div className="hero-empty-icon">
                ✦
              </div>

              <p>
                Discover the ShopEase collection
              </p>

            </div>

          )}


          <div className="hero-slide-controls">

            <button
              type="button"
              onClick={() => {
                setHeroIndex((current) => {
                  const count = Math.min(
                    products.length,
                    HERO_COUNT
                  );

                  return (
                    (current - 1 + count) % count
                  );
                });
              }}
              aria-label="Previous slide"
            >
              ←
            </button>


            <div className="hero-dots">

              {heroProducts.map((product, index) => (

                <button
                  type="button"
                  key={product.id}
                  className={
                    index === heroIndex
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setHeroIndex(index)
                  }
                  aria-label={`Go to slide ${index + 1}`}
                />

              ))}

            </div>


            <button
              type="button"
              onClick={() => {
                setHeroIndex((current) => {
                  const count = Math.min(
                    products.length,
                    HERO_COUNT
                  );

                  return (current + 1) % count;
                });
              }}
              aria-label="Next slide"
            >
              →
            </button>

          </div>


          <div className="hero-floating-stat">

            <span>25+</span>

            <p>
              products
              <br />
              available
            </p>

          </div>

        </div>

      </section>


      {/* =========================
          TRUST STRIP
      ========================= */}

      <section className="home-trust">

        <div className="home-trust-item">
          <strong>25+</strong>
          <span>Curated products</span>
        </div>

        <div className="home-trust-divider"></div>

        <div className="home-trust-item">
          <strong>04</strong>
          <span>Product categories</span>
        </div>

        <div className="home-trust-divider"></div>

        <div className="home-trust-item">
          <strong>01</strong>
          <span>Simple experience</span>
        </div>

        <div className="home-trust-divider"></div>

        <div className="home-trust-item">
          <strong>24/7</strong>
          <span>Order access</span>
        </div>

      </section>


      {/* =========================
          SELECTED FOR YOU
      ========================= */}

      <section className="home-section selected-section">

        <div className="home-section-heading">

          <div>

            <span>
              THE COLLECTION
            </span>

            <h2>
              Selected for you.
            </h2>

          </div>


          <div className="section-navigation">

            <Link
              to="/products"
              className="view-products-link"
            >
              View all products ↗
            </Link>

            <div className="carousel-arrows">

              <button
                type="button"
                onClick={previousCarousel}
                aria-label="Previous products"
              >
                ←
              </button>

              <button
                type="button"
                onClick={nextCarousel}
                aria-label="Next products"
              >
                →
              </button>

            </div>

          </div>

        </div>


        {loading ? (

          <div className="home-loading">
            Loading collection...
          </div>

        ) : visibleCarouselProducts.length > 0 ? (

          <div className="selected-carousel">

            {visibleCarouselProducts.map(
              (product, index) => (

                <Link
                  key={`${product.id}-${carouselIndex}-${index}`}
                  to={`/products/${product.id}`}
                  className="selected-product-card"
                >

                  <div className="selected-product-image">

                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                    />

                    <span className="selected-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="selected-arrow">
                      ↗
                    </span>

                  </div>


                  <div className="selected-product-info">

                    <span>
                      {product.category?.name ||
                        product.category ||
                        "COLLECTION"}
                    </span>

                    <h3>
                      {product.name}
                    </h3>

                  </div>

                </Link>

              )
            )}

          </div>

        ) : (

          <div className="home-loading">
            No products available.
          </div>

        )}

      </section>


      {/* =========================
          CATEGORY SHOWCASE
      ========================= */}

      <section className="home-category-section">

        <div className="home-section">

          <div className="home-section-heading">

            <div>

              <span>
                EXPLORE
              </span>

              <h2>
                Shop your way.
              </h2>

            </div>

          </div>

        </div>


        <div className="category-showcase">

          {categories.map((category) => {

            const categoryProduct =
              getCategoryProduct(category.name);

            return (

              <Link
                key={category.name}
                to={`/products?category=${encodeURIComponent(
                  category.name
                )}`}
                className="category-showcase-card"
              >

                <div className="category-card-number">
                  {category.number}
                </div>


                <div className="category-card-icon">
                  {category.icon}
                </div>


                <div className="category-card-content">

                  <h3>
                    {category.name}
                  </h3>

                  <p>
                    {category.description}
                  </p>

                </div>


                <div className="category-card-image">

                  {categoryProduct ? (

                    <img
                      src={getProductImage(categoryProduct)}
                      alt={category.name}
                    />

                  ) : (

                    <span>
                      ✦
                    </span>

                  )}

                </div>


                <div className="category-card-arrow">
                  ↗
                </div>

              </Link>

            );
          })}

        </div>

      </section>


      {/* =========================
          WHY SHOPEASE
      ========================= */}

      <section className="home-experience">

        <div className="experience-intro">

          <span>
            WHY SHOPEASE
          </span>

          <h2>
            Shopping should
            <br />
            feel <em>simple.</em>
          </h2>

          <p>
            We keep the experience focused:
            discover products, add what you want,
            checkout easily and keep your orders
            organized.
          </p>

          <Link
            to="/products"
            className="experience-link"
          >
            Start shopping
            <span>↗</span>
          </Link>

        </div>


        <div className="experience-grid">

          <div className="experience-card">

            <span>01</span>

            <div className="experience-icon">
              ◇
            </div>

            <h3>
              Curated collection
            </h3>

            <p>
              Find useful products across
              everyday categories.
            </p>

          </div>


          <div className="experience-card">

            <span>02</span>

            <div className="experience-icon">
              +
            </div>

            <h3>
              Easy shopping
            </h3>

            <p>
              Add products and manage your
              cart without unnecessary steps.
            </p>

          </div>


          <div className="experience-card">

            <span>03</span>

            <div className="experience-icon">
              →
            </div>

            <h3>
              Simple checkout
            </h3>

            <p>
              Enter your delivery details and
              place your order with ease.
            </p>

          </div>


          <div className="experience-card">

            <span>04</span>

            <div className="experience-icon">
              ✓
            </div>

            <h3>
              Order history
            </h3>

            <p>
              Keep previous purchases organized
              in your account.
            </p>

          </div>

        </div>

      </section>


      {/* =========================
          FINAL CTA
      ========================= */}

      <section className="home-final">

        <div className="home-final-inner">

          <div>

            <span>
              SHOPEASE
            </span>

            <h2>
              Find something
              <br />
              worth keeping.
            </h2>

          </div>


          <Link
            to="/products"
            className="home-final-button"
          >
            Explore collection
            <span>↗</span>
          </Link>

        </div>

      </section>


      {/* =========================
          FOOTER
      ========================= */}

      <footer className="home-footer">

        <div className="footer-brand">
          ShopEase
        </div>

        <div className="footer-copy">
          Simple shopping. Better everyday.
        </div>

        <div className="footer-links">

          <Link to="/">
            Home
          </Link>

          <Link to="/products">
            Products
          </Link>

          <Link to="/cart">
            Cart
          </Link>

          <Link to="/orders">
            Orders
          </Link>

        </div>

      </footer>

    </main>
  );
}

export default Home;