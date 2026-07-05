import axios, { AxiosError, type AxiosInstance } from 'axios';

export interface CreateApiClientOptions {
  baseURL: string;
  getToken: () => string | null;
  onUnauthorized: () => void;
}

export function createApiClient(options: CreateApiClientOptions): AxiosInstance {
  const api = axios.create({
    baseURL: options.baseURL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    withCredentials: false,
  });

  api.interceptors.request.use((config) => {
    const token = options.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  api.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error.response?.status === 401) {
        options.onUnauthorized();
      }
      return Promise.reject(error);
    }
  );

  return api;
}

export type ApiError = {
  message: string;
  errors?: Record<string, string[]>;
};

export function getApiError(error: unknown): ApiError {
  if (error instanceof AxiosError && error.response?.data) {
    return error.response.data as ApiError;
  }
  return { message: 'An unexpected error occurred' };
}
