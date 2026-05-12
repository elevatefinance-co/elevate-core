/* Tests for the Section 24 compulsory-registration finder.
 * Each predicate flag triggers the matching category;
 * multiple flags resolve to the first-matched (the input order in findCompulsoryRegistrationTrigger).
 */

import { findCompulsoryRegistrationTrigger } from '../../src/gst/registration/index.js';

describe('findCompulsoryRegistrationTrigger', () => {
  it('returns required false for an empty input', () => {
    const result = findCompulsoryRegistrationTrigger({});
    expect(result.required).toBe(false);
  });

  it('triggers on inter-State outward supply', () => {
    const result = findCompulsoryRegistrationTrigger({
      hasInterStateOutwardSupply: true,
    });
    expect(result.required).toBe(true);
    if (result.required) {
      expect(result.category).toBe('INTER_STATE_OUTWARD_SUPPLY');
      expect(result.notes).toContain('Section 24(1)');
    }
  });

  it('triggers on casual taxable person', () => {
    const result = findCompulsoryRegistrationTrigger({
      isCasualTaxablePerson: true,
    });
    expect(result.required).toBe(true);
    if (result.required) expect(result.category).toBe('CASUAL_TAXABLE_PERSON');
  });

  it('triggers on reverse-charge payer', () => {
    const result = findCompulsoryRegistrationTrigger({
      isReverseChargePayer: true,
    });
    expect(result.required).toBe(true);
    if (result.required) expect(result.category).toBe('REVERSE_CHARGE_PAYER');
  });

  it('triggers on TDS deductor under Section 51', () => {
    const result = findCompulsoryRegistrationTrigger({
      isTdsDeductorUnderS51: true,
    });
    expect(result.required).toBe(true);
    if (result.required) expect(result.category).toBe('TDS_DEDUCTOR_S51');
  });

  it('triggers on non-resident taxable person', () => {
    const result = findCompulsoryRegistrationTrigger({
      isNonResidentTaxablePerson: true,
    });
    expect(result.required).toBe(true);
    if (result.required) expect(result.category).toBe('NON_RESIDENT_TAXABLE_PERSON');
  });

  it('triggers on supplier-as-agent', () => {
    const result = findCompulsoryRegistrationTrigger({ suppliesAsAgent: true });
    expect(result.required).toBe(true);
    if (result.required) expect(result.category).toBe('AGENT');
  });

  it('triggers on Input Service Distributor', () => {
    const result = findCompulsoryRegistrationTrigger({
      isInputServiceDistributor: true,
    });
    expect(result.required).toBe(true);
    if (result.required) expect(result.category).toBe('INPUT_SERVICE_DISTRIBUTOR');
  });

  it('triggers on e-commerce supplier (with notified exceptions)', () => {
    const result = findCompulsoryRegistrationTrigger({
      suppliesViaEcommerceOperator: true,
    });
    expect(result.required).toBe(true);
    if (result.required) expect(result.category).toBe('E_COMMERCE_SUPPLIER');
  });

  it('triggers on e-commerce operator', () => {
    const result = findCompulsoryRegistrationTrigger({
      isEcommerceOperator: true,
    });
    expect(result.required).toBe(true);
    if (result.required) expect(result.category).toBe('E_COMMERCE_OPERATOR');
  });

  it('triggers on OIDAR provider from outside India', () => {
    const result = findCompulsoryRegistrationTrigger({
      isOidarProviderFromOutsideIndia: true,
    });
    expect(result.required).toBe(true);
    if (result.required) expect(result.category).toBe('OIDAR_FROM_OUTSIDE_INDIA');
  });

  it('triggers on TCS collector under Section 52', () => {
    const result = findCompulsoryRegistrationTrigger({
      isTcsCollectorUnderS52: true,
    });
    expect(result.required).toBe(true);
    if (result.required) expect(result.category).toBe('TCS_COLLECTOR_S52');
  });

  it('every triggered finding cites Section 24', () => {
    const result = findCompulsoryRegistrationTrigger({
      hasInterStateOutwardSupply: true,
    });
    expect(result.required).toBe(true);
    if (result.required) {
      const sec24 = result.citations.find((c) => c.kind === 'section' && c.section === '24');
      expect(sec24).toBeDefined();
    }
  });
});

