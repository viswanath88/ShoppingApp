import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { Cart } from "../types";
import { cartService } from "../services/cartService";
import { useAuth } from "./AuthContext";

interface CartState {
  cart: Cart | null;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (productId: number, quantity: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartState | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const res = await cartService.getCart();
      setCart(res.data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(async (productId: number, quantity: number) => {
    const res = await cartService.addToCart(productId, quantity);
    setCart(res.data);
  }, []);

  const updateItem = useCallback(async (itemId: number, quantity: number) => {
    const res = await cartService.updateQuantity(itemId, quantity);
    setCart(res.data);
  }, []);

  const removeItem = useCallback(async (itemId: number) => {
    const res = await cartService.removeItem(itemId);
    setCart(res.data);
  }, []);

  const clearCart = useCallback(async () => {
    const res = await cartService.clearCart();
    setCart(res.data);
  }, []);

  return (
    <CartContext.Provider
      value={{ cart, loading, refreshCart, addToCart, updateItem, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
