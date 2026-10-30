# Persian placeholders, quick references, URI handler and commands: design

Date: 2026-10-30. Status: draft for approval.

## Intent

The Persian calendar plugin should let a user write calendar-aware notes entirely in Persian:

- Insert a link to any calendar note (including the weekly note for "this week") while typing, and create it if it doesn't exist yet. The motivating case: a task that needs a week's attention belongs to the weekly note, and the user wanted to type `@` and pick **این هفته**.
- Fill note templates with Persian placeholders such as `{{تاریخ شمسی یادداشت}}`.
- Let outside tools (an AutoHotkey toolkit) open or create notes through one plugin entry point, so naming and templates are never duplicated outside the plugin.

## Goals

1. **Placeholders** in templates, replaced when a note is created. The full set is in the Appendix. They cover note-relative values (daily, weekly, monthly, seasonal, yearly), "current time" values (always today), and elapsed/remaining days.
2. **Placeholder suggestions:** typing `{{` in the editor offers the placeholder names.
3. **Quick references:** typing `@` in the editor offers the phrases below. Picking one inserts a link to the matching calendar note, creating it first if missing, with no confirmation dialog. `@/` inserts the resolved date as plain text, with no link and no note creation.
   - Days: امروز، دیروز، فردا، پریروز، پس‌فردا
   - Day navigation (relative to the open calendar note, else today): روز بعد، روز قبل, plus "(نام روز جاری)", meaning the weekday name of today, e.g. پنجشنبه
   - Weeks: این هفته، هفته قبل، هفته بعد
   - Months: این ماه، ماه قبل، ماه بعد
   - Seasons: این فصل، فصل قبل، فصل بعد
   - Years: امسال، سال قبل، سال بعد
4. **URI handler:** `obsidian://persian-calendar?type=<daily|weekly|monthly|quarterly|yearly>&date=<Jalali date>` opens the note, creating it with the plugin's own template and naming if it doesn't exist.
5. **Command IDs** for opening daily, weekly, monthly, quarterly and yearly notes, so per-app hotkeys can be bound.
6. **Gregorian alias:** new Jalali daily notes get `aliases: [YYYY-MM-DD]` (the Gregorian date) in frontmatter, so Tasks, Dataview and old Gregorian links still find them.

## Non-goals

- Event placeholders (`{{مناسبت یادداشت}}`, `{{مناسبت جاری}}`). The user explicitly deferred these; no event data is bundled. These two placeholders are not recognised and are left as written in the template.
- Gregorian-mode behaviour changes. Everything here applies to Jalali mode.
- Offsets like `{{date+1d}}`.

## Anti-goals

- Existing templates must not break. The current English variables (`{{date}}`, `{{title}}`, `{{time}}`, `{{date:FORMAT}}`, `{{yesterday}}`, `{{tomorrow}}`) keep working exactly as now.
- No duplicated note naming/template logic: the URI handler, commands, `@` links and calendar clicks all go through the existing `openOrCreateJalaliNote` / `createJalaliNote` path in `src/io/jalali/notes.ts`.

## Decisions by the user

- Event placeholders: left out for now.
- `@` on a note that doesn't exist: create it and link it.
- Items 10, 11 and 12 (URI handler, command IDs, Gregorian alias) are in scope, as requested via another Claude instance.

## Calls made by me (to be checked)

