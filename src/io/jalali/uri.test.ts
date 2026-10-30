import { toJalali } from "src/jalali/dates";

import { parseCalendarUri } from "./uri";

const today = new Date(2026, 9, 30, 12); // 8 Aban 1405

test("type and date select the period and day", () => {
  const result = parseCalendarUri({ type: "weekly", date: "1404-11-30" }, today);
  if ("error" in result) {
    throw new Error(result.error);
  }
  expect(result.period).toBe("week");
  const { year, month, day } = toJalali(result.date);
  expect([year, month, day]).toEqual([1404, 11, 30]);
});

test("every note type is accepted", () => {
  const periods = ["daily", "weekly", "monthly", "quarterly", "yearly"].map(
    (type) => {
      const result = parseCalendarUri({ type }, today);
      return "error" in result ? result.error : result.period;
    }
  );
  expect(periods).toEqual(["day", "week", "month", "quarter", "year"]);
});

test("type defaults to daily and date to today", () => {
  expect(parseCalendarUri({}, today)).toEqual({ period: "day", date: today });
});

test("an unknown type is an error", () => {
  expect(parseCalendarUri({ type: "hourly" }, today)).toHaveProperty("error");
});

test("an impossible or malformed date is an error", () => {
  expect(parseCalendarUri({ date: "1405-13-40" }, today)).toHaveProperty(
    "error"
  );
  expect(parseCalendarUri({ date: "tomorrow" }, today)).toHaveProperty("error");
});
