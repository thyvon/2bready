'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';

import { useTranslation } from '@/lib/i18n';
import type { Role } from '../types';

interface RoleDetailsDialogProps {
  role: Role | null;
  onClose: () => void;
}

export default function RoleDetailsDialog({ role, onClose }: RoleDetailsDialogProps) {
  const { t } = useTranslation();

  if (!role) return null;

  return (
    <Dialog open={!!role} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {role.name}
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
          {t('roles.permissions_label')} ({role.permissions.length})
        </Typography>
        {role.permissions.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('roles.no_permissions')}
          </Typography>
        ) : (
          <Box className="flex flex-wrap gap-1">
            {role.permissions.map((permission) => (
              <Chip key={permission} label={permission} size="small" variant="outlined" />
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
