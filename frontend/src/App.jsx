import { BrowserRouter, Routes, Route } from "react-router-dom";
import Footer from "./components/Footer/Footer";
import Navbar from "./components/Navbar/Navbar";

import Home from "./pages/Home/Home";
import Products from "./pages/Products/Products";
import ProductDetails from "./pages/ProductDetails/ProductDetails";

import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";

import Cart from "./pages/Cart/Cart";
import Checkout from "./pages/Checkout/Checkout";

import OrderSuccess from "./pages/OrderSuccess/OrderSuccess";
import Orders from "./pages/Orders/Orders";
import OrderDetails from "./pages/OrderDetails/OrderDetails";

import Profile from "./pages/Profile/Profile";
import NotFound from "./pages/Notfound/NotFound";

import { AuthProvider } from "./context/AuthContext";
import CheckoutReview from "./pages/CheckoutReview/CheckoutReview";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />

        <Routes>
          {/* Home */}
          <Route
            path="/"
            element={<Home />}
          />

          {/* Products */}
          <Route
            path="/products"
            element={<Products />}
          />

          <Route
            path="/products/:id"
            element={<ProductDetails />}
          />

          {/* Authentication */}
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          {/* Cart */}
          <Route
            path="/cart"
            element={<Cart />}
          />

          {/* Checkout */}
          <Route
            path="/checkout"
            element={<Checkout />}
          />

          {/* Order Success */}
          <Route
            path="/order-success"
            element={<OrderSuccess />}
          />

          {/* Orders */}
          <Route
            path="/orders"
            element={<Orders />}
          />

          <Route
            path="/orders/:id"
            element={<OrderDetails />}
          />

          {/* Profile */}
          <Route
            path="/profile"
            element={<Profile />}
          />

          {/* 404 */}
          <Route
            path="*"
            element={<NotFound />}
          />
          <Route
  path="/checkout/review"
  element={<CheckoutReview />}
/>
        </Routes>
        <Footer/>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;