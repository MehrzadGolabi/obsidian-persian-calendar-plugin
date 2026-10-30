<svelte:options immutable />

<script lang="ts">
  import type { JalaliPeriod } from "src/jalali/dates";
  import {
    fromJalali,
    JALALI_MONTHS,
    quarterOf,
    toJalali,
    toPersianDigits,
  } from "src/jalali/dates";
  import { buildMonthGrid } from "src/jalali/grid";
  import { getJalaliNote, getJalaliNotePath } from "src/io/jalali/notes";
  import { activeFilePath, jalaliRevision, settings } from "./stores";

  export let today: Date;
  export let displayed: Date = today;
  export let onClick: (
    period: JalaliPeriod,
    date: Date,
    ctrlPressed: boolean
  ) => void;
  export let onHover: (
    period: JalaliPeriod,
    date: Date,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ) => void;
  export let onContextMenu: (
    period: JalaliPeriod,
    date: Date,
    event: MouseEvent
  ) => void;

  // Visual order is right-to-left, so Saturday ends up on the right.
  const WEEKDAY_LETTERS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
  const weekdayHeaders = [...WEEKDAY_LETTERS].reverse();

  $: ({ year, month } = toJalali(displayed));
  $: grid = buildMonthGrid(year, month);
  $: todayKey = key(today);
  $: digits = (v: number | string) =>
    $settings.jalaliPersianDigits ? toPersianDigits(v) : String(v);

  function key(d: Date): string {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  function shiftMonth(delta: number) {
    const total = year * 12 + (month - 1) + delta;
    displayed = fromJalali(Math.floor(total / 12), (total % 12) + 1, 1);
  }

  // `revision` is only here so Svelte re-runs the lookup when notes change.
  function noteExists(period: JalaliPeriod, date: Date, _revision: number) {
    return !!getJalaliNote($settings, period, date);
  }

  function isActive(period: JalaliPeriod, date: Date, path: string | null) {
    return !!path && getJalaliNotePath($settings, period, date) === path;
  }

  const meta = (e: MouseEvent) => e.ctrlKey || e.metaKey;
</script>

<div class="pcal">
  <div class="pcal-header" dir="rtl">
    <button class="pcal-nav" aria-label="ماه قبل" on:click={() => shiftMonth(-1)}
      >›</button
    >
    <div class="pcal-title">
      <span
        class="pcal-link"
        class:has-note={noteExists("month", displayed, $jalaliRevision)}
        class:active={isActive("month", displayed, $activeFilePath)}
        on:click={(e) => onClick("month", displayed, meta(e))}
        on:mouseenter={(e) => onHover("month", displayed, e.target, meta(e))}
        on:contextmenu={(e) => onContextMenu("month", displayed, e)}
        >{JALALI_MONTHS[month - 1]}</span
      >
      <span
        class="pcal-link"
        class:has-note={noteExists("year", displayed, $jalaliRevision)}
        class:active={isActive("year", displayed, $activeFilePath)}
        on:click={(e) => onClick("year", displayed, meta(e))}
        on:mouseenter={(e) => onHover("year", displayed, e.target, meta(e))}
        on:contextmenu={(e) => onContextMenu("year", displayed, e)}
        >{digits(year)}</span
      >
      {#if $settings.showQuarter}
        <span
          class="pcal-link pcal-quarter"
          class:has-note={noteExists("quarter", displayed, $jalaliRevision)}
          class:active={isActive("quarter", displayed, $activeFilePath)}
          on:click={(e) => onClick("quarter", displayed, meta(e))}
          on:mouseenter={(e) =>
            onHover("quarter", displayed, e.target, meta(e))}
          on:contextmenu={(e) => onContextMenu("quarter", displayed, e)}
          >{digits(`Q${quarterOf(month)}`)}</span
        >
      {/if}
    </div>
    <button class="pcal-nav" aria-label="ماه بعد" on:click={() => shiftMonth(1)}
      >‹</button
    >
    <button class="pcal-today" on:click={() => (displayed = today)}>امروز</button>
  </div>

  <div class="pcal-grid">
    <div class="pcal-row pcal-weekdays">
      {#if $settings.showWeeklyNote && !$settings.showWeeklyNoteRight}
        <span class="pcal-week-cell" />
      {/if}
      {#each weekdayHeaders as letter}
        <span class="pcal-weekday">{letter}</span>
      {/each}
      {#if $settings.showWeeklyNote && $settings.showWeeklyNoteRight}
        <span class="pcal-week-cell" />
      {/if}
    </div>

    {#each grid as row (row.weekStart.getTime())}
      <div class="pcal-row">
        {#if $settings.showWeeklyNote && !$settings.showWeeklyNoteRight}
          <span
            class="pcal-week-cell pcal-link"
            class:has-note={noteExists("week", row.weekStart, $jalaliRevision)}
            class:active={isActive("week", row.weekStart, $activeFilePath)}
            on:click={(e) => onClick("week", row.weekStart, meta(e))}
            on:mouseenter={(e) =>
              onHover("week", row.weekStart, e.target, meta(e))}
            on:contextmenu={(e) => onContextMenu("week", row.weekStart, e)}
            >{digits(row.week)}</span
          >
        {/if}
        {#each [...row.days].reverse() as day (day.date.getTime())}
          <span
            class="pcal-day"
            class:outside={!day.inMonth}
            class:today={key(day.date) === todayKey}
            class:active={isActive("day", day.date, $activeFilePath)}
            on:click={(e) => onClick("day", day.date, meta(e))}
            on:mouseenter={(e) => onHover("day", day.date, e.target, meta(e))}
            on:contextmenu={(e) => onContextMenu("day", day.date, e)}
          >
            {digits(day.jDay)}
            <i class="pcal-dot" class:filled={noteExists("day", day.date, $jalaliRevision)} />
          </span>
        {/each}
        {#if $settings.showWeeklyNote && $settings.showWeeklyNoteRight}
          <span
            class="pcal-week-cell pcal-link"
            class:has-note={noteExists("week", row.weekStart, $jalaliRevision)}
            class:active={isActive("week", row.weekStart, $activeFilePath)}
            on:click={(e) => onClick("week", row.weekStart, meta(e))}
            on:mouseenter={(e) =>
              onHover("week", row.weekStart, e.target, meta(e))}
            on:contextmenu={(e) => onContextMenu("week", row.weekStart, e)}
            >{digits(row.week)}</span
          >
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .pcal {
    padding: 0 8px;
    user-select: none;
  }
  .pcal-header {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 8px;
  }
  .pcal-title {
    flex: 1;
    display: flex;
    justify-content: center;
    gap: 6px;
    font-weight: 600;
    font-size: 1.1em;
  }
  .pcal-nav,
  .pcal-today {
    background: none;
    box-shadow: none;
    padding: 2px 8px;
    height: auto;
    color: var(--text-muted);
  }
  .pcal-nav {
    font-size: 1.4em;
    line-height: 1;
  }
  .pcal-today {
    font-size: 0.8em;
  }
  .pcal-link {
    cursor: pointer;
    border-radius: 4px;
    padding: 0 4px;
  }
  .pcal-link:hover,
  .pcal-day:hover {
    background-color: var(--background-modifier-hover);
  }
  .pcal-link.has-note {
    color: var(--text-accent);
  }
  .pcal-link.active,
  .pcal-day.active {
    background-color: var(--background-modifier-active-hover);
  }
  .pcal-row {
    display: flex;
  }
  .pcal-weekdays {
    color: var(--text-muted);
    font-size: 0.8em;
    margin-bottom: 4px;
  }
  .pcal-weekday,
  .pcal-day,
  .pcal-week-cell {
    flex: 1 1 0;
    text-align: center;
    min-width: 0;
  }
  .pcal-week-cell {
    color: var(--text-faint);
    font-size: 0.8em;
    padding: 6px 0;
  }
  .pcal-day {
    position: relative;
    cursor: pointer;
    border-radius: 4px;
    padding: 6px 0 10px;
  }
  .pcal-day.outside {
    color: var(--text-faint);
  }
  .pcal-day.today {
    color: var(--text-accent);
    font-weight: 700;
  }
  .pcal-dot {
    position: absolute;
    bottom: 3px;
    left: calc(50% - 2px);
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: transparent;
  }
  .pcal-dot.filled {
    background: var(--text-muted);
  }
</style>
