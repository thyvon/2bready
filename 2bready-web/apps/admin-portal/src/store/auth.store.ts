import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, TotpFlowState } from '@/domains/auth/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  // Tracks where in the TOTP login flow the user is
  totpFlow: TotpFlowState;
  // True once the persisted state has been read back from localStorage. Lives
  // inside the store (not a separate side-channel/hook) and is flipped by the
  // same `merge` call that restores totpFlow/isAuthenticated below — so a
  // component reading both via one useAuthStore() call can never observe
  // "hydrated" without the real values already being in place. A separate
  // useState + persist.onFinishHydration() approach was tried first and had
  // exactly that race: the two flags updated via separate set() calls in
  // separate microtask ticks, so a render could see hasHydrated: true paired
  // with the still-default totpFlow: 'none' — which wrongly bounced an
  // in-progress /totp/challenge reload back to /login.
  hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  setPendingTotp: (user: User, token: string, flow: 'setup_required' | 'challenge') => void;
  completeTotpFlow: (token: string) => void;
  clearAuth: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

// Prefixed (not the bare 'auth_token'/'auth_full' this used to be) — production
// serves admin-portal and client-portal from the same domain (path-mounted at
// /admin and /portal, see the deploy playbook), so they share one localStorage
// and one cookie jar. Both apps' lib/api.ts read their bearer token from a
// plain, un-namespaced key; with identical names, logging into one app
// silently overwrote the token the other app's axios client was reading on
// its very next request — the other tab's session didn't actually log out,
// it just started sending the wrong account's token and got rejected. Never
// surfaced in local dev, where the two apps run on different ports (= different
// origins = already-isolated storage) rather than different paths.
function syncTokenCookie(token: string | null, fullyAuthenticated: boolean) {
  if (typeof document === 'undefined') return;
  if (token) {
    document.cookie = `admin_auth_token=${token}; path=/; SameSite=Lax`;
  } else {
    document.cookie = 'admin_auth_token=; path=/; max-age=0';
  }
  // Separate from admin_auth_token: a pending-2FA session already holds a token
  // cookie (see setPendingTotp below), but proxy.ts must not treat that as
  // "fully logged in" when deciding whether to bounce someone away from
  // /login — otherwise a pending session that ends up back on /login (e.g. a
  // stale-state redirect) gets bounced straight back to a dashboard it can't
  // actually render, looping.
  if (fullyAuthenticated) {
    document.cookie = 'admin_auth_full=1; path=/; SameSite=Lax';
  } else {
    document.cookie = 'admin_auth_full=; path=/; max-age=0';
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      totpFlow: 'none',
      hasHydrated: false,

      setAuth: (user, token) => {
        localStorage.setItem('admin_auth_token', token);
        syncTokenCookie(token, true);
        set({ user, token, isAuthenticated: true, totpFlow: 'none' });
      },

      setPendingTotp: (user, token, flow) => {
        localStorage.setItem('admin_auth_token', token);
        syncTokenCookie(token, false);
        // isAuthenticated stays false until TOTP is fully verified
        set({ user, token, isAuthenticated: false, totpFlow: flow });
      },

      completeTotpFlow: (token) => {
        const user = get().user;
        if (!user) return;
        localStorage.setItem('admin_auth_token', token);
        syncTokenCookie(token, true);
        set({ token, isAuthenticated: true, totpFlow: 'none' });
      },

      clearAuth: () => {
        localStorage.removeItem('admin_auth_token');
        syncTokenCookie(null, false);
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
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<AuthState>),
        hasHydrated: true,
      }),
    }
  )
);
