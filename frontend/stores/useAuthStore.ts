import { create } from "zustand";
import { UserProfile } from "@/types";

const DEMO_TEST_USER: UserProfile = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "demo.student@university.edu",
  full_name: "Demo Student",
  academic_year: "3rd Year CSE",
  created_at: new Date().toISOString(),
};
const DEMO_TEST_TOKEN = "dev-test-token-bypass";

const isDevAuthBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: UserProfile, token: string) => void;
  updateUser: (user: UserProfile) => void;
  logout: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: isDevAuthBypass ? DEMO_TEST_USER : null,
  token: isDevAuthBypass ? DEMO_TEST_TOKEN : null,
  isAuthenticated: isDevAuthBypass,
  isLoading: !isDevAuthBypass,

  setAuth: (user, token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    }
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  updateUser: (user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user));
    }
    set({ user });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    set({
      user: isDevAuthBypass ? DEMO_TEST_USER : null,
      token: isDevAuthBypass ? DEMO_TEST_TOKEN : null,
      isAuthenticated: isDevAuthBypass,
      isLoading: false,
    });
  },

  initializeAuth: () => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      if (storedToken && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          set({ user, token: storedToken, isAuthenticated: true, isLoading: false });
          return;
        } catch {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
    }

    if (isDevAuthBypass) {
      set({
        user: DEMO_TEST_USER,
        token: DEMO_TEST_TOKEN,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
