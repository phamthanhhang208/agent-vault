/**
 * MCP Server Factory
 *
 * Creates a dynamic MCP server instance for each agent.
 * Tools are generated based on the agent's policy configuration.
 *
 * TODO: Phase 4 — implement with @modelcontextprotocol/sdk
 */

import type { Agent, Policy, PolicyRule } from '@/types';

/**
 * Tool naming convention: {service}_{action}
 * e.g. github_repos_read, slack_chat_write, google_gmail_send
 */
export function getToolName(service: string, action: string): string {
  const serviceSlug = service.toLowerCase().replace(/\s+/g, '_');
  const actionSlug = action.replace(/\./g, '_').replace(/\*/g, 'all');
  return `${serviceSlug}_${actionSlug}`;
}

/**
 * Risk assessment for actions.
 * Used in approval queue UI and audit logging.
 */
export function assessRisk(action: string): 'Low' | 'Medium' | 'High' {
  if (action.includes('delete') || action.includes('manage')) return 'High';
  if (action.includes('write') || action.includes('send') || action.includes('create')) return 'Medium';
  return 'Low';
}

/**
 * Get tool definitions that should be exposed for an agent.
 * Blocked actions are excluded entirely.
 */
export function getExposedTools(agent: Agent): Array<{
  name: string;
  service: string;
  action: string;
  state: 'allow' | 'approval';
  risk: 'Low' | 'Medium' | 'High';
}> {
  const tools: Array<{
    name: string;
    service: string;
    action: string;
    state: 'allow' | 'approval';
    risk: 'Low' | 'Medium' | 'High';
  }> = [];

  for (const policy of agent.policies) {
    for (const rule of policy.rules) {
      if (rule.state === 'block') continue;

      tools.push({
        name: getToolName(policy.service, rule.action),
        service: policy.service,
        action: rule.action,
        state: rule.state as 'allow' | 'approval',
        risk: assessRisk(rule.action),
      });
    }
  }

  return tools;
}

/**
 * Create an MCP server instance for an agent.
 * Returns a handler function for JSON-RPC requests.
 *
 * TODO: Phase 4 — full implementation with @modelcontextprotocol/sdk
 */
export async function createMcpServerHandler(agent: Agent) {
  const tools = getExposedTools(agent);

  // Stub: return a basic handler that responds to tools/list
  return async (jsonRpcRequest: { method: string; id?: string | number; params?: unknown }) => {
    switch (jsonRpcRequest.method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id: jsonRpcRequest.id,
          result: {
            protocolVersion: '2025-03-26',
            capabilities: {
              tools: { listChanged: false },
              resources: agent.contextInjection ? { listChanged: false } : undefined,
            },
            serverInfo: {
              name: `AgentVault: ${agent.name}`,
              version: '1.0.0',
            },
          },
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id: jsonRpcRequest.id,
          result: {
            tools: tools.map((t) => ({
              name: t.name,
              description: `[${t.service}] ${t.action} (${t.state === 'approval' ? 'requires approval' : 'auto-execute'})`,
              inputSchema: {
                type: 'object',
                properties: {},
                // TODO: Phase 4 — add proper input schemas per tool
              },
            })),
          },
        };

      case 'tools/call':
        return {
          jsonrpc: '2.0',
          id: jsonRpcRequest.id,
          error: {
            code: -32603,
            message: 'Tool execution not yet implemented. Coming in Phase 4.',
          },
        };

      default:
        return {
          jsonrpc: '2.0',
          id: jsonRpcRequest.id,
          error: {
            code: -32601,
            message: `Method not found: ${jsonRpcRequest.method}`,
          },
        };
    }
  };
}
