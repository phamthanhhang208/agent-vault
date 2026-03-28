import { initAuth0 } from '@auth0/nextjs-auth0';

// Server-side Auth0 instance
// Used in API routes and server components
export const auth0 = initAuth0({
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  routes: {
    callback: '/api/auth/callback',
    postLogoutRedirect: '/',
  },
});

// Helper to get the current user's Auth0 ID from session
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const session = await auth0.getSession();
    return session?.user?.sub ?? null;
  } catch {
    return null;
  }
}
