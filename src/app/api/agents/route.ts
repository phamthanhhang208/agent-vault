import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth0';
import { getJson, setJson, deleteKey, getByPrefix } from '@/lib/kv';
import { nanoid } from 'nanoid';
import { DEMO_MODE, DEMO_AGENTS } from '@/lib/demo-data';
import type { Agent, ApiResponse } from '@/types';

// GET /api/agents — list agents for current user
export async function GET(): Promise<NextResponse<ApiResponse<Agent[]>>> {
  try {
    if (DEMO_MODE) {
      return NextResponse.json({ data: DEMO_AGENTS });
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agents = await getByPrefix<Agent>(`agent:${userId}:`);
    return NextResponse.json({ data: agents });
  } catch (error) {
    console.error('[Agents GET]', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

// POST /api/agents — create a new agent
export async function POST(req: Request): Promise<NextResponse<ApiResponse<Agent>>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, policies, contextInjection, rateLimit } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Agent name is required' }, { status: 400 });
    }

    if (!policies || !Array.isArray(policies) || policies.length === 0) {
      return NextResponse.json(
        { error: 'At least one service policy is required' },
        { status: 400 }
      );
    }

    const agentId = `agt_${nanoid(12)}`;
    const serverId = `srv_${nanoid(12)}`;
    const vaultToken = `avt_${nanoid(32)}`;

    const agent: Agent = {
      id: agentId,
      userId,
      name: name.trim(),
      description: description?.trim() || '',
      serverId,
      status: 'active',
      rateLimit: rateLimit || 1000,
      contextInjection: contextInjection?.trim() || '',
      policies,
      createdAt: new Date().toISOString(),
    };

    // Store agent config
    await setJson(`agent:${userId}:${agentId}`, agent);

    // Store serverId → agentId + userId mapping for MCP endpoint lookup
    await setJson(`server:${serverId}`, { agentId, userId });

    // Store vault token → serverId mapping for MCP auth
    await setJson(`token:${vaultToken}`, { serverId, agentId, userId });

    return NextResponse.json({
      data: {
        ...agent,
        // Include these in the response so the user can configure their MCP client
        _mcpUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://agentvault.vercel.app'}/api/mcp/${serverId}`,
        _vaultToken: vaultToken,
      } as Agent & { _mcpUrl: string; _vaultToken: string },
    });
  } catch (error) {
    console.error('[Agents POST]', error);
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}

// PUT /api/agents — update an existing agent
export async function PUT(req: Request): Promise<NextResponse<ApiResponse<Agent>>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    const existing = await getJson<Agent>(`agent:${userId}:${id}`);
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const updated: Agent = {
      ...existing,
      ...(updates.name !== undefined && { name: updates.name.trim() }),
      ...(updates.description !== undefined && { description: updates.description.trim() }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.rateLimit !== undefined && { rateLimit: updates.rateLimit }),
      ...(updates.contextInjection !== undefined && {
        contextInjection: updates.contextInjection.trim(),
      }),
      ...(updates.policies !== undefined && { policies: updates.policies }),
    };

    await setJson(`agent:${userId}:${id}`, updated);
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('[Agents PUT]', error);
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}

// DELETE /api/agents — delete an agent
export async function DELETE(req: Request): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    const agent = await getJson<Agent>(`agent:${userId}:${id}`);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Delete agent config + server mapping
    await deleteKey(`agent:${userId}:${id}`);
    await deleteKey(`server:${agent.serverId}`);

    return NextResponse.json({ data: null });
  } catch (error) {
    console.error('[Agents DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
  }
}
