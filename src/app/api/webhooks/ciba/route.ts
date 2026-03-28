import { NextResponse } from 'next/server';

// POST /api/webhooks/ciba — Auth0 CIBA callback
// Auth0 calls this when a user responds to a CIBA push notification
export async function POST(req: Request) {
  // TODO: Phase 5
  // 1. Verify webhook signature / origin (Auth0 sends from known IPs)
  // 2. Parse body: { auth_req_id, status: 'approved' | 'rejected', ... }
  // 3. Look up approval request by cibaRequestId
  // 4. Check request is still pending (dashboard may have resolved it first)
  // 5. If still pending: update status, set resolvedVia: 'ciba'
  // 6. Log to audit trail
  // 7. Return 200 OK

  try {
    const body = await req.json();

    console.log('[CIBA Webhook] Received:', {
      auth_req_id: body.auth_req_id,
      status: body.status,
      timestamp: new Date().toISOString(),
    });

    // Stub response
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[CIBA Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
