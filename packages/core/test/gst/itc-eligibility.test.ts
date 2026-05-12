/* Tests for the Section 16 ITC eligibility checker plus the
 * Section 16(4) time-bar checker. */

import {
  checkSection16Eligibility,
  checkSection16TimeBar,
  getItcEligibilityFailureNote,
  type Section16InputConditions,
} from '../../src/gst/itc/index.js';

const ALL_CONDITIONS_SATISFIED: Section16InputConditions = {
  hasTaxInvoiceOrDebitNote: true,
  goodsOrServicesReceived: true,
  supplierHasPaidTax: true,
  recipientWillFileReturn: true,
  invoiceAppearsInGstr2b: true,
};

describe('checkSection16Eligibility -- positive', () => {
  it('returns eligible when every condition is satisfied', () => {
    const result = checkSection16Eligibility(ALL_CONDITIONS_SATISFIED);
    expect(result.eligible).toBe(true);
  });

  it('eligible result cites Section 16, 16(2), 16(2)(aa), 16(2)(ba)', () => {
    const result = checkSection16Eligibility(ALL_CONDITIONS_SATISFIED);
    if (result.eligible) {
      const sectionNumbers = result.citations
        .filter((c) => c.kind === 'section')
        .map(
          (c) =>
            `${c.section}${c.subSection ? `(${c.subSection})` : ''}${c.clause ? `(${c.clause})` : ''}`,
        );
      expect(sectionNumbers).toContain('16');
      expect(sectionNumbers).toContain('16(2)');
      expect(sectionNumbers).toContain('16(2)(aa)');
      expect(sectionNumbers).toContain('16(2)(ba)');
    }
  });
});

