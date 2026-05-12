/* Tests for the TDS citation registries -- ITA Sections,
 * IT Rules 1962, Finance Acts, and CBDT Circulars. */

import {
  CBDT_CIRCULARS,
  FINANCE_ACTS_TDS,
  IT_RULES,
  ITA_SECTIONS,
} from '../../src/tds/citations/index.js';
import { ita } from '../../src/tds/citations/ita-sections.js';
import { itr } from '../../src/tds/citations/it-rules.js';
import { fa as faTds } from '../../src/tds/citations/finance-acts.js';
import { circular } from '../../src/tds/citations/cbdt-circulars.js';

describe('ITA_SECTIONS registry', () => {
  it('every entry is a section citation against IT_ACT_1961', () => {
    for (const entry of Object.values(ITA_SECTIONS)) {
      expect(entry.kind).toBe('section');
      expect(entry.act).toBe('IT_ACT_1961');
    }
  });

  it('Chapter XVII-B sections present (192 / 192A / 193 / 194 / 194A)', () => {
    expect(ITA_SECTIONS.SEC_192.section).toBe('192');
    expect(ITA_SECTIONS.SEC_192A.section).toBe('192A');
    expect(ITA_SECTIONS.SEC_193.section).toBe('193');
    expect(ITA_SECTIONS.SEC_194.section).toBe('194');
    expect(ITA_SECTIONS.SEC_194A.section).toBe('194A');
  });

  it('post-2021 sections (194Q / 194R / 194S / 194T / 194BA) present', () => {
    expect(ITA_SECTIONS.SEC_194Q.section).toBe('194Q');
    expect(ITA_SECTIONS.SEC_194R.section).toBe('194R');
    expect(ITA_SECTIONS.SEC_194S.section).toBe('194S');
    expect(ITA_SECTIONS.SEC_194T.section).toBe('194T');
    expect(ITA_SECTIONS.SEC_194BA.section).toBe('194BA');
  });

  it('non-resident sections (195 / 196A-D) and PAN-based uplift sections (206AA / 206AB) present', () => {
    expect(ITA_SECTIONS.SEC_195.section).toBe('195');
    expect(ITA_SECTIONS.SEC_196A.section).toBe('196A');
    expect(ITA_SECTIONS.SEC_196D.section).toBe('196D');
    expect(ITA_SECTIONS.SEC_206AA.section).toBe('206AA');
    expect(ITA_SECTIONS.SEC_206AB.section).toBe('206AB');
  });

  it('TCS sub-clauses (206C / 206C(1F) / 206C(1H)) present', () => {
    expect(ITA_SECTIONS.SEC_206C.section).toBe('206C');
    expect(ITA_SECTIONS.SEC_206C_1F.subSection).toBe('1F');
    expect(ITA_SECTIONS.SEC_206C_1H.subSection).toBe('1H');
  });

  it('penalty sections (234E / 271H / 276B / 272BB) present', () => {
    expect(ITA_SECTIONS.SEC_234E.section).toBe('234E');
    expect(ITA_SECTIONS.SEC_271H.section).toBe('271H');
    expect(ITA_SECTIONS.SEC_276B.section).toBe('276B');
    expect(ITA_SECTIONS.SEC_272BB.section).toBe('272BB');
  });

  it('omits subSection and clause on plain sections (SEC_192 salary TDS)', () => {
    expect('subSection' in ITA_SECTIONS.SEC_192).toBe(false);
    expect('clause' in ITA_SECTIONS.SEC_192).toBe(false);
    expect('note' in ITA_SECTIONS.SEC_192).toBe(true);
  });

  it('includes subSection but omits clause on Section 201(1A) interest', () => {
    expect('subSection' in ITA_SECTIONS.SEC_201_1A).toBe(true);
    expect(ITA_SECTIONS.SEC_201_1A.subSection).toBe('1A');
    expect('clause' in ITA_SECTIONS.SEC_201_1A).toBe(false);
    expect('note' in ITA_SECTIONS.SEC_201_1A).toBe(true);
  });

  it('includes clause but omits subSection on Section 194I(a) plant-and-machinery rent', () => {
    expect('subSection' in ITA_SECTIONS.SEC_194I_A).toBe(false);
    expect('clause' in ITA_SECTIONS.SEC_194I_A).toBe(true);
    expect(ITA_SECTIONS.SEC_194I_A.clause).toBe('a');
    expect('note' in ITA_SECTIONS.SEC_194I_A).toBe(true);
  });

  it('includes subSection and clause on Section 272A(2)(k) Form 16 / 16A penalty', () => {
    expect('subSection' in ITA_SECTIONS.SEC_272A_2_K).toBe(true);
    expect(ITA_SECTIONS.SEC_272A_2_K.subSection).toBe('2');
    expect('clause' in ITA_SECTIONS.SEC_272A_2_K).toBe(true);
    expect(ITA_SECTIONS.SEC_272A_2_K.clause).toBe('k');
    expect('note' in ITA_SECTIONS.SEC_272A_2_K).toBe(true);
  });

  it('every entry registers a note', () => {
    for (const [registryKey, entry] of Object.entries(ITA_SECTIONS)) {
      expect('note' in entry, `${registryKey} missing note`).toBe(true);
      expect(entry.note?.length, `${registryKey} note empty`).toBeGreaterThan(0);
    }
  });

  it('matches the exact registered shape for SEC_192 (only note set)', () => {
    expect(ITA_SECTIONS.SEC_192).toEqual({
      kind: 'section',
      act: 'IT_ACT_1961',
      section: '192',
      note: 'TDS on salaries -- slab-rate computation',
    });
    expect(Object.keys(ITA_SECTIONS.SEC_192).sort()).toEqual(['act', 'kind', 'note', 'section']);
  });

  it('matches the exact registered shape for SEC_201_1A (subSection + note)', () => {
    expect(ITA_SECTIONS.SEC_201_1A).toEqual({
      kind: 'section',
      act: 'IT_ACT_1961',
      section: '201',
      subSection: '1A',
      note: '1 / 1.5 percent monthly interest on delayed deduction / payment',
    });
  });

  it('matches the exact registered shape for SEC_194I_A (clause + note, subSection omitted)', () => {
    expect(ITA_SECTIONS.SEC_194I_A).toEqual({
      kind: 'section',
      act: 'IT_ACT_1961',
      section: '194I',
      clause: 'a',
      note: 'TDS on rent of plant / machinery / equipment -- 2 percent above Rs 50,000 per month from 1 April 2025 (Rs 2.4 lakh per FY prior)',
    });
    expect(Object.keys(ITA_SECTIONS.SEC_194I_A).sort()).toEqual([
      'act',
      'clause',
      'kind',
      'note',
      'section',
    ]);
  });

  it('matches the exact registered shape for SEC_272A_2_K (all optional fields set)', () => {
    expect(ITA_SECTIONS.SEC_272A_2_K).toEqual({
      kind: 'section',
      act: 'IT_ACT_1961',
      section: '272A',
      subSection: '2',
      clause: 'k',
      note: 'Penalty for failure to file Form 16 / 16A on time -- Rs 100 per day, capped at TDS',
    });
    expect(Object.keys(ITA_SECTIONS.SEC_272A_2_K).sort()).toEqual([
      'act',
      'clause',
      'kind',
      'note',
      'section',
      'subSection',
    ]);
  });

  it('omits the note key when the ita factory is called with note undefined', () => {
    const result = ita('999X', undefined, undefined, undefined);
    expect('note' in result).toBe(false);
    expect(Object.keys(result).sort()).toEqual(['act', 'kind', 'section']);
  });

  it('omits the note key when the ita factory is called with note omitted entirely', () => {
    const result = ita('998X');
    expect('note' in result).toBe(false);
  });
});

