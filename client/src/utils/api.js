import axios from "axios";
import { SERVER_URL } from "./constants";

/**
 * Unified API utility using Axios.
 * Standardizes base URL, headers, and error handling.
 */
const apiClient = axios.create({
  baseURL: SERVER_URL,
  headers: {
    "Content-Type": "application/json; charset=UTF-8",
  },
});

// Response interceptor for consistent error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || "An unexpected error occurred";
    console.error(`API Error [${error.config.url}]:`, message);
    return Promise.reject(new Error(message));
  }
);

const api = {
  get: (endpoint, config = {}) => apiClient.get(endpoint, config),
  post: (endpoint, data, config = {}) => apiClient.post(endpoint, data, config),
  put: (endpoint, data, config = {}) => apiClient.put(endpoint, data, config),
  delete: (endpoint, config = {}) => apiClient.delete(endpoint, config),
};

export default api;
