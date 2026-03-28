/**
 * Auth0 CIBA (Client-Initiated Backchannel Authentication)
 *
 * Sends approval requests to the user's device via Auth0 Guardian push
 * or email. Used for human-in-the-loop approval of write actions.
 *
 * TODO: Phase 5 — implement with @auth0/ai SDK
 */

export interface CIBAConfig {
  domain: string;
  clientId: string;
  clientSecret: string;
}

export interface CIBAInitiateResponse {
  auth_req_id: string;
  expires_in: number;
  interval: number;  // polling interval in seconds
}

export type CIBAStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface CIBAResult {
  status: CIBAStatus;
  auth_req_id: string;
}

export class CIBAClient {
  private config: CIBAConfig;

  constructor(config: CIBAConfig) {
    this.config = config;
  }

  /**
   * Initiate a CIBA approval request.
   * Sends a push notification to the user via Auth0 Guardian.
   *
   * @param userId - Auth0 user ID (sub claim)
   * @param bindingMessage - Human-readable description shown on the approval prompt
   * @param expirySeconds - How long to wait before timing out (default: 300 = 5 min)
   */
  async initiateRequest(
    userId: string,
    bindingMessage: string,
    expirySeconds = 300
  ): Promise<CIBAInitiateResponse> {
    // TODO: Implement with @auth0/ai CIBA SDK
    // const ciba = new CIBA({ ...this.config });
    // return ciba.initiateRequest({
    //   loginHint: { sub: userId },
    //   bindingMessage,
    //   scope: 'openid',
    //   requestedExpiry: expirySeconds,
    // });

    throw new Error('CIBAClient.initiateRequest not yet implemented');
  }

  /**
   * Poll Auth0 for the result of a CIBA request.
   * Respects the interval returned by initiateRequest.
   *
   * @param authReqId - The auth_req_id from initiateRequest
   * @param interval - Polling interval in seconds
   * @param maxAttempts - Maximum number of poll attempts before giving up
   */
  async pollForResult(
    authReqId: string,
    interval = 5,
    maxAttempts = 60
  ): Promise<CIBAResult> {
    // TODO: Implement with @auth0/ai CIBA SDK
    // Polls the CIBA token endpoint every `interval` seconds
    // Returns when user approves, rejects, or timeout expires

    throw new Error('CIBAClient.pollForResult not yet implemented');
  }
}

// Singleton instance
let cibaInstance: CIBAClient | null = null;

export function getCIBAClient(): CIBAClient {
  if (!cibaInstance) {
    cibaInstance = new CIBAClient({
      domain: process.env.AUTH0_DOMAIN!,
      clientId: process.env.AUTH0_TV_CLIENT_ID!,
      clientSecret: process.env.AUTH0_TV_CLIENT_SECRET!,
    });
  }
  return cibaInstance;
}
