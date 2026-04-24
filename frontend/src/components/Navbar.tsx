import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const itemCount = cart?.itemCount ?? 0;

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            ShopEasy
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="hover:text-emerald-400 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/products"
              className="hover:text-emerald-400 transition-colors"
            >
              Products
            </Link>

            {isAuthenticated && (
              <Link
                to="/cart"
                data-testid="cart-link"
                className="relative hover:text-emerald-400 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                  />
                </svg>
                {itemCount > 0 && (
                  <span data-testid="cart-badge" className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded-full font-semibold transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  to="/orders"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Orders
                </Link>
                <span data-testid="user-name" className="text-slate-300 text-sm">
                  {user?.name}
                </span>
                <button
                  onClick={handleLogout}
                  data-testid="logout-btn"
                  className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-sm transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-emerald-500 hover:bg-emerald-600 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              to="/"
              className="block py-2 hover:text-emerald-400"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/products"
              className="block py-2 hover:text-emerald-400"
              onClick={() => setMenuOpen(false)}
            >
              Products
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/cart"
                  className="block py-2 hover:text-emerald-400"
                  onClick={() => setMenuOpen(false)}
                >
                  Cart ({itemCount})
                </Link>
                <Link
                  to="/orders"
                  className="block py-2 hover:text-emerald-400"
                  onClick={() => setMenuOpen(false)}
                >
                  Orders
                </Link>
                <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
                  <span className="text-slate-300 text-sm">{user?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-slate-700 px-3 py-1.5 rounded-lg text-sm"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-2 border-t border-slate-700 space-y-2">
                <Link
                  to="/login"
                  className="block py-2 hover:text-emerald-400"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block bg-emerald-500 text-center py-2 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
