#!/usr/bin/env node
/* Apply branch protection rules to `main` by translating .github/branch-protection.yml
 * into the JSON shape the GitHub REST API expects, then calling `gh api`.
 * Idempotent: re-running with no YAML change is a no-op.
 *
 * Prerequisites:
 *  - `gh` CLI installed and authenticated (`gh auth login`).
 *  - The authenticated user has admin permission on the target repository.
 *  - Run from the repository root: `node scripts/apply-branch-protection.mjs`.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(moduleDirectory, '..');
const yamlPath = join(repositoryRoot, '.github', 'branch-protection.yml');

function parseYaml(yamlText) {
  const result = {};
  const stack = [{ indent: -1, container: result }];
  const lines = yamlText.split('\n');
  for (const rawLine of lines) {
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue;
    const indent = rawLine.length - rawLine.trimStart().length;
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].container;
    const lineContent = rawLine.trim();
    if (lineContent.startsWith('- ')) {
      const value = lineContent.slice(2).trim();
      if (Array.isArray(parent)) {
        parent.push(parseScalar(value));
      }
      continue;
    }
    const colonIndex = lineContent.indexOf(':');
    if (colonIndex === -1) continue;
    const key = lineContent.slice(0, colonIndex).trim();
    const rawValue = lineContent.slice(colonIndex + 1).trim();
    if (!rawValue) {
      const child = looksLikeArrayChild(lines, indent) ? [] : {};
      parent[key] = child;
      stack.push({ indent, container: child });
    } else {
      parent[key] = parseScalar(rawValue);
    }
  }
  return result;
}

function parseScalar(text) {
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (text === 'null') return null;
  if (/^-?\d+$/.test(text)) return Number.parseInt(text, 10);
  if (text.startsWith('"') && text.endsWith('"')) return text.slice(1, -1);
  return text;
}

function looksLikeArrayChild(lines, parentIndent) {
  for (const line of lines) {
    if (!line.trim()) continue;
    const indent = line.length - line.trimStart().length;
    if (indent <= parentIndent) continue;
    return line.trimStart().startsWith('- ');
  }
  return false;
}

function buildProtectionPayload(yamlData) {
  const protection = yamlData.branches?.main;
  if (!protection) {
    throw new Error('branches.main not found in branch-protection.yml');
  }
  return {
    required_status_checks: protection.required_status_checks
      ? {
          strict: Boolean(protection.required_status_checks.strict),
          contexts: protection.required_status_checks.contexts ?? [],
        }
      : null,
    enforce_admins: Boolean(protection.enforce_admins),
    required_pull_request_reviews: protection.required_pull_request_reviews
      ? {
          required_approving_review_count:
            protection.required_pull_request_reviews.required_approving_review_count ?? 1,
          dismiss_stale_reviews: Boolean(
            protection.required_pull_request_reviews.dismiss_stale_reviews,
          ),
          require_code_owner_reviews: Boolean(
            protection.required_pull_request_reviews.require_code_owner_reviews,
          ),
          require_last_push_approval: Boolean(
            protection.required_pull_request_reviews.require_last_push_approval,
          ),
        }
      : null,
    restrictions: protection.restrictions ?? null,
    required_linear_history: Boolean(protection.required_linear_history),
    allow_force_pushes: Boolean(protection.allow_force_pushes),
    allow_deletions: Boolean(protection.allow_deletions),
    required_conversation_resolution: Boolean(protection.required_conversation_resolution),
    required_signatures: Boolean(protection.required_signatures),
  };
}

function detectRepository() {
  const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
  const match = remoteUrl.match(/[:/]([^/:]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) {
    throw new Error(`Could not parse owner/name from remote URL: ${remoteUrl}`);
  }
  return { owner: match[1], name: match[2] };
}

function main() {
  const yamlText = readFileSync(yamlPath, 'utf8');
  const yamlData = parseYaml(yamlText);
  const payload = buildProtectionPayload(yamlData);
  const repository = detectRepository();
  const apiPath = `repos/${repository.owner}/${repository.name}/branches/main/protection`;
  const jsonBody = JSON.stringify(payload);
  console.log(`Applying branch protection to ${repository.owner}/${repository.name}#main`);
  console.log(`Payload:\n${jsonBody}`);
  const result = execSync(
    `gh api --method PUT ${apiPath} --input - <<<'${jsonBody.replace(/'/g, "'\\''")}'`,
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'] },
  );
  console.log('Result:', result);
  console.log('Branch protection applied.');
}

main();
