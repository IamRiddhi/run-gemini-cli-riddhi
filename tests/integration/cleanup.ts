/**
 * Cleanup script to remove all test artifacts from the test repository
 * Run before and after tests to ensure clean state
 */

import {
  listPullRequests,
  closePullRequest,
  listIssues,
  closeIssue,
  listBranches,
  deleteBranch,
  deleteFile,
  listWorkflowFiles,
  listCommandFiles,
} from './lib/github-operations.js';

/**
 * Close all open pull requests
 */
async function closeAllPullRequests(): Promise<void> {
  console.log('Closing all open pull requests...');
  const prs = await listPullRequests('open');

  if (prs.length === 0) {
    console.log('  No open PRs found');
    return;
  }

  for (const pr of prs) {
    console.log(`  Closing PR #${pr.number}: ${pr.title}`);
    await closePullRequest(pr.number);
  }

  console.log(`  Closed ${prs.length} PR(s)`);
}

/**
 * Close all open issues
 */
async function closeAllIssues(): Promise<void> {
  console.log('Closing all open issues...');
  const issues = await listIssues('open');

  if (issues.length === 0) {
    console.log('  No open issues found');
    return;
  }

  for (const issue of issues) {
    console.log(`  Closing issue #${issue.number}: ${issue.title}`);
    await closeIssue(issue.number);
  }

  console.log(`  Closed ${issues.length} issue(s)`);
}

/**
 * Delete all branches except main
 */
async function deleteAllBranches(): Promise<void> {
  console.log('Deleting all branches except main...');
  const branches = await listBranches();
  const branchesToDelete = branches.filter((b) => b !== 'main');

  if (branchesToDelete.length === 0) {
    console.log('  No branches to delete');
    return;
  }

  for (const branch of branchesToDelete) {
    console.log(`  Deleting branch: ${branch}`);
    await deleteBranch(branch);
  }

  console.log(`  Deleted ${branchesToDelete.length} branch(es)`);
}

/**
 * Delete all workflow files
 */
async function deleteWorkflowFiles(): Promise<void> {
  console.log('Deleting workflow files...');
  const files = await listWorkflowFiles();

  if (files.length === 0) {
    console.log('  No workflow files found');
    return;
  }

  for (const file of files) {
    console.log(`  Deleting: ${file}`);
    await deleteFile(file, 'Cleanup: Remove test workflow file');
  }

  console.log(`  Deleted ${files.length} workflow file(s)`);
}

/**
 * Delete all slash command files
 */
async function deleteCommandFiles(): Promise<void> {
  console.log('Deleting slash command files...');
  const files = await listCommandFiles();

  if (files.length === 0) {
    console.log('  No command files found');
    return;
  }

  for (const file of files) {
    console.log(`  Deleting: ${file}`);
    await deleteFile(file, 'Cleanup: Remove test command file');
  }

  console.log(`  Deleted ${files.length} command file(s)`);
}

/**
 * Delete mock code files
 */
async function deleteMockCodeFiles(): Promise<void> {
  console.log('Deleting mock code files...');

  try {
    console.log('  Deleting: src/calculator.js');
    await deleteFile('src/calculator.js', 'Cleanup: Remove test code file');
    console.log('  Deleted 1 mock code file(s)');
  } catch (error: any) {
    if (error.status === 404) {
      console.log('  No mock code files found');
    } else {
      throw error;
    }
  }
}

/**
 * Main cleanup function
 */
async function cleanup(): Promise<void> {
  console.log('Starting cleanup...\n');

  try {
    await closeAllPullRequests();
    await closeAllIssues();
    await deleteAllBranches();
    await deleteWorkflowFiles();
    await deleteCommandFiles();
    await deleteMockCodeFiles();

    console.log('\n Cleanup completed successfully!');
  } catch (error) {
    console.error('\n Cleanup failed:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  cleanup().catch((error) => {
    console.error('Cleanup error:', error);
    process.exit(1);
  });
}

export { cleanup };
