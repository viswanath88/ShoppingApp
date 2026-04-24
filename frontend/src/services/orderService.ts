import api from "../api";
import type { Order } from "../types";

export const orderService = {
  placeOrder: () =>
    api.post<{ message: string; order: Order }>("/orders"),

  getOrders: () => api.get<{ orders: Order[] }>("/orders"),

  getOrder: (id: number) => api.get<Order>(`/orders/${id}`),
};
