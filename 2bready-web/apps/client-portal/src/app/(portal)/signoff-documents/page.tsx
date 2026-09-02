'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { DocumentPreviewDialog } from '@2bready/ui-core';
import { useToast } from '@/components/ToastProvider';
import {
  listMySignoffDocuments,
  acknowledgeMySignoffDocument,
  type MySignoffDocumentRow,
} from '@/lib/signoff-document-api';
import { formatDate, getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { DataTable, type Column } from '@2bready/ui-core';

export default function SignOffDocumentsPage() {
  const { t } = useTranslation();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);
  const [myRows, setMyRows] = useState<MySignoffDocumentRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mine = await listMySignoffDocuments();
        if (!cancelled) setMyRows(mine);
      } catch (err) {
        if (!cancelled) toast.error(getApiError(err).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast]);

  const sharedColumns: Column<MySignoffDocumentRow>[] = [
    {
      key: 'document',
      label: t('signoff_document.doc_title'),
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.document.title}</Typography>
      ),
    },
    {
      key: 'status',
      label: t('common.status'),
      width: 180,
      render: (row) => {
        const signed = row.signed_at !== null;
        return (
          <Chip
            size="small"
            color={signed ? 'success' : 'warning'}
            variant="outlined"
            icon={signed ? <TaskAltOutlinedIcon fontSize="small" /> : undefined}
            label={signed ? t('signoff_document.signed_on', { date: formatDate(row.signed_at ?? '') }) : t('signoff_document.pending_signature')}
          />
        );
      },
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      width: 96,
      render: (row) => {
        const signed = row.signed_at !== null;
        return (
          <Box className="flex items-center justify-end gap-0.5">
            <Tooltip title={signed ? t('signoff_document.view_again') : t('signoff_document.read_now')}>
              <IconButton size="small" onClick={() => setPreviewDoc({ title: row.document.title, url: row.document.preview_url })}>
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {!signed && (
              <Tooltip title={t('signoff_document.acknowledge')}>
                <IconButton
                  size="small"
                  onClick={async () => {
                    try {
                      await acknowledgeMySignoffDocument(row.id);
                      toast.success(t('signoff_document.ack_success'));
                      const mine = await listMySignoffDocuments();
                      setMyRows(mine);
                    } catch (err) {
                      toast.error(getApiError(err).message);
                    }
                  }}
                >
                  <TaskAltOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <Box className="flex flex-col gap-6">
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {t('signoff_document.shared_with_me')}
      </Typography>

      <DataTable
        columns={sharedColumns}
        rows={myRows}
        getRowId={(row) => String(row.id)}
        loading={loading}
        emptyTitle={t('signoff_document.no_shared_title')}
        emptyDescription={t('signoff_document.no_shared_desc')}
      />

      <DocumentPreviewDialog
        open={previewDoc !== null}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.title ?? ''}
        url={previewDoc?.url ?? null}
        mimeType={previewDoc?.url?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : null}
      />
    </Box>
  );
}
