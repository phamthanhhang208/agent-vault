/**
 * Demo Mode — Seed Data
 *
 * When DEMO_MODE=true, the app uses this data instead of Vercel KV.
 * This allows judges to explore the full UI without Auth0/KV setup.
 */

import type { Agent, VaultConnection, ApprovalRequest, AuditEntry } from '@/types';

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export const DEMO_USER_ID = 'auth0|demo_user_123';

export const DEMO_CONNECTIONS: VaultConnection[] = [
  {
    service: 'GitHub',
    auth0ConnectionId: 'github',
    scopes: ['repo', 'read:org', 'user:email', 'read:discussion'],
    connectedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    lastUsed: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    service: 'Slack',
    auth0ConnectionId: 'slack',
    scopes: ['chat:write', 'channels:read', 'users:read'],
    connectedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    lastUsed: new Date(Date.now() - 7200000).toISOString(),
  },
];

export const DEMO_AGENTS: (Agent & { _mcpUrl: string; _vaultToken: string })[] = [
  {
    id: 'agt_demo_devops',
    userId: DEMO_USER_ID,
    name: 'DevOps Copilot',
    description: 'Code review, issue management, and deployment automation',
    serverId: 'srv_demo_devops',
    status: 'active',
    rateLimit: 1000,
    contextInjection: 'Always create issues in the backlog project. Follow conventional commits.',
    policies: [
      {
        service: 'GitHub',
        rules: [
          { action: 'repos.read', state: 'allow' },
          { action: 'repos.write', state: 'approval' },
          { action: 'repos.delete', state: 'block' },
          { action: 'issues.*', state: 'allow' },
        ],
      },
      {
        service: 'Slack',
        rules: [
          { action: 'chat.read', state: 'allow' },
          { action: 'chat.write', state: 'approval' },
          { action: 'channels.manage', state: 'block' },
        ],
      },
    ],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    _mcpUrl: 'https://agentvault.vercel.app/api/mcp/srv_demo_devops',
    _vaultToken: 'avt_demo_devops_token_xxxxxxxxxxxxx',
  },
  {
    id: 'agt_demo_assistant',
    userId: DEMO_USER_ID,
    name: 'Personal Assistant',
    description: 'Email drafting and calendar management',
    serverId: 'srv_demo_assistant',
    status: 'active',
    rateLimit: 500,
    contextInjection: '',
    policies: [
      {
        service: 'GitHub',
        rules: [
          { action: 'repos.read', state: 'allow' },
          { action: 'repos.write', state: 'block' },
          { action: 'repos.delete', state: 'block' },
          { action: 'issues.*', state: 'block' },
        ],
      },
    ],
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    _mcpUrl: 'https://agentvault.vercel.app/api/mcp/srv_demo_assistant',
    _vaultToken: 'avt_demo_assistant_token_xxxxxxxxx',
  },
];

const now = Date.now();

