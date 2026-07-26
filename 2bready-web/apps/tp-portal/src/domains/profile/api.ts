import api from '@/lib/api';
import type { User, UpdateProfileInput, ChangePasswordInput } from './types';

export async function updateProfile(data: UpdateProfileInput): Promise<User> {
  const res = await api.put<{ data: User }>('/me', data);
  return res.data.data;
}

export async function changePassword(data: ChangePasswordInput): Promise<void> {
  await api.put('/me/password', data);
}
