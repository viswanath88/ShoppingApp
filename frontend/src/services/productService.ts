import api from "../api";
import type { Product, ProductListResponse } from "../types";

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sort?: string;
}

export const productService = {
  getProducts: (params?: ProductQueryParams) =>
    api.get<ProductListResponse>("/products", { params }),

  getProduct: (id: number) => api.get<Product>(`/products/${id}`),

  searchProducts: (query: string, params?: Omit<ProductQueryParams, "search">) =>
    api.get<ProductListResponse>("/products", {
      params: { ...params, search: query },
    }),
};
