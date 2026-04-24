import axios from "axios";

// ── Axios instance ──────────────────────────────────────────────────
const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach JWT ─────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 auto-logout ────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login") &&
      !error.config?.url?.includes("/auth/register")
    ) {
      localStorage.removeItem("token");
      // Only redirect if not already on login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── Error helper ────────────────────────────────────────────────────
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // Server returned an error response
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.errors) {
      // express-validator errors
      const validationErrors = error.response.data.errors;
      if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        return validationErrors.map((e: { msg: string }) => e.msg).join(". ");
      }
    }
    // HTTP status-based messages
    switch (error.response?.status) {
      case 400:
        return "Invalid request. Please check your input.";
      case 401:
        return "Session expired. Please log in again.";
      case 403:
        return "You don't have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 409:
        return "This action conflicts with existing data.";
      case 429:
        return "Too many requests. Please try again later.";
      case 500:
        return "Server error. Please try again later.";
      default:
        return "Something went wrong. Please try again.";
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred.";
}

export default api;