describe('IT_RULES registry', () => {
  it('every entry is a rule citation against IT_RULES_1962', () => {
    for (const entry of Object.values(IT_RULES)) {
      expect(entry.kind).toBe('rule');
      expect(entry.rules).toBe('IT_RULES_1962');
    }
  });

  it('Rule 31A (quarterly TDS statement) and 31AA (TCS) present', () => {
    expect(IT_RULES.RULE_31A.ruleNumber).toBe('31A');
    expect(IT_RULES.RULE_31AA.ruleNumber).toBe('31AA');
  });

  it('Rule 37BC (Section 206AA bypass for non-residents) present', () => {
    expect(IT_RULES.RULE_37BC.ruleNumber).toBe('37BC');
  });

  it('Rule 30(2) (transactional 30-day window) present', () => {
    expect(IT_RULES.RULE_30_2.ruleNumber).toBe('30');
    expect(IT_RULES.RULE_30_2.subRule).toBe('2');
  });

  it('omits subRule on parent rules (RULE_26 / RULE_30 / RULE_31)', () => {
    expect('subRule' in IT_RULES.RULE_26).toBe(false);
    expect('subRule' in IT_RULES.RULE_30).toBe(false);
    expect('subRule' in IT_RULES.RULE_31).toBe(false);
    expect('note' in IT_RULES.RULE_26).toBe(true);
  });

  it('includes subRule on Rule 30(1A) and Rule 31A(4)', () => {
    expect('subRule' in IT_RULES.RULE_30_1A).toBe(true);
    expect(IT_RULES.RULE_30_1A.subRule).toBe('1A');
    expect('subRule' in IT_RULES.RULE_31A_4).toBe(true);
    expect(IT_RULES.RULE_31A_4.subRule).toBe('4');
  });

  it('every entry registers a note', () => {
    for (const [registryKey, entry] of Object.entries(IT_RULES)) {
      expect('note' in entry, `${registryKey} missing note`).toBe(true);
      expect(entry.note?.length, `${registryKey} note empty`).toBeGreaterThan(0);
    }
  });

  it('matches the exact registered shape for RULE_26 (no subRule, note set)', () => {
    expect(IT_RULES.RULE_26).toEqual({
      kind: 'rule',
      ruleNumber: '26',
      rules: 'IT_RULES_1962',
      note: 'Rate for foreign-currency conversion -- TDS computation in INR for non-resident payments',
    });
    expect(Object.keys(IT_RULES.RULE_26).sort()).toEqual(['kind', 'note', 'ruleNumber', 'rules']);
  });

  it('matches the exact registered shape for RULE_30_1A (subRule + note set)', () => {
    expect(IT_RULES.RULE_30_1A).toEqual({
      kind: 'rule',
      ruleNumber: '30',
      rules: 'IT_RULES_1962',
      subRule: '1A',
      note: 'Mode of payment -- challan ITNS-281 (general) or challan-cum-statement (26QB / 26QC / 26QD / 26QE)',
    });
    expect(Object.keys(IT_RULES.RULE_30_1A).sort()).toEqual([
      'kind',
      'note',
      'ruleNumber',
      'rules',
      'subRule',
    ]);
  });

  it('omits the note key when the itr factory is called with note undefined', () => {
    const result = itr('999X', undefined, undefined);
    expect('note' in result).toBe(false);
    expect(Object.keys(result).sort()).toEqual(['kind', 'ruleNumber', 'rules']);
  });

  it('omits the note key when the itr factory is called with note omitted entirely', () => {
    const result = itr('998X');
    expect('note' in result).toBe(false);
  });
});

