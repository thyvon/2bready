import type { components } from '@2bready/api-client';

export type User = components['schemas']['UserResource'];

export type UpdateProfileInput = {
  name: string;
  email: string;
};

export type ChangePasswordInput = {
  current_password: string;
  password: string;
  password_confirmation: string;
};
