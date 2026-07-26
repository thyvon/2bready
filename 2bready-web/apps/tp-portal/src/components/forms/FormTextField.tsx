'use client';

import { forwardRef } from 'react';
import TextField, { type TextFieldProps } from '@mui/material/TextField';

type FormTextFieldProps = Omit<TextFieldProps, 'variant'>;

// Shared underline-only text input (variant="standard") — the plain-text
// counterpart to FormSelect, so every text field in the app matches every
// select's look instead of selects being underlined while text inputs stay
// boxed/outlined. Same prop surface as TextField, so migrating an existing
// field is a drop-in rename.
const FormTextField = forwardRef<HTMLDivElement, FormTextFieldProps>(function FormTextField(props, ref) {
  return <TextField {...props} variant="standard" ref={ref} />;
});

export default FormTextField;
