import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from './store';

const getApiUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || '';

  // In browser context: always use the Vercel proxy UNLESS it's a localhost URL (local dev)
  // This ensures mobile clients only need to reach Vercel, not Railway directly
  if (typeof window !== 'undefined') {
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      return url; // Local dev: hit local backend directly
    }
    return '/api-proxy'; // Production: always go through Vercel proxy → Railway
  }

  // SSR / server context: call Railway directly (servers can reach Railway fine)
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    return url;
  }
  return 'https://healthcare-management-system-production-5c2d.up.railway.app/api';
};

const API_URL = getApiUrl();

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token and organizationId to requests
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const user = useAuthStore.getState().user;
    if (user?.organizationId) {
      config.headers['x-tenant-id'] = user.organizationId;
    }
  }
  return config;
});

// Mutex for token refresh to prevent race conditions when multiple
// requests receive 401 simultaneously
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/')) {
          window.location.replace('/auth/login');
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // If a refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const response = await axios.post<{ accessToken: string }>(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = response.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Notify all queued requests with the new token
        onRefreshed(newAccessToken);

        return apiClient(originalRequest);
      } catch (refreshError: any) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Clear queued requests
        refreshSubscribers = [];
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/')) {
          window.location.replace('/auth/login');
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 402) {
      if (typeof window !== 'undefined') {
        window.location.replace('/subscription-expired');
      }
      return Promise.reject(error);
    }

    // Show toast for other API errors (skip if already handled above)
    if (typeof window !== 'undefined' && error.response) {
      const msg = error.response.data?.message;
      const errorMessage = Array.isArray(msg) ? msg[0] : msg || 'Something went wrong';
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
