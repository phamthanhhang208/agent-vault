# AgentVault — Auth0-Powered Permission Vaults for AI Agents

## Project Overview

AgentVault lets users connect services (GitHub, Google Workspace, Slack, Jira) via Auth0 Token Vault, define per-action permissions, and generate a personal MCP server URL that any AI agent can plug into. The agent only gets tools the user explicitly permitted. Write actions require approval via Auth0 CIBA push notifications. Every tool call is logged in an audit trail.

**Core concept:** "Connect once, control everything, plug into any agent."

**Hackathon:** "Authorized to Act: Auth0 for AI Agents" (Devpost, deadline April 7, 2026). Must use Auth0 Token Vault.

## Architecture

```
User's AI Agent (Claude Code, Cursor, OpenClaw, etc.)
    ↓ MCP protocol (Streamable HTTP)
AgentVault MCP Server (our code)
    ↓ validates vault token → checks permission map
Auth0 Token Vault (managed)
    ↓ fetches OAuth tokens per service
GitHub / Gmail / Slack / Jira APIs
```

We do NOT build an AI agent. The user brings their own. We build the auth + permission + MCP layer.

## Tech Stack

- **Frontend:** Next.js 15 (App Router) + Tailwind CSS + @auth0/nextjs-auth0 + @auth0/ai-components
- **MCP Server:** @modelcontextprotocol/sdk (Streamable HTTP transport)
- **Auth:** Auth0 Token Vault + CIBA (@auth0/ai SDK)
- **Storage:** Vercel KV (vault configs, permission maps, audit log)
- **Deploy:** Vercel

## Key Differentiators (vs Auth0's Assistant0 sample)

1. **Infrastructure, not an app** — any agent, any MCP client, permission-controlled
2. **Multi-vault** — one user can have multiple agents with different permission sets
3. **Full audit logging** — immutable record of every tool call, approval, rejection
4. **Granular policy matrix** — per-action allow/approval-required/block states
5. **Dual approval path** — dashboard in-app approval + Auth0 CIBA push/email (Guardian)

## Important Technical Notes

- **MCP URLs use HTTPS**, not `mcp://`. Example: `https://agentvault.vercel.app/mcp/srv_8291klns`
- **Context Injection is advisory only** — MCP servers can expose a `system_prompt` resource, but the agent decides whether to follow it. UI labels this clearly: "Advisory instructions — the agent is encouraged but not forced to follow these."
- **Rate limiting is display-only for v1** — shown in UI but not enforced server-side. Noted in docs as "coming soon."
- **CIBA dual-path approval** — when an action requires approval, AgentVault both: (1) shows it in the dashboard Action Queue, AND (2) triggers Auth0 CIBA notification (Guardian push / email). Whichever the user responds to first resolves the request. This demonstrates proper CIBA usage to judges.

## Project Structure

