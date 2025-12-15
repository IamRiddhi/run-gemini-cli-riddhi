/**
 * Octokit client for GitHub API operations
 */

import { Octokit } from '@octokit/rest';
import { GITHUB_TOKEN } from '../config/test-config.js';

/**
 * Creates and returns an authenticated Octokit client
 */
function createOctokitClient(): Octokit {
  return new Octokit({
    auth: GITHUB_TOKEN,
  });
}

export const octokit = createOctokitClient();
