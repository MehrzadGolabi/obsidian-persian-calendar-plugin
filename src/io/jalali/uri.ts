import type { JalaliPeriod } from "src/jalali/dates";
import { parseJalaliFormat } from "src/jalali/parse";

const TYPES: Record<string, JalaliPeriod> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  quarterly: "quarter",
  yearly: "year",
};

/**
 * Read the parameters of `obsidian://persian-calendar?type=…&date=…`.
 * `type` defaults to daily; `date` is a Jalali `jYYYY-jMM-jDD` and defaults to
 * today. Any date inside a period selects that period's note.
 */
export function parseCalendarUri(
  params: Record<string, string>,
  today: Date
): { period: JalaliPeriod; date: Date } | { error: string } {
  const type = params.type ?? "daily";
  const period = Object.prototype.hasOwnProperty.call(TYPES, type)
    ? TYPES[type]
    : undefined;
  if (!period) {
    return {
      error: `Unknown note type '${type}'. Use ${Object.keys(TYPES).join(", ")}.`,
    };
  }
  if (params.date === undefined) {
    return { period, date: today };
  }
  const date = parseJalaliFormat(params.date, "jYYYY-jMM-jDD");
  if (!date) {
    return {
      error: `Invalid date '${params.date}'. Use a Jalali date like 1405-08-20.`,
    };
  }
  return { period, date };
}
