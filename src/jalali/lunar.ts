const hijriFormat = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Lunar Hijri date as `YYYY-MM-DD`, e.g. `1447-09-01`.
 *
 * Intl has no calendar for Iran's moon sighting. Umm al-Qura runs a day ahead
 * of it in the dates we checked, so one day is subtracted. Individual months
 * can still differ by a day from the official Iranian calendar.
 */
export function toHijriString(date: Date): string {
  const dayBefore = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - 1,
    12
  );
  const parts: Record<string, string> = {};
  for (const { type, value } of hijriFormat.formatToParts(dayBefore)) {
    parts[type] = value;
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
}
