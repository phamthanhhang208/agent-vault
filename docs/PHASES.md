# Build Phases — AgentVault

Deadline: April 7, 2026 (Devpost submission)

## Phase 1: Project Scaffold + Auth0 Login
**Goal:** Next.js app running with Auth0 authentication, dashboard shell with sidebar navigation.

### Tasks
- [ ] Initialize Next.js 15 project with App Router, TypeScript, Tailwind
- [ ] Install dependencies: `@auth0/nextjs-auth0`, `@vercel/kv`, `zustand`
- [ ] Configure Auth0 tenant (create app in Auth0 dashboard)
- [ ] Set up `.env.local` with Auth0 credentials + Vercel KV URLs
- [ ] Implement Auth0 login/logout/callback routes (`/api/auth/[...auth0]`)
- [ ] Create dashboard layout with sidebar navigation (from UI mock)
- [ ] Add auth guard middleware for `/dashboard/*` routes
- [ ] Create Zustand store for dashboard client state (active tab, selected items, toast)
- [ ] Verify: user can log in, see dashboard shell, log out

### Files to Create
```
src/app/layout.tsx
src/app/page.tsx
src/app/dashboard/layout.tsx
src/app/dashboard/page.tsx
src/app/api/auth/[...auth0]/route.ts
src/lib/auth0.ts
src/lib/kv.ts
src/stores/dashboard-store.ts
src/components/dashboard/sidebar.tsx
src/components/dashboard/toast.tsx
src/types/index.ts
middleware.ts
.env.local.example
```

## Phase 2: Vault Connections
**Goal:** Users can connect GitHub, Slack, Google Workspace via Auth0 Token Vault OAuth flow.

### Tasks
- [ ] Set up Auth0 Token Vault connections for GitHub, Slack, Google in Auth0 dashboard
- [ ] Create API route for initiating Token Vault OAuth (`/api/connections`)
- [ ] Implement Token Vault callback handling
- [ ] Build connections grid UI (from mock: `renderConnections`)
- [ ] Build connection settings modal (scopes display, active agents, disconnect)
- [ ] Store connection metadata in Vercel KV
- [ ] Create `src/lib/token-vault.ts` wrapper for Token Vault API
- [ ] Verify: user can connect GitHub, see scopes, disconnect

### Files to Create
```
src/app/dashboard/connections/page.tsx
src/app/api/connections/route.ts
src/lib/token-vault.ts
src/components/dashboard/connections-grid.tsx
src/components/dashboard/connection-modal.tsx
```

## Phase 3: Agent CRUD + MCP Server Generation
**Goal:** Users can create agents, get HTTPS MCP URLs, and connect them to MCP clients.

### Tasks
- [ ] Create agent CRUD API routes (`/api/agents`)
- [ ] Build agent list UI (from mock: `renderAgentsList`)
- [ ] Build create-agent wizard UI (from mock: `renderCreateAgent`)
  - Step 1: Agent identity (name, description)
  - Step 2: Select vault services
  - Step 3: Configure policy matrix (allow/approval/block per action)
- [ ] Generate unique `serverId` per agent
- [ ] Build agent detail/edit UI (from mock: `renderAgentDetail`)
- [ ] Store agent configs in Vercel KV
- [ ] Create stub MCP endpoint at `/api/mcp/[serverId]` (returns empty tool list for now)
- [ ] Verify: user can create agent, see MCP URL, copy it

### Files to Create
```
src/app/dashboard/agents/page.tsx
src/app/dashboard/agents/new/page.tsx
src/app/dashboard/agents/[id]/page.tsx
src/app/api/agents/route.ts
src/app/api/mcp/[serverId]/route.ts
src/lib/mcp-server.ts
src/components/dashboard/agents-list.tsx
src/components/dashboard/create-agent-wizard.tsx
src/components/dashboard/agent-detail.tsx
src/components/dashboard/policy-matrix.tsx
```

## Phase 4: Policy Engine + Dynamic MCP Tools
**Goal:** MCP server dynamically generates tools based on agent's policy config. Allow-state tools execute immediately.

### Tasks
- [ ] Implement `src/lib/policy-engine.ts`:
  - `getExposedTools(agentId)` — returns tool definitions for allow + approval actions
  - `evaluateAction(agentId, action)` — returns 'allow' | 'approval' | 'block'
- [ ] Implement MCP tool definitions for each service:
  - GitHub: `repos.read`, `repos.write`, `repos.delete`, `issues.*`
  - Slack: `chat.read`, `chat.write`, `channels.manage`
  - Google: `drive.read`, `drive.write`, `gmail.send`
