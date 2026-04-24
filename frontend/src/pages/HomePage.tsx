import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../types";
import { productService } from "../services/productService";
import { getErrorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../components/Toast";
import ProductSkeleton from "../components/ProductSkeleton";
import ProductImage from "../components/ProductImage";

const CATEGORIES = [
  {
    name: "Electronics",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    ),
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  {
    name: "Clothing",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    ),
    color: "from-pink-500 to-pink-600",
    bg: "bg-pink-50",
    text: "text-pink-600",
  },
  {
    name: "Books",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    ),
    color: "from-amber-500 to-amber-600",
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
  {
    name: "Home & Kitchen",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    ),
    color: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    productService
      .getProducts({ limit: 6, sort: "price_desc" })
      .then((res) => setFeatured(res.data.products))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (productId: number) => {
    if (!isAuthenticated) return;
    setAddingId(productId);
    try {
      await addToCart(productId, 1);
      const product = featured.find((p) => p.id === productId);
      showToast(`${product?.name ?? "Product"} added to cart!`);
    } catch (err: any) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-8 sm:p-14">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-56 h-56 bg-blue-400 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block bg-emerald-500/20 text-emerald-400 text-sm font-medium px-3 py-1 rounded-full mb-4">
            New Arrivals Available
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight">
            Discover Products
            <br />
            You'll <span className="text-emerald-400">Love</span>
          </h1>
          <p className="text-slate-300 text-lg mb-8 leading-relaxed">
            From cutting-edge electronics to timeless books, find everything you
            need at unbeatable prices. Start shopping today!
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-7 py-3.5 rounded-xl transition-colors"
            >
              Shop Now
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            {!isAuthenticated && (
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-7 py-3.5 rounded-xl transition-colors backdrop-blur-sm"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Category Cards */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          Shop by Category
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              className="group relative overflow-hidden bg-white rounded-xl border border-slate-100 p-6 hover:shadow-md transition-all"
            >
              <div
                className={`inline-flex items-center justify-center w-12 h-12 ${cat.bg} rounded-xl mb-3`}
              >
                <svg
                  className={`w-6 h-6 ${cat.text}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {cat.icon}
                </svg>
              </div>
              <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                {cat.name}
              </h3>
              <svg
                className="absolute top-6 right-6 w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            Featured Products
          </h2>
          <Link
            to="/products"
            className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            View all
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <ProductSkeleton count={6} />
        ) : error ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-slate-500">Failed to load products. Please try again later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="h-52 bg-slate-100 overflow-hidden">
                  <ProductImage
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    {product.category}
                  </span>
                  <h3 className="font-semibold mt-2 text-slate-800 group-hover:text-emerald-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xl font-bold text-slate-900">
                      ${product.price.toFixed(2)}
                    </span>
                    {isAuthenticated && product.stock > 0 && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAdd(product.id);
                        }}
                        disabled={addingId === product.id}
                        className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                      >
                        {addingId === product.id ? "Adding..." : "Add to Cart"}
                      </button>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
