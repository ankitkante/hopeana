import type { Schedule, SentMessage } from "db";

/**
 * Time-of-day windows (in the schedule's local timezone).
 * The cron runs every 15 min. Batch size is calculated dynamically
 * based on due count and available slots in the window.
 *
 * Morning:    6 AM – 12 PM (6 hrs = 24 fifteen-min slots)
 * Afternoon: 12 PM –  5 PM (5 hrs = 20 fifteen-min slots)
 * Evening:    5 PM –  9 PM (4 hrs = 16 fifteen-min slots)
 */
const TIME_WINDOWS: Record<string, { startHour: number; endHour: number }> = {
  morning: { startHour: 6, endHour: 12 },
  afternoon: { startHour: 12, endHour: 17 },
  evening: { startHour: 17, endHour: 21 },
};

const WEEKDAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/**
 * Determines whether a schedule is due for sending right now.
 *
 * Pure function — all time inputs are explicit so this is easy to test.
 *
 * @param schedule  The schedule to check
 * @param lastSentMessage  The most recent SentMessage for this schedule (or null)
 * @param now  Current time as a Date (defaults to Date.now())
 * @returns true if the schedule should fire now
 */
export function isScheduleDue(
  schedule: Schedule,
  lastSentMessage: Pick<SentMessage, "sentAt"> | null,
  now: Date = new Date()
): boolean {
  const inWindow = isInTimeWindow(schedule.timeOfDay, schedule.timezone, now);
  const pastWindow = isPastTimeWindow(schedule.timeOfDay, schedule.timezone, now);

  // 1. Not yet in the time window today — definitely not due
  if (!inWindow && !pastWindow) {
    return false;
  }

  // 2. Check if already sent today (duplicate prevention)
  if (lastSentMessage && alreadySentToday(schedule.timeOfDay, schedule.timezone, lastSentMessage.sentAt, now)) {
    return false;
  }

  // 3. Check frequency-specific rules
  if (schedule.frequency === "specific_days") {
    return isDayOfWeekMatch(schedule.daysOfWeek, schedule.timezone, now);
  }

  if (schedule.frequency === "custom_interval") {
    return isIntervalElapsed(
      schedule.intervalValue,
      schedule.intervalUnit,
      lastSentMessage?.sentAt ?? null,
      now
    );
  }

  // "daily" or any other frequency — due if in window OR overflowing past it
  return true;
}

/** Check if the current local time falls within the schedule's time-of-day window. */
function isInTimeWindow(
  timeOfDay: string | null,
  timezone: string | null,
  now: Date
): boolean {
  const window = TIME_WINDOWS[timeOfDay || "morning"];
  if (!window) return false;

  const localHour = getLocalHour(now, timezone || "UTC");
  return localHour >= window.startHour && localHour < window.endHour;
}

/** Check if the current time is past (after) the time window today.
 *  Overflow naturally stops at midnight — after that, the schedule
 *  is neither in-window nor past-window for the new day. */
function isPastTimeWindow(
  timeOfDay: string | null,
  timezone: string | null,
  now: Date
): boolean {
  const window = TIME_WINDOWS[timeOfDay || "morning"];
  if (!window) return false;

  const localHour = getLocalHour(now, timezone || "UTC");
  return localHour >= window.endHour;
}

/** Check if a message was already sent today (at or after the window start). */
function alreadySentToday(
  timeOfDay: string | null,
  timezone: string | null,
  sentAt: Date,
  now: Date
): boolean {
  const window = TIME_WINDOWS[timeOfDay || "morning"];
  if (!window) return false;

  const tz = timezone || "UTC";

  const localDateStr = now.toLocaleDateString("en-CA", { timeZone: tz }); // YYYY-MM-DD
  const sentAtLocalHour = getLocalHour(sentAt, tz);
  const sentAtLocalDate = sentAt.toLocaleDateString("en-CA", { timeZone: tz });

  return sentAtLocalDate === localDateStr && sentAtLocalHour >= window.startHour;
}

/** Check if today's weekday (in the schedule's timezone) is in the daysOfWeek list. */
function isDayOfWeekMatch(
  daysOfWeek: string[],
  timezone: string | null,
  now: Date
): boolean {
  const tz = timezone || "UTC";
  const localWeekday = getLocalWeekday(now, tz);
  return daysOfWeek.includes(localWeekday);
}

/** Check if enough time has passed since the last send based on intervalValue + intervalUnit. */
function isIntervalElapsed(
  intervalValue: number | null,
  intervalUnit: string | null,
  lastSentAt: Date | null,
  now: Date
): boolean {
  // If never sent before, it's due
  if (!lastSentAt) return true;
  if (!intervalValue || !intervalUnit) return true;

  const elapsed = now.getTime() - lastSentAt.getTime();
  const msPerUnit: Record<string, number> = {
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
  };

  const unitMs = msPerUnit[intervalUnit];
  if (!unitMs) return true;

  return elapsed >= intervalValue * unitMs;
}

/** Get the hour (0-23) in a given timezone. */
function getLocalHour(date: Date, timezone: string): number {
  return parseInt(
    date.toLocaleString("en-US", { timeZone: timezone, hour: "numeric", hour12: false }),
    10
  );
}

/** Get the lowercase weekday name in a given timezone. */
function getLocalWeekday(date: Date, timezone: string): string {
  const dayIndex = new Date(
    date.toLocaleString("en-US", { timeZone: timezone })
  ).getDay();
  return WEEKDAY_NAMES[dayIndex];
}

/** Check if a schedule is currently within its preferred time window (not overflowing). */
export function isInPreferredWindow(schedule: Schedule, now: Date = new Date()): boolean {
  return isInTimeWindow(schedule.timeOfDay, schedule.timezone, now);
}

export { TIME_WINDOWS, WEEKDAY_NAMES };
