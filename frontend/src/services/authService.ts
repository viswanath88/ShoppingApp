import api from "../api";
import type { AuthResponse, User } from "../types";

export const authService = {
  register: (name: string, email: string, password: string) =>
    api.post<AuthResponse>("/auth/register", { name, email, password }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/login", { email, password }),

  getProfile: () => api.get<{ user: User }>("/auth/profile"),
};
