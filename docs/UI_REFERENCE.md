# UI Reference — AgentVault

## Design System

### Color Palette
| Token | Tailwind Class | Usage |
|---|---|---|
| Background (primary) | `bg-slate-950` | Main app background, modals |
| Background (card) | `bg-slate-900` | Cards, panels, sidebar items |
| Background (input) | `bg-slate-950` | Inputs, code blocks |
| Border | `border-slate-800` | All borders, dividers |
| Text (heading) | `text-white` | Headings, emphasis |
| Text (body) | `text-slate-300` | Body text |
| Text (secondary) | `text-slate-400` / `text-slate-500` | Labels, descriptions |
| Accent (primary) | `bg-indigo-600` / `text-indigo-400` | Buttons, links, active states |
| Accent shadow | `shadow-indigo-600/20` | Button glow effect |
| Status: allow/approved | `text-emerald-500` / `bg-emerald-500/10` | Allow badges, approved states |
| Status: approval/pending | `text-amber-500` / `bg-amber-500/10` | Approval-required, pending states |
| Status: block/rejected | `text-red-500` / `bg-red-500/10` | Block badges, rejected states |

### Service Colors
| Service | Icon BG | Text Color |
|---|---|---|
| GitHub | `bg-slate-900` | `text-white` |
| Slack | `bg-purple-600` | `text-purple-400` |
| Google Workspace | `bg-blue-500` | `text-blue-400` |

### Border Radius
- Major panels/cards: `rounded-2xl`
- Buttons, inputs: `rounded-lg` or `rounded-xl`
- Badges: `rounded-full`

### Typography
- Headings: `font-bold`, sizes from `text-3xl` (page title) to `text-sm` (card headings)
- Labels: `text-[10px] font-bold uppercase tracking-widest text-slate-500`
- Code/URLs: `font-mono` with `text-indigo-400`
- Body: `text-sm text-slate-400`

### Animations
- Page transitions: `animate-in fade-in duration-500`
- Slide-ins: `slide-in-from-top-4`, `slide-in-from-bottom-4`, `slide-in-from-right-4`
- Modals: `animate-in zoom-in-95 duration-200`
- Pending status: `animate-pulse` on indicator dots

## Pages & Components

### 1. Dashboard Shell (`dashboard/layout.tsx`)
- Fixed sidebar (w-64) + main content area
- Sidebar contains: logo, nav items, plan badge
- Main area has `overflow-y-auto` (except approvals which is `overflow-hidden`)

### 2. Overview (`dashboard/page.tsx`)
Maps to: `renderDashboard()` in mock

Sections:
- **Universal MCP URL banner** — gradient card with copy-able HTTPS URL
- **Stats cards** (3-column grid): actions today, pending approvals (clickable), active agents (clickable)
- **Recent Action Queue** — last 4 log entries with "Review Action" buttons for pending items

### 3. Action Queue / Approvals (`dashboard/approvals/page.tsx`)
Maps to: `renderApprovals()` in mock

**Full-height split layout (no outer scroll):**
- Left panel (w-80): search input, Pending/All filter tabs, scrollable request list
- Right panel: selected request detail

**Request detail includes:**
- Header: request ID, agent name, service, status badge
- Agent Intent section (italic serif quote)
- JSON Payload viewer (terminal-style code block)
- Security Analysis panel (risk level, vault execution rules)
- **CIBA notice banner**: "Awaiting your approval — check your Auth0 Guardian app or approve below"
- Sticky footer with Reject / Approve & Execute buttons (only for pending)

### 4. Vault Connections (`dashboard/connections/page.tsx`)
Maps to: `renderConnections()` in mock

- Header with "Connect Service" button
- 3-column card grid for connected services
- "Add Integration" placeholder card (dashed border)
- Connection settings modal (triggered by gear icon):
  - OAuth scopes list
  - Active agents using this connection
  - "Revoke Access & Disconnect" danger button

### 5. Agents List (`dashboard/agents/page.tsx`)
Maps to: `renderAgentsList()` in mock

- Header with "New Agent Connection" button
- 2-column card grid for agents
- Each card: name, status, description, MCP URL (copy-able), enabled integrations icons, rate limit, "Manage Policy" link
- Empty state with CTA

### 6. Create Agent Wizard (`dashboard/agents/new/page.tsx`)
Maps to: `renderCreateAgent()` in mock

**Sticky header with back button + title**

Three numbered steps (vertical scroll):
1. **Agent Identity** — name (required), description (optional)
2. **Connect Vault Services** — 3-column selectable cards for GitHub/Slack/Google
3. **Configure Policy Matrix** — appears after selecting services. Per-service expandable section with per-action allow/approval/block toggle buttons

**Sticky footer** with Cancel and "Generate MCP Server URL" button (disabled until name is filled)

### 7. Agent Detail (`dashboard/agents/[id]/page.tsx`)
Maps to: `renderAgentDetail()` in mock

**Sticky header with back button, agent name, status, "View Audit Logs" button**

Sections:
- MCP Endpoint URL card (copy-able, status, rate limit display)
- Granular Policy Matrix — same as create wizard step 3 but for editing live policies
- Advanced Context Injection textarea with advisory label: "Advisory instructions — the agent is encouraged but not forced to follow these"
- "Add Vault Service" button to expand integrations

### 8. Audit Logs (`dashboard/logs/page.tsx`)
Maps to: `renderLogs()` in mock

- Header with "Export CSV" button
- Full-width table: timestamp, agent, service:action, risk level badge, status badge

### 9. Toast Notifications
Maps to: `showToast` state in mock

- Fixed bottom-right position
- Success (emerald) or error (red) variants
- Auto-dismiss after 3 seconds
- Slide-in-from-bottom animation

## URL Correction Note

All MCP URLs in the UI must use `https://` not `mcp://`.
Format: `https://agentvault.vercel.app/mcp/{serverId}`

## Rate Limit Display Note

Rate limit (e.g., "1000/hr") is shown in the UI but not enforced server-side for v1. No input field needed — it's a static display value. If there's time, add a dropdown selector that saves to KV but doesn't enforce.
