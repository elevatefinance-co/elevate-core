/* Tests for the GST Council meeting citation registry.
 * Council recommendations precede the implementing notifications; rules that encode a Council-driven
 * regime change cite the meeting alongside the notification. The registry is append-only.
 * Pinned: every entry is a gst-council-meeting kind with an ISO date,
 * the 56th meeting (GST 2.0 rate rationalisation, held 3 September 2025) is present,
 * and the councilMeeting factory omits the note key when no note is supplied.
 */

import {
  GST_COUNCIL_MEETINGS,
  councilMeeting,
} from '../../../src/gst/citations/gst-council-meetings.js';

describe('GST_COUNCIL_MEETINGS registry', () => {
  it('should expose every entry as a gst-council-meeting citation', () => {
    for (const entry of Object.values(GST_COUNCIL_MEETINGS)) {
      expect(entry.kind).toBe('gst-council-meeting');
    }
  });

  it('should expose the date of every entry in ISO YYYY-MM-DD format', () => {
    const isoDateShape = /^\d{4}-\d{2}-\d{2}$/;
    for (const [registryKey, entry] of Object.entries(GST_COUNCIL_MEETINGS)) {
      expect(isoDateShape.test(entry.date), `${registryKey} date not ISO`).toBe(true);
    }
  });

  it('should pin the 56th meeting (GST 2.0 rate rationalisation) held on 3 September 2025', () => {
    expect(GST_COUNCIL_MEETINGS.MEETING_56.meetingNumber).toBe(56);
    expect(GST_COUNCIL_MEETINGS.MEETING_56.date).toBe('2025-09-03');
    expect(GST_COUNCIL_MEETINGS.MEETING_56.note).toMatch(/GST 2\.0/);
    expect(GST_COUNCIL_MEETINGS.MEETING_56.note).toMatch(/22 September 2025/);
  });

  it('should match the exact registered shape for MEETING_56', () => {
    expect(GST_COUNCIL_MEETINGS.MEETING_56).toEqual({
      kind: 'gst-council-meeting',
      meetingNumber: 56,
      date: '2025-09-03',
      note: 'GST 2.0 rate rationalisation -- two-rate structure (Merit 5 percent, Standard 18 percent) plus a 40 percent de-merit rate and Nil, effective 22 September 2025',
    });
    expect(Object.keys(GST_COUNCIL_MEETINGS.MEETING_56).sort()).toEqual([
      'date',
      'kind',
      'meetingNumber',
      'note',
    ]);
  });

  it('should omit the note key when the councilMeeting factory is called with note undefined', () => {
    const result = councilMeeting(99, '2099-01-01', undefined);
    expect('note' in result).toBe(false);
    expect(Object.keys(result).sort()).toEqual(['date', 'kind', 'meetingNumber']);
  });

  it('should omit the note key when the councilMeeting factory is called with note omitted entirely', () => {
    const result = councilMeeting(98, '2099-01-02');
    expect('note' in result).toBe(false);
  });
});
