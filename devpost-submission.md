## Inspiration

We kept running into the same problem: AI agents are getting real capabilities — reading emails, pushing code, sending messages — but there's no standard way to control what they're actually allowed to do. You either hand over a raw API token with full access, or you give the agent nothing.

The moment that crystallized the idea was watching Auth0's Token Vault documentation. It already solves the hard part — OAuth token management, encrypted storage, automatic refresh. But nobody was exposing it at the protocol level for AI agents. And then MCP (Model Context Protocol) clicked — it's the universal interface that every agent speaks. What if Token Vault + MCP could create a permission layer that works with *any* agent?

That's AgentVault: Auth0 handles the tokens, MCP handles the protocol, and we handle the permissions in between.

## What it does

AgentVault lets you create permission-controlled "vaults" for your AI agents. Here's the flow:

1. **Connect services** — Link your GitHub, Google Workspace, Slack, or Jira through Auth0 Token Vault. One OAuth click per service. Auth0 stores and refreshes tokens — you never see raw credentials.

2. **Create a vault** — Each vault is a permission profile for one agent. Pick which services the agent can access, and for each action choose: **Allow** (auto-execute), **Require Approval** (CIBA push notification), or **Block** (tool is invisible to the agent).

3. **Get an MCP URL** — Each vault generates a unique MCP server URL + bearer token. Drop it into Claude Code, Cursor, OpenClaw, or any MCP-compatible agent.

4. **Agent works within bounds** — The agent discovers only the tools you permitted. Blocked tools don't appear at all — the agent can't even hallucinate using them. Write actions pause and wait for your approval via Auth0 Guardian push notification on your phone.

5. **Full audit trail** — Every tool call is logged: timestamp, agent, service, action, outcome (auto-executed, approved, denied, blocked).

The key concept is **multi-vault**: one user can have multiple agents with different permission sets. Your personal assistant gets broad access. Your work coding agent gets scoped access. A public bot gets read-only. Revoke one vault without affecting others.

## How we built it

**MCP Server** — The core is a dynamic MCP server built with `@modelcontextprotocol/sdk`. Each request is stateless (serverless-compatible): bearer token → KV lookup → load agent config → register only permitted tools → handle the JSON-RPC call. We use `WebStandardStreamableHTTPServerTransport` for Next.js App Router compatibility, with a custom stream-piping solution to keep the transport alive until the response body is consumed.

**Auth0 Integration** — Three Auth0 features working together:
- **Universal Login** (`@auth0/nextjs-auth0` v4) — user authentication for the dashboard
- **Token Vault** — stores OAuth tokens for GitHub, Google, Slack. When an agent calls a tool, we exchange the user's Auth0 refresh token for a fresh provider access token, use it, then discard it
- **CIBA** (`@auth0/ai`) — when a write action is detected, we send a backchannel auth request to Auth0, which delivers a push notification via Guardian. The MCP call blocks until the user approves or denies

**Policy Engine** — Maps agent policies to MCP tool visibility. "Allow" tools are registered normally. "Approval" tools are registered with a wrapper that triggers CIBA before execution. "Block" tools are simply not registered — invisible at the protocol level.

**Dashboard** — Next.js 15 App Router with Tailwind. Vault connections, agent creation wizard (3-step: identity → services → policy matrix), action queue with approve/deny, and audit log with export. All state in Vercel KV (Upstash Redis).

**Tech stack:** Next.js 15, TypeScript, @auth0/nextjs-auth0, @auth0/ai, @modelcontextprotocol/sdk, Vercel KV, Tailwind CSS, deployed on Vercel.

## Challenges we ran into

**MCP streaming in Next.js serverless** — The biggest technical challenge. Our MCP server returned SSE (Server-Sent Events) responses, but the response body was empty. After hours of debugging, we found the root cause: our `finally` block was calling `transport.close()` before the response stream was consumed. The fix was piping the response through a `TransformStream` and only closing the transport after the stream finishes. Sounds simple in hindsight — took a full day to figure out.

**Auth0 v4 migration** — The `@auth0/nextjs-auth0` v4 SDK changed the API significantly. `initAuth0()` became `new Auth0Client()`, routes moved from `/api/auth/*` to `/auth/*`, and middleware patterns changed entirely. Auth0's docs were helpful but we still hit edge cases — like the `Initiate Login URI` field requiring HTTPS even for localhost, and social connections needing both "Authentication" and "Token Vault" toggled on separately.

**CIBA availability** — CIBA requires an Auth0 Enterprise plan or add-on. We built a dual-path approval system: CIBA for push notifications when available, with a dashboard-only fallback that works on any plan. The approval request exists in both places simultaneously — whichever resolves first wins.

**Token Vault scope mapping** — Token Vault stores OAuth tokens with scopes, but there's no built-in way to map scopes to human-readable actions. "The `repo` scope means the agent can read files, create branches, push code, and delete repos" — we had to build that mapping layer ourselves.

## Accomplishments that we're proud of

**The blocked tool pattern.** When a tool is blocked in the policy, it's not "access denied" — it doesn't exist in the MCP tool list at all. The agent can't hallucinate using a tool it doesn't know about. This is a fundamentally better security model than deny-after-the-fact.

**Multi-vault architecture.** One Auth0 identity, multiple permission profiles, each generating a unique MCP endpoint. This lets you give different agents different trust levels from the same set of service connections. We haven't seen this pattern anywhere else.

**The streaming fix.** Getting SSE responses to work in Next.js App Router serverless functions with the MCP SDK was non-trivial. The `TransformStream` pipe solution is clean and reusable — we think other teams building MCP servers on Next.js will hit the same issue.

**Dual-path CIBA approval.** The approval request lives in both Auth0 Guardian (push notification) and the dashboard (Action Queue) simultaneously. No double-resolution, no race conditions. Whichever the user responds to first resolves the request.

## What we learned

**Auth0 Token Vault + MCP is a natural combination.** MCP tool calls are synchronous from the agent's perspective — call a tool, get a response. CIBA slots perfectly into this: the tool call just takes longer while the user approves. No agent-side changes needed. This pattern should be a documented recipe in Auth0's developer resources.

**Permission management for agents is an unsolved space.** RBAC exists for users. OAuth scopes exist for apps. But "what can this AI agent do on my behalf" doesn't have a standard solution yet. AgentVault is our take on it, but the industry needs a proper standard.

**The gap between "demo" and "works with real OAuth"** is significant. Mocking OAuth flows for development is easy. Actually configuring Google Cloud consent screens, Auth0 social connections with Token Vault enabled, and CIBA notification channels — each has a 5-step setup with subtle requirements (Offline Access must be checked, connections need both Authentication AND Token Vault toggled, authorized redirect URIs must match exactly).

## What's next for AgentVault

**More services** — Auth0 Token Vault supports 25+ OAuth integrations. We've built GitHub, Google Workspace, and Slack. Adding Salesforce, Jira, Stripe, and Figma is straightforward — the architecture is service-agnostic.

**Rate limiting enforcement** — Currently display-only. Real per-vault rate limiting with sliding windows would prevent runaway agents from burning through API quotas.

**Webhook-based approval** — Instead of polling for CIBA results, use Auth0's webhook callback for instant resolution. Lower latency, fewer API calls.

**Shareable vault templates** — Export a vault's policy config as a shareable JSON template. "Here's my DevOps agent policy — import it and connect your own services."

**SDK / npm package** — `npx agentvault init` to scaffold a new vault, configure Auth0, and get an MCP URL in under 2 minutes.

**Production deployment** — Custom domains, encrypted vault tokens, SOC2-relevant audit log retention, and multi-tenant support for teams.
