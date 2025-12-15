/**
 * Integration test for gemini-review workflow
 * Tests that gemini-review posts a comment on PRs
 */

import { describe, it, expect } from 'vitest';
import {
  getLatestCommitSha,
  createBranch,
  createOrUpdateFile,
  createPullRequest,
  listComments,
  closePullRequest,
  deleteBranch,
} from './lib/github-operations.js';
import { POLL_INTERVAL_MS, REVIEW_TIMEOUT_MS } from './config/test-config.js';

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Poll for gemini-review comment on PR
 */
async function waitForReviewComment(prNumber: number): Promise<boolean> {
  const startTime = Date.now();
  const deadline = startTime + REVIEW_TIMEOUT_MS;

  console.log(`Polling for gemini-review comment on PR #${prNumber}...`);
  console.log(`Timeout: ${REVIEW_TIMEOUT_MS / 1000}s, Interval: ${POLL_INTERVAL_MS / 1000}s`);

  while (Date.now() < deadline) {
    const comments = await listComments(prNumber);
    console.log(`  [${Math.floor((Date.now() - startTime) / 1000)}s] Found ${comments.length} comment(s)`);

    if (comments.length > 0) {
      // Check all comments (not just latest, in case multiple bots comment)
      for (const comment of comments) {
        const bodyLower = comment.body.toLowerCase();

        // Look for github-actions bot posting review summary
        const isGeminiReview =
          comment.user === 'github-actions' &&
          (bodyLower.includes('review summary') || bodyLower.includes('📋'));

        if (isGeminiReview) {
          console.log(`  ✅ Found gemini review by: ${comment.user}`);
          console.log(`  Comment preview: ${comment.body.substring(0, 100)}...`);
          return true;
        } else {
          console.log(`  ⏭️  Skipping comment by: ${comment.user} (not gemini review)`);
        }
      }
    }

    await sleep(POLL_INTERVAL_MS);
  }

  console.log(' Timeout waiting for review comment');
  return false;
}

describe('gemini-review integration test', () => {
  it('should post a review comment on PR', async () => {
    const branchName = `test-review-pr-${Date.now()}`;
    let prNumber: number | null = null;

    try {
      console.log('\n=== Creating test PR ===');

      // Step 1: Get main's latest commit SHA
      console.log('Getting main branch SHA...');
      const mainSha = await getLatestCommitSha('main');
      console.log(`  Main SHA: ${mainSha}`);

      // Step 2: Create test branch
      console.log(`Creating branch: ${branchName}...`);
      await createBranch(branchName, mainSha);
      console.log('   Branch created');

      // Step 3: Add multiply function to calculator.js
      console.log('Adding multiply function to calculator.js...');
      const updatedCalculatorCode = `/**
 * Simple calculator module for testing gemini-review
 */

/**
 * Add two numbers
 */
function add(a, b) {
  return a + b;
}

/**
 * Subtract two numbers
 */
function subtract(a, b) {
  return a - b;
}

/**
 * Multiply two numbers
 */
function multiply(a, b) {
  return a * b;
}

/**
 * Divide two numbers
 */
function divide(a, b) {
  if (b === 0) {
    throw new Error('Cannot divide by zero');
  }
  return a / b;
}

module.exports = {
  add,
  subtract,
  multiply,
  divide,
};
`;
      await createOrUpdateFile(
        'src/calculator.js',
        updatedCalculatorCode,
        'Add multiply function to calculator',
        branchName
      );
      console.log('  Multiply function added');

      // Step 4: Create PR
      console.log('Creating pull request...');
      const pr = await createPullRequest(
        branchName,
        'main',
        `[TEST] Review integration test - ${Date.now()}`,
        'This is an automated test PR for gemini-review integration testing.'
      );
      prNumber = pr.number;
      console.log(`  PR created: #${pr.number}`);
      console.log(`  URL: ${pr.url}`);

      // Step 5: Wait for gemini-review comment
      console.log('\n=== Waiting for gemini-review ===');
      const commentFound = await waitForReviewComment(pr.number);

      // Step 6: Verify comment was posted
      expect(commentFound).toBe(true);

      console.log('\n=== Test passed! ===');
    } finally {
      // Cleanup: Always run, even if test fails
      console.log('\n=== Cleanup ===');

      if (prNumber) {
        console.log(`Closing PR #${prNumber}...`);
        await closePullRequest(prNumber);
        console.log('  PR closed');
      }

      console.log(`Deleting branch: ${branchName}...`);
      try {
        await deleteBranch(branchName);
        console.log('  Branch deleted');
      } catch (error) {
        console.log('  Branch may not exist or already deleted');
      }
    }
  });
});
