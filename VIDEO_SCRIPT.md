# AgentVault — Demo Video Script (~3 min)

## Setup Before Recording
1. Open https://agent-vault-three.vercel.app — logged in
2. Open terminal with Claude Code ready
3. Screen recorder (QuickTime Cmd+Shift+5)
4. Phone nearby with Auth0 Guardian app open

---

## SCENE 1 — Intro + Dashboard Tour [0:00 - 0:30]

**On screen:** AgentVault dashboard (Overview page)

**Say:**
> "This is AgentVault — it gives AI agents real-world powers without giving them the keys to everything. Every service connection goes through Auth0 Token Vault. Every action is permission-controlled."

**Action:** Click through sidebar:
- **Vault Connections** → show GitHub, Google, Slack connected with green badges
- **Agents & Policies** → show agent list

**Say:**
> "I've connected GitHub, Google, and Slack through Auth0 Token Vault. Auth0 stores and refreshes all OAuth tokens — my agents never see raw credentials."

---

## SCENE 2 — Create an Agent [0:30 - 1:10]

**On screen:** Click "Create New Agent"

**Say:**
> "Let me create an agent for Claude Code. Each agent gets its own permission vault."

**Action:** Walk through the 3-step wizard:
1. **Name:** "Claude Code Assistant" / Description: "Coding helper with GitHub access"
2. **Services:** Check GitHub ✅, Slack ✅
3. **Policy Matrix:**
   - GitHub repos.read → Allow ✅
   - GitHub repos.write → Require Approval ⏳
   - GitHub issues.* → Allow ✅
   - Slack chat.read → Allow ✅
   - Slack chat.write → Require Approval ⏳
   - Everything else → Block 🚫

**Say:**
> "The policy matrix is the core — Allow means auto-execute, Require Approval sends a push notification to my phone, and Block makes the tool completely invisible to the agent."

**Action:** Click Create → Success screen shows MCP URL + token

**Say:**
> "There's my MCP URL and bearer token. Let me drop this into Claude Code."

---

## SCENE 3 — Connect to Claude Code [1:10 - 1:30]

**On screen:** Terminal

**Action:** Create a project with the MCP config:
```bash
mkdir demo-project && cd demo-project
cat > .mcp.json << 'EOF'
{
  "mcpServers": {
    "agentvault": {
      "type": "http",
      "url": "https://agent-vault-three.vercel.app/api/mcp/srv_XXXXX",
      "headers": {
        "Authorization": "Bearer avt_XXXXX"
      }
    }
  }
}
EOF
claude
```

**Say:**
> "One JSON file. That's all Claude Code needs. The MCP URL points to my AgentVault server — Claude will discover only the tools I've allowed."

---

## SCENE 4 — Read Tool (Auto-Allowed) [1:30 - 1:50]

**On screen:** Claude Code running

**Type in Claude Code:**
> "List the open issues on phamthanhhang208/agent-vault"

**Say:**
> "This is a read action — repos.read is set to Allow, so it executes immediately. No approval needed."

**Action:** Claude Code calls the tool, gets results.

---

## SCENE 5 — Write Tool + Phone Approval ⭐ [1:50 - 2:30]

**On screen:** Claude Code + phone visible

**Type in Claude Code:**
> "Create a new issue on phamthanhhang208/agent-vault titled 'Add rate limiting' with description 'Implement per-vault rate limits'"

**Say:**
> "Now watch — creating an issue requires approval. The MCP call is going to pause..."

**Action:** Claude Code shows it's waiting. Your phone buzzes with Guardian push notification.

**Say:**
> "There's the push notification from Auth0 Guardian. It tells me exactly what the agent wants to do. I'll approve it."

**Action:** Tap Approve on phone. Claude Code continues and creates the issue.

**Say:**
> "Approved. Issue created. The agent didn't need to know about Auth0 or OAuth — it just called an MCP tool and waited."

---

## SCENE 6 — Audit Log [2:30 - 2:45]

**On screen:** Switch to AgentVault dashboard → Audit Logs

**Say:**
> "Every tool call is logged — timestamp, agent, action, risk level, and how it was resolved. Auto-executed reads, phone-approved writes, and any blocked attempts."

**Action:** Scroll through the audit log showing the calls we just made.

---

## SCENE 7 — Close [2:45 - 3:00]

**On screen:** Dashboard overview with stats

**Say:**
> "That's AgentVault. Connect your services through Auth0 Token Vault. Define permissions per agent. Get an MCP URL. Drop it into any agent. Every action logged, every write approved, every token safe inside Auth0's vault."

---

## Cheat Sheet — Lines to Say

1. "AgentVault gives AI agents real-world powers without giving them the keys to everything."
2. "Auth0 Token Vault stores and refreshes all OAuth tokens — agents never see raw credentials."
3. "The policy matrix: Allow auto-executes, Approval sends a push to my phone, Block makes the tool invisible."
4. "One JSON file. That's all Claude Code needs."
5. "Read action — repos.read is Allow, executes immediately."
6. "Creating an issue requires approval. The MCP call pauses..."
7. "There's the Guardian push. I'll approve it."
8. "The agent just called an MCP tool and waited. It doesn't know about Auth0."
9. "Every tool call logged. Auto-executed, approved, blocked."
10. "Connect once, control everything, plug into any agent."

---

## If Things Go Wrong
- **MCP timeout:** Claude Code has a default timeout. If approval takes too long, the call fails. Approve quickly!
- **Guardian push not arriving:** Approve via the dashboard Action Queue instead.
- **CIBA not working:** Dashboard approval still works — same result, just less dramatic for the video.
- **Token Vault not configured:** Tools return mock data. Still demonstrates the permission flow.
