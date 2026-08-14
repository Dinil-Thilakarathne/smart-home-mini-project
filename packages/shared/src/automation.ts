export interface LightSchedule {
  days: number[];
  startTime: string;
  endTime: string;
  timezone: string;
}

export function localTimeParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const weekday = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].indexOf(parts.find((part) => part.type === "weekday")?.value.toLowerCase() ?? "sun");
  return { weekday, time: `${parts.find((part) => part.type === "hour")?.value ?? "00"}:${parts.find((part) => part.type === "minute")?.value ?? "00"}` };
}

export function isScheduleActive(schedule: LightSchedule, date: Date) {
  const local = localTimeParts(date, schedule.timezone);
  return schedule.days.includes(local.weekday) && local.time >= schedule.startTime && local.time < schedule.endTime;
}

export function isSafetyCutoffDue(updatedAt: Date, maxMinutes: number, now: Date) {
  return now.getTime() - updatedAt.getTime() >= maxMinutes * 60_000;
}