describe('checkSection16Eligibility -- failure modes', () => {
  it('NO_TAX_INVOICE_OR_DEBIT_NOTE -- 16(2)(a)', () => {
    const result = checkSection16Eligibility({
      ...ALL_CONDITIONS_SATISFIED,
      hasTaxInvoiceOrDebitNote: false,
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.failure).toBe('NO_TAX_INVOICE_OR_DEBIT_NOTE');
      expect(result.notes).toContain('16(2)(a)');
    }
  });

  it('GOODS_OR_SERVICES_NOT_RECEIVED -- 16(2)(b)', () => {
    const result = checkSection16Eligibility({
      ...ALL_CONDITIONS_SATISFIED,
      goodsOrServicesReceived: false,
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.failure).toBe('GOODS_OR_SERVICES_NOT_RECEIVED');
  });

  it('INVOICE_NOT_IN_GSTR_2B_S16_2_AA -- 16(2)(aa) takes priority over supplier-paid', () => {
    const result = checkSection16Eligibility({
      ...ALL_CONDITIONS_SATISFIED,
      invoiceAppearsInGstr2b: false,
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.failure).toBe('INVOICE_NOT_IN_GSTR_2B_S16_2_AA');
      expect(result.notes).toContain('16(2)(aa)');
    }
  });

  it('SUPPLIER_HAS_NOT_PAID_TAX -- 16(2)(c) read with 16(2)(ba)', () => {
    const result = checkSection16Eligibility({
      ...ALL_CONDITIONS_SATISFIED,
      supplierHasPaidTax: false,
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.failure).toBe('SUPPLIER_HAS_NOT_PAID_TAX');
      expect(result.notes).toContain('16(2)(ba)');
    }
  });

  it('RECIPIENT_HAS_NOT_FILED_RETURN -- 16(2)(d)', () => {
    const result = checkSection16Eligibility({
      ...ALL_CONDITIONS_SATISFIED,
      recipientWillFileReturn: false,
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.failure).toBe('RECIPIENT_HAS_NOT_FILED_RETURN');
  });
});

describe('checkSection16TimeBar', () => {
  it('within window -- claim filed in October of next FY', () => {
    const result = checkSection16TimeBar({
      fyStartYear: 2024,
      proposedClaimDate: new Date(Date.UTC(2025, 9, 15)),
    });
    expect(result.withinWindow).toBe(true);
    expect(result.cutOffReason).toBe('NOVEMBER_30_NEXT_FY');
    expect(result.cutOffDate.getUTCFullYear()).toBe(2025);
    expect(result.cutOffDate.getUTCMonth()).toBe(10);
    expect(result.cutOffDate.getUTCDate()).toBe(30);
  });

  it('within window -- claim on the cut-off date itself', () => {
    const result = checkSection16TimeBar({
      fyStartYear: 2024,
      proposedClaimDate: new Date(Date.UTC(2025, 10, 30)),
    });
    expect(result.withinWindow).toBe(true);
  });

  it('outside window -- claim after 30 November of next FY', () => {
    const result = checkSection16TimeBar({
      fyStartYear: 2024,
      proposedClaimDate: new Date(Date.UTC(2025, 11, 1)),
    });
    expect(result.withinWindow).toBe(false);
  });

  it('annual return filed earlier short-circuits the cut-off', () => {
    const result = checkSection16TimeBar({
      fyStartYear: 2024,
      proposedClaimDate: new Date(Date.UTC(2025, 9, 15)),
      annualReturnFiledOn: new Date(Date.UTC(2025, 8, 30)),
    });
    expect(result.withinWindow).toBe(false);
    expect(result.cutOffReason).toBe('ANNUAL_RETURN_FILED');
    expect(result.cutOffDate.getUTCMonth()).toBe(8);
  });

  it('annual return filed later does not change the cut-off', () => {
    const result = checkSection16TimeBar({
      fyStartYear: 2024,
      proposedClaimDate: new Date(Date.UTC(2025, 9, 15)),
      annualReturnFiledOn: new Date(Date.UTC(2026, 0, 5)),
    });
    expect(result.cutOffReason).toBe('NOVEMBER_30_NEXT_FY');
  });

  it('cites Section 16 and Section 16(4)', () => {
    const result = checkSection16TimeBar({
      fyStartYear: 2024,
      proposedClaimDate: new Date(Date.UTC(2025, 9, 15)),
    });
    const sec164 = result.citations.find(
      (c) => c.kind === 'section' && c.section === '16' && c.subSection === '4',
    );
    expect(sec164).toBeDefined();
  });
});

describe('checkSection16Eligibility -- exact failure-note text', () => {
  it('GOODS_OR_SERVICES_NOT_RECEIVED note quotes Section 16(2)(b) and the bill-to-ship-to deemed-receipt explanation', () => {
    const result = checkSection16Eligibility({
      ...ALL_CONDITIONS_SATISFIED,
      goodsOrServicesReceived: false,
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.notes).toBe(
        'Section 16(2)(b) -- the recipient must have received the goods or services. Bill-to-ship-to is deemed receipt under the Section 16(2) explanation.',
      );
    }
  });

  it('RECIPIENT_HAS_NOT_FILED_RETURN note quotes Section 16(2)(d) GSTR-3B-by-recipient', () => {
    const result = checkSection16Eligibility({
      ...ALL_CONDITIONS_SATISFIED,
      recipientWillFileReturn: false,
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.notes).toBe(
        'Section 16(2)(d) -- ITC is claimed via filing of GSTR-3B by the recipient.',
      );
    }
  });
});

describe('checkSection16Eligibility -- per-failure citation arrays', () => {
  it('NO_TAX_INVOICE_OR_DEBIT_NOTE cites Section 16 and Section 16(2) -- exactly two', () => {
    const result = checkSection16Eligibility({
      ...ALL_CONDITIONS_SATISFIED,
      hasTaxInvoiceOrDebitNote: false,
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.citations).toHaveLength(2);
      const sectionRefs = result.citations
        .filter((c) => c.kind === 'section')
        .map((c) => `${c.section}${c.subSection ? `(${c.subSection})` : ''}`);
      expect(sectionRefs).toContain('16');
      expect(sectionRefs).toContain('16(2)');
    }
  });

  it('GOODS_OR_SERVICES_NOT_RECEIVED cites Section 16 and Section 16(2) -- exactly two', () => {
    const result = checkSection16Eligibility({
      ...ALL_CONDITIONS_SATISFIED,
      goodsOrServicesReceived: false,
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.citations).toHaveLength(2);
      const sectionRefs = result.citations
        .filter((c) => c.kind === 'section')
        .map((c) => `${c.section}${c.subSection ? `(${c.subSection})` : ''}`);
      expect(sectionRefs).toContain('16');
      expect(sectionRefs).toContain('16(2)');
    }
  });

  it('INVOICE_NOT_IN_GSTR_2B_S16_2_AA cites Section 16(2)(aa) and Rule 60', () => {
    const result = checkSection16Eligibility({
      ...ALL_CONDITIONS_SATISFIED,
      invoiceAppearsInGstr2b: false,
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.citations).toHaveLength(2);
      const sec16AA = result.citations.find(
        (c) =>
          c.kind === 'section' && c.section === '16' && c.subSection === '2' && c.clause === 'aa',
      );
      expect(sec16AA).toBeDefined();
      const rule60 = result.citations.find((c) => c.kind === 'rule' && c.ruleNumber === '60');
      expect(rule60).toBeDefined();
    }
  });

  it('SUPPLIER_HAS_NOT_PAID_TAX cites Section 16(2), Section 16(2)(ba), Rule 37, Rule 37A -- exactly four', () => {
    const result = checkSection16Eligibility({
      ...ALL_CONDITIONS_SATISFIED,
      supplierHasPaidTax: false,
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.citations).toHaveLength(4);
      const sec162 = result.citations.find(
        (c) =>
          c.kind === 'section' &&
          c.section === '16' &&
          c.subSection === '2' &&
          c.clause === undefined,
      );
      expect(sec162).toBeDefined();
      const sec16BA = result.citations.find(
        (c) =>
          c.kind === 'section' && c.section === '16' && c.subSection === '2' && c.clause === 'ba',
      );
      expect(sec16BA).toBeDefined();
      const rule37 = result.citations.find((c) => c.kind === 'rule' && c.ruleNumber === '37');
      expect(rule37).toBeDefined();
      const rule37A = result.citations.find((c) => c.kind === 'rule' && c.ruleNumber === '37A');
      expect(rule37A).toBeDefined();
    }
  });

  it('TIME_BARRED_S16_4 note quotes Section 16(4) and the 30-November / annual-return cut-off rule', () => {
    expect(getItcEligibilityFailureNote('TIME_BARRED_S16_4')).toBe(
      'Section 16(4) -- ITC for an invoice or debit note can be claimed only up to 30 November of the year following the year in which the invoice / debit note pertains, or the date of filing the annual return for the relevant FY, whichever is earlier.',
    );
  });

  it('RECIPIENT_HAS_NOT_FILED_RETURN cites exactly Section 16(2)', () => {
    const result = checkSection16Eligibility({
      ...ALL_CONDITIONS_SATISFIED,
      recipientWillFileReturn: false,
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.citations).toHaveLength(1);
      const sec162 = result.citations[0];
      if (sec162?.kind === 'section') {
        expect(sec162.section).toBe('16');
        expect(sec162.subSection).toBe('2');
      }
    }
  });
});
