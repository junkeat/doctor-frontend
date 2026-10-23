/**
 * Date/time helpers for Asia/Kuala_Lumpur.
 *
 * Malaysia uses UTC+08:00 all year (no daylight saving), so a fixed offset is exact
 * and gives the same result on every device, whatever its own time zone is.
 */
export const KL_UTC_OFFSET_MINUTES = 8 * 60;
const KL_OFFSET_MS = KL_UTC_OFFSET_MINUTES * 60_000;
const DAY_MS = 24 * 60 * 60_000;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface KlParts {
  year: number;
  /** 1-12 */
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/** Wall-clock parts of `date` in Kuala Lumpur. */
export function toKlParts(date: Date): KlParts {
  const shifted = new Date(date.getTime() + KL_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

/** Epoch ms of midnight (00:00) in Kuala Lumpur on the KL day of `date`, plus `dayOffset` days. */
export function klStartOfDay(date: Date, dayOffset = 0): number {
  const { year, month, day } = toKlParts(date);
  return Date.UTC(year, month - 1, day) - KL_OFFSET_MS + dayOffset * DAY_MS;
}

/** `3:30 PM` */
export function formatKlTime(date: Date): string {
  const { hour, minute } = toKlParts(date);
  const suffix = hour < 12 ? 'AM' : 'PM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${pad(minute)} ${suffix}`;
}

/** `08 Sep 2026` */
export function formatKlDate(date: Date): string {
  const { year, month, day } = toKlParts(date);
  return `${pad(day)} ${MONTHS[month - 1]} ${year}`;
}

/**
 * `Today, 3:30 PM` when `date` is today in KL, `Tomorrow, 9:00 AM` when tomorrow
 * (only if `withTomorrow`), otherwise `08 Sep 2026, 10:00 AM`.
 */
export function formatKlDateTime(date: Date, now: Date = new Date(), withTomorrow = false): string {
  const dayStart = klStartOfDay(date);
  const today = klStartOfDay(now);
  if (dayStart === today) {
    return `Today, ${formatKlTime(date)}`;
  }
  if (withTomorrow && dayStart === today + DAY_MS) {
    return `Tomorrow, ${formatKlTime(date)}`;
  }
  return `${formatKlDate(date)}, ${formatKlTime(date)}`;
}

/** ISO 8601 with the KL offset, e.g. `2026-10-23T15:30:00+08:00` (format sent to the API). */
export function toKlIsoString(date: Date): string {
  const { year, month, day, hour, minute } = toKlParts(date);
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+08:00`;
}

/** Parses an API time-of-day (`HH:mm` or `HH:mm:ss`) into minutes after midnight. */
export function parseTimeOfDay(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value?.trim() ?? '');
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 24 || minutes > 59 || (hours === 24 && minutes > 0)) {
    return null;
  }
  return hours * 60 + minutes;
}

/** `09:00:00` -> `9:00 AM` */
export function formatTimeOfDay(value: string): string {
  const minutes = parseTimeOfDay(value);
  if (minutes === null) {
    return value;
  }
  const hour = Math.floor(minutes / 60) % 24;
  const suffix = hour < 12 ? 'AM' : 'PM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${pad(minutes % 60)} ${suffix}`;
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}
