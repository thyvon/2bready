import { createApiClient } from '@2bready/api-client';
import { useAuthStore } from '@/store/auth.store';

const api = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api/v1',
  getToken: () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null),
  onUnauthorized: () => {
    if (typeof window !== 'undefined') {
      // Must clear the full persisted auth state (Zustand store + auth_token cookie),
      // not just the localStorage token — otherwise proxy.ts still sees a valid-looking
      // cookie and keeps letting the stale session back into /dashboard, which 401s
      // again on the next request. That mismatch is what produced a stuck/blank
      // dashboard for sessions that went bad after a deploy.
      useAuthStore.getState().clearAuth();
      // Raw window.location assignments aren't basePath-aware the way
      // next/link is — now that production mounts this app at /admin (see
      // next.config.ts), a bare '/login' would send the browser to the
      // root domain (marketing) instead of back into this app.
      window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/login`;
    }
  },
});

export default api;