- "Season" (فصل) maps to the existing quarterly note (3 Jalali months, identifier `1404-S4`).
- Persian placeholders are added alongside the English ones; no English placeholders are removed.
- The alias goes on daily notes only. Weekly, monthly, quarterly and yearly notes get none.
- Alias is merged into existing template frontmatter if present (extend `aliases`, no duplicate entries); otherwise a frontmatter block is added at the top.
- Lunar Hijri date comes from the platform `Intl` calendar (`islamic-umalqura` or `islamic-civil`); the chosen one is documented. It may differ by a day from Iran's official observed lunar calendar.
- Weeks follow the plugin's existing rules: Saturday to Friday, with week 1 containing 1 Farvardin, identifier `jgggg-Wjww`, e.g. `1404-W49`. "Start/end of week" etc. are formatted in Gregorian `YYYY-MM-DD`, as in the sample outputs.
- Weekday/month/season "name" placeholders output `Persian (English)`, e.g. `پنجشنبه (Thursday)`, as in the sample outputs.
- (Decided by the user) Relative `@` phrases (روز بعد/قبل, هفته بعد/قبل, ماه بعد/قبل, فصل بعد/قبل, سال بعد/قبل) are relative to the date of the note being edited. If the open file isn't a calendar note, they fall back to today. Fixed phrases (امروز، دیروز، فردا، پریروز، پس‌فردا، این هفته، این ماه، این فصل، امسال) always resolve against today. Use `findJalaliDateForFile` to get the open note's date.
- The `{{`/`@` suggesters use Obsidian's `EditorSuggest` and are active in any markdown note.
- URI `date` accepts a Jalali date (`jYYYY-jMM-jDD`) and defaults to today when absent. It never shows the "confirm before create" dialog (an external tool can't answer it).
- Output formats, matched to the user's sample table: `{{تاریخ شمسی …}}` `1404-11-30`; `{{تاریخ میلادی …}}` `2026-02-19`; `{{تاریخ قمری …}}` `1447-09-01`; weekday/month/season names `Persian (English)`; `{{روز ماه …}}` a bare number (`30`); `{{هفته …}}` `1404-W49`; `{{ماه …}}` `1404-11`; `{{فصل …}}` `1404-S4`; `{{سال …}}` `1404`; all start/end values Gregorian `YYYY-MM-DD`; the six `روزهای …` counts plain integers.
- The lunar sample (`1447-09-01` for 2026-02-19) is the acceptance check for the Hijri calendar choice. Try `islamic-umalqura` first and fall back to `islamic-civil` if the sample doesn't match. No lookup table.
- Year placeholders also work in seasonal (quarterly) notes, which widens the user's list slightly. Week placeholders in monthly/seasonal notes are not replaced.
- URI/command `date` is any Jalali date inside the period (`type=weekly&date=1404-11-30` is the week containing it). An invalid type or date shows an Obsidian notice and creates nothing. The URI works in either calendar mode, since it uses Jalali notes.
- An `@` link shows the phrase: picking **این هفته** inserts `[[1404-W49|این هفته]]`, following Obsidian's link-format setting. Plain-text `@/` inserts the resolved date in the note's own format.
- Command IDs: `open-daily-note`, `open-weekly-note` (existing ID kept, but no longer disabled when Periodic Notes is loaded in Jalali mode), `open-monthly-note`, `open-quarterly-note`, `open-yearly-note`. They open today's note for that period.

## Left to the builder

- Module layout and file naming, test structure (the repo uses Jest; add tests next to the code as `template.test.ts` does).
- Exact suggestion UI text and ordering, and the exact link format (wikilink vs markdown link, follow the user's Obsidian link settings).
- How to read the plugin's existing note settings and the "which weekday" arithmetic, reusing `src/jalali/dates.ts`.
- README update: the template table and a section for `@` references, the URI and the commands.

## Constraints

- Obsidian plugin in TypeScript with Svelte 3, built by Rollup; `npm run lint` and `npm test` must pass.
- Persian digits: outputs use Latin digits as in the samples, unless the existing formatter says otherwise.

## Appendix: placeholder set (from the user)

Note-relative, daily notes only: `{{تاریخ شمسی یادداشت}}`, `{{تاریخ میلادی یادداشت}}`, `{{تاریخ قمری یادداشت}}`, `{{روز هفته یادداشت}}`, `{{روز ماه یادداشت}}`.

Week (daily and weekly notes): `{{هفته یادداشت}}`, `{{اول هفته}}`, `{{آخر هفته}}`.

Month (daily and monthly notes): `{{ماه یادداشت}}`, `{{نام ماه یادداشت}}`, `{{اول ماه}}`, `{{آخر ماه}}`.

Season (daily, monthly and seasonal notes): `{{فصل یادداشت}}`, `{{نام فصل یادداشت}}`, `{{اول فصل}}`, `{{آخر فصل}}`.

Year (daily, weekly, monthly and yearly notes): `{{سال یادداشت}}`, `{{اول سال}}`, `{{آخر سال}}`.

Current (always today): `{{تاریخ شمسی جاری}}`, `{{تاریخ میلادی جاری}}`, `{{تاریخ قمری جاری}}`, `{{روز هفته جاری}}`, `{{روز ماه جاری}}`, `{{هفته جاری}}`, `{{نام ماه جاری}}`, `{{ماه جاری}}`, `{{نام فصل جاری}}`, `{{فصل جاری}}`, `{{سال جاری}}`.

Elapsed/remaining (relative to the daily note's date; today if the note isn't daily): `{{روزهای گذشته سال}}`, `{{روزهای باقیمانده سال}}`, `{{روزهای گذشته فصل}}`, `{{روزهای باقیمانده فصل}}`, `{{روزهای گذشته ماه}}`, `{{روزهای باقیمانده ماه}}`.

Sample outputs: `1404-11-30`, `2026-02-19`, `1447-09-01`, `پنجشنبه (Thursday)`, `1404-W49`, `1404-S4`, `زمستان (Winter)`, `بهمن (Bahman)`.

"Works in" rule: a placeholder that is valid only for some note types is still replaced in the types listed. In other types it's left as written.
