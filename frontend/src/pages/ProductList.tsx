import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { Product } from "../types";
import { productService } from "../services/productService";
import { getErrorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../components/Toast";
import ProductSkeleton from "../components/ProductSkeleton";
import ProductImage from "../components/ProductImage";

const CATEGORIES = ["All", "Electronics", "Clothing", "Books", "Home & Kitchen"];
const SORT_OPTIONS = [
  { value: "", label: "Default" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A-Z" },
  { value: "name_desc", label: "Name: Z-A" },
];

export default function ProductList() {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [addingId, setAddingId] = useState<number | null>(null);

  // Read filters from URL
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "";
  const page = parseInt(searchParams.get("page") || "1");

  const [searchInput, setSearchInput] = useState(search);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params: Record<string, string | number> = { page, limit: 8 };
      if (search) params.search = search;
      if (category) params.category = category;
      if (sort) params.sort = sort;

      const res = await productService.getProducts(params);
      setProducts(res.data.products);
      setTotal(res.data.pagination.total);
      setTotalPages(res.data.pagination.totalPages);
    } catch {
      setProducts([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, sort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("search", searchInput.trim());
  };

  const handleAdd = async (product: Product) => {
    setAddingId(product.id);
    try {
      await addToCart(product.id, 1);
      showToast(`${product.name} added to cart!`);
    } catch (err: any) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setAddingId(null);
    }
  };

  const pageNumbers = () => {
    const pages: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Products</h1>
          {!loading && (
            <p className="text-sm text-slate-500 mt-1">
              {total} {total === 1 ? "product" : "products"} found
              {category ? ` in ${category}` : ""}
              {search ? ` matching "${search}"` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </form>
          <select
            value={category}
            onChange={(e) => updateParam("category", e.target.value)}
            aria-label="Category"
            className="border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white min-w-[160px]"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c === "All" ? "" : c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            aria-label="Sort"
            className="border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white min-w-[180px]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {(search || category || sort) && (
            <button
              onClick={() => {
                setSearchParams({});
                setSearchInput("");
              }}
              className="text-sm text-slate-500 hover:text-red-500 px-3 py-2.5 transition-colors whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <ProductSkeleton count={8} />
      ) : error ? (
        <div className="text-center py-20">
          <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Something went wrong</h3>
          <p className="text-slate-500 mb-4">Failed to load products.</p>
          <button
            onClick={fetchProducts}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No products found</h3>
          <p className="text-slate-500 mb-4">
            Try adjusting your search or filter criteria.
          </p>
          <button
            onClick={() => {
              setSearchParams({});
              setSearchInput("");
            }}
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col border border-slate-100"
                data-testid="product-card"
              >
                <Link to={`/products/${product.id}`} className="block">
                  <div className="h-48 bg-slate-100 overflow-hidden">
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>
                <div className="p-4 flex flex-col flex-1">
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full w-fit">
                    {product.category}
                  </span>
                  <Link to={`/products/${product.id}`}>
                    <h3 className="font-semibold mt-2 text-slate-800 group-hover:text-emerald-600 transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2 flex-1">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                    <div>
                      <span className="text-lg font-bold text-slate-900">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.stock > 0 ? (
                        <span className="block text-xs text-emerald-600 mt-0.5">
                          In stock ({product.stock})
                        </span>
                      ) : (
                        <span className="block text-xs text-red-500 mt-0.5">
                          Out of stock
                        </span>
                      )}
                    </div>
                    {isAuthenticated && product.stock > 0 && (
                      <button
                        onClick={() => handleAdd(product)}
                        disabled={addingId === product.id}
                        className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white text-sm px-3 py-2 rounded-lg transition-colors"
                        data-testid={`add-to-cart-${product.id}`}
                      >
                        {addingId === product.id ? (
                          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          "Add to Cart"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-10">
              <button
                onClick={() => updateParam("page", String(page - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50 transition-colors text-sm"
              >
                Previous
              </button>
              {pageNumbers().map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className="px-2 py-2 text-slate-400 text-sm">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => updateParam("page", String(p))}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-emerald-500 text-white"
                        : "border border-slate-300 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => updateParam("page", String(page + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50 transition-colors text-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