- [ ] Wire up Token Vault to fetch service tokens at execution time
- [ ] Implement MCP Streamable HTTP transport in the API route:
  - POST: handle MCP JSON-RPC requests
  - GET with `Accept: text/event-stream`: SSE for streaming responses
- [ ] For `allow` tools: fetch token → call API → return result
- [ ] For `approval` tools: create pending request → return "awaiting approval" status
- [ ] If `contextInjection` is set, expose as MCP resource `system_prompt`
- [ ] Verify: connect Claude Code to MCP URL, see only permitted tools, execute a read action

### Files to Create
```
src/lib/policy-engine.ts
src/lib/tools/github.ts
src/lib/tools/slack.ts
src/lib/tools/google.ts
```

## Phase 5: CIBA Approval Flow
**Goal:** Write actions trigger Auth0 CIBA notifications. User can approve via Guardian push OR dashboard.

### Tasks
- [ ] Set up Auth0 CIBA configuration in Auth0 dashboard
- [ ] Implement `src/lib/ciba.ts`:
  - `initiateApproval(userId, requestDetails)` — triggers CIBA request
  - `checkApprovalStatus(cibaRequestId)` — polls for CIBA response
- [ ] Create CIBA webhook endpoint (`/api/webhooks/ciba`) for Auth0 callbacks
- [ ] Create approval queue API (`/api/approvals`) for dashboard approve/reject
- [ ] Build approval queue UI (from mock: `renderApprovals`):
  - Left sidebar: request queue with search + filter (Pending/All)
  - Right panel: request detail with intent, payload, security analysis
  - Approve/Reject footer buttons
  - Banner: "Awaiting your approval — check your Auth0 Guardian app or approve below"
- [ ] Implement dual-path resolution: first response (CIBA or dashboard) wins
- [ ] Store approval requests in Vercel KV with status tracking
- [ ] Wire MCP server to wait for approval resolution before returning tool result
- [ ] Verify: trigger a write action → see CIBA push + dashboard request → approve → action executes

### Files to Create
```
src/app/dashboard/approvals/page.tsx
src/app/api/approvals/route.ts
src/app/api/webhooks/ciba/route.ts
src/lib/ciba.ts
src/components/dashboard/approval-queue.tsx
src/components/dashboard/approval-detail.tsx
```

## Phase 6: Audit Logging + Overview Dashboard
**Goal:** Every tool call logged. Overview page shows live stats.

### Tasks
- [ ] Implement `src/lib/audit.ts`:
  - `logAction(entry)` — writes to Vercel KV
  - `getAuditLog(userId, filters?)` — retrieves log entries
- [ ] Build audit log table UI (from mock: `renderLogs`)
- [ ] Build overview dashboard UI (from mock: `renderDashboard`):
  - Stats cards: actions today, pending approvals, active agents
  - Recent action queue preview
  - Universal MCP URL display
- [ ] Add audit logging to all execution paths (allow, approve, reject, block)
- [ ] Verify: perform various actions → all appear in audit log with correct status

### Files to Create
```
src/app/dashboard/logs/page.tsx
src/lib/audit.ts
src/components/dashboard/audit-table.tsx
src/components/dashboard/overview.tsx
```

## Phase 7: Polish + Demo + Submission
**Goal:** Production-ready UI, demo video, Devpost submission.

### Tasks
- [ ] UI polish pass:
  - Loading states / skeletons for all data-fetching views
  - Error states for API failures
  - Empty states for zero-data scenarios
  - Responsive layout check
  - Toast notifications for all user actions
- [ ] Add "Connect Service" placeholder flows for Jira (if time)
- [ ] Rate limit display (UI only, not enforced — documented as "coming soon")
- [ ] Context injection textarea with advisory label
- [ ] Write README.md with screenshots + architecture diagram
- [ ] Record demo video (3-5 min):
  - Connect services via Auth0
  - Create agent with policies
  - Show MCP URL in Claude Code
  - Trigger a write action → CIBA push + dashboard approval
  - Show audit log
- [ ] Submit to Devpost with all required fields
- [ ] Verify all judging criteria are addressed in submission text

### Submission Checklist
- [ ] Working demo URL (Vercel deployment)
- [ ] Demo video (uploaded or YouTube link)
- [ ] Devpost project page with description, screenshots, tech stack
- [ ] Source code (GitHub repo linked)
- [ ] Mention of Auth0 Token Vault usage (required)
