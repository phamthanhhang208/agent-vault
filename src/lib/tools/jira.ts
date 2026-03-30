/**
 * Jira Tool Implementations
 *
 * Uses Atlassian REST API v3 (Cloud) with OAuth token from Token Vault.
 */

const JIRA_API = 'https://api.atlassian.com';

interface JiraToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

async function jiraFetch(
  token: string,
  cloudId: string,
  path: string,
  options: RequestInit = {}
): Promise<JiraToolResult> {
  try {
    const response = await fetch(`${JIRA_API}/ex/jira/${cloudId}/rest/api/3${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      return {
        success: false,
        error: `Jira API error (${response.status}): ${error.message || error.errorMessages?.[0] || response.statusText}`,
      };
    }

    if (response.status === 204) {
      return { success: true, data: null };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: `Jira API request failed: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

/** Get accessible Jira cloud resources (to find cloudId) */
async function getCloudId(token: string): Promise<string | null> {
  try {
    const response = await fetch(`${JIRA_API}/oauth/token/accessible-resources`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const resources = await response.json();
    return resources[0]?.id || null;
  } catch {
    return null;
  }
}

/** issues.read — Search/list issues with JQL */
export async function issuesRead(
  token: string,
  params: { jql?: string; project?: string; maxResults?: number }
): Promise<JiraToolResult> {
  const cloudId = await getCloudId(token);
  if (!cloudId) return { success: false, error: 'Could not find Jira cloud instance' };

  const jql = params.jql || (params.project ? `project = ${params.project} ORDER BY updated DESC` : 'ORDER BY updated DESC');
  const maxResults = params.maxResults || 20;

  return jiraFetch(
    token,
    cloudId,
    `/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=summary,status,assignee,priority,issuetype`
  );
}

/** issues.create — Create a Jira issue */
export async function issuesCreate(
  token: string,
  params: { project: string; summary: string; description?: string; issueType?: string }
): Promise<JiraToolResult> {
  const cloudId = await getCloudId(token);
  if (!cloudId) return { success: false, error: 'Could not find Jira cloud instance' };

  return jiraFetch(token, cloudId, '/issue', {
    method: 'POST',
    body: JSON.stringify({
      fields: {
        project: { key: params.project },
        summary: params.summary,
        description: params.description
          ? { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: params.description }] }] }
          : undefined,
        issuetype: { name: params.issueType || 'Task' },
      },
    }),
  });
}

/** issues.transition — Transition an issue status */
export async function issuesTransition(
  token: string,
  params: { issueKey: string; transitionId: string }
): Promise<JiraToolResult> {
  const cloudId = await getCloudId(token);
  if (!cloudId) return { success: false, error: 'Could not find Jira cloud instance' };

  return jiraFetch(token, cloudId, `/issue/${params.issueKey}/transitions`, {
    method: 'POST',
    body: JSON.stringify({ transition: { id: params.transitionId } }),
  });
}

/** Tool executor */
export async function executeJiraTool(
  token: string,
  action: string,
  params: Record<string, unknown>
): Promise<JiraToolResult> {
  const p = params as Record<string, string>;
  switch (action) {
    case 'issues.read':
      return issuesRead(token, { jql: p.jql, project: p.project, maxResults: Number(p.maxResults) || undefined });
    case 'issues.create':
      return issuesCreate(token, { project: p.project, summary: p.summary, description: p.description, issueType: p.issueType });
    case 'issues.transition':
      return issuesTransition(token, { issueKey: p.issueKey, transitionId: p.transitionId });
    default:
      return { success: false, error: `Unknown Jira action: ${action}` };
  }
}

export const SCHEMAS = {
  'issues.read': {
    type: 'object' as const,
    properties: {
      jql: { type: 'string', description: 'JQL query to search issues' },
      project: { type: 'string', description: 'Project key (e.g. PROJ)' },
      maxResults: { type: 'number', description: 'Max results to return (default: 20)' },
    },
  },
  'issues.create': {
    type: 'object' as const,
    properties: {
      project: { type: 'string', description: 'Project key (e.g. PROJ)' },
      summary: { type: 'string', description: 'Issue summary/title' },
      description: { type: 'string', description: 'Issue description (plain text)' },
      issueType: { type: 'string', description: 'Issue type: Task, Bug, Story (default: Task)' },
    },
    required: ['project', 'summary'],
  },
  'issues.transition': {
    type: 'object' as const,
    properties: {
      issueKey: { type: 'string', description: 'Issue key (e.g. PROJ-123)' },
      transitionId: { type: 'string', description: 'Transition ID to apply' },
    },
    required: ['issueKey', 'transitionId'],
  },
};
