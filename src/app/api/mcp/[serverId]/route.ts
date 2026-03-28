import { NextResponse } from 'next/server';

// POST /api/mcp/[serverId] — MCP JSON-RPC request handler
export async function POST(
  req: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;

  // TODO: Phase 4
  // 1. Extract bearer token from Authorization header
  // 2. Validate token → resolve to userId + agentId
  // 3. Load agent config from Vercel KV by serverId
  // 4. Create MCP server with dynamic tools based on policy config
  // 5. Parse JSON-RPC request body
  // 6. Route to appropriate handler:
  //    - initialize: return server capabilities + tool list
  //    - tools/list: return filtered tool definitions
  //    - tools/call: evaluate policy → execute or trigger approval
  //    - resources/read: return context injection if requested
  // 7. Return JSON-RPC response

  const body = await req.json();

  // Stub: return MCP error for now
  return NextResponse.json(
    {
      jsonrpc: '2.0',
      id: body.id ?? null,
      error: {
        code: -32603,
        message: `MCP server for ${serverId} is not yet implemented. Coming in Phase 4.`,
      },
    },
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// GET /api/mcp/[serverId] — SSE endpoint for streaming (approval waits, etc.)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;
  const accept = req.headers.get('accept') || '';

  // TODO: Phase 4
  // If Accept: text/event-stream → open SSE connection
  // Used for:
  //   - Long-running tool calls waiting for CIBA approval
  //   - Server-sent notifications (optional enhancement)

  if (accept.includes('text/event-stream')) {
    // SSE stub
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'info', message: 'MCP SSE endpoint not yet implemented' })}\n\n`)
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  // Non-SSE GET: return server info
  return NextResponse.json({
    name: 'AgentVault MCP Server',
    serverId,
    status: 'stub',
    message: 'Connect via MCP Streamable HTTP (POST for JSON-RPC, GET with Accept: text/event-stream for SSE)',
  });
}
