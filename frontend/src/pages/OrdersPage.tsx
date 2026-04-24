import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Order } from "../types";
import { orderService } from "../services/orderService";

const STATUS_CONFIG: Record<string, { bg: string; dot: string }> = {
  pending: { bg: "bg-amber-50 text-amber-700", dot: "bg-amber-400" },
  confirmed: { bg: "bg-blue-50 text-blue-700", dot: "bg-blue-400" },
  shipped: { bg: "bg-purple-50 text-purple-700", dot: "bg-purple-400" },
  delivered: { bg: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-400" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    orderService
      .getOrders()
      .then((res) => setOrders(res.data.orders))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6">
              <div className="flex justify-between mb-4">
                <div className="space-y-2">
                  <div className="h-5 bg-slate-200 rounded w-32" />
                  <div className="h-4 bg-slate-200 rounded w-24" />
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-5 bg-slate-200 rounded w-20 ml-auto" />
                  <div className="h-6 bg-slate-200 rounded w-24 ml-auto" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-20">
        <svg
          className="w-16 h-16 mx-auto text-slate-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          Failed to load orders
        </h3>
        <button
          onClick={() => window.location.reload()}
          className="text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  // Empty state
  if (orders.length === 0) {
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          No orders yet
        </h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          When you place an order, it will appear here. Start shopping to find
          something you love!
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Order History</h1>
          <p className="text-sm text-slate-500 mt-1">
            {orders.length} {orders.length === 1 ? "order" : "orders"} placed
          </p>
        </div>
        <Link
          to="/products"
          className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1"
        >
          Continue Shopping
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
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </Link>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedId === order.id;
          const config = STATUS_CONFIG[order.status] ?? {
            bg: "bg-slate-50 text-slate-600",
            dot: "bg-slate-400",
          };
          const orderDate = new Date(order.createdAt);

          return (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
              data-testid="order-card"
            >
              {/* Order Header - clickable */}
              <button
                onClick={() => toggle(order.id)}
                data-testid="order-toggle"
                aria-expanded={isExpanded}
                className="w-full px-6 py-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Order icon */}
                  <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-slate-100 rounded-lg flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-800">
                        Order #{order.id.toString().padStart(5, "0")}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${config.bg}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                        />
                        <span className="capitalize">{order.status}</span>
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {orderDate.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      {" · "}
                      {order.items.length}{" "}
                      {order.items.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-slate-900">
                    ${order.totalAmount.toFixed(2)}
                  </span>
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-6 py-4">
                  {/* Items */}
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-5 h-5 text-slate-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/products/${item.productId}`}
                              className="text-sm font-medium text-slate-800 hover:text-emerald-600 transition-colors"
                            >
                              {item.productName}
                            </Link>
                            <p className="text-xs text-slate-500">
                              ${item.price.toFixed(2)} x {item.quantity}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-slate-800 ml-4">
                          ${item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="border-t border-slate-100 mt-4 pt-4">
                    <div className="flex justify-between text-sm text-slate-600 mb-1">
                      <span>Subtotal</span>
                      <span>${order.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600 mb-1">
                      <span>Shipping</span>
                      <span className="text-emerald-600">Free</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-900 mt-2 pt-2 border-t border-slate-100">
                      <span>Total</span>
                      <span>${order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
