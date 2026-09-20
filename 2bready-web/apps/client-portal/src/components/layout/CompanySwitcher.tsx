'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import { z } from 'zod';
import { getApiError } from '@2bready/api-client';
import { useAuthStore } from '@/store/auth.store';
import { switchActiveCompany, registerOwnCompany } from '@/lib/company-api';
import { useIndustries, type IndustryOption } from '@/lib/useIndustries';
import { COUNTRY_OPTIONS } from '@/lib/company-setup-schema';
import { useToast } from '@/components/ToastProvider';
import { useTranslation } from '@/lib/i18n';
import FormTextField from '@/components/forms/FormTextField';
import FormSelect from '@/components/forms/FormSelect';
import { FormDatePicker } from '@2bready/ui-core';

const addCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255),
  name_kh: z.string().max(255).optional().or(z.literal('')),
  registration_no: z.string().max(100).optional().or(z.literal('')),
  industry_id: z.string().min(1, 'Industry is required'),
  country_code: z.string().length(2, 'Use a 2-letter country code'),
  compliance_start_date: z.string().optional().or(z.literal('')),
});

type AddCompanyInput = z.infer<typeof addCompanySchema>;

const nameSx = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: 160,
} as const;

export function CompanySwitcher() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const toast = useToast();
  const { t, locale } = useTranslation();
  const { industries } = useIndustries({ withTemplatesOnly: true });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [switching, setSwitching] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddCompanyInput>({
    resolver: zodResolver(addCompanySchema),
    defaultValues: {
      name: '',
      name_kh: '',
      registration_no: '',
      industry_id: '',
      country_code: 'KH',
      compliance_start_date: '',
    },
  });

  const companies = user?.companies ?? [];
  const current = companies.find((c) => c.id === user?.current_company_id) ?? companies[0];

  if (!current) return null;

  const handleSwitch = async (companyId: string) => {
    setAnchorEl(null);
    if (companyId === current.id || !token) return;
    setSwitching(true);
    try {
      const updatedUser = await switchActiveCompany(companyId);
      setAuth(updatedUser, token);
    } catch (err) {
      toast.error(getApiError(err).message || 'Could not switch company.');
    } finally {
      setSwitching(false);
    }
  };

  const handleAddCompany = () => {
    setAnchorEl(null);
    reset({
      name: '',
      name_kh: '',
      registration_no: '',
      industry_id: '',
      country_code: 'KH',
      compliance_start_date: '',
    });
    setAddDialogOpen(true);
  };

  const onSubmit = async (data: AddCompanyInput) => {
    if (!token) return;
    setCreating(true);
    try {
      const result = await registerOwnCompany({
        name: data.name,
        name_kh: data.name_kh || undefined,
        registration_no: data.registration_no || undefined,
        industry_id: data.industry_id,
        country_code: data.country_code,
        compliance_start_date: data.compliance_start_date || undefined,
      });
      setAuth(result.user, token);
      setAddDialogOpen(false);
      reset();
      toast.success(t('company.toast_created'));
    } catch (err) {
      toast.error(getApiError(err).message || t('company.toast_create_error'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        disabled={switching}
        startIcon={<ApartmentOutlinedIcon sx={{ fontSize: '1rem' }} />}
        endIcon={<KeyboardArrowDownIcon sx={{ fontSize: '1rem' }} />}
        sx={{
          color: 'text.secondary',
          fontSize: '0.8125rem',
          fontWeight: 600,
          textTransform: 'none',
          px: 1.25,
          maxWidth: 200,
          '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
        }}
      >
        <Box component="span" sx={nameSx}>
          {current.name}
        </Box>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 220 } } }}
      >
        {companies.map((c) => (
          <MenuItem key={c.id} selected={c.id === current.id} onClick={() => handleSwitch(c.id)} sx={{ gap: 1.5 }}>
            <ListItemText primary={c.name} />
            {c.id === current.id && <CheckIcon fontSize="small" color="action" />}
          </MenuItem>
        ))}
        <MenuItem onClick={handleAddCompany} sx={{ gap: 1.5, color: 'primary.main' }}>
          <AddIcon fontSize="small" />
          <ListItemText primary={t('company.add_company')} />
        </MenuItem>
      </Menu>

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{t('company.add_dialog_title')}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
            <FormTextField
              label={t('company.name_label')}
              placeholder={t('company.name_placeholder')}
              required
              fullWidth
              autoFocus
              error={!!errors.name}
              helperText={errors.name?.message}
              {...register('name')}
            />
            <FormTextField
              label={t('company.name_kh_label') ?? 'Company Name (Khmer)'}
              placeholder="ឈ្មោះក្រុមហ៊ុន"
              fullWidth
              error={!!errors.name_kh}
              helperText={errors.name_kh?.message}
              {...register('name_kh')}
            />
            <FormTextField
              label={t('company.registration_no_label') ?? 'Business Registration No.'}
              placeholder="e.g. 00012345"
              fullWidth
              error={!!errors.registration_no}
              helperText={errors.registration_no?.message}
              {...register('registration_no')}
            />
            <Controller
              name="industry_id"
              control={control}
              render={({ field }) => (
                <FormSelect
                  {...field}
                  label={t('company.industry_label')}
                  required
                  fullWidth
                  error={!!errors.industry_id}
                  helperText={errors.industry_id?.message}
                >
                  {industries.map((industry: IndustryOption) => (
                    <MenuItem key={industry.id} value={industry.id}>
                      {locale === 'kh' && industry.name_kh ? industry.name_kh : industry.name}
                    </MenuItem>
                  ))}
                </FormSelect>
              )}
            />
            <Controller
              name="country_code"
              control={control}
              render={({ field }) => (
                <FormSelect
                  {...field}
                  label={t('company.country_label') ?? 'Country'}
                  required
                  fullWidth
                  error={!!errors.country_code}
                  helperText={errors.country_code?.message}
                >
                  {COUNTRY_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </FormSelect>
              )}
            />
            <Controller
              name="compliance_start_date"
              control={control}
              render={({ field }) => (
                <FormDatePicker
                  label={t('company.compliance_start_date') ?? 'Compliance Start Date'}
                  variant="outlined"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  fullWidth
                  error={!!errors.compliance_start_date}
                  helperText={errors.compliance_start_date?.message ?? 'Optional — leave blank to use today.'}
                />
              )}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button variant="outlined" onClick={() => setAddDialogOpen(false)} disabled={creating}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="contained" loading={creating}>
              {t('common.confirm')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
