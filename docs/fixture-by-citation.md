# Fixture by citation

> The canonical mapping from CBIC notification, CBDT circular, Finance Act change, and ITA / CGST / IGST Section to the source file that encodes the rule and the test file that locks it.

A Chartered Accountant verifying a specific Section / Form / Notification opens this index, finds the citation, clicks through to the test that exercises it, and reads the expected output verbatim. An engineer reviewing a PR opens this index, finds the citation the PR claims to amend, and confirms the test file referenced in the index is the one the PR touches.

The index complements the [README](../README.md) (audience-routed entry point), [architecture](./architecture.md) (the directory taxonomy a contributor follows when adding a new domain), and [worked examples](./worked-examples.md) (end-to-end runs a CA validates against the gazette).

## How to read this document

- **Citation** is the canonical key in the citation registry. Click it in source to land on the citation entry; click the source-file path to land on the rule that uses it; click the test-file path to see the expected outputs locked in fixtures.
- **Type** is the discriminated-union `kind` of the citation: `section` (a Section of an Act), `rule` (a Rule of subordinate legislation), `notification` (a CBIC / CBDT notification), `circular` (a CBDT clarification), `finance-act` (an annual amendment).
- **Source file** is the single rule module that primarily depends on the citation. Many citations are referenced in additional files; the source file column names the most-load-bearing site.
- **Test file** is the test module that locks the citation's encoding against a fixture. A failing build before a change to the rule is the change-control proof that the rule moved.
- **Brief description** is a one-line note. Full text lives in the citation registry's note field and the source file's leading block comment.

Paths are relative to the package root `packages/core/`. Source paths begin `src/`; test paths begin `test/`.

## Index by domain

