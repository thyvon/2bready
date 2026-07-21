import api from '@/lib/api';
import type {
  GoogleOAuthSetting,
  UpdateGoogleOAuthSettingPayload,
  MailSetting,
  UpdateMailSettingPayload,
  TwoFactorSetting,
} from './types';

// Rides the generic PlatformSettingController endpoints (GET /settings,
// PATCH /settings/{key}) rather than a dedicated controller — unlike Google
// OAuth/Mail there's no secret to encrypt, so the raw key/value store is
// enough. See PlatformSettingResource on the API side for this shape.
interface PlatformSettingRow {
  key: string;
  value: unknown;
}

const TWO_FACTOR_SETTING_KEY = 'two_factor_globally_enabled';

export async function getGoogleOAuthSetting(): Promise<GoogleOAuthSetting> {
  const res = await api.get<{ data: GoogleOAuthSetting }>('/settings/google-oauth');
  return res.data.data;
}

export async function updateGoogleOAuthSetting(payload: UpdateGoogleOAuthSettingPayload): Promise<GoogleOAuthSetting> {
  const res = await api.patch<{ data: GoogleOAuthSetting }>('/settings/google-oauth', payload);
  return res.data.data;
}

export async function getMailSetting(): Promise<MailSetting> {
  const res = await api.get<{ data: MailSetting }>('/settings/mail');
  return res.data.data;
}

export async function updateMailSetting(payload: UpdateMailSettingPayload): Promise<MailSetting> {
  const res = await api.patch<{ data: MailSetting }>('/settings/mail', payload);
  return res.data.data;
}

export async function sendMailSettingTest(): Promise<{ message: string }> {
  const res = await api.post<{ data: { message: string } }>('/settings/mail/test');
  return res.data.data;
}

// Not seeded yet (fresh env pre-migrate:fresh --seed) means "on" — 2FA is
// required by default (PlatformSettingSeeder), never silently disabled.
export async function getTwoFactorSetting(): Promise<TwoFactorSetting> {
  const res = await api.get<{ data: PlatformSettingRow[] }>('/settings');
  const row = res.data.data.find((s) => s.key === TWO_FACTOR_SETTING_KEY);
  return { enabled: row ? Boolean(row.value) : true };
}

export async function updateTwoFactorSetting(enabled: boolean): Promise<TwoFactorSetting> {
  const res = await api.patch<{ data: PlatformSettingRow }>(`/settings/${TWO_FACTOR_SETTING_KEY}`, {
    value: enabled,
    group: 'security',
  });
  return { enabled: Boolean(res.data.data.value) };
}
