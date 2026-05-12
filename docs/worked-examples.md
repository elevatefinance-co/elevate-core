# Worked examples

> Five end-to-end runs a Chartered Accountant validates against the primary source. Each example shows the scenario, the inputs the library accepts, the call site, the structured result the library returns, and the gazette reference a CA cross-checks against.

A CA without code-fluency reads the scenario, the inputs, and the output table; checks the citations against the official PDF; signs off. An engineer without tax-domain knowledge reads the call site, copies the import, and ships.

These examples cross-reference [README](../README.md) (audience-routed entry), [architecture](./architecture.md) (the directory taxonomy and `exports` registration), and [fixture-by-citation](./fixture-by-citation.md) (the canonical primary-source-to-test map). Every citation surfaced in an example is also a row in the fixture index.

## Table of contents

1. [Section 80C aggregate, surcharge, cess. Old regime, individual at high income](#1-section-80c-aggregate-surcharge-cess-old-regime-individual-at-high-income)
2. [26Q quarterly TDS with a 206AB-flagged deductee](#2-26q-quarterly-tds-with-a-206ab-flagged-deductee)
3. [GSTR-3B ITC reconciliation with a partial-rate-mismatch line](#3-gstr-3b-itc-reconciliation-with-a-partial-rate-mismatch-line)
4. [LTCG listed equity post 23-Jul-2024 cliff. Split-date treatment](#4-ltcg-listed-equity-post-23-jul-2024-cliff-split-date-treatment)
5. [RSU perquisite at vest. Closely-held foreign company](#5-rsu-perquisite-at-vest-closely-held-foreign-company)

---

## 1. Section 80C aggregate, surcharge, cess. Old regime, individual at high income

### Scenario

Mr. Arvind Rao, age 40, is a senior product manager at a Bengaluru SaaS company. For Assessment Year 2025-26 (Financial Year 2024-25) he files under the old regime to claim his Chapter VI-A deductions, his medical insurance for elderly parents, and his additional NPS contribution. Annual gross salary is Rs. 70,00,000.

This example walks the full ITR computation: salary income, Chapter VI-A deductions (80C, 80D, 80CCD(1B)), slab walk under the old regime for an individual aged below 60, the 10% surcharge tier for income above Rs. 50 lakh, and Health and Education Cess at 4%.

### Input data

| Field                                       | Value         | Note                                         |
| ------------------------------------------- | ------------- | -------------------------------------------- |
| Assessment Year                             | AY2025-26     | Finance Act 2024 substrate                   |
| Regime                                      | OLD           | 115BAC opt-out preserves Chapter VI-A access |
| Age band                                    | INDIVIDUAL    | Age 40, not senior or super-senior           |
| Gross salary                                | Rs. 70,00,000 |                                              |
| Standard deduction (old regime, AY 2025-26) | Rs. 50,000    | Section 16(ia)                               |
| 80C: LIC premium                            | Rs. 50,000    |                                              |
| 80C: PPF contribution                       | Rs. 1,00,000  |                                              |
| 80C: ELSS investment                        | Rs. 1,00,000  |                                              |
| 80C: EPF (employee)                         | Rs. 50,000    |                                              |
| 80D: self + family premium                  | Rs. 25,000    | No senior in self bucket                     |
| 80D: parents premium                        | Rs. 50,000    | At least one parent senior                   |
| 80CCD(1B): NPS additional                   | Rs. 50,000    | Outside the 80CCE Rs. 1.5L cap               |

### Library invocation

```ts
import {
  computeSection80c,
  computeSection80d,
  computeSection80ccd1b,
  getSlabs,
  computeSlabTax,
  computeSurcharge,
  computeCess,
  getIndividualSurchargeTiers,
  STANDARD_DEDUCTION_SALARY_OLD_AY_2025_26,
} from '@elevatefinance-co/india-tax-rules';

const ay = 'AY2025-26' as const;
const regime = 'OLD' as const;

const grossSalary = 70_00_000;
const incomeFromSalary = grossSalary - STANDARD_DEDUCTION_SALARY_OLD_AY_2025_26;

const ded80c = computeSection80c({
  regime,
  ay,
  claim: {
    lifeInsurancePremium: 50_000,
    ppfContribution: 1_00_000,
    elssInvestment: 1_00_000,
    epfEmployeeContribution: 50_000,
  },
});

const ded80d = computeSection80d({
  regime,
  ay,
  claim: {
    selfFamilyPremium: 25_000,
    anySelfFamilySenior: false,
    parentsPremium: 50_000,
    anyParentSenior: true,
  },
});

const ded80ccd1b = computeSection80ccd1b({
  regime,
  ay,
  claim: 50_000,
});

const totalDeductions = ded80c.value + ded80d.value + ded80ccd1b.value;
const taxableIncome = incomeFromSalary - totalDeductions;

const { slabs, citations: slabCitations } = getSlabs({ regime, ay });
const slabTax = computeSlabTax({ taxableIncome, slabs, ay, citations: slabCitations });

const surcharge = computeSurcharge({
  taxableIncome,
  taxBeforeCess: slabTax.value,
  tiers: getIndividualSurchargeTiers(regime),
  ay,
  citations: slabCitations,
});

const cess = computeCess({
  taxPlusSurcharge: slabTax.value + surcharge.value,
  ay,
});

const totalTaxPayable = slabTax.value + surcharge.value + cess.value;
```

### Output result

| Step                                                                   | Computation                                             | Amount (Rs.)  |
| ---------------------------------------------------------------------- | ------------------------------------------------------- | ------------- |
| Gross salary                                                           |                                                         | 70,00,000     |
| Less: Standard deduction (Section 16(ia), old regime AY 2025-26)       |                                                         | 50,000        |
| Income from salary                                                     |                                                         | 69,50,000     |
| Less: Section 80C (capped at Rs. 1,50,000 per Section 80CCE)           | min(50,000+1,00,000+1,00,000+50,000=3,00,000, 1,50,000) | 1,50,000      |
| Less: Section 80D (self bucket Rs. 25,000 + parents bucket Rs. 50,000) | 25,000 + 50,000                                         | 75,000        |
| Less: Section 80CCD(1B) (additional NPS)                               | min(50,000, 50,000)                                     | 50,000        |
| **Total taxable income**                                               |                                                         | **66,75,000** |
| Slab walk (old regime, individual): 0-2.5L at 0%                       | 2,50,000 x 0%                                           | 0             |
| Slab walk: 2.5L-5L at 5%                                               | 2,50,000 x 5%                                           | 12,500        |
| Slab walk: 5L-10L at 20%                                               | 5,00,000 x 20%                                          | 1,00,000      |
| Slab walk: above 10L at 30%                                            | 56,75,000 x 30%                                         | 17,02,500     |
| **Tax on slabs (before surcharge / cess)**                             |                                                         | **18,15,000** |
| Surcharge: income > Rs. 50L and <= Rs. 1Cr; 10% of tax                 | 18,15,000 x 10%                                         | 1,81,500      |
| **Tax + surcharge**                                                    |                                                         | **19,96,500** |
| Health and Education Cess at 4% (Section 2(12A))                       | 19,96,500 x 4%                                          | 79,860        |
| **Total tax payable**                                                  |                                                         | **20,76,360** |

### Citations the result carries

- Section 80C (`SECTIONS.SEC_80C`); Section 80CCE Rs. 1.5L combined cap implicit in the capped-to-1,50,000 line.
- Section 80D (`SECTIONS.SEC_80D`).
- Section 80CCD(1B) (`SECTIONS.SEC_80CCD_1B`).
- Section 115BAC (`SECTIONS.SEC_115BAC`) plus Finance Act 2024 (`FINANCE_ACTS.FA_2024`) on the slab table.
- Section 2(12A) (`SECTIONS.SEC_2_12A`) on the cess line.

### Primary-source cross-reference

- Income-tax Act, 1961 -- Sections 80C, 80CCC, 80CCD, 80CCE, 80D. Primary text on `incometaxindia.gov.in`. Slab tables for AY 2025-26 in the Finance Act 2024 read with Section 115BAC for the new regime; old regime slabs unchanged from Finance Act 2019.
- Section 87A is not invoked here because total income exceeds the rebate threshold.
- Surcharge tiers per the First Schedule of Finance Act 2024 (Part I, Paragraph A for individuals).

A reader of this example can navigate from each output line to the test that locks the encoding via the [fixture-by-citation index](./fixture-by-citation.md) (rows for SEC_80C, SEC_80D, SEC_80CCD_1B, SEC_115BAC, FA_2024, SEC_2_12A).

---

## 2. 26Q quarterly TDS with a 206AB-flagged deductee

### Scenario

Spectra Architects LLP engages a freelance interior designer for a client project. The designer is paid Rs. 5,00,000 in fees on 15 August 2024. The designer's PAN is valid and operative. The CBDT specified-persons (non-filer) list, refreshed on 1 August 2024, contains the designer's PAN: Section 206AB applies. The deduction goes on the LLP's Q2 26Q return.

This example walks the rate-band resolver: Section 194J base rate at 10% (professional services), the 206AB carve-out check (194J is NOT a carve-out, so the uplift applies), and the resulting effective rate.

### Input data

| Field                            | Value              | Note                                                       |
| -------------------------------- | ------------------ | ---------------------------------------------------------- |
| Section                          | S194J_PROFESSIONAL | Professional fees per the 194J professional sub-rate       |
| Deduction date                   | 2024-08-15         | Pre Oct 2024 cliff (irrelevant; 194J was not on the cliff) |
| PAN status                       | valid              | PAN is operative                                           |
| Specified person (Section 206AB) | true               | Designer appears in the CBDT non-filer list                |
| Gross fees                       | Rs. 5,00,000       |                                                            |

### Library invocation

```ts
import { tds } from '@elevatefinance-co/india-tax-rules';

const result = tds.resolveRate({
  section: 'S194J_PROFESSIONAL',
  deductionDate: new Date('2024-08-15T00:00:00Z'),
  panStatus: 'valid',
  isSpecifiedPerson: true,
});

const grossFeesPaise = 5_00_000_00n;
const tdsPaise = (grossFeesPaise * BigInt(result.effectiveRateBasisPoints)) / 10_000n;
```

### Output result

| Step                           | Computation                                                        | Amount           |
| ------------------------------ | ------------------------------------------------------------------ | ---------------- |
| Section                        | 194J professional services                                         | --               |
| Base rate (per Section 194J)   | 10% (1000 basis points)                                            | --               |
| 206AB carve-out check          | 194J not in {192, 192A, 194B, 194BB, 194LBC, 194N}; uplift applies | --               |
| 206AB uplift formula           | max(2 x base = 2000 bp, floor = 500 bp)                            | --               |
| Effective rate                 | 2000 basis points = 20%                                            | --               |
| Gross fees                     |                                                                    | Rs. 5,00,000     |
| TDS at effective rate          | 5,00,000 x 20%                                                     | **Rs. 1,00,000** |
| Net amount payable to designer | 5,00,000 - 1,00,000                                                | Rs. 4,00,000     |

If the designer were not on the non-filer list, the TDS would be Rs. 50,000 (10% base rate). The Section 206AB uplift doubles the deduction.

### Citations the result carries

- Section 194J (`ITA_SECTIONS.SEC_194J`) for the base rate.
- Section 206AB (`ITA_SECTIONS.SEC_206AB`) for the higher-rate uplift.
- Finance Act 2023 (`FINANCE_ACTS_TDS.FA_2023_S206AB_CARVEOUT`) for the carve-out narrowing that confirms 194J remains in the uplift universe.

### Carve-out edge case for the same scenario

If the same Spectra Architects LLP paid the same designer salary under an employment relationship (Section 192) instead of fees, Section 206AB would NOT apply: Section 192 is one of the six carve-outs (192, 192A, 194B, 194BB, 194LBC, 194N). The library returns `upliftReason: 'NONE'` and the salary slab is computed by the standalone slab engine. Source: `src/tds/rates/rate-band-resolver.ts` (the `S206AB_CARVE_OUTS` set); test at `test/tds/specified-person.test.ts`.

### Primary-source cross-reference

- Income-tax Act, 1961 -- Section 194J (TDS on professional / technical / royalty / FTS).
- Income-tax Act, 1961 -- Section 206AB (higher TDS for specified persons), as amended by the Finance Act 2023 to narrow the carve-outs.
- CBDT Circular 4/2022 dated 15-Mar-2022 (Section 194Q clarifications, separately encoded; not invoked here).

A reader can drill from each citation to the test fixture via the [fixture-by-citation index](./fixture-by-citation.md) rows for SEC_194J, SEC_206AB, FA_2023_S206AB_CARVEOUT.

---

## 3. GSTR-3B ITC reconciliation with a partial-rate-mismatch line

### Scenario

ABC Manufacturing Pvt Ltd, a Maharashtra-registered taxpayer with aggregate turnover of Rs. 8 crore in FY 2023-24 (so monthly filing under Notification 6/2017-CT), is reconciling its August 2024 inward supplies for the GSTR-3B. One supplier issued an invoice on 12 August 2024 for Rs. 10,00,000 with IGST at 18% (Rs. 1,80,000). The same invoice in ABC's GSTR-2B (auto-populated from the supplier's GSTR-1) shows IGST at only 12% (Rs. 1,20,000). The supplier filed under the wrong rate.

This example walks Section 16 ITC eligibility for the line, the Section 17(5) blocked-credits classifier (returns NOT_BLOCKED), and the Section 16(4) time-bar (well within window). The library does not adjudicate the rate dispute itself; it surfaces the mismatch between invoice and GSTR-2B and routes the eligible amount through the Section 16(2)(aa) gate.

### Input data

| Field                                             | Value                                 | Note                                      |
| ------------------------------------------------- | ------------------------------------- | ----------------------------------------- |
| Supplier invoice IGST                             | Rs. 1,80,000                          | Supplier invoiced at 18% on Rs. 10,00,000 |
| GSTR-2B IGST for the same invoice                 | Rs. 1,20,000                          | Supplier filed GSTR-1 at 12%              |
| Goods received                                    | true                                  |                                           |
| Possession of tax invoice                         | true                                  |                                           |
| Supplier has paid tax (per supplier's own filing) | true                                  | But only at 12%                           |
| Invoice appears in GSTR-2B                        | true                                  | At the rate the supplier reported         |
| Recipient will file GSTR-3B for August 2024       | true                                  |                                           |
| Inward supply purpose                             | input goods for taxable manufacturing | NOT a Section 17(5) blocked category      |
| Invoice FY                                        | 2024-25 (fyStartYear = 2024)          | Time-bar cut-off 30 November 2025         |
| Proposed claim date                               | 2024-09-20                            | (within Section 16(4) window)             |

### Library invocation

```ts
import { gst } from '@elevatefinance-co/india-tax-rules';

const eligibility = gst.checkSection16Eligibility({
  hasTaxInvoiceOrDebitNote: true,
  goodsOrServicesReceived: true,
  supplierHasPaidTax: true,
  recipientWillFileReturn: true,
  invoiceAppearsInGstr2b: true,
});

const blocked = gst.classifyBlockedCredit('NOT_BLOCKED');

const timeBar = gst.checkSection16TimeBar({
  fyStartYear: 2024,
  proposedClaimDate: new Date(Date.UTC(2024, 8, 20)),
});

/* The library returns ELIGIBLE for the GSTR-2B amount. The Rs. 60,000 mismatch
 * is not yet eligible for ITC; the platform's reconciliation flow surfaces the
 * gap and prompts the recipient to chase the supplier for a corrected GSTR-1. */
const eligibleItcPaise = 1_20_000_00n; /* Rs. 1,20,000 in paise */
const heldBackPaise = 60_000_00n; /* Rs. 60,000 in paise; pending supplier amendment */
```

### Output result

| Step                                                        | Status                                  | Amount / citation                                    |
| ----------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| Section 16(2)(a). Possession of tax invoice                 | OK                                      | Section 16, Section 16(2)                            |
| Section 16(2)(b). Receipt of goods                          | OK                                      | Section 16, Section 16(2)                            |
| Section 16(2)(aa). Invoice appears in GSTR-2B               | OK at GSTR-2B rate                      | Section 16(2)(aa) (FA 2021, eff 1-Jan-2022); Rule 60 |
| Section 16(2)(c) read with 16(2)(ba). Supplier has paid tax | OK at GSTR-2B rate                      | Section 16(2)(ba) (FA 2022, eff 1-Oct-2022)          |
| Section 16(2)(d). Recipient files GSTR-3B                   | OK                                      | Section 16(2)                                        |
| Section 17(5) classifier                                    | NOT_BLOCKED                             | Section 16, Section 16(2)                            |
| Section 16(4) time-bar                                      | within window; cut-off 30 November 2025 | Section 16(4)                                        |
| **Eligible ITC for the line in GSTR-3B Table 4(A)(5)**      |                                         | **Rs. 1,20,000**                                     |
| Held back pending supplier rate correction                  |                                         | Rs. 60,000                                           |

### What the library does NOT decide

The library identifies that ITC is restricted to the GSTR-2B amount per Section 16(2)(aa). It does not:

- Issue a debit note for the rate dispute (the recipient pursues the supplier off-platform).
- Adjudicate which rate is correct (the rate question is a substantive law issue beyond the library's role).
- File the GSTR-3B itself (the platform's filing surface owns that).

The reconciliation reasons for the Rs. 60,000 gap surface in the platform's UI as a row labelled "supplier rate mismatch" and a citation pointer to Section 16(2)(aa). A regulator can drill from that row back to the law.

### Citations the result carries

- Section 16 + 16(2) (`CGST_ACT_SECTIONS.SEC_16, SEC_16_2`).
- Section 16(2)(aa) (`CGST_ACT_SECTIONS.SEC_16_2_AA`) -- the load-bearing condition that limits ITC to the GSTR-2B amount.
- Section 16(2)(ba) (`CGST_ACT_SECTIONS.SEC_16_2_BA`) -- the supplier-payment condition.
- Section 16(4) (`CGST_ACT_SECTIONS.SEC_16_4`) -- the time-bar.
- Rule 60 (`CGST_RULES.RULE_60`) -- GSTR-2A real-time mirror plus GSTR-2B static cut-off snapshot.

### Primary-source cross-reference

- CGST Act 2017 -- Section 16(2)(aa) inserted via Finance Act 2021, effective 1 January 2022. Source: gazette text on `cbic-gst.gov.in`.
- CGST Act 2017 -- Section 16(2)(ba) inserted via Finance Act 2022, effective 1 October 2022.
- CGST Rules 2017 -- Rule 60 (GSTR-2A and GSTR-2B form-and-manner). Source: gazette text via `egazette.nic.in`.

The fixture index has rows for each at [fixture-by-citation](./fixture-by-citation.md).

---

## 4. LTCG listed equity post 23-Jul-2024 cliff. Split-date treatment

### Scenario

Mr. Mehta is a salaried investor with a portfolio of listed Indian-equity shares and equity-oriented mutual funds. In FY 2024-25 he sells two parcels:

- Parcel A on 10 June 2024 (before the Finance (No. 2) Act 2024 split date of 23 July 2024), holding period 18 months.
- Parcel B on 15 September 2024 (after the split date), holding period 26 months.

Both parcels are STT-paid listed equity, so Section 112A applies. The CBDT Circular 12/2024 clarifies: the consolidated annual exemption of Rs. 1,25,000 applies once across the year (NOT Rs. 1L pre-split plus Rs. 1.25L post-split). The library consumes the exemption pre-split first, spills the remainder to post-split.

### Input data

| Field              | Parcel A                | Parcel B                 |
| ------------------ | ----------------------- | ------------------------ |
| Sale date          | 10-Jun-2024 (pre-split) | 15-Sep-2024 (post-split) |
| Purchase date      | 10-Dec-2022             | 15-Jul-2022              |
| Sale consideration | Rs. 5,00,000            | Rs. 8,00,000             |
| Acquisition cost   | Rs. 3,00,000            | Rs. 5,00,000             |
| Net gain           | Rs. 2,00,000            | Rs. 3,00,000             |

### Library invocation

```ts
import {
  computeLtcg112A,
  type ListedEquityTxn,
} from '@elevatefinance-co/india-tax-rules/capital-gains';

const transactions: readonly ListedEquityTxn[] = [
  {
    saleDate: '2024-06-10',
    purchaseDate: '2022-12-10',
    saleConsideration: 5_00_000,
    acquisitionCost: 3_00_000,
  },
  {
    saleDate: '2024-09-15',
    purchaseDate: '2022-07-15',
    saleConsideration: 8_00_000,
    acquisitionCost: 5_00_000,
  },
];

const result = computeLtcg112A({ transactions, ay: 'AY2025-26' });
```

### Output result

| Step                                                                 | Computation                                  | Amount (Rs.) |
| -------------------------------------------------------------------- | -------------------------------------------- | ------------ |
| Gross LTCG pre-split (Parcel A)                                      | 5,00,000 - 3,00,000                          | 2,00,000     |
| Gross LTCG post-split (Parcel B)                                     | 8,00,000 - 5,00,000                          | 3,00,000     |
| Total gross LTCG                                                     |                                              | 5,00,000     |
| Consolidated annual exemption (Section 112A; CBDT Circ 12/2024)      | min(1,25,000, 5,00,000)                      | 1,25,000     |
| Exemption applied to pre-split first                                 | 1,25,000 against 2,00,000                    | --           |
| Pre-split taxable                                                    | 2,00,000 - 1,25,000                          | 75,000       |
| Post-split spill                                                     | 0 spill (exemption fully consumed pre-split) | --           |
| Post-split taxable                                                   | 3,00,000 - 0                                 | 3,00,000     |
| LTCG tax pre-split at 10% (Section 112A pre-cliff rate)              | 75,000 x 10%                                 | 7,500        |
| LTCG tax post-split at 12.5% (Section 112A post-cliff rate; FA 2024) | 3,00,000 x 12.5%                             | 37,500       |
| **Total LTCG tax (before surcharge / cess)**                         |                                              | **45,000**   |

Surcharge and cess apply on top per the standalone surcharge / cess modules; this example shows the LTCG-specific computation only.

### Citations the result carries

- Section 112A (`SECTIONS.SEC_112A`) for the charging section.
- Finance Act 2024 (`FINANCE_ACTS.FA_2024`) for the rate change to 12.5%.
- CBDT Circular 12/2024 (`CIRCULARS.CBDT_CIRC_12_2024`) for the consolidated-exemption clarification.

### Edge case the library handles

If Parcel A's gain were below the exemption ceiling (e.g. Rs. 50,000), the spill semantics matter. The library applies the exemption to pre-split first (Rs. 50,000 of the Rs. 1,25,000 ceiling consumed), then spills the remaining Rs. 75,000 to post-split. The CA can verify against CBDT Circular 12/2024's clarification by reading `test/capital-gains.test.ts` -- the test exercises the spill arithmetic with three boundary fixtures (zero spill, partial spill, full spill).

### Primary-source cross-reference

- Income-tax Act, 1961 -- Section 112A. Pre-split rate 10%; post-split 12.5%. Holding-period cut-off 12 months for STT-paid listed equity.
- Finance (No. 2) Act 2024, Section 35 (amending Section 112A). Presidential assent 16 August 2024; effective 23 July 2024 per Section 1(2)(b).
- CBDT Circular 12/2024 dated 14 August 2024. Clarifications on capital-gains amendments. Available on `incometaxindia.gov.in/communications/circular/circular-no-12-2024.pdf`.

---

## 5. RSU perquisite at vest. Closely-held foreign company

### Scenario

Ms. Priya Sharma is a senior engineer in Bengaluru employed by an Indian subsidiary of a foreign-incorporated, closely-held (unlisted) parent company. Under the parent's RSU plan, 1,000 RSUs vest on 1 August 2024. Because the parent is unlisted, the Fair Market Value cannot be sourced from a stock exchange; it must come from a Category-I merchant banker valuation per Rule 11UA read with Rule 3(9) of the Income-tax Rules, 1962. The merchant banker's valuation report values the share at Rs. 800 per unit on the vest date (already converted to INR by the merchant banker).

The exercise price is zero, as is typical for RSU grants (the vest is the taxable event; there is no separate exercise consideration).

This example walks the FMV-sourcing dispatcher (`UNLISTED` route -> Rule 11UA + Rule 3(9)) and the perquisite-at-vest computation under Section 17(2)(vi).

### Input data

| Field                              | Value      | Note                                            |
| ---------------------------------- | ---------- | ----------------------------------------------- |
| Grant listing status               | UNLISTED   | Foreign-incorporated, closely-held parent       |
| Vest date                          | 2024-08-01 |                                                 |
| Units vested                       | 1,000      |                                                 |
| Merchant-banker FMV per unit (INR) | Rs. 800    | Per Rule 11UA Cat-I valuation; INR-denominated  |
| Exercise price (original currency) | 0          | RSU; no separate exercise consideration         |
| Eligible-startup deferral          | false      | Parent is not DPIIT-recognised eligible startup |
| Assessment Year                    | AY2025-26  | Vest in FY 2024-25                              |

### Library invocation

```ts
import {
  computePerquisiteAtVest,
  type RsuGrant,
  type RsuVestEvent,
} from '@elevatefinance-co/india-tax-rules/rsu-perquisite';

const grant: RsuGrant = {
  grantId: 'PS-RSU-2023-04',
  employer: 'AcmeCorp Inc',
  grantDate: '2023-04-01',
  totalUnits: 4_000,
  exercisePriceInOriginalCurrency: 0,
  originalCurrency: 'USD',
  listingStatus: 'UNLISTED',
};

const vest: RsuVestEvent = {
  vestDate: '2024-08-01',
  unitsVested: 1_000,
  fmvPerUnitInOriginalCurrency: 0,
  originalCurrency: 'USD',
  merchantBankerFmvPerUnitInr: 800,
};

const result = computePerquisiteAtVest({ grant, vest, ay: 'AY2025-26' });
```

### Output result

| Step                                   | Computation                              | Amount (Rs.) |
| -------------------------------------- | ---------------------------------------- | ------------ |
| FMV sourcing route                     | Rule 3(9) read with Rule 11UA (unlisted) | --           |
| Merchant-banker FMV per unit (INR)     | (input)                                  | 800          |
| Exercise price per unit in INR         | 0 (zero exercise price; RSU)             | 0            |
| Perquisite per unit                    | 800 - 0                                  | 800          |
| Units vested                           | (input)                                  | 1,000        |
| **Perquisite under Section 17(2)(vi)** | 800 x 1,000                              | **8,00,000** |

The Rs. 8,00,000 perquisite flows into the employee's "Income from Salary" head and is taxed at her marginal rate. The Indian-subsidiary employer is the deductor under Section 192; TDS at slab rate is computed by the standalone slabs engine and is composed by the caller (the platform's salary-and-tax service).

### What the library does NOT decide

- The library does NOT compute the marginal tax. That requires composing the perquisite with the rest of the employee's salary and other income, then walking the slab + surcharge + cess chain. The slab module performs that step; this module produces only the perquisite amount.
- The library does NOT determine eligible-startup deferral on its own. The caller passes `isEligibleStartup = true` if the parent meets the DPIIT-recognition criteria under Section 17(2)(vi)'s second proviso. When deferred, the perquisite returns 0 with an explanatory step; the deferred amount is picked up in the tax-trigger year (earlier of 48 months from vest, employment cessation, or sale).

### Citations the result carries

- Section 17(2)(vi) (`SECTIONS.SEC_17_2_vi`) for the perquisite charging clause.
- Rule 3 + Rule 3(8) (`RULES.RULE_3, RULE_3_8`) for the perquisite valuation framework.
- Rule 3(9) (`RULES.RULE_3_9`) and Rule 11UA (`RULES.RULE_11UA`) for the unlisted FMV route.

For a foreign-listed (rather than unlisted) grant, the route would be Rule 3(8)(iii)(c): closing price on the foreign exchange on the vest date times SBI TTBR for the currency on the same date. CBDT Circular 13/2022 (`CIRCULARS.CBDT_CIRC_13_2022`) clarifies the foreign-listed FMV mechanics; that example sits in `test/rsu-perquisite.test.ts` alongside the unlisted route exercised here.

### Primary-source cross-reference

- Income-tax Act, 1961 -- Section 17(2)(vi). Perquisite on specified security or sweat equity at exercise.
- Income-tax Rules, 1962 -- Rule 3(8)(iii)(a) (Indian-listed), Rule 3(8)(iii)(c) (foreign-listed), Rule 3(9) (unlisted via Rule 11UA).
- Income-tax Rules, 1962 -- Rule 11UA(1)(c)(b). Merchant-banker Cat-I route for unquoted equity FMV.
- CBDT Circular 13/2022 dated 22-Jun-2022. Clarifications on FMV sourcing for foreign-listed shares and exercise-date determination.

---

## Where to read next

- [README](../README.md). Audience-routed quick navigation.
- [Architecture](./architecture.md). The directory taxonomy a contributor follows when adding a new tax domain (Customs Duty, Stamp Duty, Equalisation Levy, etc.).
- [Fixture by citation](./fixture-by-citation.md). Every CBIC notification, CBDT circular, Finance Act change, and Section the library encodes, mapped to the source file and the test file.
- The [decisions](../decisions/) folder. ADRs explaining why citations are a discriminated union, why past AYs are frozen, and why the library prefers composition over orchestration.
- The [`docs/examples/`](./examples/) folder. Runnable TypeScript files that exercise the library end-to-end. The audit-trail-receipt example shows how a consumer projects `ComputationResult.steps` into a Receipt PDF.
