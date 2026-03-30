import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth0';
import { getAuditLog, getAuditStats } from '@/lib/audit';
import type { ApiResponse, AuditEntry } from '@/types';

// GET /api/audit — list audit log entries + stats
export async function GET(req: Request): Promise<NextResponse<ApiResponse<{
  entries: AuditEntry[];
  stats: { actionsToday: number; totalActions: number };
}>>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const agentId = url.searchParams.get('agentId') || undefined;
    const service = url.searchParams.get('service') || undefined;

    const [entries, stats] = await Promise.all([
      getAuditLog(userId, { limit, agentId, service }),
      getAuditStats(userId),
    ]);

    return NextResponse.json({ data: { entries, stats } });
  } catch (error) {
    console.error('[Audit GET]', error);
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 });
  }
}
