'use client';

import { forwardRef } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { SxProps, Theme } from '@mui/material/styles';
import { format, parseISO, isValid } from 'date-fns';

const ISO_DATE = 'yyyy-MM-dd';

export interface FormDatePickerProps {
  value?: string | null;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  // Only needed standalone (e.g. a filter bar) — pages that already render a
  // FieldLabel above the field, like every other dialog form, leave this
  // unset so the DatePicker doesn't render a second, redundant label.
  label?: string;
  size?: 'small' | 'medium';
  // admin-portal's convention is the underline "standard" variant (matching
  // FormTextField/FormSelect); client-portal's forms use plain outlined
  // fields instead — default to "standard" and override per call site
  // rather than force one look on both apps.
  variant?: 'standard' | 'outlined' | 'filled';
  fullWidth?: boolean;
  error?: boolean;
  helperText?: React.ReactNode;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  sx?: SxProps<Theme>;
  // For the rare field that shows a leading icon (e.g. the business setup
  // wizard's calendar glyph) — passed straight through to the underlying
  // text field's own input adornment slot.
  startAdornment?: React.ReactNode;
}

// Shared calendar date-picker (needs a LocalizationProvider ancestor — see
// each app's Providers.tsx). Defaults to the underline "standard" variant to
// match FormTextField/FormSelect (admin-portal's convention); pass
// variant="outlined" where the surrounding form uses that instead (see
// client-portal's CompanySetupWizard). Works with plain ISO date strings
// ('YYYY-MM-DD') in/out — the exact
// shape every date field's Zod schema and the native <input type="date">
// they replaced already used — so swapping one in is a value/onChange
// rename, not a schema change. Replaces the native date input every form
// across both apps used before (no calendar UI, inconsistent
// browser/OS-native styling that couldn't follow the app theme).
export const FormDatePicker = forwardRef<HTMLInputElement, FormDatePickerProps>(function FormDatePicker(
  { value, onChange, onBlur, name, label, size, variant = 'standard', fullWidth, error, helperText, disabled, minDate, maxDate, sx, startAdornment },
  ref,
) {
  const parsed = value ? parseISO(value) : null;
  const dateValue = parsed && isValid(parsed) ? parsed : null;
  const minDateValue = minDate ? parseISO(minDate) : undefined;
  const maxDateValue = maxDate ? parseISO(maxDate) : undefined;

  return (
    <DatePicker
      value={dateValue}
      onChange={(date) => onChange(date && isValid(date) ? format(date, ISO_DATE) : '')}
      minDate={minDateValue && isValid(minDateValue) ? minDateValue : undefined}
      maxDate={maxDateValue && isValid(maxDateValue) ? maxDateValue : undefined}
      disabled={disabled}
      sx={sx}
      slotProps={{
        textField: {
          inputRef: ref,
          name,
          onBlur,
          label,
          size,
          variant,
          fullWidth,
          error,
          helperText,
          slotProps: startAdornment ? { input: { startAdornment } } : undefined,
        },
      }}
    />
  );
});
