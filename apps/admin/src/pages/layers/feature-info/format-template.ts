const VOID_TAGS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
  "source", "track", "wbr",
]);

const BLOCK_TAGS = new Set([
  "address", "article", "aside", "blockquote", "body", "caption", "colgroup",
  "dd", "details", "dialog", "div", "dl", "dt", "fieldset", "figcaption",
  "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head",
  "header", "html", "li", "main", "nav", "ol", "p", "pre", "section", "style",
  "script", "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "title",
  "tr", "ul",
]);

const RAW_TAGS = new Set(["pre", "script", "style", "textarea"]);

type Token =
  | { kind: "text"; value: string }
  | {
      kind: "tag";
      raw: string;
      name: string;
      closing: boolean;
      selfClosing: boolean;
    }
  | { kind: "comment"; raw: string };

const TAG_PATTERN = /<!--[\s\S]*?-->|<\/?[a-zA-Z][\w-]*(?:\s[^<>]*)?>/g;

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  for (const match of source.matchAll(TAG_PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) tokens.push({ kind: "text", value: source.slice(last, index) });
    const raw = match[0];
    if (raw.startsWith("<!--")) {
      tokens.push({ kind: "comment", raw });
    } else {
      const name = /^<\/?([a-zA-Z][\w-]*)/.exec(raw)?.[1]?.toLowerCase() ?? "";
      tokens.push({
        kind: "tag",
        raw,
        name,
        closing: raw.startsWith("</"),
        selfClosing: VOID_TAGS.has(name) || raw.endsWith("/>"),
      });
    }
    last = index + raw.length;
  }
  if (last < source.length) tokens.push({ kind: "text", value: source.slice(last) });
  return tokens;
}

function isMarkdownLine(line: string): boolean {
  return /^(?:#{1,6}(?:\s|$)|[-*+]\s|\d+\.\s|>|```|\||={3,}|-{3,})$/.test(line.trim());
}

function isTableRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.split("|").length >= 3;
}

function tableCells(row: string): string[] {
  const trimmed = row.trim();
  const cells = trimmed.split("|");
  if (trimmed.startsWith("|")) cells.shift();
  if (trimmed.endsWith("|")) cells.pop();
  return cells.map((cell) => cell.trim());
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-+:?$/.test(cell));
}

function separatorCell(source: string, width: number): string {
  const size = Math.max(3, width);
  if (source.startsWith(":") && source.endsWith(":")) return `:${"-".repeat(size - 2)}:`;
  if (source.endsWith(":")) return `${"-".repeat(size - 1)}:`;
  if (source.startsWith(":")) return `:${"-".repeat(size - 1)}`;
  return "-".repeat(size);
}

/** Lines a markdown table up and drops a blank row that would split it in two. */
function alignTable(rows: string[]): string[] {
  const parsed = rows.map(tableCells);
  const columns = Math.max(...parsed.map((cells) => cells.length));
  const widths = Array.from({ length: columns }, (_, column) =>
    parsed.reduce((width, cells) => {
      if (isSeparatorRow(cells)) return width;
      return Math.max(width, (cells[column] ?? "").length);
    }, 3),
  );
  return parsed.map((cells) => {
    const separator = isSeparatorRow(cells);
    const padded = Array.from({ length: columns }, (_, column) => {
      const value = cells[column] ?? "";
      const width = widths[column] ?? 3;
      return separator ? separatorCell(value, width) : value.padEnd(width, " ");
    });
    return `| ${padded.join(" | ")} |`;
  });
}


function formatMarkdownLines(lines: string[], inFence: boolean): string[] {
  const formatted: string[] = [];
  let fence = inFence;
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (line.trim().startsWith("```")) {
      formatted.push(line);
      fence = !fence;
      index += 1;
      continue;
    }
    if (!fence && /^#{1,6}$/.test(line.trim())) {
      let marks = line.trim();
      index += 1;
      while (/^#{1,6}$/.test((lines[index] ?? "").trim())) {
        marks += (lines[index] ?? "").trim();
        index += 1;
      }
      const next = lines[index] ?? "";
      if (next.trim().startsWith("#")) {
        formatted.push(marks + next.trim());
        index += 1;
      } else {
        formatted.push(marks);
      }
      continue;
    }
    if (!fence && isTableRow(line)) {
      const block: string[] = [];
      while (index < lines.length) {
        const current = lines[index] ?? "";
        if (isTableRow(current)) {
          block.push(current);
          index += 1;
          continue;
        }
        if (current.trim() === "" && isTableRow(lines[index + 1] ?? "")) {
          index += 1;
          continue;
        }
        break;
      }
      formatted.push(...alignTable(block));
      continue;
    }
    formatted.push(line);
    index += 1;
  }
  return formatted;
}

