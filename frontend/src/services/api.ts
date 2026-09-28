import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mahaseva_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired
      const isAuthEndpoint = error.config?.url?.includes("/auth/login");
      if (!isAuthEndpoint) {
        localStorage.removeItem("mahaseva_token");
        localStorage.removeItem("mahaseva_user");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
