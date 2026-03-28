# MCP Server Implementation — AgentVault

## Overview

Each agent in AgentVault gets a unique MCP Streamable HTTP endpoint:

```
https://agentvault.vercel.app/mcp/{serverId}
```

This endpoint speaks the MCP protocol over HTTP, allowing any MCP-compatible client (Claude Code, Cursor, OpenClaw, etc.) to connect and use tools.

## Transport: Streamable HTTP

MCP Streamable HTTP uses standard HTTPS with two request patterns:

1. **POST** — client sends JSON-RPC request, server returns JSON-RPC response
2. **GET with `Accept: text/event-stream`** — server pushes events via SSE (for long-running operations like approval waits)

### Next.js API Route Structure

```typescript
// src/app/api/mcp/[serverId]/route.ts

export async function POST(req: Request, { params }: { params: { serverId: string } }) {
  // 1. Validate bearer token → resolve to userId + agentId
  // 2. Load agent config from Vercel KV
  // 3. Create MCP server with dynamic tools
  // 4. Handle JSON-RPC request
  // 5. Return JSON-RPC response
}

export async function GET(req: Request, { params }: { params: { serverId: string } }) {
  // SSE endpoint for streaming responses (e.g., waiting for approval)
  // Used when a tool call is pending CIBA approval
}
```

## Authentication

The MCP endpoint uses a bearer token to identify the user and agent:

```
Authorization: Bearer {vaultToken}
```

The `vaultToken` is generated when the agent is created and maps to:
- `userId` — which user owns this agent
- `agentId` — which agent config to use

For the hackathon, this can be a simple signed JWT or a random token stored in KV.

## Dynamic Tool Generation

Tools are generated at connection time based on the agent's policy config:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

function createMcpServer(agent: Agent): McpServer {
  const server = new McpServer({
    name: `AgentVault: ${agent.name}`,
    version: '1.0.0',
  });

  for (const policy of agent.policies) {
    for (const rule of policy.rules) {
      if (rule.state === 'block') continue; // blocked = invisible

      const toolName = `${policy.service.toLowerCase().replace(/\s+/g, '_')}_${rule.action.replace(/\./g, '_')}`;

      server.tool(
        toolName,
        getToolDescription(policy.service, rule.action),
        getToolInputSchema(policy.service, rule.action),
        async (params) => {
          if (rule.state === 'approval') {
            return await handleApprovalRequired(agent, policy, rule, params);
          }
          return await executeAction(agent, policy, rule, params);
        }
      );
    }
  }

  // Expose context injection as a resource (advisory only)
  if (agent.contextInjection) {
    server.resource(
      'system_prompt',
      'Advisory instructions from the vault owner',
      async () => ({
        contents: [{
          text: agent.contextInjection,
          mimeType: 'text/plain',
        }]
      })
    );
  }

  return server;
}
```

## Tool Definitions by Service

### GitHub
| Action | Tool Name | Description | Input Schema |
|---|---|---|---|
| `repos.read` | `github_repos_read` | Read repository info, files, branches | `{ owner: string, repo: string, path?: string }` |
| `repos.write` | `github_repos_write` | Create/update files, branches, PRs | `{ owner: string, repo: string, path: string, content: string, message: string }` |
| `repos.delete` | `github_repos_delete` | Delete a repository | `{ owner: string, repo: string }` |
| `issues.*` | `github_issues_list` / `github_issues_create` | List, create, update issues | `{ owner: string, repo: string, title?: string, body?: string }` |

### Slack
| Action | Tool Name | Description | Input Schema |
|---|---|---|---|
| `chat.read` | `slack_chat_read` | Read messages from channels | `{ channel: string, limit?: number }` |
| `chat.write` | `slack_chat_write` | Send messages to channels | `{ channel: string, text: string }` |
| `channels.manage` | `slack_channels_manage` | Create/archive/rename channels | `{ action: string, channel: string, name?: string }` |

### Google Workspace
| Action | Tool Name | Description | Input Schema |
|---|---|---|---|
| `drive.read` | `google_drive_read` | Search and read files from Drive | `{ query?: string, fileId?: string }` |
| `drive.write` | `google_drive_write` | Create/update files in Drive | `{ name: string, content: string, mimeType?: string }` |
| `gmail.send` | `google_gmail_send` | Send an email | `{ to: string, subject: string, body: string, attachments?: string[] }` |

## Execution Flow

### Allow — Immediate Execution
```typescript
async function executeAction(agent, policy, rule, params) {
  // 1. Get OAuth token from Auth0 Token Vault
  const token = await tokenVault.getToken({
    userId: agent.userId,
    connection: getConnectionName(policy.service),
  });

  // 2. Call the third-party API
  const result = await callServiceAPI(policy.service, rule.action, params, token.access_token);

  // 3. Log to audit trail
  await audit.log({
    agentId: agent.id,
    service: policy.service,
    action: rule.action,
    status: 'executed',
    resolvedVia: 'auto',
  });

  // 4. Return result to agent
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
}
```

### Approval Required — CIBA + Dashboard Dual-Path
```typescript
async function handleApprovalRequired(agent, policy, rule, params) {
  // 1. Create pending approval request
  const requestId = generateId();
  await kv.set(`approval:${requestId}`, {
    id: requestId,
    agentId: agent.id,
    userId: agent.userId,
    service: policy.service,
    action: rule.action,
    payload: params,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });

  // 2. Trigger CIBA push notification
  const cibaResponse = await ciba.initiateRequest({
    loginHint: { sub: agent.userId },
    bindingMessage: `AgentVault: ${agent.name} wants to ${rule.action} on ${policy.service}`,
  });

  // 3. Update request with CIBA reference
  await kv.set(`approval:${requestId}`, {
    ...request,
    cibaRequestId: cibaResponse.auth_req_id,
  });

  // 4. Poll for resolution (CIBA or dashboard, whichever comes first)
  const decision = await waitForResolution(requestId, cibaResponse.auth_req_id);

  if (decision === 'approved') {
    return await executeAction(agent, policy, rule, params);
  } else {
    return {
      content: [{ type: 'text', text: `Action rejected by vault owner.` }],
      isError: true,
    };
  }
}
```

## Client Configuration Examples

### Claude Code (`~/.claude/mcp.json`)
```json
{
  "mcpServers": {
    "agentvault-devops": {
      "url": "https://agentvault.vercel.app/mcp/srv_8291klns",
      "headers": {
        "Authorization": "Bearer {vaultToken}"
      }
    }
  }
}
```

### Cursor (MCP settings)
```json
{
  "name": "AgentVault DevOps",
  "transport": "streamable-http",
  "url": "https://agentvault.vercel.app/mcp/srv_8291klns",
  "headers": {
    "Authorization": "Bearer {vaultToken}"
  }
}
```

## Risk Assessment

Each tool call is automatically assigned a risk level:

| Risk | Criteria | Example |
|---|---|---|
| Low | Read-only operations | `repos.read`, `chat.read`, `drive.read` |
| Medium | Write operations that are reversible | `chat.write`, `gmail.send`, `issues.create` |
| High | Destructive or irreversible operations | `repos.delete`, `channels.manage` |

Risk level is used in the approval queue UI and audit log for prioritization.
