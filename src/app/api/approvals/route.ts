import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth0';
import { getJson, setJson, getByPrefix } from '@/lib/kv';
import { logAction } from '@/lib/audit';
import type { ApprovalRequest, ApiResponse } from '@/types';

// GET /api/approvals — list approval requests for current user
export async function GET(req: Request): Promise<NextResponse<ApiResponse<ApprovalRequest[]>>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const statusFilter = url.searchParams.get('status'); // 'pending' | 'all'

    let requests = await getByPrefix<ApprovalRequest>(`approval:${userId}:`);

    if (statusFilter === 'pending') {
      requests = requests.filter((r) => r.status === 'pending');
    }

    // Sort newest first
    requests.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ data: requests });
  } catch (error) {
    console.error('[Approvals GET]', error);
    return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 });
  }
}

// POST /api/approvals — approve or reject a request (dashboard path)
export async function POST(req: Request): Promise<NextResponse<ApiResponse<ApprovalRequest>>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId, decision } = (await req.json()) as {
      requestId: string;
      decision: 'approved' | 'rejected';
    };

    if (!requestId || !decision) {
      return NextResponse.json(
        { error: 'requestId and decision are required' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected'].includes(decision)) {
      return NextResponse.json(
        { error: 'decision must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    const key = `approval:${userId}:${requestId}`;
    const request = await getJson<ApprovalRequest>(key);

    if (!request) {
      return NextResponse.json({ error: 'Approval request not found' }, { status: 404 });
    }

    if (request.status !== 'pending') {
      return NextResponse.json(
        { error: `Request already ${request.status}` },
        { status: 409 }
      );
    }

    // Update the request
    const updated: ApprovalRequest = {
      ...request,
      status: decision,
      resolvedVia: 'dashboard',
      resolvedAt: new Date().toISOString(),
    };

    await setJson(key, updated);

    // Log to audit trail
    await logAction(userId, {
      agentId: request.agentId,
      agentName: request.agentName,
      service: request.service,
      action: request.action,
      detail: request.detail,
      risk: request.risk,
      status: decision,
      resolvedVia: 'dashboard',
      executionMs: 0,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('[Approvals POST]', error);
    return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 });
  }
}
