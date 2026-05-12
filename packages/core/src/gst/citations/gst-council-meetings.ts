/* Canonical GstCouncilMeetingCitation registry. Council recommendations precede the implementing
 * notifications, and CA-side audit trails cite the meeting when a rule encodes a Council-driven regime
 * change (the implementing notification is cited alongside). The registry stays append-only -- existing
 * entries never mutate, so historical computations remain reproducible. */

import type { GstCouncilMeetingCitation } from '../../types/citation.js';

export const councilMeeting = (
  meetingNumber: number,
  date: string,
  note?: string,
): GstCouncilMeetingCitation => ({
  kind: 'gst-council-meeting',
  meetingNumber,
  date,
  ...(note !== undefined ? { note } : {}),
});

export const GST_COUNCIL_MEETINGS = {
  MEETING_56: councilMeeting(
    56,
    '2025-09-03',
    'GST 2.0 rate rationalisation -- two-rate structure (Merit 5 percent, Standard 18 percent) plus a 40 percent de-merit rate and Nil, effective 22 September 2025',
  ),
} as const;

export type GstCouncilMeetingKey = keyof typeof GST_COUNCIL_MEETINGS;
