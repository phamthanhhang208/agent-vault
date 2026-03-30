import { NextResponse } from 'next/server';
import { scanKeys, getJson, setJson } from '@/lib/kv';
import { logAction } from '@/lib/audit';
import type { ApprovalRequest } from '@/types';

/**
 * POST /api/webhooks/ciba — Auth0 CIBA callback
 *
 * Auth0 calls this endpoint when a user responds to a CIBA push notification
 * (via Guardian app or email). Whichever path resolves first wins (dashboard or CIBA).
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { auth_req_id, status } = body as {
      auth_req_id: string;
      status: 'approved' | 'rejected';
    };

    console.log('[CIBA Webhook] Received:', {
      auth_req_id,
      status,
      timestamp: new Date().toISOString(),
    });

    if (!auth_req_id || !status) {
      return NextResponse.json(
        { error: 'Missing auth_req_id or status' },
        { status: 400 }
      );
    }

    // Find the approval request by cibaRequestId
    // Scan all approval keys and find the matching one
    const approvalKeys = await scanKeys('approval:*');
    let matchedKey: string | null = null;
    let matchedRequest: ApprovalRequest | null = null;

    for (const key of approvalKeys) {
      const request = await getJson<ApprovalRequest>(key);
      if (request && request.cibaRequestId === auth_req_id) {
        matchedKey = key;
        matchedRequest = request;
        break;
      }
    }

    if (!matchedKey || !matchedRequest) {
      console.warn('[CIBA Webhook] No matching approval request for auth_req_id:', auth_req_id);
      return NextResponse.json({ received: true, matched: false });
    }

    // Check if already resolved (dashboard may have been faster)
    if (matchedRequest.status !== 'pending') {
      console.log('[CIBA Webhook] Request already resolved via:', matchedRequest.resolvedVia);
      return NextResponse.json({ received: true, alreadyResolved: true });
    }

    // Resolve the request
    const decision = status === 'approved' ? 'approved' : 'rejected';
    const updated: ApprovalRequest = {
      ...matchedRequest,
      status: decision,
      resolvedVia: 'ciba',
      resolvedAt: new Date().toISOString(),
    };

    await setJson(matchedKey, updated);

    // Log to audit trail
    await logAction(matchedRequest.userId, {
      agentId: matchedRequest.agentId,
      agentName: matchedRequest.agentName,
      service: matchedRequest.service,
      action: matchedRequest.action,
      detail: matchedRequest.detail,
      risk: matchedRequest.risk,
      status: decision,
      resolvedVia: 'ciba',
      executionMs: 0,
    });

    console.log('[CIBA Webhook] Resolved:', { requestId: matchedRequest.id, decision, via: 'ciba' });
    return NextResponse.json({ received: true, resolved: true });
  } catch (error) {
    console.error('[CIBA Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
