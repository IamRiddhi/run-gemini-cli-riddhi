/**
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
 * Divide two numbers
 */
function divide(a, b) {
  if (b === 0) {
    throw new Error('Cannot divide by zero');
  }
  return a / b;
}
