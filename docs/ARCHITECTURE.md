# Architecture — AgentVault

## System Overview

AgentVault is a middleware layer between AI agents and third-party APIs. It provides:

1. **Token management** via Auth0 Token Vault (OAuth tokens stored securely, never exposed to agents)
2. **Permission gating** via a policy engine (per-action allow/approval/block)
3. **MCP server generation** per agent (dynamic tool lists based on permissions)
4. **Human-in-the-loop approval** via Auth0 CIBA + dashboard dual-path
5. **Audit logging** of every tool invocation

## Request Flow (Happy Path)

```
1. User configures AgentVault:
   - Connects services (GitHub, Slack, etc.) via Auth0 OAuth
   - Creates an "Agent" with a name + selected services
   - Sets per-action policies (allow / require-approval / block)
   - Gets an MCP server URL: https://agentvault.vercel.app/mcp/{serverId}

2. Agent connects via MCP Streamable HTTP:
   - MCP client (Claude Code, Cursor, etc.) sends HTTP request to the URL
   - AgentVault validates the bearer token / vault token
   - Returns tool list = only the actions marked "allow" or "approval"
   - Blocked actions are never exposed as tools
   - If context injection is set, exposes it as a `system_prompt` resource (advisory only)

3. Agent calls a tool:
   a. If policy = "allow":
      - AgentVault fetches the service token from Auth0 Token Vault
      - Executes the API call (e.g., GitHub repos.read)
      - Returns result to agent
      - Logs to audit trail

   b. If policy = "require-approval":
      - AgentVault creates a pending approval request
      - TWO parallel notification paths:
        → Auth0 CIBA: sends push via Guardian app / email to user
        → Dashboard: request appears in Action Queue with full context
      - Whichever path the user responds to first resolves the request
      - If approved: execute + return result to agent
      - If rejected: return error to agent
      - Logs decision + approval method to audit trail

   c. If policy = "block":
      - Tool is not listed in MCP tool list, so agent never sees it
      - If somehow called directly via raw HTTP: returns 403 + logs attempt
```

## Approval Dual-Path Detail

```
Agent calls write action
        │
        ▼
┌─────────────────────┐
│  Create Pending      │
│  Approval Request    │
└─────┬───────┬───────┘
      │       │
      ▼       ▼
 ┌────────┐ ┌──────────────┐
 │ CIBA   │ │ Dashboard    │
 │ Push / │ │ Action Queue │
 │ Email  │ │ (real-time)  │
 └───┬────┘ └──────┬───────┘
     │             │
     └──────┬──────┘
            │ (first response wins)
            ▼
    ┌───────────────┐
    │ Execute or    │
    │ Reject action │
    └───────────────┘
```

The dashboard UI shows: "Awaiting your approval — check your Auth0 Guardian app or approve below."

## Data Model (Vercel KV)

### User Config
```
key: user:{auth0UserId}
value: {
  id: string
  email: string
  createdAt: string
}
```

### Vault Connection
```
key: connection:{userId}:{service}
value: {
  service: 'github' | 'slack' | 'google' | 'jira'
  auth0ConnectionId: string   // Auth0 Token Vault connection reference
  scopes: string[]
  connectedAt: string
  lastUsed: string
}
```

### Agent
```
key: agent:{agentId}
value: {
  id: string
  userId: string
  name: string
  description: string
  serverId: string             // unique slug for MCP URL path
  status: 'active' | 'paused'
  rateLimit: number            // display-only for v1 (not enforced)
  contextInjection: string     // advisory system prompt resource
  policies: Policy[]
  createdAt: string
}
```

### Policy (embedded in Agent)
```typescript
type PolicyState = 'allow' | 'approval' | 'block';

interface PolicyRule {
  action: string;       // e.g. 'repos.read', 'chat.write', 'gmail.send'
  state: PolicyState;
}

interface Policy {
  service: string;      // e.g. 'GitHub', 'Slack', 'Google Workspace'
  rules: PolicyRule[];
}
```

### Approval Request
```
key: approval:{requestId}
value: {
  id: string
  agentId: string
  userId: string
  service: string
  action: string
  detail: string             // human-readable description
  intent: string             // agent's stated reasoning
  payload: object            // the raw API call payload
  risk: 'Low' | 'Medium' | 'High'
  status: 'pending' | 'approved' | 'rejected'
  resolvedVia: 'dashboard' | 'ciba' | null
  cibaRequestId: string      // Auth0 CIBA request ID for correlation
  createdAt: string
  resolvedAt: string | null
}
```

### Audit Log Entry
```
key: audit:{userId}:{timestamp}:{requestId}
value: {
  id: string
  agentId: string
  agentName: string
  service: string
  action: string
  detail: string
  risk: 'Low' | 'Medium' | 'High'
  status: 'executed' | 'approved' | 'rejected' | 'blocked'
  resolvedVia: 'auto' | 'dashboard' | 'ciba' | null
  executionMs: number
  timestamp: string
}
```

## MCP Server Implementation

Each agent gets a unique HTTPS endpoint:
```
https://agentvault.vercel.app/mcp/{serverId}
```

This is a Next.js API route that:
1. Validates the bearer token (maps to a userId + agentId)
2. Loads the agent's policy config from Vercel KV
3. Creates an MCP server instance with `@modelcontextprotocol/sdk`
4. Dynamically registers tools based on policies:
   - `allow` actions → tool is listed, executes immediately on call
   - `approval` actions → tool is listed, triggers CIBA + dashboard queue on call
   - `block` actions → tool is NOT listed
5. If `contextInjection` is set, registers a `system_prompt` resource (read-only)
6. Handles the MCP Streamable HTTP transport (POST for requests, GET with SSE for streaming)

### Tool Naming Convention
Tools are named `{service}_{action}`, e.g.:
- `github_repos_read`
- `github_repos_write`
- `slack_chat_read`
- `slack_chat_write`
- `google_drive_read`
- `google_gmail_send`

### Token Flow
When a tool executes:
1. AgentVault calls Auth0 Token Vault API to get the user's OAuth token for that service
2. Uses the token to call the third-party API (GitHub, Slack, etc.)
3. Returns the API response as the tool result
4. The OAuth token is NEVER sent to the MCP client / agent

## Auth0 Integration Points

| Feature | Auth0 Product | Purpose |
|---|---|---|
| User login | Auth0 Universal Login | Dashboard authentication |
| Service connections | Auth0 Token Vault | Store + retrieve OAuth tokens for GitHub/Slack/etc |
| Write approval | Auth0 CIBA | Push notification for human-in-the-loop |
| Token refresh | Auth0 Token Vault | Automatic refresh of expired service tokens |

## Deployment (Vercel)

- Next.js app deployed as Vercel project
- API routes handle both dashboard API + MCP endpoints
- Vercel KV for all persistent storage
- Environment variables for Auth0 configuration
- No separate backend service needed — everything runs as serverless functions
