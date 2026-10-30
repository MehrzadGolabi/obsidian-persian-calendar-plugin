import {
  formatJalali,
  JALALI_MONTHS,
  JALALI_WEEKDAYS,
  JalaliPeriod,
  quarterOf,
  shiftJalali,
  startOfJalaliPeriod,
  toJalali,
} from "./dates";
import { toHijriString } from "./lunar";

export interface IPlaceholderContext {
  period: JalaliPeriod;
  /** The note's date: the start of its period. */
  date: Date;
  today: Date;
}

const MONTHS_EN = [
  "Farvardin",
  "Ordibehesht",
  "Khordad",
  "Tir",
  "Mordad",
  "Shahrivar",
  "Mehr",
  "Aban",
  "Azar",
  "Dey",
  "Bahman",
  "Esfand",
];
const SEASONS = [
  ["بهار", "Spring"],
  ["تابستان", "Summer"],
  ["پاییز", "Autumn"],
  ["زمستان", "Winter"],
];
// Saturday-first, like JALALI_WEEKDAYS.
const WEEKDAYS_EN = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");

const gregorian = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, days: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, 12);
const daysBetween = (a: Date, b: Date) =>
  Math.round((b.getTime() - a.getTime()) / DAY_MS);

const endOf = (d: Date, period: JalaliPeriod) =>
  addDays(shiftJalali(startOfJalaliPeriod(d, period), period, 1), -1);

const weekday = (d: Date) => {
  const i = (d.getDay() + 1) % 7;
  return `${JALALI_WEEKDAYS[i]} (${WEEKDAYS_EN[i]})`;
};
const monthName = (d: Date) => {
  const { month } = toJalali(d);
  return `${JALALI_MONTHS[month - 1]} (${MONTHS_EN[month - 1]})`;
};
const seasonName = (d: Date) => {
  const [fa, en] = SEASONS[quarterOf(toJalali(d).month) - 1];
  return `${fa} (${en})`;
};
const weekId = (d: Date) => formatJalali(d, "jgggg-[W]jww");
const monthId = (d: Date) => formatJalali(d, "jYYYY-jMM");
const seasonId = (d: Date) => formatJalali(d, "jYYYY-[S]jQ");
const jalaliDate = (d: Date) => formatJalali(d, "jYYYY-jMM-jDD");
const day = (d: Date) => String(toJalali(d).day);

type Periods = JalaliPeriod[] | "all";
type Resolver = (ctx: IPlaceholderContext) => string;

const DAILY: Periods = ["day"];
const WEEK: Periods = ["day", "week"];
const MONTH: Periods = ["day", "month"];
const SEASON: Periods = ["day", "month", "quarter"];
const YEAR: Periods = ["day", "week", "month", "quarter", "year"];

/** The date the year group reads from: a week belongs to its Friday's year. */
const yearDate = ({ period, date }: IPlaceholderContext) =>
  period === "week" ? addDays(date, 6) : date;

/** Elapsed/remaining days count from a daily note's date, else from today. */
const base = ({ period, date, today }: IPlaceholderContext) =>
  period === "day" ? date : today;
const passed = (unit: JalaliPeriod): Resolver => (ctx) =>
  String(daysBetween(startOfJalaliPeriod(base(ctx), unit), base(ctx)));
const remaining = (unit: JalaliPeriod): Resolver => (ctx) =>
  String(daysBetween(base(ctx), endOf(base(ctx), unit)));

const PLACEHOLDERS: [string, Periods, Resolver][] = [
  ["تاریخ شمسی یادداشت", DAILY, (c) => jalaliDate(c.date)],
  ["تاریخ میلادی یادداشت", DAILY, (c) => gregorian(c.date)],
  ["تاریخ قمری یادداشت", DAILY, (c) => toHijriString(c.date)],
  ["روز هفته یادداشت", DAILY, (c) => weekday(c.date)],
  ["روز ماه یادداشت", DAILY, (c) => day(c.date)],

  ["هفته یادداشت", WEEK, (c) => weekId(c.date)],
  ["اول هفته", WEEK, (c) => gregorian(startOfJalaliPeriod(c.date, "week"))],
  ["آخر هفته", WEEK, (c) => gregorian(endOf(c.date, "week"))],

  ["ماه یادداشت", MONTH, (c) => monthId(c.date)],
  ["نام ماه یادداشت", MONTH, (c) => monthName(c.date)],
  ["اول ماه", MONTH, (c) => gregorian(startOfJalaliPeriod(c.date, "month"))],
  ["آخر ماه", MONTH, (c) => gregorian(endOf(c.date, "month"))],

  ["فصل یادداشت", SEASON, (c) => seasonId(c.date)],
  ["نام فصل یادداشت", SEASON, (c) => seasonName(c.date)],
  ["اول فصل", SEASON, (c) => gregorian(startOfJalaliPeriod(c.date, "quarter"))],
  ["آخر فصل", SEASON, (c) => gregorian(endOf(c.date, "quarter"))],

  ["سال یادداشت", YEAR, (c) => formatJalali(yearDate(c), "jYYYY")],
  [
    "اول سال",
    YEAR,
    (c) => gregorian(startOfJalaliPeriod(yearDate(c), "year")),
  ],
  ["آخر سال", YEAR, (c) => gregorian(endOf(yearDate(c), "year"))],

  ["تاریخ شمسی جاری", "all", (c) => jalaliDate(c.today)],
  ["تاریخ میلادی جاری", "all", (c) => gregorian(c.today)],
  ["تاریخ قمری جاری", "all", (c) => toHijriString(c.today)],
  ["روز هفته جاری", "all", (c) => weekday(c.today)],
  ["روز ماه جاری", "all", (c) => day(c.today)],
  ["هفته جاری", "all", (c) => weekId(c.today)],
  ["نام ماه جاری", "all", (c) => monthName(c.today)],
  ["ماه جاری", "all", (c) => monthId(c.today)],
  ["نام فصل جاری", "all", (c) => seasonName(c.today)],
  ["فصل جاری", "all", (c) => seasonId(c.today)],
  ["سال جاری", "all", (c) => formatJalali(c.today, "jYYYY")],

  ["روزهای گذشته سال", "all", passed("year")],
  ["روزهای باقیمانده سال", "all", remaining("year")],
  ["روزهای گذشته فصل", "all", passed("quarter")],
  ["روزهای باقیمانده فصل", "all", remaining("quarter")],
  ["روزهای گذشته ماه", "all", passed("month")],
  ["روزهای باقیمانده ماه", "all", remaining("month")],
];

/** Every Persian placeholder name, without braces, for suggestions. */
export const PLACEHOLDER_NAMES: string[] = PLACEHOLDERS.map(([name]) => name);

const BY_NAME = new Map(PLACEHOLDERS.map((p) => [p[0], p]));

/**
 * Replace the Persian placeholders valid for the note's type. Unknown ones,
 * and ones that don't work in this note type, are left as written.
 */
export function applyPersianPlaceholders(
  contents: string,
  ctx: IPlaceholderContext
): string {
  return contents.replace(/{{\s*([^{}]+?)\s*}}/g, (match, name: string) => {
    const entry = BY_NAME.get(name);
    if (!entry) {
      return match;
    }
    const [, periods, resolve] = entry;
    return periods === "all" || periods.includes(ctx.period)
      ? resolve(ctx)
      : match;
  });
}
