/**
 * Google Workspace Tool Implementations
 */

interface GoogleToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

async function googleFetch(
  token: string,
  url: string,
  options: RequestInit = {}
): Promise<GoogleToolResult> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      return {
        success: false,
        error: `Google API error (${response.status}): ${error.error?.message || response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: `Google API request failed: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

/** drive.read — Search and read files from Google Drive */
export async function driveRead(
  token: string,
  params: { query?: string; fileId?: string }
): Promise<GoogleToolResult> {
  if (params.fileId) {
    return googleFetch(
      token,
      `https://www.googleapis.com/drive/v3/files/${params.fileId}?fields=*`
    );
  }
  const q = params.query ? `&q=${encodeURIComponent(params.query)}` : '';
  return googleFetch(
    token,
    `https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,modifiedTime,webViewLink)${q}`
  );
}

/** drive.write — Create or update files in Google Drive */
export async function driveWrite(
  token: string,
  params: { name: string; content: string; mimeType?: string }
): Promise<GoogleToolResult> {
  const metadata = {
    name: params.name,
    mimeType: params.mimeType || 'text/plain',
  };

  // Create file metadata first
  const metaResponse = await googleFetch(
    token,
    'https://www.googleapis.com/drive/v3/files',
    { method: 'POST', body: JSON.stringify(metadata) }
  );

  if (!metaResponse.success) return metaResponse;

  // Then upload content
  const fileId = (metaResponse.data as { id: string }).id;
  return googleFetch(
    token,
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': params.mimeType || 'text/plain' },
      body: params.content,
    }
  );
}

/** gmail.send — Send an email via Gmail */
export async function gmailSend(
  token: string,
  params: { to: string; subject: string; body: string }
): Promise<GoogleToolResult> {
  // Build RFC 2822 email
  const email = [
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    params.body,
  ].join('\r\n');

  const encodedEmail = Buffer.from(email).toString('base64url');

  return googleFetch(
    token,
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    { method: 'POST', body: JSON.stringify({ raw: encodedEmail }) }
  );
}

/** Tool executor */
export async function executeGoogleTool(
  token: string,
  action: string,
  params: Record<string, unknown>
): Promise<GoogleToolResult> {
  const p = params as Record<string, string>;
  switch (action) {
    case 'drive.read':
      return driveRead(token, { query: p.query, fileId: p.fileId });
    case 'drive.write':
      return driveWrite(token, { name: p.name, content: p.content, mimeType: p.mimeType });
    case 'gmail.send':
      return gmailSend(token, { to: p.to, subject: p.subject, body: p.body });
    default:
      return { success: false, error: `Unknown Google action: ${action}` };
  }
}

export const SCHEMAS = {
  'drive.read': {
    type: 'object' as const,
    properties: {
      query: { type: 'string', description: 'Search query for Drive files' },
      fileId: { type: 'string', description: 'Specific file ID to read' },
    },
  },
  'drive.write': {
    type: 'object' as const,
    properties: {
      name: { type: 'string', description: 'File name to create' },
      content: { type: 'string', description: 'File content' },
      mimeType: { type: 'string', description: 'MIME type (default: text/plain)' },
    },
    required: ['name', 'content'],
  },
  'gmail.send': {
    type: 'object' as const,
    properties: {
      to: { type: 'string', description: 'Recipient email address' },
      subject: { type: 'string', description: 'Email subject line' },
      body: { type: 'string', description: 'Email body (plain text)' },
    },
    required: ['to', 'subject', 'body'],
  },
};
