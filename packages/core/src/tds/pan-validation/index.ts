/* Barrel for the tds pan-validation sub-namespace. The specified-person check is the main module today;
 * format validation is delegated to elevate-app's src/server/lib/pan-format helper to avoid duplicating the
 * regex. */

export * from './specified-person.js';
