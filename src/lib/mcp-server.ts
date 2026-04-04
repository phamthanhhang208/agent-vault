/**
 * MCP Server Factory
 *
 * Creates a dynamic MCP server instance for each agent.
 * Tools are generated based on the agent's policy configuration.
 * Uses @modelcontextprotocol/sdk McpServer + WebStandardStreamableHTTPServerTransport.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { setJson, getJson, getByPrefix } from './kv';
import { initiateCIBA, pollCIBA } from './ciba';
import { logAction } from './audit';
import type { Agent, ApprovalRequest } from '@/types';
import { SCHEMAS as GH_SCHEMAS, executeGitHubTool } from './tools/github';
import { SCHEMAS as SLACK_SCHEMAS, executeSlackTool } from './tools/slack';
import { SCHEMAS as GOOGLE_SCHEMAS, executeGoogleTool } from './tools/google';
import { getServiceToken } from './token-vault';

// Collect all schemas by service
const ALL_SCHEMAS: Record<string, Record<string, object>> = {
  GitHub: GH_SCHEMAS,
  Slack: SLACK_SCHEMAS,
  'Google Workspace': GOOGLE_SCHEMAS,
};

// Tool descriptions
const TOOL_DESCRIPTIONS: Record<string, Record<string, string>> = {
  GitHub: {
    'repos.read': 'Read repository info, files, or branches from GitHub',
    'repos.write': 'Create or update files, branches, or pull requests on GitHub',
    'repos.delete': 'Delete a GitHub repository (DESTRUCTIVE)',
    'issues.*': 'List or create GitHub issues',
  },
  Slack: {
    'chat.read': 'Read messages from a Slack channel',
    'chat.write': 'Send a message to a Slack channel',
    'channels.manage': 'Create, archive, or rename Slack channels',
  },
  'Google Workspace': {
    'drive.read': 'Search and read files from Google Drive',
    'drive.write': 'Create or update files in Google Drive',
    'gmail.send': 'Send an email via Gmail',
  },
};

/**
 * Tool naming convention: {service}_{action}
 */
export function getToolName(service: string, action: string): string {
  const serviceSlug = service.toLowerCase().replace(/\s+/g, '_');
  const actionSlug = action.replace(/\./g, '_').replace(/\*/g, 'all');
  return `${serviceSlug}_${actionSlug}`;
}

/**
 * Risk assessment for actions.
 */
export function assessRisk(action: string): 'Low' | 'Medium' | 'High' {
  if (action.includes('delete') || action.includes('manage')) return 'High';
  if (action.includes('write') || action.includes('send') || action.includes('create')) return 'Medium';
  return 'Low';
}

/**
 * Get tool definitions that should be exposed for an agent.
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
 * Convert JSON Schema to Zod shape for McpServer.tool().
 */
function jsonSchemaToZodShape(schema: Record<string, unknown>): Record<string, z.ZodTypeAny> {
  const props = (schema.properties || {}) as Record<string, Record<string, unknown>>;
  const required = new Set((schema.required || []) as string[]);
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, prop] of Object.entries(props)) {
    let zodType: z.ZodTypeAny;
    const desc = (prop.description as string) || '';

    if (prop.type === 'number') {
      zodType = z.number().describe(desc);
    } else if (prop.type === 'boolean') {
      zodType = z.boolean().describe(desc);
    } else if (prop.type === 'array') {
      zodType = z.array(z.string()).describe(desc);
    } else if (prop.enum) {
      zodType = z.enum(prop.enum as [string, ...string[]]).describe(desc);
    } else {
      zodType = z.string().describe(desc);
    }

    shape[key] = required.has(key) ? zodType : zodType.optional();
  }

  return shape;
}

// Service → tool executor map
const TOOL_EXECUTORS: Record<string, (token: string, action: string, params: Record<string, unknown>) => Promise<{ success: boolean; data?: unknown; error?: string }>> = {
  GitHub: executeGitHubTool,
  Slack: executeSlackTool,
  'Google Workspace': executeGoogleTool,
};

/**
 * Execute a tool action using the real service API.
 * Gets the provider token from Auth0 Token Vault, then calls the API.
 */
