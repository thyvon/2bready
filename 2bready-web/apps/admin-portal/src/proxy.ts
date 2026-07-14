import { NextRequest, NextResponse } from 'next/server';

// The only routes reachable without a session. Everything else in this app
// is protected by default (see isPublicPath below) — deny-by-default rather
// than an allow-list of protected prefixes, which is what silently broke the
// moment the admin/* route folders were renamed (removing the shared
// "/admin" prefix those protected-path checks used to key off). Deny-by-
// default means a newly added page under (dashboard)/ is protected
// automatically, with nothing to remember to add here.
const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password', '/verify-email', '/totp'];

// Pages that make no sense to show someone who already holds a fully-authenticated
// session — redirect them to the dashboard instead. No /register here — this app
// is back-office only (admin/staff/finance/auditor); company signup happens in
// client-portal, not here.
const REDIRECT_IF_AUTHENTICATED_PATHS = [
  '/login',
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
  const { pathname, basePath } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;
  // auth_full is set only once 2FA (or a no-2FA login) fully completes — see
  // syncTokenCookie in auth.store.ts. auth_token alone is not enough here: a
  // pending-2FA session already holds a token cookie, and treating that as
  // "authenticated" would bounce it away from /login into a /dashboard it
  // can't actually render (isAuthenticated is still false there), looping.
  const isFullyAuthenticated = request.cookies.get('auth_full')?.value === '1';

  // `new URL(path, request.url)` does NOT reapply `basePath` (production
  // only — see next.config.ts) the way `next/link`/`router.push()` do from
  // client components — middleware sits below that layer. Without manually
  // prepending it here, every redirect below sent a browser to a bare
  // `/login`/`/dashboard` at the domain root, which nginx routes to the
  // marketing site (404), not admin-portal — a real, live production bug
  // (masked day-to-day because normal in-app navigation never hits these
  // redirects, only a direct/refreshed visit to a protected URL while
  // logged out does).
  const redirectTo = (path: string) => NextResponse.redirect(new URL(`${basePath}${path}`, request.url));

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const redirectIfAuthenticated = REDIRECT_IF_AUTHENTICATED_PATHS.some((p) => pathname.startsWith(p));

  // Redirect fully-authenticated users away from auth pages
  if (redirectIfAuthenticated && isFullyAuthenticated) {
    return redirectTo('/dashboard');
  }

  // Redirect unauthenticated users away from every protected page, including
  // the app's own true root — `basePath` is stripped from `pathname` before
  // middleware ever sees it, so a bare visit to the app's basePath in
  // production (or "/" in local dev, where basePath is unset) arrives here
  // as exactly "/", which is protected like any other page under (dashboard)/.
  if (!isPublicPath && !token) {
    return redirectTo('/login');
  }

  return NextResponse.next();
}

export const config = {
  // The bare "/" entry matters on its own: a request for exactly the app's
  // basePath with nothing after it (bare "/admin" in production) doesn't
  // match the catch-all pattern below — Next requires at least a leading
  // "/" in what's left after basePath-stripping, and this case strips to
  // nothing at all — so without this explicit entry the middleware never
  // runs for it and it falls through to a real 404 (no page.tsx at "/").
  matcher: ['/', '/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
