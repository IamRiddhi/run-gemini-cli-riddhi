/**
 * GitHub API operations for integration tests
 */

import { octokit } from './octokit-client.js';
import { TEST_REPO_OWNER, TEST_REPO_NAME } from '../config/test-config.js';

/**
 * Create a pull request
 */
export async function createPullRequest(
  head: string,
  base: string,
  title: string,
  body?: string
): Promise<{ number: number; url: string }> {
  const response = await octokit.rest.pulls.create({
    owner: TEST_REPO_OWNER,
    repo: TEST_REPO_NAME,
    head,
    base,
    title,
    body,
  });

  return {
    number: response.data.number,
    url: response.data.html_url,
  };
}

/**
 * Create an issue
 */
export async function createIssue(
  title: string,
  body?: string
): Promise<{ number: number; url: string }> {
  const response = await octokit.rest.issues.create({
    owner: TEST_REPO_OWNER,
    repo: TEST_REPO_NAME,
    title,
    body,
  });

  return {
    number: response.data.number,
    url: response.data.html_url,
  };
}

/**
 * Create a comment on an issue or pull request
 */
export async function createComment(
  issueNumber: number,
  body: string
): Promise<{ id: number; url: string }> {
  const response = await octokit.rest.issues.createComment({
    owner: TEST_REPO_OWNER,
    repo: TEST_REPO_NAME,
    issue_number: issueNumber,
    body,
  });

  return {
    id: response.data.id,
    url: response.data.html_url,
  };
}

/**
 * List comments on an issue or pull request
 */
export async function listComments(
  issueNumber: number
): Promise<Array<{ id: number; body: string; user: string | null }>> {
  const response = await octokit.rest.issues.listComments({
    owner: TEST_REPO_OWNER,
    repo: TEST_REPO_NAME,
    issue_number: issueNumber,
  });

  return response.data.map((comment) => ({
    id: comment.id,
    body: comment.body || '',
    user: comment.user?.login || null,
  }));
}

/**
 * List pull requests
 */
export async function listPullRequests(
  state: 'open' | 'closed' | 'all' = 'open'
): Promise<Array<{ number: number; title: string; url: string; head: string }>> {
  const response = await octokit.rest.pulls.list({
    owner: TEST_REPO_OWNER,
    repo: TEST_REPO_NAME,
    state,
  });

  return response.data.map((pr) => ({
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    head: pr.head.ref,
  }));
}

/**
 * Close a pull request
 */
export async function closePullRequest(prNumber: number): Promise<void> {
  await octokit.rest.pulls.update({
    owner: TEST_REPO_OWNER,
    repo: TEST_REPO_NAME,
    pull_number: prNumber,
    state: 'closed',
  });
}

/**
 * Close an issue
 */
export async function closeIssue(issueNumber: number): Promise<void> {
  await octokit.rest.issues.update({
    owner: TEST_REPO_OWNER,
    repo: TEST_REPO_NAME,
    issue_number: issueNumber,
    state: 'closed',
  });
}

/**
 * Delete a branch
 */
export async function deleteBranch(branch: string): Promise<void> {
  await octokit.rest.git.deleteRef({
    owner: TEST_REPO_OWNER,
    repo: TEST_REPO_NAME,
    ref: `heads/${branch}`,
  });
}

/**
 * Get the latest commit SHA from a branch
 */
export async function getLatestCommitSha(branch: string): Promise<string> {
  const response = await octokit.rest.git.getRef({
    owner: TEST_REPO_OWNER,
    repo: TEST_REPO_NAME,
    ref: `heads/${branch}`,
  });

  return response.data.object.sha;
}

/**
 * Create a branch
 */
export async function createBranch(
  branchName: string,
  fromSha: string
): Promise<void> {
  await octokit.rest.git.createRef({
    owner: TEST_REPO_OWNER,
    repo: TEST_REPO_NAME,
    ref: `refs/heads/${branchName}`,
    sha: fromSha,
  });
}

/**
 * Get file content from a branch
 */
export async function getFileContent(
  path: string,
  branch: string = 'main'
): Promise<string> {
  const response = await octokit.rest.repos.getContent({
    owner: TEST_REPO_OWNER,
    repo: TEST_REPO_NAME,
    path,
    ref: branch,
  });

  if (Array.isArray(response.data) || response.data.type !== 'file') {
    throw new Error(`Path ${path} is not a file`);
  }

  // Decode base64 content
  return Buffer.from(response.data.content, 'base64').toString('utf-8');
}

/**
 * Create or update a file in the repository
 */
export async function createOrUpdateFile(
  path: string,
  content: string,
  message: string,
  branch: string
): Promise<void> {
  // Try to get existing file SHA (needed for updates)
  let sha: string | undefined;
  try {
    const response = await octokit.rest.repos.getContent({
      owner: TEST_REPO_OWNER,
      repo: TEST_REPO_NAME,
      path,
      ref: branch,
    });

    if (!Array.isArray(response.data) && response.data.type === 'file') {
      sha = response.data.sha;
    }
  } catch (error: any) {
    // File doesn't exist yet (404) - that's fine, we're creating it
    if (error.status !== 404) {
      throw error;
    }
  }

  await octokit.rest.repos.createOrUpdateFileContents({
    owner: TEST_REPO_OWNER,
    repo: TEST_REPO_NAME,
    path,
    message,
    content: Buffer.from(content).toString('base64'),
    branch,
    ...(sha && { sha }), // Include SHA only if file exists
  });
}

/**
 * List all issues
 */
export async function listIssues(
  state: 'open' | 'closed' | 'all' = 'open'
): Promise<Array<{ number: number; title: string; url: string }>> {
  const response = await octokit.rest.issues.listForRepo({
    owner: TEST_REPO_OWNER,
    repo: TEST_REPO_NAME,
    state,
  });

  // Filter out pull requests (GitHub API returns PRs as issues)
  const issues = response.data.filter((item) => !item.pull_request);

  return issues.map((issue) => ({
    number: issue.number,
    title: issue.title,
    url: issue.html_url,
  }));
}

/**
 * List all branches
 */
export async function listBranches(): Promise<string[]> {
  const response = await octokit.rest.repos.listBranches({
    owner: TEST_REPO_OWNER,
    repo: TEST_REPO_NAME,
  });

  return response.data.map((branch) => branch.name);
}

/**
 * List all files in a directory
 */
async function listFiles(path: string): Promise<string[]> {
  try {
    const response = await octokit.rest.repos.getContent({
      owner: TEST_REPO_OWNER,
      repo: TEST_REPO_NAME,
      path,
    });

    if (Array.isArray(response.data)) {
      return response.data.map((file) => file.path);
    }

    return [];
  } catch (error: any) {
    if (error.status === 404) {
      return [];
    }
    throw error;
  }
}

/**
 * List all workflow files
 */
export async function listWorkflowFiles(): Promise<string[]> {
  return listFiles('.github/workflows');
}

/**
 * List all slash command files
 */
export async function listCommandFiles(): Promise<string[]> {
  return listFiles('.github/commands');
}

/**
 * Delete a file from the repository
 */
export async function deleteFile(path: string, message: string): Promise<void> {
  const response = await octokit.rest.repos.getContent({
    owner: TEST_REPO_OWNER,
    repo: TEST_REPO_NAME,
    path,
  });

  if (Array.isArray(response.data)) {
    throw new Error(`Path ${path} is a directory, not a file`);
  }

  await octokit.rest.repos.deleteFile({
    owner: TEST_REPO_OWNER,
    repo: TEST_REPO_NAME,
    path,
    message,
    sha: response.data.sha,
  });
}