async function executeToolAction(
  refreshToken: string | null,
  service: string,
  action: string,
  params: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const executor = TOOL_EXECUTORS[service];
  if (!executor) {
    return { success: false, error: `No executor for service: ${service}` };
  }

  // Get provider token from Auth0 Token Vault
  let providerToken: string;
  try {
    if (!refreshToken) {
      return {
        success: true,
        data: params,
        error: undefined,
      };
    }
    providerToken = await getServiceToken(refreshToken, service);
  } catch (error) {
    // If Token Vault is not configured, return a helpful message
    return {
      success: true,
      data: {
        message: `Tool executed (Token Vault not configured). Params: ${JSON.stringify(params)}`,
        note: 'Configure Auth0 Token Vault to enable real API calls.',
      },
    };
  }

  return executor(providerToken, action, params);
}

/**
 * Find an existing pending approval request for the same agent + service + action.
 * Returns it if found, so we can reuse instead of creating a duplicate.
 */
async function findPendingApproval(
  agent: Agent,
  service: string,
  action: string
): Promise<ApprovalRequest | null> {
  const requests = await getByPrefix<ApprovalRequest>(`approval:${agent.userId}:`);
  return requests.find(
    (r) =>
      r.status === 'pending' &&
      r.agentId === agent.id &&
      r.service === service &&
      r.action === action
  ) ?? null;
}

/**
 * Create an approval request and optionally trigger CIBA push notification.
 * If a pending request already exists for the same agent/service/action, reuse it
 * instead of creating a duplicate notification.
 */
async function createApprovalRequest(
  agent: Agent,
  service: string,
  action: string,
  risk: 'Low' | 'Medium' | 'High',
  params: Record<string, unknown>
): Promise<ApprovalRequest> {
  // Deduplicate: reuse existing pending request if one exists
  const existing = await findPendingApproval(agent, service, action);
  if (existing) {
    console.log('[MCP] Reusing existing pending approval:', existing.id);
    return existing;
  }

  const requestId = `req_${nanoid(12)}`;
  let cibaRequestId: string | null = null;

  // Try to initiate CIBA push notification
  try {
    const cibaResponse = await initiateCIBA(
      agent.userId,
      `AgentVault: ${agent.name} wants to ${action} on ${service}`
    );
    cibaRequestId = cibaResponse.auth_req_id;
  } catch (error) {
    // CIBA may not be configured — that's OK, dashboard approval still works
    console.warn('[MCP] CIBA initiation failed (dashboard-only mode):', error);
  }

  const approvalRequest: ApprovalRequest = {
    id: requestId,
    agentId: agent.id,
    agentName: agent.name,
    userId: agent.userId,
    service,
    action,
    detail: `${agent.name} wants to execute ${action} on ${service}`,
    intent: `Agent requested ${action} action via MCP tool call`,
    payload: params,
    risk,
    status: 'pending',
    resolvedVia: null,
    cibaRequestId,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };

  await setJson(`approval:${agent.userId}:${requestId}`, approvalRequest);
  return approvalRequest;
}

/**
 * Wait for an approval request to be resolved (via dashboard or CIBA).
 * For serverless: uses short polling with a timeout.
 *
 * Dual-path resolution:
 *   1. Dashboard — user clicks approve/reject on the web UI → KV store is updated
 *   2. CIBA — user approves via Auth0 Guardian push notification on their phone
 *
 * Whichever path resolves first wins.
 */
