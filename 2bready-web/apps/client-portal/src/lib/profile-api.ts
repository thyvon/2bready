import api from '@/lib/api';
import type { components } from '@2bready/api-client';

export type User = components['schemas']['UserResource'];
export type UpdateProfilePayload = components['schemas']['UpdateProfileRequest'];
export type ChangePasswordPayload = components['schemas']['ChangePasswordRequest'];

export async function updateProfile(data: UpdateProfilePayload): Promise<User> {
  const res = await api.put<{ data: User }>('/me', data);
  return res.data.data;
}

export async function changePassword(data: ChangePasswordPayload): Promise<void> {
  await api.put('/me/password', data);
}
