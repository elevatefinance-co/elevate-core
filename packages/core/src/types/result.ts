/* Every rule export returns a ComputationResult<T>. The `value` is the number the caller usually wants;
 * `steps` render a human-readable breakdown (these become rows in the Receipt PDF); `citations` is the
 * deduped provenance set rolled up from every step. Engine version lets consumers pin and cache results. */

import type { AssessmentYear, Citation } from './citation.js';

export type ComputationStep = {
  readonly label: string;
  readonly formula: string;
  readonly inputs: Readonly<Record<string, number | string>>;
  readonly output: number;
  readonly citations: readonly Citation[];
};

export type ComputationResult<T> = {
  readonly value: T;
  readonly steps: readonly ComputationStep[];
  readonly citations: readonly Citation[];
  readonly ay: AssessmentYear;
  readonly engineVersion: string;
};

export const ENGINE_VERSION = '0.0.1';
