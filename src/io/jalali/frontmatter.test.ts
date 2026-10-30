import { addAlias } from "./frontmatter";

const ALIAS = "2026-10-30";
const add = (contents: string) => addAlias(contents, ALIAS);

test("an empty note gets a frontmatter block", () => {
  expect(add("")).toBe(`---\naliases: [${ALIAS}]\n---\n`);
});

test("a note without frontmatter gets one before the body", () => {
  expect(add("# Hello\n")).toBe(`---\naliases: [${ALIAS}]\n---\n# Hello\n`);
});

test("frontmatter without aliases gets an aliases line", () => {
  expect(add("---\ntitle: x\n---\nbody")).toBe(
    `---\ntitle: x\naliases: [${ALIAS}]\n---\nbody`
  );
});

test("an inline aliases list is extended", () => {
  expect(add("---\naliases: [a, b]\n---\n")).toBe(
    `---\naliases: [a, b, ${ALIAS}]\n---\n`
  );
});

test("an empty inline aliases list is filled", () => {
  expect(add("---\naliases: []\n---\n")).toBe(`---\naliases: [${ALIAS}]\n---\n`);
});

test("a block aliases list is extended", () => {
  expect(add("---\naliases:\n  - a\n  - b\ntags: t\n---\nbody")).toBe(
    `---\naliases:\n  - a\n  - b\n  - ${ALIAS}\ntags: t\n---\nbody`
  );
});

test("a single-value aliases line becomes a list", () => {
  expect(add("---\naliases: a\n---\n")).toBe(`---\naliases: [a, ${ALIAS}]\n---\n`);
});

test("an alias that is already there is not added twice", () => {
  const inline = `---\naliases: [${ALIAS}]\n---\n`;
  const block = `---\naliases:\n  - ${ALIAS}\n---\n`;
  expect(add(inline)).toBe(inline);
  expect(add(block)).toBe(block);
});

test("a horizontal rule in the body is not mistaken for frontmatter", () => {
  expect(add("text\n---\nmore\n---\n")).toBe(
    `---\naliases: [${ALIAS}]\n---\ntext\n---\nmore\n---\n`
  );
});

test("an unindented block list keeps its indentation", () => {
  expect(add("---\naliases:\n- foo\n- bar\ntags: x\n---\n")).toBe(
    `---\naliases:\n- foo\n- bar\n- ${ALIAS}\ntags: x\n---\n`
  );
});

test("CRLF frontmatter is extended, not duplicated", () => {
  expect(add("---\r\ntags: x\r\n---\r\nbody\r\n")).toBe(
    `---\r\ntags: x\r\naliases: [${ALIAS}]\r\n---\r\nbody\r\n`
  );
});

test("a CRLF note without frontmatter gets a CRLF block", () => {
  expect(add("body\r\nmore\r\n")).toBe(
    `---\r\naliases: [${ALIAS}]\r\n---\r\nbody\r\nmore\r\n`
  );
});
