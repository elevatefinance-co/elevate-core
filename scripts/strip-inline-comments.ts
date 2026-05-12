/* AST-based comment stripper. Removes every comment except the contiguous top-of-file
 * block, leaving the structure top-comment then blank line then code. Uses the full
 * TypeScript parser so regex literals, JSX expressions, and string contents are correctly
 * distinguished from real comments. */

import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as ts from 'typescript';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const EXCLUDED_DIR_NAMES = new Set([
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  '.cache',
  'dist',
  'build',
  'coverage',
  'generated',
  'target',
  'ios',
  'android',
  '.stryker-tmp',
  'reports',
  '.vercel',
  '.husky',
]);

const EXCLUDED_PATH_SUBSTRINGS = [
  path.sep + 'prisma' + path.sep + 'generated' + path.sep,
  path.sep + 'prisma' + path.sep + 'migrations' + path.sep,
  path.sep + 'prisma' + path.sep + 'playbook' + path.sep,
  path.sep + 'desktop' + path.sep + 'src-tauri' + path.sep + 'target' + path.sep,
];

const EXCLUDED_FILE_EXTS = new Set([
  '.json',
  '.md',
  '.mdx',
  '.txt',
  '.lock',
  '.lockb',
  '.tsbuildinfo',
  '.png',
  '.jpg',
  '.jpeg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
  '.gif',
  '.bmp',
  '.webp',
  '.avif',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.snap',
  '.mp3',
  '.mp4',
  '.wav',
  '.heic',
  '.bin',
  '.so',
  '.dylib',
  '.dll',
  '.exe',
  '.wasm',
]);

const EXCLUDED_FILE_BASENAMES = new Set([
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'bun.lockb',
  'LICENSE',
  'LICENCE',
  'NOTICE',
]);

const TS_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const CSS_EXTS = new Set(['.css', '.scss', '.less', '.sass']);
const YAML_EXTS = new Set(['.yml', '.yaml', '.toml']);
const SHELL_EXTS = new Set(['.sh', '.bash', '.zsh']);
const SQL_EXTS = new Set(['.sql']);
const PRISMA_EXTS = new Set(['.prisma']);
const HTML_EXTS = new Set(['.html', '.htm', '.svg', '.xml']);

type Lang = 'ts' | 'css' | 'yaml' | 'shell' | 'sql' | 'prisma' | 'html' | 'dockerfile';

type Outcome =
  | { kind: 'strip'; lang: Lang; bytesRemoved: number }
  | { kind: 'keep'; lang: Lang }
  | { kind: 'skip'; reason: string }
  | { kind: 'parse-error'; lang: Lang; message: string };

const SELF_PATH = path.resolve(REPO_ROOT, 'scripts', 'strip-inline-comments.ts');

function detectLang(filePath: string): Lang | null {
  const base = path.basename(filePath).toLowerCase();
  if (base === 'dockerfile' || base.startsWith('dockerfile.')) return 'dockerfile';
  if (base === '.editorconfig' || base === '.prettierrc' || base === '.npmrc') return 'yaml';
  if (base === '.gitignore' || base === '.gitattributes' || base === '.dockerignore')
    return 'shell';
  const ext = path.extname(filePath).toLowerCase();
  if (TS_EXTS.has(ext)) return 'ts';
  if (CSS_EXTS.has(ext)) return 'css';
  if (YAML_EXTS.has(ext)) return 'yaml';
  if (SHELL_EXTS.has(ext)) return 'shell';
  if (SQL_EXTS.has(ext)) return 'sql';
  if (PRISMA_EXTS.has(ext)) return 'prisma';
  if (HTML_EXTS.has(ext)) return 'html';
  return null;
}

