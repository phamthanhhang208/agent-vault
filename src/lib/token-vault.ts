/**
 * Auth0 Token Vault Wrapper
 *
 * Manages OAuth token retrieval for connected services.
 * Tokens are stored in Auth0's encrypted vault — we never persist them ourselves.
 *
 * TODO: Phase 2 — implement with @auth0/ai SDK
 */

export interface TokenVaultConfig {
  domain: string;
  clientId: string;
  clientSecret: string;
}

export interface VaultToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

// Map service display names to Auth0 connection identifiers
const CONNECTION_MAP: Record<string, string> = {
  GitHub: 'github',
  Slack: 'slack',
  'Google Workspace': 'google-workspace',
  Jira: 'jira',
};

export function getConnectionName(serviceName: string): string {
  return CONNECTION_MAP[serviceName] ?? serviceName.toLowerCase();
}

export class TokenVault {
  private config: TokenVaultConfig;

  constructor(config: TokenVaultConfig) {
    this.config = config;
  }

  /**
   * Get an OAuth access token for a user's connected service.
   * Auth0 handles refresh automatically if the token is expired.
   */
  async getToken(userId: string, service: string): Promise<VaultToken> {
    const connection = getConnectionName(service);

    // TODO: Implement with @auth0/ai TokenVault SDK
    // const vault = new TokenVault({ ...this.config });
    // return vault.getToken({ userId, connection });

    throw new Error(
      `TokenVault.getToken not yet implemented for ${connection} (userId: ${userId})`
    );
  }

  /**
   * Initiate an OAuth connection flow for a service.
   * Returns a URL the user should be redirected to.
   */
  async getAuthorizationUrl(
    service: string,
    scopes: string[],
    redirectUri: string,
    state: string
  ): Promise<string> {
    const connection = getConnectionName(service);

    // TODO: Implement with @auth0/ai TokenVault SDK
    // return vault.getAuthorizationUrl({ connection, scopes, redirectUri, state });

    throw new Error(
      `TokenVault.getAuthorizationUrl not yet implemented for ${connection}`
    );
  }

  /**
   * Revoke a user's connection to a service.
   */
  async revokeConnection(userId: string, service: string): Promise<void> {
    const connection = getConnectionName(service);

    // TODO: Implement with @auth0/ai SDK
    throw new Error(
      `TokenVault.revokeConnection not yet implemented for ${connection}`
    );
  }
}

// Singleton instance
let tokenVaultInstance: TokenVault | null = null;

export function getTokenVault(): TokenVault {
  if (!tokenVaultInstance) {
    tokenVaultInstance = new TokenVault({
      domain: process.env.AUTH0_DOMAIN!,
      clientId: process.env.AUTH0_TV_CLIENT_ID!,
      clientSecret: process.env.AUTH0_TV_CLIENT_SECRET!,
    });
  }
  return tokenVaultInstance;
}
