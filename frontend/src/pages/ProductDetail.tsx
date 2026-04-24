import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import type { Product } from "../types";
import { productService } from "../services/productService";
import { getErrorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../components/Toast";
import ProductImage from "../components/ProductImage";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    productService
      .getProduct(parseInt(id))
      .then((res) => setProduct(res.data))
      .catch((err) => {
        setError(
          err.response?.status === 404
            ? "Product not found."
            : "Failed to load product."
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      showToast(
        `${quantity} x ${product.name} added to cart!`,
        "success"
      );
      setQuantity(1);
    } catch (err: any) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setAdding(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-square bg-slate-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-5 bg-slate-200 rounded w-24" />
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-10 bg-slate-200 rounded w-32" />
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-2/3" />
            <div className="h-12 bg-slate-200 rounded w-48 mt-8" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-20">
        <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">{error}</h3>
        <Link
          to="/products"
          className="text-emerald-600 hover:text-emerald-700 font-medium"
        >
          &larr; Back to products
        </Link>
      </div>
    );
  }

  if (!product) return null;

  const inStock = product.stock > 0;

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
        <Link to="/" className="hover:text-emerald-600 transition-colors">
          Home
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link to="/products" className="hover:text-emerald-600 transition-colors">
          Products
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-800 font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Product Image */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="aspect-square bg-slate-100">
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Product Info */}
        <div>
          <span className="inline-block text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-3">
            {product.category}
          </span>

          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            {product.name}
          </h1>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-4xl font-bold text-slate-900">
              ${product.price.toFixed(2)}
            </span>
          </div>

          {/* Stock Indicator */}
          <div className="flex items-center gap-2 mb-6">
            {inStock ? (
              <>
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                <span className="text-sm text-emerald-700 font-medium">
                  In Stock
                </span>
                <span className="text-sm text-slate-400">
                  ({product.stock} available)
                </span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                <span className="text-sm text-red-600 font-medium">
                  Out of Stock
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Description
            </h3>
            <p className="text-slate-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Add to Cart */}
          {isAuthenticated ? (
            inStock ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-4 py-3 hover:bg-slate-100 transition-colors text-lg font-medium"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v) && v >= 1 && v <= product.stock) {
                        setQuantity(v);
                      }
                    }}
                    className="w-16 text-center py-3 border-x border-slate-300 focus:outline-none text-lg font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() =>
                      setQuantity((q) => Math.min(product.stock, q + 1))
                    }
                    className="px-4 py-3 hover:bg-slate-100 transition-colors text-lg font-medium"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium py-3.5 px-8 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {adding ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Adding...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                      </svg>
                      Add to Cart — ${(product.price * quantity).toFixed(2)}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                disabled
                className="w-full bg-slate-300 text-slate-500 font-medium py-3.5 rounded-xl cursor-not-allowed"
              >
                Out of Stock
              </button>
            )
          ) : (
            <Link
              to="/login"
              className="block w-full text-center bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3.5 rounded-xl transition-colors"
            >
              Login to Add to Cart
            </Link>
          )}

          {/* Details */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 rounded-lg p-3">
                <span className="text-slate-500">Category</span>
                <p className="font-medium text-slate-800">{product.category}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <span className="text-slate-500">Product ID</span>
                <p className="font-medium text-slate-800">#{product.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
