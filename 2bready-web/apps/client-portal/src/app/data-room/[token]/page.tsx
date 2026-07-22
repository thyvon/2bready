'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import { isAxiosError } from 'axios';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { DocumentPreviewDialog } from '@2bready/ui-core';
import { AuthCard } from '@/components/layout/AuthCard';
import { useTranslation } from '@/lib/i18n';
import { dataRoomPinSchema, type DataRoomPinInput } from '@/lib/data-room-pin-schema';
import {
  verifyDataRoomPin,
  getDataRoomPreviewUrl,
  type DataRoomDocument,
} from '@/lib/data-room-public-api';

interface PreviewState {
  open: boolean;
  title: string;
  url: string | null;
  mimeType: string | null;
  loading: boolean;
  error: string | null;
}

const EMPTY_PREVIEW: PreviewState = { open: false, title: '', url: null, mimeType: null, loading: false, error: null };

// Deliberately outside every auth-gated route group — this is the one page
// in client-portal a real logged-out human (a bank, an investor) visits.
// The PIN itself is the only credential; there is no account, no session,
// no PortalAuthGuard here at all.
export default function DataRoomPublicPage() {
  const { t } = useTranslation();
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [serverError, setServerError] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [viewSession, setViewSession] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DataRoomDocument[]>([]);
  const [preview, setPreview] = useState<PreviewState>(EMPTY_PREVIEW);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DataRoomPinInput>({ resolver: zodResolver(dataRoomPinSchema) });

  const onSubmit = async (data: DataRoomPinInput) => {
    setServerError('');
    try {
      const result = await verifyDataRoomPin(token, dataRoomPinSchema.parse(data).pin);
      setViewSession(result.view_session);
      setCompanyName(result.company_name);
      setDocuments(result.documents);
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      setServerError(status === 403 ? t('public_data_room.incorrect_pin') : t('public_data_room.generic_error'));
    }
  };

  const handlePreview = async (doc: DataRoomDocument) => {
    if (!viewSession) return;
    setPreview({ ...EMPTY_PREVIEW, open: true, title: doc.name, loading: true });
    try {
      const result = await getDataRoomPreviewUrl(token, doc.id, viewSession);
      setPreview((prev) => ({ ...prev, url: result.url, mimeType: result.mime_type, loading: false }));
    } catch {
      setPreview((prev) => ({ ...prev, loading: false, error: t('public_data_room.preview_error') }));
    }
  };

  if (!viewSession) {
    return (
      <AuthCard title={t('public_data_room.title')} subtitle={t('public_data_room.subtitle')}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {serverError && <Alert severity="error">{serverError}</Alert>}

          <TextField
            label={t('public_data_room.password_label')}
            placeholder={t('public_data_room.password_placeholder')}
            autoFocus
            fullWidth
            error={!!errors.pin}
            helperText={errors.pin?.message}
            {...register('pin')}
          />

          <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting}>
            {t('public_data_room.submit_button')}
          </Button>
        </Box>
      </AuthCard>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6, px: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 640, mx: 'auto' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          {companyName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('public_data_room.shared_docs_desc')}
        </Typography>

        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px', bgcolor: 'background.paper' }}>
          <List disablePadding>
            {documents.map((doc) => (
              <ListItemButton key={doc.id} onClick={() => handlePreview(doc)} divider>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <DescriptionOutlinedIcon color="action" />
                </ListItemIcon>
                <ListItemText primary={doc.name} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Box>

      <DocumentPreviewDialog
        open={preview.open}
        onClose={() => setPreview(EMPTY_PREVIEW)}
        title={preview.title}
        url={preview.url}
        mimeType={preview.mimeType}
        loading={preview.loading}
        error={preview.error}
      />
    </Box>
  );
}
