import { tick } from "svelte";
import JalaliCalendar from "./JalaliCalendar.svelte";
import { settings } from "./stores";
import { defaultSettings } from "src/settings";

jest.mock("src/io/jalali/notes", () => ({
  getJalaliNote: jest.fn(() => null),
  getJalaliNotePath: jest.fn(() => "x.md"),
}));

const ymd = (d: Date) => [d.getFullYear(), d.getMonth() + 1, d.getDate()];
const today = new Date(2026, 9, 30, 12); // 8 Aban 1405

function mount(overrides = {}) {
  settings.set({ ...defaultSettings, ...overrides } as never);
  const target = document.createElement("div");
  document.body.appendChild(target);
  const onClick = jest.fn();
  const component = new JalaliCalendar({
    target,
    props: {
      today,
      onClick,
      onHover: jest.fn(),
      onContextMenu: jest.fn(),
    },
  });
  return { target, onClick, component };
}

const dayCells = (t: HTMLElement) =>
  Array.from(t.querySelectorAll<HTMLElement>(".pcal-day:not(.outside)"));

afterEach(() => (document.body.innerHTML = ""));

test("shows the Jalali month and year with Persian digits", () => {
  const { target } = mount();
  const links = target.querySelectorAll(".pcal-title .pcal-link");
  expect(links[0].textContent).toBe("آبان");
  expect(links[1].textContent).toBe("۱۴۰۵");
  expect(dayCells(target)).toHaveLength(30);
});

test("Latin digits when the setting is off", () => {
  const { target } = mount({ jalaliPersianDigits: false });
  expect(target.querySelectorAll(".pcal-title .pcal-link")[1].textContent).toBe("1405");
});

test("highlights today", () => {
  const { target } = mount();
  expect(target.querySelector(".pcal-day.today")?.textContent).toContain("۸");
});

test("Saturday is the rightmost column (last in DOM order)", () => {
  const { target } = mount();
  const headers = Array.from(target.querySelectorAll(".pcal-weekday"));
  expect(headers[headers.length - 1].textContent).toBe("ش");
  expect(headers[0].textContent).toBe("ج");
});

test("clicking a day reports the matching Gregorian date", () => {
  const { target, onClick } = mount();
  dayCells(target)[0].click(); // 1 Aban
  expect(onClick).toHaveBeenCalledTimes(1);
  const [period, date, ctrl] = onClick.mock.calls[0];
  expect(period).toBe("day");
  expect(ymd(date)).toEqual([2026, 10, 23]);
  expect(ctrl).toBe(false);
});

test("previous / next month buttons navigate", async () => {
  const { target } = mount();
  const title = () =>
    target.querySelector(".pcal-title .pcal-link")?.textContent;
  const [prev, next] = Array.from(
    target.querySelectorAll<HTMLElement>(".pcal-nav")
  );
  prev.click();
  await tick();
  expect(title()).toBe("مهر");
  next.click();
  await tick();
  next.click();
  await tick();
  expect(title()).toBe("آذر");
});

test("navigating past Esfand moves into the next Jalali year", () => {
  const { target, component } = mount();
  component.$set({ displayed: new Date(2027, 2, 15, 12) }); // Esfand 1405
  return Promise.resolve().then(() => {
    const links = target.querySelectorAll(".pcal-title .pcal-link");
    expect(links[0].textContent).toBe("اسفند");
    (target.querySelectorAll(".pcal-nav")[1] as HTMLElement).click();
    return Promise.resolve().then(() => {
      expect(target.querySelectorAll(".pcal-title .pcal-link")[0].textContent).toBe("فروردین");
      expect(target.querySelectorAll(".pcal-title .pcal-link")[1].textContent).toBe("۱۴۰۶");
    });
  });
});

test("week column and quarter chip follow settings", () => {
  const off = mount();
  expect(off.target.querySelector(".pcal-week-cell.pcal-link")).toBeNull();
  expect(off.target.querySelector(".pcal-quarter")).toBeNull();
  document.body.innerHTML = "";

  const on = mount({ showWeeklyNote: true, showQuarter: true });
  expect(on.target.querySelectorAll(".pcal-week-cell.pcal-link").length).toBeGreaterThan(3);
  expect(on.target.querySelector(".pcal-quarter")?.textContent).toBe("Q۳");
  const firstRow = on.target.querySelectorAll(".pcal-row")[1];
  expect(firstRow.firstElementChild?.classList.contains("pcal-week-cell")).toBe(true);
});

test("week column goes last when 'right' is set", () => {
  const { target } = mount({ showWeeklyNote: true, showWeeklyNoteRight: true });
  const row = target.querySelectorAll(".pcal-row")[1];
  expect(row.lastElementChild?.classList.contains("pcal-week-cell")).toBe(true);
});
