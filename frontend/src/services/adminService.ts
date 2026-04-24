import api from "../api";

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
}

export interface AdminOrder {
  id: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  user: { id: number; name: string; email: string };
  items: {
    id: number;
    productId: number;
    productName: string;
    productImage: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
}

export interface AdminOrdersResponse {
  orders: AdminOrder[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const adminService = {
  getStats: () => api.get<DashboardStats>("/admin/stats"),

  getOrders: (page = 1, limit = 20) =>
    api.get<AdminOrdersResponse>("/admin/orders", { params: { page, limit } }),

  updateOrderStatus: (orderId: number, status: string) =>
    api.put(`/orders/${orderId}/status`, { status }),
};
