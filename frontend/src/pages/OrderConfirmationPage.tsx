import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import type { Order } from "../types";
import { orderService } from "../services/orderService";

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    orderService
      .getOrder(parseInt(id))
      .then((res) => setOrder(res.data))
      .catch(() => setError("Failed to load order details."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse py-12">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-slate-200 rounded-full mb-4" />
          <div className="h-7 bg-slate-200 rounded w-64 mb-2" />
          <div className="h-4 bg-slate-200 rounded w-48" />
        </div>
        <div className="bg-white rounded-xl p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-5 bg-slate-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !order) {
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
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          {error || "Order not found"}
        </h3>
        <Link
          to="/orders"
          className="text-emerald-600 hover:text-emerald-700 font-medium"
        >
          View all orders
        </Link>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt);

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Success Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-5">
          <svg
            className="w-10 h-10 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Order Confirmed!
        </h1>
        <p className="text-slate-500">
          Thank you for your purchase. Your order has been placed successfully.
        </p>
      </div>

      {/* Order Details Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Order Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-sm text-slate-500">Order Number</span>
              <p className="text-lg font-bold text-slate-800">
                #{order.id.toString().padStart(5, "0")}
              </p>
            </div>
            <div className="text-sm text-slate-500">
              <span>Placed on </span>
              <span className="text-slate-700 font-medium">
                {orderDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Items Ordered
          </h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 font-medium">
                    {item.productName}
                  </p>
                  <p className="text-sm text-slate-500">
                    ${item.price.toFixed(2)} x {item.quantity}
                  </p>
                </div>
                <span className="text-slate-800 font-semibold ml-4">
                  ${item.subtotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>${order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span className="text-emerald-600 font-medium">Free</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax (8%)</span>
              <span>${(order.totalAmount * 0.08).toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-bold text-slate-900">Total Paid</span>
                <span className="text-xl font-bold text-emerald-600">
                  ${(order.totalAmount * 1.08).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-6 py-3 rounded-xl transition-colors"
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          View All Orders
        </Link>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
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
    </div>
  );
}
