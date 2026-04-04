# AgentVault — Demo Video Script (~3 min)

## Pre-Recording Checklist
- [ ] https://agent-vault-three.vercel.app — logged in, dashboard visible
- [ ] Terminal ready at `~/Projects/agent-vault-demo`
- [ ] Phone with Auth0 Guardian app open and notifications on
- [ ] Screen recorder ready (QuickTime Cmd+Shift+5 or OBS)
- [ ] Font size: terminal 18pt, browser zoomed to 125%
- [ ] Close unrelated tabs/apps

---

## OPENING — The Problem + The Solution [0:00 - 0:20]

**On screen:** Show `docs/images/before.png`

![Before](https://raw.githubusercontent.com/phamthanhhang208/agent-vault/main/docs/images/before.png)

**Say:**
> "This is how AI agents work today. Raw API tokens hardcoded in env files. Full access to everything. No permission control, no approval flow, no audit trail. If a token leaks — everything is exposed."

*Pause 1 second*

**On screen:** Transition to `docs/images/architecture.png`

![Architecture](https://raw.githubusercontent.com/phamthanhhang208/agent-vault/main/docs/images/architecture.png)

**Say:**
> "AgentVault fixes this. You connect your services through Auth0 Token Vault. Define permissions per agent. Get an MCP URL. The agent only sees what you allow. Writes need your approval on your phone. Everything is logged."

---

## SCENE 1 — Dashboard Tour [0:15 - 0:45]

**On screen:** AgentVault dashboard — Overview page

**Say:**
> "Here's the AgentVault dashboard. I've connected three services through Auth0 Token Vault — GitHub, Google Workspace, and Slack."

**Action:** Click **Vault Connections** in sidebar.

**On screen:** Connections page with green badges

**Say:**
> "Each connection is a one-click OAuth flow. Auth0 handles token storage, encryption, and refresh. I never see raw credentials."

**Action:** Click the ⚙️ on GitHub to show scopes.

**Say:**
> "I can see exactly what scopes were granted — repo access, issue management, org read. These are the maximum capabilities. But each agent gets a subset."

**Action:** Close modal, click **Agents & Policies** in sidebar.

---

## SCENE 2 — Create an Agent [0:45 - 1:20]

**On screen:** Agents page

**Say:**
> "This is the key concept — vaults. Each agent gets its own permission profile. My personal assistant might get full access. A work bot gets read-only. A public agent gets nothing sensitive."

**Action:** Click **"Create New Agent"**

**Step 1 — Identity:**
- Name: `Claude Code Assistant`
- Description: `Coding helper with scoped GitHub access`

**Say:**
> "Step one — name the agent."

**Step 2 — Services:**
- Check ✅ GitHub

**Say:**
> "Step two — pick which services this agent can access."

**Step 3 — Policy Matrix:**
- repos.read → **Allow** ✅
- issues.* → **Allow** ✅  
- repos.write → **Require Approval** ⏳
- repos.delete → **Block** 🚫

**Say:**
> "Step three — the policy matrix. This is where it gets interesting. Three states per action. Allow means auto-execute, shown in green. Require Approval sends a push notification to my phone via Auth0 Guardian, shown in yellow. And Block, in red — the tool doesn't just get denied. It becomes completely invisible. The agent can't even see it exists."

**Action:** Click Create → Success screen

**Say:**
> "There's my MCP URL and bearer token. One URL, one token. That's all any agent needs."

**Action:** Copy the MCP URL.

---

## SCENE 3 — Connect to Claude Code [1:20 - 1:40]

**Action:** Cmd+Tab to terminal.

**On screen:** Terminal at `~/Projects/agent-vault-demo`

**Say:**
> "I've already set up a demo project with the MCP config. Let me show you."

**Type:**
```bash
cat .mcp.json
```

**Say:**
> "One JSON file with the AgentVault MCP URL and bearer token. That's the entire setup. No SDK, no auth code, no token management."

**Type:**
```bash
claude
```

**Say:**
> "Let's start Claude Code. It auto-discovers the AgentVault MCP server."

*Wait for Claude to start and show the MCP tools.*

---

## SCENE 4 — Flow Diagram + Read Action [1:40 - 2:00]

**On screen:** Briefly show `docs/images/flow.png`, then switch to Claude Code

![Flow](https://raw.githubusercontent.com/phamthanhhang208/agent-vault/main/docs/images/flow.png)

**Say:**
> "Here's how data flows. Read actions go straight through — policy says Allow, Token Vault provides a fresh token, API call happens, token is discarded. Write actions pause for approval via Auth0 CIBA. Let me show you both."

---

## SCENE 5 — Write Action + Dashboard Approval ⭐ [2:00 - 2:35]

**On screen:** Claude Code on the left, browser with AgentVault dashboard on the right (split screen)

**Type in Claude:**
> "I'm building a TodoFlow app — a todo list with pomodoro timer. Create an issue on phamthanhhang208/agent-vault-demo titled 'Add pomodoro timer component' with description 'Build a 25min work / 5min break timer with start, pause, reset controls. Show session count and daily stats.'"

**Say:**
> "I'm asking Claude to create a feature request for my project. This is a write action — our policy requires approval. Watch the MCP call pause..."

*Claude shows it's waiting / processing.*

**Say:**
> "The request is now in the Action Queue."

**Action:** Switch to AgentVault dashboard → **Action Queue** page. The pending request appears with:
- Agent name, action, service
- Risk level
- Full payload
- Approve / Reject buttons

**Say:**
> "Here it is — Claude Code Assistant wants to create an issue on GitHub. I can see the exact payload, the risk level, and the agent's reasoning. Let me approve it."

**Action:** Click **Approve** ✅

**On screen:** Switch back to Claude Code — it continues and creates the issue.

**Say:**
> "Approved. The issue is now on GitHub. Claude didn't know about Auth0, didn't handle OAuth. It just called an MCP tool and waited. AgentVault handled the rest."

---

## SCENE 6 — Audit Log [2:35 - 2:50]

**Action:** Cmd+Tab to browser → AgentVault dashboard → **Audit Logs**

**On screen:** Audit log table with entries

**Say:**
> "Every tool call is here. Timestamp, agent name, service, action, risk level, and how it was resolved. The read was auto-executed. The write was approved via Guardian push. If the agent had tried to delete a repo — it couldn't. That tool doesn't exist in its MCP."

---

## SCENE 7 — Close [2:50 - 3:00]

**On screen:** Dashboard overview with stats

**Say:**
> "That's AgentVault. Auth0 Token Vault handles the identity. MCP handles the protocol. We handle the permissions in between. Connect once. Control everything. Plug into any agent."

*Fade out.*

---

## All Lines (teleprompter cheat sheet)

1. "AI agents can read your emails, push code, send messages. But who controls what they're allowed to do?"
2. "AgentVault solves this. Connect services through Auth0 Token Vault, define permissions, get an MCP URL."
3. "Each connection is a one-click OAuth flow. Auth0 handles token storage, encryption, and refresh."
4. "I can see exactly what scopes were granted. These are the maximum capabilities. Each agent gets a subset."
5. "This is the key concept — vaults. Each agent gets its own permission profile."
6. "Three states per action. Allow auto-executes. Approval sends a push to my phone. Block makes the tool invisible."
7. "One JSON file. No SDK, no auth code, no token management."
8. "A read action — Allow in our policy. Executes immediately."
9. "The agent never held a credential."
10. "A write action. Creating an issue requires approval. The MCP call pauses..."
11. "Here it is in the Action Queue — the exact payload, risk level, agent reasoning. Let me approve it."
12. "Claude didn't know about Auth0. It just called an MCP tool. AgentVault handled the rest."
13. "Every tool call is logged. Auto-executed, approved, blocked."
14. "Connect once. Control everything. Plug into any agent."

---

## If Things Go Wrong

| Problem | Fix |
|---------|-----|
| MCP timeout on write | Approve faster! The MCP call has a timeout |
| Action Queue not showing request | Refresh the page — it polls every 3s |
| Claude can't find MCP server | Check `.mcp.json` URL is correct |
| "Unauthorized" from MCP | Bearer token expired or wrong — recreate agent |
| Tool returns mock data | Token Vault not connected — OK for demo, still shows flow |
