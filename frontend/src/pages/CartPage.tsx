import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../components/Toast";
import { getErrorMessage } from "../api";

const TAX_RATE = 0.08;

export default function CartPage() {
  const { cart, loading, updateItem, removeItem, clearCart } = useCart();
  const { showToast } = useToast();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const handleQuantityChange = async (itemId: number, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingId(itemId);
    try {
      await updateItem(itemId, newQty);
    } catch (err: any) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId: number, productName: string) => {
    setRemovingId(itemId);
    try {
      await removeItem(itemId);
      showToast(`${productName} removed from cart.`, "info");
    } catch (err: any) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      showToast("Cart cleared.", "info");
    } catch {
      showToast("Failed to clear cart.", "error");
    }
  };

  const subtotal = cart?.total ?? 0;
  const tax = subtotal * TAX_RATE;
  const grandTotal = subtotal + tax;

  // Loading skeleton
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 flex gap-4">
                <div className="w-24 h-24 bg-slate-200 rounded-lg" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-24" />
                  <div className="h-8 bg-slate-200 rounded w-32" />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl p-6 h-64">
            <div className="space-y-4">
              <div className="h-6 bg-slate-200 rounded w-32" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-12 bg-slate-200 rounded w-full mt-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-28 h-28 bg-slate-100 rounded-full mb-6">
          <svg
            className="w-14 h-14 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Your cart is empty
        </h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Looks like you haven't added anything to your cart yet. Browse our
          products and find something you love!
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-8 py-3.5 rounded-xl transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Shopping Cart</h1>
          <p className="text-sm text-slate-500 mt-1">
            {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"} in your
            cart
          </p>
        </div>
        <button
          onClick={handleClearCart}
          className="flex items-center gap-1.5 text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5 transition-opacity ${
                removingId === item.id ? "opacity-50" : ""
              }`}
              data-testid="cart-item"
            >
              <div className="flex gap-4">
                {/* Product Image */}
                <Link
                  to={`/products/${item.productId}`}
                  className="flex-shrink-0"
                >
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-100 rounded-lg overflow-hidden">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        to={`/products/${item.productId}`}
                        className="font-semibold text-slate-800 hover:text-emerald-600 transition-colors line-clamp-1"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-slate-500 mt-0.5">
                        ${item.product.price.toFixed(2)} each
                      </p>
                      {item.product.stock <= 5 && item.product.stock > 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          Only {item.product.stock} left in stock
                        </p>
                      )}
                    </div>
                    {/* Remove button (desktop) */}
                    <button
                      onClick={() => handleRemove(item.id, item.product.name)}
                      disabled={removingId === item.id}
                      className="hidden sm:flex items-center gap-1 text-sm text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove item"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Remove
                    </button>
                  </div>

                  {/* Quantity & Subtotal */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity - 1)
                        }
                        disabled={
                          item.quantity <= 1 || updatingId === item.id
                        }
                        className="px-3 py-2 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-sm font-medium"
                      >
                        -
                      </button>
                      <span
                        className={`px-4 py-2 text-sm font-medium min-w-[3rem] text-center border-x border-slate-300 ${
                          updatingId === item.id ? "text-slate-400" : ""
                        }`}
                      >
                        {updatingId === item.id ? (
                          <svg
                            className="w-4 h-4 animate-spin mx-auto"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                        ) : (
                          item.quantity
                        )}
                      </span>
                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity + 1)
                        }
                        disabled={
                          item.quantity >= item.product.stock ||
                          updatingId === item.id
                        }
                        className="px-3 py-2 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-sm font-medium"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-lg font-bold text-slate-900">
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Remove button (mobile) */}
                  <button
                    onClick={() => handleRemove(item.id, item.product.name)}
                    disabled={removingId === item.id}
                    className="sm:hidden flex items-center gap-1 text-sm text-slate-400 hover:text-red-500 transition-colors mt-3"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Continue Shopping */}
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors mt-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Continue Shopping
          </Link>
        </div>

        {/* Cart Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-slate-800 mb-5">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>
                  Subtotal ({cart.itemCount}{" "}
                  {cart.itemCount === 1 ? "item" : "items"})
                </span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="font-medium text-emerald-600">Free</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax (8%)</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-base font-bold text-slate-900">
                    Grand Total
                  </span>
                  <span className="text-xl font-bold text-slate-900">
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <Link
              to="/checkout"
              className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              data-testid="checkout-btn"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Proceed to Checkout
            </Link>

            {/* Security badge */}
            <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-slate-400">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Secure checkout
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
