import {
  fromJalali,
  isValidJalali,
  JALALI_MONTHS,
  startOfJalaliWeek,
} from "./dates";

const TOKEN_PATTERNS: Record<string, string> = {
  jYYYY: "(\\d{4})",
  jYY: "(\\d{2})",
  jMMMM: `(${JALALI_MONTHS.join("|")})`,
  jMM: "(\\d{2})",
  jM: "(\\d{1,2})",
  jDD: "(\\d{2})",
  jD: "(\\d{1,2})",
  jQ: "([1-4])",
  jgggg: "(\\d{4})",
  jww: "(\\d{2})",
  jw: "(\\d{1,2})",
};

const TOKEN_RE = /\[([^\]]*)\]|jYYYY|jYY|jMMMM|jMM|jM|jDD|jD|jQ|jgggg|jww|jw/g;
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The inverse of `formatJalali`: read a note name written with `format` back
 * into the start date of the period it names (day, week, month, quarter or
 * year). Returns null if the text doesn't match or isn't a real date.
 */
export function parseJalaliFormat(text: string, format: string): Date | null {
  const tokens: string[] = [];
  let pattern = "";
  let last = 0;
  const tokenRe = new RegExp(TOKEN_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(format))) {
    pattern += escapeRegex(format.slice(last, m.index));
    if (m[1] !== undefined) {
      pattern += escapeRegex(m[1]);
    } else {
      tokens.push(m[0]);
      pattern += TOKEN_PATTERNS[m[0]];
    }
    last = m.index + m[0].length;
  }
  pattern += escapeRegex(format.slice(last));

  const match = new RegExp(`^${pattern}$`).exec(text);
  if (!match) {
    return null;
  }

  const v: Record<string, number> = {};
  tokens.forEach((token, i) => {
    const raw = match[i + 1];
    if (token === "jMMMM") {
      v.month = JALALI_MONTHS.indexOf(raw) + 1;
    } else if (token === "jYYYY") {
      v.year = Number(raw);
    } else if (token === "jYY") {
      v.year = 1400 + Number(raw);
    } else if (token === "jMM" || token === "jM") {
      v.month = Number(raw);
    } else if (token === "jDD" || token === "jD") {
      v.day = Number(raw);
    } else if (token === "jQ") {
      v.quarter = Number(raw);
    } else if (token === "jgggg") {
      v.weekYear = Number(raw);
    } else {
      v.week = Number(raw);
    }
  });

  if (v.weekYear !== undefined && v.week !== undefined) {
    const first = startOfJalaliWeek(fromJalali(v.weekYear, 1, 1));
    return new Date(
      first.getFullYear(),
      first.getMonth(),
      first.getDate() + (v.week - 1) * 7,
      12
    );
  }
  if (v.year === undefined) {
    return null;
  }
  if (v.month !== undefined) {
    const day = v.day ?? 1;
    return isValidJalali(v.year, v.month, day)
      ? fromJalali(v.year, v.month, day)
      : null;
  }
  if (v.quarter !== undefined) {
    return fromJalali(v.year, (v.quarter - 1) * 3 + 1, 1);
  }
  return isValidJalali(v.year, 1, 1) ? fromJalali(v.year, 1, 1) : null;
}
