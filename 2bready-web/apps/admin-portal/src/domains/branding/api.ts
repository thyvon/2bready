import api from '@/lib/api';

// The four branding slots the platform supports (two placements × two
// theme modes). `light` is the historic single-logo slot — the backend
// keeps its original setting key, so existing installs need no migration.
export type BrandLogoVariant = 'light' | 'dark' | 'footer' | 'footerDark';

export interface BrandingSlots {
  light: string | null;
  dark: string | null;
  footer: string | null;
  footerDark: string | null;
}

// Wire names the backend expects for each variant.
const SLOT_PARAM: Record<BrandLogoVariant, string> = {
  light: 'main',
  dark: 'dark',
  footer: 'footer',
  footerDark: 'footer_dark',
};

export async function getBranding(): Promise<BrandingSlots> {
  const res = await api.get<{ data: BrandingSlots }>('/branding');
  return res.data.data ?? { light: null, dark: null, footer: null, footerDark: null };
}

export async function uploadBrandLogo(file: File, variant: BrandLogoVariant): Promise<string | null> {
  const form = new FormData();
  form.append('logo', file);
  form.append('slot', SLOT_PARAM[variant]);
  const res = await api.post<{ data: { url: string | null } }>('/settings/logo', form);
  return res.data.data?.url ?? null;
}

export async function deleteBrandLogo(variant: BrandLogoVariant): Promise<void> {
  await api.delete('/settings/logo', { data: { slot: SLOT_PARAM[variant] } });
}