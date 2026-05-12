/* Section 80TTA / 80TTB. Interest on deposits. Two sister deductions, mutually exclusive based on
 * senior-citizen status:
 *
 *   **80TTA**. Non-senior taxpayer. Rs. 10,000 cap on interest from **savings accounts only** (NOT FDs / RDs).
 *   Banks, post office, co-op banks qualify. Interest from fixed deposits / recurring deposits is taxable in
 *   full under "Income from Other Sources" even if within this ceiling.
 *
 *   **80TTB**. Senior citizen (60+). Rs. 50,000 cap on interest from **any deposit**. Savings, FD, RD,
 *   post-office schemes. Wider scope than 80TTA because seniors rely on deposit interest.
 *
 * A senior CANNOT claim 80TTA. They take 80TTB instead. Non-seniors cannot claim 80TTB. This module enforces
 * the split.
 *
 * New-regime: both disallowed. */

import { SECTIONS } from '../citations/index.js';
import type { AssessmentYear, Citation } from '../types/citation.js';
import type { ComputationResult, ComputationStep } from '../types/result.js';
import { ENGINE_VERSION } from '../types/result.js';
import { dedupeCitations } from '../types/citation.js';
import { guardRegime } from './new-regime-eligibility.js';

export const SECTION_80TTA_CAP = 10_000;
export const SECTION_80TTB_CAP = 50_000;

export type ComputeSection80ttaArgs = {
  readonly regime: 'NEW' | 'OLD';
  readonly savingsInterest: number;
  readonly isSeniorCitizen: boolean;
  readonly ay: AssessmentYear;
};

export function computeSection80tta({
  regime,
  savingsInterest,
  isSeniorCitizen,
  ay,
}: ComputeSection80ttaArgs): ComputationResult<number> {
  const steps: ComputationStep[] = [];
  const citations: Citation[] = [SECTIONS.SEC_80TTA];

  const guard = guardRegime({ regime, sectionKey: 'SEC_80TTA' });
  if (!guard.allowed) {
    steps.push({
      label: 'Section 80TTA not available. New regime',
      formula: 'deduction = 0',
      inputs: { regime, reason: guard.reason },
      output: 0,
      citations: [SECTIONS.SEC_80TTA, SECTIONS.SEC_115BAC],
    });
    return {
      value: 0,
      steps,
      citations: dedupeCitations([...citations, SECTIONS.SEC_115BAC]),
      ay,
      engineVersion: ENGINE_VERSION,
    };
  }

  if (isSeniorCitizen) {
    steps.push({
      label: 'Section 80TTA blocked. Senior citizen claims 80TTB instead',
      formula: 'deduction = 0',
      inputs: { isSeniorCitizen: String(isSeniorCitizen) },
      output: 0,
      citations: [SECTIONS.SEC_80TTA, SECTIONS.SEC_80TTB],
    });
    return {
      value: 0,
      steps,
      citations: dedupeCitations([...citations, SECTIONS.SEC_80TTB]),
      ay,
      engineVersion: ENGINE_VERSION,
    };
  }

  const allowable = Math.min(Math.max(0, savingsInterest), SECTION_80TTA_CAP);
  steps.push({
    label: `Section 80TTA. Savings interest, cap Rs. ${SECTION_80TTA_CAP.toLocaleString('en-IN')}`,
    formula: 'min(savings_interest, 10000)',
    inputs: { savingsInterest, cap: SECTION_80TTA_CAP, allowable },
    output: allowable,
    citations: [SECTIONS.SEC_80TTA],
  });

  return {
    value: allowable,
    steps,
    citations: dedupeCitations([...citations, ...steps.flatMap((step) => step.citations)]),
    ay,
    engineVersion: ENGINE_VERSION,
  };
}

export type ComputeSection80ttbArgs = {
  readonly regime: 'NEW' | 'OLD';
  readonly depositInterest: number;
  readonly isSeniorCitizen: boolean;
  readonly ay: AssessmentYear;
};

export function computeSection80ttb({
  regime,
  depositInterest,
  isSeniorCitizen,
  ay,
}: ComputeSection80ttbArgs): ComputationResult<number> {
  const steps: ComputationStep[] = [];
  const citations: Citation[] = [SECTIONS.SEC_80TTB];

  const guard = guardRegime({ regime, sectionKey: 'SEC_80TTB' });
  if (!guard.allowed) {
    steps.push({
      label: 'Section 80TTB not available. New regime',
      formula: 'deduction = 0',
      inputs: { regime, reason: guard.reason },
      output: 0,
      citations: [SECTIONS.SEC_80TTB, SECTIONS.SEC_115BAC],
    });
    return {
      value: 0,
      steps,
      citations: dedupeCitations([...citations, SECTIONS.SEC_115BAC]),
      ay,
      engineVersion: ENGINE_VERSION,
    };
  }

  if (!isSeniorCitizen) {
    steps.push({
      label: 'Section 80TTB blocked. Non-senior must claim 80TTA instead',
      formula: 'deduction = 0',
      inputs: { isSeniorCitizen: String(isSeniorCitizen) },
      output: 0,
      citations: [SECTIONS.SEC_80TTB, SECTIONS.SEC_80TTA],
    });
    return {
      value: 0,
      steps,
      citations: dedupeCitations([...citations, SECTIONS.SEC_80TTA]),
      ay,
      engineVersion: ENGINE_VERSION,
    };
  }

  const allowable = Math.min(Math.max(0, depositInterest), SECTION_80TTB_CAP);
  steps.push({
    label: `Section 80TTB. Senior deposit interest, cap Rs. ${SECTION_80TTB_CAP.toLocaleString('en-IN')}`,
    formula: 'min(deposit_interest, 50000)',
    inputs: { depositInterest, cap: SECTION_80TTB_CAP, allowable },
    output: allowable,
    citations: [SECTIONS.SEC_80TTB],
  });

  return {
    value: allowable,
    steps,
    citations: dedupeCitations([...citations, ...steps.flatMap((step) => step.citations)]),
    ay,
    engineVersion: ENGINE_VERSION,
  };
}
