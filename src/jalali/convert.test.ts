import { convertDate } from "./convert";

test("gregorian -> jalali", () => {
  expect(convertDate("2026-10-30", "gregorian")).toEqual({
    gregorian: "2026-10-30",
    jalali: "1405-08-08",
    jalaliLong: "8 آبان 1405",
    gregorianLong: "30 October 2026",
  });
});

test("jalali -> gregorian", () => {
  expect(convertDate("1405-08-08", "jalali")?.gregorian).toBe("2026-10-30");
});

test("accepts / and . separators, single digits, and Persian digits", () => {
  expect(convertDate("1405/8/8", "jalali")?.gregorian).toBe("2026-10-30");
  expect(convertDate("2026.10.30", "gregorian")?.jalali).toBe("1405-08-08");
  expect(convertDate("۱۴۰۵-۰۸-۰۸", "jalali")?.gregorian).toBe("2026-10-30");
});

test("leap day handling", () => {
  expect(convertDate("1403-12-30", "jalali")?.gregorian).toBe("2025-03-20");
  expect(convertDate("1404-12-30", "jalali")).toBeNull();
  expect(convertDate("2025-02-29", "gregorian")).toBeNull();
});

test("rejects garbage", () => {
  ["", "abc", "2026-10", "2026-13-01", "2026-10-30-1"].forEach((t) =>
    expect(convertDate(t, "gregorian")).toBeNull()
  );
});
