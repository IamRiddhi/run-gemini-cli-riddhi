/**
 * Setup script to copy workflow files to test repository
 * Run before tests to prepare the test environment
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createOrUpdateFile } from './lib/github-operations.js';
import { WORKFLOWS_TO_COPY } from './config/test-config.js';

/**
 * Copy workflow files to test repository
 */
async function copyWorkflowFiles(): Promise<void> {
  console.log('Copying workflow files to test repository...');

  for (const workflow of WORKFLOWS_TO_COPY) {
    console.log(`  Copying ${workflow.source} → ${workflow.dest}`);
    const content = readFileSync(join(process.cwd(), workflow.source), 'utf-8');
    await createOrUpdateFile(
      workflow.dest,
      content,
      `Setup: Copy ${workflow.source}`,
      'main'
    );
  }

  console.log(`  Copied ${WORKFLOWS_TO_COPY.length} workflow file(s)`);
}


/**
 * Copy mock code files to test repository
 */
async function copyMockCode(): Promise<void> {
  console.log('Copying mock code to test repository...');

  const calculatorCode = readFileSync(
    join(process.cwd(), 'tests/integration/mock-code/calculator.js'),
    'utf-8'
  );

  await createOrUpdateFile(
    'src/calculator.js',
    calculatorCode,
    'Setup: Add sample calculator code',
    'main'
  );

  console.log('  Copied calculator.js to src/');
}

/**
 * Main setup function
 */
async function setup(): Promise<void> {
  console.log('Starting setup...\n');

  try {
    await copyWorkflowFiles();
    await copyMockCode();

    console.log('\n Setup completed successfully!');
  } catch (error) {
    console.error('\n Setup failed:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  setup().catch((error) => {
    console.error('Setup error:', error);
    process.exit(1);
  });
}

export { setup };
