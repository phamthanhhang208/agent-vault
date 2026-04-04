/**
 * Auth0 Token Vault Wrapper
 *
 * Manages OAuth token retrieval for connected services via Auth0 Token Vault.
 * Uses the refresh token exchange flow to get external provider access tokens.
 *
 * Token Vault stores & refreshes OAuth tokens — we never persist them ourselves.
 * The flow:
 *   1. User connects a service (GitHub, Slack, etc.) via Auth0 Connected Accounts
 *   2. Auth0 stores the provider's access + refresh tokens in the vault
 *   3. Our app exchanges an Auth0 refresh token for the provider's access token
 *   4. We use the provider token to call their API, then discard it
 */

export interface VaultToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  issued_token_type: string;
}

// Map service display names to Auth0 connection identifiers
const CONNECTION_MAP: Record<string, string> = {
  GitHub: 'github',
  Slack: 'slack',
  'Google Workspace': 'google-oauth2',
  Jira: 'jira',
};

// Map service names to required OAuth scopes
const SERVICE_SCOPES: Record<string, string[]> = {
  GitHub: ['repo', 'read:org', 'user:email', 'read:discussion'],
  Slack: ['chat:write', 'channels:read', 'users:read', 'reactions:write'],
  'Google Workspace': [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/calendar',
  ],
  Jira: ['read:jira-work', 'write:jira-work'],
};

export function getConnectionName(serviceName: string): string {
  return CONNECTION_MAP[serviceName] ?? serviceName.toLowerCase();
}

export function getServiceScopes(serviceName: string): string[] {
  return SERVICE_SCOPES[serviceName] ?? [];
}

/**
 * Exchange an Auth0 refresh token for an external provider's access token
 * via the Token Vault refresh token exchange grant.
 *
 * @see https://auth0.com/docs/secure/tokens/token-vault/refresh-token-exchange-with-token-vault
 */
export async function exchangeTokenVault(
  refreshToken: string,
  connection: string,
  loginHint?: string
): Promise<VaultToken> {
  const domain = process.env.AUTH0_ISSUER_BASE_URL || `https://${process.env.AUTH0_DOMAIN}`;
  const clientId = process.env.AUTH0_CLIENT_ID!;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET!;

  const body: Record<string, string> = {
    client_id: clientId,
    client_secret: clientSecret,
    subject_token: refreshToken,
    grant_type:
      'urn:auth0:params:oauth:grant-type:token-exchange:federated-connection-access-token',
    subject_token_type: 'urn:ietf:params:oauth:token-type:refresh_token',
    requested_token_type:
      'http://auth0.com/oauth/token-type/federated-connection-access-token',
    connection,
  };

  if (loginHint) {
    body.login_hint = loginHint;
  }

  const response = await fetch(`${domain}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'unknown' }));
    throw new Error(
      `Token Vault exchange failed for ${connection}: ${error.error_description || error.error || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Get the Connected Accounts authorization URL.
 * Redirects the user to Auth0's Connected Accounts flow to link an external service.
 *
 * Uses the My Account API endpoint which handles the OAuth consent flow
 * with the external provider and stores the resulting tokens in the vault.
 */
export function getConnectUrl(
  service: string,
  redirectUri: string,
  state: string
): string {
  const domain = process.env.AUTH0_ISSUER_BASE_URL || `https://${process.env.AUTH0_DOMAIN}`;
  const connection = getConnectionName(service);
  const scopes = getServiceScopes(service);

  const params = new URLSearchParams({
    connection,
    connection_scope: scopes.join(' '),
    redirect_uri: redirectUri,
    state,
  });

  // Connected Accounts flow via Auth0 My Account API
  // Requires the user to be authenticated first (session cookie)
  const clientId = process.env.AUTH0_CLIENT_ID || '';
  
  const authorizeParams = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'openid profile email offline_access',
    connection,
    connection_scope: scopes.join(' '),
    state,
    access_type: 'link',
  });
  
  return `${domain}/authorize?${authorizeParams.toString()}`;
}

/**
 * Get a provider access token for a specific user and service.
 * This is the main function called by MCP tool handlers.
 *
 * @param refreshToken - The user's Auth0 refresh token (from session)
 * @param service - Service display name (e.g. 'GitHub', 'Slack')
 */
export async function getServiceToken(
  refreshToken: string,
  service: string
): Promise<string> {
  const connection = getConnectionName(service);
  const result = await exchangeTokenVault(refreshToken, connection);
  return result.access_token;
}
