'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import SectionCard from '@/components/ui/SectionCard';
import { useToast } from '@/components/feedback/ToastProvider';
import { useAuthStore } from '@/store/auth.store';
import { ConfirmDialog, InlineDropzone } from '@2bready/ui-core';
import {
  deleteBrandLogo,
  getBranding,
  uploadBrandLogo,
  type BrandLogoVariant,
  type BrandingSlots,
} from '@/domains/branding/api';
import { getApiError } from '@/lib/utils';
import { useTranslation, type TranslationKey } from '@/lib/i18n';
import { invalidateBrandingCache } from '@/domains/branding/hooks';

interface SlotDef {
  variant: BrandLogoVariant;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  darkPreview: boolean;
}

const SLOTS: readonly SlotDef[] = [
  { variant: 'light', titleKey: 'branding.slot_light_title', descKey: 'branding.slot_light_desc', darkPreview: false },
  { variant: 'dark', titleKey: 'branding.slot_dark_title', descKey: 'branding.slot_dark_desc', darkPreview: true },
  { variant: 'footer', titleKey: 'branding.slot_footer_title', descKey: 'branding.slot_footer_desc', darkPreview: false },
  { variant: 'footerDark', titleKey: 'branding.slot_footer_dark_title', descKey: 'branding.slot_footer_dark_desc', darkPreview: true },
];

const EMPTY_URLS: BrandingSlots = { light: null, dark: null, footer: null, footerDark: null };

// Business Branding tab's content — settings/layout.tsx owns the PageHeader
// and Tabs shell, and only renders this tab's link for admins
// (settings.manage is admin-only) — the redirect below is defense-in-depth
// for a direct URL visit, matching the pattern every other admin-only page
// in this app already uses. One section per logo slot: the two placements
// (main / footer) × the two theme modes, previewed on the surface color
// they will sit on — a light logo on a white preview box would be invisible,
// so the dark slots preview on a dark box.
export default function BrandingSettingsPage() {
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const { t } = useTranslation();
  const toast = useToast();

  const [urls, setUrls] = useState<BrandingSlots>(EMPTY_URLS);
  const [loading, setLoading] = useState(true);
  const [removeOpen, setRemoveOpen] = useState<BrandLogoVariant | null>(null);
  const [busy, setBusy] = useState<BrandLogoVariant | null>(null);

  useEffect(() => {
    if (!hasRole('admin')) router.replace('/settings/profile');
  }, [hasRole, router]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const next = await getBranding();
        if (!cancelled) setUrls(next);
      } catch {
        if (!cancelled) setUrls(EMPTY_URLS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpload = async (variant: BrandLogoVariant, file: File) => {
    setBusy(variant);
    try {
      const url = await uploadBrandLogo(file, variant);
      setUrls((prev) => ({ ...prev, [variant]: url }));
      invalidateBrandingCache();
      toast.success(t('branding.upload_success'));
    } catch (err) {
      toast.error(getApiError(err).message || t('branding.upload_error'));
    } finally {
      setBusy(null);
    }
  };

  const handleRemove = async () => {
    if (!removeOpen) return;
    setBusy(removeOpen);
    try {
      await deleteBrandLogo(removeOpen);
      setUrls((prev) => ({ ...prev, [removeOpen]: null }));
      invalidateBrandingCache();
      toast.success(t('branding.remove_success'));
    } catch (err) {
      toast.error(getApiError(err).message || t('branding.remove_error'));
    } finally {
      setBusy(null);
      setRemoveOpen(null);
    }
  };

  return (
    <SectionCard title={t('branding.title')} subtitle={t('branding.desc')}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
        {SLOTS.map((slot) => {
          const url = urls[slot.variant];

          return (
            <Box
              key={slot.variant}
              sx={{
                p: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {t(slot.titleKey)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    {t(slot.descKey)}
                  </Typography>
                </Box>
                {url && (
                  <Button
                    color="error"
                    variant="text"
                    size="small"
                    sx={{ flexShrink: 0, mt: -0.5, mr: -0.5 }}
                    disabled={busy !== null}
                    onClick={() => setRemoveOpen(slot.variant)}
                  >
                    {t('branding.remove_button')}
                  </Button>
                )}
              </Box>

              <Box
                sx={{
                  p: 1.5,
                  border: '1px solid',
                  borderColor: slot.darkPreview ? '#444444' : 'divider',
                  borderRadius: '12px',
                  bgcolor: slot.darkPreview ? '#141414' : 'background.default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 64,
                }}
              >
                {loading ? null : url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={url}
                    alt=""
                    style={{ height: 36, maxWidth: 200, width: 'auto', objectFit: 'contain' }}
                  />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    {t('branding.empty_state')}
                  </Typography>
                )}
              </Box>

              <InlineDropzone
                accept=".png,.jpg,.jpeg,.svg,.webp"
                maxSizeMB={2}
                disabled={busy !== null}
                hint={t('branding.dropzone_hint')}
                onUpload={(file) => void handleUpload(slot.variant, file)}
              />
            </Box>
          );
        })}
      </Box>

      <ConfirmDialog
        open={removeOpen !== null}
        title={t('branding.confirm_remove_title')}
        description={t('branding.confirm_remove_desc')}
        confirmLabel={t('branding.remove_button')}
        danger
        loading={busy === removeOpen}
        onCancel={() => setRemoveOpen(null)}
        onConfirm={handleRemove}
      />
    </SectionCard>
  );
}