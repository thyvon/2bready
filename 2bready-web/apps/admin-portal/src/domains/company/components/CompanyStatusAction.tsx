'use client';

import { useState } from 'react';
import Button from '@mui/material/Button';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';

import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/feedback/ToastProvider';
import { updateCompany } from '@/domains/company/api';
import type { Company } from '@/domains/company/types';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface CompanyStatusActionProps {
  company: Company;
  onUpdated: (company: Company) => void;
}

// One-click Activate/Suspend, separate from the full CompanyEditDialog —
// status is the highest-frequency admin action on a company, so it gets its
// own affordance rather than requiring the whole edit form to be opened.
export default function CompanyStatusAction({ company, onUpdated }: CompanyStatusActionProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const isActive = company.status === 'active';
  const nextStatus = isActive ? 'suspended' : 'active';

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const updated = await updateCompany(company.id, { status: nextStatus });
      toast.success(t('company.update_success'));
      onUpdated(updated);
      setConfirming(false);
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        color={isActive ? 'error' : 'success'}
        startIcon={isActive ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
        onClick={() => setConfirming(true)}
      >
        {isActive ? t('company.suspend_company') : t('company.activate_company')}
      </Button>

      <ConfirmDialog
        open={confirming}
        title={isActive ? t('company.suspend_confirm_title') : t('company.activate_confirm_title')}
        description={isActive ? t('company.suspend_confirm_desc', { name: company.name }) : t('company.activate_confirm_desc', { name: company.name })}
        confirmLabel={isActive ? t('company.suspend_company') : t('company.activate_company')}
        danger={isActive}
        loading={loading}
        onCancel={() => setConfirming(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
