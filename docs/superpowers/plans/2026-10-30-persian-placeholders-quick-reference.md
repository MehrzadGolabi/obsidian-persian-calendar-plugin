# Persian Placeholders, Quick References, URI Handler and Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Persian template placeholders, `@` / `@/` calendar-note references, a `{{` placeholder suggester, an `obsidian://persian-calendar` URI handler, per-period open commands and a Gregorian frontmatter alias to the Jalali calendar plugin.

**Architecture:** Pure, Jest-tested modules hold all logic (`lunar`, `placeholders`, `references`, `frontmatter`, `uri`). Thin Obsidian glue (two `EditorSuggest` classes, the protocol handler, commands) calls them. All note creation goes through the existing `src/io/jalali/notes.ts`; nothing duplicates naming or template logic.

**Tech Stack:** TypeScript 4.2, Svelte 3 (untouched), Obsidian API, `jalaali-js`, Jest 26 + ts-jest, Rollup.

**Spec:** `docs/superpowers/specs/2026-10-30-persian-placeholders-quick-reference-design.md`

## Global Constraints

- Jalali mode only; Gregorian-mode behaviour is unchanged (except the existing `open-weekly-note` command, see Task 7).
- Existing English template variables (`{{date}}`, `{{title}}`, `{{time}}`, `{{date:FORMAT}}`, `{{yesterday}}`, `{{tomorrow}}`) must keep working exactly as now; all existing tests must still pass.
- No event placeholders (`{{مناسبت یادداشت}}`, `{{مناسبت جاری}}`): not recognised, left as written.
- Output formats: Jalali date `1404-11-30`; Gregorian date and every start/end value `2026-02-19` (`YYYY-MM-DD`); lunar `1447-09-01`; weekday/month/season names `Persian (English)` (e.g. `پنجشنبه (Thursday)`); day of month a bare number; week `1404-W49`; month `1404-11`; season `1404-S4`; year `1404`; elapsed/remaining counts plain integers. Latin digits.
- Weeks run Saturday to Friday (reuse `getJalaliWeek`, `startOfJalaliWeek`); season = quarter; the lunar sample `1447-09-01` for 2026-02-19 is the acceptance check for the Hijri calendar choice.
- Placeholder validity: note-relative day group, daily only; week group, daily+weekly; month group, daily+monthly; season group, daily+monthly+quarterly; year group, daily+weekly+monthly+quarterly+yearly; current group, all; elapsed/remaining, all (relative to the daily note's date, today for other note types). In other note types a placeholder is left as written.
- `@` and the URI never show the confirm-before-create dialog. Relative phrases (روز/هفته/ماه/فصل/سال بعد/قبل) are relative to the open calendar note's date, falling back to today. Fixed phrases always resolve against today.
- `@` link text is the phrase picked: `[[1404-W49|این هفته]]` via `app.fileManager.generateMarkdownLink`. `@/` inserts the date in the note type's own format, creates nothing.
- Alias `aliases: [YYYY-MM-DD]` on newly created daily notes only; merged into existing template frontmatter, never duplicated.
- URI: `obsidian://persian-calendar?type=<daily|weekly|monthly|quarterly|yearly>&date=<jYYYY-jMM-jDD>`; `type` defaults to `daily`, `date` to today; invalid input shows a `Notice` and creates nothing.
- Command IDs: `open-daily-note`, `open-weekly-note` (existing), `open-monthly-note`, `open-quarterly-note`, `open-yearly-note`.
- `npm test` and `npm run lint` must pass. New pure modules do not import `obsidian`.
- No git commits are made unless the user asks; each task ends with a verification step instead.

## Review Focus

- Leap-year boundaries: `سال بعد` from 30 Esfand 1403 (leap) lands on 29 Esfand 1404; `ماه بعد` from 31 Mehr clamps to 30 Aban. Tested in Task 1/5.
- A week straddling the new year: `{{هفته یادداشت}}` yields `1404-W01` for the week containing 1 Farvardin, and week start/end stay Gregorian Saturday and Friday. Tested in Task 2.
- Placeholder text with extra spaces (`{{ سال جاری }}`) and repeated occurrences in one template are all replaced. Tested in Task 2.
- `@` inside an email address or URL (`a@b.com`) does not open the suggester; `@/` never creates a note. Tested in Task 5/6.
- Template frontmatter variants for the alias: none, empty file, inline `aliases: [x]`, block-list `aliases:`, `aliases` absent, alias already present. Tested in Task 4.
- Invalid URI input (`type=hourly`, `date=1405-13-40`, missing `date`) gives an error result and creates no note. Tested in Task 7.

---

### Task 1: Lunar Hijri date and Jalali shifting helper

**Files:**
- Create: `src/jalali/lunar.ts`, `src/jalali/lunar.test.ts`
- Modify: `src/jalali/dates.ts` (append), `src/jalali/dates.test.ts`

**Interfaces:**
- Produces: `toHijriString(date: Date): string` (`YYYY-MM-DD`, Latin digits); `shiftJalali(date: Date, period: JalaliPeriod, amount: number): Date`: day ±N days, week ±7N days, month ±N months, quarter ±3N months, year ±N years; for month/quarter/year the Jalali day clamps to the target month's length; result at local noon.

- [ ] **Step 1: Write failing tests.** `lunar.test.ts`: `toHijriString(new Date(2026, 1, 19, 12))` equals `"1447-09-01"`. `dates.test.ts`: `shiftJalali` for 8 Aban 1405 (`new Date(2026, 9, 30, 12)`): day +1 is 9 Aban, week -1 is 1 Aban, month +1 is 8 Azar 1405, quarter +1 is 8 Dey 1405, year +1 is 8 Aban 1406. Clamps: 31 Mehr 1405 month +1 gives 30 Aban 1405; 30 Esfand 1403 year +1 gives 29 Esfand 1404 (compare via `toJalali`).
- [ ] **Step 2: Run** `npx jest src/jalali` and confirm the new tests fail (functions missing).
- [ ] **Step 3: Implement** both functions. `toHijriString` uses `Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts`; if the 2026-02-19 test fails, switch the calendar to `islamic-civil` and note which one passed in a comment. `shiftJalali` works on `toJalali`/`fromJalali`/`daysInMonth`.
- [ ] **Step 4: Run** `npx jest src/jalali` and confirm all pass.

### Task 2: Persian placeholder resolver

**Files:**
- Create: `src/jalali/placeholders.ts`, `src/jalali/placeholders.test.ts`

**Interfaces:**
- Consumes: `toHijriString`, `formatJalali`, `toJalali`, `startOfJalaliPeriod`, `getJalaliWeek`, `startOfJalaliWeek`, `JALALI_MONTHS`, `JALALI_WEEKDAYS`, `quarterOf`, `fromJalali`, `daysInMonth` from `src/jalali`.
- Produces:
  - `interface IPlaceholderContext { period: JalaliPeriod; date: Date; today: Date }` (`date` is the note's date, the start of its period)
  - `const PLACEHOLDER_NAMES: string[]` all 36 Persian names from the spec appendix, without braces, in appendix order (feeds the `{{` suggester)
  - `applyPersianPlaceholders(contents: string, ctx: IPlaceholderContext): string`

- [ ] **Step 1: Write failing tests** with the daily note date 1405-08-08 (`new Date(2026, 9, 30, 12)`) and today `new Date(2026, 1, 15, 12)` (1404-11-26). Assertions: `{{تاریخ شمسی یادداشت}}` is `1405-08-08`; `{{تاریخ میلادی یادداشت}}` is `2026-10-30`; `{{روز هفته یادداشت}}` is `جمعه (Friday)`; `{{روز ماه یادداشت}}` is `8`; `{{هفته یادداشت}}` is `1405-W32`-style value matching `formatJalali(date, "jgggg-[W]jww")`; `{{اول هفته}}` is `2026-10-24` and `{{آخر هفته}}` `2026-10-30`; `{{ماه یادداشت}}` `1405-08`; `{{نام ماه یادداشت}}` `آبان (Aban)`; `{{اول ماه}}` `2026-10-23`, `{{آخر ماه}}` `2026-11-21`; `{{فصل یادداشت}}` `1405-S3`; `{{نام فصل یادداشت}}` `پاییز (Autumn)`; `{{اول فصل}}`/`{{آخر فصل}}` Gregorian of 1 Mehr / 30 Azar; `{{سال یادداشت}}` `1405`; `{{اول سال}}` `2026-03-21`, `{{آخر سال}}` `2027-03-20`. Current group uses today: `{{تاریخ شمسی جاری}}` `1404-11-26`, `{{تاریخ میلادی جاری}}` `2026-02-15`, `{{تاریخ قمری جاری}}` `1447-08-26`, `{{روز هفته جاری}}` `یکشنبه (Sunday)`, `{{نام ماه جاری}}` `بهمن (Bahman)`, `{{نام فصل جاری}}` `زمستان (Winter)`, `{{فصل جاری}}` `1404-S4`, `{{سال جاری}}` `1404`, `{{ماه جاری}}` `1404-11`, `{{روز ماه جاری}}` `26`, `{{هفته جاری}}` equals the week format for today. Elapsed/remaining in the daily note: year/season/month passed = days from the period start to the date (0 on the first day), remaining = days from the date to the period end (0 on the last day), so for 8 Aban: month passed `7`, remaining `22`. In a non-daily note (period `month`) the same placeholders use `today`. Validity: `{{سال یادداشت}}` is replaced with period `year`, while `{{تاریخ شمسی یادداشت}}` with period `week` and `{{هفته یادداشت}}` with period `month` stay as written; `{{مناسبت جاری}}` stays as written. Review Focus: week containing 1 Farvardin 1405 with period `week` gives `1405-W01`; `{{ سال جاری }}  {{سال جاری}}` replaces both.
- [ ] **Step 2: Run** `npx jest src/jalali/placeholders` and confirm failure.
- [ ] **Step 3: Implement** `applyPersianPlaceholders`: build a map name → `{ periods: JalaliPeriod[] | "all"; value(ctx): string }` and replace `/{{\s*([^{}]+?)\s*}}/g`, returning the match unchanged when the name is unknown or invalid for `ctx.period`. Validity table is in Global Constraints. Month/season end values come from the next period's start minus one day.
- [ ] **Step 4: Run** `npx jest src/jalali/placeholders` and confirm pass.

### Task 3: Wire placeholders into note creation

**Files:**
- Modify: `src/io/jalali/template.ts`, `src/io/jalali/template.test.ts`, `src/io/jalali/notes.ts`

**Interfaces:**
- Consumes: `applyPersianPlaceholders`, `IPlaceholderContext` (Task 2).
- Produces: `ITemplateContext` gains `period?: JalaliPeriod` and `today?: Date`. `applyJalaliTemplate` additionally calls `applyPersianPlaceholders` when `period` is given (`today` defaults to `new Date()`). `createJalaliNote` passes `period` and `today: new Date()`.

- [ ] **Step 1: Write failing test** in `template.test.ts`: `applyJalaliTemplate("{{سال یادداشت}} {{title}}", { date, format: FORMAT, filename: "x", time: "", period: "day", today: date })` is `"1405 x"`; without `period` the Persian placeholder is left alone.
- [ ] **Step 2: Run** `npx jest src/io` and confirm failure.
- [ ] **Step 3: Implement** the context additions and the `createJalaliNote` call.
- [ ] **Step 4: Run** `npx jest` and confirm the whole suite passes.

### Task 4: Gregorian alias in frontmatter

**Files:**
- Create: `src/io/jalali/frontmatter.ts`, `src/io/jalali/frontmatter.test.ts`
- Modify: `src/io/jalali/notes.ts`

**Interfaces:**
- Produces: `addAlias(contents: string, alias: string): string` (pure, no `obsidian` import). `createJalaliNote` applies it with the Gregorian `YYYY-MM-DD` of the note date when `period === "day"`, after template substitution.

- [ ] **Step 1: Write failing tests** for `addAlias(contents, "2026-10-30")`: empty string gives `"---\naliases: [2026-10-30]\n---\n"`; plain body gets a frontmatter block prepended before it; frontmatter without `aliases` gets `aliases: [2026-10-30]` before the closing `---`; inline `aliases: [a]` becomes `aliases: [a, 2026-10-30]`; block list `aliases:\n  - a` gets `  - 2026-10-30` appended; alias already present returns the input unchanged; `aliases: []` becomes `aliases: [2026-10-30]`.
- [ ] **Step 2: Run** `npx jest src/io/jalali/frontmatter` and confirm failure.
- [ ] **Step 3: Implement** `addAlias` with string/regex handling (no YAML library). In `createJalaliNote` build the alias from the local year/month/day of the note's start date.
- [ ] **Step 4: Run** `npx jest` and confirm pass.

### Task 5: Reference resolver and editor triggers

**Files:**
- Create: `src/jalali/references.ts`, `src/jalali/references.test.ts`

**Interfaces:**
- Consumes: `shiftJalali`, `startOfJalaliPeriod`, `JALALI_WEEKDAYS` (Task 1 / existing).
- Produces:
  - `interface IReferencePhrase { label: string; period: JalaliPeriod; kind: "fixed" | "relative"; offset: number }`
  - `getReferencePhrases(today: Date): IReferencePhrase[]` fixed: امروز 0, دیروز -1, فردا +1, پریروز -2, پس‌فردا +2 (day); این هفته, این ماه, این فصل, امسال (offset 0); today's weekday name (kind fixed, day, offset 0); relative: روز بعد/قبل, هفته بعد/قبل, ماه بعد/قبل, فصل بعد/قبل, سال بعد/قبل (offset ±1).
  - `resolveReference(phrase: IReferencePhrase, openNoteDate: Date | null, today: Date): { period: JalaliPeriod; date: Date }`: fixed uses `today`, relative uses `openNoteDate ?? today`; fixed day offsets use `shiftJalali(today, "day", offset)`.
  - `parseReferenceTrigger(linePrefix: string): { start: number; plain: boolean; query: string } | null`: matches `@` or `@/` at line start or after whitespace, followed by up to 20 non-`@`, non-newline characters; `start` is the index of the `@`.
  - `parsePlaceholderTrigger(linePrefix: string, lineSuffix: string): { start: number; end: number; query: string } | null`: matches the last unclosed `{{` before the cursor; `end` extends over a directly following `}}` in `lineSuffix`.

- [ ] **Step 1: Write failing tests:** resolution: from today 1405-08-08, `فردا` is 9 Aban; `پس‌فردا` 10 Aban; `این هفته` is period `week`; relative `ماه قبل` with openNoteDate 1405-01-15 gives period `month`, date in Esfand 1404; relative with `null` uses today; `سال بعد` from 30 Esfand 1403 lands on 29 Esfand 1404. Triggers: `parseReferenceTrigger("task @این ه")` gives `{ start: 5, plain: false, query: "این ه" }`; `"@/"` gives plain true with empty query; `"a@b.com"` gives null; `"no at sign"` gives null. `parsePlaceholderTrigger("x {{سال", "}} y")` gives `start: 2`, `end` covering the `}}`, query `سال`; `"{{done}} x"` with the cursor after `}}` gives null.
- [ ] **Step 2: Run** `npx jest src/jalali/references` and confirm failure.
- [ ] **Step 3: Implement** the four exports.
- [ ] **Step 4: Run** `npx jest src/jalali/references` and confirm pass.

### Task 6: Editor suggesters and note-link helper

**Files:**
- Create: `src/ui/referenceSuggest.ts`, `src/ui/placeholderSuggest.ts`
- Modify: `src/io/jalali/notes.ts`, `src/main.ts`

**Interfaces:**
- Consumes: `getReferencePhrases`, `resolveReference`, `parseReferenceTrigger`, `parsePlaceholderTrigger`, `PLACEHOLDER_NAMES`, `findJalaliDateForFile`.
- Produces in `notes.ts`: `getOrCreateJalaliNote(settings: ISettings, period: JalaliPeriod, date: Date): Promise<TFile>` (existing note, else `createJalaliNote`, no dialog) and `getJalaliNoteName(settings: ISettings, period: JalaliPeriod, date: Date): string` (basename in the period's format). Classes `ReferenceSuggest` and `PlaceholderSuggest`, both `EditorSuggest`s constructed with `(app: App, getSettings: () => ISettings)`.

- [ ] **Step 1: Implement** `ReferenceSuggest`: `onTrigger` uses `parseReferenceTrigger` on the text before the cursor and returns `null` unless `calendarMode === "jalali"`; `getSuggestions` filters phrase labels by `includes(query)`; `renderSuggestion` shows the label; `selectSuggestion` resolves with `findJalaliDateForFile` of the active file (or `null`) and `new Date()`; for `@/` replaces the trigger with `getJalaliNoteName`; for `@` calls `getOrCreateJalaliNote` and replaces the trigger with `app.fileManager.generateMarkdownLink(file, activeFile.path, undefined, label)`.
- [ ] **Step 2: Implement** `PlaceholderSuggest` (trigger `{{`, filter `PLACEHOLDER_NAMES`, insert `{{name}}` replacing from `start` to `end`).
- [ ] **Step 3: Register** both in `main.ts` `onload` with `this.registerEditorSuggest(new ReferenceSuggest(this.app, () => this.options))` and likewise for placeholders.
- [ ] **Step 4: Verify** `npm run lint` and `npx jest` pass. Then check manually in Obsidian (see Task 8) that `@` shows phrases.

### Task 7: URI handler and commands

**Files:**
- Create: `src/io/jalali/uri.ts`, `src/io/jalali/uri.test.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `parseJalaliFormat`, `openOrCreateJalaliNote`.
- Produces: `parseCalendarUri(params: Record<string, string>, today: Date): { period: JalaliPeriod; date: Date } | { error: string }`. `type` values map `daily|weekly|monthly|quarterly|yearly` to `day|week|month|quarter|year`; `date` parsed with `parseJalaliFormat(date, "jYYYY-jMM-jDD")`.

- [ ] **Step 1: Write failing tests:** `{ type: "weekly", date: "1404-11-30" }` gives period `week` and that date; `{}` gives `day` and `today`; `{ type: "hourly" }` gives an `error`; `{ date: "1405-13-40" }` gives an `error`.
- [ ] **Step 2: Run** `npx jest src/io/jalali/uri` and confirm failure.
- [ ] **Step 3: Implement** `parseCalendarUri`.
- [ ] **Step 4: Register** in `main.ts`: `this.registerObsidianProtocolHandler("persian-calendar", ...)` that parses params, shows `new Notice(error)` on error, else calls `openOrCreateJalaliNote({ ...this.options, shouldConfirmBeforeCreate: false }, period, date, false)`.
- [ ] **Step 5: Add commands** in `main.ts`: `open-daily-note`, `open-monthly-note`, `open-quarterly-note`, `open-yearly-note` via `checkCallback` available only when `calendarMode === "jalali"`, opening today's note with `openOrCreateJalaliNote(this.options, period, new Date(), false)`. Change the existing `open-weekly-note`: in Jalali mode it does the same for `week` and is always available; in Gregorian mode its current behaviour stays.
- [ ] **Step 6: Run** `npm run lint` and `npx jest`; confirm pass.

### Task 8: README and full verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README:** extend the Templates section with the Persian placeholder tables (copy names from the spec appendix, note event placeholders are not supported), add sections for `@` / `@/` references (phrase list, relative-to-open-note rule, link created if missing), the `{{` suggester, the URI (`obsidian://persian-calendar?type=daily&date=1405-08-20`), the command IDs and the Gregorian alias.
- [ ] **Step 2: Run** `npm run build`; expect lint, svelte-check and rollup to succeed and `main.js` to regenerate.
- [ ] **Step 3: Manual check** in an Obsidian vault with the built plugin: create a daily note from a template using `{{سال یادداشت}}` and confirm the alias line; type `@این هفته` in a note and confirm the weekly note is created and linked; open `obsidian://persian-calendar?type=monthly&date=1405-08-08`.
