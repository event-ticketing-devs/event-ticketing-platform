// src/api/apiClient.js
import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const { token } = JSON.parse(storedUser);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle banned user responses
    if (error.response?.status === 403) {
      const message = error.response?.data?.message;
      const requiresVerification = error.response?.data?.requiresVerification;
      
      if (message && message.includes('banned')) {
        // User is banned, clear local storage and redirect to login
        localStorage.removeItem('user');
        
        // Dispatch a custom event to notify the app
        window.dispatchEvent(new CustomEvent('userBanned', {
          detail: {
            message: message,
            banReason: error.response?.data?.banReason,
            bannedAt: error.response?.data?.bannedAt
          }
        }));
        
        // Redirect to login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else if (requiresVerification) {
        // User needs to verify email - dispatch custom event
        window.dispatchEvent(new CustomEvent('verificationRequired', {
          detail: { message }
        }));
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
