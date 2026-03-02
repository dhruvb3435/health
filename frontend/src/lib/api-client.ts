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

// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('401 Unauthorized detected. Attempting token refresh...');
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        console.warn('No refresh token found. Redirecting to login.');
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/')) {
          window.location.replace('/auth/login');
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = response.data.accessToken;
        console.log('Token refreshed successfully.');
        localStorage.setItem('accessToken', newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError: any) {
        console.error('Token refresh failed:', refreshError.response?.data?.message || refreshError.message);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/')) {
          window.location.replace('/auth/login');
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 402) {
      console.warn('Subscription expired (402). Redirecting to subscription-expired page.');
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
