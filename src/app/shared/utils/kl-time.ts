/**
 * Date/time helpers for Asia/Kuala_Lumpur.
 *
 * Malaysia uses UTC+08:00 all year (no daylight saving).
 */
const KL_TIME_ZONE = 'Asia/Kuala_Lumpur';

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: KL_TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const timeFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: KL_TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/** `3:30 PM` */
export function formatKlTime(date: Date): string {
  return timeFmt.format(date);
}

/** `08 Sep 2026` */
export function formatKlDate(date: Date): string {
  return dateFmt.format(date);
}

/** `Today, 3:30 PM` when `date` is today in KL, otherwise `08 Sep 2026, 10:00 AM`. */
export function formatKlDateTime(date: Date, now: Date = new Date()): string {
  const formattedDate = formatKlDate(date);
  return formattedDate === formatKlDate(now)
    ? `Today, ${formatKlTime(date)}`
    : `${formattedDate}, ${formatKlTime(date)}`;
}

/**
 * ISO 8601 with the KL offset, e.g. `2026-10-23T15:30:00+08:00` (format sent to the API).
 * Reads the wall-clock fields picked by the user in `<p-datepicker>`.
 */
export function toKlIsoString(date: Date): string {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hour}:${minute}:00+08:00`;
}

/** `09:00:00` -> `9:00 AM` */
export function formatTimeOfDay(value: string): string {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value?.trim() ?? '');
  if (!match) {
    return value;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 24 || minutes > 59 || (hours === 24 && minutes > 0)) {
    return value;
  }
  const hour = hours % 24;
  const suffix = hour < 12 ? 'AM' : 'PM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${pad(minutes)} ${suffix}`;
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}