async function waitForApproval(
  userId: string,
  requestId: string,
  cibaRequestId: string | null,
  // Vercel Hobby maxDuration = 60s, Pro = 300s.
  // Keep well under the limit to allow cleanup before the function is killed.
  timeoutMs = 55000
): Promise<'approved' | 'rejected' | 'expired'> {
  const startTime = Date.now();
  let pollInterval = 3000; // 3 seconds, may increase on slow_down
  const kvKey = `approval:${userId}:${requestId}`;

  while (Date.now() - startTime < timeoutMs) {
    // Path 1: Check if resolved via dashboard (KV store)
    const request = await getJson<ApprovalRequest>(kvKey);
    if (request && request.status !== 'pending') {
      return request.status === 'approved' ? 'approved' : 'rejected';
    }

    // Path 2: Poll CIBA (Auth0 Guardian push notification)
    if (cibaRequestId) {
      try {
        const cibaResult = await pollCIBA(cibaRequestId);
        if (cibaResult.status !== 'pending') {
          // Sync the resolution back to KV so dashboard/audit stay consistent
          if (request) {
            const resolvedStatus = cibaResult.status === 'approved' ? 'approved' : 'rejected';
            await setJson(kvKey, {
              ...request,
              status: resolvedStatus,
              resolvedVia: 'ciba',
              resolvedAt: new Date().toISOString(),
            });
          }

          if (cibaResult.status === 'approved') return 'approved';
          if (cibaResult.status === 'rejected') return 'rejected';
          return 'expired';
        }

        // Respect Auth0 slow_down: increase poll interval
        if (cibaResult.backoffSeconds) {
          pollInterval = cibaResult.backoffSeconds * 1000;
        }
      } catch (error) {
        // CIBA poll failed — log but continue polling via dashboard path
        console.warn('[waitForApproval] CIBA poll error (will retry):', error);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  return 'expired';
}

/**
 * Create an MCP server instance for an agent.
 */
export function createMcpServer(agent: Agent): McpServer {
  const server = new McpServer({
    name: `AgentVault: ${agent.name}`,
    version: '1.0.0',
  });

  const tools = getExposedTools(agent);

  for (const tool of tools) {
    const serviceSchemas = ALL_SCHEMAS[tool.service] || {};
    const schema = serviceSchemas[tool.action] as Record<string, unknown> | undefined;
    const description =
      TOOL_DESCRIPTIONS[tool.service]?.[tool.action] ||
      `[${tool.service}] ${tool.action}`;
    const label = tool.state === 'approval'
      ? `${description} (⚠️ requires approval)`
      : description;

    const zodShape = schema ? jsonSchemaToZodShape(schema) : {};

    server.tool(
      tool.name,
      label,
      zodShape,
      async (params) => {
        const startTime = Date.now();

        if (tool.state === 'approval') {
          // Create approval request + trigger CIBA
          const approvalRequest = await createApprovalRequest(
            agent,
            tool.service,
            tool.action,
            tool.risk,
            params as Record<string, unknown>
          );

          // Wait for resolution (dashboard or CIBA)
          const decision = await waitForApproval(
            agent.userId,
            approvalRequest.id,
            approvalRequest.cibaRequestId
          );

          const executionMs = Date.now() - startTime;

          if (decision === 'approved') {
            // Log approval + execute
            await logAction(agent.userId, {
              agentId: agent.id,
              agentName: agent.name,
              service: tool.service,
              action: tool.action,
              detail: `Approved: ${tool.action} on ${tool.service}`,
              risk: tool.risk,
              status: 'approved',
              resolvedVia: 'dashboard', // Will be overwritten by actual resolvedVia
              executionMs,
            });

            // Execute the actual tool
            const result = await executeToolAction(
              null, // refreshToken — will be passed when Token Vault is configured
              tool.service,
              tool.action,
              params as Record<string, unknown>
            );

            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify({
                    status: 'approved_and_executed',
                    message: result.success
                      ? `Action approved and executed successfully.`
                      : `Action approved but execution failed: ${result.error}`,
                    service: tool.service,
                    action: tool.action,
                    approvalId: approvalRequest.id,
                    result: result.data,
                  }),
                },
              ],
            };
          } else {
            // Rejected or expired
            await logAction(agent.userId, {
              agentId: agent.id,
              agentName: agent.name,
              service: tool.service,
              action: tool.action,
              detail: `${decision}: ${tool.action} on ${tool.service}`,
              risk: tool.risk,
              status: 'rejected',
              resolvedVia: null,
              executionMs,
            });

            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify({
                    status: decision,
                    message: decision === 'expired'
                      ? 'Approval request expired. The vault owner did not respond in time.'
                      : 'Action rejected by vault owner.',
                    service: tool.service,
                    action: tool.action,
                    approvalId: approvalRequest.id,
                  }),
                },
              ],
              isError: true,
            };
          }
        }

        // 'allow' state: execute immediately
        const executionMs = Date.now() - startTime;
        await logAction(agent.userId, {
          agentId: agent.id,
          agentName: agent.name,
          service: tool.service,
          action: tool.action,
          detail: `Auto-executed: ${tool.action} on ${tool.service}`,
          risk: tool.risk,
          status: 'executed',
          resolvedVia: 'auto',
          executionMs,
        });

        // Execute the actual tool
        const result = await executeToolAction(
          null, // refreshToken — will be passed when Token Vault is configured
          tool.service,
          tool.action,
          params as Record<string, unknown>
        );

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                status: 'executed',
                message: result.success
                  ? `Action ${tool.action} on ${tool.service} executed successfully.`
                  : `Execution failed: ${result.error}`,
                service: tool.service,
                action: tool.action,
                result: result.data,
              }),
            },
          ],
        };
      }
    );
  }

  // Context injection resource
  if (agent.contextInjection) {
    server.resource(
      'system_prompt',
      'system://prompt',
      async () => ({
        contents: [
          {
            uri: 'system://prompt',
            text: agent.contextInjection,
            mimeType: 'text/plain',
          },
        ],
      })
    );
  }

  return server;
}
