/* Shared types for the place-of-supply resolvers. The four resolver modules (goods, imports-exports,
 * services-india, services-cross-border) cover Sections 10 through 13 of the IGST Act. Each resolver
 * returns a canonical PlaceOfSupplyResolution shape: a state code or 'OUTSIDE_INDIA' sentinel, plus the
 * citations that justify the call. */

import type { Citation } from '../../types/citation.js';

export type IndianStateCode = string;

export type PlaceOfSupplyOutcome =
  | { readonly kind: 'state'; readonly stateCode: IndianStateCode }
  | { readonly kind: 'outside-india' };

export type PlaceOfSupplyResolution = {
  readonly outcome: PlaceOfSupplyOutcome;
  readonly resolverApplied: string;
  readonly citations: readonly Citation[];
  readonly notes?: string;
};

export function asState(stateCode: IndianStateCode): PlaceOfSupplyOutcome {
  return { kind: 'state', stateCode };
}

export const OUTSIDE_INDIA: PlaceOfSupplyOutcome = { kind: 'outside-india' };

export function isIntraState(
  recipientStateCode: IndianStateCode,
  resolution: PlaceOfSupplyResolution,
): boolean {
  if (resolution.outcome.kind !== 'state') return false;
  return resolution.outcome.stateCode === recipientStateCode;
}

export function isInterState(
  recipientStateCode: IndianStateCode,
  resolution: PlaceOfSupplyResolution,
): boolean {
  if (resolution.outcome.kind === 'outside-india') return true;
  return resolution.outcome.stateCode !== recipientStateCode;
}
