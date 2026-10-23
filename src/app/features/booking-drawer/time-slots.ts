import {
  formatKlDateTime,
  klStartOfDay,
  parseTimeOfDay,
  toKlIsoString,
} from '../../shared/utils/kl-time';

export interface TimeSlot {
  /** `Today, 3:30 PM` / `Tomorrow, 9:00 AM` */
  label: string;
  /** Value sent to the API, e.g. `2026-10-23T15:30:00+08:00` (Asia/Kuala_Lumpur). */
  value: string;
}

export interface TimeSlotOptions {
  /** Minutes between slots. Default 30. */
  stepMinutes?: number;
  /** How many days, starting today. Default 2 (today and tomorrow). */
  days?: number;
}

const MINUTES_PER_DAY = 24 * 60;

/**
 * Builds bookable start times between `availableFrom` and `availableTo` (KL time, `HH:mm[:ss]`)
 * for today and tomorrow, in `stepMinutes` steps, without times that are already past.
 *
 * - The end time is exclusive: a doctor available until 22:00 gets a last slot at 21:30.
 * - Overnight hours (e.g. 20:00 -> 02:00) are supported, like in the API.
 * - Slots are aligned to the start time (09:00, 09:30, ...).
 */
export function generateTimeSlots(
  availableFrom: string,
  availableTo: string,
  now: Date = new Date(),
  options: TimeSlotOptions = {},
): TimeSlot[] {
  const step = options.stepMinutes ?? 30;
  const days = options.days ?? 2;
  const from = parseTimeOfDay(availableFrom);
  const to = parseTimeOfDay(availableTo);

  if (from === null || to === null || from === to || step <= 0) {
    return [];
  }

  // Minutes after midnight that are inside the doctor's hours, in order.
  const minutesInDay: number[] = [];
  const length = to > from ? to - from : MINUTES_PER_DAY - from + to;
  for (let offset = 0; offset < length; offset += step) {
    minutesInDay.push((from + offset) % MINUTES_PER_DAY);
  }
  minutesInDay.sort((a, b) => a - b);

  const nowMs = now.getTime();
  const slots: TimeSlot[] = [];

  for (let day = 0; day < days; day++) {
    const dayStart = klStartOfDay(now, day);
    for (const minute of minutesInDay) {
      const start = new Date(dayStart + minute * 60_000);
      if (start.getTime() <= nowMs) {
        continue;
      }
      slots.push({
        label: formatKlDateTime(start, now, true),
        value: toKlIsoString(start),
      });
    }
  }

  return slots;
}
