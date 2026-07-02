import { AxiosError } from 'axios';

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

export function formatCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(date));
}
