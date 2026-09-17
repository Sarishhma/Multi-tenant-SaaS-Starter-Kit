import api from "./api";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

// ── Request interceptor ─────────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Attach auth token if available (adjust the key to match your auth provider)
    const token = localStorage.getItem("auth_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ── Response interceptor ────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Handle unauthorized — e.g. redirect to login
          console.warn("Unauthorized – redirecting to login");
          break;
        case 403:
          console.warn("Forbidden – insufficient permissions");
          break;
        case 500:
          console.error("Server error – please try again later");
          break;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
