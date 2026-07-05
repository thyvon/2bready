'use client';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import HeaderActions from '@/components/layouts/HeaderActions';
import { useTranslation } from '@/lib/i18n';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { t } = useTranslation();

  return (
    <Box
      component="header"
      sx={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2, sm: 3 },
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <IconButton
        onClick={onMenuClick}
        aria-label={t('header.open_menu')}
        sx={{ display: { xs: 'inline-flex', md: 'none' }, color: 'text.secondary' }}
      >
        <MenuOutlinedIcon fontSize="small" />
      </IconButton>

      <Box sx={{ flex: 1 }} />

      <HeaderActions />
    </Box>
  );
}