1. [Income Tax (ITR)](#income-tax-itr)
   - [ITA Sections (ITR substrate)](#ita-sections-itr-substrate)
   - [Income-tax Rules 1962 (ITR substrate)](#income-tax-rules-1962-itr-substrate)
   - [Finance Acts (ITR substrate)](#finance-acts-itr-substrate)
   - [CBDT Circulars (ITR substrate)](#cbdt-circulars-itr-substrate)
2. [GST (Offering A)](#gst-offering-a)
   - [CGST Act sections](#cgst-act-sections)
   - [IGST Act sections](#igst-act-sections)
   - [CGST Rules 2017](#cgst-rules-2017)
   - [CBIC notifications](#cbic-notifications)
3. [Income-Tax TDS (Offering B)](#income-tax-tds-offering-b)
   - [ITA Sections (TDS substrate)](#ita-sections-tds-substrate)
   - [Income-tax Rules 1962 (TDS substrate)](#income-tax-rules-1962-tds-substrate)
   - [Finance Acts (TDS substrate)](#finance-acts-tds-substrate)
   - [CBDT Circulars (TDS substrate)](#cbdt-circulars-tds-substrate)

---

## Income Tax (ITR)

### ITA Sections (ITR substrate)

Citation registry: `src/citations/sections.ts`. Tested at `test/citations.test.ts`.

| Citation     | Type    | Source file                                | Test file                     | Brief description                                      |
| ------------ | ------- | ------------------------------------------ | ----------------------------- | ------------------------------------------------------ |
| SEC_4        | section | (foundational; not directly invoked)       | `test/citations.test.ts`      | Charge of income-tax. Foundational                     |
| SEC_5        | section | (foundational; not directly invoked)       | `test/citations.test.ts`      | Scope of total income                                  |
| SEC_15       | section | (referenced by salary chain)               | `test/citations.test.ts`      | Salaries. Charging                                     |
| SEC_17       | section | `src/rsu-perquisite/perquisite-at-vest.ts` | `test/rsu-perquisite.test.ts` | Salary, perquisite, profits in lieu                    |
| SEC_17_2_vi  | section | `src/rsu-perquisite/perquisite-at-vest.ts` | `test/rsu-perquisite.test.ts` | RSU / ESOP perquisite                                  |
| SEC_22       | section | (house-property pipeline)                  | `test/citations.test.ts`      | Income from house property. Charging                   |
| SEC_28       | section | (PGBP pipeline)                            | `test/citations.test.ts`      | Profits and gains of business or profession            |
| SEC_45       | section | `src/capital-gains/index.ts`               | `test/capital-gains.test.ts`  | Capital gains. Charging                                |
| SEC_48       | section | `src/capital-gains/other-assets-ltcg.ts`   | `test/capital-gains.test.ts`  | Mode of computation; indexation second proviso         |
| SEC_87A      | section | `src/rebate-87a.ts`                        | `test/rebate-87a.test.ts`     | Rebate on income up to threshold                       |
| SEC_90       | section | (FTC chain; placeholder)                   | `test/citations.test.ts`      | DTAA bilateral relief                                  |
| SEC_91       | section | (FTC chain; placeholder)                   | `test/citations.test.ts`      | DTAA unilateral relief                                 |
| SEC_115BAC   | section | `src/deductions/new-regime-eligibility.ts` | `test/deductions.test.ts`     | New regime. Individual / HUF / AOP / BOI / AJP         |
| SEC_115BAA   | section | `src/surcharge.ts`                         | `test/surcharge.test.ts`      | Concessional regime. Domestic companies                |
| SEC_115BAB   | section | `src/surcharge.ts`                         | `test/surcharge.test.ts`      | Concessional regime. New manufacturing companies       |
| SEC_115BBH   | section | `src/capital-gains/vda.ts`                 | `test/capital-gains.test.ts`  | VDA. Flat 30 percent tax                               |
| SEC_2_12A    | section | `src/cess.ts`                              | `test/cess.test.ts`           | Health and Education Cess. Definition                  |
| SEC_2_42A    | section | (holding-period classifier)                | `test/citations.test.ts`      | Short-term capital asset. Definition                   |
| SEC_111A     | section | `src/capital-gains/listed-equity-stcg.ts`  | `test/capital-gains.test.ts`  | STCG on STT-paid equity at 20 percent                  |
| SEC_112      | section | `src/capital-gains/other-assets-ltcg.ts`   | `test/capital-gains.test.ts`  | LTCG default at 12.5 percent                           |
| SEC_112A     | section | `src/capital-gains/listed-equity-ltcg.ts`  | `test/capital-gains.test.ts`  | LTCG STT-paid equity 12.5 percent, Rs. 1.25L exemption |
| SEC_50AA     | section | (specified MF / debt; placeholder)         | `test/citations.test.ts`      | Specified MF / debt. Always slab                       |
| SEC_194S     | section | `src/capital-gains/vda.ts`                 | `test/capital-gains.test.ts`  | TDS on VDA at 1 percent                                |
| SEC_139_1    | section | (filing pipeline)                          | `test/citations.test.ts`      | Return filing; Schedule FA fourth proviso              |
| SEC_80C      | section | `src/deductions/section-80c.ts`            | `test/deductions.test.ts`     | 80C overall Rs. 1.5L cap (with 80CCC + 80CCD(1))       |
| SEC_80CCC    | section | `src/deductions/section-80c.ts`            | `test/deductions.test.ts`     | Pension fund within 80C Rs. 1.5L                       |
| SEC_80CCD_1  | section | `src/deductions/section-80c.ts`            | `test/deductions.test.ts`     | NPS employee within 80C                                |
| SEC_80CCD_1B | section | `src/deductions/section-80ccd.ts`          | `test/deductions.test.ts`     | NPS additional Rs. 50k over 80C                        |
| SEC_80CCD_2  | section | `src/deductions/section-80ccd.ts`          | `test/deductions.test.ts`     | NPS employer; available in new regime                  |
| SEC_80D      | section | `src/deductions/section-80d.ts`            | `test/deductions.test.ts`     | Medical insurance + preventive health                  |
| SEC_80DD     | section | (placeholder; not yet implemented)         | `test/citations.test.ts`      | Disabled dependant. Flat deduction                     |
| SEC_80DDB    | section | (placeholder; not yet implemented)         | `test/citations.test.ts`      | Specified medical treatment                            |
| SEC_80E      | section | `src/deductions/section-80e.ts`            | `test/deductions.test.ts`     | Education-loan interest. No cap, 8 years               |
| SEC_80EE     | section | (placeholder; legacy)                      | `test/citations.test.ts`      | First-home-buyer interest legacy Rs. 50k               |
| SEC_80EEA    | section | (placeholder; not yet implemented)         | `test/citations.test.ts`      | Affordable housing interest Rs. 1.5L                   |
| SEC_80EEB    | section | (placeholder; not yet implemented)         | `test/citations.test.ts`      | EV loan interest Rs. 1.5L                              |
| SEC_80G      | section | `src/deductions/section-80g.ts`            | `test/deductions.test.ts`     | Donations 50% / 100% with / without AGI cap            |
| SEC_80GG     | section | (placeholder; not yet implemented)         | `test/citations.test.ts`      | Rent paid when no HRA                                  |
| SEC_80TTA    | section | `src/deductions/section-80tta-ttb.ts`      | `test/deductions.test.ts`     | Savings interest Rs. 10k (non-senior)                  |
| SEC_80TTB    | section | `src/deductions/section-80tta-ttb.ts`      | `test/deductions.test.ts`     | Senior bank / PO interest Rs. 50k                      |
| SEC_80U      | section | (placeholder; not yet implemented)         | `test/citations.test.ts`      | Self-disability. Flat deduction                        |

### Income-tax Rules 1962 (ITR substrate)

Citation registry: `src/citations/rules.ts`. Tested at `test/citations.test.ts`.

| Citation        | Type | Source file                                | Test file                     | Brief description                              |
| --------------- | ---- | ------------------------------------------ | ----------------------------- | ---------------------------------------------- |
| RULE_3          | rule | `src/rsu-perquisite/perquisite-at-vest.ts` | `test/rsu-perquisite.test.ts` | Valuation of perquisites                       |
| RULE_3_8        | rule | `src/rsu-perquisite/perquisite-at-vest.ts` | `test/rsu-perquisite.test.ts` | Specified security / sweat equity at exercise  |
| RULE_3_8_iii_c  | rule | `src/rsu-perquisite/fmv-sourcing.ts`       | `test/rsu-perquisite.test.ts` | FMV foreign-listed: market close x SBI TT rate |
| RULE_3_9        | rule | `src/rsu-perquisite/fmv-sourcing.ts`       | `test/rsu-perquisite.test.ts` | FMV unlisted: merchant banker Cat-I            |
| RULE_11UA       | rule | `src/rsu-perquisite/fmv-sourcing.ts`       | `test/rsu-perquisite.test.ts` | Valuation of unquoted shares                   |
| RULE_11UA_1_c_b | rule | (sweat-equity FMV chain)                   | `test/citations.test.ts`      | Merchant-banker route for unquoted equity FMV  |
| RULE_128        | rule | (FTC chain; placeholder)                   | `test/citations.test.ts`      | Foreign Tax Credit. Form 67                    |
| RULE_26         | rule | (perquisite + TDS FX fallback)             | `test/citations.test.ts`      | FX rate for perquisite / TDS valuation         |

### Finance Acts (ITR substrate)

Citation registry: `src/citations/finance-acts.ts`. Tested at `test/citations.test.ts`.

| Citation | Type        | Source file                                                                                                                          | Test file                                                                     | Brief description                                   |
| -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | --------------------------------------------------- |
| FA_2024  | finance-act | `src/capital-gains/listed-equity-ltcg.ts`, `src/capital-gains/listed-equity-stcg.ts`, `src/slabs/ay-2025-26.ts`, `src/rebate-87a.ts` | `test/capital-gains.test.ts`, `test/slabs.test.ts`, `test/rebate-87a.test.ts` | Revised new-regime slabs; LTCG 12.5%; STCG 111A 20% |
| FA_2025  | finance-act | `src/rebate-87a.ts`, `src/slabs/ay-2026-27.ts`                                                                                       | `test/rebate-87a.test.ts`, `test/slabs.test.ts`                               | Revised slabs; 87A rebate to Rs. 12L                |
| FA_2022  | finance-act | `src/capital-gains/vda.ts`                                                                                                           | `test/capital-gains.test.ts`                                                  | VDA charging Section 115BBH; 1% TDS u/s 194S        |
| FA_2023  | finance-act | (specified MF / debt; placeholder)                                                                                                   | `test/citations.test.ts`                                                      | Section 50AA. Specified MF / debt always slab       |

### CBDT Circulars (ITR substrate)

Citation registry: `src/citations/circulars.ts`. Tested at `test/citations.test.ts`.

| Citation          | Type     | Source file                                                                                                                    | Test file                     | Brief description                                                     |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- | --------------------------------------------------------------------- |
| CBDT_CIRC_12_2024 | circular | `src/capital-gains/listed-equity-ltcg.ts`, `src/capital-gains/listed-equity-stcg.ts`, `src/capital-gains/other-assets-ltcg.ts` | `test/capital-gains.test.ts`  | 23-Jul-2024 split; 112A Rs. 1.25L consolidated; 112 indexation option |
| CBDT_CIRC_1_2023  | circular | (specified MF / debt; placeholder)                                                                                             | `test/citations.test.ts`      | Section 50AA. Specified MF / debt slab post 1-Apr-2023                |
| CBDT_CIRC_13_2022 | circular | `src/rsu-perquisite/fmv-sourcing.ts`                                                                                           | `test/rsu-perquisite.test.ts` | RSU / ESOP FMV. Foreign-listed clarifications                         |

---

## GST (Offering A)

### CGST Act sections

Citation registry: `src/gst/citations/cgst-act-sections.ts`. Tested at `test/gst/citations.test.ts`.

| Citation    | Type    | Source file                                                          | Test file                                                                      | Brief description                                                     |
| ----------- | ------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| SEC_2       | section | (definitions; many sites)                                            | `test/gst/citations.test.ts`                                                   | Definitions                                                           |
| SEC_7       | section | (scope-of-supply chain)                                              | `test/gst/citations.test.ts`                                                   | Scope of supply                                                       |
| SEC_9       | section | `src/gst/rates/slabs.ts`                                             | `test/gst/rates-slabs.test.ts`                                                 | Levy and collection of CGST                                           |
| SEC_9_3     | section | (RCM goods / services chain)                                         | `test/gst/citations.test.ts`                                                   | RCM Section 9(3) categories                                           |
| SEC_9_4     | section | (RCM unregistered to registered)                                     | `test/gst/citations.test.ts`                                                   | RCM Section 9(4); suspended                                           |
| SEC_9_5     | section | (e-commerce specified services)                                      | `test/gst/citations.test.ts`                                                   | Specified services through ECO                                        |
| SEC_10      | section | `src/gst/composition/eligibility.ts`, `src/gst/composition/rates.ts` | `test/gst/composition.test.ts`                                                 | Composition levy                                                      |
| SEC_11      | section | (exemption chain)                                                    | `test/gst/citations.test.ts`                                                   | Power to grant exemption                                              |
| SEC_16      | section | `src/gst/itc/eligibility.ts`, `src/gst/itc/time-bar.ts`              | `test/gst/itc-eligibility.test.ts`, `test/gst/itc-time-bar-edge-cases.test.ts` | ITC eligibility; conditions                                           |
| SEC_16_2    | section | `src/gst/itc/eligibility.ts`                                         | `test/gst/itc-eligibility.test.ts`                                             | Conditions for availing ITC                                           |
| SEC_16_2_AA | section | `src/gst/itc/eligibility.ts`                                         | `test/gst/itc-eligibility.test.ts`                                             | ITC only on invoices in GSTR-2B (FA 2021, eff 1-Jan-2022)             |
| SEC_16_2_BA | section | `src/gst/itc/eligibility.ts`                                         | `test/gst/itc-eligibility.test.ts`                                             | ITC restriction where supplier has not paid (FA 2022, eff 1-Oct-2022) |
| SEC_16_4    | section | `src/gst/itc/time-bar.ts`                                            | `test/gst/itc-time-bar-edge-cases.test.ts`                                     | Time-bar for ITC                                                      |
| SEC_17      | section | `src/gst/itc/blocked-credits.ts`                                     | `test/gst/itc-blocked-credits.test.ts`                                         | Apportionment + blocked credits                                       |
| SEC_17_1    | section | (apportionment business / non-business)                              | `test/gst/citations.test.ts`                                                   | Apportionment partly business / non-business                          |
| SEC_17_2    | section | (apportionment taxable / exempt)                                     | `test/gst/citations.test.ts`                                                   | Apportionment partly taxable / exempt                                 |
| SEC_17_3    | section | (definition of exempt supply)                                        | `test/gst/citations.test.ts`                                                   | Definition of exempt supply                                           |
| SEC_17_4    | section | (banking / NBFC 50 percent option)                                   | `test/gst/citations.test.ts`                                                   | Banking / NBFC fifty-percent option                                   |
| SEC_17_5    | section | `src/gst/itc/blocked-credits.ts`                                     | `test/gst/itc-blocked-credits.test.ts`                                         | Section 17(5) blocked credits                                         |
| SEC_17_5_A  | section | `src/gst/itc/blocked-credits.ts`                                     | `test/gst/itc-blocked-credits.test.ts`                                         | Motor vehicles for transport of persons                               |
| SEC_17_5_B  | section | `src/gst/itc/blocked-credits.ts`                                     | `test/gst/itc-blocked-credits.test.ts`                                         | Food, beverages, beauty, life / health insurance                      |
| SEC_17_5_C  | section | `src/gst/itc/blocked-credits.ts`                                     | `test/gst/itc-blocked-credits.test.ts`                                         | Club / health-and-fitness membership                                  |
| SEC_17_5_D  | section | `src/gst/itc/blocked-credits.ts`                                     | `test/gst/itc-blocked-credits.test.ts`                                         | Travel benefit to employees on vacation                               |
| SEC_17_5_E  | section | `src/gst/itc/blocked-credits.ts`                                     | `test/gst/itc-blocked-credits.test.ts`                                         | Works contract for immovable property                                 |
| SEC_17_5_F  | section | `src/gst/itc/blocked-credits.ts`                                     | `test/gst/itc-blocked-credits.test.ts`                                         | Construction of immovable property on own account                     |
| SEC_17_5_G  | section | `src/gst/itc/blocked-credits.ts`                                     | `test/gst/itc-blocked-credits.test.ts`                                         | Goods or services on which composition tax paid                       |
| SEC_17_5_H  | section | `src/gst/itc/blocked-credits.ts`                                     | `test/gst/itc-blocked-credits.test.ts`                                         | Goods or services received by NRTP                                    |
| SEC_17_5_I  | section | `src/gst/itc/blocked-credits.ts`                                     | `test/gst/itc-blocked-credits.test.ts`                                         | Goods or services for personal consumption                            |
| SEC_17_5_J  | section | `src/gst/itc/blocked-credits.ts`                                     | `test/gst/itc-blocked-credits.test.ts`                                         | Goods lost, stolen, destroyed, written off, gifts, samples            |
| SEC_17_5_K  | section | `src/gst/itc/blocked-credits.ts`                                     | `test/gst/itc-blocked-credits.test.ts`                                         | Tax paid in pursuance of S74 / S129 / S130 orders                     |
| SEC_18      | section | (special-circumstances credit)                                       | `test/gst/citations.test.ts`                                                   | Availability of credit in special circumstances                       |
| SEC_22      | section | `src/gst/registration/thresholds.ts`                                 | `test/gst/registration-thresholds.test.ts`                                     | Persons liable for registration                                       |
| SEC_24      | section | `src/gst/registration/mandatory.ts`                                  | `test/gst/registration-mandatory.test.ts`                                      | Compulsory registration regardless of turnover                        |
| SEC_25      | section | (procedure for registration)                                         | `test/gst/citations.test.ts`                                                   | Procedure for registration                                            |
| SEC_31      | section | (tax invoice chain)                                                  | `test/gst/citations.test.ts`                                                   | Tax invoice                                                           |
| SEC_31_3_F  | section | (RCM self-invoice)                                                   | `test/gst/citations.test.ts`                                                   | Self-invoice for inward supply liable to RCM                          |
| SEC_37      | section | (GSTR-1 chain)                                                       | `test/gst/citations.test.ts`                                                   | Furnishing details of outward supplies                                |
| SEC_39      | section | (GSTR-3B chain)                                                      | `test/gst/citations.test.ts`                                                   | Furnishing of returns                                                 |
| SEC_47      | section | `src/gst/penalties/section-47-late-fee.ts`                           | `test/gst/late-fee-cap-matrix.test.ts`, `test/gst/penalties.test.ts`           | Late fee for delayed return                                           |
| SEC_50      | section | `src/gst/penalties/section-50-interest.ts`                           | `test/gst/penalties.test.ts`                                                   | Interest on delayed payment                                           |
| SEC_50_1    | section | `src/gst/penalties/section-50-interest.ts`                           | `test/gst/penalties.test.ts`                                                   | 18% per annum delayed cash payment                                    |
| SEC_50_3    | section | `src/gst/penalties/section-50-interest.ts`                           | `test/gst/penalties.test.ts`                                                   | 24% per annum ITC wrongly availed and utilised                        |
| SEC_73      | section | (demand non-fraud chain)                                             | `test/gst/citations.test.ts`                                                   | Demand for short-paid tax non-fraud                                   |
| SEC_74      | section | (demand fraud chain)                                                 | `test/gst/citations.test.ts`                                                   | Demand with fraud / suppression                                       |
| SEC_51      | section | `src/gst/registration/mandatory.ts`                                  | `test/gst/registration-mandatory.test.ts`                                      | TDS under GST. Government / PSU deductors                             |
| SEC_52      | section | `src/gst/registration/mandatory.ts`                                  | `test/gst/registration-mandatory.test.ts`                                      | TCS by e-commerce operator                                            |
| SEC_39_4    | section | (ISD chain)                                                          | `test/gst/citations.test.ts`                                                   | Input Service Distributor return                                      |
| SEC_39_5    | section | (NRTP chain)                                                         | `test/gst/citations.test.ts`                                                   | Non-resident foreign taxpayer return                                  |
| SEC_44      | section | (annual return chain)                                                | `test/gst/citations.test.ts`                                                   | GSTR-9 / 9C threshold                                                 |
| SEC_44_2    | section | (audit reconciliation)                                               | `test/gst/citations.test.ts`                                                   | Audit reconciliation statement above turnover                         |
| SEC_45      | section | (final return)                                                       | `test/gst/citations.test.ts`                                                   | Final return on cancellation (GSTR-10)                                |
| SEC_122     | section | (general penalties)                                                  | `test/gst/citations.test.ts`                                                   | General penalties for specified offences                              |
| SEC_132     | section | (prosecution)                                                        | `test/gst/citations.test.ts`                                                   | Prosecution above thresholds                                          |
| SEC_164     | section | (rule-making power)                                                  | `test/gst/citations.test.ts`                                                   | Power to make rules                                                   |

### IGST Act sections

Citation registry: `src/gst/citations/igst-act-sections.ts`. Tested at `test/gst/citations.test.ts`.

| Citation        | Type    | Source file                                        | Test file                                                | Brief description                                            |
| --------------- | ------- | -------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| SEC_2 (IGST)    | section | (definitions; many sites)                          | `test/gst/citations.test.ts`                             | Definitions                                                  |
| SEC_5 (IGST)    | section | (charging IGST)                                    | `test/gst/citations.test.ts`                             | Levy and collection of IGST                                  |
| SEC_5_3 (IGST)  | section | (RCM IGST)                                         | `test/gst/citations.test.ts`                             | Reverse charge for IGST                                      |
| SEC_7 (IGST)    | section | (inter-state supply)                               | `test/gst/citations.test.ts`                             | Inter-State supply                                           |
| SEC_10 (IGST)   | section | `src/gst/place-of-supply/goods.ts`                 | `test/gst/place-of-supply-goods.test.ts`                 | POS of goods other than imports / exports                    |
| SEC_10_1_A      | section | `src/gst/place-of-supply/goods.ts`                 | `test/gst/place-of-supply-goods.test.ts`                 | Goods involving movement: delivery location                  |
| SEC_10_1_B      | section | `src/gst/place-of-supply/goods.ts`                 | `test/gst/place-of-supply-goods.test.ts`                 | Bill-to-ship-to: principal place of business of third person |
| SEC_10_1_C      | section | `src/gst/place-of-supply/goods.ts`                 | `test/gst/place-of-supply-goods.test.ts`                 | Goods not involving movement: location at delivery           |
| SEC_10_1_D      | section | `src/gst/place-of-supply/goods.ts`                 | `test/gst/place-of-supply-goods.test.ts`                 | Goods assembled / installed at site                          |
| SEC_10_1_E      | section | `src/gst/place-of-supply/goods.ts`                 | `test/gst/place-of-supply-goods.test.ts`                 | Goods on board a conveyance                                  |
| SEC_11 (IGST)   | section | `src/gst/place-of-supply/imports-exports.ts`       | `test/gst/place-of-supply-imports-exports.test.ts`       | POS of imports / exports                                     |
| SEC_11_A (IGST) | section | `src/gst/place-of-supply/imports-exports.ts`       | `test/gst/place-of-supply-imports-exports.test.ts`       | Imports: location of importer                                |
| SEC_11_B (IGST) | section | `src/gst/place-of-supply/imports-exports.ts`       | `test/gst/place-of-supply-imports-exports.test.ts`       | Exports: location outside India                              |
| SEC_12 (IGST)   | section | `src/gst/place-of-supply/services-india.ts`        | `test/gst/place-of-supply-services-india.test.ts`        | POS services where supplier and recipient in India           |
| SEC_12_3        | section | `src/gst/place-of-supply/services-india.ts`        | `test/gst/place-of-supply-services-india.test.ts`        | Immovable-property services: location of property            |
| SEC_12_4        | section | `src/gst/place-of-supply/services-india.ts`        | `test/gst/place-of-supply-services-india.test.ts`        | Restaurant / catering / fitness / beauty: where performed    |
| SEC_12_5        | section | `src/gst/place-of-supply/services-india.ts`        | `test/gst/place-of-supply-services-india.test.ts`        | Training and performance appraisal                           |
| SEC_12_6        | section | `src/gst/place-of-supply/services-india.ts`        | `test/gst/place-of-supply-services-india.test.ts`        | Admission to event / amusement park                          |
| SEC_12_7        | section | `src/gst/place-of-supply/services-india.ts`        | `test/gst/place-of-supply-services-india.test.ts`        | Organisation of an event                                     |
| SEC_12_8        | section | `src/gst/place-of-supply/services-india.ts`        | `test/gst/place-of-supply-services-india.test.ts`        | Transportation of goods                                      |
| SEC_12_9        | section | `src/gst/place-of-supply/services-india.ts`        | `test/gst/place-of-supply-services-india.test.ts`        | Passenger transportation                                     |
| SEC_12_10       | section | `src/gst/place-of-supply/services-india.ts`        | `test/gst/place-of-supply-services-india.test.ts`        | Services on board a conveyance                               |
| SEC_12_11       | section | `src/gst/place-of-supply/services-india.ts`        | `test/gst/place-of-supply-services-india.test.ts`        | Telecommunication services                                   |
| SEC_12_12       | section | `src/gst/place-of-supply/services-india.ts`        | `test/gst/place-of-supply-services-india.test.ts`        | Banking and financial services                               |
| SEC_12_13       | section | `src/gst/place-of-supply/services-india.ts`        | `test/gst/place-of-supply-services-india.test.ts`        | Insurance                                                    |
| SEC_12_14       | section | `src/gst/place-of-supply/services-india.ts`        | `test/gst/place-of-supply-services-india.test.ts`        | Advertisement to government                                  |
| SEC_13 (IGST)   | section | `src/gst/place-of-supply/services-cross-border.ts` | `test/gst/place-of-supply-services-cross-border.test.ts` | POS services where supplier or recipient outside India       |
| SEC_13_3        | section | `src/gst/place-of-supply/services-cross-border.ts` | `test/gst/place-of-supply-services-cross-border.test.ts` | Services performed on physical goods                         |
| SEC_13_4        | section | `src/gst/place-of-supply/services-cross-border.ts` | `test/gst/place-of-supply-services-cross-border.test.ts` | Immovable-property services across border                    |
| SEC_13_5        | section | `src/gst/place-of-supply/services-cross-border.ts` | `test/gst/place-of-supply-services-cross-border.test.ts` | Event admission across border                                |
| SEC_13_6        | section | `src/gst/place-of-supply/services-cross-border.ts` | `test/gst/place-of-supply-services-cross-border.test.ts` | Intermediary services                                        |
| SEC_13_7        | section | `src/gst/place-of-supply/services-cross-border.ts` | `test/gst/place-of-supply-services-cross-border.test.ts` | Hiring of means of transport                                 |
| SEC_13_8        | section | `src/gst/place-of-supply/services-cross-border.ts` | `test/gst/place-of-supply-services-cross-border.test.ts` | Banking and financial services across border                 |
| SEC_13_9        | section | `src/gst/place-of-supply/services-cross-border.ts` | `test/gst/place-of-supply-services-cross-border.test.ts` | Transportation of goods across border                        |
| SEC_13_10       | section | `src/gst/place-of-supply/services-cross-border.ts` | `test/gst/place-of-supply-services-cross-border.test.ts` | Passenger transportation across border                       |
| SEC_13_12       | section | `src/gst/place-of-supply/services-cross-border.ts` | `test/gst/place-of-supply-services-cross-border.test.ts` | OIDAR services to non-taxable online recipient               |
| SEC_16 (IGST)   | section | (zero-rated supply)                                | `test/gst/citations.test.ts`                             | Zero-rated supply                                            |
| SEC_19 (IGST)   | section | (wrong-head adjustment)                            | `test/gst/citations.test.ts`                             | Tax wrongly collected and paid                               |

### CGST Rules 2017

Citation registry: `src/gst/citations/cgst-rules.ts`. Tested at `test/gst/citations.test.ts`.

| Citation  | Type | Source file                                | Test file                          | Brief description                                       |
| --------- | ---- | ------------------------------------------ | ---------------------------------- | ------------------------------------------------------- |
| RULE_36   | rule | (ITC documentation chain)                  | `test/gst/citations.test.ts`       | Documentary requirements for ITC                        |
| RULE_36_4 | rule | (legacy; superseded)                       | `test/gst/citations.test.ts`       | Removed Jan 2022; replaced by 16(2)(aa)                 |
| RULE_37   | rule | `src/gst/itc/eligibility.ts`               | `test/gst/itc-eligibility.test.ts` | Reversal where supplier has not paid tax                |
| RULE_37A  | rule | `src/gst/itc/eligibility.ts`               | `test/gst/itc-eligibility.test.ts` | Reversal where supplier has not filed GSTR-3B           |
| RULE_42   | rule | (apportionment ITC chain)                  | `test/gst/citations.test.ts`       | Apportionment common ITC inputs / input services        |
| RULE_43   | rule | (capital-goods apportionment)              | `test/gst/citations.test.ts`       | Apportionment common ITC capital goods over 60 months   |
| RULE_46   | rule | (tax invoice)                              | `test/gst/citations.test.ts`       | Tax invoice                                             |
| RULE_48_4 | rule | (e-invoicing)                              | `test/gst/citations.test.ts`       | E-invoicing via IRP per Notification 13/2020-CT         |
| RULE_59   | rule | `src/gst/frequencies/index.ts`             | `test/gst/frequencies.test.ts`     | GSTR-1 form and manner                                  |
| RULE_59_2 | rule | (IFF chain)                                | `test/gst/frequencies.test.ts`     | IFF for QRMP filers in months 1 and 2                   |
| RULE_59_3 | rule | (amendment time-bar)                       | `test/gst/citations.test.ts`       | Amendment time-bar 30 November / annual return          |
| RULE_60   | rule | `src/gst/itc/eligibility.ts`               | `test/gst/itc-eligibility.test.ts` | Auto-views: GSTR-2A real-time, GSTR-2B static           |
| RULE_61   | rule | `src/gst/frequencies/index.ts`             | `test/gst/frequencies.test.ts`     | GSTR-3B form and manner                                 |
| RULE_62   | rule | `src/gst/frequencies/index.ts`             | `test/gst/frequencies.test.ts`     | CMP-08 + GSTR-4 for composition                         |
| RULE_63   | rule | (GSTR-5 NRTP)                              | `test/gst/citations.test.ts`       | GSTR-5 non-resident taxable person                      |
| RULE_64   | rule | (GSTR-5A OIDAR)                            | `test/gst/citations.test.ts`       | GSTR-5A OIDAR                                           |
| RULE_65   | rule | (GSTR-6 ISD)                               | `test/gst/citations.test.ts`       | GSTR-6 Input Service Distributor                        |
| RULE_66   | rule | (GSTR-7 TDS)                               | `test/gst/citations.test.ts`       | GSTR-7 TDS deductor under Section 51                    |
| RULE_67   | rule | (GSTR-8 TCS)                               | `test/gst/citations.test.ts`       | GSTR-8 TCS by ECO under Section 52                      |
| RULE_80   | rule | (GSTR-9 / 9C)                              | `test/gst/citations.test.ts`       | GSTR-9 annual return + GSTR-9C reconciliation           |
| RULE_85   | rule | (electronic liability register)            | `test/gst/citations.test.ts`       | Electronic Liability Register                           |
| RULE_86   | rule | (electronic credit ledger)                 | `test/gst/citations.test.ts`       | Electronic Credit Ledger                                |
| RULE_86_2 | rule | (RCM payment from cash)                    | `test/gst/citations.test.ts`       | ITC cannot be utilised to pay RCM tax                   |
| RULE_87   | rule | (electronic cash ledger / PMT-06)          | `test/gst/citations.test.ts`       | Electronic Cash Ledger; PMT-06 monthly                  |
| RULE_88B  | rule | `src/gst/penalties/section-50-interest.ts` | `test/gst/penalties.test.ts`       | Interest computation on net cash basis (eff 1-Jul-2022) |
| RULE_89   | rule | (refund RFD-01)                            | `test/gst/citations.test.ts`       | Refund application                                      |
| RULE_89_5 | rule | (inverted-duty-structure refund formula)   | `test/gst/citations.test.ts`       | Inverted-duty refund formula; input services excluded   |
| RULE_91   | rule | (provisional refund)                       | `test/gst/citations.test.ts`       | Provisional refund of 90% within 7 days                 |
| RULE_92   | rule | (final refund order)                       | `test/gst/citations.test.ts`       | Final refund order within 60 days                       |
| RULE_96A  | rule | (LUT export refund)                        | `test/gst/citations.test.ts`       | Refund of IGST on exports under bond / LUT              |
| RULE_138  | rule | (e-way bill chain)                         | `test/gst/citations.test.ts`       | E-way bill above Rs 50,000 consignment value            |
| RULE_142  | rule | (DRC family)                               | `test/gst/citations.test.ts`       | Notice and order for demand DRC family                  |

### CBIC notifications

Citation registry: `src/gst/citations/cbic-notifications.ts`. Tested at `test/gst/citations.test.ts`.

| Citation          | Type         | Source file                                | Test file                              | Brief description                                         |
| ----------------- | ------------ | ------------------------------------------ | -------------------------------------- | --------------------------------------------------------- |
| N_1_2017_CT_RATE  | notification | `src/gst/rates/slabs.ts`                   | `test/gst/rates-slabs.test.ts`         | Principal CGST rate schedule. Five slabs                  |
| N_4_2017_CT_RATE  | notification | (RCM goods chain)                          | `test/gst/citations.test.ts`           | RCM goods list under Section 9(3)                         |
| N_13_2017_CT_RATE | notification | (RCM services chain)                       | `test/gst/citations.test.ts`           | RCM services list. GTA, advocate, director, OIDAR         |
| N_8_2017_CT_RATE  | notification | `src/gst/composition/rates.ts`             | `test/gst/composition.test.ts`         | Suspends Section 9(4) RCM unregistered to registered      |
| N_6_2017_CT       | notification | `src/gst/frequencies/index.ts`             | `test/gst/frequencies.test.ts`         | GSTR-3B due 20th of next month for monthly filers         |
| N_49_2019_CT      | notification | (Rule 61(5) amendment)                     | `test/gst/citations.test.ts`           | Permanent GSTR-3B form via Rule 61(5)                     |
| N_75_2020_CT      | notification | `src/gst/frequencies/index.ts`             | `test/gst/frequencies.test.ts`         | QRMP due dates for GSTR-1 and GSTR-3B                     |
| N_76_2020_CT      | notification | `src/gst/frequencies/index.ts`             | `test/gst/frequencies.test.ts`         | QRMP State-group split for GSTR-3B (22 / 24)              |
| N_82_2020_CT      | notification | (IFF chain)                                | `test/gst/citations.test.ts`           | IFF Rule 59(2) for B2B in QRMP months 1-2                 |
| N_85_2020_CT      | notification | (PMT-06 35-percent method)                 | `test/gst/citations.test.ts`           | PMT-06 fixed-sum 35-percent method for QRMP               |
| N_78_2020_CT      | notification | (HSN granularity chain)                    | `test/gst/citations.test.ts`           | HSN digit-granularity per turnover band, eff 1-Apr-2021   |
| N_13_2020_CT      | notification | (e-invoicing principal)                    | `test/gst/citations.test.ts`           | E-invoicing principal notification via Rule 48(4)         |
| N_10_2023_CT      | notification | (e-invoice threshold lowering)             | `test/gst/citations.test.ts`           | E-invoice threshold lowered to Rs 5 crore, eff 1-Aug-2023 |
| N_30_2021_CT      | notification | (GSTR-9C self-certification)               | `test/gst/citations.test.ts`           | GSTR-9C self-certification post FY 2020-21                |
| N_31_2021_CT      | notification | (reconciliation operationalisation)        | `test/gst/citations.test.ts`           | GSTR-9 / 9C self-certification operationalisation         |
| N_38_2021_CT      | notification | (Aadhaar-mandatory registration)           | `test/gst/citations.test.ts`           | Aadhaar authentication for GST registration               |
| N_14_2022_CT      | notification | `src/gst/penalties/section-50-interest.ts` | `test/gst/penalties.test.ts`           | Rule 88B inserted; net-cash interest eff 1-Jul-2022       |
| N_7_2023_CT       | notification | `src/gst/penalties/section-47-late-fee.ts` | `test/gst/late-fee-cap-matrix.test.ts` | Late-fee waiver and cap revision per turnover band        |
| N_11_2023_CT_RATE | notification | (online-gaming 28-percent slab)            | `test/gst/citations.test.ts`           | 28% on full face value online gaming, eff 1-Oct-2023      |
| N_12_2024_CT      | notification | (IMS + GSTR-1A introduction)               | `test/gst/citations.test.ts`           | IMS + GSTR-1A; ISD amendment, eff Aug-Oct 2024            |

---

## Income-Tax TDS (Offering B)

### ITA Sections (TDS substrate)

Citation registry: `src/tds/citations/ita-sections.ts`. Tested at `test/tds/citations.test.ts`.

| Citation     | Type    | Source file                                                                         | Test file                                                                                 | Brief description                                                 |
| ------------ | ------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| SEC_190      | section | (foundational; not directly invoked)                                                | `test/tds/citations.test.ts`                                                              | TDS as one mode of recovery                                       |
| SEC_191      | section | (direct payment chain)                                                              | `test/tds/citations.test.ts`                                                              | Direct payment by assessee where TDS not deducted                 |
| SEC_192      | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`, `test/tds/specified-person.test.ts`                | TDS on salaries. Slab-rate computation                            |
| SEC_192A     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`, `test/tds/specified-person.test.ts`                | TDS on premature EPF withdrawal 10% above Rs 50,000               |
| SEC_193      | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TDS interest on securities                                        |
| SEC_194      | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TDS dividends 10% above Rs 5,000                                  |
| SEC_194A     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TDS interest other than securities 10%                            |
| SEC_194B     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`, `test/tds/specified-person.test.ts`                | TDS lottery / crossword 30% above Rs 10,000                       |
| SEC_194BA    | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`, `test/tds/rate-band-effective-date-matrix.test.ts` | TDS online gaming net winnings 30% (FA 2023)                      |
| SEC_194BB    | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`, `test/tds/specified-person.test.ts`                | TDS horse race 30% above Rs 10,000                                |
| SEC_194C     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TDS contractor 1% (ind / HUF) or 2% (others)                      |
| SEC_194D     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-effective-date-matrix.test.ts`                                        | TDS insurance commission 2% post Oct 2024 (5% prior)              |
| SEC_194DA    | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-effective-date-matrix.test.ts`                                        | TDS life insurance maturity 2% post Oct 2024                      |
| SEC_194E     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TDS NR sportsmen / sports associations 20%                        |
| SEC_194EE    | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TDS NSS withdrawal 10% above Rs 2,500                             |
| SEC_194F     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-effective-date-matrix.test.ts`                                        | TDS MF unit repurchase. REPEALED post Oct 2024                    |
| SEC_194G     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-effective-date-matrix.test.ts`                                        | TDS lottery commission 2% post Oct 2024                           |
| SEC_194H     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-effective-date-matrix.test.ts`                                        | TDS commission / brokerage 2% post Oct 2024                       |
| SEC_194I_A   | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TDS rent of plant / machinery 2% above Rs 2.4L                    |
| SEC_194I_B   | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TDS rent of land / building / furniture 10% above Rs 2.4L         |
| SEC_194_IA   | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TDS transfer of immovable property 1% above Rs 50L (26QB)         |
| SEC_194_IB   | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-effective-date-matrix.test.ts`                                        | TDS rent by individuals / HUF 2% post Oct 2024 (26QC)             |
| SEC_194_IC   | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TDS JDA consideration 10%                                         |
| SEC_194J     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TDS professional / technical 10% / 2% / 10%                       |
| SEC_194K     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TDS MF income 10% above Rs 5,000                                  |
| SEC_194LA    | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TDS land acquisition 10% above Rs 2.5L                            |
| SEC_194LB    | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TDS infrastructure debt fund interest 5%                          |
| SEC_194LBA   | section | (business-trust chain)                                                              | `test/tds/citations.test.ts`                                                              | TDS business-trust distributions                                  |
| SEC_194LBB   | section | (investment-fund chain)                                                             | `test/tds/citations.test.ts`                                                              | TDS investment-fund income                                        |
| SEC_194LBC   | section | `src/tds/pan-validation/specified-person.ts`                                        | `test/tds/specified-person.test.ts`                                                       | TDS securitisation-trust income; 206AB carve-out                  |
| SEC_194LC    | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TDS foreign-currency loan interest 5% / 4% IFSC                   |
| SEC_194LD    | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TDS FII / QFI rupee-bond interest 5%                              |
| SEC_194M     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-effective-date-matrix.test.ts`                                        | TDS contractor / professional by ind / HUF 2% post Oct 2024       |
| SEC_194N     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/specified-person.test.ts`                                                       | TDS cash withdrawals 2%; 206AB carve-out                          |
| SEC_194O     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-effective-date-matrix.test.ts`                                        | TDS e-commerce 0.1% post Oct 2024 (1% prior)                      |
| SEC_194P     | section | (senior-citizen full discharge)                                                     | `test/tds/citations.test.ts`                                                              | TDS in full discharge for seniors 75+                             |
| SEC_194Q     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-effective-date-matrix.test.ts`                                        | TDS goods purchase 0.1% above Rs 50L                              |
| SEC_194R     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-effective-date-matrix.test.ts`                                        | TDS benefits / perquisites 10% above Rs 20,000                    |
| SEC_194S     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-effective-date-matrix.test.ts`                                        | TDS VDA / crypto 1% (26QE)                                        |
| SEC_194T     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-effective-date-matrix.test.ts`                                        | TDS partner remuneration / interest 10% (FA 2024, eff 1-Apr-2025) |
| SEC_195      | section | (NR payments chain)                                                                 | `test/tds/citations.test.ts`                                                              | TDS to non-residents per ITA / DTAA                               |
| SEC_196A     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TDS NR mutual-fund income 20%                                     |
| SEC_196B     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TDS offshore-fund LTCG 10%                                        |
| SEC_196C     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TDS NR bond / GDR interest 10%                                    |
| SEC_196D     | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TDS FII security income 20% / DTAA                                |
| SEC_197      | section | (lower / nil deduction cert)                                                        | `test/tds/citations.test.ts`                                                              | Lower / nil deduction cert by AO                                  |
| SEC_197A     | section | (Form 15G / 15H)                                                                    | `test/tds/citations.test.ts`                                                              | Form 15G / 15H declarations                                       |
| SEC_198      | section | (deduction-as-income)                                                               | `test/tds/citations.test.ts`                                                              | Tax deducted is income received                                   |
| SEC_199      | section | (credit chain)                                                                      | `test/tds/citations.test.ts`                                                              | Credit for TDS in deductee ITR                                    |
| SEC_200      | section | (deductor duty)                                                                     | `test/tds/citations.test.ts`                                                              | Duty of person deducting tax                                      |
| SEC_200A     | section | (TRACES default summary)                                                            | `test/tds/citations.test.ts`                                                              | Processing of TDS statements                                      |
| SEC_201      | section | `src/tds/penalties/section-201-1a-interest.ts`                                      | `test/tds/penalties.test.ts`                                                              | Consequences of failure. Assessee-in-default                      |
| SEC_201_1A   | section | `src/tds/penalties/section-201-1a-interest.ts`                                      | `test/tds/penalties.test.ts`                                                              | 1% / 1.5% monthly interest on delayed deduction / payment         |
| SEC_202      | section | (cumulative recovery)                                                               | `test/tds/citations.test.ts`                                                              | Cumulative recovery from deductee                                 |
| SEC_203      | section | (Form 16 family)                                                                    | `test/tds/citations.test.ts`                                                              | Certificate of deduction (Form 16, 27D)                           |
| SEC_203A     | section | (TAN mandatory)                                                                     | `test/tds/citations.test.ts`                                                              | TAN mandatory for every deductor                                  |
| SEC_204      | section | (responsible person)                                                                | `test/tds/citations.test.ts`                                                              | Person responsible for paying                                     |
| SEC_205      | section | (bar against direct demand)                                                         | `test/tds/citations.test.ts`                                                              | Bar against direct demand on assessee                             |
| SEC_206      | section | (quarterly return obligation)                                                       | `test/tds/citations.test.ts`                                                              | Quarterly TDS return basis (24Q / 26Q / 27Q)                      |
| SEC_206A     | section | (statement of non-deduction)                                                        | `test/tds/citations.test.ts`                                                              | Statement of payment in respect of which TDS not deducted         |
| SEC_206AA    | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`, `test/tds/uplift-matrix.test.ts`                   | Higher TDS no-PAN. Max(2x, 20%)                                   |
| SEC_206AB    | section | `src/tds/rates/rate-band-resolver.ts`, `src/tds/pan-validation/specified-person.ts` | `test/tds/specified-person.test.ts`, `test/tds/uplift-matrix.test.ts`                     | Higher TDS specified persons. Max(2x, 5%)                         |
| SEC_206C     | section | (TCS chain)                                                                         | `test/tds/citations.test.ts`                                                              | TCS on specified goods / e-commerce / LRS / sale                  |
| SEC_206C_1   | section | (TCS chain)                                                                         | `test/tds/citations.test.ts`                                                              | TCS on alcohol / scrap / tendu / timber / minerals                |
| SEC_206C_1A  | section | (Form 27C)                                                                          | `test/tds/citations.test.ts`                                                              | TCS exemption declaration Form 27C                                |
| SEC_206C_1F  | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TCS motor vehicles above Rs 10L 1%                                |
| SEC_206C_1G  | section | (TCS LRS chain)                                                                     | `test/tds/citations.test.ts`                                                              | TCS LRS remittances + overseas tour                               |
| SEC_206C_1H  | section | `src/tds/rates/rate-band-resolver.ts`                                               | `test/tds/rate-band-resolver.test.ts`                                                     | TCS sale of goods above Rs 50L 0.1% (with 194Q sequencing)        |
| SEC_206CC    | section | (TCS no-PAN)                                                                        | `test/tds/citations.test.ts`                                                              | TCS no-PAN. Max(2x, 5%)                                           |
| SEC_206CCA   | section | (TCS specified persons)                                                             | `test/tds/citations.test.ts`                                                              | TCS specified persons. Max(2x, 5%)                                |
| SEC_234E     | section | `src/tds/penalties/section-234e-late-fee.ts`                                        | `test/tds/penalties.test.ts`                                                              | Late fee delayed quarterly TDS return Rs 200 / day capped at TDS  |
| SEC_271H     | section | (penalty for non-filing)                                                            | `test/tds/citations.test.ts`                                                              | Penalty Rs 10,000 to Rs 1,00,000                                  |
| SEC_272A_2_K | section | (penalty Form 16 / 16A late)                                                        | `test/tds/citations.test.ts`                                                              | Penalty Rs 100 / day capped at TDS                                |
| SEC_272BB    | section | (TAN penalty)                                                                       | `test/tds/citations.test.ts`                                                              | Failure to obtain or quote TAN. Rs 10,000                         |
| SEC_273A     | section | (waiver power)                                                                      | `test/tds/citations.test.ts`                                                              | Power to reduce or waive penalty                                  |
| SEC_276B     | section | (prosecution TDS)                                                                   | `test/tds/citations.test.ts`                                                              | Prosecution failure to deposit TDS. 3 months to 7 years RI        |
| SEC_276BB    | section | (prosecution TCS)                                                                   | `test/tds/citations.test.ts`                                                              | Prosecution failure to deposit TCS. Same as 276B                  |
| SEC_119      | section | (CBDT power)                                                                        | `test/tds/citations.test.ts`                                                              | CBDT power to issue instructions / orders                         |

### Income-tax Rules 1962 (TDS substrate)

Citation registry: `src/tds/citations/it-rules.ts`. Tested at `test/tds/citations.test.ts`.

| Citation   | Type | Source file                        | Test file                    | Brief description                                           |
| ---------- | ---- | ---------------------------------- | ---------------------------- | ----------------------------------------------------------- |
| RULE_26    | rule | (FX conversion fallback)           | `test/tds/citations.test.ts` | Rate for FX conversion. TDS in INR for NR payments          |
| RULE_26A   | rule | (Form 12BA)                        | `test/tds/citations.test.ts` | Form 12BA detail of perquisites                             |
| RULE_26B   | rule | (Form 12BB)                        | `test/tds/citations.test.ts` | Form 12BB employee declaration of investment proofs / HRA   |
| RULE_30    | rule | (TDS payment timing)               | `test/tds/citations.test.ts` | Time and manner of TDS payment 7th of next month / 30 April |
| RULE_30_1A | rule | (challan ITNS-281 / cum-statement) | `test/tds/citations.test.ts` | Mode of payment: ITNS-281 or challan-cum-statement          |
| RULE_30_2  | rule | (transactional 30-day timing)      | `test/tds/citations.test.ts` | Specific 30-day timing for 194-IA / 194-IB / 194M / 194S    |
| RULE_31    | rule | (Form 16 family)                   | `test/tds/citations.test.ts` | Form and manner of TDS certificates                         |
| RULE_31A   | rule | (24Q / 26Q / 27Q quarterly)        | `test/tds/citations.test.ts` | Quarterly statement; Q1 / Q2 / Q3 / Q4 due dates            |
| RULE_31A_4 | rule | (24Q Annexure-II)                  | `test/tds/citations.test.ts` | 24Q Annexure-II per-employee Q4 salary disclosure           |
| RULE_31AA  | rule | (TCS 27EQ)                         | `test/tds/citations.test.ts` | Quarterly statement of TCS 27EQ                             |
| RULE_31AB  | rule | (Form 26AS)                        | `test/tds/citations.test.ts` | Annual statement of TDS in Form 26AS                        |
| RULE_31ACB | rule | (Form 26B refund)                  | `test/tds/citations.test.ts` | Form 26B for refund of excess TDS by deductor               |
| RULE_37BA  | rule | (year-of-credit alignment)         | `test/tds/citations.test.ts` | Credit for TDS; year-of-credit alignment with deductor      |
| RULE_37BB  | rule | (Form 15CA / 15CB)                 | `test/tds/citations.test.ts` | Form 15CA / 15CB for NR remittances                         |
| RULE_37BC  | rule | (206AA NR bypass)                  | `test/tds/citations.test.ts` | Section 206AA bypass for NRs (TIN / TRC)                    |

### Finance Acts (TDS substrate)

Citation registry: `src/tds/citations/finance-acts.ts`. Tested at `test/tds/citations.test.ts`.

| Citation                 | Type        | Source file                           | Test file                                          | Brief description                       |
| ------------------------ | ----------- | ------------------------------------- | -------------------------------------------------- | --------------------------------------- |
| FA_2021_S194Q            | finance-act | `src/tds/rates/rate-band-resolver.ts` | `test/tds/rate-band-effective-date-matrix.test.ts` | Section 194Q introduced eff 1-Jul-2021  |
| FA_2021_S194P            | finance-act | (senior-citizen full discharge)       | `test/tds/citations.test.ts`                       | Section 194P introduced eff 1-Apr-2021  |
| FA_2021_S206AB           | finance-act | (introduction; specified persons)     | `test/tds/citations.test.ts`                       | Section 206AB introduced eff 1-Jul-2021 |
| FA_2022_S194R            | finance-act | `src/tds/rates/rate-band-resolver.ts` | `test/tds/rate-band-effective-date-matrix.test.ts` | Section 194R introduced eff 1-Jul-2022  |
| FA_2022_S194S            | finance-act | `src/tds/rates/rate-band-resolver.ts` | `test/tds/rate-band-effective-date-matrix.test.ts` | Section 194S introduced eff 1-Jul-2022  |
| FA_2022_RULE_88B         | finance-act | (cross-domain ref to Rule 88B GST)    | `test/tds/citations.test.ts`                       | Rule 88B inserted; net-cash interest    |
| FA_2023_S194BA           | finance-act | `src/tds/rates/rate-band-resolver.ts` | `test/tds/rate-band-effective-date-matrix.test.ts` | Section 194BA introduced eff 1-Apr-2023 |
| FA_2023_S206AB_CARVEOUT  | finance-act | `src/tds/rates/rate-band-resolver.ts` | `test/tds/uplift-matrix.test.ts`                   | 206AB carve-out narrowing               |
| FA_2024_OCT_CLIFF_194D   | finance-act | `src/tds/rates/rate-band-resolver.ts` | `test/tds/rate-band-effective-date-matrix.test.ts` | 194D rate 5% to 2% eff 1-Oct-2024       |
| FA_2024_OCT_CLIFF_194DA  | finance-act | `src/tds/rates/rate-band-resolver.ts` | `test/tds/rate-band-effective-date-matrix.test.ts` | 194DA rate 5% to 2% eff 1-Oct-2024      |
| FA_2024_OCT_CLIFF_194G   | finance-act | `src/tds/rates/rate-band-resolver.ts` | `test/tds/rate-band-effective-date-matrix.test.ts` | 194G rate 5% to 2% eff 1-Oct-2024       |
| FA_2024_OCT_CLIFF_194H   | finance-act | `src/tds/rates/rate-band-resolver.ts` | `test/tds/rate-band-effective-date-matrix.test.ts` | 194H rate 5% to 2% eff 1-Oct-2024       |
| FA_2024_OCT_CLIFF_194_IB | finance-act | `src/tds/rates/rate-band-resolver.ts` | `test/tds/rate-band-effective-date-matrix.test.ts` | 194-IB rate 5% to 2% eff 1-Oct-2024     |
| FA_2024_OCT_CLIFF_194M   | finance-act | `src/tds/rates/rate-band-resolver.ts` | `test/tds/rate-band-effective-date-matrix.test.ts` | 194M rate 5% to 2% eff 1-Oct-2024       |
| FA_2024_OCT_CLIFF_194O   | finance-act | `src/tds/rates/rate-band-resolver.ts` | `test/tds/rate-band-effective-date-matrix.test.ts` | 194O rate 1% to 0.1% eff 1-Oct-2024     |
| FA_2024_S194T            | finance-act | `src/tds/rates/rate-band-resolver.ts` | `test/tds/rate-band-effective-date-matrix.test.ts` | Section 194T introduced eff 1-Apr-2025  |
| FA_2024_S194F_REPEAL     | finance-act | `src/tds/rates/rate-band-resolver.ts` | `test/tds/rate-band-effective-date-matrix.test.ts` | Section 194F repealed eff 1-Oct-2024    |

### CBDT Circulars (TDS substrate)

Citation registry: `src/tds/citations/cbdt-circulars.ts`. Tested at `test/tds/citations.test.ts`.

| Citation  | Type     | Source file                   | Test file                    | Brief description                                                               |
| --------- | -------- | ----------------------------- | ---------------------------- | ------------------------------------------------------------------------------- |
| C_4_2022  | circular | (194Q / 206C(1H) sequencing)  | `test/tds/citations.test.ts` | 194Q clarifications: buyer threshold, GST component, 194Q / 206C(1H) sequencing |
| C_13_2022 | circular | (194S VDA clarifications)     | `test/tds/citations.test.ts` | 194S clarifications: peer-to-peer crypto, exchange treatment                    |
| C_18_2022 | circular | (194R clarifications)         | `test/tds/citations.test.ts` | 194R clarifications: scope, valuation, examples                                 |
| C_19_2022 | circular | (194R further clarifications) | `test/tds/citations.test.ts` | 194R further: year of taxability, dealer-incentive                              |

---

## Where to read next

- [README](../README.md). Audience-routed quick navigation.
- [Architecture](./architecture.md). The directory taxonomy a contributor follows when adding a new tax domain.
- [Worked examples](./worked-examples.md). Five end-to-end runs that exercise rules across the index against primary-source numbers.
- The [decisions](../decisions/) folder. ADRs explaining why citations are a discriminated union and why past AYs are frozen.
