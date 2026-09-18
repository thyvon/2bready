'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import { z } from 'zod';
import { getApiError } from '@2bready/api-client';
import { useAuthStore } from '@/store/auth.store';
import { switchActiveCompany, registerOwnCompany } from '@/lib/company-api';
import { useIndustries, type IndustryOption } from '@/lib/useIndustries';
import { useToast } from '@/components/ToastProvider';
import { useTranslation } from '@/lib/i18n';

const addCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  industry_id: z.string().min(1, 'Industry is required'),
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
  const { t } = useTranslation();
  const { industries } = useIndustries({ withTemplatesOnly: true });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [switching, setSwitching] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddCompanyInput>({
    resolver: zodResolver(addCompanySchema),
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
    setAddDialogOpen(true);
  };

  const onSubmit = async (data: AddCompanyInput) => {
    if (!token) return;
    setCreating(true);
    try {
      const result = await registerOwnCompany({
        name: data.name,
        industry_id: data.industry_id,
        country_code: 'KH',
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

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{t('company.add_dialog_title')}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
            <TextField
              {...register('name')}
              label={t('company.name_label')}
              placeholder={t('company.name_placeholder')}
              error={!!errors.name}
              helperText={errors.name?.message}
              fullWidth
              autoFocus
            />
            <FormControl fullWidth error={!!errors.industry_id}>
              <InputLabel>{t('company.industry_label')}</InputLabel>
              <Select
                {...register('industry_id')}
                label={t('company.industry_label')}
                defaultValue=""
              >
                {industries.map((industry: IndustryOption) => (
                  <MenuItem key={industry.id} value={industry.id}>
                    {industry.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.industry_id && (
                <Box component="span" sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5, ml: 1.5 }}>
                  {errors.industry_id.message}
                </Box>
              )}
            </FormControl>
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
