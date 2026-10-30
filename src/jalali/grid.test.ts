import { buildMonthGrid } from "./grid";

const ymd = (d: Date) => [d.getFullYear(), d.getMonth() + 1, d.getDate()];

test("Aban 1405 starts on Friday, so the first row is led by 6 days of Mehr", () => {
  const grid = buildMonthGrid(1405, 8);
  const first = grid[0];
  expect(first.days).toHaveLength(7);
  expect(first.days.filter((d) => !d.inMonth)).toHaveLength(6);
  expect(first.days[6].jDay).toBe(1);
  expect(ymd(first.days[6].date)).toEqual([2026, 10, 23]);
  expect(ymd(first.weekStart)).toEqual([2026, 10, 17]); // the Saturday
});

test("every row has 7 days and consecutive dates", () => {
  const grid = buildMonthGrid(1403, 12);
  let prev: Date | null = null;
  grid.forEach((row) => {
    expect(row.days).toHaveLength(7);
    row.days.forEach((d) => {
      if (prev) {
        expect(Math.round((d.date.getTime() - prev.getTime()) / 864e5)).toBe(1);
      }
      prev = d.date;
    });
  });
});

test("contains exactly the month's days (leap Esfand has 30)", () => {
  const inMonth = (y: number, m: number) =>
    buildMonthGrid(y, m).reduce(
      (n, r) => n + r.days.filter((d) => d.inMonth).length,
      0
    );
  expect(inMonth(1403, 12)).toBe(30);
  expect(inMonth(1404, 12)).toBe(29);
  expect(inMonth(1404, 1)).toBe(31);
});

test("rows carry the Jalali week number", () => {
  const grid = buildMonthGrid(1405, 1);
  expect(grid[0].week).toBe(1);
  expect(grid[1].week).toBe(2);
});
