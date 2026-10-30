import { fromJalali, startOfJalaliWeek } from "./dates";
import {
  applyPersianPlaceholders,
  IPlaceholderContext,
  PLACEHOLDER_NAMES,
} from "./placeholders";

const noteDate = new Date(2026, 9, 30, 12); // 8 Aban 1405, a Friday
const today = new Date(2026, 1, 15, 12); // 26 Bahman 1404, a Sunday

const daily: IPlaceholderContext = { period: "day", date: noteDate, today };
const apply = (name: string, ctx: IPlaceholderContext = daily) =>
  applyPersianPlaceholders(`{{${name}}}`, ctx);

test("there are 36 placeholder names", () => {
  expect(PLACEHOLDER_NAMES).toHaveLength(36);
});

test("every placeholder is replaced in a daily note", () => {
  PLACEHOLDER_NAMES.forEach((name) => {
    expect(apply(name)).not.toBe(`{{${name}}}`);
  });
});

describe("daily note placeholders", () => {
  test.each([
    ["تاریخ شمسی یادداشت", "1405-08-08"],
    ["تاریخ میلادی یادداشت", "2026-10-30"],
    ["روز هفته یادداشت", "جمعه (Friday)"],
    ["روز ماه یادداشت", "8"],
    ["هفته یادداشت", "1405-W32"],
    ["اول هفته", "2026-10-24"],
    ["آخر هفته", "2026-10-30"],
    ["ماه یادداشت", "1405-08"],
    ["نام ماه یادداشت", "آبان (Aban)"],
    ["اول ماه", "2026-10-23"],
    ["آخر ماه", "2026-11-21"],
    ["فصل یادداشت", "1405-S3"],
    ["نام فصل یادداشت", "پاییز (Autumn)"],
    ["اول فصل", "2026-09-23"],
    ["آخر فصل", "2026-12-21"],
    ["سال یادداشت", "1405"],
    ["اول سال", "2026-03-21"],
    ["آخر سال", "2027-03-20"],
  ])("%s", (name, expected) => {
    expect(apply(name)).toBe(expected);
  });

  test("lunar date follows the note", () => {
    expect(apply("تاریخ قمری یادداشت")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("current-time placeholders always use today", () => {
  test.each([
    ["تاریخ شمسی جاری", "1404-11-26"],
    ["تاریخ میلادی جاری", "2026-02-15"],
    ["تاریخ قمری جاری", "1447-08-26"],
    ["روز هفته جاری", "یکشنبه (Sunday)"],
    ["روز ماه جاری", "26"],
    ["هفته جاری", "1404-W49"],
    ["نام ماه جاری", "بهمن (Bahman)"],
    ["ماه جاری", "1404-11"],
    ["نام فصل جاری", "زمستان (Winter)"],
    ["فصل جاری", "1404-S4"],
    ["سال جاری", "1404"],
  ])("%s", (name, expected) => {
    expect(apply(name)).toBe(expected);
    expect(apply(name, { period: "year", date: noteDate, today })).toBe(
      expected
    );
  });
});

describe("elapsed and remaining days", () => {
  test("daily notes count from the note's date", () => {
    expect(apply("روزهای گذشته ماه")).toBe("7");
    expect(apply("روزهای باقیمانده ماه")).toBe("22");
    expect(apply("روزهای گذشته فصل")).toBe("37");
    expect(apply("روزهای باقیمانده فصل")).toBe("52");
    expect(apply("روزهای گذشته سال")).toBe("223");
    expect(apply("روزهای باقیمانده سال")).toBe("141");
  });

  test("other notes count from today", () => {
    const monthly: IPlaceholderContext = {
      period: "month",
      date: fromJalali(1405, 8, 1),
      today,
    };
    expect(apply("روزهای گذشته ماه", monthly)).toBe("25");
    expect(apply("روزهای باقیمانده ماه", monthly)).toBe("4");
    expect(apply("روزهای گذشته سال", monthly)).toBe("331");
    expect(apply("روزهای باقیمانده سال", monthly)).toBe("33");
  });
});

describe("which note types a placeholder works in", () => {
  const ctx = (period: IPlaceholderContext["period"]) => ({
    period,
    date: fromJalali(1405, 8, 1),
    today,
  });

  test("daily-only placeholders are left in other notes", () => {
    expect(apply("تاریخ شمسی یادداشت", ctx("week"))).toBe(
      "{{تاریخ شمسی یادداشت}}"
    );
  });

  test("week placeholders are left in monthly notes", () => {
    expect(apply("هفته یادداشت", ctx("month"))).toBe("{{هفته یادداشت}}");
  });

  test("month placeholders work in monthly but not weekly notes", () => {
    expect(apply("ماه یادداشت", ctx("month"))).toBe("1405-08");
    expect(apply("ماه یادداشت", ctx("week"))).toBe("{{ماه یادداشت}}");
  });

  test("season and year placeholders work in quarterly notes", () => {
    expect(apply("فصل یادداشت", ctx("quarter"))).toBe("1405-S3");
    expect(apply("سال یادداشت", ctx("quarter"))).toBe("1405");
  });

  test("season placeholders are left in yearly notes", () => {
    expect(apply("فصل یادداشت", ctx("year"))).toBe("{{فصل یادداشت}}");
  });

  test("current placeholders work in every note type", () => {
    expect(apply("سال جاری", ctx("year"))).toBe("1404");
  });
});

test("event placeholders are not recognised", () => {
  expect(apply("مناسبت جاری")).toBe("{{مناسبت جاری}}");
  expect(apply("مناسبت یادداشت")).toBe("{{مناسبت یادداشت}}");
});

test("spaces inside braces are allowed and every occurrence is replaced", () => {
  expect(applyPersianPlaceholders("{{ سال جاری }} / {{سال جاری}}", daily)).toBe(
    "1404 / 1404"
  );
});

test("text without placeholders is untouched", () => {
  expect(applyPersianPlaceholders("# {{title}} {{foo}}", daily)).toBe(
    "# {{title}} {{foo}}"
  );
});

describe("the week that contains 1 Farvardin", () => {
  const weekly: IPlaceholderContext = {
    period: "week",
    date: startOfJalaliWeek(fromJalali(1404, 1, 1)), // Saturday 2025-03-15
    today,
  };

  test("belongs to the new year", () => {
    expect(apply("هفته یادداشت", weekly)).toBe("1404-W01");
    expect(apply("سال یادداشت", weekly)).toBe("1404");
  });

  test("starts on Saturday and ends on Friday", () => {
    expect(apply("اول هفته", weekly)).toBe("2025-03-15");
    expect(apply("آخر هفته", weekly)).toBe("2025-03-21");
  });
});
