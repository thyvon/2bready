import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { components } from '@2bready/api-client';

export type AuthUser = components['schemas']['UserResource'];

// No TOTP handling here (unlike admin-portal's auth.store.ts) — AuthController::register
// always returns totp_required: false, and this app has no /login page yet either, so
// there's nothing to build that flow for until real login is wired up.
interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,

      setAuth: (user, token) => {
        localStorage.setItem('auth_token', token);
        set({ user, token, isAuthenticated: true });
      },

      clearAuth: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: '2bready-client-auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
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
