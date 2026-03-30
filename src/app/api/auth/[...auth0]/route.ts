/**
 * Auth0 v4 handles all auth routes via middleware.
 * The middleware intercepts /auth/login, /auth/callback, /auth/logout, /auth/profile.
 *
 * This file is kept as a placeholder. If you need custom auth behavior,
 * configure it via Auth0Client options in src/lib/auth0.ts.
 */

import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json(
    { error: 'Auth is handled by middleware. Use /auth/login, /auth/callback, /auth/logout.' },
    { status: 404 }
  );
}
