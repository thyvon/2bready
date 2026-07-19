import api from '@/lib/api';
import type { LoginResponse, RegisterResponse, TotpSetupResponse } from './types';
import type { LoginInput, ForgotPasswordInput, ResetPasswordInput, TotpCodeInput } from './schemas';

export async function login(data: LoginInput): Promise<LoginResponse> {
  // admin-login, not the generic login every other app shares — the backend rejects
  // non-internal (company_owner/company_member) credentials here before issuing a
  // token, rather than relying on this app's own post-login role checks alone.
  const res = await api.post<{ data: LoginResponse }>('/auth/admin-login', data);
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

export async function totpConfirm(data: TotpCodeInput): Promise<string> {
  const res = await api.post<{ data: { token: string } }>('/auth/totp/confirm', data);
  return res.data.data.token;
}

export async function totpVerify(data: TotpCodeInput): Promise<string> {
  const res = await api.post<{ data: { token: string } }>('/auth/totp/verify', data);
  return res.data.data.token;
}

export async function googleAuthStatus(): Promise<boolean> {
  const res = await api.get<{ data: { enabled: boolean } }>('/auth/google/status');
  return res.data.data.enabled;
}

// A full-page navigation (not an axios call) — the browser needs to actually
// leave this app for Google's consent screen, then come back to the backend's
// callback route, which redirects here again with an exchange code.
export function googleAuthRedirectUrl(): string {
  return `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google/redirect?portal=admin`;
}

export async function googleAuthExchange(code: string): Promise<LoginResponse> {
  const res = await api.post<{ data: LoginResponse }>('/auth/google/exchange', { code });
  return res.data.data;
}