function indentOf(depth: number): string {
  return "  ".repeat(depth);
}

function ifDelta(text: string): number {
  const opens = text.match(/\{\{if\b/gi)?.length ?? 0;
  const closes = text.match(/\{\{\/if\}\}/gi)?.length ?? 0;
  return opens - closes;
}

function inlineIfEnd(tokens: Token[], start: number, end: number): number {
  const first = tokens[start];
  if (first?.kind !== "text" || ifDelta(first.value) <= 0) return -1;
  let balance = 0;
  for (let index = start; index < end; index += 1) {
    const token = tokens[index];
    if (!token) return -1;
    if (token.kind === "tag" && !token.closing && BLOCK_TAGS.has(token.name)) return -1;
    if (token.kind === "text") balance += ifDelta(token.value);
    if (balance <= 0 && index > start) return index;
  }
  return -1;
}

function findClose(tokens: Token[], start: number, name: string): number {
  let nested = 1;
  for (let index = start; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token?.kind !== "tag" || token.name !== name) continue;
    if (token.closing) {
      nested -= 1;
      if (nested === 0) return index;
    } else if (!token.selfClosing) {
      nested += 1;
    }
  }
  return -1;
}

interface Writer {
  out: string;
  depth: number;
  atLineStart: boolean;
  fence: boolean;
  stack: string[];
}

function newline(writer: Writer) {
  writer.out += "\n";
  writer.atLineStart = true;
}

function write(writer: Writer, text: string) {
  if (writer.atLineStart) {
    writer.out += indentOf(writer.depth);
    writer.atLineStart = false;
  }
  writer.out += text;
}

function writeOwnLine(writer: Writer, text: string) {
  if (!writer.atLineStart) newline(writer);
  write(writer, text);
  newline(writer);
}

function contentLines(value: string): string[] {
  const parts = value.split("\n");
  if (parts[0]?.trim() === "") parts.shift();
  if (parts.at(-1)?.trim() === "") parts.pop();
  return parts;
}

function writeText(writer: Writer, value: string) {
  if (value.trim() === "") return;
  const parts = formatMarkdownLines(contentLines(value), writer.fence);
  parts.forEach((part, index) => {
    if (index > 0) newline(writer);
    if (part.trim() === "") {
      if (index === 0) newline(writer);
      return;
    }
    const toggle = part.trim().startsWith("```");
    const markdown = writer.fence || toggle || isMarkdownLine(part);
    if (toggle) writer.fence = !writer.fence;
    if (markdown) {
      if (!writer.atLineStart) newline(writer);
      writer.out += part;
      writer.atLineStart = false;
      return;
    }
    if (index === 0 && !writer.atLineStart) {
      writer.out += part;
      return;
    }
    const prefix = indentOf(writer.depth);
    write(writer, part.startsWith(prefix) ? part.slice(prefix.length) : part);
  });
}

function writeRawBlock(writer: Writer, tokens: Token[], openAt: number, closeAt: number) {
  const open = tokens[openAt];
  const close = tokens[closeAt];
  if (open?.kind !== "tag" || close?.kind !== "tag") return;
  const inner = tokens
    .slice(openAt + 1, closeAt)
    .map((part) => (part.kind === "text" ? part.value : part.raw))
    .join("");
  writeOwnLine(writer, open.raw);
  writer.depth += 1;
  const preserve = open.name === "pre" || open.name === "textarea";
  contentLines(inner).forEach((part, index) => {
    if (index > 0) newline(writer);
    if (!preserve && part.trim() === "") {
      if (index === 0) newline(writer);
      return;
    }
    if (preserve) {
      if (!writer.atLineStart) newline(writer);
      writer.out += part;
      writer.atLineStart = false;
      return;
    }
    const prefix = indentOf(writer.depth);
    write(writer, part.startsWith(prefix) ? part.slice(prefix.length) : part);
  });
  writer.depth -= 1;
  writeOwnLine(writer, close.raw);
}

function containsBlockTag(tokens: Token[], start: number, end: number): boolean {
  return tokens
    .slice(start, end)
    .some((part) => part.kind === "tag" && !part.closing && BLOCK_TAGS.has(part.name));
}

function compactContents(tokens: Token[], start: number, end: number): string {
  return tokens
    .slice(start, end)
    .map((part) => (part.kind === "text" ? part.value : part.raw))
    .join("")
    .replace(/[ \t]*\n[ \t]*/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();
}

function lastContentLine(writer: Writer): string {
  const body = writer.out.replace(/\n+$/, "");
  const breakAt = body.lastIndexOf("\n");
  return (breakAt === -1 ? body : body.slice(breakAt + 1)).trim();
}

function separateSection(writer: Writer) {
  if (writer.out.trim() === "" || !lastContentLine(writer).startsWith("</")) return;
  if (!writer.out.endsWith("\n")) writer.out += "\n";
  if (!writer.out.endsWith("\n\n")) writer.out += "\n";
  writer.atLineStart = true;
}

function formatElement(tokens: Token[], index: number, writer: Writer): number {
  const token = tokens[index];
  if (token?.kind !== "tag" || token.closing) return index;

  if (token.selfClosing) {
    writeOwnLine(writer, token.raw);
    return index;
  }

  const closeAt = findClose(tokens, index + 1, token.name);
  const close = tokens[closeAt];
  if (closeAt === -1 || close?.kind !== "tag") {
    writeOwnLine(writer, token.raw);
    return index;
  }

  if (RAW_TAGS.has(token.name)) {
    writeRawBlock(writer, tokens, index, closeAt);
    return closeAt;
  }

  if (!containsBlockTag(tokens, index + 1, closeAt)) {
    const inner = compactContents(tokens, index + 1, closeAt);
    if (token.name === "div") separateSection(writer);
    writeOwnLine(writer, `${token.raw}${inner}${close.raw}`);
    return closeAt;
  }

  if (token.name === "div") separateSection(writer);
  writeOwnLine(writer, token.raw);
  writer.depth += 1;
  writer.stack.push(token.name);
  formatRange(tokens, index + 1, closeAt, writer);
  if (writer.stack.at(-1) === token.name) {
    writer.stack.pop();
    writer.depth = Math.max(0, writer.depth - 1);
  }
  writeOwnLine(writer, close.raw);
  return closeAt;
}

function formatRange(tokens: Token[], start: number, end: number, writer: Writer) {
  let index = start;
  while (index < end) {
    const token = tokens[index];
    if (!token) {
      index += 1;
      continue;
    }

    if (token.kind === "comment") {
      writeOwnLine(writer, token.raw);
      index += 1;
      continue;
    }

    if (token.kind === "text") {
      const ifEnd = inlineIfEnd(tokens, index, end);
      if (ifEnd !== -1) {
        const line = tokens
          .slice(index, ifEnd + 1)
          .map((part) => (part.kind === "text" ? part.value : part.raw))
          .join("")
          .replace(/[ \t]*\n[ \t]*/g, "")
          .trim();
        writeOwnLine(writer, line);
        index = ifEnd + 1;
        continue;
      }
      writeText(writer, token.value);
      index += 1;
      continue;
    }

    if (token.closing) {
      if (BLOCK_TAGS.has(token.name)) {
        const openedAt = writer.stack.lastIndexOf(token.name);
        if (openedAt !== -1) {
          writer.stack.length = openedAt;
          writer.depth = writer.stack.length;
        }
      }
      writeOwnLine(writer, token.raw);
      index += 1;
      continue;
    }

    index = formatElement(tokens, index, writer) + 1;
  }
}

function formatTokens(tokens: Token[]): string {
  const writer: Writer = { out: "", depth: 0, atLineStart: true, fence: false, stack: [] };
  formatRange(tokens, 0, tokens.length, writer);
  return writer.out.replace(/\n$/, "");
}

/**
 * Breaks markdown and HTML onto indented rows.
 * Tags, placeholders, conditions and other text are left as written.
 */
export function formatInfoboxTemplate(source: string): string {
  const normalized = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (normalized.trim() === "") return source;
  return formatTokens(tokenize(normalized));
}
