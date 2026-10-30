import { toHijriString } from "./lunar";

test("Hijri date for 2026-02-19 is 1 Ramadan 1447", () => {
  expect(toHijriString(new Date(2026, 1, 19, 12))).toBe("1447-09-01");
});

test("Hijri date for 2026-02-15 is 26 Shaban 1447", () => {
  expect(toHijriString(new Date(2026, 1, 15, 12))).toBe("1447-08-26");
});
