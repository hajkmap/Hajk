
import type { TemplateIssue } from "./template-validation";

const lineAt = (text: string, index: number) =>
  text.slice(0, index).split("\n").length;

const blank = (text: string, pattern: RegExp) =>
  text.replace(pattern, (match) => match.replace(/[^\n]/g, " "));

/**
 * Blanks out the parts that are not template syntax, keeping every character position and line break in place.
 */
export function maskLiterals(template: string): string {
  let text = blank(template, /```[\s\S]*?```/g);
  text = blank(text, /`[^`\n]*`/g);
  text = blank(text, /<!--[\s\S]*?-->/g);
  text = blank(text, /<(style|script)\b[\s\S]*?<\/\1\s*>/gi);
  return text;
}

const VOID_TAGS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
  "source", "track", "wbr",
]);

/** Tags a browser closes on its own, so leaving them open is not a mistake. */
const OPTIONAL_END_TAGS = new Set([
  "p", "li", "td", "th", "tr", "tbody", "thead", "tfoot", "dt", "dd", "option",
  "colgroup",
]);

function checkHtml(text: string, issues: TemplateIssue[]) {
  const open: { name: string; index: number }[] = [];
  const unclosed = (tag: { name: string; index: number }) => {
    if (OPTIONAL_END_TAGS.has(tag.name)) return;
    issues.push({
      severity: "warning",
      code: "unclosedTag",
      params: { name: tag.name },
      line: lineAt(text, tag.index),
    });
  };

  // A name must be followed by a space or the end of the tag, so Markdown
  // autolinks such as <https://example.com> are not read as tags.
  for (const match of text.matchAll(/<(\/?)([a-zA-Z][\w-]*)((?:\s[^<>]*)?)>/g)) {
    const [, closing, rawName, attributes] = match;
    const name = rawName.toLowerCase();
    const line = lineAt(text, match.index);

    if (!closing) {
      if ((attributes.match(/"/g)?.length ?? 0) % 2 === 1) {
        issues.push({ severity: "warning", code: "attributeQuote", params: { name }, line });
      }
      if (!VOID_TAGS.has(name) && !attributes.trimEnd().endsWith("/")) {
        open.push({ name, index: match.index });
      }
      continue;
    }

    const at = open.map((tag) => tag.name).lastIndexOf(name);
    if (at === -1) {
      if (!VOID_TAGS.has(name)) {
        issues.push({
          severity: "warning",
          code: "unexpectedClosingTag",
          params: { name },
          line,
        });
      }
      continue;
    }
    open.splice(at).slice(1).forEach(unclosed);
  }
  open.forEach(unclosed);

  for (const match of text.matchAll(/<([a-zA-Z][\w-]*)\s[^<>]*=[^<>]*(?=<|$)/g)) {
    issues.push({
      severity: "warning",
      code: "tagNotFinished",
      params: { name: match[1].toLowerCase() },
      line: lineAt(text, match.index),
    });
  }
}

function checkPlaceholderSyntax(text: string, issues: TemplateIssue[]) {
  for (const match of text.matchAll(/{/g)) {
    const index = match.index;
    if (text[index + 1] === "{" || text[index - 1] === "{") continue;
    const rest = text.slice(index + 1);
    const end = rest.search(/[{}\n]/);
    if (end !== -1 && rest[end] === "}") continue;
    issues.push({
      severity: "warning",
      code: "unclosedBrace",
      params: { start: text.slice(index, index + 1 + (end === -1 ? 40 : end)).slice(0, 40) },
      line: lineAt(text, index),
    });
  }

  for (const match of text.matchAll(/{([^{}\n]*\|[^{}\n]*)}/g)) {
    const body = match[1];
    if (body.includes("@@")) continue;
    const count = (char: string) => body.split(char).length - 1;
    if (
      count("(") !== count(")") ||
      count("'") % 2 === 1 ||
      count('"') % 2 === 1
    ) {
      issues.push({
        severity: "warning",
        code: "filterSyntax",
        params: { text: match[0] },
        line: lineAt(text, match.index),
      });
    }
  }
}

const HTML_BLOCK_START =
  /^ {0,3}<\/?(?:div|table|thead|tbody|tfoot|tr|td|th|p|ul|ol|li|section|article|header|footer|blockquote|details|summary|figure|center|pre|h[1-6])\b/i;
const MARKDOWN_INLINE = /\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^)\n]+\)|^\s*#{1,6}\s/;
const TABLE_DIVIDER = /^\s*\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)*\|?\s*$/;

const tableCells = (row: string) =>
  row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(/(?<!\\)\|/).length;

function checkMarkdown(text: string, issues: TemplateIssue[]) {
  const lines = text.split("\n");
  let inHtmlBlock = false;
  let htmlBlockReported = false;

  lines.forEach((content, index) => {
    const line = index + 1;
    const push = (
      severity: TemplateIssue["severity"],
      code: string,
      params?: Record<string, string>,
    ) => issues.push({ severity, code, params, line });

    if (content.trim() === "") {
      inHtmlBlock = false;
      htmlBlockReported = false;
    } else if (!inHtmlBlock && HTML_BLOCK_START.test(content)) {
      inHtmlBlock = true;
    }
    if (inHtmlBlock) {
      if (!htmlBlockReported && MARKDOWN_INLINE.test(content)) {
        htmlBlockReported = true;
        push("info", "markdownInHtml");
      }
      return;
    }

    if (/\[[^\]\n]*\]\((?![^)\n]*\))/.test(content)) push("warning", "linkNotClosed");
    if (/\[[^\]\n]+\]\s+\((?:https?:|\/|{)/.test(content)) push("warning", "linkSpace");
    if (/^ {0,3}#{1,6}[^\s#]/.test(content)) push("info", "headingSpace");

    const isRule = /^\s*[*\-_\s]+$/.test(content);
    if (!isRule && (content.match(/\*\*/g)?.length ?? 0) % 2 === 1) {
      push("info", "boldNotClosed");
    }

    // A table only becomes a table when the row of dashes has as many
    // columns as the heading row above it.
    const divider = lines[index + 1];
    if (
      content.includes("|") &&
      divider !== undefined &&
      divider.includes("-") &&
      TABLE_DIVIDER.test(divider)
    ) {
      const header = tableCells(content);
      const below = tableCells(divider);
      if (header !== below) {
        push("warning", "tableColumns", {
          header: String(header),
          divider: String(below),
        });
      }
    }
  });
}

/** Adds general HTML, placeholder and Markdown syntax issues to `issues`. */
export function checkSyntax(template: string, issues: TemplateIssue[]) {
  const text = maskLiterals(template);
  checkHtml(text, issues);
  checkPlaceholderSyntax(text, issues);
  checkMarkdown(text, issues);
}
