import {
  daysInMonth,
  fromJalali,
  getJalaliWeek,
  startOfJalaliWeek,
  toJalali,
} from "./dates";

export interface IGridDay {
  date: Date;
  jDay: number;
  inMonth: boolean;
}

export interface IGridWeek {
  weekStart: Date;
  week: number;
  days: IGridDay[]; // Saturday first
}

/** Saturday-first rows covering the whole Jalali month, padded with neighbouring days. */
export function buildMonthGrid(year: number, month: number): IGridWeek[] {
  const first = fromJalali(year, month, 1);
  const last = fromJalali(year, month, daysInMonth(year, month));

  const rows: IGridWeek[] = [];
  let weekStart = startOfJalaliWeek(first);
  while (weekStart.getTime() <= last.getTime()) {
    const days: IGridDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(
        weekStart.getFullYear(),
        weekStart.getMonth(),
        weekStart.getDate() + i,
        12
      );
      const j = toJalali(date);
      days.push({
        date,
        jDay: j.day,
        inMonth: j.year === year && j.month === month,
      });
    }
    rows.push({ weekStart, week: getJalaliWeek(weekStart).week, days });
    weekStart = new Date(
      weekStart.getFullYear(),
      weekStart.getMonth(),
      weekStart.getDate() + 7,
      12
    );
  }
  return rows;
}