describe('FINANCE_ACTS_TDS registry', () => {
  it('every entry is a finance-act citation', () => {
    for (const entry of Object.values(FINANCE_ACTS_TDS)) {
      expect(entry.kind).toBe('finance-act');
    }
  });

  it('FA (No. 2) 2024 coverage -- 6 Oct 2024 rate reductions + 194D Apr 2025 reduction + 194T introduction + 194F repeal', () => {
    expect(FINANCE_ACTS_TDS.FA_2024_S194D_REDUCTION.year).toBe(2024);
    expect(FINANCE_ACTS_TDS.FA_2024_S194D_REDUCTION.note).toContain('effective 1 April 2025');
    expect(FINANCE_ACTS_TDS.FA_2024_OCT_CLIFF_194DA.year).toBe(2024);
    expect(FINANCE_ACTS_TDS.FA_2024_OCT_CLIFF_194G.year).toBe(2024);
    expect(FINANCE_ACTS_TDS.FA_2024_OCT_CLIFF_194H.year).toBe(2024);
    expect(FINANCE_ACTS_TDS.FA_2024_OCT_CLIFF_194_IB.year).toBe(2024);
    expect(FINANCE_ACTS_TDS.FA_2024_OCT_CLIFF_194M.year).toBe(2024);
    expect(FINANCE_ACTS_TDS.FA_2024_OCT_CLIFF_194O.year).toBe(2024);
    expect(FINANCE_ACTS_TDS.FA_2024_S194T.section).toBe('194T');
    expect(FINANCE_ACTS_TDS.FA_2024_S194F_REPEAL.section).toBe('194F');
  });

  it('Finance Act 2021 / 2022 / 2023 introductions present', () => {
    expect(FINANCE_ACTS_TDS.FA_2021_S194Q.section).toBe('194Q');
    expect(FINANCE_ACTS_TDS.FA_2022_S194R.section).toBe('194R');
    expect(FINANCE_ACTS_TDS.FA_2022_S194S.section).toBe('194S');
    expect(FINANCE_ACTS_TDS.FA_2023_S194BA.section).toBe('194BA');
  });

  it('Finance Act 2025 coverage -- threshold rationalization entries + 206AB omission present', () => {
    expect(FINANCE_ACTS_TDS.FA_2025_S206AB_OMISSION.year).toBe(2025);
    expect(FINANCE_ACTS_TDS.FA_2025_S206AB_OMISSION.section).toBe('206AB');
    expect(FINANCE_ACTS_TDS.FA_2025_THRESHOLD_193.section).toBe('193');
    expect(FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194.section).toBe('194');
    expect(FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194A.section).toBe('194A');
    expect(FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194B.section).toBe('194B');
    expect(FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194BB.section).toBe('194BB');
    expect(FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194D.section).toBe('194D');
    expect(FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194H.section).toBe('194H');
    expect(FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194I.section).toBe('194-I');
    expect(FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194J.section).toBe('194J');
    expect(FINANCE_ACTS_TDS.FA_2025_THRESHOLD_194K.section).toBe('194K');
  });

  it('omits section key on FA_2022_RULE_88B (Rule-only entry, no Section)', () => {
    expect('section' in FINANCE_ACTS_TDS.FA_2022_RULE_88B).toBe(false);
    expect('note' in FINANCE_ACTS_TDS.FA_2022_RULE_88B).toBe(true);
  });

  it('includes the section key with the registered value on every section-bearing entry', () => {
    expect('section' in FINANCE_ACTS_TDS.FA_2021_S194Q).toBe(true);
    expect(FINANCE_ACTS_TDS.FA_2021_S194Q.section).toBe('194Q');
    expect('section' in FINANCE_ACTS_TDS.FA_2024_S194T).toBe(true);
    expect(FINANCE_ACTS_TDS.FA_2024_S194T.section).toBe('194T');
    expect('section' in FINANCE_ACTS_TDS.FA_2024_S194F_REPEAL).toBe(true);
    expect(FINANCE_ACTS_TDS.FA_2024_S194F_REPEAL.section).toBe('194F');
  });

  it('every entry registers a note', () => {
    for (const [registryKey, entry] of Object.entries(FINANCE_ACTS_TDS)) {
      expect('note' in entry, `${registryKey} missing note`).toBe(true);
      expect(entry.note?.length, `${registryKey} note empty`).toBeGreaterThan(0);
    }
  });

  it('matches the exact registered shape for FA_2022_RULE_88B (no section, note set)', () => {
    expect(FINANCE_ACTS_TDS.FA_2022_RULE_88B).toEqual({
      kind: 'finance-act',
      year: 2022,
      note: 'Rule 88B inserted -- net-cash interest computation under Section 50 (this also applies to GST regime)',
    });
    expect(Object.keys(FINANCE_ACTS_TDS.FA_2022_RULE_88B).sort()).toEqual(['kind', 'note', 'year']);
  });

  it('matches the exact registered shape for FA_2021_S194Q (section + note set)', () => {
    expect(FINANCE_ACTS_TDS.FA_2021_S194Q).toEqual({
      kind: 'finance-act',
      year: 2021,
      section: '194Q',
      note: 'Section 194Q introduced -- TDS by buyer on goods purchase, effective 1 July 2021',
    });
    expect(Object.keys(FINANCE_ACTS_TDS.FA_2021_S194Q).sort()).toEqual([
      'kind',
      'note',
      'section',
      'year',
    ]);
  });

  it('omits the note key when the tds fa factory is called with note undefined', () => {
    const result = faTds(2099, undefined, undefined);
    expect('note' in result).toBe(false);
    expect(Object.keys(result).sort()).toEqual(['kind', 'year']);
  });

  it('omits the note key when the tds fa factory is called with note omitted entirely', () => {
    const result = faTds(2098);
    expect('note' in result).toBe(false);
  });
});

