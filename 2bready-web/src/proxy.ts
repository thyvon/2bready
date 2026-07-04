import { NextRequest, NextResponse } from 'next/server';

// Pages that make no sense to show someone who already holds a fully-authenticated
// session — redirect them to the dashboard instead.
const REDIRECT_IF_AUTHENTICATED_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

// The TOTP continuation pages (/totp/setup, /totp/challenge) are deliberately NOT
// in REDIRECT_IF_AUTHENTICATED_PATHS: the auth_token cookie is already set the
// moment login issues a pending-2FA token (see auth.store.ts setPendingTotp),
// before 2FA is actually completed. Treating "has a token" as "fully
// authenticated" here would bounce a mid-setup user away from the only pages
// that let them finish logging in, trapping them in a redirect loop.

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  const redirectIfAuthenticated = REDIRECT_IF_AUTHENTICATED_PATHS.some((p) => pathname.startsWith(p));
  const isDashboard = ['/dashboard', '/admin', '/auditor', '/company'].some((p) => pathname.startsWith(p));

  // Redirect fully-authenticated users away from auth pages
  if (redirectIfAuthenticated && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users away from protected pages
  if (isDashboard && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
