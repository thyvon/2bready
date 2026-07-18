import api from '@/lib/api';
import type { CreateUserPayload, Pagination, Role, UpdateUserPayload, User, UserListFilters } from './types';

export async function listUsers(filters: UserListFilters = {}): Promise<{ users: User[]; pagination: Pagination }> {
  const res = await api.get<{ data: User[]; meta: { pagination: Pagination } }>('/users', { params: filters });
  return { users: res.data.data, pagination: res.data.meta.pagination };
}

export async function getUser(id: string): Promise<User> {
  const res = await api.get<{ data: User }>(`/users/${id}`);
  return res.data.data;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const res = await api.post<{ data: User }>('/users', payload);
  return res.data.data;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  const res = await api.patch<{ data: User }>(`/users/${id}`, payload);
  return res.data.data;
}

export async function listRoles(): Promise<Role[]> {
  const res = await api.get<{ data: Role[] }>('/roles');
  return res.data.data;
}
