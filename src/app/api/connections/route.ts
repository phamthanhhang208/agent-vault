import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth0';
import { getJson, setJson, deleteKey, getByPrefix } from '@/lib/kv';
import { getConnectUrl, getConnectionName, getServiceScopes } from '@/lib/token-vault';
import { DEMO_MODE, DEMO_CONNECTIONS } from '@/lib/demo-data';
import type { VaultConnection, ServiceName, ApiResponse } from '@/types';

// GET /api/connections — list vault connections for current user
export async function GET(): Promise<NextResponse<ApiResponse<VaultConnection[]>>> {
  try {
    if (DEMO_MODE) {
      return NextResponse.json({ data: DEMO_CONNECTIONS });
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connections = await getByPrefix<VaultConnection>(`connection:${userId}:`);
    return NextResponse.json({ data: connections });
  } catch (error) {
    console.error('[Connections GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

// POST /api/connections — initiate a new Token Vault OAuth connection
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { service } = (await req.json()) as { service: ServiceName };

    if (!service) {
      return NextResponse.json(
        { error: 'Missing required field: service' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.AUTH0_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/connections/callback`;

    // Encode state to pass back service + userId info
    const state = Buffer.from(
      JSON.stringify({ service, userId })
    ).toString('base64url');

    const connectUrl = getConnectUrl(service, redirectUri, state);

    return NextResponse.json({
      data: { url: connectUrl },
    });
  } catch (error) {
    console.error('[Connections POST]', error);
    return NextResponse.json(
      { error: 'Failed to initiate connection' },
      { status: 500 }
    );
  }
}

// DELETE /api/connections — disconnect a service
export async function DELETE(req: Request): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { service } = (await req.json()) as { service: string };

    if (!service) {
      return NextResponse.json(
        { error: 'Missing required field: service' },
        { status: 400 }
      );
    }

    const connectionName = getConnectionName(service);
    const key = `connection:${userId}:${connectionName}`;

    await deleteKey(key);

    return NextResponse.json({ data: null });
  } catch (error) {
    console.error('[Connections DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to disconnect service' },
      { status: 500 }
    );
  }
}
