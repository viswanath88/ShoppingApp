import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import OrdersPage from "./pages/OrdersPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboard from "./pages/AdminDashboard";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== "admin") return <Navigate to="/" />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" />;
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route
            path="/login"
            element={<GuestRoute><LoginPage /></GuestRoute>}
          />
          <Route
            path="/register"
            element={<GuestRoute><RegisterPage /></GuestRoute>}
          />
          <Route
            path="/cart"
            element={<ProtectedRoute><CartPage /></ProtectedRoute>}
          />
          <Route
            path="/checkout"
            element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>}
          />
          <Route
            path="/order-confirmation/:id"
            element={<ProtectedRoute><OrderConfirmationPage /></ProtectedRoute>}
          />
          <Route
            path="/orders"
            element={<ProtectedRoute><OrdersPage /></ProtectedRoute>}
          />
          <Route
            path="/admin"
            element={<AdminRoute><AdminDashboard /></AdminRoute>}
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
