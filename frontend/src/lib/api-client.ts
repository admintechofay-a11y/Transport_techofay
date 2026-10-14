import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl) return '/int/v1';
  return envUrl.endsWith('/') ? `${envUrl}int/v1` : `${envUrl}/int/v1`;
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

export const getApiErrorMessage = (error: AxiosError<{ message?: string; error?: string }>, fallback: string) => {
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      return 'The API request timed out. Please try again.';
    }

    return 'The API server is unavailable. Start the API service and try again.';
  }

  const data = error.response.data;
  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.error === 'string') return data.error;
  if (Array.isArray((data as any)?.errors)) return (data as any).errors.join(', ');
  if ((data as any)?.errors && typeof (data as any).errors === 'object') {
    return Object.entries((data as any).errors)
      .flatMap(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
      .join('; ');
  }

  return fallback;
};

// Request Interceptor: Attach Auth Token and Company Headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authState = useAuthStore.getState();
    const token = authState.token;
    const company = authState.company;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (token && company?.uuid) {
      config.headers['Company-Header'] = company.uuid;
      config.headers['Company'] = company.uuid;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Handle status errors gracefully
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    const status = error.response?.status;
    const data = error.response?.data;

    const isAuthRoute = error.config?.url?.includes('/auth/');

    if (status === 401 && !isAuthRoute) {
      useAuthStore.getState().logout();
      toast.error('Session expired. Please sign in again.');
      window.location.href = '/login';
    } else if (status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (status === 404) {
      // Do not toast for all 404s, let UI handle it
    } else if (status === 422) {
      toast.error(getApiErrorMessage(error, 'Validation failed. Please check inputs.'));
    } else if (status && status >= 500) {
      toast.error(data?.message || 'Server error occurred. Please try again.');
    } else if (!status) {
      toast.error(getApiErrorMessage(error, 'The API server is unavailable.'));
    }

    return Promise.reject(error);
  }
);
