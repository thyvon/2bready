'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import Tooltip from '@mui/material/Tooltip';

import { useAuthStore } from '@/store/auth.store';
import { switchActiveCompany } from '@/domains/company/api';
import { useToast } from '@/components/feedback/ToastProvider';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

// A company_owner can belong to more than one company (§0.7 of the MVP
// proposal). Always shown (as the current company's name) once the user has
// at least one. With only one company there's nothing to switch to, so it
// renders as plain text instead of a disabled dropdown — a disabled control
// with a single fixed option reads as broken UI, not "nothing to do here".
// The "add another company" affordance is a standalone button next to the
// name/select (not buried inside the dropdown's option list) so it's
// reachable even with just one company, where there's no dropdown to open.
export default function CompanySwitcher() {
  const router = useRouter();
  const { user, hasRole, setAuth, token } = useAuthStore();
  const toast = useToast();
  const { t } = useTranslation();
  const [switching, setSwitching] = useState(false);

  const companies = user?.companies ?? [];

  // No company at all (internal roles, or an owner who hasn't registered one yet) —
  // nothing to show here.
  if (companies.length === 0) return null;

  const addCompanyButton = hasRole('company_owner') && (
    <Tooltip title={t('header.add_company')}>
      <Button
        size="small"
        onClick={() => router.push('/company/setup')}
        startIcon={<AddIcon fontSize="small" />}
        sx={{ color: 'text.secondary', minWidth: 0, px: 1, '&:hover': { color: 'text.primary' } }}
      >
        {t('header.new_company_short')}
      </Button>
    </Tooltip>
  );

  if (companies.length === 1) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ px: 1, fontWeight: 500 }} noWrap>
          {companies[0].name}
        </Typography>
        {addCompanyButton}
      </Box>
    );
  }

  const handleChange = async (e: SelectChangeEvent) => {
    const value = e.target.value;
    if (value === user?.current_company_id) return;

    setSwitching(true);
    try {
      const updatedUser = await switchActiveCompany(value);
      if (token) setAuth(updatedUser, token);
      router.refresh();
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Select
        variant="standard"
        size="small"
        value={user?.current_company_id ?? ''}
        onChange={handleChange}
        disabled={switching}
        aria-label={t('header.switch_company')}
        sx={{
          minWidth: 140,
          maxWidth: 220,
          fontSize: '0.875rem',
          color: 'text.secondary',
          '.MuiSelect-select': { py: 0.75 },
        }}
      >
        {companies.map((company) => (
          <MenuItem key={company.id} value={company.id} sx={{ fontSize: '0.875rem' }}>
            {company.name}
          </MenuItem>
        ))}
      </Select>
      {addCompanyButton}
    </Box>
  );
}
