# 🔐 AgentVault

**Auth0-powered permission vaults for AI agents. Connect once, control everything, plug into any agent.**

> Built for the [Authorized to Act: Auth0 for AI Agents](https://authorizedtoact.devpost.com/) hackathon · April 2026

---

## The Problem

AI agents are getting powerful — they can read your emails, push code, send messages. But there's no standard way to control *what* they're allowed to do. You either give them full access or no access. There's no middle ground, no audit trail, and no way to approve sensitive actions before they happen.

## The Solution

AgentVault turns Auth0 Token Vault into a permission layer for any AI agent. Connect your services, define what each agent can do, and get an MCP server URL that enforces your rules.

```
Your AI Agent (Claude Code, Cursor, OpenClaw, etc.)
       ↓ MCP protocol
AgentVault MCP Server
       ↓ checks permissions → fetches tokens
Auth0 Token Vault
       ↓ OAuth tokens
GitHub / Gmail / Slack / Jira
```

You don't change your agent. You just give it an MCP URL. AgentVault handles the rest.

---

## Key Features

### 🔑 Connect Services via Auth0 Token Vault
One-click OAuth connections for GitHub, Google Workspace, Slack, and more. Auth0 stores and refreshes tokens — your agent never sees raw credentials.

### 🤖 Multi-Vault: One User, Multiple Agents
Create separate vaults with different permissions for each agent:

| Vault | Agent | GitHub | Gmail | Slack |
|-------|-------|--------|-------|-------|
| Personal | OpenClaw | Read + Write | Read + Send | Read + Send |
| Work | Cursor | Read + Write | Read only | Blocked |
| Public Bot | Discord Bot | Read only | Blocked | Blocked |

Each vault gets a unique MCP URL + token. Different agents, different powers.

### 🛡️ Granular Permission Policies
For every action on every service, choose:
- **Allow** — agent acts freely
- **Require Approval** — you approve via push notification or dashboard
- **Block** — agent can't even see the tool

### ⏳ Human-in-the-Loop Approval (Auth0 CIBA)
When an agent hits a "Require Approval" action:
1. AgentVault triggers Auth0 CIBA (Client-Initiated Backchannel Authentication)
2. You get a push notification via Auth0 Guardian (or email)
3. Approve or deny from your phone
4. Agent proceeds (or stops)

No webhooks, no polling from the agent side. The MCP call just waits.

### 📋 Full Audit Log
Every tool call is logged:
```
10:00 AM  github   list_repos       ✅ auto
10:01 AM  github   create_issue     ⏳ pending → ✅ approved
10:02 AM  gmail    send_email       🚫 blocked (not permitted)
10:05 AM  slack    send_message     ⏳ pending → ❌ denied
```

See exactly what your agents are doing. Export as CSV. Full transparency.

---

## How It Works

### For End Users

1. **Sign in** with Auth0
2. **Connect services** — click "Connect GitHub", authorize via OAuth, done
3. **Create a vault** — name it, pick services, set permissions per action
4. **Copy the MCP URL** — paste into your agent's MCP config
5. **Done** — your agent has powers, within your rules

### For AI Agents (MCP Protocol)

Any MCP-compatible agent can connect:

```json
{
  "mcpServers": {
    "vault": {
      "url": "https://agentvault.vercel.app/mcp/srv_abc123",
      "headers": {
        "Authorization": "Bearer avt_your_vault_token"
      }
    }
  }
}
```

The agent discovers only the tools you've permitted. Blocked tools don't appear. Write tools pause and wait for your approval.

---

## Architecture

```
┌────────────────────────────────────────────────────┐
│                   AgentVault                        │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  Dashboard    │  │  MCP Server  │  │  Audit    │ │
│  │  (Next.js)   │  │  (HTTP)      │  │  Logger   │ │
│  │              │  │              │  │           │ │
│  │  - Vaults    │  │  - Routing   │  │  - Every  │ │
│  │  - Policies  │  │  - Policy    │  │    call   │ │
│  │  - Approvals │  │    enforce   │  │    logged │ │
│  │  - Audit log │  │  - CIBA      │  │           │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│         │                 │                │       │
│         └────────┬────────┴────────┬───────┘       │
│                  │                 │                │
│           ┌──────▼──────┐  ┌──────▼──────┐         │
│           │  Vercel KV  │  │  Auth0       │         │
│           │  (configs)  │  │  Token Vault │         │
│           └─────────────┘  │  + CIBA      │         │
│                            └──────┬───────┘         │
└───────────────────────────────────┼─────────────────┘
                                    │
                          ┌─────────▼─────────┐
                          │  GitHub / Gmail /  │
                          │  Slack / Jira      │
                          └────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + Tailwind CSS |
| Auth | @auth0/nextjs-auth0 + Auth0 Token Vault |
| Async Approval | @auth0/ai (CIBA) + Auth0 Guardian |
| MCP Server | @modelcontextprotocol/sdk (Streamable HTTP) |
| Storage | Vercel KV (Redis) |
| Deploy | Vercel |

---

## Quick Start

### Prerequisites
- Node.js 20+
- Auth0 account with Token Vault enabled
- Vercel account (for KV + deploy)

### Setup

```bash
# Clone and install
git clone https://github.com/phamthanhhang208/agent-vault.git
cd agent-vault
npm install

# Configure environment
cp .env.local.example .env.local
# Fill in Auth0 credentials (see docs/AUTH0_INTEGRATION.md)

# Run locally
npm run dev
```

### Auth0 Configuration

See [docs/AUTH0_INTEGRATION.md](docs/AUTH0_INTEGRATION.md) for step-by-step Auth0 setup:
1. Create Auth0 tenant + application
2. Enable Token Vault grant type
3. Add social connections (GitHub, Google, Slack)
4. Configure CIBA for async approvals
5. Set up Auth0 Guardian for push notifications

---

## Services Supported

Auth0 Token Vault provides 25+ OAuth integrations. AgentVault exposes them as MCP tools:

| Service | Read Tools | Write Tools (require approval) |
|---------|-----------|-------------------------------|
| **GitHub** | List repos, read issues, read PRs | Create issue, push code, merge PR |
| **Google Workspace** | Read emails, read calendar, read docs | Send email, create event, create doc |
| **Slack** | List channels, read messages | Send message, create channel |
| **Jira** | Read issues, read boards | Create issue, assign, transition |

More services can be added by configuring additional Auth0 social connections — no code changes needed.

---

## What Makes This Different

**vs Auth0's Assistant0 sample:**
Assistant0 is a fixed personal assistant. AgentVault is infrastructure — any agent, any MCP client, permission-controlled.

**vs giving agents raw API tokens:**
AgentVault ensures agents never hold tokens. Auth0 Token Vault is the only token store. Permissions are enforced server-side, not by trusting the agent.

**vs Zapier/n8n:**
Those are workflow builders. AgentVault is a permission layer — your agent decides what to do, AgentVault decides what it's *allowed* to do.

---

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Auth0 Integration Guide](docs/AUTH0_INTEGRATION.md)
- [MCP Server](docs/MCP_SERVER.md)
- [Build Phases](docs/PHASES.md)
- [UI Reference](docs/UI_REFERENCE.md)

---

*Built solo for the Authorized to Act hackathon · April 2026*
