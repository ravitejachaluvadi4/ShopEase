import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../../config/Api";
import { getProductImage } from "../../utils/ProductImages";
import "./Checkout.css";

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  const buyNow = Boolean(location.state?.buyNow);
  const buyNowProduct = location.state?.product;
  const buyNowQuantity = Number(
    location.state?.quantity || 1
  );

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(!buyNow);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [formErrors, setFormErrors] = useState({});

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] =
    useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] =
    useState(false);

  /*
   * --------------------------------------------------
   * RESTORE DATA WHEN COMING BACK FROM REVIEW
   * --------------------------------------------------
   */

  useEffect(() => {
    const shipping =
      location.state?.shipping;

    const coupon =
      location.state?.coupon;

    if (shipping) {
      setForm({
        full_name:
          shipping.full_name || "",

        phone:
          shipping.phone || "",

        address_line1:
          shipping.address_line1 || "",

        address_line2:
          shipping.address_line2 || "",

        city:
          shipping.city || "",

        state:
          shipping.state || "",

        pincode:
          shipping.pincode || "",
      });
    }

    if (coupon) {
      setAppliedCoupon(coupon);

      setCouponCode(
        coupon.code ||
          coupon.coupon?.code ||
          ""
      );
    }
  }, [location.state]);

  /*
   * --------------------------------------------------
   * LOAD CART
   * --------------------------------------------------
   */

  useEffect(() => {
    if (buyNow) {
      setLoading(false);
      return;
    }

    const fetchCart = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiRequest(
          "/cart/"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load cart."
          );
        }

        if (
          !data.items ||
          data.items.length === 0
        ) {
          navigate("/cart", {
            replace: true,
          });

          return;
        }

        setCart(data);
      } catch (err) {
        setError(
          err.message ||
            "Unable to load cart."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [buyNow, navigate]);

  /*
   * --------------------------------------------------
   * CHECKOUT ITEMS
   * --------------------------------------------------
   */

  const checkoutItems = useMemo(() => {
    if (buyNow && buyNowProduct) {
      return [
        {
          id: `buy-${buyNowProduct.id}`,
          product: buyNowProduct,
          quantity: buyNowQuantity,
        },
      ];
    }

    return cart?.items || [];
  }, [
    buyNow,
    buyNowProduct,
    buyNowQuantity,
    cart,
  ]);

  /*
   * --------------------------------------------------
   * BILLING
   * --------------------------------------------------
   */

  const subtotal = checkoutItems.reduce(
    (sum, item) =>
      sum +
      Number(item.product.price || 0) *
        Number(item.quantity || 0),
    0
  );

  const totalItems = checkoutItems.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0),
    0
  );

  const discount = appliedCoupon
    ? Number(
        appliedCoupon.discount || 0
      )
    : 0;

  const finalTotal = Math.max(
    subtotal - discount,
    0
  );

  /*
   * --------------------------------------------------
   * FORM CHANGE
   * --------------------------------------------------
   */

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setFormErrors((current) => ({
      ...current,
      [name]: "",
    }));
  };

  /*
   * --------------------------------------------------
   * FORM VALIDATION
   * --------------------------------------------------
   */

  const validateForm = () => {
    const errors = {};

    if (!form.full_name.trim()) {
      errors.full_name =
        "Full name is required.";
    }

    if (
      !/^\d{10}$/.test(
        form.phone.trim()
      )
    ) {
      errors.phone =
        "Enter a valid 10-digit phone number.";
    }

    if (!form.address_line1.trim()) {
      errors.address_line1 =
        "Address is required.";
    }

    if (!form.city.trim()) {
      errors.city =
        "City is required.";
    }

    if (!form.state.trim()) {
      errors.state =
        "State is required.";
    }

    if (
      !/^\d{6}$/.test(
        form.pincode.trim()
      )
    ) {
      errors.pincode =
        "Enter a valid 6-digit pincode.";
    }

    setFormErrors(errors);

    return (
      Object.keys(errors).length === 0
    );
  };

  /*
   * --------------------------------------------------
   * APPLY COUPON
   * --------------------------------------------------
   */

  const handleApplyCoupon = async () => {
    const code = couponCode
      .trim()
      .toUpperCase();

    if (!code) {
      setCouponError(
        "Please enter a coupon code."
      );

      return;
    }

    try {
      setCouponLoading(true);
      setCouponError("");

      const items =
        checkoutItems.map((item) => ({
          product_id:
            item.product.id,

          quantity:
            Number(item.quantity),
        }));

      const response =
        await apiRequest(
          "/coupons/apply/",
          {
            method: "POST",

            body: JSON.stringify({
              code,
              items,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to apply coupon."
        );
      }

      setAppliedCoupon({
        ...data,

        code:
          data.coupon?.code ||
          code,
      });

      setCouponCode(
        data.coupon?.code ||
          code
      );
    } catch (err) {
      setAppliedCoupon(null);

      setCouponError(
        err.message ||
          "Unable to apply coupon."
      );
    } finally {
      setCouponLoading(false);
    }
  };

  /*
   * --------------------------------------------------
   * REMOVE COUPON
   * --------------------------------------------------
   */

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  /*
   * --------------------------------------------------
   * CONTINUE TO REVIEW
   * --------------------------------------------------
   */

  const handleContinue = (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    navigate(
      "/checkout/review",
      {
        state: {
          buyNow,
          product: buyNowProduct,
          quantity: buyNowQuantity,
          cart,
          shipping: form,
          coupon: appliedCoupon,
        },
      }
    );
  };

  /*
   * --------------------------------------------------
   * LOADING
   * --------------------------------------------------
   */

  if (loading) {
    return (
      <main className="checkout-page">

        <div className="checkout-loading">

          <div className="checkout-spinner"></div>

          <p>
            Preparing checkout...
          </p>

        </div>

      </main>
    );
  }

  /*
   * --------------------------------------------------
   * ERROR
   * --------------------------------------------------
   */

  if (error) {
    return (
      <main className="checkout-page">

        <div className="checkout-error">

          <div className="checkout-error-icon">
            !
          </div>

          <h2>
            Checkout unavailable
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/cart")
            }
          >
            Back to Cart
          </button>

        </div>

      </main>
    );
  }

  /*
   * --------------------------------------------------
   * EMPTY CHECKOUT
   * --------------------------------------------------
   */

  if (!checkoutItems.length) {
    navigate("/cart", {
      replace: true,
    });

    return null;
  }

  /*
   * --------------------------------------------------
   * UI
   * --------------------------------------------------
   */

  return (
    <main className="checkout-page">

      <div className="checkout-container">

        {/* HEADER */}

        <div className="checkout-header">

          <div>

            <span className="checkout-eyebrow">
              {buyNow
                ? "Quick purchase"
                : "Secure checkout"}
            </span>

            <h1>
              Delivery Details
            </h1>

            <p>
              Enter where you'd like
              your order delivered.
            </p>

          </div>

        </div>

        {/* PROGRESS */}

        <div className="checkout-progress">

          <div className="checkout-step active">

            <span>
              01
            </span>

            <strong>
              Address
            </strong>

          </div>

          <div className="progress-line"></div>

          <div className="checkout-step">

            <span>
              02
            </span>

            <strong>
              Review
            </strong>

          </div>

          <div className="progress-line"></div>

          <div className="checkout-step">

            <span>
              03
            </span>

            <strong>
              Complete
            </strong>

          </div>

        </div>

        {/* MAIN */}

        <div className="checkout-layout">

          {/* ADDRESS CARD */}

          <section className="address-card">

            <div className="card-heading">

              <div>

                <span>
                  Delivery address
                </span>

                <h2>
                  Where should we deliver?
                </h2>

              </div>

              <div className="secure-mark">
                ✓ Secure
              </div>

            </div>

            <form
              onSubmit={handleContinue}
            >

              <div className="form-grid">

                {/* FULL NAME */}

                <div className="checkout-field full-width">

                  <label htmlFor="full_name">
                    Full Name
                  </label>

                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={
                      form.full_name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter your full name"
                  />

                  {formErrors.full_name && (
                    <small>
                      {
                        formErrors.full_name
                      }
                    </small>
                  )}

                </div>

                {/* PHONE */}

                <div className="checkout-field">

                  <label htmlFor="phone">
                    Phone Number
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength="10"
                    value={
                      form.phone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="10-digit number"
                  />

                  {formErrors.phone && (
                    <small>
                      {
                        formErrors.phone
                      }
                    </small>
                  )}

                </div>

                {/* PINCODE */}

                <div className="checkout-field">

                  <label htmlFor="pincode">
                    Pincode
                  </label>

                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    inputMode="numeric"
                    maxLength="6"
                    value={
                      form.pincode
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="6-digit pincode"
                  />

                  {formErrors.pincode && (
                    <small>
                      {
                        formErrors.pincode
                      }
                    </small>
                  )}

                </div>

                {/* ADDRESS */}

                <div className="checkout-field full-width">

                  <label htmlFor="address_line1">
                    Address
                  </label>

                  <input
                    id="address_line1"
                    name="address_line1"
                    type="text"
                    value={
                      form.address_line1
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="House / Flat / Street address"
                  />

                  {formErrors.address_line1 && (
                    <small>
                      {
                        formErrors.address_line1
                      }
                    </small>
                  )}

                </div>

                {/* ADDRESS 2 */}

                <div className="checkout-field full-width">

                  <label
                    htmlFor="address_line2"
                    className="optional-field"
                  >
                    Address Line 2

                    <span>
                      Optional
                    </span>
                  </label>

                  <input
                    id="address_line2"
                    name="address_line2"
                    type="text"
                    value={
                      form.address_line2
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Apartment, landmark, etc."
                  />

                </div>

                {/* CITY */}

                <div className="checkout-field">

                  <label htmlFor="city">
                    City
                  </label>

                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={
                      form.city
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Your city"
                  />

                  {formErrors.city && (
                    <small>
                      {
                        formErrors.city
                      }
                    </small>
                  )}

                </div>

                {/* STATE */}

                <div className="checkout-field">

                  <label htmlFor="state">
                    State
                  </label>

                  <input
                    id="state"
                    name="state"
                    type="text"
                    value={
                      form.state
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Your state"
                  />

                  {formErrors.state && (
                    <small>
                      {
                        formErrors.state
                      }
                    </small>
                  )}

                </div>

              </div>

              {/* ACTIONS */}

              <div className="address-actions">

                <button
                  type="button"
                  className="back-checkout"
                  onClick={() =>
                    navigate(
                      buyNow
                        ? `/products/${buyNowProduct.id}`
                        : "/cart"
                    )
                  }
                >
                  ← Back
                </button>

                <button
                  type="submit"
                  className="continue-review"
                >
                  Continue to Review

                  <span>
                    →
                  </span>

                </button>

              </div>

            </form>

          </section>

          {/* ORDER SUMMARY */}

          <aside className="checkout-summary">

            <div className="summary-heading">

              <span>
                Your order
              </span>

              <h2>
                Summary
              </h2>

            </div>

            {/* PRODUCTS */}

            <div className="checkout-items">

              {checkoutItems.map(
                (item) => (

                  <div
                    className="checkout-product"
                    key={item.id}
                  >

                    <div className="checkout-product-image">

                      <img
                        src={getProductImage(
                          item.product
                        )}
                        alt={
                          item.product.name
                        }
                      />

                      <span>
                        {item.quantity}
                      </span>

                    </div>

                    <div className="checkout-product-info">

                      <strong>
                        {
                          item.product.name
                        }
                      </strong>

                      <span>
                        ₹
                        {Number(
                          item.product.price
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </span>

                    </div>

                  </div>

                )
              )}

            </div>

            <div className="checkout-divider"></div>

            {/* COUPON */}

            <div className="checkout-coupon">

              <div className="coupon-heading">

                <span>
                  Savings
                </span>

                <h3>
                  Have a coupon?
                </h3>

              </div>

              {!appliedCoupon ? (

                <>

                  <div className="coupon-input-row">

                    <input
                      type="text"
                      value={
                        couponCode
                      }
                      onChange={(
                        event
                      ) =>
                        setCouponCode(
                          event.target.value.toUpperCase()
                        )
                      }
                      onKeyDown={(
                        event
                      ) => {

                        if (
                          event.key ===
                          "Enter"
                        ) {
                          event.preventDefault();

                          handleApplyCoupon();
                        }

                      }}
                      placeholder="Enter coupon code"
                    />

                    <button
                      type="button"
                      onClick={
                        handleApplyCoupon
                      }
                      disabled={
                        couponLoading
                      }
                    >
                      {couponLoading
                        ? "..."
                        : "Apply"}
                    </button>

                  </div>

                  {couponError && (
                    <small className="coupon-error">
                      {couponError}
                    </small>
                  )}

                </>

              ) : (

                <div className="coupon-applied">

                  <div className="coupon-applied-info">

                    <span className="coupon-check">
                      ✓
                    </span>

                    <div>

                      <strong>
                        {
                          appliedCoupon.code
                        }
                      </strong>

                      <small>
                        Coupon applied successfully
                      </small>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={
                      handleRemoveCoupon
                    }
                  >
                    Remove
                  </button>

                </div>

              )}

            </div>

            <div className="checkout-divider"></div>

            {/* BILLING */}

            <div className="checkout-summary-lines">

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

              {discount > 0 && (

                <div className="discount-line">

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

            <div className="checkout-divider"></div>

            {/* TOTAL */}

            <div className="checkout-total">

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

            {/* SECURITY */}

            <div className="checkout-security">

              <span>
                ✓
              </span>

              <div>

                <strong>
                  Safe & simple checkout
                </strong>

                <p>
                  No hidden charges.
                  Your order will be
                  confirmed after review.
                </p>

              </div>

            </div>

          </aside>

        </div>

      </div>

    </main>
  );
}

export default Checkout;