export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
}

export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  product: Product;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  itemCount: number;
  total: number;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface ProductListResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
