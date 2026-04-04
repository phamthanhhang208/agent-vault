/**
 * Auth0 CIBA (Client-Initiated Backchannel Authentication)
 *
 * Sends approval requests to the user's device via Auth0 Guardian push
 * or email. Used for human-in-the-loop approval of write actions.
 *
 * Flow:
 * 1. Agent calls a write tool → MCP server detects 'approval' policy
 * 2. We call Auth0 CIBA endpoint to send a push notification
 * 3. User approves/rejects via Guardian app (or email fallback)
 * 4. We poll the CIBA token endpoint for the result
 * 5. Meanwhile, user can also approve via the dashboard (dual-path)
 */

export interface CIBAInitiateResponse {
  auth_req_id: string;
  expires_in: number;
  interval: number;
}

export type CIBAStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface CIBAResult {
  status: CIBAStatus;
  auth_req_id: string;
}

/**
 * Initiate a CIBA approval request via Auth0.
 * Sends a push notification to the user via Guardian.
 */
export async function initiateCIBA(
  userId: string,
  bindingMessage: string,
  expirySeconds = 300
): Promise<CIBAInitiateResponse> {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_TV_CLIENT_ID || process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_TV_CLIENT_SECRET || process.env.AUTH0_CLIENT_SECRET;

  if (!domain || !clientId || !clientSecret) {
    throw new Error('Auth0 CIBA configuration missing');
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    login_hint: JSON.stringify({ format: 'iss_sub', iss: `https://${domain}/`, sub: userId }),
    binding_message: bindingMessage,
    scope: 'openid',
    requested_expiry: String(expirySeconds),
  });

  const response = await fetch(`https://${domain}/bc-authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'unknown' }));
    console.error('[CIBA] Initiation failed:', error);
    throw new Error(`CIBA initiation failed: ${error.error_description || error.error || response.statusText}`);
  }

  return response.json();
}

/**
 * Poll Auth0 for the result of a CIBA request.
 */
export async function pollCIBA(authReqId: string): Promise<CIBAResult> {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_TV_CLIENT_ID || process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_TV_CLIENT_SECRET || process.env.AUTH0_CLIENT_SECRET;

  const response = await fetch(`https://${domain}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      auth_req_id: authReqId,
      grant_type: 'urn:openid:params:grant-type:ciba',
    }).toString(),
  });

  if (response.ok) {
    return { status: 'approved', auth_req_id: authReqId };
  }

  const error = await response.json().catch(() => ({ error: 'unknown' }));

  if (error.error === 'authorization_pending') {
    return { status: 'pending', auth_req_id: authReqId };
  }

  if (error.error === 'slow_down') {
    return { status: 'pending', auth_req_id: authReqId };
  }

  if (error.error === 'expired_token') {
    return { status: 'expired', auth_req_id: authReqId };
  }

  if (error.error === 'access_denied') {
    return { status: 'rejected', auth_req_id: authReqId };
  }

  console.error('[CIBA] Poll error:', error);
  return { status: 'rejected', auth_req_id: authReqId };
}

/**
 * Wait for a CIBA request to be resolved.
 * Polls at the specified interval, up to maxAttempts.
 * Returns early if resolved via dashboard (checked via callback).
 */
export async function waitForCIBA(
  authReqId: string,
  checkDashboardResolution: () => Promise<CIBAStatus | null>,
  interval = 5,
  maxAttempts = 60
): Promise<CIBAResult> {
  for (let i = 0; i < maxAttempts; i++) {
    // Check dashboard resolution first (faster path)
    const dashboardStatus = await checkDashboardResolution();
    if (dashboardStatus && dashboardStatus !== 'pending') {
      return { status: dashboardStatus, auth_req_id: authReqId };
    }

    // Poll CIBA
    const result = await pollCIBA(authReqId);
    if (result.status !== 'pending') {
      return result;
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, interval * 1000));
  }

  return { status: 'expired', auth_req_id: authReqId };
}
