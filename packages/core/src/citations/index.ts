/* Public barrel for the citation system. Four canonical lookup tables (sections, finance-acts, rules,
 * circulars) live here. Centralising the lookups means a section's metadata (act, official name, common
 * abbreviation) is captured once and referenced everywhere - a future rename is a single file edit rather
 * than a project-wide find-and-replace that could miss a downstream UI string. */

export * from './sections.js';
export * from './finance-acts.js';
export * from './rules.js';
export * from './circulars.js';
