import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  // Actions
  login: (email: string, password: string) => { ok: boolean; error?: string };
  signup: (
    name: string,
    email: string,
    password: string,
  ) => { ok: boolean; error?: string };
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,

      login(email, password) {
        if (!email || !password) {
          return { ok: false, error: "Email and password are required." };
        }
        // UI-only: accept any valid-looking credentials
        const name = email.split("@")[0] ?? "User";
        set({
          user: {
            id: btoa(email).replace(/=/g, ""),
            name: name.charAt(0).toUpperCase() + name.slice(1),
            email,
          },
        });
        return { ok: true };
      },

      signup(name, email, password) {
        if (!name || !email || !password) {
          return { ok: false, error: "All fields are required." };
        }
        if (password.length < 6) {
          return {
            ok: false,
            error: "Password must be at least 6 characters.",
          };
        }
        set({
          user: {
            id: btoa(email).replace(/=/g, ""),
            name: name.trim(),
            email,
          },
        });
        return { ok: true };
      },

      logout() {
        void get(); // satisfy linter
        set({ user: null });
      },
    }),
    {
      name: "dashlink-auth",
      storage: createJSONStorage(() => {
        // Guard for SSR
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          };
        }
        return localStorage;
      }),
    },
  ),
);
