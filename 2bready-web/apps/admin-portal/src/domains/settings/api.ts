import api from '@/lib/api';
import type { GoogleOAuthSetting, UpdateGoogleOAuthSettingPayload, MailSetting, UpdateMailSettingPayload } from './types';

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
