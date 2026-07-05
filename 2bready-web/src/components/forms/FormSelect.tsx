'use client';

import { forwardRef } from 'react';
import TextField, { type TextFieldProps } from '@mui/material/TextField';

type FormSelectProps = Omit<TextFieldProps, 'select' | 'variant'>;

// Shared dropdown style for every form select in the app — matches
// CompanySwitcher's underline-only look (variant="standard") instead of each
// page hand-rolling its own <TextField select>. Same prop surface as
// TextField, so migrating an existing select is a drop-in rename.
const FormSelect = forwardRef<HTMLDivElement, FormSelectProps>(function FormSelect(props, ref) {
  return <TextField {...props} select variant="standard" ref={ref} />;
});

export default FormSelect;
