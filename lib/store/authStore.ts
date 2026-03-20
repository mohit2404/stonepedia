import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  name: string;
  role: "BUYER" | "SUPPLIER";
  supplierId?: string;
}

interface RegisterData {
  email: string;
  name: string;
  password: string;
  role: "BUYER" | "SUPPLIER";
  companyName?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    data: RegisterData,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        const res = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!data.success) return { success: false, error: data.error };
        set({ user: data.data.user, token: data.data.token });
        return { success: true };
      },

      register: async (form) => {
        const res = await fetch("/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!data.success) return { success: false, error: data.error };
        set({ user: data.data.user, token: data.data.token });
        return { success: true };
      },

      logout: () => set({ user: null, token: null }),
    }),
    {
      name: "rfq-auth", // localStorage key
      partialize: (state) => ({ user: state.user, token: state.token }), // persist user and token, not loading state
    },
  ),
);
