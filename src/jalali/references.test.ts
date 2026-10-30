import { fromJalali, toJalali } from "./dates";
import {
  getReferencePhrases,
  parsePlaceholderTrigger,
  parseReferenceTrigger,
  resolveReference,
} from "./references";

const today = new Date(2026, 9, 30, 12); // 8 Aban 1405, a Friday
const phrases = getReferencePhrases(today);
const resolve = (label: string, openNote: Date | null = null) => {
  const phrase = phrases.find((p) => p.label === label);
  if (!phrase) {
    throw new Error(`no phrase ${label}`);
  }
  const { period, date } = resolveReference(phrase, openNote, today);
  const { year, month, day } = toJalali(date);
  return { period, jalali: [year, month, day] };
};

describe("phrases", () => {
  test("every phrase from the spec is offered", () => {
    const labels = phrases.map((p) => p.label);
    [
      "امروز",
      "دیروز",
      "فردا",
      "پریروز",
      "پس‌فردا",
      "روز بعد",
      "روز قبل",
      "این هفته",
      "هفته قبل",
      "هفته بعد",
      "این ماه",
      "ماه قبل",
      "ماه بعد",
      "این فصل",
      "فصل قبل",
      "فصل بعد",
      "امسال",
      "سال قبل",
      "سال بعد",
    ].forEach((label) => expect(labels).toContain(label));
  });

  test("today's weekday name is offered", () => {
    expect(phrases.map((p) => p.label)).toContain("جمعه");
  });
});

describe("fixed phrases resolve against today", () => {
  test("days", () => {
    expect(resolve("امروز")).toEqual({ period: "day", jalali: [1405, 8, 8] });
    expect(resolve("دیروز").jalali).toEqual([1405, 8, 7]);
    expect(resolve("فردا").jalali).toEqual([1405, 8, 9]);
    expect(resolve("پریروز").jalali).toEqual([1405, 8, 6]);
    expect(resolve("پس‌فردا").jalali).toEqual([1405, 8, 10]);
  });

  test("this week, month, season and year", () => {
    expect(resolve("این هفته").period).toBe("week");
    expect(resolve("این ماه").period).toBe("month");
    expect(resolve("این فصل").period).toBe("quarter");
    expect(resolve("امسال").period).toBe("year");
  });

  test("today's weekday name is today's note", () => {
    expect(resolve("جمعه")).toEqual({ period: "day", jalali: [1405, 8, 8] });
  });

  test("an open note does not move them", () => {
    expect(resolve("فردا", fromJalali(1400, 1, 1)).jalali).toEqual([1405, 8, 9]);
  });
});

describe("relative phrases", () => {
  const openNote = fromJalali(1405, 1, 15);

  test("shift the open note's date", () => {
    expect(resolve("روز بعد", openNote).jalali).toEqual([1405, 1, 16]);
    expect(resolve("ماه قبل", openNote)).toEqual({
      period: "month",
      jalali: [1404, 12, 15],
    });
    expect(resolve("هفته بعد", openNote).period).toBe("week");
    expect(resolve("فصل بعد", openNote).period).toBe("quarter");
  });

  test("fall back to today without an open calendar note", () => {
    expect(resolve("روز قبل").jalali).toEqual([1405, 8, 7]);
    expect(resolve("ماه بعد").jalali).toEqual([1405, 9, 8]);
  });

  test("next year from the leap day lands on the last day", () => {
    expect(resolve("سال بعد", fromJalali(1403, 12, 30)).jalali).toEqual([
      1404, 12, 29,
    ]);
  });
});

describe("parseReferenceTrigger", () => {
  test("link form", () => {
    expect(parseReferenceTrigger("task @این ه")).toEqual({
      start: 5,
      plain: false,
      query: "این ه",
    });
  });

  test("plain-text form", () => {
    expect(parseReferenceTrigger("@/")).toEqual({
      start: 0,
      plain: true,
      query: "",
    });
  });

  test("an @ inside a word is not a trigger", () => {
    expect(parseReferenceTrigger("mail a@b.com")).toBeNull();
    expect(parseReferenceTrigger("no at sign")).toBeNull();
  });

  test("@ followed by a space is not a trigger", () => {
    expect(parseReferenceTrigger("meet @ ")).toBeNull();
    expect(parseReferenceTrigger("@  ")).toBeNull();
  });

  test("a bare @ still opens the list", () => {
    expect(parseReferenceTrigger("meet @")).toEqual({
      start: 5,
      plain: false,
      query: "",
    });
  });

  test("a long run after @ is not a trigger", () => {
    expect(parseReferenceTrigger("@" + "x".repeat(40))).toBeNull();
  });
});

describe("parsePlaceholderTrigger", () => {
  test("covers a closing pair after the cursor", () => {
    expect(parsePlaceholderTrigger("x {{سال", "}} y")).toEqual({
      start: 2,
      end: 9,
      query: "سال",
    });
  });

  test("without a closing pair it ends at the cursor", () => {
    expect(parsePlaceholderTrigger("{{", "")).toEqual({
      start: 0,
      end: 2,
      query: "",
    });
  });

  test("a finished placeholder is not a trigger", () => {
    expect(parsePlaceholderTrigger("{{done}}", " x")).toBeNull();
  });
});
