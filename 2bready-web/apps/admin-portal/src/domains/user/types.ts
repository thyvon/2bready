import type { components } from '@2bready/api-client';

export const INTERNAL_ROLES = ['admin', 'staff', 'finance', 'auditor'] as const;
export type InternalRole = (typeof INTERNAL_ROLES)[number];

// Scramble can't infer Spatie's getRoleNames() return type on UserResource,
// defaulting to `Record<string, never>` — overridden here the same way the
// audit-log module overrides changes/metadata, rather than fighting
// Scramble's inference on the backend for a type only this module consumes.
export type User = Omit<components['schemas']['UserResource'], 'roles'> & {
  roles: string[];
};

// Same Scramble-can't-infer-Collection<string> gap as UserResource.roles above.
export type Role = Omit<components['schemas']['RoleResource'], 'permissions'> & {
  permissions: string[];
};

export interface UserListFilters {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface Pagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  roles: InternalRole[];
}

export interface UpdateUserPayload {
  name?: string;
  status?: 'active' | 'suspended' | 'inactive';
  roles?: InternalRole[];
  google_auth_enabled?: boolean;
  // Tri-state override of the role-derived 2FA default — null resets back to
  // that default, true/false forces it regardless of role. See the backend's
  // User::requiresTwoFactor().
  two_factor_required?: boolean | null;
}
