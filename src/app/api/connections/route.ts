import { NextResponse } from 'next/server';

// GET /api/connections — list vault connections for current user
export async function GET() {
  // TODO: Phase 2
  // 1. Get current user from Auth0 session
  // 2. Fetch connections from Vercel KV
  // 3. Return connections array (never include raw tokens)
  return NextResponse.json({ data: [], error: null });
}

// POST /api/connections — initiate a new Token Vault OAuth connection
export async function POST(req: Request) {
  // TODO: Phase 2
  // 1. Get current user from Auth0 session
  // 2. Parse body: { service } — e.g. 'github', 'slack', 'google-workspace'
  // 3. Generate Auth0 Token Vault authorization URL
  // 4. Return redirect URL for client to navigate to
  const body = await req.json();
  return NextResponse.json({ data: null, error: 'Not implemented yet' }, { status: 501 });
}

// DELETE /api/connections — disconnect a service
export async function DELETE(req: Request) {
  // TODO: Phase 2
  // 1. Get current user from Auth0 session
  // 2. Parse body: { service }
  // 3. Revoke Token Vault connection
  // 4. Delete from Vercel KV
  const body = await req.json();
  return NextResponse.json({ data: null, error: 'Not implemented yet' }, { status: 501 });
}
