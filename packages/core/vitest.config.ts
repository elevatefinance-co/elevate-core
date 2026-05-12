/* Test runner contract for the published package.
 * Globals are enabled so test files do not need to import describe / it / expect / vi - this matches the
 * convention used by every adopter who consumes the library through vitest.
 * The coverage gate is the contract:
 * lines / statements / functions at >= 95% and branches at >= 90% are non-negotiable in CI.
 * Index barrels and type-only modules are excluded because they are pure re-exports - including them
 * would inflate coverage numbers without exercising real logic.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/**/types.ts', 'src/**/*.d.ts'],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
  },
});
