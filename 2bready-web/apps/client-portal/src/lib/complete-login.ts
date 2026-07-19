import type { LoginResult } from '@/lib/auth-api';
import type { useAuthStore } from '@/store/auth.store';

interface MinimalRouter {
  push: (href: string) => void;
  replace: (href: string) => void;
}

type AuthActions = Pick<ReturnType<typeof useAuthStore.getState>, 'setAuth' | 'setPendingTotp'>;

// Shared by the password-login submit handler and the Google OAuth callback
// bridge page — both end up with the exact same LoginResult shape (2FA
// enforcement is identical either way, see the backend's IssueAuthTokenAction),
// so both should route through it identically too.
export function completeLogin(res: LoginResult, router: MinimalRouter, { setAuth, setPendingTotp }: AuthActions): void {
  if (!res.totp_required) {
    setAuth(res.user, res.token);
    router.push(res.user.current_company_id ? '/' : '/onboarding');
    return;
  }

  if (!res.totp_confirmed) {
    setPendingTotp(res.user, res.token, 'setup_required');
    router.replace('/totp/setup');
  } else {
    setPendingTotp(res.user, res.token, 'challenge');
    router.replace('/totp/challenge');
  }
}
