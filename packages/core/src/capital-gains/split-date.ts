/* The Finance (No. 2) Act 2024 split every capital-gains rate at the date of its Presidential assent.
 * 23 July 2024. Transactions with a sale date strictly before that date apply the pre-split rate;
 * transactions on or after that date apply the post-split rate. This constant is the single source of truth
 * for that boundary across every capital-gains rule in the package.
 *
 * Expressed as a Unix millisecond timestamp so consumers compare via
 * `new Date(saleDateIso).getTime() >= CAPITAL_GAINS_SPLIT_DATE_MS`. The date's timezone is immaterial because
 * the split is legal, not market-hours. A sale anywhere in the world on 23-Jul-2024 applies the post-split
 * rate regardless of IST vs UTC. */

export const CAPITAL_GAINS_SPLIT_DATE_ISO = '2024-07-23';

export const CAPITAL_GAINS_SPLIT_DATE_MS = new Date(
  `${CAPITAL_GAINS_SPLIT_DATE_ISO}T00:00:00Z`,
).getTime();

export function isPostSplitDate(dateIso: string): boolean {
  return new Date(dateIso).getTime() >= CAPITAL_GAINS_SPLIT_DATE_MS;
}

export function isPreSplitDate(dateIso: string): boolean {
  return !isPostSplitDate(dateIso);
}
