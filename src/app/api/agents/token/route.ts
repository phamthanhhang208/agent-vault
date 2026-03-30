import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth0';
import { getJson, scanKeys } from '@/lib/kv';
import type { ApiResponse } from '@/types';

interface TokenMapping {
  serverId: string;
  agentId: string;
  userId: string;
}

// POST /api/agents/token — get vault token for a specific agent
// (POST to avoid caching, body contains { agentId })
export async function POST(req: Request): Promise<NextResponse<ApiResponse<{ vaultToken: string }>>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentId } = await req.json();
    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
    }

    // Scan for matching token
    const tokenKeys = await scanKeys('token:avt_*');
    for (const key of tokenKeys) {
      const mapping = await getJson<TokenMapping>(key);
      if (mapping && mapping.agentId === agentId && mapping.userId === userId) {
        const vaultToken = key.replace('token:', '');
        return NextResponse.json({ data: { vaultToken } });
      }
    }

    return NextResponse.json({ error: 'Token not found' }, { status: 404 });
  } catch (error) {
    console.error('[Agents Token]', error);
    return NextResponse.json({ error: 'Failed to fetch token' }, { status: 500 });
  }
}
