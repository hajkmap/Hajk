import {
  FILTERS,
  FILTER_NAMES,
  OLD_PLACEHOLDER_REGEX,
  placeholderRegex,
  type TemplateOptions,
} from "./template-engine";
import { DOCUMENT_HANDLER_PLUGIN, KNOWN_PLUGINS } from "./document-link";
import { checkSyntax } from "./template-syntax";

export type IssueSeverity = "error" | "warning" | "info";

export interface TemplateIssue {
  severity: IssueSeverity;
  /** Translated as `layers.featureInfo.issue.<code>`. */
  code: string;
  params?: Record<string, string>;
  line: number;
}

export interface ValidationContext extends TemplateOptions {
  /** Attribute names of the layer, or undefined when they couldn't be loaded. */
  attributes?: string[];
}

const CLICK_ATTRIBUTES = ["click:x", "click:y", "click:zoom"];

const lineAt = (text: string, index: number) =>
  text.slice(0, index).split("\n").length;

const closestName = (name: string, candidates: string[]) => {
  const lower = name.toLowerCase();
  return candidates.find((c) => c.toLowerCase() === lower);
};

/** The attribute a placeholder (without its braces) reads, or null for literals. */
export function attributeOfPlaceholder(placeholder: string): string | null {
  if (placeholder.includes("@@") && !placeholder.includes("@@@")) {
    return placeholder.split("@@")[0];
  }
  const key = placeholder.split("|")[0].trim();
  if (key.startsWith("'")) return null;
  return key;
}

export function filtersOfPlaceholder(placeholder: string): string[] {
  if (placeholder.includes("@@") && !placeholder.includes("@@@")) return [];
  return placeholder
    .split("|")
    .slice(1)
    .map((f) => {
      const argsStart = f.indexOf("(");
      return argsStart > -1 ? f.substr(0, argsStart) : f;
    });
}

function checkPlaceholders(
  template: string,
  context: ValidationContext,
  issues: TemplateIssue[],
) {
  const known = context.attributes
    ? [...context.attributes, ...CLICK_ATTRIBUTES]
    : undefined;
  const regex = new RegExp(placeholderRegex(context).source, "g");
  let pluginNoted = false;

  for (const match of template.matchAll(regex)) {
    let raw = match[0];
    let index = match.index;
    if (raw.startsWith("{{if ")) {
      raw = raw.replace("{{if ", "");
      index += "{{if ".length;
    }
    if (raw === "{{/if}" || raw.startsWith("{{")) continue;
    if (template[index - 1] === ")" || template[index - 1] === "{") continue;

    const line = lineAt(template, index);
    const placeholder = raw.substring(1, raw.length - 1);
    if (placeholder.includes("{") || placeholder.includes("\n")) continue;

    const attribute = attributeOfPlaceholder(placeholder);

    if (placeholder.includes("@@") && !placeholder.includes("@@@")) {
      const plugin = placeholder.split("@@")[1];
      if (!KNOWN_PLUGINS.includes(plugin)) {
        issues.push({
          severity: "warning",
          code: "unknownPlugin",
          params: { name: plugin, suggestion: DOCUMENT_HANDLER_PLUGIN },
          line,
        });
      } else if (!pluginNoted) {
        pluginNoted = true;
        issues.push({ severity: "info", code: "documentHandlerRequired", line });
      }
    }

    if (attribute !== null && attribute.trim() === "") {
      issues.push({ severity: "warning", code: "emptyPlaceholder", line });
    } else if (
      attribute !== null &&
      known &&
      !known.includes(attribute) &&
      !/^\d+$/.test(attribute)
    ) {
      const suggestion = closestName(attribute, known);
      issues.push({
        severity: "warning",
        code: suggestion ? "unknownAttributeCase" : "unknownAttribute",
        params: { name: attribute, suggestion: suggestion ?? "" },
        line,
      });
    }

    for (const filter of filtersOfPlaceholder(placeholder)) {
      if (!FILTER_NAMES.includes(filter)) {
        const trimmed = filter.trim();
        issues.push({
          severity: "warning",
          code: FILTER_NAMES.includes(trimmed)
            ? "filterWhitespace"
            : "unknownFilter",
          params: { name: filter },
          line,
        });
      } else if (
        FILTERS.find((f) => f.name === filter)?.previewable === false
      ) {
        issues.push({
          severity: "info",
          code: "filterNotPreviewable",
          params: { name: filter },
          line,
        });
      }
    }
  }

  if (context.useNewPlaceholderMatching !== true) {
    for (const match of template.matchAll(/{([^{}]*)}/g)) {
      if (template[match.index - 1] === ")") continue;
      if (template[match.index - 1] === "{") continue;
      const old = new RegExp(OLD_PLACEHOLDER_REGEX.source);
      if (old.exec(match[0])?.[0] !== match[0]) {
        issues.push({
          severity: "warning",
          code: "placeholderNotMatched",
          params: { text: match[0] },
          line: lineAt(template, match.index),
        });
      }
    }
  }
}

