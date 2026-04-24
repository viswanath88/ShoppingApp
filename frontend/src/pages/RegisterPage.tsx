import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = "Name is required.";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate("/login", {
        state: { successMessage: "Account created successfully! Please login." },
      });
    } catch (err: any) {
      setServerError(
        getErrorMessage(err)
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: keyof FormErrors) =>
    `w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
      errors[field]
        ? "border-red-400 focus:ring-red-400"
        : "border-slate-300 focus:ring-emerald-500"
    }`;

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-full mb-4">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
            <p className="text-slate-500 text-sm mt-1">
              Join ShopEasy and start shopping
            </p>
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                className={inputClass("name")}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1.5">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className={inputClass("email")}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={inputClass("password")}
                placeholder="At least 6 characters"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5">{errors.password}</p>
              )}
              {!errors.password && password.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        password.length >= 10
                          ? "w-full bg-emerald-500"
                          : password.length >= 6
                            ? "w-2/3 bg-yellow-500"
                            : "w-1/3 bg-red-500"
                      }`}
                    />
                  </div>
                  <span className="text-xs text-slate-400">
                    {password.length >= 10 ? "Strong" : password.length >= 6 ? "Good" : "Weak"}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <input
                id="reg-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword)
                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                className={inputClass("confirmPassword")}
                placeholder="Re-enter your password"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword}</p>
              )}
              {!errors.confirmPassword && confirmPassword.length > 0 && password === confirmPassword && (
                <p className="text-emerald-500 text-xs mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Passwords match
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium py-3 rounded-lg transition-colors mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
