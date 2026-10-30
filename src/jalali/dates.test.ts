import {
  daysInMonth,
  formatJalali,
  fromJalali,
  getJalaliWeek,
  isValidJalali,
  quarterOf,
  startOfJalaliPeriod,
  toPersianDigits,
  startOfJalaliWeek,
  toJalali,
} from "./dates";

const ymd = (d: Date) => [d.getFullYear(), d.getMonth() + 1, d.getDate()];

describe("conversion", () => {
  test("gregorian -> jalali", () => {
    expect(toJalali(new Date(2026, 9, 30))).toEqual({ year: 1405, month: 8, day: 8 });
    expect(toJalali(new Date(2025, 2, 21))).toEqual({ year: 1404, month: 1, day: 1 });
  });

  test("jalali -> gregorian", () => {
    expect(ymd(fromJalali(1405, 8, 8))).toEqual([2026, 10, 30]);
  });

  test("round trips every day across several years", () => {
    const d = new Date(2020, 0, 1, 12);
    for (let i = 0; i < 365 * 8; i++) {
      const j = toJalali(d);
      expect(ymd(fromJalali(j.year, j.month, j.day))).toEqual(ymd(d));
      d.setDate(d.getDate() + 1);
    }
  });
});

describe("month lengths and validity", () => {
  test("first six months have 31 days, next five 30", () => {
    expect(daysInMonth(1404, 1)).toBe(31);
    expect(daysInMonth(1404, 6)).toBe(31);
    expect(daysInMonth(1404, 7)).toBe(30);
    expect(daysInMonth(1404, 11)).toBe(30);
  });

  test("Esfand has 30 days only in leap years (1403, 1408)", () => {
    expect(daysInMonth(1403, 12)).toBe(30);
    expect(daysInMonth(1404, 12)).toBe(29);
    expect(daysInMonth(1408, 12)).toBe(30);
  });

  test("rejects impossible dates", () => {
    expect(isValidJalali(1404, 12, 30)).toBe(false);
    expect(isValidJalali(1403, 12, 30)).toBe(true);
    expect(isValidJalali(1404, 13, 1)).toBe(false);
    expect(isValidJalali(1404, 0, 1)).toBe(false);
  });
});

describe("quarters", () => {
  test("three months each", () => {
    expect([1, 3, 4, 6, 7, 9, 10, 12].map(quarterOf)).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
  });
});

describe("weeks (Saturday start)", () => {
  test("startOfJalaliWeek returns the Saturday on or before", () => {
    // 2026-10-30 is a Friday -> week starts Saturday 2026-10-24
    expect(ymd(startOfJalaliWeek(new Date(2026, 9, 30)))).toEqual([2026, 10, 24]);
    // a Saturday maps to itself
    expect(ymd(startOfJalaliWeek(new Date(2026, 9, 24)))).toEqual([2026, 10, 24]);
  });

  test("week 1 is the week containing 1 Farvardin", () => {
    // 1 Farvardin 1405 = 2026-03-21 (Saturday)
    expect(getJalaliWeek(new Date(2026, 2, 21))).toEqual({ year: 1405, week: 1 });
    expect(getJalaliWeek(new Date(2026, 2, 27))).toEqual({ year: 1405, week: 1 });
    expect(getJalaliWeek(new Date(2026, 2, 28))).toEqual({ year: 1405, week: 2 });
  });

  test("a week straddling the new year belongs to the new year", () => {
    // 1 Farvardin 1404 = 2025-03-21 (Friday); its week starts Saturday 2025-03-15
    expect(getJalaliWeek(new Date(2025, 2, 15))).toEqual({ year: 1404, week: 1 });
    expect(getJalaliWeek(new Date(2025, 2, 21))).toEqual({ year: 1404, week: 1 });
  });
});

describe("formatJalali", () => {
  const d = new Date(2026, 9, 30); // 8 Aban 1405
  test("numeric tokens", () => {
    expect(formatJalali(d, "jYYYY-jMM-jDD")).toBe("1405-08-08");
    expect(formatJalali(d, "jYY/jM/jD")).toBe("05/8/8");
  });
  test("Persian month name", () => {
    expect(formatJalali(d, "jD jMMMM jYYYY")).toBe("8 آبان 1405");
  });
  test("quarter and week tokens with escapes", () => {
    expect(formatJalali(d, "jYYYY-[Q]jQ")).toBe("1405-Q3");
    expect(formatJalali(new Date(2026, 2, 21), "jYYYY-[W]jww")).toBe("1405-W01");
  });
  test("week token uses the week-year, not the calendar year", () => {
    expect(formatJalali(new Date(2025, 2, 15), "jgggg-[W]jww")).toBe("1404-W01");
  });
  test("unknown text passes through", () => {
    expect(formatJalali(d, "[Daily] jYYYY.jMM")).toBe("Daily 1405.08");
  });
});

describe("startOfJalaliPeriod", () => {
  const d = new Date(2026, 9, 30); // 8 Aban 1405 (Q3)
  test("day / week / month / quarter / year", () => {
    expect(ymd(startOfJalaliPeriod(d, "day"))).toEqual([2026, 10, 30]);
    expect(ymd(startOfJalaliPeriod(d, "week"))).toEqual([2026, 10, 24]);
    expect(ymd(startOfJalaliPeriod(d, "month"))).toEqual([2026, 10, 23]); // 1 Aban
    expect(ymd(startOfJalaliPeriod(d, "quarter"))).toEqual([2026, 9, 23]); // 1 Mehr
    expect(ymd(startOfJalaliPeriod(d, "year"))).toEqual([2026, 3, 21]); // 1 Farvardin
  });
});

describe("toPersianDigits", () => {
  test("converts latin digits and leaves other text alone", () => {
    expect(toPersianDigits(1405)).toBe("۱۴۰۵");
    expect(toPersianDigits("Q3 08")).toBe("Q۳ ۰۸");
  });
});
