/**
 * GitHub API Service
 * Provides integration with GitHub for reading, updating, and committing files
 * Uses Personal Access Token (PAT) for authentication
 */

const GITHUB_API_BASE = 'https://api.github.com';

interface GitHubFileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
  download_url?: string;
}

interface GitHubCommitResponse {
  content: {
    name: string;
    path: string;
    sha: string;
  };
  commit: {
    sha: string;
    message: string;
    html_url: string;
  };
}

interface GitHubError {
  message: string;
  documentation_url?: string;
}

function getConfig() {
  const pat = process.env.GITHUB_PAT;
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;

  if (!pat || !owner || !repo) {
    throw new Error('GitHub configuration missing. Please set GITHUB_PAT, GITHUB_REPO_OWNER, and GITHUB_REPO_NAME environment variables.');
  }

  return { pat, owner, repo };
}

function getHeaders(pat: string) {
  return {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${pat}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

/**
 * Get file content from GitHub repository
 */
export async function getFileContent(path: string, branch: string = 'main'): Promise<{ content: string; sha: string }> {
  const { pat, owner, repo } = getConfig();
  
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(pat),
  });

  if (!response.ok) {
    const error: GitHubError = await response.json();
    throw new Error(`GitHub API Error: ${error.message}`);
  }

  const data: GitHubFileContent = await response.json();
  
  if (data.type !== 'file' || !data.content) {
    throw new Error('Path is not a file or content is empty');
  }

  // Decode base64 content
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  
  return { content, sha: data.sha };
}

/**
 * List files in a directory
 */
export async function listDirectory(path: string = '', branch: string = 'main'): Promise<GitHubFileContent[]> {
  const { pat, owner, repo } = getConfig();
  
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(pat),
  });

  if (!response.ok) {
    const error: GitHubError = await response.json();
    throw new Error(`GitHub API Error: ${error.message}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [data];
}

/**
 * Create or update a file in the repository
 */
export async function commitFile(
  path: string,
  content: string,
  message: string,
  branch: string = 'main',
  existingSha?: string
): Promise<GitHubCommitResponse> {
  const { pat, owner, repo } = getConfig();
  
  // If no SHA provided, try to get the existing file's SHA (for updates)
  let sha = existingSha;
  if (!sha) {
    try {
      const existing = await getFileContent(path, branch);
      sha = existing.sha;
    } catch (e) {
      // File doesn't exist, this will be a create operation
      sha = undefined;
    }
  }

  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;
  
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch,
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(pat),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error: GitHubError = await response.json();
    throw new Error(`GitHub API Error: ${error.message}`);
  }

  return response.json();
}

/**
 * Get list of branches
 */
export async function listBranches(): Promise<{ name: string; protected: boolean }[]> {
  const { pat, owner, repo } = getConfig();
  
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/branches`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(pat),
  });

  if (!response.ok) {
    const error: GitHubError = await response.json();
    throw new Error(`GitHub API Error: ${error.message}`);
  }

  return response.json();
}

/**
 * Get repository info to verify connection
 */
export async function getRepoInfo(): Promise<{ name: string; full_name: string; default_branch: string; private: boolean }> {
  const { pat, owner, repo } = getConfig();
  
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(pat),
  });

  if (!response.ok) {
    const error: GitHubError = await response.json();
    throw new Error(`GitHub API Error: ${error.message}`);
  }

  return response.json();
}

/**
 * Check if GitHub is properly configured
 */
export function isConfigured(): boolean {
  try {
    getConfig();
    return true;
  } catch {
    return false;
  }
}
