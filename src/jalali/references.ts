import { JALALI_WEEKDAYS, JalaliPeriod, shiftJalali } from "./dates";

export interface IReferencePhrase {
  label: string;
  period: JalaliPeriod;
  /** Fixed phrases count from today, relative ones from the open note. */
  kind: "fixed" | "relative";
  offset: number;
}

const fixed = (
  label: string,
  period: JalaliPeriod,
  offset = 0
): IReferencePhrase => ({ label, period, kind: "fixed", offset });

const relative = (
  period: JalaliPeriod,
  next: string,
  previous: string
): IReferencePhrase[] => [
  { label: next, period, kind: "relative", offset: 1 },
  { label: previous, period, kind: "relative", offset: -1 },
];

/** The phrases offered after `@`, in the order they are suggested. */
export function getReferencePhrases(today: Date): IReferencePhrase[] {
  const weekday = JALALI_WEEKDAYS[(today.getDay() + 1) % 7];
  return [
    fixed("امروز", "day"),
    fixed("دیروز", "day", -1),
    fixed("فردا", "day", 1),
    fixed("پریروز", "day", -2),
    fixed("پس‌فردا", "day", 2),
    fixed(weekday, "day"),
    ...relative("day", "روز بعد", "روز قبل"),
    fixed("این هفته", "week"),
    ...relative("week", "هفته بعد", "هفته قبل"),
    fixed("این ماه", "month"),
    ...relative("month", "ماه بعد", "ماه قبل"),
    fixed("این فصل", "quarter"),
    ...relative("quarter", "فصل بعد", "فصل قبل"),
    fixed("امسال", "year"),
    ...relative("year", "سال بعد", "سال قبل"),
  ];
}

/**
 * The note a phrase points at. `openNoteDate` is the date of the calendar note
 * being edited, or null when the open file isn't one.
 */
export function resolveReference(
  phrase: IReferencePhrase,
  openNoteDate: Date | null,
  today: Date
): { period: JalaliPeriod; date: Date } {
  const from = phrase.kind === "fixed" ? today : openNoteDate ?? today;
  return {
    period: phrase.period,
    date: shiftJalali(from, phrase.period, phrase.offset),
  };
}

/** An `@` or `@/` just before the cursor, at the start of a word. */
export function parseReferenceTrigger(
  linePrefix: string
): { start: number; plain: boolean; query: string } | null {
  const match = /(^|\s)@(\/?)([^@\n]{0,20})$/.exec(linePrefix);
  if (!match) {
    return null;
  }
  return {
    start: match.index + match[1].length,
    plain: match[2] === "/",
    query: match[3],
  };
}

/**
 * An unfinished `{{` before the cursor. `end` is where a replacement stops:
 * past a `}}` that directly follows the cursor, else at the cursor.
 */
export function parsePlaceholderTrigger(
  linePrefix: string,
  lineSuffix: string
): { start: number; end: number; query: string } | null {
  const match = /{{([^{}]*)$/.exec(linePrefix);
  if (!match) {
    return null;
  }
  return {
    start: match.index,
    end: linePrefix.length + (lineSuffix.startsWith("}}") ? 2 : 0),
    query: match[1].trim(),
  };
}
