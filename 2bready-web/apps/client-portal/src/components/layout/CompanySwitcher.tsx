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

// No auth/company API exists yet for client-portal (UI-first) — seeded with
// two placeholder companies (matching admin-portal's real "a company_owner
// can belong to more than one company" mechanic, §0.7 of the MVP proposal)
// so the switch interaction is actually demoable, not a single-company dead
// control. Selecting a company only updates local state — no real session
// switch happens until a real company API/auth store exists here.
const MOCK_COMPANIES = [
  { id: '1', name: 'BlueOcean Foods' },
  { id: '2', name: 'Golden Rice Export Co., Ltd.' },
];

export function CompanySwitcher() {
  const [currentId, setCurrentId] = useState(MOCK_COMPANIES[0].id);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const current = MOCK_COMPANIES.find((c) => c.id === currentId)!;

  return (
    <>
      <Button
        onClick={(e) => setAnchorEl(e.currentTarget)}
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
        <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
        {MOCK_COMPANIES.map((c) => (
          <MenuItem
            key={c.id}
            selected={c.id === currentId}
            onClick={() => {
              setCurrentId(c.id);
              setAnchorEl(null);
            }}
            sx={{ gap: 1.5 }}
          >
            <ListItemText primary={c.name} />
            {c.id === currentId && <CheckIcon fontSize="small" color="action" />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
