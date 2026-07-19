'use client';

import { forwardRef } from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

interface FormSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  disabled?: boolean;
}

// Shared checked+onChange(boolean) wrapper — every existing toggle in this app
// (packages/page.tsx, journey-templates pages) inlines the same
// Controller+FormControlLabel+Switch boilerplate with no shared component;
// this feature is the first to add three more toggles across two pages, which
// is the point this finally gets extracted, matching FormSelect/FormTextField's
// existing pattern.
const FormSwitch = forwardRef<HTMLButtonElement, FormSwitchProps>(function FormSwitch(
  { checked, onChange, label, disabled },
  ref,
) {
  return (
    <FormControlLabel
      control={<Switch checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} ref={ref} />}
      label={label}
    />
  );
});

export default FormSwitch;
