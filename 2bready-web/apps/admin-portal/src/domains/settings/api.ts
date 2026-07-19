import api from '@/lib/api';
import type { GoogleOAuthSetting, UpdateGoogleOAuthSettingPayload } from './types';

export async function getGoogleOAuthSetting(): Promise<GoogleOAuthSetting> {
  const res = await api.get<{ data: GoogleOAuthSetting }>('/settings/google-oauth');
  return res.data.data;
}

export async function updateGoogleOAuthSetting(payload: UpdateGoogleOAuthSettingPayload): Promise<GoogleOAuthSetting> {
  const res = await api.patch<{ data: GoogleOAuthSetting }>('/settings/google-oauth', payload);
  return res.data.data;
}
