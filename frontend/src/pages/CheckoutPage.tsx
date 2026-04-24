import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../components/Toast";
import { orderService } from "../services/orderService";
import { getErrorMessage } from "../api";

const TAX_RATE = 0.08;

interface ShippingForm {
  fullName: string;
  address: string;
  city: string;
  zip: string;
}

export default function CheckoutPage() {
  const { cart, loading, refreshCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [shipping, setShipping] = useState<ShippingForm>({
    fullName: "",
    address: "",
    city: "",
    zip: "",
  });
  const [errors, setErrors] = useState<Partial<ShippingForm>>({});
  const [placing, setPlacing] = useState(false);
  const [step, setStep] = useState<"shipping" | "payment">("shipping");

  const subtotal = cart?.total ?? 0;
  const tax = subtotal * TAX_RATE;
  const grandTotal = subtotal + tax;

  const handleShippingChange = (field: keyof ShippingForm, value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateShipping = (): boolean => {
    const newErrors: Partial<ShippingForm> = {};
    if (!shipping.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!shipping.address.trim()) newErrors.address = "Address is required";
    if (!shipping.city.trim()) newErrors.city = "City is required";
    if (!shipping.zip.trim()) newErrors.zip = "ZIP code is required";
    else if (!/^\d{5,6}$/.test(shipping.zip.trim()))
      newErrors.zip = "Enter a valid ZIP code";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToPayment = () => {
    if (validateShipping()) {
      setStep("payment");
    }
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const res = await orderService.placeOrder();
      await refreshCart();
      showToast("Order placed successfully!", "success");
      navigate(`/order-confirmation/${res.data.order.id}`);
    } catch (err: any) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setPlacing(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-slate-200 rounded" />
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 h-72" />
        </div>
      </div>
    );
  }

  // Empty cart redirect
  if (!cart || cart.items.length === 0) {
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
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
          />
        </svg>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          Your cart is empty
        </h2>
        <p className="text-slate-500 mb-6">
          Add items to your cart before checking out.
        </p>
        <Link
          to="/products"
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header with steps */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Checkout</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link to="/cart" className="text-emerald-600 hover:text-emerald-700">
            Cart
          </Link>
          <svg
            className="w-4 h-4 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <button
            onClick={() => setStep("shipping")}
            className={
              step === "shipping"
                ? "font-semibold text-slate-800"
                : "text-emerald-600 hover:text-emerald-700"
            }
          >
            Shipping
          </button>
          <svg
            className="w-4 h-4 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span
            className={
              step === "payment"
                ? "font-semibold text-slate-800"
                : "text-slate-400"
            }
          >
            Payment
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Forms */}
        <div className="lg:col-span-2">
          {step === "shipping" ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Shipping Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={shipping.fullName}
                    onChange={(e) =>
                      handleShippingChange("fullName", e.target.value)
                    }
                    placeholder="John Doe"
                    className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                      errors.fullName ? "border-red-300" : "border-slate-300"
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">
                    Street Address
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={shipping.address}
                    onChange={(e) =>
                      handleShippingChange("address", e.target.value)
                    }
                    placeholder="123 Main St, Apt 4B"
                    className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                      errors.address ? "border-red-300" : "border-slate-300"
                    }`}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.address}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1">
                      City
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={shipping.city}
                      onChange={(e) =>
                        handleShippingChange("city", e.target.value)
                      }
                      placeholder="New York"
                      className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        errors.city ? "border-red-300" : "border-slate-300"
                      }`}
                    />
                    {errors.city && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.city}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="zip" className="block text-sm font-medium text-slate-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      id="zip"
                      type="text"
                      value={shipping.zip}
                      onChange={(e) =>
                        handleShippingChange("zip", e.target.value)
                      }
                      placeholder="10001"
                      className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        errors.zip ? "border-red-300" : "border-slate-300"
                      }`}
                    />
                    {errors.zip && (
                      <p className="text-red-500 text-xs mt-1">{errors.zip}</p>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleContinueToPayment}
                className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Continue to Payment
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
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Shipping summary */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    Shipping To
                  </h2>
                  <button
                    onClick={() => setStep("shipping")}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-slate-800 font-medium">
                  {shipping.fullName}
                </p>
                <p className="text-slate-600 text-sm">
                  {shipping.address}
                  <br />
                  {shipping.city}, {shipping.zip}
                </p>
              </div>

              {/* Payment */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  Payment
                </h2>

                {/* Simulated card UI */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white mb-5">
                  <div className="flex items-center justify-between mb-8">
                    <svg
                      className="w-10 h-6"
                      viewBox="0 0 40 24"
                      fill="none"
                    >
                      <rect width="40" height="24" rx="4" fill="#1a1a2e" />
                      <circle cx="15" cy="12" r="7" fill="#eb001b" opacity="0.8" />
                      <circle cx="25" cy="12" r="7" fill="#f79e1b" opacity="0.8" />
                    </svg>
                    <span className="text-xs text-slate-400">
                      Simulated Payment
                    </span>
                  </div>
                  <p className="font-mono text-lg tracking-widest mb-4">
                    **** **** **** 4242
                  </p>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>DEMO CARD</span>
                    <span>12/28</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 text-center mb-5">
                  This is a demo checkout. No real payment will be processed.
                </p>

                <button
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {placing ? (
                    <>
                      <svg
                        className="w-5 h-5 animate-spin"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      Pay Now — ${grandTotal.toFixed(2)}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-slate-800 mb-5">
              Order Summary
            </h2>

            {/* Items */}
            <div className="space-y-3 mb-5">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-14 h-14 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute -top-1.5 -right-1.5 bg-slate-700 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 line-clamp-1">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      ${item.product.price.toFixed(2)} x {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-slate-800">
                    ${item.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="text-emerald-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-100 pt-2.5">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="text-lg font-bold text-slate-900">
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
