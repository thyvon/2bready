'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import { useAuthStore } from '@/store/auth.store';
import { switchActiveCompany } from '@/lib/company-api';

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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [switching, setSwitching] = useState(false);

  const companies = user?.companies ?? [];
  const current = companies.find((c) => c.id === user?.current_company_id) ?? companies[0];

  if (!current) return null;

  // Onboarding lets a company_owner register more than one company over
  // time (§0.7 of the MVP proposal) — most accounts have exactly one though,
  // so a dropdown affordance with nothing to switch to would be misleading.
  if (companies.length <= 1) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.25,
          color: 'text.secondary',
          fontSize: '0.8125rem',
          fontWeight: 600,
        }}
      >
        <ApartmentOutlinedIcon sx={{ fontSize: '1rem' }} />
        <Box component="span" sx={nameSx}>
          {current.name}
        </Box>
      </Box>
    );
  }

  const handleSwitch = async (companyId: string) => {
    setAnchorEl(null);
    if (companyId === current.id || !token) return;
    setSwitching(true);
    try {
      const updatedUser = await switchActiveCompany(companyId);
      setAuth(updatedUser, token);
    } finally {
      setSwitching(false);
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
      </Menu>
    </>
  );
}
