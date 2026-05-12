/* Tests for the CBIC notification registry.
 * The platform cites notifications by family + number + year + date when a rule encodes their effect.
 * The registry is append-only -- every notification stays here forever even after superseded so
 * historical computations remain reproducible.
 * Pinned: every entry is a notification kind with a CBIC family,
 * the headline notifications (1/2017-CT (Rate) for the principal rate schedule,
 * 14/2022-CT for Rule 88B net-cash interest, 7/2023-CT for the late-fee cap revision,
 * 12/2024-CT for IMS, 11/2023-CT (Rate) for online gaming) are present with the right family tags,
 * and every entry's date is in ISO YYYY-MM-DD shape. Citations:
 * foundational CBIC rate / procedural notifications referenced inline.
 */

import { CBIC_NOTIFICATIONS, ct, ctRate } from '../../../src/gst/citations/cbic-notifications.js';

describe('CBIC_NOTIFICATIONS registry', () => {
  it('should expose every entry as a notification citation', () => {
    for (const entry of Object.values(CBIC_NOTIFICATIONS)) {
      expect(entry.kind).toBe('notification');
    }
  });

  it('should tag every entry with a CBIC_-prefixed family', () => {
    for (const [registryKey, entry] of Object.entries(CBIC_NOTIFICATIONS)) {
      expect(entry.family, `${registryKey} missing family`).toBeDefined();
      expect(entry.family?.startsWith('CBIC_'), `${registryKey} family not CBIC_`).toBe(true);
    }
  });

  it('should expose the date of every entry in ISO YYYY-MM-DD format', () => {
    const isoDateShape = /^\d{4}-\d{2}-\d{2}$/;
    for (const [registryKey, entry] of Object.entries(CBIC_NOTIFICATIONS)) {
      expect(isoDateShape.test(entry.date), `${registryKey} date not ISO`).toBe(true);
    }
  });

  it('should pin Notification 1/2017-CT (Rate) for the principal CGST rate schedule', () => {
    expect(CBIC_NOTIFICATIONS.N_1_2017_CT_RATE.number).toBe('1/2017');
    expect(CBIC_NOTIFICATIONS.N_1_2017_CT_RATE.family).toBe('CBIC_CT_RATE');
    expect(CBIC_NOTIFICATIONS.N_1_2017_CT_RATE.date).toBe('2017-06-28');
  });

  it('should pin Notification 14/2022-CT (Rule 88B net-cash interest)', () => {
    expect(CBIC_NOTIFICATIONS.N_14_2022_CT.number).toBe('14/2022');
    expect(CBIC_NOTIFICATIONS.N_14_2022_CT.family).toBe('CBIC_CT');
    expect(CBIC_NOTIFICATIONS.N_14_2022_CT.note).toMatch(/Rule 88B/);
  });

  it('should pin Notification 7/2023-CT (late-fee cap revision per turnover band)', () => {
    expect(CBIC_NOTIFICATIONS.N_7_2023_CT.number).toBe('7/2023');
    expect(CBIC_NOTIFICATIONS.N_7_2023_CT.family).toBe('CBIC_CT');
  });

  it('should pin Notification 12/2024-CT (IMS + GSTR-1A introduction)', () => {
    expect(CBIC_NOTIFICATIONS.N_12_2024_CT.number).toBe('12/2024');
    expect(CBIC_NOTIFICATIONS.N_12_2024_CT.date).toBe('2024-07-10');
    expect(CBIC_NOTIFICATIONS.N_12_2024_CT.family).toBe('CBIC_CT');
  });

  it('should pin Notification 11/2023-CT (Rate) for online gaming under the 28 percent slab', () => {
    expect(CBIC_NOTIFICATIONS.N_11_2023_CT_RATE.number).toBe('11/2023');
    expect(CBIC_NOTIFICATIONS.N_11_2023_CT_RATE.family).toBe('CBIC_CT_RATE');
  });

  it('should pin Notification 38/2021-CT (Aadhaar registration mandate)', () => {
    expect(CBIC_NOTIFICATIONS.N_38_2021_CT.number).toBe('38/2021');
  });

  it('should pin Notification 10/2023-CT (e-invoice threshold lowered to Rs 5 cr)', () => {
    expect(CBIC_NOTIFICATIONS.N_10_2023_CT.number).toBe('10/2023');
    expect(CBIC_NOTIFICATIONS.N_10_2023_CT.note).toMatch(/Rs 5 crore|e-invoice/i);
  });

  it('should pin Notification 9/2022-CT (Section 50(3) substitution, retrospective 18 percent rate)', () => {
    expect(CBIC_NOTIFICATIONS.N_9_2022_CT.number).toBe('9/2022');
    expect(CBIC_NOTIFICATIONS.N_9_2022_CT.date).toBe('2022-07-05');
    expect(CBIC_NOTIFICATIONS.N_9_2022_CT.family).toBe('CBIC_CT');
    expect(CBIC_NOTIFICATIONS.N_9_2022_CT.note).toMatch(/retrospectively from 1 July 2017/);
    expect(CBIC_NOTIFICATIONS.N_9_2022_CT.note).toMatch(/18 percent/);
  });

  it('should pin Notification 17/2024-CT (1 November 2024 appointed date for Finance (No. 2) Act 2024)', () => {
    expect(CBIC_NOTIFICATIONS.N_17_2024_CT.number).toBe('17/2024');
    expect(CBIC_NOTIFICATIONS.N_17_2024_CT.date).toBe('2024-09-27');
    expect(CBIC_NOTIFICATIONS.N_17_2024_CT.family).toBe('CBIC_CT');
    expect(CBIC_NOTIFICATIONS.N_17_2024_CT.note).toMatch(/Section 17\(5\)\(i\)/);
  });

  it('should pin Notification 9/2025-CT (Rate) (GST 2.0 rationalised rate schedule)', () => {
    expect(CBIC_NOTIFICATIONS.N_9_2025_CT_RATE.number).toBe('9/2025');
    expect(CBIC_NOTIFICATIONS.N_9_2025_CT_RATE.date).toBe('2025-09-17');
    expect(CBIC_NOTIFICATIONS.N_9_2025_CT_RATE.family).toBe('CBIC_CT_RATE');
    expect(CBIC_NOTIFICATIONS.N_9_2025_CT_RATE.note).toMatch(/56th Council/);
    expect(CBIC_NOTIFICATIONS.N_9_2025_CT_RATE.note).toMatch(/22 September 2025/);
  });

  it('should pin the QRMP scheme triplet (75/2020 + 76/2020 + 82/2020 + 85/2020)', () => {
    expect(CBIC_NOTIFICATIONS.N_75_2020_CT.number).toBe('75/2020');
    expect(CBIC_NOTIFICATIONS.N_76_2020_CT.number).toBe('76/2020');
    expect(CBIC_NOTIFICATIONS.N_82_2020_CT.number).toBe('82/2020');
    expect(CBIC_NOTIFICATIONS.N_85_2020_CT.number).toBe('85/2020');
  });

  it('should include the note key with the registered value on every entry', () => {
    for (const [registryKey, entry] of Object.entries(CBIC_NOTIFICATIONS)) {
      expect('note' in entry, `${registryKey} missing note`).toBe(true);
      expect(entry.note?.length, `${registryKey} note empty`).toBeGreaterThan(0);
    }
  });

  it('should pin the exact note text on every CT_RATE entry (kills ctRate factory mutations)', () => {
    expect(CBIC_NOTIFICATIONS.N_1_2017_CT_RATE.note).toBe(
      'Principal CGST rate schedule -- five slabs across Schedules I-VI',
    );
    expect(CBIC_NOTIFICATIONS.N_4_2017_CT_RATE.note).toBe('RCM goods list under Section 9(3)');
    expect(CBIC_NOTIFICATIONS.N_13_2017_CT_RATE.note).toBe(
      'RCM services list under Section 9(3) -- GTA, advocate, director, OIDAR etc.',
    );
    expect(CBIC_NOTIFICATIONS.N_8_2017_CT_RATE.note).toBe(
      'Suspends Section 9(4) RCM for unregistered to registered supplies',
    );
    expect(CBIC_NOTIFICATIONS.N_11_2023_CT_RATE.note).toBe(
      '28 percent on full face value of bets in online gaming, casinos, horse races -- effective 1 October 2023',
    );
  });

  it('should match the exact registered shape for N_14_2022_CT (ct factory + note set)', () => {
    expect(CBIC_NOTIFICATIONS.N_14_2022_CT).toEqual({
      kind: 'notification',
      number: '14/2022',
      date: '2022-07-05',
      family: 'CBIC_CT',
      note: 'Rule 88B inserted -- Section 50 interest computed on net cash basis effective 1 July 2022',
    });
    expect(Object.keys(CBIC_NOTIFICATIONS.N_14_2022_CT).sort()).toEqual([
      'date',
      'family',
      'kind',
      'note',
      'number',
    ]);
  });

  it('should omit the note key when the ct factory is called with note undefined', () => {
    const result = ct('999/9999', '2099-01-01', undefined);
    expect('note' in result).toBe(false);
    expect(Object.keys(result).sort()).toEqual(['date', 'family', 'kind', 'number']);
  });

  it('should omit the note key when the ct factory is called with note omitted entirely', () => {
    const result = ct('998/9999', '2099-01-02');
    expect('note' in result).toBe(false);
  });

  it('should omit the note key when the ctRate factory is called with note undefined', () => {
    const result = ctRate('997/9999', '2099-01-03', undefined);
    expect('note' in result).toBe(false);
    expect(Object.keys(result).sort()).toEqual(['date', 'family', 'kind', 'number']);
  });

  it('should omit the note key when the ctRate factory is called with note omitted entirely', () => {
    const result = ctRate('996/9999', '2099-01-04');
    expect('note' in result).toBe(false);
  });

  it('should match the exact registered shape for N_1_2017_CT_RATE (ctRate factory + note set)', () => {
    expect(CBIC_NOTIFICATIONS.N_1_2017_CT_RATE).toEqual({
      kind: 'notification',
      number: '1/2017',
      date: '2017-06-28',
      family: 'CBIC_CT_RATE',
      note: 'Principal CGST rate schedule -- five slabs across Schedules I-VI',
    });
    expect(Object.keys(CBIC_NOTIFICATIONS.N_1_2017_CT_RATE).sort()).toEqual([
      'date',
      'family',
      'kind',
      'note',
      'number',
    ]);
  });
});
