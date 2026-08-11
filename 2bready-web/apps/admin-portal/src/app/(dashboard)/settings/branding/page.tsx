'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';

import SectionCard from '@/components/ui/SectionCard';
import { useToast } from '@/components/feedback/ToastProvider';
import { useAuthStore } from '@/store/auth.store';
import { ConfirmDialog, EmptyState, UploadDropzone } from '@2bready/ui-core';
import {
  deleteBrandLogo,
  getBranding,
  uploadBrandLogo,
  type BrandLogoVariant,
  type BrandingSlots,
} from '@/domains/branding/api';
import { getApiError } from '@/lib/utils';
import { useTranslation, type TranslationKey } from '@/lib/i18n';

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
  const [uploadOpen, setUploadOpen] = useState<BrandLogoVariant | null>(null);
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
      toast.success(t('branding.upload_success'));
    } catch (err) {
      toast.error(getApiError(err).message || t('branding.upload_error'));
    } finally {
      setBusy(null);
      setUploadOpen(null);
    }
  };

  const handleRemove = async () => {
    if (!removeOpen) return;
    setBusy(removeOpen);
    try {
      await deleteBrandLogo(removeOpen);
      setUrls((prev) => ({ ...prev, [removeOpen]: null }));
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
      <Box>
        {SLOTS.map((slot, i) => {
          const url = urls[slot.variant];

          return (
            <Box key={slot.variant}>
              {i > 0 && <Divider sx={{ my: 4 }} />}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 260 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {t(slot.titleKey)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {t(slot.descKey)}
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: slot.darkPreview ? '#444444' : 'divider',
                      borderRadius: '12px',
                      bgcolor: slot.darkPreview ? '#141414' : 'background.default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 180,
                      minHeight: 72,
                    }}
                  >
                    {loading ? null : url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={url}
                        alt=""
                        style={{ height: 40, maxWidth: 220, width: 'auto', objectFit: 'contain' }}
                      />
                    ) : (
                      <Box sx={{ width: '100%' }}>
                        <EmptyState title={t('branding.empty_state')} />
                      </Box>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pt: 4 }}>
                  <Button
                    startIcon={<UploadFileOutlinedIcon />}
                    variant="contained"
                    size="small"
                    disabled={busy !== null}
                    onClick={() => setUploadOpen(slot.variant)}
                  >
                    {t('branding.upload_button')}
                  </Button>
                  {url && (
                    <Button
                      color="error"
                      variant="outlined"
                      size="small"
                      disabled={busy !== null}
                      onClick={() => setRemoveOpen(slot.variant)}
                    >
                      {t('branding.remove_button')}
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      <UploadDropzone
        open={uploadOpen !== null}
        onClose={() => setUploadOpen(null)}
        onUpload={(file) => uploadOpen && void handleUpload(uploadOpen, file)}
        title={t('branding.upload_button')}
        accept=".png,.jpg,.jpeg,.svg,.webp"
        maxSizeMB={2}
      />

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