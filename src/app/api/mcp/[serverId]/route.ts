import { NextResponse } from 'next/server';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { getJson } from '@/lib/kv';
import { createMcpServer } from '@/lib/mcp-server';
import type { Agent } from '@/types';

interface ServerMapping {
  agentId: string;
  userId: string;
}

interface TokenMapping {
  serverId: string;
  agentId: string;
  userId: string;
}

/**
 * Resolve the agent from a request:
 * 1. Check for Bearer token → look up in token:* KV
 * 2. Fall back to serverId → look up in server:* KV
 */
async function resolveAgent(
  serverId: string,
  authHeader: string | null
): Promise<Agent | null> {
  let userId: string | null = null;
  let agentId: string | null = null;

  // Try bearer token first
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const tokenMapping = await getJson<TokenMapping>(`token:${token}`);
    if (tokenMapping && tokenMapping.serverId === serverId) {
      userId = tokenMapping.userId;
      agentId = tokenMapping.agentId;
    }
  }

  // Fall back to server mapping
  if (!userId || !agentId) {
    const serverMapping = await getJson<ServerMapping>(`server:${serverId}`);
    if (!serverMapping) return null;
    userId = serverMapping.userId;
    agentId = serverMapping.agentId;
  }

  // Load agent config
  const agent = await getJson<Agent>(`agent:${userId}:${agentId}`);
  return agent;
}

/**
 * Create a transport + server and handle a request.
 * Each request gets a fresh server instance (stateless / serverless).
 */
async function handleMcpRequest(agent: Agent, req: Request): Promise<Response> {
  const mcpServer = createMcpServer(agent);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode
  });

  await mcpServer.connect(transport);

  // Return the response directly — don't close transport/server
  // until the stream finishes. The finally block was killing the
  // stream before the response was sent.
  const response = await transport.handleRequest(req);

  // Clean up AFTER the response body is consumed
  if (response.body) {
    const originalBody = response.body;
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = originalBody.getReader();

    // Pipe through and clean up when done
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
      } finally {
        await writer.close();
        await transport.close();
        await mcpServer.close();
      }
    })();

    return new Response(readable, {
      status: response.status,
      headers: response.headers,
    });
  }

  // Non-streaming response — safe to close immediately
  await transport.close();
  await mcpServer.close();
  return response;
}

// POST /api/mcp/[serverId] — MCP Streamable HTTP (JSON-RPC)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;

  try {
    const agent = await resolveAgent(serverId, req.headers.get('authorization'));
    if (!agent) {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: null,
          error: { code: -32600, message: 'Invalid server ID or unauthorized' },
        },
        { status: 401 }
      );
    }

    if (agent.status === 'paused') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: null,
          error: { code: -32600, message: 'This agent is currently paused' },
        },
        { status: 403 }
      );
    }

    return await handleMcpRequest(agent, req);
  } catch (error) {
    console.error('[MCP POST]', error);
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: `Internal error: ${error instanceof Error ? error.message : 'Unknown'}`,
        },
      },
      { status: 500 }
    );
  }
}

// GET /api/mcp/[serverId] — SSE endpoint for streaming
export async function GET(
  req: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;
  const accept = req.headers.get('accept') || '';

  const agent = await resolveAgent(serverId, req.headers.get('authorization'));
  if (!agent) {
    return NextResponse.json(
      { error: 'Invalid server ID or unauthorized' },
      { status: 401 }
    );
  }

  if (accept.includes('text/event-stream')) {
    return await handleMcpRequest(agent, req);
  }

  // Non-SSE GET: return server info
  return NextResponse.json({
    name: `AgentVault: ${agent.name}`,
    serverId,
    status: agent.status,
    protocol: 'MCP Streamable HTTP',
    message: 'Connect via POST for JSON-RPC, GET with Accept: text/event-stream for SSE',
  });
}

// DELETE /api/mcp/[serverId] — cleanup session
export async function DELETE() {
  // Stateless mode — no sessions to clean up
  return new Response(null, { status: 200 });
}
