import { tick } from "svelte";
import moment from "moment";

import Calendar from "./Calendar.svelte";
import { settings } from "./stores";
import { defaultSettings } from "src/settings";

jest.mock(
  "obsidian",
  () => ({
    TFile: class {},
    PluginSettingTab: class {},
    Setting: class {},
    normalizePath: (p: string) => p,
  }),
  { virtual: true }
);
jest.mock("obsidian-daily-notes-interface", () => ({
  getAllDailyNotes: () => ({}),
  getAllWeeklyNotes: () => ({}),
  getAllMonthlyNotes: () => ({}),
  getAllYearlyNotes: () => ({}),
  getAllQuarterlyNotes: () => ({}),
  getDateFromFile: () => null,
  getDateUID: () => "uid",
}));
jest.mock("src/io/jalali/notes", () => ({
  getJalaliNote: () => null,
  getJalaliNotePath: () => "x.md",
}));

function mount() {
  (window as any).moment = moment;
  (window as any).app = { isMobile: false };
  settings.set({ ...defaultSettings } as never);
  const target = document.createElement("div");
  document.body.appendChild(target);
  const noop = jest.fn();
  new Calendar({
    target,
    props: {
      sources: [],
      onHoverDay: noop, onHoverWeek: noop, onClickDay: noop, onClickWeek: noop,
      onClickMonth: noop, onClickYear: noop, onClickQuarter: noop,
      onContextMenuDay: noop, onContextMenuWeek: noop,
      onSetMode: (calendarMode: string) =>
        settings.update((s) => ({ ...s, calendarMode } as never)),
      onClickJalali: noop, onHoverJalali: noop, onContextMenuJalali: noop,
    },
  });
  return target;
}

const switchBtn = (t: HTMLElement, label: string) =>
  Array.from(t.querySelectorAll<HTMLElement>(".calendar-mode-switch button")).find(
    (b) => b.textContent === label
  )!;

afterEach(() => (document.body.innerHTML = ""));

const baseHidden = (t: HTMLElement) =>
  t.querySelector<HTMLElement>(".calendar-base")!.style.display === "none";

test("toggling Gregorian -> Jalali -> Gregorian re-renders each time", async () => {
  const target = mount();
  expect(target.querySelector(".pcal")).toBeNull();
  expect(baseHidden(target)).toBe(false);

  switchBtn(target, "شمسی").click();
  await tick();
  expect(target.querySelector(".pcal")).not.toBeNull();
  expect(baseHidden(target)).toBe(true);

  switchBtn(target, "Gregorian").click();
  await tick();
  expect(target.querySelector(".pcal")).toBeNull();
  expect(baseHidden(target)).toBe(false);

  switchBtn(target, "شمسی").click();
  await tick();
  expect(target.querySelector(".pcal")).not.toBeNull();
  expect(baseHidden(target)).toBe(true);
});

test("the viewed month carries over when switching", async () => {
  const target = mount();
  switchBtn(target, "شمسی").click();
  await tick();
  // today's Jalali month is shown, not an arbitrary one
  const month = target.querySelector(".pcal-title .pcal-link")!.textContent;
  const expected = new Intl.DateTimeFormat("en-u-ca-persian", { month: "numeric" })
    .format(new Date());
  const names = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
  expect(month).toBe(names[Number(expected) - 1]);
});
