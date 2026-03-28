import { NextResponse } from 'next/server';

// GET /api/agents — list agents for current user
export async function GET() {
  // TODO: Phase 3
  // 1. Get current user from Auth0 session
  // 2. Fetch agents from Vercel KV by userId prefix
  // 3. Return agents array
  return NextResponse.json({ data: [], error: null });
}

// POST /api/agents — create a new agent
export async function POST(req: Request) {
  // TODO: Phase 3
  // 1. Get current user from Auth0 session
  // 2. Parse body: { name, description, policies }
  // 3. Generate unique serverId
  // 4. Store agent in Vercel KV
  // 5. Return created agent with MCP URL
  const body = await req.json();
  return NextResponse.json({ data: null, error: 'Not implemented yet' }, { status: 501 });
}
