import api from '@/lib/api';

export interface BrandingState {
  url: string | null;
}

export async function getBrandLogoUrl(): Promise<string | null> {
  const res = await api.get<{ data: { url: string | null } }>('/branding/logo');
  return res.data.data?.url ?? null;
}

export async function uploadBrandLogo(file: File): Promise<string | null> {
  const form = new FormData();
  form.append('logo', file);
  const res = await api.post<{ data: { url: string | null } }>('/settings/logo', form);
  return res.data.data?.url ?? null;
}

export async function deleteBrandLogo(): Promise<void> {
  await api.delete('/settings/logo');
}
