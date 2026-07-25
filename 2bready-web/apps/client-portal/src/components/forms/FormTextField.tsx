'use client';

import { forwardRef } from 'react';
import TextField, { type TextFieldProps } from '@mui/material/TextField';

type FormTextFieldProps = Omit<TextFieldProps, 'variant'>;

// Shared outlined text input (variant="outlined", this app's existing look
// and MUI's own default) — locks it in explicitly so a future field can't
// accidentally drift to "standard"/"filled". Same prop surface as TextField,
// so migrating an existing field is a drop-in rename.
const FormTextField = forwardRef<HTMLDivElement, FormTextFieldProps>(function FormTextField(props, ref) {
  return <TextField {...props} variant="outlined" ref={ref} />;
});

export default FormTextField;