describe('CBDT_CIRCULARS registry', () => {
  it('every entry is a circular citation', () => {
    for (const entry of Object.values(CBDT_CIRCULARS)) {
      expect(entry.kind).toBe('circular');
    }
  });

  it('Section 194Q / 194R / 194S clarification circulars present', () => {
    expect(CBDT_CIRCULARS.C_4_2022.number).toBe('4/2022');
    expect(CBDT_CIRCULARS.C_13_2022.number).toBe('13/2022');
    expect(CBDT_CIRCULARS.C_18_2022.number).toBe('18/2022');
    expect(CBDT_CIRCULARS.C_19_2022.number).toBe('19/2022');
  });

  it('every TDS circular registers a note with the registered value', () => {
    for (const [registryKey, entry] of Object.entries(CBDT_CIRCULARS)) {
      expect('note' in entry, `${registryKey} missing note`).toBe(true);
      expect(entry.note?.length, `${registryKey} note empty`).toBeGreaterThan(0);
    }
  });

  it('omits the url key on every TDS circular (the tds factory does not accept a url)', () => {
    for (const [registryKey, entry] of Object.entries(CBDT_CIRCULARS)) {
      expect('url' in entry, `${registryKey} unexpectedly has url`).toBe(false);
    }
  });

  it('matches the exact registered shape for C_4_2022', () => {
    expect(CBDT_CIRCULARS.C_4_2022).toEqual({
      kind: 'circular',
      number: '4/2022',
      date: '2022-03-15',
      note: 'Section 194Q clarifications -- buyer threshold computation, GST component, 194Q / 206C(1H) sequencing',
    });
    expect(Object.keys(CBDT_CIRCULARS.C_4_2022).sort()).toEqual(['date', 'kind', 'note', 'number']);
  });

  it('matches the exact registered shape for C_13_2022 (Section 194S VDA)', () => {
    expect(CBDT_CIRCULARS.C_13_2022).toEqual({
      kind: 'circular',
      number: '13/2022',
      date: '2022-06-22',
      note: 'Section 194S clarifications -- VDA TDS, peer-to-peer crypto, exchange treatment',
    });
  });

  it('matches the exact registered shape for C_18_2022 (Section 194R scope)', () => {
    expect(CBDT_CIRCULARS.C_18_2022).toEqual({
      kind: 'circular',
      number: '18/2022',
      date: '2022-09-13',
      note: 'Section 194R clarifications -- benefits / perquisites scope, valuation, examples',
    });
  });

  it('matches the exact registered shape for C_19_2022 (Section 194R follow-up)', () => {
    expect(CBDT_CIRCULARS.C_19_2022).toEqual({
      kind: 'circular',
      number: '19/2022',
      date: '2022-09-30',
      note: 'Section 194R further clarifications -- year of taxability, dealer-incentive treatment',
    });
  });

  it('omits the note key when the circular factory is called with note undefined', () => {
    const result = circular('999/9999', '2099-01-01', undefined);
    expect('note' in result).toBe(false);
    expect(Object.keys(result).sort()).toEqual(['date', 'kind', 'number']);
  });

  it('omits the note key when the circular factory is called with note omitted entirely', () => {
    const result = circular('998/9999', '2099-01-02');
    expect('note' in result).toBe(false);
  });
});
