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

export async function getBranding(): Promise<BrandingSlots> {
  const res = await api.get<{ data: BrandingSlots }>('/branding');
  return res.data.data ?? { light: null, dark: null, footer: null, footerDark: null };
}