'use client';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import CompanyFormWizard from '@/domains/company/components/CompanyFormWizard';
import { createCompany } from '@/domains/company/api';
import type { CompanyFormOutput } from '@/domains/company/schemas';
import type { Company } from '@/domains/company/types';
import { useToast } from '@/components/feedback/ToastProvider';
import { useTranslation } from '@/lib/i18n';

interface CompanyCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (company: Company) => void;
}

export default function CompanyCreateDialog({ open, onClose, onCreated }: CompanyCreateDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();

  const handleSubmit = async (data: CompanyFormOutput) => {
    const company = await createCompany({
      name: data.name,
      name_kh: data.name_kh || undefined,
      registration_no: data.registration_no || undefined,
      industry_id: data.industry_id,
      country_code: data.country_code,
      employee_count: data.employee_count,
      compliance_start_date: data.compliance_start_date || undefined,
      default_locale: data.default_locale,
    });
    toast.success(`${company.name} was created.`);
    onCreated(company);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('admin.new_company')}</DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <Box sx={{ pt: 1 }}>
          <CompanyFormWizard onSubmit={handleSubmit} submitLabel={t('company.create_company')} />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
