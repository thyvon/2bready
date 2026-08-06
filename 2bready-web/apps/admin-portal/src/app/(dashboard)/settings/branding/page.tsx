'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';

import SectionCard from '@/components/ui/SectionCard';
import { useToast } from '@/components/feedback/ToastProvider';
import { useAuthStore } from '@/store/auth.store';
import { ConfirmDialog, EmptyState, UploadDropzone } from '@2bready/ui-core';
import { deleteBrandLogo, getBrandLogoUrl, uploadBrandLogo } from '@/domains/branding/api';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

// Business Branding tab's content — settings/layout.tsx owns the PageHeader
// and Tabs shell, and only renders this tab's link for admins
// (settings.manage is admin-only) — the redirect below is defense-in-depth
// for a direct URL visit, matching the pattern every other admin-only page
// in this app already uses.
export default function BrandingSettingsPage() {
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const { t } = useTranslation();
  const toast = useToast();

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!hasRole('admin')) router.replace('/settings/profile');
  }, [hasRole, router]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const url = await getBrandLogoUrl();
        if (!cancelled) setLogoUrl(url);
      } catch {
        if (!cancelled) setLogoUrl(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpload = async (file: File) => {
    try {
      setLogoUrl(await uploadBrandLogo(file));
      toast.success(t('branding.upload_success'));
    } catch (err) {
      toast.error(getApiError(err).message || t('branding.upload_error'));
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await deleteBrandLogo();
      setLogoUrl(null);
      toast.success(t('branding.remove_success'));
    } catch (err) {
      toast.error(getApiError(err).message || t('branding.remove_error'));
    } finally {
      setRemoving(false);
      setRemoveOpen(false);
    }
  };

  return (
    <>
      <SectionCard
        title={t('branding.title')}
        subtitle={t('branding.desc')}
        action={
          <Button startIcon={<UploadFileOutlinedIcon />} variant="contained" size="small" onClick={() => setUploadOpen(true)}>
            {t('branding.upload_button')}
          </Button>
        }
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          {loading ? null : logoUrl ? (
            <>
              <Box
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '12px',
                  bgcolor: 'background.default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 180,
                  minHeight: 72,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt="2bReady"
                  style={{ height: 48, maxWidth: 240, width: 'auto', objectFit: 'contain' }}
                />
              </Box>
              <Button color="error" variant="outlined" size="small" onClick={() => setRemoveOpen(true)}>
                {t('branding.remove_button')}
              </Button>
            </>
          ) : (
            <Box sx={{ width: '100%' }}>
              <EmptyState title={t('branding.empty_state')} />
            </Box>
          )}
        </Box>
      </SectionCard>

      <UploadDropzone
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={(file) => void handleUpload(file)}
        title={t('branding.upload_button')}
        accept=".png,.jpg,.jpeg,.svg,.webp"
        maxSizeMB={2}
      />

      <ConfirmDialog
        open={removeOpen}
        title={t('branding.confirm_remove_title')}
        description={t('branding.confirm_remove_desc')}
        confirmLabel={t('branding.remove_button')}
        danger
        loading={removing}
        onCancel={() => setRemoveOpen(false)}
        onConfirm={handleRemove}
      />
    </>
  );
}