describe('findCompulsoryRegistrationTrigger -- exact category notes', () => {
  it('INTER_STATE_OUTWARD_SUPPLY note quotes Section 24(1) with notified-service-provider carve-out', () => {
    const result = findCompulsoryRegistrationTrigger({
      hasInterStateOutwardSupply: true,
    });
    expect(result.required).toBe(true);
    if (result.required) {
      expect(result.notes).toBe(
        'Section 24(1) -- mandatory registration for any inter-State outward supply (with notified service-provider carve-outs).',
      );
    }
  });

  it('CASUAL_TAXABLE_PERSON note quotes Section 24(2) with 90-day validity and advance-tax language', () => {
    const result = findCompulsoryRegistrationTrigger({
      isCasualTaxablePerson: true,
    });
    expect(result.required).toBe(true);
    if (result.required) {
      expect(result.notes).toBe(
        'Section 24(2) -- registration prior to commencement; valid for the period specified in registration application up to 90 days; advance tax based on estimated liability.',
      );
    }
  });

  it('REVERSE_CHARGE_PAYER note quotes Section 24(3)', () => {
    const result = findCompulsoryRegistrationTrigger({
      isReverseChargePayer: true,
    });
    expect(result.required).toBe(true);
    if (result.required) {
      expect(result.notes).toBe(
        'Section 24(3) -- registration mandatory for any person required to pay tax under reverse charge.',
      );
    }
  });

  it('TDS_DEDUCTOR_S51 note quotes Section 24(4) read with Section 51', () => {
    const result = findCompulsoryRegistrationTrigger({
      isTdsDeductorUnderS51: true,
    });
    expect(result.required).toBe(true);
    if (result.required) {
      expect(result.notes).toBe(
        'Section 24(4) read with Section 51 -- specified Government and PSU deductors.',
      );
    }
  });

  it('NON_RESIDENT_TAXABLE_PERSON note quotes Section 24(5)', () => {
    const result = findCompulsoryRegistrationTrigger({
      isNonResidentTaxablePerson: true,
    });
    expect(result.required).toBe(true);
    if (result.required) {
      expect(result.notes).toBe(
        'Section 24(5) -- non-resident taxable person prior to commencement.',
      );
    }
  });

  it('AGENT note quotes Section 24(7)', () => {
    const result = findCompulsoryRegistrationTrigger({ suppliesAsAgent: true });
    expect(result.required).toBe(true);
    if (result.required) {
      expect(result.notes).toBe(
        'Section 24(7) -- persons supplying on behalf of others as an agent.',
      );
    }
  });

  it('INPUT_SERVICE_DISTRIBUTOR note quotes Section 24(8)', () => {
    const result = findCompulsoryRegistrationTrigger({
      isInputServiceDistributor: true,
    });
    expect(result.required).toBe(true);
    if (result.required) {
      expect(result.notes).toBe('Section 24(8) -- Input Service Distributor.');
    }
  });

  it('E_COMMERCE_SUPPLIER note quotes Section 24(9) with Notification 65/2017-CT carve-out', () => {
    const result = findCompulsoryRegistrationTrigger({
      suppliesViaEcommerceOperator: true,
    });
    expect(result.required).toBe(true);
    if (result.required) {
      expect(result.notes).toBe(
        'Section 24(9) -- persons making supplies through electronic commerce operator (with notified exceptions per Notification 65/2017-CT).',
      );
    }
  });

  it('E_COMMERCE_OPERATOR note quotes Section 24(10)', () => {
    const result = findCompulsoryRegistrationTrigger({
      isEcommerceOperator: true,
    });
    expect(result.required).toBe(true);
    if (result.required) {
      expect(result.notes).toBe('Section 24(10) -- electronic commerce operator.');
    }
  });

  it('OIDAR_FROM_OUTSIDE_INDIA note quotes Section 24(11)', () => {
    const result = findCompulsoryRegistrationTrigger({
      isOidarProviderFromOutsideIndia: true,
    });
    expect(result.required).toBe(true);
    if (result.required) {
      expect(result.notes).toBe(
        'Section 24(11) -- OIDAR provider from outside India to non-taxable online recipient.',
      );
    }
  });

  it('TCS_COLLECTOR_S52 note quotes Section 24(13) read with Section 52', () => {
    const result = findCompulsoryRegistrationTrigger({
      isTcsCollectorUnderS52: true,
    });
    expect(result.required).toBe(true);
    if (result.required) {
      expect(result.notes).toBe(
        'Section 24(13) read with Section 52 -- TCS collector via electronic commerce operator.',
      );
    }
  });
});
