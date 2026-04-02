---
title: "I Built Permission Vaults for AI Agents Using Auth0 Token Vault"
published: false
tags: devchallenge, auth0, mcp, ai
---

*This is a submission for the [Authorized to Act: Auth0 for AI Agents Hackathon](https://authorizedtoact.devpost.com/)*

## The Problem Nobody's Talking About

AI agents are getting real powers. Claude Code pushes to your GitHub. Cursor reads your codebase. OpenClaw manages your calendar. But here's the thing nobody asks:

**Who controls what the agent is allowed to do?**

Right now, you either give an agent your full API token — or nothing. There's no middle ground. No "you can read my repos but not delete them." No "send emails, but ask me first." No audit trail of what the agent actually did.

We hand raw API keys to AI and hope for the best. That's not security. That's trust with no verification.

## What I Built

**AgentVault** — Auth0-powered permission vaults for AI agents.

Connect your services once through Auth0 Token Vault. Define exactly what each agent can do. Get an MCP server URL. Drop it into any agent. Done.

```
Your AI Agent (Claude Code, Cursor, OpenClaw, etc.)
       ↓ MCP protocol
AgentVault MCP Server
       ↓ checks permissions → fetches tokens
Auth0 Token Vault
       ↓ OAuth tokens
GitHub / Gmail / Slack / Jira
```

**You don't modify your agent. You don't write auth code. You just give it an MCP URL.**

AgentVault sits between the agent and your services, enforcing permissions at the protocol level. The agent discovers only the tools you've allowed. Blocked tools don't just get denied — they're invisible. Write actions pause and wait for your approval via Auth0 Guardian push notification. Every call is logged.

## The Key Insight: Vaults, Not Tokens

Most approaches to agent auth are "here's a token, go nuts." AgentVault flips this:

**One user. Multiple vaults. Different agents, different powers.**

| Vault | Agent | GitHub | Gmail | Slack |
|-------|-------|--------|-------|-------|
| Personal | OpenClaw | Read + Write | Read + Send | Full access |
| Work | Cursor | Read + Write | Read only | Blocked |
| Public Bot | Discord Bot | Read only | Blocked | Blocked |

Each vault generates a unique MCP server URL + bearer token. Your personal assistant gets broad access. Your work coding agent gets scoped access. A public-facing bot gets read-only. If any agent's token is compromised, revoke just that vault — others stay safe.

This isn't a feature I bolted on. It's the core architecture.

## How Token Vault Makes This Possible

Auth0 Token Vault is the engine underneath. Here's what it actually does for AgentVault:

**1. OAuth without the pain**

When a user clicks "Connect GitHub" in AgentVault, they're redirected through Auth0's Connected Accounts flow. Auth0 handles the entire OAuth dance — consent screen, token exchange, encrypted storage. I never see, store, or refresh a raw token.

**2. Token exchange on demand**

When an agent calls a tool (say, `github_repos_read`), AgentVault calls Token Vault's refresh token exchange:

```
Agent calls tool → AgentVault checks policy → allowed?
  → Yes: Token Vault exchanges refresh token for fresh GitHub access token
  → AgentVault calls GitHub API → returns result to agent
  → Access token discarded immediately
```

The agent never holds a token. AgentVault never persists a token. Token Vault is the only place tokens exist.

**3. 25+ integrations, zero code per service**

Token Vault supports GitHub, Google Workspace, Slack, Salesforce, Dropbox, Figma, Stripe, and 20+ more out of the box. When I add a new service to AgentVault, I configure it in Auth0's dashboard — no OAuth code to write.

## The Approval Flow (Auth0 CIBA)

This is the part I'm most proud of.

When an agent tries a write action — say, sending an email or pushing code — AgentVault doesn't just let it through. It triggers Auth0's Client-Initiated Backchannel Authentication (CIBA):

1. Agent calls `gmail_send` → AgentVault detects it requires approval
2. AgentVault sends a CIBA request to Auth0 with action details
3. Auth0 sends a push notification to your phone via Guardian
4. Your phone shows: *"AgentVault: DevOps Copilot wants to send an email to team@company.com — Approve / Deny"*
5. You tap Approve
6. AgentVault gets the green light → executes the action → logs it

The agent doesn't know about CIBA. It just called a tool and got a response. The entire approval flow is invisible at the protocol level — the MCP call simply takes longer.

There's also a dashboard-based approval path. If you're already looking at AgentVault, pending actions appear in the Action Queue with full context: what the agent wants to do, why (agent reasoning), the exact payload, and a security risk assessment.

**Dual-path resolution**: whichever you respond to first (Guardian push or dashboard) resolves the request. No double-approval, no race conditions.

## The Granular Policy Matrix

For every service, every action, you choose one of three states:

- **Allow** — agent acts freely, logged but no friction
- **Require Approval** — agent pauses, you approve via CIBA or dashboard
- **Block** — tool doesn't exist in the MCP server. Agent can't even see it.

That last one matters. A blocked tool isn't "access denied." It's not in the tool list at all. The agent can't hallucinate using a tool it doesn't know exists.

```
Policy for "DevOps Copilot":

GitHub:
  ✅ repos.read     → Allow
  ⏳ repos.write    → Require Approval  
  ⏳ issues.*       → Require Approval
  🚫 repos.delete   → Block (invisible)

Google Workspace:
  ✅ drive.read     → Allow
  🚫 drive.write    → Block
  ⏳ gmail.send     → Require Approval
```

## Full Audit Log

Every MCP tool call is logged:

```
10:00 AM  github   repos.read       ✅ executed    (auto)
10:01 AM  github   issues.*         ⏳ pending     → ✅ approved (Guardian)
10:02 AM  gmail    gmail.send       🚫 blocked     (not in policy)
10:05 AM  slack    chat.write       ⏳ pending     → ❌ denied (dashboard)
```

Timestamp, agent, service, action, outcome, resolution channel. Exportable as CSV. Judges asked for "user control" — this is user control.

## Architecture

```
┌─────────────────────────────────────────────┐
│              AgentVault                      │
│                                              │
│  Dashboard (Next.js)    MCP Server (HTTP)    │
│  ├── Vault Connections  ├── Auth routing     │
│  ├── Agent Policies     ├── Policy enforce   │
│  ├── Action Queue       ├── CIBA trigger     │
│  └── Audit Logs         └── Tool execution   │
│            │                    │             │
│      ┌─────┴──────┐    ┌──────┴──────┐      │
│      │  Vercel KV  │    │    Auth0     │      │
│      │  (configs)  │    │ Token Vault  │      │
│      └─────────────┘    │   + CIBA     │      │
│                         └──────┬───────┘      │
└────────────────────────────────┼──────────────┘
                                 │
                       GitHub / Gmail / Slack
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + Tailwind CSS |
| Auth | @auth0/nextjs-auth0 v4 + Token Vault |
| Async Approval | @auth0/ai (CIBA) + Auth0 Guardian |
| MCP Server | @modelcontextprotocol/sdk (Streamable HTTP) |
| Storage | Vercel KV (Upstash Redis) |
| Deploy | Vercel |

## What I Learned About Token Vault

Building AgentVault surfaced patterns that might be useful for Auth0's roadmap:

**1. Scope-to-action mapping is manual work.** Token Vault stores OAuth tokens with scopes, but there's no built-in way to say "the `repo` scope on GitHub means the agent can do X, Y, Z." I had to build the action→scope mapping layer myself. A first-party "capabilities API" on top of Token Vault would be powerful.

**2. CIBA + MCP is a natural fit.** MCP tool calls are inherently synchronous from the agent's perspective — the agent calls a tool and waits for a response. CIBA slots perfectly into this: the tool call just takes longer while the user approves. No agent-side changes needed.

**3. Multi-vault is an identity pattern, not a feature.** The idea that one user has multiple "permission profiles" for different agents feels like it should be a first-class concept in identity systems. It's essentially RBAC, but the "roles" are agents, not users.

## Show Us the Code

{% github phamthanhhang208/agent-vault %}

## Video Demo

<!-- TODO: Add demo video link -->

---

*Built for the Authorized to Act hackathon. Auth0 Token Vault handles the identity. MCP handles the protocol. AgentVault handles the permissions in between.*

## Bonus Blog Post

The above constitutes my blog post submission for the Bonus Blog Post Prize. It covers Token Vault integration patterns, CIBA for human-in-the-loop agent approval, and architectural insights about multi-vault permission management — all original content materially different from the project README.
