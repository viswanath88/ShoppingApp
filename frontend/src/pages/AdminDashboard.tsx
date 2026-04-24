import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../services/adminService";
import type { DashboardStats, AdminOrder } from "../services/adminService";
import { useToast } from "../components/Toast";
import { getErrorMessage } from "../api";

const STATUS_OPTIONS = ["pending", "confirmed", "shipped", "delivered"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  shipped: "bg-purple-50 text-purple-700",
  delivered: "bg-emerald-50 text-emerald-700",
};

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([adminService.getStats(), adminService.getOrders(1, 50)])
      .then(([statsRes, ordersRes]) => {
        setStats(statsRes.data);
        setOrders(ordersRes.data.orders);
      })
      .catch(() => showToast("Failed to load dashboard data.", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await adminService.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      showToast(`Order #${orderId} updated to ${newStatus}.`);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-slate-200 rounded w-56" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 h-28" />
          ))}
        </div>
        <div className="bg-white rounded-xl p-6 h-96" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your store overview and orders
          </p>
        </div>
        <Link
          to="/products"
          className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1"
        >
          View Store
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Products"
            value={stats.totalProducts.toString()}
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            }
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders.toString()}
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            }
            color="bg-purple-50 text-purple-600"
          />
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toFixed(2)}`}
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            }
            color="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers.toString()}
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            }
            color="bg-amber-50 text-amber-600"
          />
        </div>
      )}

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Recent Orders</h2>
          <p className="text-sm text-slate-500">
            {orders.length} {orders.length === 1 ? "order" : "orders"} total
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            No orders yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider">
                  <th className="text-left px-6 py-3 font-semibold">Order ID</th>
                  <th className="text-left px-6 py-3 font-semibold">Customer</th>
                  <th className="text-left px-6 py-3 font-semibold">Items</th>
                  <th className="text-left px-6 py-3 font-semibold">Date</th>
                  <th className="text-right px-6 py-3 font-semibold">Total</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      #{order.id.toString().padStart(5, "0")}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-800">{order.user.name}</p>
                        <p className="text-xs text-slate-500">{order.user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {order.items.slice(0, 3).map((item) => (
                          <img
                            key={item.id}
                            src={item.productImage}
                            alt={item.productName}
                            title={item.productName}
                            className="w-8 h-8 rounded-full border-2 border-white object-cover"
                          />
                        ))}
                        {order.items.length > 3 && (
                          <span className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                            +{order.items.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-800">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingId === order.id || order.status === "delivered"}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${STATUS_COLORS[order.status] ?? "bg-slate-50 text-slate-600"}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icon}
          </svg>
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
