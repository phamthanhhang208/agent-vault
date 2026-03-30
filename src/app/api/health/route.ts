import { NextResponse } from 'next/server';
import { DEMO_MODE } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health — Health check endpoint
 * Used by Vercel monitoring and uptime checks.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mode: DEMO_MODE ? 'demo' : 'production',
    services: ['github', 'slack', 'google-workspace', 'jira'],
    features: {
      auth0TokenVault: true,
      cibaApproval: true,
      mcpServer: true,
      auditLogging: true,
    },
  });
}