```
agentvault/
├── CLAUDE.md                    # ← You are here
├── docs/
│   ├── ARCHITECTURE.md          # Detailed system design
│   ├── PHASES.md                # Build phases & task breakdown
│   ├── AUTH0_INTEGRATION.md     # Auth0 Token Vault + CIBA specifics
│   ├── MCP_SERVER.md            # MCP server implementation details
│   └── UI_REFERENCE.md          # Frontend component reference
├── src/
│   ├── app/                     # Next.js App Router pages
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Landing / marketing page
│   │   ├── dashboard/
│   │   │   ├── layout.tsx       # Dashboard shell (sidebar + auth guard)
│   │   │   ├── page.tsx         # Overview tab
│   │   │   ├── approvals/
│   │   │   │   └── page.tsx     # Action queue / approval manager
│   │   │   ├── connections/
│   │   │   │   └── page.tsx     # Vault connections management
│   │   │   ├── agents/
│   │   │   │   ├── page.tsx     # Agents list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx # Create agent wizard
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # Agent detail + policy editor
│   │   │   └── logs/
│   │   │       └── page.tsx     # Audit log viewer
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...auth0]/
│   │       │       └── route.ts # Auth0 login/callback/logout
│   │       ├── mcp/
│   │       │   └── [serverId]/
│   │       │       └── route.ts # MCP Streamable HTTP endpoint
│   │       ├── agents/
│   │       │   └── route.ts     # CRUD agents
│   │       ├── connections/
│   │       │   └── route.ts     # Manage vault connections
│   │       ├── approvals/
│   │       │   └── route.ts     # Approval queue + decisions
│   │       └── webhooks/
│   │           └── ciba/
│   │               └── route.ts # Auth0 CIBA callback
│   ├── lib/
│   │   ├── auth0.ts             # Auth0 client setup
│   │   ├── token-vault.ts       # Auth0 Token Vault wrapper
│   │   ├── ciba.ts              # CIBA approval flow
│   │   ├── mcp-server.ts        # MCP server factory
│   │   ├── policy-engine.ts     # Permission evaluation engine
│   │   ├── audit.ts             # Audit logging to Vercel KV
│   │   └── kv.ts                # Vercel KV helpers
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── sidebar.tsx
│   │   │   ├── overview.tsx
│   │   │   ├── approval-queue.tsx
│   │   │   ├── approval-detail.tsx
│   │   │   ├── connections-grid.tsx
│   │   │   ├── connection-modal.tsx
│   │   │   ├── agents-list.tsx
│   │   │   ├── agent-detail.tsx
│   │   │   ├── create-agent-wizard.tsx
│   │   │   ├── policy-matrix.tsx
│   │   │   ├── audit-table.tsx
│   │   │   └── toast.tsx
│   │   └── ui/                  # Shared primitives (if needed beyond Tailwind)
│   ├── stores/
│   │   └── dashboard-store.ts   # Zustand store for dashboard state
│   └── types/
│       └── index.ts             # Shared TypeScript types
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── .env.local.example
└── vercel.json
```

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # Lint with ESLint
```

## Environment Variables

See `.env.local.example` for required Auth0 + Vercel KV configuration.

## Coding Conventions

- **TypeScript strict mode** — no `any`, always type returns
- **Server Components by default** — use `'use client'` only when needed (interactivity, hooks, browser APIs)
- **Tailwind only** — no CSS modules, no styled-components. Match the dark slate/indigo palette from the UI mock
- **Zustand for client state** — dashboard filters, selected items, toast notifications
- **API routes return typed JSON** — consistent `{ data, error }` response shape
- **Auth guard** — all `/dashboard/*` routes require Auth0 session
- **MCP server** — Streamable HTTP transport, tool definitions generated dynamically from user's permission map

## Design System (from UI mock)

- **Background:** slate-950, slate-900
- **Borders:** slate-800
- **Text:** white (headings), slate-300 (body), slate-400/500 (secondary)
- **Primary accent:** indigo-600/500 with shadow-indigo-600/20
- **Status colors:** emerald-500 (allow/approved), amber-500 (approval-required/pending), red-500 (block/rejected)
- **Font:** system sans-serif, monospace for code/URLs
- **Radius:** rounded-xl for cards, rounded-lg for buttons/inputs, rounded-2xl for major panels
- **Animations:** fade-in, slide-in-from-top/bottom/right transitions

## Judging Criteria Mapping

| Criterion | How We Address It |
|---|---|
| Security Model | Auth0 Token Vault (tokens never exposed), per-action policy matrix, CIBA approval for writes |
| User Control | Granular allow/approval/block per action, multi-agent isolation, context injection |
| Technical Execution | MCP Streamable HTTP, dynamic tool generation, real-time approval queue |
| Design | Polished dark dashboard UI, intuitive policy editor, approval terminal UX |
| Potential Impact | Any MCP client can plug in — universal auth layer for the agentic ecosystem |
| Insight Value | Demonstrates that agent auth needs user-controlled permission boundaries, not blanket access |

## Phase Reference

See `docs/PHASES.md` for the detailed build plan. The phases are:
1. Project scaffold + Auth0 login
2. Vault connections (OAuth link flow via Auth0 Token Vault)
3. Agent CRUD + MCP server generation
4. Policy engine + dynamic MCP tools
5. CIBA approval flow
6. Audit logging
7. Polish, demo recording, Devpost submission
