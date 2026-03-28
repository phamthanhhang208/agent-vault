// ============================================
// AgentVault — Shared Types
// ============================================

// --- Policy ---

export type PolicyState = 'allow' | 'approval' | 'block';

export interface PolicyRule {
  action: string;        // e.g. 'repos.read', 'chat.write', 'gmail.send'
  state: PolicyState;
}

export interface Policy {
  service: ServiceName;
  rules: PolicyRule[];
}

// --- Services ---

export type ServiceName = 'GitHub' | 'Slack' | 'Google Workspace' | 'Jira';

export interface VaultConnection {
  service: ServiceName;
  auth0ConnectionId: string;
  scopes: string[];
  connectedAt: string;
  lastUsed: string;
}

// --- Agent ---

export interface Agent {
  id: string;
  userId: string;
  name: string;
  description: string;
  serverId: string;          // unique slug for MCP URL path
  status: 'active' | 'paused';
  rateLimit: number;         // display-only for v1
  contextInjection: string;  // advisory system prompt
  policies: Policy[];
  createdAt: string;
}

// --- Approval ---

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type ApprovalChannel = 'dashboard' | 'ciba';

export interface ApprovalRequest {
  id: string;
  agentId: string;
  agentName: string;
  userId: string;
  service: string;
  action: string;
  detail: string;              // human-readable description
  intent: string;              // agent's stated reasoning
  payload: Record<string, unknown>;
  risk: RiskLevel;
  status: ApprovalStatus;
  resolvedVia: ApprovalChannel | null;
  cibaRequestId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

// --- Audit ---

export type AuditStatus = 'executed' | 'approved' | 'rejected' | 'blocked';

export interface AuditEntry {
  id: string;
  agentId: string;
  agentName: string;
  service: string;
  action: string;
  detail: string;
  risk: RiskLevel;
  status: AuditStatus;
  resolvedVia: 'auto' | ApprovalChannel | null;
  executionMs: number;
  timestamp: string;
}

// --- API Response ---

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// --- Dashboard Store ---

export type DashboardTab =
  | 'dashboard'
  | 'approvals'
  | 'connections'
  | 'agents'
  | 'create_agent'
  | 'agent_detail'
  | 'logs';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error';
}

// --- Service Templates (for default policy rules) ---

export interface ServiceTemplate {
  service: ServiceName;
  defaultRules: PolicyRule[];
  icon: string;  // lucide icon name
  color: string; // tailwind bg class
}

export const SERVICE_TEMPLATES: Record<string, ServiceTemplate> = {
  GitHub: {
    service: 'GitHub',
    defaultRules: [
      { action: 'repos.read', state: 'allow' },
      { action: 'repos.write', state: 'approval' },
      { action: 'repos.delete', state: 'block' },
      { action: 'issues.*', state: 'allow' },
    ],
    icon: 'Github',
    color: 'bg-slate-900',
  },
  Slack: {
    service: 'Slack',
    defaultRules: [
      { action: 'chat.read', state: 'allow' },
      { action: 'chat.write', state: 'approval' },
      { action: 'channels.manage', state: 'block' },
    ],
    icon: 'Slack',
    color: 'bg-purple-600',
  },
  'Google Workspace': {
    service: 'Google Workspace',
    defaultRules: [
      { action: 'drive.read', state: 'allow' },
      { action: 'drive.write', state: 'approval' },
      { action: 'gmail.send', state: 'approval' },
    ],
    icon: 'Mail',
    color: 'bg-blue-500',
  },
};
