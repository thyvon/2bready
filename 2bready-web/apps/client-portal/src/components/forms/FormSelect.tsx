'use client';

import { forwardRef } from 'react';
import TextField, { type TextFieldProps } from '@mui/material/TextField';

type FormSelectProps = Omit<TextFieldProps, 'select' | 'variant'>;

// Shared outlined dropdown (variant="outlined", matching FormTextField)
// instead of each page hand-rolling its own <TextField select>. Same prop
// surface as TextField, so migrating an existing select is a drop-in rename.
const FormSelect = forwardRef<HTMLDivElement, FormSelectProps>(function FormSelect(props, ref) {
  return <TextField {...props} select variant="outlined" ref={ref} />;
});

export default FormSelect;
