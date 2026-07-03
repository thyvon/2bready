import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/totp/setup',
  '/totp/challenge',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isDashboard = ['/dashboard', '/admin', '/auditor', '/company'].some((p) => pathname.startsWith(p));

  // Redirect authenticated users away from auth pages
  if (isPublic && token) {
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
