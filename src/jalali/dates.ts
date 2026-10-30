import {
  isValidJalaaliDate,
  jalaaliMonthLength,
  toGregorian,
  toJalaali,
} from "jalaali-js";

export interface IJalaliDate {
  year: number;
  month: number; // 1-12
  day: number;
}

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

// Saturday-first, matching the Jalali week.
export const JALALI_WEEKDAYS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];

const DAY_MS = 24 * 60 * 60 * 1000;

export function toJalali(date: Date): IJalaliDate {
  const { jy, jm, jd } = toJalaali(date);
  return { year: jy, month: jm, day: jd };
}

/** Dates are built at local noon so DST shifts never move them across a day. */
export function fromJalali(year: number, month: number, day: number): Date {
  const { gy, gm, gd } = toGregorian(year, month, day);
  return new Date(gy, gm - 1, gd, 12);
}

export function daysInMonth(year: number, month: number): number {
  return jalaaliMonthLength(year, month);
}

export function isValidJalali(
  year: number,
  month: number,
  day: number
): boolean {
  return isValidJalaaliDate(year, month, day);
}

export function quarterOf(month: number): number {
  return Math.ceil(month / 3);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / DAY_MS);
}

/** The Saturday on or before `date`. */
export function startOfJalaliWeek(date: Date): Date {
  const offset = (date.getDay() + 1) % 7; // Saturday -> 0
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - offset,
    12
  );
}

/**
 * Week 1 is the week (Saturday-Friday) that contains 1 Farvardin. A week is
 * assigned to the Jalali year of its Friday, so a week straddling the new year
 * is always week 1 of the new year.
 */
export function getJalaliWeek(date: Date): { year: number; week: number } {
  const saturday = startOfJalaliWeek(date);
  const friday = new Date(
    saturday.getFullYear(),
    saturday.getMonth(),
    saturday.getDate() + 6,
    12
  );
  const { year } = toJalali(friday);
  const firstWeekStart = startOfJalaliWeek(fromJalali(year, 1, 1));
  return { year, week: daysBetween(saturday, firstWeekStart) / 7 + 1 };
}

export type JalaliPeriod = "day" | "week" | "month" | "quarter" | "year";

export function startOfJalaliPeriod(date: Date, period: JalaliPeriod): Date {
  const { year, month } = toJalali(date);
  switch (period) {
    case "day":
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
    case "week":
      return startOfJalaliWeek(date);
    case "month":
      return fromJalali(year, month, 1);
    case "quarter":
      return fromJalali(year, (quarterOf(month) - 1) * 3 + 1, 1);
    case "year":
      return fromJalali(year, 1, 1);
  }
}

const pad = (n: number, len = 2) => String(n).padStart(len, "0");

/**
 * Format a date using Jalali tokens: jYYYY jYY jMMMM jMM jM jDD jD jQ jww jw
 * jgggg (week-year). Text in [brackets] is output literally; anything else
 * passes through unchanged.
 */
export function formatJalali(date: Date, format: string): string {
  const { year, month, day } = toJalali(date);
  const { year: weekYear, week } = getJalaliWeek(date);

  const tokens: Record<string, string> = {
    jYYYY: String(year),
    jYY: pad(year % 100),
    jMMMM: JALALI_MONTHS[month - 1],
    jMM: pad(month),
    jM: String(month),
    jDD: pad(day),
    jD: String(day),
    jQ: String(quarterOf(month)),
    jgggg: String(weekYear),
    jww: pad(week),
    jw: String(week),
  };

  return format.replace(
    /\[([^\]]*)\]|jYYYY|jYY|jMMMM|jMM|jM|jDD|jD|jQ|jgggg|jww|jw/g,
    (match, literal) => (literal !== undefined ? literal : tokens[match])
  );
}

export function toPersianDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

/**
 * Move `date` by `amount` periods. For month, quarter and year the Jalali day
 * is clamped to the length of the target month.
 */
export function shiftJalali(
  date: Date,
  period: JalaliPeriod,
  amount: number
): Date {
  if (period === "day" || period === "week") {
    const days = period === "day" ? amount : amount * 7;
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + days,
      12
    );
  }
  const months = { month: 1, quarter: 3, year: 12 }[period] * amount;
  const { year, month, day } = toJalali(date);
  const index = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(index / 12);
  const targetMonth = (index % 12) + 1;
  return fromJalali(
    targetYear,
    targetMonth,
    Math.min(day, daysInMonth(targetYear, targetMonth))
  );
}
