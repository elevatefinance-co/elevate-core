/* The Citation primitive is the moat. Every rule export that produces a number must also produce a
 * structured citation that a CA. Or the IT department. Would accept as the provenance of that number.
 * We model it as a discriminated union so consumers can render each kind differently (e.g. Section links to
 * indiacode.nic.in, Circular links to incometaxindia.gov.in, Finance Act links to the e-gazette). */

export type AssessmentYear = `AY${number}-${number}`;

export type StatuteAct =
  | 'IT_ACT_1961'
  | 'BLACK_MONEY_ACT_2015'
  | 'CGST_ACT_2017'
  | 'IGST_ACT_2017'
  | 'SGST_ACT_2017'
  | 'UTGST_ACT_2017'
  | 'COMPENSATION_CESS_ACT_2017';

export type StatuteRules = 'IT_RULES_1962' | 'CGST_RULES_2017' | 'IGST_RULES_2017';

export type SectionCitation = {
  readonly kind: 'section';
  readonly act: StatuteAct;
  readonly section: string;
  readonly subSection?: string;
  readonly clause?: string;
  readonly note?: string;
};

export type CircularCitation = {
  readonly kind: 'circular';
  readonly number: string;
  readonly date: string;
  readonly url?: string;
  readonly note?: string;
};

export type NotificationCitation = {
  readonly kind: 'notification';
  readonly number: string;
  readonly date: string;
  readonly family?:
    | 'CBDT'
    | 'CBIC_CT'
    | 'CBIC_CT_RATE'
    | 'CBIC_IT'
    | 'CBIC_IT_RATE'
    | 'CBIC_COMP_CESS_RATE';
  readonly url?: string;
  readonly note?: string;
};

export type FinanceActCitation = {
  readonly kind: 'finance-act';
  readonly year: number;
  readonly section?: string;
  readonly note?: string;
};

export type IcaiGnCitation = {
  readonly kind: 'icai-gn';
  readonly number: string;
  readonly year: number;
  readonly url?: string;
  readonly note?: string;
};

export type RuleCitation = {
  readonly kind: 'rule';
  readonly ruleNumber: string;
  readonly rules?: StatuteRules;
  readonly subRule?: string;
  readonly note?: string;
};

export type GstCouncilMeetingCitation = {
  readonly kind: 'gst-council-meeting';
  readonly meetingNumber: number;
  readonly date: string;
  readonly note?: string;
};

export type Citation =
  | SectionCitation
  | CircularCitation
  | NotificationCitation
  | FinanceActCitation
  | IcaiGnCitation
  | RuleCitation
  | GstCouncilMeetingCitation;

export function dedupeCitations(citations: readonly Citation[]): readonly Citation[] {
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const citation of citations) {
    const key = JSON.stringify(citation);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(citation);
  }
  return out;
}
