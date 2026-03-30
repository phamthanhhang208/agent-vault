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

  try {
    const response = await transport.handleRequest(req);
    return response;
  } finally {
    await transport.close();
    await mcpServer.close();
  }
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

// OPTIONS /api/mcp/[serverId] — CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      'Access-Control-Max-Age': '86400',
    },
  });
}
