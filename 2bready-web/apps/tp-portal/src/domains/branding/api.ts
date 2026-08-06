import api from '@/lib/api';

export async function getBrandLogoUrl(): Promise<string | null> {
  const res = await api.get<{ data: { url: string | null } }>('/branding/logo');
  return res.data.data?.url ?? null;
}
