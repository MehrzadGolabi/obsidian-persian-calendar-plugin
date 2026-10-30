import { applyJalaliTemplate } from "./template";

const date = new Date(2026, 9, 30, 12); // 8 Aban 1405
const FORMAT = "jYYYY-jMM-jDD";
const apply = (tpl: string) =>
  applyJalaliTemplate(tpl, {
    date,
    format: FORMAT,
    filename: "1405-08-08",
    time: "09:30",
  });

test("date and title use the note filename", () => {
  expect(apply("# {{title}} ({{ date }})")).toBe("# 1405-08-08 (1405-08-08)");
});

test("time", () => {
  expect(apply("at {{time}}")).toBe("at 09:30");
});

test("date with an explicit Jalali format", () => {
  expect(apply("{{date:jD jMMMM jYYYY}}")).toBe("8 آبان 1405");
});

test("yesterday / tomorrow use the note format", () => {
  expect(apply("{{yesterday}} | {{tomorrow}}")).toBe("1405-08-07 | 1405-08-09");
});

test("tomorrow rolls over the Jalali month end", () => {
  const last = new Date(2026, 10, 21, 12); // 30 Aban 1405
  expect(
    applyJalaliTemplate("{{tomorrow}}", {
      date: last,
      format: FORMAT,
      filename: "x",
      time: "",
    })
  ).toBe("1405-09-01");
});

test("unknown placeholders are left alone", () => {
  expect(apply("{{foo}}")).toBe("{{foo}}");
});
