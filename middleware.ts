import type { NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function middleware(request: NextRequest) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    // Auth0 v4 requires middleware on auth routes + protected routes
    '/auth/:path*',
    '/api/auth/:path*',
    '/dashboard/:path*',
  ],
};
