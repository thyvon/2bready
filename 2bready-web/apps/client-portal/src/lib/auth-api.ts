import api from '@/lib/api';
import type { components } from '@2bready/api-client';
import type { RegisterInput } from '@/lib/register-schema';
import type { LoginInput } from '@/lib/login-schema';

export type AuthUser = components['schemas']['UserResource'];

export interface RegisterResult {
  user: AuthUser;
  token: string;
  totp_required: boolean;
}

// locale is passed through for the welcome email's language — read from the
// locale store at the call site, not hardcoded here.
export async function registerOwner(data: RegisterInput, locale: 'en' | 'kh'): Promise<RegisterResult> {
  const res = await api.post<{ data: RegisterResult }>('/auth/register', { ...data, locale });
  return res.data.data;
}

export interface LoginResult {
  user: AuthUser;
  token: string;
  totp_required: boolean;
  totp_confirmed?: boolean;
}

// An admin can now force 2FA on for a specific company_owner/member account
// (two_factor_required override) even though it's never required by role
// default here — so totp_required can legitimately come back true, unlike
// what this comment used to say.
export async function login(data: LoginInput): Promise<LoginResult> {
  const res = await api.post<{ data: LoginResult }>('/auth/login', data);
  return res.data.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export interface TotpSetupResult {
  secret: string;
  qr_code_url: string;
}

export async function totpSetup(): Promise<TotpSetupResult> {
  const res = await api.post<{ data: TotpSetupResult }>('/auth/totp/setup');
  return res.data.data;
}

export async function totpConfirm(code: string): Promise<string> {
  const res = await api.post<{ data: { token: string } }>('/auth/totp/confirm', { code });
  return res.data.data.token;
}

export async function totpVerify(code: string): Promise<string> {
  const res = await api.post<{ data: { token: string } }>('/auth/totp/verify', { code });
  return res.data.data.token;
}

export async function googleAuthStatus(): Promise<boolean> {
  const res = await api.get<{ data: { enabled: boolean } }>('/auth/google/status');
  return res.data.data.enabled;
}

// A full-page navigation (not an axios call) — the browser needs to actually
// leave this app for Google's consent screen, then come back to the
// backend's callback route, which redirects here again with an exchange code.
export function googleAuthRedirectUrl(): string {
  return `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google/redirect?portal=client`;
}

export async function googleAuthExchange(code: string): Promise<LoginResult> {
  const res = await api.post<{ data: LoginResult }>('/auth/google/exchange', { code });
  return res.data.data;
}

export async function resendVerificationEmail(): Promise<void> {
  await api.post('/auth/email/verify/resend');
}

export async function verifyEmail(id: string, hash: string, expires: string): Promise<void> {
  await api.post(`/auth/email/verify/${id}/${hash}`, { expires });
}
