'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import FilterListIcon from '@mui/icons-material/FilterListOutlined';

import SectionCard from '@/components/ui/SectionCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import FormSelect from '@/components/forms/FormSelect';
import { useToast } from '@/components/feedback/ToastProvider';
import { listDocuments, verifyDocument, rejectDocument, getPreviewUrl } from '@/domains/document/api';
import type { Document } from '@/domains/document/types';
import { DocumentPreviewDialog } from '@/domains/document/components/DocumentPreviewDialog';
import { getVaultStatus, lockVault } from '@/domains/vault/api';
import type { VaultStatus } from '@/domains/vault/types';
import { VaultPinDialog } from '@/domains/vault/components/VaultPinDialog';
import { getApiError, formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface PreviewState {
  documentId: string;
  title: string;
  status: string;
  url: string | null;
  mimeType: string | null;
  loading: boolean;
  error: string | null;
}

interface VaultGateState {
  companyId: string;
  companyName: string;
  status: VaultStatus;
  /** The document whose preview is queued behind this unlock. */
  pendingDocument: Document | null;
}

// The cross-company back-office review queue. A company's own workspace
// doesn't have a parallel scoped version of this — its documents live inside
// the Journey tab instead, reviewed in the context of the milestone they
// gate (see companies/[id]/journey/page.tsx), the same merge client-portal
// already made between its own Journey and Documents pages.
export default function DocumentsListView() {
  const toast = useToast();
  const { t } = useTranslation();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('review');
  const [acting, setActing] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [vaultGate, setVaultGate] = useState<VaultGateState | null>(null);
  const [lockedByCompany, setLockedByCompany] = useState<Record<string, boolean>>({});

  // L3/L4 documents are vault-sensitive (v3 §4.2) — the backend enforces the
  // gate on preview-url; here we surface it proactively so the PIN dialog
  // shows before the 403, and so the row can carry a lock affordance.
  const isSensitive = (doc: Document) => doc.level_code === 'L3' || doc.level_code === 'L4';

  const load = async () => {
    setLoading(true);
    try {
      setDocuments(await listDocuments(status || undefined));
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const data = await listDocuments(status || undefined);
        if (!cancelled) setDocuments(data);
      } catch (err) {
        if (!cancelled) toast.error(getApiError(err).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handlePreview = async (document: Document) => {
    if (!isSensitive(document)) {
      openPreview(document);
      return;
    }

    // Sensitive document: resolve the vault state for its company first.
    const company = document.company;
    if (!company) {
      toast.error(t('vault.no_company'));
      return;
    }

    try {
      const vaultStatus = await getVaultStatus(company.id);
      setLockedByCompany((prev) => ({ ...prev, [company.id]: !vaultStatus.unlocked }));
      if (vaultStatus.unlocked) {
        openPreview(document);
        return;
      }
      setVaultGate({ companyId: company.id, companyName: company.name, status: vaultStatus, pendingDocument: document });
    } catch (err) {
      toast.error(getApiError(err).message);
    }
  };

  const openPreview = (document: Document) => {
    setPreview({ documentId: document.id, title: document.document_template?.name ?? document.original_filename, status: document.status, url: null, mimeType: null, loading: true, error: null });
    getPreviewUrl(document.id)
      .then((result) => {
        setPreview((prev) => (prev && prev.documentId === document.id ? { ...prev, url: result.url, mimeType: result.mime_type, loading: false } : prev));
      })
      .catch((err) => {
        setPreview((prev) => (prev && prev.documentId === document.id ? { ...prev, loading: false, error: getApiError(err).message } : prev));
      });
  };

  const handleVaultUnlocked = () => {
    if (!vaultGate) return;
    setLockedByCompany((prev) => ({ ...prev, [vaultGate.companyId]: false }));
    const pending = vaultGate.pendingDocument;
    setVaultGate(null);
    if (pending) openPreview(pending);
  };

  const handleLock = async (document: Document) => {
    const company = document.company;
    if (!company) return;
    try {
      await lockVault(company.id);
      setLockedByCompany((prev) => ({ ...prev, [company.id]: true }));
      toast.success(t('vault.locked'));
    } catch (err) {
      toast.error(getApiError(err).message);
    }
  };

  const handleVerify = async (comment?: string) => {
    if (!preview) return;
    setActing(true);
    try {
      await verifyDocument(preview.documentId, comment);
      toast.success(t('admin.document_verified'));
      setPreview(null);
      load();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setActing(false);
    }
  };

  const handleReject = async (comment: string) => {
    if (!preview) return;
    setActing(true);
    try {
      await rejectDocument(preview.documentId, comment);
      toast.success(t('admin.document_rejected'));
      setPreview(null);
      load();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setActing(false);
    }
  };

  const columns: Column<Document>[] = [
    { key: 'company', label: t('admin.company_col'), render: (d) => d.company?.name ?? '—' },
    { key: 'document_template', label: t('admin.document_col'), render: (d) => d.document_template?.name ?? '—' },
    { key: 'created_at', label: t('admin.uploaded_col'), render: (d) => formatDate(d.created_at) },
    { key: 'status', label: t('common.status'), render: (d) => <StatusBadge status={d.status} /> },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (d) => {
        const sensitive = isSensitive(d);
        const companyId = d.company?.id;
        const locked = sensitive && companyId ? lockedByCompany[companyId] ?? true : false;

        return (
          <Box className="flex justify-end gap-2">
            {sensitive && companyId && (
              <Tooltip title={locked ? t('vault.locked_tooltip') : t('vault.unlocked_tooltip')}>
                <IconButton size="small" color={locked ? 'warning' : 'success'} onClick={() => (locked ? handlePreview(d) : handleLock(d))}>
                  {locked ? <LockOutlinedIcon fontSize="small" /> : <LockOpenOutlinedIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={t('admin.preview')}>
              <IconButton size="small" onClick={() => handlePreview(d)}>
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <>
      <SectionCard noPadding>
        <Box sx={{ p: 2 }}>
          <FormSelect
            label={t('common.status')}
            size="small"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            sx={{ minWidth: 220 }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><FilterListIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> } }}
          >
            <MenuItem value="">{t('common.all')}</MenuItem>
            <MenuItem value="review">{t('status.review')}</MenuItem>
            <MenuItem value="verified">{t('status.verified')}</MenuItem>
            <MenuItem value="rejected">{t('status.rejected')}</MenuItem>
            <MenuItem value="expired">{t('status.expired')}</MenuItem>
            <MenuItem value="pending_scan">{t('status.pending_scan')}</MenuItem>
            <MenuItem value="scan_failed">{t('status.scan_failed')}</MenuItem>
          </FormSelect>
        </Box>

        <DataTable
          columns={columns}
          rows={documents}
          getRowId={(d) => d.id}
          loading={loading}
          emptyTitle={t('admin.no_documents')}
          emptyDescription={t('admin.no_documents_desc')}
        />
      </SectionCard>

      <DocumentPreviewDialog
        key={preview?.documentId ?? 'none'}
        open={preview !== null}
        onClose={() => setPreview(null)}
        title={preview?.title ?? ''}
        url={preview?.url ?? null}
        mimeType={preview?.mimeType ?? null}
        loading={preview?.loading ?? false}
        error={preview?.error ?? null}
        status={preview?.status}
        onVerify={handleVerify}
        onReject={handleReject}
        acting={acting}
      />

      <VaultPinDialog
        open={vaultGate !== null}
        companyId={vaultGate?.companyId ?? ''}
        companyName={vaultGate?.companyName ?? ''}
        pinSet={vaultGate?.status.pin_set ?? true}
        pinLength={vaultGate?.status.pin_length ?? 6}
        onClose={() => setVaultGate(null)}
        onUnlocked={handleVaultUnlocked}
      />
    </>
  );
}
