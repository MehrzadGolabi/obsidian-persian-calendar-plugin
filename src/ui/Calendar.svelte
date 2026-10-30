<svelte:options immutable />

<script lang="ts">
  import type { Moment } from "moment";
  import {
    Calendar as CalendarBase,
    ICalendarSource,
    configureGlobalMomentLocale,
  } from "obsidian-calendar-ui";
  import { onDestroy } from "svelte";

  import type { JalaliPeriod } from "src/jalali/dates";
  import { formatJalali, toPersianDigits } from "src/jalali/dates";
  import type { CalendarMode, ISettings } from "src/settings";
  import JalaliCalendar from "./JalaliCalendar.svelte";
  import { activeFile, dailyNotes, monthlyNotes, quarterlyNotes, settings, weeklyNotes, yearlyNotes } from "./stores";

  let today: Moment;

  $: today = getToday($settings);

  export let displayedMonth: Moment = today;
  export let sources: ICalendarSource[];
  export let onHoverDay: (date: Moment, targetEl: EventTarget) => boolean;
  export let onHoverWeek: (date: Moment, targetEl: EventTarget) => boolean;
  export let onClickDay: (date: Moment, isMetaPressed: boolean) => boolean;
  export let onClickWeek: (date: Moment, isMetaPressed: boolean) => boolean;
  export let onClickMonth: (date: Moment, isMetaPressed: boolean) => boolean;
  export let onClickYear: (date: Moment, isMetaPressed: boolean) => boolean;
  export let onClickQuarter: (date: Moment, isMetaPressed: boolean) => boolean;
 
  export let onContextMenuDay: (date: Moment, event: MouseEvent) => boolean;
  export let onContextMenuWeek: (date: Moment, event: MouseEvent) => boolean;

  export let onSetMode: (mode: CalendarMode) => void;
  export let onClickJalali: (
    period: JalaliPeriod,
    date: Date,
    ctrlPressed: boolean
  ) => void;
  export let onHoverJalali: (
    period: JalaliPeriod,
    date: Date,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ) => void;
  export let onContextMenuJalali: (
    period: JalaliPeriod,
    date: Date,
    event: MouseEvent
  ) => void;

  let mode: CalendarMode = $settings.calendarMode;
  export let jalaliDisplayed: Date = new Date();

  // Switching calendars keeps the month being viewed: that is the conversion.
  $: if ($settings.calendarMode !== mode) {
    if ($settings.calendarMode === "jalali") {
      jalaliDisplayed = displayedMonth.toDate();
    } else {
      displayedMonth = window.moment(jalaliDisplayed);
    }
    mode = $settings.calendarMode;
  }

  // Today's date in the calendar that isn't currently shown.
  $: otherToday =
    mode === "jalali"
      ? today.format("D MMM YYYY")
      : (($settings.jalaliPersianDigits ? toPersianDigits : String)(
          formatJalali(today.toDate(), "jD jMMMM jYYYY")
        ) as string);

  export function tick() {
    today = window.moment();
  }

  function getToday(settings: ISettings) {
    configureGlobalMomentLocale(settings.localeOverride, settings.weekStart);
    dailyNotes.reindex();
    weeklyNotes.reindex();
    monthlyNotes.reindex();
    yearlyNotes.reindex();
    quarterlyNotes.reindex();
    return window.moment();
  }

  // 1 minute heartbeat to keep `today` reflecting the current day
  let heartbeat = setInterval(() => {
    tick();

    const isViewingCurrentMonth = displayedMonth.isSame(today, "day");
    if (isViewingCurrentMonth) {
      // if it's midnight on the last day of the month, this will
      // update the display to show the new month.
      displayedMonth = today;
    }
  }, 1000 * 60);

  onDestroy(() => {
    clearInterval(heartbeat);
  });
</script>

<div class="calendar-mode-bar">
  <div class="calendar-mode-switch">
    <button
      class:active={mode === "gregorian"}
      on:click={() => onSetMode("gregorian")}>Gregorian</button
    >
    <button class:active={mode === "jalali"} on:click={() => onSetMode("jalali")}
      >شمسی</button
    >
  </div>
  <span class="calendar-mode-other" title="Today in the other calendar"
    >{otherToday}</span
  >
</div>

{#if mode === "jalali"}
  <JalaliCalendar
    today={today.toDate()}
    bind:displayed={jalaliDisplayed}
    onClick={onClickJalali}
    onHover={onHoverJalali}
    onContextMenu={onContextMenuJalali}
  />
{/if}

<!--
  CalendarBase must stay mounted and is only hidden: obsidian-calendar-ui
  bundles its own copy of the Svelte runtime, so unmounting it from an {#if}
  runs its outro with an uninitialised `outros` and throws, which wedges
  Svelte's update loop and freezes the whole view.
-->
<div class="calendar-base" style="display: {mode === 'jalali' ? 'none' : 'block'}">
<CalendarBase
  {sources}
  {today}
  {onHoverDay}
  {onHoverWeek}
  {onContextMenuDay}
  {onContextMenuWeek}
  {onClickDay}
  {onClickWeek}
  {onClickMonth}
  {onClickYear}
  {onClickQuarter}
  bind:displayedMonth
  localeData={today.localeData()}
  selectedId={$activeFile}
  showWeekNums={$settings.showWeeklyNote}
  showWeekNumsRight={$settings.showWeeklyNoteRight}
  quarterVisible={$settings.showQuarter}
/>
</div>

<style>
  .calendar-mode-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 0 8px 6px;
    font-size: 0.8em;
  }
  .calendar-mode-switch {
    display: flex;
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    overflow: hidden;
  }
  .calendar-mode-switch button {
    background: none;
    box-shadow: none;
    border-radius: 0;
    height: auto;
    padding: 2px 10px;
    color: var(--text-muted);
  }
  .calendar-mode-switch button.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }
  .calendar-mode-other {
    color: var(--text-muted);
  }
</style>
