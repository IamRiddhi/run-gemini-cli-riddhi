/**
 * Integration test configuration module
 * Validates environment variables on import and fails fast if configuration is invalid.
 */

export interface TestConfig {
  readonly testRepo: {
    readonly owner: string;
    readonly name: string;
  };
  readonly auth: {
    readonly token: string;
  };
  readonly timeouts: {
    readonly pollIntervalMs: number;
    readonly reviewTimeoutMs: number;
    readonly invokeTimeoutMs: number;
    readonly fixTimeoutMs: number;
  };
}


/**
 * Parse and validate TEST_REPO_NAME environment variable
 */
function parseTestRepoName(): { owner: string; name: string } {
  const fullName = process.env.TEST_REPO_NAME;

  if (!fullName) {
    throw new Error(
      'Environment variable TEST_REPO_NAME is required.\n' +
        'Format: "owner/repo" (e.g., "IamRiddhi/test-repo-integ")'
    );
  }

  const parts = fullName.split('/');

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(
      `Invalid TEST_REPO_NAME format: "${fullName}"\n` +
        'Expected: "owner/repo" (e.g., "IamRiddhi/test-repo-integ")'
    );
  }

  return {
    owner: parts[0],
    name: parts[1],
  };
}

/**
 * Get GitHub authentication token from environment
 * Tries GITHUB_TOKEN (production) first, then TEST_REPO_PAT (local testing)
 */
function getGithubToken(): string {
  const token = process.env.GITHUB_TOKEN || process.env.TEST_REPO_PAT;

  if (!token) {
    throw new Error(
      'GitHub authentication required. Set one of:\n' +
        '  • GITHUB_TOKEN (production with GitHub App)\n' +
        '  • TEST_REPO_PAT (local testing with PAT)'
    );
  }

  return token;
}

/**
 * Build and validate complete configuration
 */
function buildConfig(): TestConfig {
  return {
    testRepo: parseTestRepoName(),
    auth: {
      token: getGithubToken(),
    },
    timeouts: {
      pollIntervalMs: 10_000,
      reviewTimeoutMs: 300_000,
      invokeTimeoutMs: 300_000,
      fixTimeoutMs: 600_000,
    },
  };
}

export const config: Readonly<TestConfig> = Object.freeze(buildConfig());

export const TEST_REPO_OWNER = config.testRepo.owner;
export const TEST_REPO_NAME = config.testRepo.name;
export const GITHUB_TOKEN = config.auth.token;
export const POLL_INTERVAL_MS = config.timeouts.pollIntervalMs;
export const REVIEW_TIMEOUT_MS = config.timeouts.reviewTimeoutMs;
export const INVOKE_TIMEOUT_MS = config.timeouts.invokeTimeoutMs;
export const FIX_TIMEOUT_MS = config.timeouts.fixTimeoutMs;

/**
 * Workflow files to copy to test repository
 */
export const WORKFLOWS_TO_COPY = [
  {
    source: 'examples/workflows/gemini-dispatch/gemini-dispatch.yml',
    dest: '.github/workflows/gemini-dispatch.yml',
  },
  {
    source: 'examples/workflows/pr-review/gemini-review.yml',
    dest: '.github/workflows/gemini-review.yml',
  },
  {
    source: 'examples/workflows/gemini-assistant/gemini-invoke.yml',
    dest: '.github/workflows/gemini-invoke.yml',
  },
  {
    source: 'examples/workflows/issue-triage/gemini-triage.yml',
    dest: '.github/workflows/gemini-triage.yml',
  },
];
