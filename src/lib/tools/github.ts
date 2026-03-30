/**
 * GitHub Tool Implementations
 *
 * Each function executes a GitHub API call using an OAuth token
 * fetched from Auth0 Token Vault. Tokens are never cached locally.
 */

const GITHUB_API = 'https://api.github.com';

interface GitHubToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

async function githubFetch(
  token: string,
  path: string,
  options: RequestInit = {}
): Promise<GitHubToolResult> {
  try {
    const response = await fetch(`${GITHUB_API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      return {
        success: false,
        error: `GitHub API error (${response.status}): ${error.message || response.statusText}`,
      };
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true, data: null };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: `GitHub API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/** repos.read — Get repository info, files, or branches */
export async function reposRead(
  token: string,
  params: { owner: string; repo: string; path?: string }
): Promise<GitHubToolResult> {
  if (params.path) {
    // Get file contents
    return githubFetch(token, `/repos/${params.owner}/${params.repo}/contents/${params.path}`);
  }
  // Get repo info
  return githubFetch(token, `/repos/${params.owner}/${params.repo}`);
}

/** repos.write — Create/update files, create branches or PRs */
export async function reposWrite(
  token: string,
  params: { owner: string; repo: string; path: string; content: string; message: string }
): Promise<GitHubToolResult> {
  // First check if file exists (to get sha for updates)
  const existing = await githubFetch(
    token,
    `/repos/${params.owner}/${params.repo}/contents/${params.path}`
  );

  const body: Record<string, string> = {
    message: params.message,
    content: Buffer.from(params.content).toString('base64'),
  };

  // If file exists, include sha for update
  if (existing.success && existing.data && typeof existing.data === 'object' && 'sha' in existing.data) {
    body.sha = (existing.data as { sha: string }).sha;
  }

  return githubFetch(
    token,
    `/repos/${params.owner}/${params.repo}/contents/${params.path}`,
    { method: 'PUT', body: JSON.stringify(body) }
  );
}

/** repos.delete — Delete a repository (HIGH RISK) */
export async function reposDelete(
  token: string,
  params: { owner: string; repo: string }
): Promise<GitHubToolResult> {
  return githubFetch(token, `/repos/${params.owner}/${params.repo}`, {
    method: 'DELETE',
  });
}

/** issues.list — List issues for a repository */
export async function issuesList(
  token: string,
  params: { owner: string; repo: string; state?: string }
): Promise<GitHubToolResult> {
  const state = params.state || 'open';
  return githubFetch(
    token,
    `/repos/${params.owner}/${params.repo}/issues?state=${state}&per_page=30`
  );
}

/** issues.create — Create an issue */
export async function issuesCreate(
  token: string,
  params: { owner: string; repo: string; title: string; body?: string }
): Promise<GitHubToolResult> {
  return githubFetch(
    token,
    `/repos/${params.owner}/${params.repo}/issues`,
    {
      method: 'POST',
      body: JSON.stringify({
        title: params.title,
        body: params.body || '',
      }),
    }
  );
}

/** Tool executor — routes action to the correct function */
export async function executeGitHubTool(
  token: string,
  action: string,
  params: Record<string, unknown>
): Promise<GitHubToolResult> {
  const typedParams = params as Record<string, string>;

  switch (action) {
    case 'repos.read':
      return reposRead(token, {
        owner: typedParams.owner,
        repo: typedParams.repo,
        path: typedParams.path,
      });
    case 'repos.write':
      return reposWrite(token, {
        owner: typedParams.owner,
        repo: typedParams.repo,
        path: typedParams.path,
        content: typedParams.content,
        message: typedParams.message,
      });
    case 'repos.delete':
      return reposDelete(token, {
        owner: typedParams.owner,
        repo: typedParams.repo,
      });
    case 'issues.*':
      // If title is provided, it's a create; otherwise list
      if (typedParams.title) {
        return issuesCreate(token, {
          owner: typedParams.owner,
          repo: typedParams.repo,
          title: typedParams.title,
          body: typedParams.body,
        });
      }
      return issuesList(token, {
        owner: typedParams.owner,
        repo: typedParams.repo,
        state: typedParams.state,
      });
    default:
      return { success: false, error: `Unknown GitHub action: ${action}` };
  }
}

/** MCP input schemas for GitHub tools */
export const SCHEMAS = {
  'repos.read': {
    type: 'object' as const,
    properties: {
      owner: { type: 'string', description: 'Repository owner (user or org)' },
      repo: { type: 'string', description: 'Repository name' },
      path: { type: 'string', description: 'Optional file path within the repo' },
    },
    required: ['owner', 'repo'],
  },
  'repos.write': {
    type: 'object' as const,
    properties: {
      owner: { type: 'string', description: 'Repository owner' },
      repo: { type: 'string', description: 'Repository name' },
      path: { type: 'string', description: 'File path to create/update' },
      content: { type: 'string', description: 'File content' },
      message: { type: 'string', description: 'Commit message' },
    },
    required: ['owner', 'repo', 'path', 'content', 'message'],
  },
  'repos.delete': {
    type: 'object' as const,
    properties: {
      owner: { type: 'string', description: 'Repository owner' },
      repo: { type: 'string', description: 'Repository name to delete' },
    },
    required: ['owner', 'repo'],
  },
  'issues.*': {
    type: 'object' as const,
    properties: {
      owner: { type: 'string', description: 'Repository owner' },
      repo: { type: 'string', description: 'Repository name' },
      title: { type: 'string', description: 'Issue title (for create)' },
      body: { type: 'string', description: 'Issue body (for create)' },
      state: { type: 'string', description: 'Filter by state: open, closed, all (for list)' },
    },
    required: ['owner', 'repo'],
  },
};
