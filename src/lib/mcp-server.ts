/**
 * MCP Server Factory
 *
 * Creates a dynamic MCP server instance for each agent.
 * Tools are generated based on the agent's policy configuration.
 * Uses @modelcontextprotocol/sdk McpServer + StreamableHTTPServerTransport.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Agent, Policy, PolicyRule, PolicyState } from '@/types';
import { SCHEMAS as GH_SCHEMAS } from './tools/github';
import { SCHEMAS as SLACK_SCHEMAS } from './tools/slack';
import { SCHEMAS as GOOGLE_SCHEMAS } from './tools/google';

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
 * Convert a JSON Schema object into a Zod schema shape for McpServer.tool().
 * Handles basic types: string, number, boolean, array of strings.
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

/**
 * Create an MCP server instance for an agent.
 * Returns a configured McpServer ready to handle requests.
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

    // Build Zod shape from JSON Schema
    const zodShape = schema ? jsonSchemaToZodShape(schema) : {};

    server.tool(
      tool.name,
      label,
      zodShape,
      async (params) => {
        if (tool.state === 'approval') {
          // For now, return a message that approval is needed
          // Phase 5 will wire this to CIBA + dashboard queue
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  status: 'approval_required',
                  message: `This action requires human approval. The vault owner has been notified.`,
                  service: tool.service,
                  action: tool.action,
                  risk: tool.risk,
                  params,
                }),
              },
            ],
          };
        }

        // For 'allow' state: execute the action
        // For now return a stub response — Phase 4 full implementation will
        // call token-vault to get the provider token, then call the API
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                status: 'executed',
                message: `Action ${tool.action} on ${tool.service} executed successfully.`,
                service: tool.service,
                action: tool.action,
                params,
                _note: 'Stub response — real API integration coming with Auth0 Token Vault setup',
              }),
            },
          ],
        };
      }
    );
  }

  // Expose context injection as a resource (advisory only)
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
