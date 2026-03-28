# Auth0 Integration Guide — AgentVault

## Overview

AgentVault uses three Auth0 features:

1. **Auth0 Universal Login** — user authentication for the dashboard
2. **Auth0 Token Vault** — securely stores and refreshes OAuth tokens for connected services
3. **Auth0 CIBA** — push-based human-in-the-loop approval for write actions

## 1. Auth0 Universal Login (Dashboard Auth)

Standard `@auth0/nextjs-auth0` setup.

### Auth0 Dashboard Config
- Create a "Regular Web Application"
- Allowed Callback URLs: `https://{domain}/api/auth/callback`
- Allowed Logout URLs: `https://{domain}`
- Allowed Web Origins: `https://{domain}`

### Implementation
```typescript
// src/app/api/auth/[...auth0]/route.ts
import { handleAuth } from '@auth0/nextjs-auth0';
export const GET = handleAuth();
```

```typescript
// middleware.ts
import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';
export default withMiddlewareAuthRequired();
export const config = { matcher: ['/dashboard/:path*'] };
```

## 2. Auth0 Token Vault

Token Vault manages OAuth connections to third-party services. We NEVER see or store raw tokens — Auth0 handles encryption, storage, and refresh.

### How It Works
1. User clicks "Connect GitHub" in AgentVault
2. We redirect to Auth0's Token Vault authorization URL
3. User completes GitHub OAuth consent
4. Auth0 stores the GitHub token in the vault
5. When our MCP server needs to call GitHub API:
   - We call Token Vault API with the user's Auth0 ID + connection name
   - Token Vault returns a fresh access token
   - We use it for the API call, then discard it

### Key SDK: `@auth0/ai`

```typescript
import { TokenVault } from '@auth0/ai';

const vault = new TokenVault({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
});

// Get a token for a specific user + service
const token = await vault.getToken({
  userId: 'auth0|user123',
  connection: 'github',    // matches Auth0 connection name
  scopes: ['repo', 'read:org'],
});

// token.access_token — use this for GitHub API calls
```

### Service Connection Setup in Auth0 Dashboard

For each service, create a Token Vault connection:

| Service | Auth0 Connection Name | OAuth Provider | Scopes |
|---|---|---|---|
| GitHub | `github` | GitHub OAuth App | `repo`, `read:org`, `user:email`, `read:discussion` |
| Slack | `slack` | Slack OAuth | `chat:write`, `channels:read`, `users:read`, `reactions:write` |
| Google Workspace | `google-workspace` | Google OAuth | `drive.readonly`, `gmail.send` |
| Jira | `jira` | Atlassian OAuth 2.0 | `read:jira-work`, `write:jira-work` |

### Initiating a Connection (User Flow)

```typescript
// src/app/api/connections/route.ts — POST handler
// Redirect user to Auth0 Token Vault authorization URL
const authUrl = vault.getAuthorizationUrl({
  connection: 'github',
  scopes: ['repo', 'read:org'],
  redirectUri: `${baseUrl}/api/connections/callback`,
  state: JSON.stringify({ service: 'github', userId }),
});
return NextResponse.redirect(authUrl);
```

### Callback Handling

```typescript
// After OAuth consent, Auth0 redirects back
// The token is now stored in the vault — we just record metadata
await kv.set(`connection:${userId}:github`, {
  service: 'github',
  scopes: ['repo', 'read:org'],
  connectedAt: new Date().toISOString(),
});
```

## 3. Auth0 CIBA (Client-Initiated Backchannel Authentication)

CIBA allows AgentVault to send an approval request to the user's device (via Auth0 Guardian app) or email, without the user needing to be on the dashboard.

### How It Works

1. MCP server receives a tool call that requires approval
2. AgentVault sends a CIBA request to Auth0 with context about the action
3. Auth0 delivers the approval prompt to the user:
   - **Guardian push notification** (preferred, real-time)
   - **Email** (fallback)
4. User approves or denies on their device
5. AgentVault polls the CIBA token endpoint (or receives a webhook)
6. Based on the result, executes or rejects the action

### Key SDK: `@auth0/ai`

```typescript
import { CIBA } from '@auth0/ai';

const ciba = new CIBA({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
});

// Initiate an approval request
const cibaResponse = await ciba.initiateRequest({
  loginHint: { sub: 'auth0|user123' },
  bindingMessage: 'AgentVault: DevOps Copilot wants to delete repo "test-prototype-v1"',
  scope: 'openid',
  requestedExpiry: 300, // 5 min timeout
});

// cibaResponse.auth_req_id — use to poll for result

// Poll for result
const result = await ciba.pollForResult({
  authReqId: cibaResponse.auth_req_id,
  interval: cibaResponse.interval || 5,
});

// result.status: 'approved' | 'rejected' | 'expired'
```

### Dual-Path Resolution

The approval request exists in TWO places simultaneously:
1. **CIBA** — user gets a push/email, responds on their device
2. **Dashboard** — request appears in Action Queue, user can approve/reject in UI

Implementation:
- When creating an approval request, store it in Vercel KV with `status: 'pending'`
- Start CIBA polling in the background
- Dashboard `/api/approvals` endpoint allows direct approve/reject
- Whichever resolves first updates the KV record
- Use optimistic locking (check status before updating) to prevent double-resolution

```typescript
// Pseudo-code for dual-path resolution
async function resolveApproval(requestId: string, decision: 'approved' | 'rejected', via: 'dashboard' | 'ciba') {
  const request = await kv.get(`approval:${requestId}`);
  if (request.status !== 'pending') return; // already resolved
  
  await kv.set(`approval:${requestId}`, {
    ...request,
    status: decision,
    resolvedVia: via,
    resolvedAt: new Date().toISOString(),
  });
}
```

### CIBA Webhook (Optional Enhancement)

Instead of polling, Auth0 can call a webhook when the user responds:

```typescript
// src/app/api/webhooks/ciba/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  const { auth_req_id, status } = body;
  
  // Find the approval request by cibaRequestId
  // Resolve it
  await resolveApproval(requestId, status, 'ciba');
  
  return NextResponse.json({ ok: true });
}
```

## Environment Variables

```env
# Auth0 — Universal Login
AUTH0_SECRET=              # openssl rand -hex 32
AUTH0_BASE_URL=            # https://agentvault.vercel.app (or http://localhost:3000)
AUTH0_ISSUER_BASE_URL=     # https://your-tenant.auth0.com
AUTH0_CLIENT_ID=           # from Auth0 dashboard
AUTH0_CLIENT_SECRET=       # from Auth0 dashboard

# Auth0 — Token Vault + CIBA (may use same or different client)
AUTH0_DOMAIN=              # your-tenant.auth0.com
AUTH0_TV_CLIENT_ID=        # Token Vault client ID
AUTH0_TV_CLIENT_SECRET=    # Token Vault client secret

# Vercel KV
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
```

## Auth0 Dashboard Setup Checklist

- [ ] Create Auth0 tenant
- [ ] Create Regular Web Application for dashboard login
- [ ] Enable Token Vault feature
- [ ] Create Token Vault connections: GitHub, Slack, Google Workspace
- [ ] Configure each connection's OAuth app credentials + scopes
- [ ] Enable CIBA grant type on the application
- [ ] Set up Auth0 Guardian for push notifications
- [ ] Configure CIBA webhook URL (optional): `https://agentvault.vercel.app/api/webhooks/ciba`
- [ ] Test: login flow, token vault connection, CIBA push
