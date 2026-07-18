import { createApiClient } from '@2bready/api-client';
import { useAuthStore } from '@/store/auth.store';

// Docker/production supplies NEXT_PUBLIC_API_URL.  Local client development
// runs separately from Laravel, so use its standard local address when no
// browser-visible API URL has been configured yet. Without this fallback the
// browser tries to post to `undefined/api/v1/...`, which makes sign-up appear
// to do nothing.
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

// First real API wiring in this app (previously fully mock/UI-only). No redirect
// on 401 the way admin-portal's onUnauthorized does — there's no /login page here
// yet to send the user back to, so clearing the stale session locally is all that's
// honestly possible right now.
const api = createApiClient({
  baseURL: `${apiUrl}/api/v1`,
  // Prefixed, not the bare 'auth_token' this used to be — production serves
  // this app and admin-portal from the same domain (path-mounted, see the
  // deploy playbook), so they share one localStorage. Both apps used to read
  // their bearer token from that identical plain key, so logging into one
  // app silently overwrote the token the other app's next API call read.
  getToken: () => (typeof window !== 'undefined' ? localStorage.getItem('client_auth_token') : null),
  onUnauthorized: () => {
    useAuthStore.getState().clearAuth();
  },
});

export default api;
