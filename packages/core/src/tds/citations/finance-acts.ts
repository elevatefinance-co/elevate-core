/* Finance Act citation registry for the TDS regime. Each annual Finance Act amends Chapter XVII-B; the TDS
 * rule engine cites the originating Finance Act when a Section was introduced or a rate was changed by
 * Finance Act amendment.
 *
 * Notable recent Finance Acts:
 *   FA 2021    Section 194Q (effective 1 July 2021), 194P, 206AB
 *   FA 2022    Section 194R (effective 1 July 2022), 194S
 *   FA 2023    Section 194BA (effective 1 April 2023); 206AB carve-out narrowing
 *   FA 2024    Oct 2024 cliff: rate reductions for 194DA / G / H / -IB / M / O.
 *              Section 194D reduction effective 1 April 2025.
 *              Section 194T introduction (effective 1 April 2025). Section 194F repeal
 *   FA 2025    Apr 2025 cliff: threshold rationalization for 193 / 194 / 194A / 194B / 194BB /
 *              194D / 194H / 194-I / 194J / 194K. Sections 206AB / 206CCA omitted */

import type { FinanceActCitation } from '../../types/citation.js';

export const fa = (year: number, section?: string, note?: string): FinanceActCitation => ({
  kind: 'finance-act',
  year,
  ...(section !== undefined ? { section } : {}),
  ...(note !== undefined ? { note } : {}),
});

export const FINANCE_ACTS_TDS = {
  FA_2021_S194Q: fa(
    2021,
    '194Q',
    'Section 194Q introduced -- TDS by buyer on goods purchase, effective 1 July 2021',
  ),
  FA_2021_S194P: fa(
    2021,
    '194P',
    'Section 194P introduced -- TDS in full discharge for senior citizens 75+, effective 1 April 2021',
  ),
  FA_2021_S206AB: fa(
    2021,
    '206AB',
    'Section 206AB introduced -- higher TDS for non-filers, effective 1 July 2021',
  ),
  FA_2022_S194R: fa(
    2022,
    '194R',
    'Section 194R introduced -- TDS on benefits / perquisites, effective 1 July 2022',
  ),
  FA_2022_S194S: fa(
    2022,
    '194S',
    'Section 194S introduced -- TDS on VDA / crypto, effective 1 July 2022',
  ),
  FA_2022_RULE_88B: fa(
    2022,
    undefined,
    'Rule 88B inserted -- net-cash interest computation under Section 50 (this also applies to GST regime)',
  ),
  FA_2023_S194BA: fa(
    2023,
    '194BA',
    'Section 194BA introduced -- TDS on online gaming net winnings, effective 1 April 2023',
  ),
  FA_2023_S206AB_CARVEOUT: fa(
    2023,
    '206AB',
    'Section 206AB carve-out narrowing -- restricted to 192 / 192A / 194B / 194BB / 194LBC / 194N',
  ),
  FA_2024_S194D_REDUCTION: fa(
    2024,
    '194D',
    'Section 194D rate reduction (non-company deductee) -- 5 percent to 2 percent (Finance (No. 2) Act 2024), effective 1 April 2025',
  ),
  FA_2024_OCT_CLIFF_194DA: fa(
    2024,
    '194DA',
    'Section 194DA rate reduction -- 5 percent to 2 percent, effective 1 October 2024',
  ),
  FA_2024_OCT_CLIFF_194G: fa(
    2024,
    '194G',
    'Section 194G rate reduction -- 5 percent to 2 percent, effective 1 October 2024',
  ),
  FA_2024_OCT_CLIFF_194H: fa(
    2024,
    '194H',
    'Section 194H rate reduction -- 5 percent to 2 percent, effective 1 October 2024',
  ),
  FA_2024_OCT_CLIFF_194_IB: fa(
    2024,
    '194-IB',
    'Section 194-IB rate reduction -- 5 percent to 2 percent, effective 1 October 2024',
  ),
  FA_2024_OCT_CLIFF_194M: fa(
    2024,
    '194M',
    'Section 194M rate reduction -- 5 percent to 2 percent, effective 1 October 2024',
  ),
  FA_2024_OCT_CLIFF_194O: fa(
    2024,
    '194O',
    'Section 194O rate reduction -- 1 percent to 0.1 percent, effective 1 October 2024',
  ),
  FA_2024_S194T: fa(
    2024,
    '194T',
    'Section 194T introduced -- TDS on partner remuneration / interest by firms / LLPs, effective 1 April 2025',
  ),
  FA_2024_S194F_REPEAL: fa(
    2024,
    '194F',
    'Section 194F repealed -- TDS on MF unit repurchase removed effective 1 October 2024',
  ),
  FA_2025_S206AB_OMISSION: fa(
    2025,
    '206AB',
    'Sections 206AB and 206CCA omitted -- higher TDS / TCS for non-filers ends, effective 1 April 2025',
  ),
  FA_2025_THRESHOLD_193: fa(
    2025,
    '193',
    'Section 193 threshold introduced -- Rs 10,000 per FY for interest on securities (previously Nil), effective 1 April 2025',
  ),
  FA_2025_THRESHOLD_194: fa(
    2025,
    '194',
    'Section 194 dividend threshold raised -- Rs 5,000 to Rs 10,000 per FY (individual shareholder, non-cash modes), effective 1 April 2025',
  ),
  FA_2025_THRESHOLD_194A: fa(
    2025,
    '194A',
    'Section 194A interest thresholds raised -- Rs 1,00,000 (senior citizen) / Rs 50,000 (others) for bank, co-operative bank and post office payers, Rs 10,000 for other payers (previously Rs 50,000 / Rs 40,000 / Rs 5,000), effective 1 April 2025',
  ),
  FA_2025_THRESHOLD_194B: fa(
    2025,
    '194B',
    'Section 194B threshold basis changed -- Rs 10,000 per single transaction (previously Rs 10,000 aggregate per FY), effective 1 April 2025',
  ),
  FA_2025_THRESHOLD_194BB: fa(
    2025,
    '194BB',
    'Section 194BB threshold basis changed -- Rs 10,000 per single transaction (previously Rs 10,000 aggregate per FY), effective 1 April 2025',
  ),
  FA_2025_THRESHOLD_194D: fa(
    2025,
    '194D',
    'Section 194D insurance commission threshold raised -- Rs 15,000 to Rs 20,000 per FY, effective 1 April 2025',
  ),
  FA_2025_THRESHOLD_194H: fa(
    2025,
    '194H',
    'Section 194H commission / brokerage threshold raised -- Rs 15,000 to Rs 20,000 per FY, effective 1 April 2025',
  ),
  FA_2025_THRESHOLD_194I: fa(
    2025,
    '194-I',
    'Section 194-I rent threshold basis changed -- Rs 50,000 per month or part of a month (previously Rs 2,40,000 per FY), effective 1 April 2025',
  ),
  FA_2025_THRESHOLD_194J: fa(
    2025,
    '194J',
    'Section 194J threshold raised -- Rs 30,000 to Rs 50,000 per nature of payment per FY, effective 1 April 2025',
  ),
  FA_2025_THRESHOLD_194K: fa(
    2025,
    '194K',
    'Section 194K mutual fund income threshold raised -- Rs 5,000 to Rs 10,000 per FY, effective 1 April 2025',
  ),
} as const;

export type FinanceActTdsKey = keyof typeof FINANCE_ACTS_TDS;
