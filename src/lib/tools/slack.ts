/**
 * Slack Tool Implementations
 */

const SLACK_API = 'https://slack.com/api';

interface SlackToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

async function slackFetch(
  token: string,
  method: string,
  body?: Record<string, unknown>
): Promise<SlackToolResult> {
  try {
    const response = await fetch(`${SLACK_API}/${method}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    if (!data.ok) {
      return { success: false, error: `Slack API error: ${data.error}` };
    }
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: `Slack API request failed: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

/** chat.read — Read messages from a channel */
export async function chatRead(
  token: string,
  params: { channel: string; limit?: number }
): Promise<SlackToolResult> {
  return slackFetch(token, 'conversations.history', {
    channel: params.channel,
    limit: params.limit || 20,
  });
}

/** chat.write — Send a message to a channel */
export async function chatWrite(
  token: string,
  params: { channel: string; text: string }
): Promise<SlackToolResult> {
  return slackFetch(token, 'chat.postMessage', {
    channel: params.channel,
    text: params.text,
  });
}

/** channels.manage — Create, archive, or rename channels (HIGH RISK) */
export async function channelsManage(
  token: string,
  params: { action: 'create' | 'archive' | 'rename'; channel?: string; name?: string }
): Promise<SlackToolResult> {
  switch (params.action) {
    case 'create':
      return slackFetch(token, 'conversations.create', { name: params.name });
    case 'archive':
      return slackFetch(token, 'conversations.archive', { channel: params.channel });
    case 'rename':
      return slackFetch(token, 'conversations.rename', {
        channel: params.channel,
        name: params.name,
      });
    default:
      return { success: false, error: `Unknown channel action: ${params.action}` };
  }
}

/** Tool executor */
export async function executeSlackTool(
  token: string,
  action: string,
  params: Record<string, unknown>
): Promise<SlackToolResult> {
  const p = params as Record<string, string>;
  switch (action) {
    case 'chat.read':
      return chatRead(token, { channel: p.channel, limit: Number(p.limit) || undefined });
    case 'chat.write':
      return chatWrite(token, { channel: p.channel, text: p.text });
    case 'channels.manage':
      return channelsManage(token, {
        action: p.action as 'create' | 'archive' | 'rename',
        channel: p.channel,
        name: p.name,
      });
    default:
      return { success: false, error: `Unknown Slack action: ${action}` };
  }
}

export const SCHEMAS = {
  'chat.read': {
    type: 'object' as const,
    properties: {
      channel: { type: 'string', description: 'Channel ID or name (e.g. #general)' },
      limit: { type: 'number', description: 'Max messages to return (default: 20)' },
    },
    required: ['channel'],
  },
  'chat.write': {
    type: 'object' as const,
    properties: {
      channel: { type: 'string', description: 'Channel ID or name to post in' },
      text: { type: 'string', description: 'Message text (supports Slack markdown)' },
    },
    required: ['channel', 'text'],
  },
  'channels.manage': {
    type: 'object' as const,
    properties: {
      action: { type: 'string', enum: ['create', 'archive', 'rename'], description: 'Channel management action' },
      channel: { type: 'string', description: 'Channel ID (for archive/rename)' },
      name: { type: 'string', description: 'Channel name (for create/rename)' },
    },
    required: ['action'],
  },
};
