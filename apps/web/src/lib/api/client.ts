import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearSession, setSession } from '../redux/authSlice';
import { store } from '../redux/store';

const baseURL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1`;

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach access token from Redux store to outgoing requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = store.getState().auth.accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Single-flight refresh token promise to prevent concurrent refresh requests
let refreshPromise: Promise<string | null> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || '';
    const isAuthRoute =
      url.includes('/auth/login') || url.includes('/auth/refresh');

    // On 401 from any endpoint other than login/refresh, attempt single-flight token refresh
    if (error.response?.status === 401 && !isAuthRoute && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            try {
              const res = await axios.post(
                `${baseURL}/auth/refresh`,
                {},
                { withCredentials: true },
              );

              const responseData = res.data?.data || res.data;
              const { accessToken, user } = responseData || {};

              if (accessToken && user) {
                store.dispatch(setSession({ accessToken, user }));
                return accessToken;
              }

              store.dispatch(clearSession());
              return null;
            } catch (refreshErr) {
              store.dispatch(clearSession());
              throw refreshErr;
            } finally {
              refreshPromise = null;
            }
          })();
        }

        const newAccessToken = await refreshPromise;

        if (newAccessToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        // Refresh failed; session already cleared above. Propagate error without redirecting.
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  },
);
