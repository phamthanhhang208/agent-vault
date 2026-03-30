import { Auth0Client } from '@auth0/nextjs-auth0/server';

// Server-side Auth0 client (v4 API)
export const auth0 = new Auth0Client({
  appBaseUrl: process.env.AUTH0_BASE_URL || 'http://localhost:3000',
  secret: process.env.AUTH0_SECRET,
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  authorizationParameters: {
    scope: 'openid profile email offline_access',
    audience: process.env.AUTH0_AUDIENCE,
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

// Helper to get the user's refresh token for Token Vault exchanges
export async function getRefreshToken(): Promise<string | null> {
  try {
    const session = await auth0.getSession();
    // In v4, the session object contains tokenSet with refreshToken
    return (session as Record<string, unknown>)?.refreshToken as string ?? null;
  } catch {
    return null;
  }
}
