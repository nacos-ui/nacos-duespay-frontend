import axios from 'axios';
import { API_ENDPOINTS } from '../apiConfig';

// --- Add this block at the top ---
let setModalErrorGlobal = null;
export function setGlobalErrorSetter(fn) {
  setModalErrorGlobal = fn;
}
// --- End block ---

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_ENDPOINTS.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔥 ROUTES THAT DON'T NEED TOKEN REFRESH
const PUBLIC_ROUTES = [
  '/auth/login/',
  '/auth/register/',
  '/auth/google/',
  '/auth/password/reset/',
  '/auth/password/reset/confirm/',
  '/transactions/receipt/', // This will match any receipt_id
  '/association/get-association/', // Public association endpoint for /pay
  '/payers/check/', // Payer registration endpoint
  '/transactions/payment/', // Payment initiation and status endpoints
];

const isPublicRoute = (url) => {
  return PUBLIC_ROUTES.some(route => url.includes(route));
};

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && !isPublicRoute(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't handle 401s for public routes
    if (isPublicRoute(originalRequest.url)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      localStorage.removeItem('access_token');

      if (setModalErrorGlobal) {
        setModalErrorGlobal({
          open: true,
          title: 'Session Expired',
          message: 'Your session has expired. Please log in again to continue.',
          buttonText: 'Login',
          onClose: () => {
            console.log("Close modal and redirect to /auth");
            // First, close the modal
            setModalErrorGlobal({ open: false, title: '', message: '' });
            // Then, redirect after a short delay to ensure modal closes
            setTimeout(() => {
              window.location.assign('/auth');
            }, 100); // 100ms delay is usually enough
          }
        });
      }

      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Create a fetch-like wrapper that works exactly like your existing fetch calls
const api = async (url, options = {}) => {
  try {
    const config = {
      url: url.startsWith('http') ? url : url,
      method: options.method || 'GET',
      headers: {
        ...options.headers,
      }
    };

    // Handle different body types - KEEP IT SIMPLE
    if (options.body) {
      if (options.body instanceof FormData) {
        // For FormData, pass it directly and remove Content-Type
        delete config.headers['Content-Type'];
        config.data = options.body;
      } else if (typeof options.body === 'string') {
        // For JSON strings, pass directly as string
        config.data = options.body;
      } else {
        // For objects, stringify
        config.data = JSON.stringify(options.body);
      }
    }

    const response = await axiosInstance(config);

    // Make it behave like fetch
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      json: async () => response.data,
      text: async () => JSON.stringify(response.data),
      headers: response.headers,
      blob: async () => response.data, // For file downloads
    };
  } catch (error) {
    // Make it behave like fetch for errors
    if (error.response) {
      return {
        ok: false,
        status: error.response.status,
        statusText: error.response.statusText,
        json: async () => error.response.data,
        text: async () => JSON.stringify(error.response.data),
        headers: error.response.headers,
      };
    }
    throw error;
  }
};

export default api;