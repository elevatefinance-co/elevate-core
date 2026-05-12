/* Barrel for the tds penalties sub-namespace. Section 201(1A) interest (1 percent / 1.5 percent monthly)
 * and Section 234E late fee (Rs 200 / day capped at TDS amount) ship here today; Section 271H discretionary
 * penalty (Rs 10,000 to Rs 1,00,000) and the prosecution Section 276B / 276BB scope land in follow-up
 * commits as decision-support surfaces (the rule engine cannot quantify discretionary penalties; it can
 * only surface the band and the citation). */

export * from './section-201-1a-interest.js';
export * from './section-234e-late-fee.js';
