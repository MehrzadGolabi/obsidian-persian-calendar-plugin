import { formatJalali, fromJalali, isValidJalali, toJalali } from "./dates";

export type ConvertSource = "gregorian" | "jalali";

export interface IConvertedDate {
  gregorian: string; // 2026-10-30
  jalali: string; // 1405-08-08
  gregorianLong: string; // 30 October 2026
  jalaliLong: string; // 8 آبان 1405
}

const GREGORIAN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const normalizeDigits = (text: string) =>
  text
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));

/**
 * Convert `text` (year, month, day separated by - / . or spaces; Persian digits
 * allowed) from the `from` calendar to both calendars. Null if it isn't a real date.
 */
export function convertDate(
  text: string,
  from: ConvertSource
): IConvertedDate | null {
  const parts = normalizeDigits(text).trim().split(/[-/.\s]+/);
  if (parts.length !== 3 || !parts.every((p) => /^\d+$/.test(p))) {
    return null;
  }
  const [y, m, d] = parts.map(Number);

  let date: Date;
  try {
    if (from === "jalali") {
      if (!isValidJalali(y, m, d)) {
        return null;
      }
      date = fromJalali(y, m, d);
    } else {
      date = new Date(2000, 0, 1, 12);
      date.setFullYear(y, m - 1, d);
      if (
        date.getFullYear() !== y ||
        date.getMonth() !== m - 1 ||
        date.getDate() !== d
      ) {
        return null;
      }
      toJalali(date); // throws outside the supported range
    }
  } catch {
    return null;
  }

  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return {
    gregorian: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    jalali: formatJalali(date, "jYYYY-jMM-jDD"),
    gregorianLong: `${date.getDate()} ${GREGORIAN_MONTHS[date.getMonth()]} ${date.getFullYear()}`,
    jalaliLong: formatJalali(date, "jD jMMMM jYYYY"),
  };
}
