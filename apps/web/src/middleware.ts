import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTES } from '@/constants/app.constants';

/**
 * Middleware checks the presence (not validity) of the `has_session` cookie for /dashboard routes.
 *
 * WHY has_session INSTEAD OF refreshToken:
 * The backend sets the real `refreshToken` cookie scoped strictly to `Path=/auth` for defense-in-depth,
 * making it invisible to browsers on `/dashboard` or any non-/auth routes. The backend therefore also
 * sets a companion `has_session` presence-signal cookie scoped to `Path=/`.
 *
 * NOTE: This is a UX heuristic only, not a security boundary — the API's guards
 * and token verifications are the real enforcement. This check avoids rendering
 * protected UI shells for unauthenticated visitors before client hydration kicks in.
 */
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.get('has_session');

  if (!hasSession?.value) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/superadmin/:path*'],
};
