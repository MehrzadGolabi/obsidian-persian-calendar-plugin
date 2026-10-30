import { parseJalaliFormat } from "./parse";

const ymd = (d: Date | null) => d && [d.getFullYear(), d.getMonth() + 1, d.getDate()];

test("daily", () => {
  expect(ymd(parseJalaliFormat("1405-08-08", "jYYYY-jMM-jDD"))).toEqual([2026, 10, 30]);
  expect(ymd(parseJalaliFormat("1405/8/8", "jYYYY/jM/jD"))).toEqual([2026, 10, 30]);
});

test("month name", () => {
  expect(ymd(parseJalaliFormat("8 آبان 1405", "jD jMMMM jYYYY"))).toEqual([2026, 10, 30]);
});

test("month -> first day of month", () => {
  expect(ymd(parseJalaliFormat("1405-08", "jYYYY-jMM"))).toEqual([2026, 10, 23]);
});

test("quarter -> first day of quarter", () => {
  expect(ymd(parseJalaliFormat("1405-Q3", "jYYYY-[Q]jQ"))).toEqual([2026, 9, 23]);
});

test("year -> 1 Farvardin", () => {
  expect(ymd(parseJalaliFormat("1405", "jYYYY"))).toEqual([2026, 3, 21]);
});

test("week -> Saturday that starts it", () => {
  // week 1 of 1405 starts Saturday 2026-03-21; week 2 a week later
  expect(ymd(parseJalaliFormat("1405-W01", "jgggg-[W]jww"))).toEqual([2026, 3, 21]);
  expect(ymd(parseJalaliFormat("1405-W02", "jgggg-[W]jww"))).toEqual([2026, 3, 28]);
  // week 1 of 1404 straddles the new year and starts on the previous Saturday
  expect(ymd(parseJalaliFormat("1404-W01", "jgggg-[W]jww"))).toEqual([2025, 3, 15]);
});

test("rejects non-matching or impossible input", () => {
  expect(parseJalaliFormat("2026-10-30x", "jYYYY-jMM-jDD")).toBeNull();
  expect(parseJalaliFormat("1404-12-30", "jYYYY-jMM-jDD")).toBeNull();
  expect(parseJalaliFormat("1405-13-01", "jYYYY-jMM-jDD")).toBeNull();
  expect(parseJalaliFormat("hello", "jYYYY")).toBeNull();
});

test("literals with regex characters are matched literally", () => {
  expect(ymd(parseJalaliFormat("Daily (1405.08.08)", "[Daily (]jYYYY.jMM.jDD[)]"))).toEqual([2026, 10, 30]);
});
