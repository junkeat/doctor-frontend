import { generateTimeSlots } from './time-slots';

// 2026-10-23 is a Friday. Times below are Kuala Lumpur (+08:00).
const at = (iso: string) => new Date(iso);

describe('generateTimeSlots', () => {
  it('builds 30-minute slots for today and tomorrow, excluding the end time', () => {
    const now = at('2026-10-23T08:00:00+08:00');
    const slots = generateTimeSlots('09:00:00', '22:00:00', now);

    // 09:00 .. 21:30 = 26 slots per day
    expect(slots.length).toBe(52);
    expect(slots[0]).toEqual({ label: 'Today, 9:00 AM', value: '2026-10-23T09:00:00+08:00' });
    expect(slots[25].value).toBe('2026-10-23T21:30:00+08:00');
    expect(slots[26]).toEqual({ label: 'Tomorrow, 9:00 AM', value: '2026-10-24T09:00:00+08:00' });
    expect(slots[51].label).toBe('Tomorrow, 9:30 PM');
  });

  it('removes times in the past', () => {
    const now = at('2026-10-23T15:10:00+08:00');
    const slots = generateTimeSlots('09:00:00', '22:00:00', now);

    expect(slots[0]).toEqual({ label: 'Today, 3:30 PM', value: '2026-10-23T15:30:00+08:00' });
    expect(slots.every((s) => new Date(s.value).getTime() > now.getTime())).toBe(true);
  });

  it('does not offer the current exact minute', () => {
    const now = at('2026-10-23T15:30:00+08:00');
    expect(generateTimeSlots('09:00', '22:00', now)[0].label).toBe('Today, 4:00 PM');
  });

  it('only shows tomorrow when today has no slots left', () => {
    const now = at('2026-10-23T22:30:00+08:00');
    const slots = generateTimeSlots('09:00:00', '22:00:00', now);

    expect(slots.length).toBe(26);
    expect(slots[0].label).toBe('Tomorrow, 9:00 AM');
  });

  it('uses Kuala Lumpur dates even when the device is in another zone (UTC late evening)', () => {
    // 2026-10-23T17:00Z is 2026-10-24 01:00 in KL, so "today" is the 24th.
    const now = at('2026-10-23T17:00:00Z');
    const slots = generateTimeSlots('09:00', '10:00', now);

    expect(slots.map((s) => s.label)).toEqual([
      'Today, 9:00 AM',
      'Today, 9:30 AM',
      'Tomorrow, 9:00 AM',
      'Tomorrow, 9:30 AM',
    ]);
    expect(slots[0].value).toBe('2026-10-24T09:00:00+08:00');
  });

  it('supports other step sizes and hours that are not on the hour', () => {
    const now = at('2026-10-23T00:00:00+08:00');
    const slots = generateTimeSlots('09:15', '10:15', now, { stepMinutes: 15, days: 1 });
    expect(slots.map((s) => s.label)).toEqual([
      'Today, 9:15 AM',
      'Today, 9:30 AM',
      'Today, 9:45 AM',
      'Today, 10:00 AM',
    ]);
  });

  it('supports overnight hours', () => {
    const now = at('2026-10-23T00:00:00+08:00');
    const slots = generateTimeSlots('22:00', '01:00', now, { days: 1 });
    expect(slots.map((s) => s.label)).toEqual([
      'Today, 12:30 AM', // 12:00 AM is "now", so it is not offered
      'Today, 10:00 PM',
      'Today, 10:30 PM',
      'Today, 11:00 PM',
      'Today, 11:30 PM',
    ]);
  });

  it('returns no slots for invalid or empty hours', () => {
    const now = at('2026-10-23T08:00:00+08:00');
    expect(generateTimeSlots('abc', '22:00', now)).toEqual([]);
    expect(generateTimeSlots('09:00', '09:00', now)).toEqual([]);
  });
});