function shouldSkip(filePath: string): string | null {
  if (path.resolve(filePath) === SELF_PATH) return 'self';
  const base = path.basename(filePath);
  if (EXCLUDED_FILE_BASENAMES.has(base)) return 'baseline-excluded';
  const baseLower = base.toLowerCase();
  if (baseLower.startsWith('.env')) return 'env';
  const ext = path.extname(filePath).toLowerCase();
  if (EXCLUDED_FILE_EXTS.has(ext)) return 'ext:' + ext;
  for (const sub of EXCLUDED_PATH_SUBSTRINGS) {
    if (filePath.includes(sub)) return 'excluded-path';
  }
  return null;
}

function isLikelyBinary(filePath: string): boolean {
  try {
    const fd = fs.openSync(filePath, 'r');
    try {
      const buf = Buffer.alloc(1024);
      const bytesRead = fs.readSync(fd, buf, 0, 1024, 0);
      for (let i = 0; i < bytesRead; i += 1) {
        const byte = buf[i];
        if (byte === undefined) continue;
        if (byte === 0) return true;
        if (byte < 0x20 && byte !== 0x09 && byte !== 0x0a && byte !== 0x0d) return true;
      }
      return false;
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return false;
  }
}

const PRAGMA_PATTERNS: RegExp[] = [
  /^\/\/\/\s*<reference\s+(path|types|lib)\s*=/,
  /^\/\/\s*@?vitest-environment\b/i,
  /^\/\*\s*@?vitest-environment\b/i,
  /^\/\/\s*@ts-(expect-error|ignore|nocheck|check)\b/,
  /^\/\*\s*@ts-(expect-error|ignore|nocheck|check)\b/,
  /^\/\/\s*prettier-ignore\b/,
  /^\/\*\s*prettier-ignore\b/,
  /^\/\/\s*eslint-(disable|enable)/,
  /^\/\*\s*eslint-(disable|enable)/,
  /^\/\/\s*biome-(ignore|disable)/,
  /^\/\*\s*biome-(ignore|disable)/,
  /^\/\/\s*istanbul\s+ignore\b/,
  /^\/\/\s*c8\s+ignore\b/,
  /^\/\/\s*@jsx\b/,
  /^\/\/\s*@jsxImportSource\b/,
  /^\/\*\s*@?jsxImportSource\b/,
  /^#!\s*\//,
  /^\/\*\*[^/]/,
];

function isFunctionalPragma(text: string): boolean {
  for (const re of PRAGMA_PATTERNS) {
    if (re.test(text)) return true;
  }
  return false;
}

function getScriptKind(filePath: string): ts.ScriptKind {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.tsx') return ts.ScriptKind.TSX;
  if (ext === '.ts' || ext === '.mts' || ext === '.cts') return ts.ScriptKind.TS;
  if (ext === '.jsx') return ts.ScriptKind.JSX;
  if (ext === '.js' || ext === '.mjs' || ext === '.cjs') return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

type Range = { pos: number; end: number };

function collectAllCommentRanges(source: string, sf: ts.SourceFile): Range[] {
  const seen = new Set<string>();
  const out: Range[] = [];

  const recordRange = (pos: number, end: number) => {
    const key = pos + ':' + end;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ pos, end });
  };

  const visit = (node: ts.Node) => {
    if (!ts.isSourceFile(node)) {
      const leading = ts.getLeadingCommentRanges(source, node.getFullStart());
      if (leading) {
        for (const r of leading) recordRange(r.pos, r.end);
      }
      const trailing = ts.getTrailingCommentRanges(source, node.getEnd());
      if (trailing) {
        for (const r of trailing) recordRange(r.pos, r.end);
      }
    }
    if (ts.isBlock(node) && node.statements.length === 0) {
      const open = node.getStart();
      const close = node.getEnd();
      const inner = ts.getLeadingCommentRanges(source, open + 1);
      if (inner) {
        for (const r of inner) {
          if (r.end <= close) recordRange(r.pos, r.end);
        }
      }
    }
    if (ts.isModuleBlock(node) && node.statements.length === 0) {
      const open = node.getStart();
      const close = node.getEnd();
      const inner = ts.getLeadingCommentRanges(source, open + 1);
      if (inner) {
        for (const r of inner) {
          if (r.end <= close) recordRange(r.pos, r.end);
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  const topLeading = ts.getLeadingCommentRanges(source, 0);
  if (topLeading) {
    for (const r of topLeading) recordRange(r.pos, r.end);
  }

  visit(sf);

  const eofTrailing = ts.getTrailingCommentRanges(source, sf.getEnd());
  if (eofTrailing) {
    for (const r of eofTrailing) recordRange(r.pos, r.end);
  }

  out.sort((a, b) => a.pos - b.pos);
  return out;
}

function collectJsxEmptyExpressions(sf: ts.SourceFile): Range[] {
  const out: Range[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxExpression(node) && node.expression === undefined) {
      out.push({ pos: node.getStart(), end: node.getEnd() });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

function findShebangEnd(source: string): number {
  if (!source.startsWith('#!')) return 0;
  const nl = source.indexOf('\n');
  return nl === -1 ? source.length : nl + 1;
}

function findFirstStatementStart(sf: ts.SourceFile, source: string): number {
  if (sf.statements.length === 0) return source.length;
  const first = sf.statements[0];
  if (!first) return source.length;
  return first.getStart(sf);
}

function isOnOwnLine(source: string, range: Range): boolean {
  let lineStart = range.pos;
  while (lineStart > 0 && source.charAt(lineStart - 1) !== '\n') {
    const ch = source.charAt(lineStart - 1);
    if (ch !== ' ' && ch !== '\t') return false;
    lineStart -= 1;
  }
  let lineEnd = range.end;
  while (lineEnd < source.length && source.charAt(lineEnd) !== '\n') {
    const ch = source.charAt(lineEnd);
    if (ch !== ' ' && ch !== '\t') return false;
    lineEnd += 1;
  }
  return true;
}

function widenRangeToConsumeOwnLine(source: string, range: Range): Range {
  let pos = range.pos;
  while (pos > 0 && source.charAt(pos - 1) !== '\n') {
    const ch = source.charAt(pos - 1);
    if (ch !== ' ' && ch !== '\t') break;
    pos -= 1;
  }
  let end = range.end;
  while (end < source.length && (source.charAt(end) === ' ' || source.charAt(end) === '\t')) {
    end += 1;
  }
  if (end < source.length && source.charAt(end) === '\n') end += 1;
  return { pos, end };
}

function widenRangeToTrimTrailingSpaces(source: string, range: Range): Range {
  let pos = range.pos;
  while (pos > 0) {
    const ch = source.charAt(pos - 1);
    if (ch !== ' ' && ch !== '\t') break;
    pos -= 1;
  }
  return { pos, end: range.end };
}

function applyRemovals(source: string, removals: Range[]): string {
  const sorted = removals.slice().sort((a, b) => b.pos - a.pos);
  let result = source;
  for (const r of sorted) {
    if (r.pos < 0 || r.end > result.length || r.pos >= r.end) continue;
    result = result.slice(0, r.pos) + result.slice(r.end);
  }
  return result;
}

function normalizeWhitespace(source: string): string {
  let out = source.replace(/\r\n/g, '\n');
  out = out.replace(/[ \t]+\n/g, '\n');
  out = out.replace(/\n{3,}/g, '\n\n');
  if (!out.endsWith('\n')) out += '\n';
  out = out.replace(/\n+$/g, '\n');
  return out;
}

function ensureBlankLineAfterTopBlock(source: string): string {
  let pos = findShebangEnd(source);
  while (pos < source.length) {
    const ch = source.charAt(pos);
    const next = pos + 1 < source.length ? source.charAt(pos + 1) : '';
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      pos += 1;
      continue;
    }
    if (ch === '/' && next === '/') {
      while (pos < source.length && source.charAt(pos) !== '\n') pos += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      const closeIdx = source.indexOf('*/', pos + 2);
      if (closeIdx === -1) return source;
      pos = closeIdx + 2;
      continue;
    }
    break;
  }

  const topEnd = pos;
  if (topEnd === 0) {
    let out = source.replace(/^\n+/, '');
    if (!out.endsWith('\n')) out += '\n';
    return out;
  }

  const head = source.slice(0, topEnd).replace(/\s+$/, '');
  const tail = source.slice(topEnd).replace(/^\s+/, '');
  let result = head + '\n\n' + tail;
  if (!result.endsWith('\n')) result += '\n';
  result = result.replace(/\n+$/g, '\n');
  return result;
}

function stripTs(source: string, filePath: string): { output: string; bytesRemoved: number } {
  const sf = ts.createSourceFile(
    path.basename(filePath),
    source,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(filePath),
  );

  const firstCodePos = findFirstStatementStart(sf, source);
  const shebangEnd = findShebangEnd(source);

  const comments = collectAllCommentRanges(source, sf);
  const jsxEmpties = collectJsxEmptyExpressions(sf);

  const jsxEmptyByCommentEnd = new Map<number, Range>();
  for (const jsx of jsxEmpties) {
    for (const c of comments) {
      if (c.pos >= jsx.pos && c.end <= jsx.end) {
        jsxEmptyByCommentEnd.set(c.end, jsx);
      }
    }
  }

  const removals: Range[] = [];

  for (const jsx of jsxEmpties) {
    if (jsx.pos < firstCodePos) continue;
    removals.push(widenRangeToConsumeOwnLine(source, jsx));
  }

  for (const c of comments) {
    if (c.end <= firstCodePos) continue;
    if (c.pos < shebangEnd) continue;
    if (jsxEmptyByCommentEnd.has(c.end)) continue;
    const text = source.slice(c.pos, c.end);
    if (isFunctionalPragma(text)) continue;
    const widened = isOnOwnLine(source, c)
      ? widenRangeToConsumeOwnLine(source, c)
      : widenRangeToTrimTrailingSpaces(source, c);
    removals.push(widened);
  }

  const stripped = applyRemovals(source, removals);
  const normalized = ensureBlankLineAfterTopBlock(normalizeWhitespace(stripped));

  return { output: normalized, bytesRemoved: source.length - normalized.length };
}

function stripCss(source: string): { output: string; bytesRemoved: number } {
  const ranges: Range[] = [];
  let i = 0;
  let mode = 0;
  while (i < source.length) {
    const ch = source.charAt(i);
    const next = i + 1 < source.length ? source.charAt(i + 1) : '';
    if (mode === 0) {
      if (ch === '\\' && i + 1 < source.length) {
        i += 2;
        continue;
      }
      if (ch === "'") {
        mode = 1;
        i += 1;
        continue;
      }
      if (ch === '"') {
        mode = 2;
        i += 1;
        continue;
      }
      if (
        ch === 'u' &&
        source.charAt(i + 1) === 'r' &&
        source.charAt(i + 2) === 'l' &&
        source.charAt(i + 3) === '('
      ) {
        mode = 3;
        i += 4;
        continue;
      }
      if (ch === '/' && next === '*') {
        const closeIdx = source.indexOf('*/', i + 2);
        if (closeIdx === -1) {
          i = source.length;
          break;
        }
        ranges.push({ pos: i, end: closeIdx + 2 });
        i = closeIdx + 2;
        continue;
      }
      i += 1;
      continue;
    }
    if (mode === 1 && ch === "'") {
      mode = 0;
      i += 1;
      continue;
    }
    if (mode === 2 && ch === '"') {
      mode = 0;
      i += 1;
      continue;
    }
    if (mode === 3 && ch === ')') {
      mode = 0;
      i += 1;
      continue;
    }
    if (ch === '\\' && i + 1 < source.length) {
      i += 2;
      continue;
    }
    i += 1;
  }

  let topEnd = 0;
  if (ranges.length > 0) {
    const sorted = ranges.slice().sort((a, b) => a.pos - b.pos);
    for (const r of sorted) {
      const between = source.slice(topEnd, r.pos);
      if (/^\s*$/.test(between)) {
        topEnd = r.end;
      } else {
        break;
      }
    }
  }

  const removals: Range[] = [];
  for (const r of ranges) {
    if (r.end <= topEnd) continue;
    if (isFunctionalPragma(source.slice(r.pos, r.end))) continue;
    const widened = isOnOwnLine(source, r)
      ? widenRangeToConsumeOwnLine(source, r)
      : widenRangeToTrimTrailingSpaces(source, r);
    removals.push(widened);
  }

  const stripped = applyRemovals(source, removals);
  const normalized = ensureBlankLineAfterTopBlock(normalizeWhitespace(stripped));
  return { output: normalized, bytesRemoved: source.length - normalized.length };
}

function stripHashLang(source: string): { output: string; bytesRemoved: number } {
  const lines = source.replace(/\r\n/g, '\n').split('\n');

  let topEnd = -1;
  let lineCursor = 0;
  if (lines[0]?.startsWith('#!')) {
    topEnd = 0;
    lineCursor = 1;
  }
  for (let i = lineCursor; i < lines.length; i += 1) {
    const line = lines[i];
    if (line === undefined) break;
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      topEnd = i;
      continue;
    }
    break;
  }

  const outLines: string[] = [];
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (line === undefined) continue;
    if (lineIndex <= topEnd) {
      outLines.push(line);
      continue;
    }

    let inSingle = false;
    let inDouble = false;
    let dollarBraceDepth = 0;
    let dollarParenDepth = 0;
    let inBacktick = false;
    let cutAt = -1;
    let prevCh = '';

    for (let j = 0; j < line.length; j += 1) {
      const ch = line.charAt(j);
      const next = j + 1 < line.length ? line.charAt(j + 1) : '';

      if (inSingle) {
        if (ch === "'") inSingle = false;
        prevCh = ch;
        continue;
      }
      if (inDouble) {
        if (ch === '\\' && j + 1 < line.length) {
          j += 1;
          prevCh = '';
          continue;
        }
        if (ch === '$' && next === '{') {
          dollarBraceDepth += 1;
          j += 1;
          prevCh = '';
          continue;
        }
        if (ch === '$' && next === '(') {
          dollarParenDepth += 1;
          j += 1;
          prevCh = '';
          continue;
        }
        if (ch === '}' && dollarBraceDepth > 0) {
          dollarBraceDepth -= 1;
          prevCh = ch;
          continue;
        }
        if (ch === ')' && dollarParenDepth > 0) {
          dollarParenDepth -= 1;
          prevCh = ch;
          continue;
        }
        if (ch === '"') inDouble = false;
        prevCh = ch;
        continue;
      }
      if (ch === '\\' && j + 1 < line.length) {
        j += 1;
        prevCh = '';
        continue;
      }
      if (ch === "'") {
        inSingle = true;
        prevCh = ch;
        continue;
      }
      if (ch === '"') {
        inDouble = true;
        prevCh = ch;
        continue;
      }
      if (ch === '`') {
        inBacktick = !inBacktick;
        prevCh = ch;
        continue;
      }
      if (ch === '$' && next === '{') {
        dollarBraceDepth += 1;
        j += 1;
        prevCh = '';
        continue;
      }
      if (ch === '$' && next === '(') {
        dollarParenDepth += 1;
        j += 1;
        prevCh = '';
        continue;
      }
      if (ch === '{' && dollarBraceDepth > 0) {
        dollarBraceDepth += 1;
        prevCh = ch;
        continue;
      }
      if (ch === '}' && dollarBraceDepth > 0) {
        dollarBraceDepth -= 1;
        prevCh = ch;
        continue;
      }
      if (ch === '(' && dollarParenDepth > 0) {
        dollarParenDepth += 1;
        prevCh = ch;
        continue;
      }
      if (ch === ')' && dollarParenDepth > 0) {
        dollarParenDepth -= 1;
        prevCh = ch;
        continue;
      }
      if (
        ch === '#' &&
        dollarBraceDepth === 0 &&
        dollarParenDepth === 0 &&
        !inBacktick &&
        (prevCh === '' || prevCh === ' ' || prevCh === '\t')
      ) {
        cutAt = j;
        break;
      }
      prevCh = ch;
    }

    if (cutAt === -1) {
      outLines.push(line);
      continue;
    }
    const before = line.slice(0, cutAt).replace(/\s+$/, '');
    if (before === '') continue;
    outLines.push(before);
  }

  let result = outLines.join('\n');
  result = result.replace(/\n{3,}/g, '\n\n');
  if (!result.endsWith('\n')) result += '\n';
  result = result.replace(/\n+$/g, '\n');
  return { output: result, bytesRemoved: source.length - result.length };
}

function stripSql(source: string): { output: string; bytesRemoved: number } {
  const ranges: Range[] = [];
  let i = 0;
  let mode = 0;
  let dollarTag = '';
  while (i < source.length) {
    const ch = source.charAt(i);
    const next = i + 1 < source.length ? source.charAt(i + 1) : '';
    if (mode === 0) {
      if (ch === "'") {
        mode = 1;
        i += 1;
        continue;
      }
      if (ch === '"') {
        mode = 2;
        i += 1;
        continue;
      }
      if (ch === '$') {
        const tagMatch = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(source.slice(i));
        if (tagMatch) {
          dollarTag = tagMatch[0];
          mode = 3;
          i += dollarTag.length;
          continue;
        }
      }
      if (ch === '-' && next === '-') {
        let lineEnd = source.indexOf('\n', i);
        if (lineEnd === -1) lineEnd = source.length;
        ranges.push({ pos: i, end: lineEnd });
        i = lineEnd;
        continue;
      }
      if (ch === '/' && next === '*') {
        const closeIdx = source.indexOf('*/', i + 2);
        if (closeIdx === -1) {
          i = source.length;
          break;
        }
        ranges.push({ pos: i, end: closeIdx + 2 });
        i = closeIdx + 2;
        continue;
      }
      i += 1;
      continue;
    }
    if (mode === 1) {
      if (ch === "'" && next === "'") {
        i += 2;
        continue;
      }
      if (ch === "'") {
        mode = 0;
        i += 1;
        continue;
      }
      i += 1;
      continue;
    }
    if (mode === 2) {
      if (ch === '"' && next === '"') {
        i += 2;
        continue;
      }
      if (ch === '"') {
        mode = 0;
        i += 1;
        continue;
      }
      i += 1;
      continue;
    }
    if (mode === 3) {
      if (source.startsWith(dollarTag, i)) {
        mode = 0;
        i += dollarTag.length;
        dollarTag = '';
        continue;
      }
      i += 1;
      continue;
    }
    i += 1;
  }

  let topEnd = 0;
  if (ranges.length > 0) {
    const sorted = ranges.slice().sort((a, b) => a.pos - b.pos);
    for (const r of sorted) {
      const between = source.slice(topEnd, r.pos);
      if (/^\s*$/.test(between)) {
        topEnd = r.end;
      } else {
        break;
      }
    }
  }

  const removals: Range[] = [];
  for (const r of ranges) {
    if (r.end <= topEnd) continue;
    const widened = isOnOwnLine(source, r)
      ? widenRangeToConsumeOwnLine(source, r)
      : widenRangeToTrimTrailingSpaces(source, r);
    removals.push(widened);
  }
  const stripped = applyRemovals(source, removals);
  const normalized = ensureBlankLineAfterTopBlock(normalizeWhitespace(stripped));
  return { output: normalized, bytesRemoved: source.length - normalized.length };
}

function stripPrisma(source: string): { output: string; bytesRemoved: number } {
  const ranges: Range[] = [];
  let i = 0;
  let mode = 0;
  while (i < source.length) {
    const ch = source.charAt(i);
    const next = i + 1 < source.length ? source.charAt(i + 1) : '';
    if (mode === 0) {
      if (ch === "'") {
        mode = 1;
        i += 1;
        continue;
      }
      if (ch === '"') {
        mode = 2;
        i += 1;
        continue;
      }
      if (ch === '/' && next === '/') {
        let lineEnd = source.indexOf('\n', i);
        if (lineEnd === -1) lineEnd = source.length;
        ranges.push({ pos: i, end: lineEnd });
        i = lineEnd;
        continue;
      }
      if (ch === '/' && next === '*') {
        const closeIdx = source.indexOf('*/', i + 2);
        if (closeIdx === -1) {
          i = source.length;
          break;
        }
        ranges.push({ pos: i, end: closeIdx + 2 });
        i = closeIdx + 2;
        continue;
      }
      i += 1;
      continue;
    }
    if (mode === 1 && ch === "'") {
      mode = 0;
      i += 1;
      continue;
    }
    if (mode === 2 && ch === '"') {
      mode = 0;
      i += 1;
      continue;
    }
    if (ch === '\\' && i + 1 < source.length) {
      i += 2;
      continue;
    }
    i += 1;
  }

  let topEnd = 0;
  if (ranges.length > 0) {
    const sorted = ranges.slice().sort((a, b) => a.pos - b.pos);
    for (const r of sorted) {
      const between = source.slice(topEnd, r.pos);
      if (/^\s*$/.test(between)) {
        topEnd = r.end;
      } else {
        break;
      }
    }
  }

  const removals: Range[] = [];
  for (const r of ranges) {
    if (r.end <= topEnd) continue;
    const widened = isOnOwnLine(source, r)
      ? widenRangeToConsumeOwnLine(source, r)
      : widenRangeToTrimTrailingSpaces(source, r);
    removals.push(widened);
  }
  const stripped = applyRemovals(source, removals);
  const normalized = ensureBlankLineAfterTopBlock(normalizeWhitespace(stripped));
  return { output: normalized, bytesRemoved: source.length - normalized.length };
}

function stripHtml(source: string): { output: string; bytesRemoved: number } {
  const ranges: Range[] = [];
  let i = 0;
  while (i < source.length) {
    const idx = source.indexOf('<!--', i);
    if (idx === -1) break;
    const close = source.indexOf('-->', idx + 4);
    if (close === -1) break;
    ranges.push({ pos: idx, end: close + 3 });
    i = close + 3;
  }
  let topEnd = 0;
  if (ranges.length > 0) {
    const sorted = ranges.slice().sort((a, b) => a.pos - b.pos);
    for (const r of sorted) {
      const between = source.slice(topEnd, r.pos);
      if (/^\s*$/.test(between)) {
        topEnd = r.end;
      } else {
        break;
      }
    }
  }
  const removals: Range[] = [];
  for (const r of ranges) {
    if (r.end <= topEnd) continue;
    const widened = isOnOwnLine(source, r)
      ? widenRangeToConsumeOwnLine(source, r)
      : widenRangeToTrimTrailingSpaces(source, r);
    removals.push(widened);
  }
  const stripped = applyRemovals(source, removals);
  const normalized = ensureBlankLineAfterTopBlock(normalizeWhitespace(stripped));
  return { output: normalized, bytesRemoved: source.length - normalized.length };
}

async function processFile(filePath: string): Promise<Outcome> {
  const skipReason = shouldSkip(filePath);
  if (skipReason !== null) return { kind: 'skip', reason: skipReason };
  const lang = detectLang(filePath);
  if (lang === null) return { kind: 'skip', reason: 'unknown-lang' };
  if (isLikelyBinary(filePath)) return { kind: 'skip', reason: 'binary' };
  const source = await fsp.readFile(filePath, 'utf8');
  try {
    let result: { output: string; bytesRemoved: number };
    if (lang === 'ts') {
      result = stripTs(source, filePath);
    } else if (lang === 'css') {
      result = stripCss(source);
    } else if (lang === 'yaml' || lang === 'shell' || lang === 'dockerfile') {
      result = stripHashLang(source);
    } else if (lang === 'sql') {
      result = stripSql(source);
    } else if (lang === 'prisma') {
      result = stripPrisma(source);
    } else {
      result = stripHtml(source);
    }
    if (result.output === source) return { kind: 'keep', lang };
    await fsp.writeFile(filePath, result.output, 'utf8');
    return { kind: 'strip', lang, bytesRemoved: result.bytesRemoved };
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    return { kind: 'parse-error', lang, message };
  }
}

async function walk(root: string, files: string[]): Promise<void> {
  const entries = await fsp.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIR_NAMES.has(entry.name)) continue;
      if (entry.name.startsWith('.')) {
        if (
          entry.name === '.husky' ||
          entry.name === '.git' ||
          entry.name === '.next' ||
          entry.name === '.turbo' ||
          entry.name === '.cache' ||
          entry.name === '.vercel' ||
          entry.name === '.stryker-tmp'
        ) {
          continue;
        }
      }
      await walk(path.join(root, entry.name), files);
    } else if (entry.isFile()) {
      files.push(path.join(root, entry.name));
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('usage: strip-inline-comments.ts <file-or-dir> [<file-or-dir> ...]');
    process.exit(2);
  }

  const targets: string[] = [];
  for (const arg of args) {
    const abs = path.resolve(arg);
    let stat: fs.Stats;
    try {
      stat = await fsp.stat(abs);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      await walk(abs, targets);
    } else if (stat.isFile()) {
      targets.push(abs);
    }
  }

  const perLang: Record<string, { seen: number; stripped: number; bytesRemoved: number }> = {};
  let totalSeen = 0;
  let totalStripped = 0;
  let totalBytesRemoved = 0;
  let totalParseErrors = 0;

  for (const filePath of targets) {
    totalSeen += 1;
    const outcome = await processFile(filePath);
    const langKey =
      outcome.kind === 'skip'
        ? 'skip'
        : outcome.kind === 'parse-error'
          ? 'parse-error'
          : outcome.lang;
    if (!perLang[langKey]) perLang[langKey] = { seen: 0, stripped: 0, bytesRemoved: 0 };
    perLang[langKey].seen += 1;
    if (outcome.kind === 'strip') {
      perLang[langKey].stripped += 1;
      perLang[langKey].bytesRemoved += outcome.bytesRemoved;
      totalStripped += 1;
      totalBytesRemoved += outcome.bytesRemoved;
      console.log(
        'strip ' + path.relative(REPO_ROOT, filePath) + ' -' + outcome.bytesRemoved + 'B',
      );
    } else if (outcome.kind === 'parse-error') {
      totalParseErrors += 1;
      console.log('PARSE-ERROR ' + path.relative(REPO_ROOT, filePath) + ': ' + outcome.message);
    } else if (outcome.kind === 'skip') {
      console.log('skip  ' + path.relative(REPO_ROOT, filePath) + ' (' + outcome.reason + ')');
    } else {
      console.log('keep  ' + path.relative(REPO_ROOT, filePath));
    }
  }

  console.log('');
  console.log('=== summary ===');
  console.log('total files seen:     ' + totalSeen);
  console.log('total files stripped: ' + totalStripped);
  console.log('total bytes removed:  ' + totalBytesRemoved);
  console.log('total parse errors:   ' + totalParseErrors);
  for (const key of Object.keys(perLang).sort()) {
    const stats = perLang[key];
    if (!stats) continue;
    console.log(
      '  ' +
        key.padEnd(15) +
        ' seen=' +
        stats.seen +
        ' stripped=' +
        stats.stripped +
        ' bytes=' +
        stats.bytesRemoved,
    );
  }
  if (totalParseErrors > 0) process.exit(1);
}

void main().catch((caught: unknown) => {
  console.error(caught instanceof Error ? caught.stack : caught);
  process.exit(2);
});
