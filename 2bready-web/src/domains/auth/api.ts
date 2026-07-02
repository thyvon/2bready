import api from '@/lib/api';
import type { LoginResponse, RegisterResponse, TotpSetupResponse } from './types';
import type { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput, TotpCodeInput } from './schemas';

export async function login(data: LoginInput): Promise<LoginResponse> {
  const res = await api.post<{ data: LoginResponse }>('/auth/login', data);
  return res.data.data;
}

export async function register(data: RegisterInput, locale: 'en' | 'kh' = 'en'): Promise<RegisterResponse> {
  const res = await api.post<{ data: RegisterResponse }>('/auth/register', { ...data, locale });
  return res.data.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function me(): Promise<RegisterResponse['user']> {
  const res = await api.get<{ data: RegisterResponse['user'] }>('/auth/me');
  return res.data.data;
}

export async function forgotPassword(data: ForgotPasswordInput): Promise<string> {
  const res = await api.post<{ data: { message: string } }>('/auth/forgot-password', data);
  return res.data.data.message;
}

export async function resetPassword(token: string, email: string, data: ResetPasswordInput): Promise<void> {
  await api.post('/auth/reset-password', { token, email, ...data });
}

export async function totpSetup(): Promise<TotpSetupResponse> {
  const res = await api.post<{ data: TotpSetupResponse }>('/auth/totp/setup');
  return res.data.data;
}

export async function totpConfirm(data: TotpCodeInput): Promise<void> {
  await api.post('/auth/totp/confirm', data);
}

export async function totpVerify(data: TotpCodeInput): Promise<string> {
  const res = await api.post<{ data: { token: string } }>('/auth/totp/verify', data);
  return res.data.data.token;
}
