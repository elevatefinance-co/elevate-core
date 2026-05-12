/* Section 16 of the CGST Act -- Input Tax Credit eligibility. Four conditions in 16(2) that every ITC claim
 * must satisfy, plus two augmenting sub-clauses (16(2)(aa) and 16(2)(ba)) inserted by Finance Act 2021 and
 * Finance Act 2022 respectively.
 *
 * Section 16(2) base conditions:
 *   (a)   Possession of tax invoice or debit note from registered supplier
 *   (b)   Receipt of goods or services (bill-to-ship-to deemed receipt under explanation)
 *   (c)   Tax actually paid by supplier to the Government
 *   (d)   Filing of return by recipient (the GSTR-3B claim itself)
 *
 * Section 16(2)(aa) -- inserted via Finance Act 2021, effective 1 January 2022. ITC only on invoices
 * appearing in GSTR-2B. Removed the older Rule 36(4) percentage-based provisional ITC.
 *
 * Section 16(2)(ba) -- inserted via Finance Act 2022, effective 1 October 2022. ITC restriction where
 * supplier has not paid tax. Operationalised via the Rule 37 / Rule 37A reversal cycle.
 *
 * The eligibility checker returns a discriminated-union result: either ELIGIBLE with the full citation
 * chain, or INELIGIBLE with the specific failed condition and a human-readable explanation. */

import type { Citation } from '../../types/citation.js';
import { CGST_ACT_SECTIONS } from '../citations/cgst-act-sections.js';
import { CGST_RULES } from '../citations/cgst-rules.js';

export type ItcEligibilityFailure =
  | 'NO_TAX_INVOICE_OR_DEBIT_NOTE'
  | 'GOODS_OR_SERVICES_NOT_RECEIVED'
  | 'SUPPLIER_HAS_NOT_PAID_TAX'
  | 'RECIPIENT_HAS_NOT_FILED_RETURN'
  | 'INVOICE_NOT_IN_GSTR_2B_S16_2_AA'
  | 'TIME_BARRED_S16_4';

export type ItcEligibilityResult =
  | {
      readonly eligible: true;
      readonly citations: readonly Citation[];
    }
  | {
      readonly eligible: false;
      readonly failure: ItcEligibilityFailure;
      readonly citations: readonly Citation[];
      readonly notes: string;
    };

const FAILURE_NOTES: Readonly<Record<ItcEligibilityFailure, string>> = {
  NO_TAX_INVOICE_OR_DEBIT_NOTE:
    'Section 16(2)(a) -- possession of a valid tax invoice or debit note from a registered supplier is a condition precedent.',
  GOODS_OR_SERVICES_NOT_RECEIVED:
    'Section 16(2)(b) -- the recipient must have received the goods or services. Bill-to-ship-to is deemed receipt under the Section 16(2) explanation.',
  SUPPLIER_HAS_NOT_PAID_TAX:
    'Section 16(2)(c) read with Section 16(2)(ba) -- ITC is restricted where the supplier has not paid the tax to the Government. Per Finance Act 2022 effective 1 October 2022, the recipient must reverse and may re-avail when the supplier subsequently pays.',
  RECIPIENT_HAS_NOT_FILED_RETURN:
    'Section 16(2)(d) -- ITC is claimed via filing of GSTR-3B by the recipient.',
  INVOICE_NOT_IN_GSTR_2B_S16_2_AA:
    'Section 16(2)(aa) -- ITC is available only on invoices that appear in the recipient s GSTR-2B for the period. Inserted via Finance Act 2021 effective 1 January 2022.',
  TIME_BARRED_S16_4:
    'Section 16(4) -- ITC for an invoice or debit note can be claimed only up to 30 November of the year following the year in which the invoice / debit note pertains, or the date of filing the annual return for the relevant FY, whichever is earlier.',
};

export type Section16InputConditions = {
  readonly hasTaxInvoiceOrDebitNote: boolean;
  readonly goodsOrServicesReceived: boolean;
  readonly supplierHasPaidTax: boolean;
  readonly recipientWillFileReturn: boolean;
  readonly invoiceAppearsInGstr2b: boolean;
};

export function getItcEligibilityFailureNote(failure: ItcEligibilityFailure): string {
  return FAILURE_NOTES[failure];
}

export function checkSection16Eligibility(input: Section16InputConditions): ItcEligibilityResult {
  if (!input.hasTaxInvoiceOrDebitNote) {
    return {
      eligible: false,
      failure: 'NO_TAX_INVOICE_OR_DEBIT_NOTE',
      citations: [CGST_ACT_SECTIONS.SEC_16, CGST_ACT_SECTIONS.SEC_16_2],
      notes: FAILURE_NOTES.NO_TAX_INVOICE_OR_DEBIT_NOTE,
    };
  }
  if (!input.goodsOrServicesReceived) {
    return {
      eligible: false,
      failure: 'GOODS_OR_SERVICES_NOT_RECEIVED',
      citations: [CGST_ACT_SECTIONS.SEC_16, CGST_ACT_SECTIONS.SEC_16_2],
      notes: FAILURE_NOTES.GOODS_OR_SERVICES_NOT_RECEIVED,
    };
  }
  if (!input.invoiceAppearsInGstr2b) {
    return {
      eligible: false,
      failure: 'INVOICE_NOT_IN_GSTR_2B_S16_2_AA',
      citations: [CGST_ACT_SECTIONS.SEC_16_2_AA, CGST_RULES.RULE_60],
      notes: FAILURE_NOTES.INVOICE_NOT_IN_GSTR_2B_S16_2_AA,
    };
  }
  if (!input.supplierHasPaidTax) {
    return {
      eligible: false,
      failure: 'SUPPLIER_HAS_NOT_PAID_TAX',
      citations: [
        CGST_ACT_SECTIONS.SEC_16_2,
        CGST_ACT_SECTIONS.SEC_16_2_BA,
        CGST_RULES.RULE_37,
        CGST_RULES.RULE_37A,
      ],
      notes: FAILURE_NOTES.SUPPLIER_HAS_NOT_PAID_TAX,
    };
  }
  if (!input.recipientWillFileReturn) {
    return {
      eligible: false,
      failure: 'RECIPIENT_HAS_NOT_FILED_RETURN',
      citations: [CGST_ACT_SECTIONS.SEC_16_2],
      notes: FAILURE_NOTES.RECIPIENT_HAS_NOT_FILED_RETURN,
    };
  }
  return {
    eligible: true,
    citations: [
      CGST_ACT_SECTIONS.SEC_16,
      CGST_ACT_SECTIONS.SEC_16_2,
      CGST_ACT_SECTIONS.SEC_16_2_AA,
      CGST_ACT_SECTIONS.SEC_16_2_BA,
    ],
  };
}
