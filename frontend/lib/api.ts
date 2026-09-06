import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach JWT token from localStorage to outgoing requests
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isDevAuthBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";
    if (error.response?.status === 401 && typeof window !== "undefined" && !isDevAuthBypass) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);
