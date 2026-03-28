import { NextResponse } from 'next/server';

// GET /api/approvals — list approval requests for current user
export async function GET() {
  // TODO: Phase 5
  // 1. Get current user from Auth0 session
  // 2. Fetch approval requests from Vercel KV
  // 3. Support ?status=pending|all filter
  // 4. Return requests array
  return NextResponse.json({ data: [], error: null });
}

// POST /api/approvals — approve or reject a request (dashboard path)
export async function POST(req: Request) {
  // TODO: Phase 5
  // 1. Get current user from Auth0 session
  // 2. Parse body: { requestId, decision: 'approved' | 'rejected' }
  // 3. Check request belongs to user and is still pending
  // 4. Update request status in Vercel KV (resolvedVia: 'dashboard')
  // 5. If CIBA request is active, cancel it
  // 6. Return updated request
  const body = await req.json();
  return NextResponse.json({ data: null, error: 'Not implemented yet' }, { status: 501 });
}
