/* Stryker mutation testing config for elevate-core.
 *
 * The library is pure-functional and citation-locked; the entire src tree is in scope.
 * Excluded files: barrel-only index.ts re-exports (no logic), pure type-only files (.d.ts).
 * The score answers a single question: when the implementation is mutated, does the citation-locked
 * test corpus catch it.
 */

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */

const config = {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  reporters: ['progress', 'clear-text', 'json'],
  coverageAnalysis: 'perTest',
  concurrency: 4,
  timeoutMS: 60_000,

  mutate: ['src/**/*.ts', '!src/**/index.ts', '!src/**/types.ts', '!src/**/*.d.ts'],

  thresholds: {
    high: 85,
    low: 70,
    break: null,
  },
};

export default config;
