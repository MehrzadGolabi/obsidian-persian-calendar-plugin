# Persian Calendar for Obsidian (Jalali + Gregorian)

A calendar view for [Obsidian](https://obsidian.md/) that works in **both the Persian (Jalali / Shamsi) and the Gregorian calendar**. Switch between them with one click, and your daily, weekly, monthly, quarterly and yearly notes are named and found by **Jalali date** while you are in Jalali mode (for example `1405-08-08.md`).

It is built on [FBarrca's improved fork](https://github.com/FBarrca/obsidian-calendar-plugin) of Liam Cain's [Calendar](https://github.com/liamcain/obsidian-calendar-plugin) plugin, which added quarters, clickable month/year headers and more layout options.

<img width="294" height="386" alt="Gregorian calendar view" src="https://github.com/user-attachments/assets/020ef1ab-a08b-4b9e-9f03-5bfd56885634" />

## Features

**Persian calendar**

- **Gregorian ⇄ Jalali switch** above the calendar (`Gregorian | شمسی`), plus a command. Your choice is remembered.
- The month you are looking at carries over when you switch, and **today's date in the other calendar** is shown next to the switch.
- A real Jalali month grid: Persian month names, Persian digits (optional), weeks starting on **Saturday**, correct month lengths and leap years (for example 30 Esfand 1403 exists, 30 Esfand 1404 does not).
- **All five note types follow the Jalali calendar** in Jalali mode: daily, weekly, monthly, quarterly and yearly. Each has its own filename format, folder and template.
- **Convert date** command: type a date in one calendar, see it in the other, then insert it at the cursor or copy it.
- **Reveal active note** understands Jalali notes and jumps the calendar to the right month.

**Everything from the fork**

- Quarters in the calendar, and clickable month, year and quarter headers that open the monthly, quarterly and yearly notes.
- Week numbers, on the left or the right.
- Ctrl/Cmd-click to open a note in a new tab or split, hover preview, confirm-before-create, word-count and task dots (Gregorian view).

Gregorian mode behaves exactly as before. Existing notes are never renamed or touched.

## Installation

This plugin is not in the community plugin browser. Install it with BRAT or manually.

**BRAT:** install [BRAT](https://obsidian.md/plugins?id=obsidian42-brat), choose *Add beta plugin*, and enter `MehrzadGolabi/obsidian-persian-calendar-plugin`.

**Manually:**

1. Download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/MehrzadGolabi/obsidian-persian-calendar-plugin/releases/latest), or download the `calendar-<version>.zip` and unzip it.
2. In your vault, open `.obsidian/plugins/` (it may be hidden) and create a folder named `calendar`.
3. Put the three files in that folder.
4. Restart Obsidian, then go to **Settings → Community plugins**, turn off Restricted/Safe mode and enable **Calendar**.

If you already use the original Calendar plugin, disable it first: both use the same plugin id (`calendar`).

Requires Obsidian 0.9.11 or newer.

## Using the Jalali calendar

1. Open the calendar (right sidebar, or the command **Calendar: Open view**).
2. Click **شمسی** above the calendar, or run **Toggle Jalali/Gregorian calendar** from the command palette. Click **Gregorian** to go back.
3. Click a day to open or create that day's note. Click the **month**, **year**, **quarter** (if enabled) or a **week number** (if enabled) for the matching note.
4. Ctrl/Cmd-click opens the note in a split (or a new tab, see *Ctrl + Click Behaviour*). Hold Ctrl/Cmd while hovering for a page preview.

### Commands

| Command | What it does |
| --- | --- |
| Open view | Opens the calendar if it was closed. |
| Toggle Jalali/Gregorian calendar | Switches the calendar mode. |
| Convert date between Jalali and Gregorian | Opens the converter (below). |
| Reveal active note | Moves the calendar to the month of the note you have open. |
| Open Weekly Note | Opens this week's note (Gregorian, when Periodic Notes is not handling weekly notes). |

### Converting a date

Run **Convert date between Jalali and Gregorian**. Choose the calendar you are typing in, then enter the date as year-month-day. `-`, `/` and `.` all work, and Persian digits are accepted (`۱۴۰۵/۸/۸`). The modal shows both calendars in numeric and long form and rejects impossible dates. **Insert at cursor** puts the *other* calendar's `YYYY-MM-DD` date into your open note; **Copy** copies it. It opens on today's date in the calendar you are currently viewing.

### How Jalali notes are named

In Jalali mode a note's path is `<folder>/<formatted name>.md`, using the settings for that note type. Defaults:

| Note type | Default format | Example |
| --- | --- | --- |
| Daily | `jYYYY-jMM-jDD` | `1405-08-08` |
| Weekly | `jgggg-[W]jww` | `1405-W32` |
| Monthly | `jYYYY-jMM` | `1405-08` |
| Quarterly | `jYYYY-[Q]jQ` | `1405-Q3` |
| Yearly | `jYYYY` | `1405` |

Filenames always use Latin digits, whatever the *Persian digits* display setting says, so notes stay easy to search and link.

**Format tokens**

| Token | Meaning | Example |
| --- | --- | --- |
| `jYYYY` / `jYY` | Jalali year | `1405` / `05` |
| `jMMMM` | Persian month name | `آبان` |
| `jMM` / `jM` | Month number | `08` / `8` |
| `jDD` / `jD` | Day of month | `08` / `8` |
| `jQ` | Quarter (1–4, three months each) | `3` |
| `jww` / `jw` | Week number (padded / plain) | `06` / `6` |
| `jgggg` | Year the week belongs to | `1405` |
| `[text]` | Literal text | `[W]` gives `W` |

**Weeks.** Weeks run Saturday to Friday. Week 1 is the week that contains 1 Farvardin, and a week is assigned to the Jalali year of its Friday, so a week that straddles the new year is always week 1 of the new year. Use `jgggg` (not `jYYYY`) with `jww` so those weeks get the right year.

**Templates.** Template files work as they do for Gregorian notes, with these variables:

| Variable | Result |
| --- | --- |
| `{{title}}`, `{{date}}` | The note's filename |
| `{{time}}` | The current time (`HH:mm`) |
| `{{date:FORMAT}}` | The note's date in any Jalali format, e.g. `{{date:jD jMMMM jYYYY}}` |
| `{{yesterday}}`, `{{tomorrow}}` | The neighbouring days, in the note's format |

Offsets such as `{{date+1d}}` are not supported in Jalali templates.

## Settings

**General** (apply to both calendars unless noted)

- **Words per dot** (default 250): how many words each dot represents in the Gregorian view. `0` turns it off.
- **Start week on** (Gregorian only): the first day of the week. The Jalali calendar always starts on Saturday.
- **Ctrl + Click Behaviour**: open in a new tab or a new split.
- **Confirm before creating new note** (default on).
- **Show week number** and **Change week number side**: add a week column, on the left or right.
- **Show Quarter**: show the quarter next to the year.

**Jalali Calendar**

- **Persian digits** (default on): show ۰۱۲۳۴۵۶۷۸۹ in the Jalali view.
- For each of daily, weekly, monthly, quarterly and yearly notes: **format**, **folder** and **template**. Folders are created on demand; leave a field empty for the default.

**Advanced**

- **Override locale** (Gregorian only).

Weekly note settings for the Gregorian calendar appear when *Show week number* is on and the Periodic Notes plugin is not managing weekly notes.

## Limitations

- Jalali mode shows a dot under days that have a note. The word-count and open-task dots, and custom sources from other plugins, are Gregorian-view only.
- The [Periodic Notes](https://github.com/liamcain/obsidian-periodic-notes) plugin only knows Gregorian settings. Its integration applies to the Gregorian calendar; Jalali notes use the settings above.
- *Start week on*, *Override locale* and the Gregorian note formats do not affect the Jalali calendar.
- Jalali dates are supported from about year 1 to 3177.
- No holidays or events yet.

## Gregorian calendar

The Gregorian view is the original Calendar plugin view. It reads your Daily Notes (or Periodic Notes) settings for the date format, template and folder, and shows a meter of how much you wrote each day. Solid dots reflect word count (one dot per *Words per dot*, up to five); a hollow dot means the day has unfinished tasks.

### Styling the Gregorian view

The following CSS variables can be overridden in a snippet or your theme:

```css
#calendar-container {
  --color-background-heading: transparent;
  --color-background-day: transparent;
  --color-background-weeknum: transparent;
  --color-background-weekend: transparent;

  --color-dot: var(--text-muted);
  --color-arrow: var(--text-muted);
  --color-button: var(--text-muted);

  --color-text-title: var(--text-normal);
  --color-text-heading: var(--text-muted);
  --color-text-day: var(--text-normal);
  --color-text-today: var(--interactive-accent);
  --color-text-weeknum: var(--text-muted);
}
```

Always prefix overrides with `#calendar-container`, and ignore the generated `svelte-…` class suffixes: they change between releases. The Jalali view uses your theme's own colour variables (`--text-normal`, `--text-accent`, `--background-modifier-hover`, …), so it follows your theme without extra styling.

### Weekly notes in Gregorian mode

If you use weekly notes with the Gregorian calendar, the default format is `gggg-[W]ww` and the template supports these tags:

| Tag | Description |
| --- | --- |
| `sunday` … `saturday` | `{{sunday:gggg-MM-DD}}` inserts that day's date; you must give a format. |
| `title` | The note's title. |
| `date`, `time` | The date and time of the first day of the week. |

## FAQ

**Can I use only the Jalali calendar?** Yes. Switch to Jalali and set *Show week number* / *Show Quarter* as you like. The Gregorian view stays available but hidden.

**Will switching calendars change my notes?** No. Each calendar looks notes up by its own filename format, and nothing is renamed or moved.

**A Jalali note exists but its day has no dot.** The note must be at exactly `<folder>/<name>.md` for that type's current format. Check the folder and format in *Jalali Calendar* settings.

**How do I hide or reopen the calendar?** Right-click the view's tab to close it. Reopen it from the command palette with **Calendar: Open view**.

**Can I move or pin the calendar?** Yes. Drag it to the left sidebar or the main area, where it can also be pinned.

## Development

```bash
yarn install        # also applies the patches in patches/
yarn test           # jest
yarn build          # svelte-check + eslint + rollup, writes main.js
```

The Jalali code lives in `src/jalali/` (dates, month grid, filename parsing, date conversion), `src/io/jalali/` (finding, creating and opening notes) and `src/ui/JalaliCalendar.svelte`. It is built on [`jalaali-js`](https://github.com/jalaali/jalaali-js).

Note: `obsidian-calendar-ui` bundles its own copy of Svelte, so the Gregorian calendar is hidden rather than unmounted when you switch to Jalali. Unmounting it throws and freezes the view.

## Credits

- [Liam Cain](https://github.com/liamcain), author of the original [Calendar](https://github.com/liamcain/obsidian-calendar-plugin) plugin.
- [FBarrca](https://github.com/FBarrca) and contributors, for the improved fork this builds on.
- [MehrzadGolabi](https://github.com/MehrzadGolabi), for the Persian (Jalali) calendar.

Released under the [MIT License](LICENSE).
