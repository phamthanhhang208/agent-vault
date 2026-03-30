# Devpost Submission — AgentVault

## Project Name
AgentVault — Auth0-Powered Permission Vaults for AI Agents

## Tagline
Connect once, control everything, plug into any agent.

## Inspiration
AI agents are getting incredibly powerful — they can read emails, push code, send Slack messages, and manage cloud infrastructure. But today, giving an agent access to a service means giving it *full* access. There's no standard way to say "you can read my GitHub repos but need my approval before creating issues."

We wanted to build the missing permission layer — one that works with *any* AI agent, not just a specific one.

## What it does
AgentVault is a middleware layer that sits between AI agents and third-party APIs. Users connect their services (GitHub, Slack, Google Workspace) via Auth0 Token Vault, then create "agents" with granular per-action permissions:

- **Allow** — the agent can use this tool freely
- **Require Approval** — the agent pauses and waits for human approval (via Auth0 Guardian push or dashboard)
- **Block** — the tool doesn't even appear to the agent

Each agent gets a unique MCP (Model Context Protocol) server URL. Paste it into Claude Code, Cursor, OpenClaw, or any MCP client — and the agent discovers only the tools you've permitted.

Every single tool call is logged in an immutable audit trail. Full transparency.

## How we built it
- **Frontend:** Next.js 15 (App Router) + Tailwind CSS for the dashboard and landing page
- **Auth:** @auth0/nextjs-auth0 v4 for user login, Auth0 Token Vault for securely storing service OAuth tokens
- **Approval:** Auth0 CIBA (Client-Initiated Backchannel Authentication) sends push notifications via Guardian. Dual-path resolution — user can approve from their phone OR the dashboard, whichever is faster.
- **MCP Server:** @modelcontextprotocol/sdk with WebStandardStreamableHTTPServerTransport — runs on Vercel serverless, dynamically generates tools based on the user's policy config
- **Storage:** Vercel KV (Redis) for agent configs, approval requests, and audit logs
- **Tool Execution:** Real API calls to GitHub, Slack, and Google — tokens fetched from Auth0 Token Vault at execution time, never cached or exposed

## Challenges we ran into
1. **Auth0 SDK migration:** The project started with @auth0/nextjs-auth0 v3 patterns but needed v4 (Auth0Client, no handleAuth). Significant refactoring.
2. **MCP SDK transport:** The default `StreamableHTTPServerTransport` uses Node.js `IncomingMessage/ServerResponse`, incompatible with Next.js App Router. We found `WebStandardStreamableHTTPServerTransport` which uses Web Standard Request/Response.
3. **Serverless approval flow:** CIBA approval can take minutes, but Vercel serverless functions have timeouts. We implemented short-polling with a 2-minute window — the dashboard also auto-refreshes pending requests every 5 seconds.
4. **Dynamic Zod schemas:** MCP SDK requires Zod schemas for tool inputs, but our tool definitions use JSON Schema. We built a converter that handles strings, numbers, booleans, arrays, and enums.

## Accomplishments that we're proud of
- **Universal agent support:** Any MCP client works — no custom integration needed
- **Dual-path approval:** CIBA push notification AND dashboard approve, first one wins
- **Complete audit trail:** Every tool call logged with timestamp, risk level, resolution method, and execution time
- **Real API calls:** Not just mocks — we actually call GitHub, Slack, and Google APIs with tokens from the vault
- **Clean architecture:** 9 PRs, incremental delivery, TypeScript strict mode, clean builds throughout

## What we learned
- Auth0 Token Vault's token exchange flow is elegant — the refresh token exchange lets you get provider tokens without ever storing them yourself
- CIBA is underutilized — it's perfect for AI agent approval flows where the user isn't actively at the computer
- MCP is the right abstraction for agent permissions — by controlling which tools appear, you control what the agent can even attempt

## What's next for AgentVault
- **Rate limiting enforcement** (currently display-only)
- **More services** via Auth0's 25+ social connections
- **Webhook notifications** (Slack, email) alongside Guardian push
- **Team features** — shared vaults with role-based approval chains
- **SDK/CLI** — `npx agentvault connect` for quick setup

## Built With
auth0, auth0-ciba, auth0-guardian, auth0-token-vault, mcp, model-context-protocol, next.js, react, tailwind-css, typescript, vercel, vercel-kv, zustand
