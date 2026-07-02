import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, TotpFlowState } from '@/domains/auth/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  // Tracks where in the TOTP login flow the user is
  totpFlow: TotpFlowState;
  setAuth: (user: User, token: string) => void;
  setPendingTotp: (user: User, token: string, flow: 'setup_required' | 'challenge') => void;
  completeTotpFlow: (token: string) => void;
  clearAuth: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

function syncTokenCookie(token: string | null) {
  if (typeof document === 'undefined') return;
  if (token) {
    document.cookie = `auth_token=${token}; path=/; SameSite=Lax`;
  } else {
    document.cookie = 'auth_token=; path=/; max-age=0';
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      totpFlow: 'none',

      setAuth: (user, token) => {
        localStorage.setItem('auth_token', token);
        syncTokenCookie(token);
        set({ user, token, isAuthenticated: true, totpFlow: 'none' });
      },

      setPendingTotp: (user, token, flow) => {
        localStorage.setItem('auth_token', token);
        syncTokenCookie(token);
        // isAuthenticated stays false until TOTP is fully verified
        set({ user, token, isAuthenticated: false, totpFlow: flow });
      },

      completeTotpFlow: (token) => {
        const user = get().user;
        if (!user) return;
        localStorage.setItem('auth_token', token);
        syncTokenCookie(token);
        set({ token, isAuthenticated: true, totpFlow: 'none' });
      },

      clearAuth: () => {
        localStorage.removeItem('auth_token');
        syncTokenCookie(null);
        set({ user: null, token: null, isAuthenticated: false, totpFlow: 'none' });
      },

      hasRole: (role) => {
        const roles = get().user?.roles;
        if (!roles) return false;
        return Array.isArray(roles) ? roles.includes(role) : Object.keys(roles).includes(role);
      },

      hasAnyRole: (roles) => {
        const userRoles = get().user?.roles;
        if (!userRoles) return false;
        const roleList = Array.isArray(userRoles) ? userRoles : Object.keys(userRoles);
        return roles.some((r) => roleList.includes(r));
      },
    }),
    {
      name: '2bready-auth',
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        isAuthenticated: s.isAuthenticated,
        totpFlow: s.totpFlow,
      }),
    }
  )
);
