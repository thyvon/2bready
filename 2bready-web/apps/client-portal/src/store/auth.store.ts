import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { components } from '@2bready/api-client';

export type AuthUser = components['schemas']['UserResource'];

// Tracks where in the TOTP login flow the user is — mirrors admin-portal's own
// auth.store.ts (see totp/setup, totp/challenge pages). This used to say 2FA
// never applies here since User::requiresTwoFactor() only covered
// admin/staff/finance/auditor roles — no longer true now that an admin can
// force it on for a specific company_owner/member via two_factor_required.
export type TotpFlowState = 'none' | 'setup_required' | 'challenge';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  totpFlow: TotpFlowState;
  hasHydrated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  setPendingTotp: (user: AuthUser, token: string, flow: 'setup_required' | 'challenge') => void;
  completeTotpFlow: (token: string) => void;
  clearAuth: () => void;
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
        localStorage.setItem('client_auth_token', token);
        set({ user, token, isAuthenticated: true, totpFlow: 'none' });
      },

      setPendingTotp: (user, token, flow) => {
        localStorage.setItem('client_auth_token', token);
        // isAuthenticated stays false until TOTP is fully verified — the token
        // held at this point only carries the 'totp-pending' ability
        // server-side (EnsureTwoFactorVerified), so nothing protected is
        // actually reachable with it yet.
        set({ user, token, isAuthenticated: false, totpFlow: flow });
      },

      completeTotpFlow: (token) => {
        const user = get().user;
        if (!user) return;
        localStorage.setItem('client_auth_token', token);
        set({ token, isAuthenticated: true, totpFlow: 'none' });
      },

      clearAuth: () => {
        localStorage.removeItem('client_auth_token');
        set({ user: null, token: null, isAuthenticated: false, totpFlow: 'none' });
      },
    }),
    {
      name: '2bready-client-auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated, totpFlow: s.totpFlow }),
      merge: (persistedState, currentState) => {
        const savedState = persistedState as Partial<AuthState>;

        // Hydration runs asynchronously. If somebody registers or logs in
        // before it finishes, the saved anonymous state must not replace the
        // fresh authenticated session while routing to onboarding.
        if (currentState.isAuthenticated) {
          return { ...currentState, hasHydrated: true };
        }

        return {
          ...currentState,
          ...savedState,
          hasHydrated: true,
        };
      },
    }
  )
);
