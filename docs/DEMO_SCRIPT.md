# Demo Script — AgentVault (3-5 minutes)

## Setup Before Recording
- Have AgentVault deployed on Vercel
- Have GitHub connected in Token Vault
- Have an agent created with policies configured
- Have Claude Code (or Cursor) with the MCP URL configured
- Have Auth0 Guardian app installed on your phone

---

## Scene 1: The Problem (30s)
**Narration:** "AI agents can do amazing things — read your code, manage issues, send emails. But right now, you either give them full access... or nothing. There's no permission layer."

*Show: A quick clip of an AI agent doing something powerful*

## Scene 2: AgentVault Landing Page (15s)
**Narration:** "AgentVault changes that. It's a permission vault powered by Auth0 that any AI agent can plug into."

*Show: Landing page → Click "Get Started" → Auth0 login*

## Scene 3: Connect GitHub (30s)
**Narration:** "First, connect your services via Auth0 Token Vault. One click, standard OAuth."

*Show:*
1. Dashboard → Vault Connections
2. Click "Connect GitHub"
3. GitHub OAuth consent screen
4. Redirect back → "Connected ✅" with scopes displayed

**Key point:** "Your GitHub token is stored securely in Auth0's encrypted vault. AgentVault never sees it."

## Scene 4: Create an Agent with Policies (45s)
**Narration:** "Now create an agent. Give it a name, pick your services, and set permissions per action."

*Show:*
1. Agents → "New Agent Connection"
2. Step 1: Name it "DevOps Copilot"
3. Step 2: Select GitHub
4. Step 3: Policy matrix:
   - `repos.read` → **Allow** (green)
   - `issues.*` → **Require Approval** (amber)
   - `repos.write` → **Require Approval** (amber)
   - `repos.delete` → **Block** (red)
5. Click "Generate MCP Server URL"
6. Show the MCP URL + vault token

**Key point:** "Each action has its own permission. Read? Go ahead. Create an issue? I want to approve that first. Delete a repo? No way."

## Scene 5: Connect to Claude Code (30s)
**Narration:** "Now paste this URL into any MCP client. I'm using Claude Code."

*Show:*
1. Copy the MCP config JSON
2. Paste into Claude Code's MCP settings
3. Claude Code discovers the tools: `github_repos_read`, `github_issues_all`
4. Note: `repos.delete` is NOT listed (blocked = invisible)

**Key point:** "The agent only sees tools I've allowed. Blocked actions don't even appear."

## Scene 6: Execute a Read (Auto-Allow) (20s)
**Narration:** "Let's ask it to read a repo."

*Show:*
1. Ask Claude: "Read the README of my agent-vault repo"
2. Tool call executes instantly → result returned
3. Show audit log entry: ✅ executed, via: auto

**Key point:** "Read actions execute instantly. No approval needed."

## Scene 7: The Wow Moment — Approval Flow (60s)
**Narration:** "Now watch what happens when the agent tries to create an issue."

*Show:*
1. Ask Claude: "Create an issue titled 'Add Jira integration' in agent-vault"
2. Tool call pauses... "This action requires human approval"
3. **Split screen:**
   - Left: Auth0 Guardian push notification on phone 📱
   - Right: AgentVault dashboard → Action Queue showing the pending request
4. Show the request detail: agent intent, payload, risk level
5. Click **"Approve & Execute"** on the dashboard
6. Claude Code receives the result → issue created!
7. Show the audit log: ✅ approved, via: dashboard

**Key point:** "I got a push notification AND saw it on the dashboard. Whichever I respond to first wins. The agent waited patiently."

## Scene 8: Audit Trail (15s)
**Narration:** "Every single action is logged. Who did what, when, and how it was resolved."

*Show:*
1. Audit Logs page with entries
2. Point out: timestamp, agent name, service:action, risk level, status, resolved via, duration
3. Click "Export CSV"

## Scene 9: Closing (15s)
**Narration:** "AgentVault. Connect once, control everything, plug into any agent. Built with Auth0 Token Vault and MCP."

*Show: Landing page with architecture diagram*

---

## Total: ~4 minutes
