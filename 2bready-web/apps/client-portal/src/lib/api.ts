import { createApiClient } from '@2bready/api-client';
import { useAuthStore } from '@/store/auth.store';

// First real API wiring in this app (previously fully mock/UI-only). No redirect
// on 401 the way admin-portal's onUnauthorized does — there's no /login page here
// yet to send the user back to, so clearing the stale session locally is all that's
// honestly possible right now.
const api = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api/v1',
  getToken: () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null),
  onUnauthorized: () => {
    useAuthStore.getState().clearAuth();
  },
});

export default api;
