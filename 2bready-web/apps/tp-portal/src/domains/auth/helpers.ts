import type { LoginResponse, User } from './types';

interface AuthActions {
  setAuth: (user: User, token: string) => void;
  setPendingTotp: (user: User, token: string, flow: 'setup_required' | 'challenge') => void;
}

interface MinimalRouter {
  replace: (href: string) => void;
}

// Shared login-completion logic — a fresh login always returns the same
// LoginResponse shape (2FA enforcement, see the backend's
// IssueAuthTokenAction), so every entry point routes through it identically.
export function completeLogin(res: LoginResponse, router: MinimalRouter, { setAuth, setPendingTotp }: AuthActions): void {
  if (!res.totp_required) {
    setAuth(res.user, res.token);
    router.replace('/dashboard');
    return;
  }

  const totpConfirmed = 'totp_confirmed' in res ? res.totp_confirmed : false;

  if (!totpConfirmed) {
    setPendingTotp(res.user, res.token, 'setup_required');
    router.replace('/totp/setup');
  } else {
    setPendingTotp(res.user, res.token, 'challenge');
    router.replace('/totp/challenge');
  }
}
