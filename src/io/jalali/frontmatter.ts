const FRONTMATTER = /^---\n([\s\S]*?\n)?---[ \t]*(\n|$)/;

const unquote = (value: string) => value.trim().replace(/^(["'])(.*)\1$/, "$2");

/** Add `alias` to the `aliases` of a note's frontmatter, creating either. */
export function addAlias(contents: string, alias: string): string {
  const match = FRONTMATTER.exec(contents);
  if (!match) {
    return `---\naliases: [${alias}]\n---\n${contents}`;
  }

  const lines = (match[1] ?? "").split("\n").slice(0, -1);
  const index = lines.findIndex((line) => /^aliases\s*:/.test(line));
  if (index === -1) {
    lines.push(`aliases: [${alias}]`);
  } else {
    const value = lines[index].replace(/^aliases\s*:/, "").trim();
    if (value) {
      const items = value
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map(unquote)
        .filter(Boolean);
      if (items.includes(alias)) {
        return contents;
      }
      lines[index] = `aliases: [${[...items, alias].join(", ")}]`;
    } else {
      let end = index;
      while (/^\s*-\s*/.test(lines[end + 1] ?? "")) {
        end++;
      }
      const existing = lines
        .slice(index + 1, end + 1)
        .map((line) => unquote(line.replace(/^\s*-\s*/, "")));
      if (existing.includes(alias)) {
        return contents;
      }
      const indent = /^\s*/.exec(lines[end + 1 > index + 1 ? end : index])[0];
      lines.splice(end + 1, 0, `${indent || "  "}- ${alias}`);
    }
  }

  return `---\n${lines.join("\n")}\n---${match[2]}${contents.slice(
    match[0].length
  )}`;
}
