import { NextResponse } from 'next/server';
import { setJson } from '@/lib/kv';
import { getConnectionName, getServiceScopes } from '@/lib/token-vault';
import type { VaultConnection, ServiceName } from '@/types';

/**
 * GET /api/connections/callback
 *
 * Auth0 Connected Accounts redirects back here after the user
 * authorizes a service. The token is stored in Auth0's Token Vault;
 * we just record metadata about the connection in Vercel KV.
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const stateParam = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      const errorDesc = url.searchParams.get('error_description') || 'Connection was denied';
      console.error('[Connections Callback] Error:', error, errorDesc);
      const redirectUrl = new URL('/dashboard/connections', process.env.AUTH0_BASE_URL || 'http://localhost:3000');
      redirectUrl.searchParams.set('error', errorDesc);
      return NextResponse.redirect(redirectUrl.toString());
    }

    if (!stateParam) {
      return NextResponse.redirect(
        new URL('/dashboard/connections?error=Missing+state', process.env.AUTH0_BASE_URL || 'http://localhost:3000').toString()
      );
    }

    // Decode state
    const { service, userId } = JSON.parse(
      Buffer.from(stateParam, 'base64url').toString()
    ) as { service: ServiceName; userId: string };

    const connectionName = getConnectionName(service);
    const scopes = getServiceScopes(service);

    // Store connection metadata in Vercel KV
    // The actual OAuth token is stored by Auth0 in Token Vault — we never see it
    const connection: VaultConnection = {
      service,
      auth0ConnectionId: connectionName,
      scopes,
      connectedAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };

    await setJson(`connection:${userId}:${connectionName}`, connection);

    // Redirect back to connections page with success
    const redirectUrl = new URL('/dashboard/connections', process.env.AUTH0_BASE_URL || 'http://localhost:3000');
    redirectUrl.searchParams.set('connected', service);
    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('[Connections Callback]', error);
    return NextResponse.redirect(
      new URL('/dashboard/connections?error=Connection+failed', process.env.AUTH0_BASE_URL || 'http://localhost:3000').toString()
    );
  }
}
