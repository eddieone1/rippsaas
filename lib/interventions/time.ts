import { addDays, addMinutes } from "date-fns";

const DEFAULT_TZ = process.env.DEFAULT_TIMEZONE ?? "Europe/London";

/**
 * Get current hour and minute in tenant timezone (0-23, 0-59).
 */
function getLocalTime(date: Date, timezone: string): { hours: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "0";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "0";
  return { hours: parseInt(hour, 10), minutes: parseInt(minute, 10) };
}

/**
 * Parse "HH:mm" string to hours and minutes.
 */
export function parseTimeHHmm(s: string): { hours: number; minutes: number } {
  const [h, m] = s.split(":").map(Number);
  return { hours: h ?? 0, minutes: m ?? 0 };
}

/**
 * Convert HH:mm in tenant TZ to minutes since midnight.
 */
function toMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes;
}

/**
 * Check if the given date (in tenant TZ) falls within quiet hours [start, end).
 * If start > end (e.g. 21:00–08:00), quiet hours span midnight.
 */
export function isInQuietHours(
  date: Date,
  quietHoursStart: string,
  quietHoursEnd: string,
  timezone: string = DEFAULT_TZ
): boolean {
  const { hours: nowH, minutes: nowM } = getLocalTime(date, timezone);
  const nowMin = toMinutes(nowH, nowM);
  const { hours: startH, minutes: startM } = parseTimeHHmm(quietHoursStart);
  const { hours: endH, minutes: endM } = parseTimeHHmm(quietHoursEnd);
  const startMin = toMinutes(startH, startM);
  const endMin = toMinutes(endH, endM);

  if (startMin < endMin) {
    return nowMin >= startMin && nowMin < endMin;
  }
  return nowMin >= startMin || nowMin < endMin;
}

/**
 * Get the next time when we're allowed to send (quiet hours ended in tenant TZ).
 * Adds minutes in UTC so the resulting time in tenant TZ is at or just after quietHoursEnd.
 */
export function nextAllowedSendTime(
  from: Date,
  quietHoursEnd: string,
  timezone: string = DEFAULT_TZ
): Date {
  const local = getLocalTime(from, timezone);
  const nowMin = toMinutes(local.hours, local.minutes);
  const { hours: endH, minutes: endM } = parseTimeHHmm(quietHoursEnd);
  const endMin = toMinutes(endH, endM);
  let minutesUntilEnd: number;
  if (nowMin < endMin) {
    minutesUntilEnd = endMin - nowMin;
  } else {
    minutesUntilEnd = 24 * 60 - nowMin + endMin;
  }
  return addMinutes(from, minutesUntilEnd);
}

export function getDefaultTimezone(): string {
  return DEFAULT_TZ;
}
