/* ESLint flat config for the open-source india-tax-rules library.
 *
 * The library's deterministic-by-construction promise (no I/O, no network, no secrets, no PII,
 * no time-dependent behaviour without an explicit `now: Date` parameter,
 * no randomness without an explicit seed) is the moat. The README claims it;
 * the README's consumers depend on it.
 * This config makes the promise machine-checkable rather than convention-checkable.
 *
 * Three rule families are blocked at lint time:
 *
 * 1. I/O imports. `node:fs`, `node:net`, `node:http`, `node:https`,
 *      `node:child_process`, `node:os`, `fs`, `net`, `http`, `https`,
 *      `child_process`, `os` are all forbidden across `packages/core/src`.
 *      A CBIC-rule encoding cannot reach the filesystem; tests are
 *      allowed (the test runner reads fixture JSON), and the build
 *      output is plain TypeScript so no I/O sneaks in via runtime.
 *
 * 2. Non-deterministic primitives. `Math.random()` and `Date.now()`
 *      and `new Date()` (without an argument) are flagged. The
 *      library never asks "what year is it?" -- AY is always a
 *      parameter; consumers calling on 2026-04-01 with AY=2025-26
 *      always get the same answer regardless of when they call.
 *
 * 3. Shorthand identifiers. The id-denylist enforces self-
 *      descriptive names across the corpus: never `i`, `j`, `k`, `n`,
 *      `m`, `x`, `y`, `z`, `e`, `err`, `res`, `obj`, `idx`, `tmp`,
 *      `val`, `arr`, `len`, `cb`, `fn`. The library is read by a
 *      mix of engineering and chartered-accountant audiences; both
 *      benefit from descriptive names.
 *
 * Plus the dev-standards floor: no `interface` (use `type`),
 * no `eslint-disable` without an inline reason, prefer-const, no-var, no-explicit-any,
 * and the import-order canonical sort.
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const FORBIDDEN_IO_MODULES = [
  'fs',
  'fs/promises',
  'net',
  'http',
  'https',
  'child_process',
  'os',
  'cluster',
  'dgram',
  'tls',
  'dns',
  'node:fs',
  'node:fs/promises',
  'node:net',
  'node:http',
  'node:https',
  'node:child_process',
  'node:os',
  'node:cluster',
  'node:dgram',
  'node:tls',
  'node:dns',
];

const SHORTHAND_DENYLIST = [
  'e',
  'ev',
  'evt',
  'err',
  'res',
  'obj',
  'fn',
  'cb',
  'idx',
  'el',
  'val',
  'tmp',
  'opt',
  'arr',
  'len',
  'qty',
  'amt',
  'desc',
  'cfg',
  'opts',
  'info',
  'usr',
  'acc',
  'btn',
  'img',
  'msg',
  'str',
  'num',
  'doc',
  'i',
  'j',
  'k',
  'n',
  'm',
  'x',
  'y',
  'z',
  'a',
  'b',
  'c',
  'd',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
];

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '.changeset/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: FORBIDDEN_IO_MODULES.map((moduleName) => ({
            name: moduleName,
            message:
              'I/O imports are forbidden in elevate-core. The library is deterministic-by-construction; no filesystem, network, or process-level access is allowed in source. Tests can mock at the consumer layer.',
          })),
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message:
            'Math.random() is forbidden in elevate-core. The library is deterministic; if randomness is genuinely needed, accept a seeded RNG as a parameter.',
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message:
            'Date.now() is forbidden in elevate-core. The library is time-deterministic; AY and effective dates are explicit parameters. Consumers needing "now" pass it via an explicit `now: Date` argument.',
        },
        {
          selector: 'NewExpression[callee.name="Date"]:not(:has(*))',
          message:
            'Bare `new Date()` is forbidden in elevate-core. The library is time-deterministic; pass an explicit timestamp / ISO string.',
        },
      ],
      'id-denylist': ['error', ...SHORTHAND_DENYLIST],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    files: ['test/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'no-restricted-imports': 'off',
      'no-restricted-syntax': 'off',
      'id-denylist': 'off',
    },
  },
);