export const DEMO_APPROVALS: ApprovalRequest[] = [
  {
    id: 'req_demo_pending1',
    agentId: 'agt_demo_devops',
    agentName: 'DevOps Copilot',
    userId: DEMO_USER_ID,
    service: 'GitHub',
    action: 'repos.write',
    detail: 'DevOps Copilot wants to create file README.md in user/new-project',
    intent: 'Creating initial README with project structure and setup instructions based on the conversation context.',
    payload: {
      owner: 'phamthanhhang208',
      repo: 'new-project',
      path: 'README.md',
      content: '# New Project\n\nA Next.js application...',
      message: 'docs: add initial README',
    },
    risk: 'Medium',
    status: 'pending',
    resolvedVia: null,
    cibaRequestId: 'ciba_demo_123',
    createdAt: new Date(now - 120000).toISOString(),
    resolvedAt: null,
  },
  {
    id: 'req_demo_pending2',
    agentId: 'agt_demo_devops',
    agentName: 'DevOps Copilot',
    userId: DEMO_USER_ID,
    service: 'Slack',
    action: 'chat.write',
    detail: 'DevOps Copilot wants to send a message to #deployments',
    intent: 'Notifying the team about the successful deployment of v2.1.0 to production.',
    payload: {
      channel: '#deployments',
      text: '🚀 v2.1.0 deployed to production. All health checks passing.',
    },
    risk: 'Medium',
    status: 'pending',
    resolvedVia: null,
    cibaRequestId: 'ciba_demo_456',
    createdAt: new Date(now - 60000).toISOString(),
    resolvedAt: null,
  },
  {
    id: 'req_demo_approved1',
    agentId: 'agt_demo_devops',
    agentName: 'DevOps Copilot',
    userId: DEMO_USER_ID,
    service: 'GitHub',
    action: 'repos.write',
    detail: 'DevOps Copilot created file .github/workflows/ci.yml',
    intent: 'Setting up CI pipeline with linting, type-checking, and tests.',
    payload: {
      owner: 'phamthanhhang208',
      repo: 'agent-vault',
      path: '.github/workflows/ci.yml',
      content: 'name: CI\non: [push, pull_request]...',
      message: 'ci: add GitHub Actions workflow',
    },
    risk: 'Medium',
    status: 'approved',
    resolvedVia: 'dashboard',
    cibaRequestId: null,
    createdAt: new Date(now - 3600000).toISOString(),
    resolvedAt: new Date(now - 3540000).toISOString(),
  },
  {
    id: 'req_demo_rejected1',
    agentId: 'agt_demo_devops',
    agentName: 'DevOps Copilot',
    userId: DEMO_USER_ID,
    service: 'Slack',
    action: 'chat.write',
    detail: 'DevOps Copilot wanted to send a message to #general',
    intent: 'Announcing a breaking change to the API.',
    payload: {
      channel: '#general',
      text: '⚠️ Breaking change: API v1 endpoints are being deprecated...',
    },
    risk: 'Medium',
    status: 'rejected',
    resolvedVia: 'ciba',
    cibaRequestId: 'ciba_demo_789',
    createdAt: new Date(now - 7200000).toISOString(),
    resolvedAt: new Date(now - 7140000).toISOString(),
  },
];

export const DEMO_AUDIT: AuditEntry[] = [
  {
    id: 'aud_demo_1',
    agentId: 'agt_demo_devops',
    agentName: 'DevOps Copilot',
    service: 'GitHub',
    action: 'repos.read',
    detail: 'Auto-executed: repos.read on GitHub',
    risk: 'Low',
    status: 'executed',
    resolvedVia: 'auto',
    executionMs: 234,
    timestamp: new Date(now - 300000).toISOString(),
  },
  {
    id: 'aud_demo_2',
    agentId: 'agt_demo_devops',
    agentName: 'DevOps Copilot',
    service: 'GitHub',
    action: 'issues.*',
    detail: 'Auto-executed: issues.list on GitHub',
    risk: 'Low',
    status: 'executed',
    resolvedVia: 'auto',
    executionMs: 412,
    timestamp: new Date(now - 600000).toISOString(),
  },
  {
    id: 'aud_demo_3',
    agentId: 'agt_demo_devops',
    agentName: 'DevOps Copilot',
    service: 'GitHub',
    action: 'repos.write',
    detail: 'Approved: repos.write on GitHub',
    risk: 'Medium',
    status: 'approved',
    resolvedVia: 'dashboard',
    executionMs: 62000,
    timestamp: new Date(now - 3540000).toISOString(),
  },
  {
    id: 'aud_demo_4',
    agentId: 'agt_demo_devops',
    agentName: 'DevOps Copilot',
    service: 'Slack',
    action: 'chat.write',
    detail: 'Rejected: chat.write on Slack',
    risk: 'Medium',
    status: 'rejected',
    resolvedVia: 'ciba',
    executionMs: 58000,
    timestamp: new Date(now - 7140000).toISOString(),
  },
  {
    id: 'aud_demo_5',
    agentId: 'agt_demo_devops',
    agentName: 'DevOps Copilot',
    service: 'GitHub',
    action: 'repos.read',
    detail: 'Auto-executed: repos.read on GitHub',
    risk: 'Low',
    status: 'executed',
    resolvedVia: 'auto',
    executionMs: 189,
    timestamp: new Date(now - 14400000).toISOString(),
  },
  {
    id: 'aud_demo_6',
    agentId: 'agt_demo_assistant',
    agentName: 'Personal Assistant',
    service: 'GitHub',
    action: 'repos.read',
    detail: 'Auto-executed: repos.read on GitHub',
    risk: 'Low',
    status: 'executed',
    resolvedVia: 'auto',
    executionMs: 156,
    timestamp: new Date(now - 18000000).toISOString(),
  },
];