function checkConditionals(template: string, issues: TemplateIssue[]) {
  const open: { index: number }[] = [];

  for (const match of template.matchAll(/{{\s*(\/?)(\w+)(.*?)}}(?!})/g)) {
    const [, closing, name, attributes] = match;
    const line = lineAt(template, match.index);

    if (name !== "if") {
      issues.push({
        severity: "warning",
        code: "unknownCondition",
        params: { name },
        line,
      });
      continue;
    }

    if (closing) {
      if (open.length === 0) {
        issues.push({ severity: "error", code: "unexpectedEndIf", line });
      } else {
        open.pop();
      }
      continue;
    }

    if (open.length > 0) {
      issues.push({ severity: "error", code: "nestedIf", line });
    }
    open.push({ index: match.index });

    const condition = attributes.trim();
    if (condition === "") {
      issues.push({ severity: "warning", code: "emptyCondition", line });
      continue;
    }
    const comparer = condition.includes("!=") ? "!=" : "=";
    const left = condition.includes("=")
      ? condition.split(comparer)[0]
      : condition;
    if (!left.includes("{")) {
      issues.push({
        severity: "warning",
        code: "conditionWithoutPlaceholder",
        params: { name: left.trim(), placeholder: `{${left.trim()}}` },
        line,
      });
    }
  }

  for (const { index } of open) {
    issues.push({
      severity: "error",
      code: "unclosedIf",
      line: lineAt(template, index),
    });
  }
}

const UNSAFE_URL = /^\s*(javascript|vbscript|data:text\/html)/i;

function checkSecurity(
  template: string,
  context: ValidationContext,
  issues: TemplateIssue[],
) {
  for (const match of template.matchAll(/<\s*script\b/gi)) {
    issues.push({
      severity: "error",
      code: "scriptTag",
      line: lineAt(template, match.index),
    });
  }
  for (const match of template.matchAll(/<[a-z][^>]*\s(on[a-z]+)\s*=/gi)) {
    issues.push({
      severity: "error",
      code: "eventHandler",
      params: { name: match[1] },
      line: lineAt(template, match.index),
    });
  }

  const urls = [
    ...[...template.matchAll(/\]\(([^)\s]*)/g)].map((m) => ({
      url: m[1],
      index: m.index,
    })),
    ...[
      ...template.matchAll(/\s(?:href|src)\s*=\s*["']?([^"'\s>]*)/gi),
    ].map((m) => ({ url: m[1], index: m.index })),
  ];
  for (const { url, index } of urls) {
    if (UNSAFE_URL.test(url)) {
      issues.push({
        severity: "error",
        code: "unsafeUrl",
        params: { url },
        line: lineAt(template, index),
      });
    }
  }

  if (context.allowDangerousHtml === false) {
    const html = /<\/?[a-z][a-z0-9]*[\s>/]/i.exec(template);
    if (html) {
      issues.push({
        severity: "info",
        code: "htmlNotRendered",
        line: lineAt(template, html.index),
      });
    }
  }
}

/** Checks a template against the rules of the client's infoclick parser. */
export function validateTemplate(
  template: string,
  context: ValidationContext = {},
): TemplateIssue[] {
  if (!template.trim()) return [];
  const issues: TemplateIssue[] = [];
  checkPlaceholders(template, context, issues);
  checkConditionals(template, issues);
  checkSecurity(template, context, issues);
  checkSyntax(template, issues);
  return issues.sort((a, b) => a.line - b.line);
}

export const hasBlockingIssues = (issues: TemplateIssue[]) =>
  issues.some((issue) => issue.severity === "error");
