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
}

// No totp_confirmed branch to model here (unlike admin-portal's login) —
// User::requiresTwoFactor() on the backend only applies to
// admin/staff/finance/auditor roles, never company_owner/company_member, so
// this app's login always gets totp_required: false and a fully-capable
// token immediately.
export async function login(data: LoginInput): Promise<LoginResult> {
  const res = await api.post<{ data: LoginResult }>('/auth/login', data);
  return res.data.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}
