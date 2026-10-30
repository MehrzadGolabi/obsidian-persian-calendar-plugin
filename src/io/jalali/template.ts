import { formatJalali } from "src/jalali/dates";

interface ITemplateContext {
  date: Date;
  /** The note's Jalali format, used for `{{yesterday}}` / `{{tomorrow}}`. */
  format: string;
  filename: string;
  time: string;
}

function addDays(date: Date, days: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    12
  );
}

/**
 * Template variables supported in Jalali notes: `{{date}}`, `{{title}}`,
 * `{{time}}`, `{{date:jFORMAT}}`, `{{yesterday}}` and `{{tomorrow}}`.
 * Offsets like `{{date+1d}}` are not supported.
 */
export function applyJalaliTemplate(
  contents: string,
  { date, format, filename, time }: ITemplateContext
): string {
  return contents
    .replace(/{{\s*date\s*:(.+?)}}/gi, (_, fmt: string) =>
      formatJalali(date, fmt.trim())
    )
    .replace(/{{\s*(date|title)\s*}}/gi, filename)
    .replace(/{{\s*time\s*}}/gi, time)
    .replace(/{{\s*yesterday\s*}}/gi, formatJalali(addDays(date, -1), format))
    .replace(/{{\s*tomorrow\s*}}/gi, formatJalali(addDays(date, 1), format));
}
