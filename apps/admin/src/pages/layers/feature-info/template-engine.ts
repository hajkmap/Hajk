// Port of the client's infoclick template pipeline:
// apps/client/src/components/FeatureInfo/FeaturePropsParsing.jsx and FeaturePropsFilters.js.
// The preview is only trustworthy while this stays behaviourally identical to
// the client, quirks included, so change both together.

export type FeatureProperties = Record<string, unknown>;

export interface TemplateOptions {
  /** Map-level infoclick option, the client defaults to true. */
  allowDangerousHtml?: boolean;
  /** Map-level infoclick option, the client defaults to false. */
  useNewPlaceholderMatching?: boolean;
}

export interface ExternalPlaceholder {
  pluginName: string;
  value: string;
}

export interface TemplateResult {
  markdown: string;
  /** `{n}` markers left in the markdown refer to these, by index. */
  externals: ExternalPlaceholder[];
}

export const OLD_PLACEHOLDER_REGEX = /{[\s\w\u00C0-\u00ff@\-|!,'.():]+}/g;
export const NEW_PLACEHOLDER_REGEX = /{[^}]*}/g;

export const placeholderRegex = (options: TemplateOptions = {}) =>
  options.useNewPlaceholderMatching === true
    ? NEW_PLACEHOLDER_REGEX
    : OLD_PLACEHOLDER_REGEX;

const isValidUrl = (value: string) => {
  try {
    return Boolean(new URL(value));
  } catch {
    return false;
  }
};

// ---- Filters ----------------------------------------------------------------

type FilterFn = (
  this: FilterContext,
  value: unknown,
  ...args: string[]
) => unknown;

interface FilterContext {
  properties: FeatureProperties;
}

// The client calls string methods on the value directly, so a Date from
// dateAddDays or a number throws there and the filter is skipped.
const asString = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new TypeError(`Expected a text value, got ${typeof value}`);
  }
  return value;
};

const fixDate = (value: unknown) => {
  const s = asString(value);
  if (!s.includes("-")) {
    return `${s.substr(0, 4)}-${s.substr(4, 2)}-${s.substr(6, 2)}`;
  }
  return s;
};

const toDate = (value: unknown) =>
  typeof value === "string" ? new Date(value) : (value as Date);

const isNotNumber = (value: unknown) => isNaN(value as number);

const filterFunctions: Record<string, FilterFn> = {
  roundToDecimals(
    value,
    numDecimals,
    retOriginalValueIfParamsNotNumbers = "0",
  ) {
    if (isNotNumber(value) || isNotNumber(numDecimals)) {
      if (parseInt(retOriginalValueIfParamsNotNumbers) === 1) return value;
      throw new Error("Arguments should be numbers");
    }
    return parseFloat(
      parseFloat(String(value)).toFixed(parseInt(numDecimals)),
    ).toLocaleString();
  },
  replace(value, replace, withString) {
    return asString(value).replace(new RegExp(replace, "gm"), withString);
  },
  default(value, defaultValue) {
    return value === "" ? defaultValue : value;
  },
  lt(value, test, lessValue, greaterValue) {
    if (isNotNumber(value) || isNotNumber(test)) return value;
    const val =
      typeof value === "string" ? parseFloat(value) : (value as number);
    const t = parseFloat(test);
    if (val < t) return lessValue ? lessValue : value;
    return greaterValue ? greaterValue : value;
  },
  gt(value, test, greaterValue, lessValue) {
    if (isNotNumber(value) || isNotNumber(test)) return value;
    const val =
      typeof value === "string" ? parseFloat(value) : (value as number);
    const t = parseFloat(test);
    if (val > t) return greaterValue ? greaterValue : value;
    return lessValue ? lessValue : value;
  },
  naNToNum(value, num) {
    if (!value || isNotNumber(value)) return parseFloat(num);
    return value;
  },
  hasValue(value, trueValue = "", falseValue = "") {
    return value === "" ? falseValue : trueValue;
  },
  equals(value, test, trueValue, falseValue) {
    return value === test ? trueValue : falseValue || value;
  },
  notEquals(value, test, falseValue, trueValue) {
    return value !== test ? falseValue : trueValue || value;
  },
  datetime(value) {
    return toDate(value).toLocaleString();
  },
  date(value) {
    return toDate(fixDate(value)).toLocaleDateString();
  },
  time(value) {
    return toDate(value).toLocaleTimeString();
  },
  dateAddDays(value, days) {
    const date = toDate(fixDate(value));
    date.setDate(date.getDate() + parseFloat(days));
    return date;
  },
  dateAddHours(value, hours) {
    const date = toDate(fixDate(value));
    date.setTime(date.getTime() + parseFloat(hours) * 60 * 60 * 1000);
    return date;
  },
  formatNumber(value) {
    if (isNotNumber(value)) throw new Error("Argument should be a number");
    return Number(value).toLocaleString();
  },
  multiplyBy(value, multiplier) {
    if (isNotNumber(value) || isNotNumber(multiplier)) {
      throw new Error("Arguments should be numbers");
    }
    return (value as number) * (multiplier as unknown as number);
  },
  map(value, mappingStr) {
    if (!mappingStr) throw new Error("A mapping string is required");
    const mapping = mappingStr
      .split(",")
      .reduce<Record<string, string>>((acc, pair) => {
        const separatorIndex = pair.indexOf(":");
        if (separatorIndex > -1) {
          acc[pair.substring(0, separatorIndex).trim()] = pair
            .substring(separatorIndex + 1)
            .trim();
        }
        return acc;
      }, {});
    return Object.hasOwn(mapping, String(value))
      ? mapping[String(value)]
      : value;
  },
  subscript(value) {
    let s = asString(value);
    (s.match(/\d/gm) ?? []).forEach((num) => {
      s = s.replace(num, String.fromCodePoint(Number("0x208" + num)));
    });
    return s;
  },
  superscript(value) {
    const sup = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
    let s = asString(value);
    (s.match(/\d/gm) ?? []).forEach((num) => {
      s = s.replace(num, sup[Number(num)]);
    });
    return s;
  },
  toUpper(value) {
    return asString(value).toUpperCase();
  },
  toLower(value) {
    return asString(value).toLowerCase();
  },
  capitalize(value) {
    const s = asString(value);
    return s.charAt(0).toUpperCase() + s.slice(1);
  },
  substr(value, i1, i2) {
    return asString(value).substr(
      Number(i1),
      i2 === undefined ? undefined : Number(i2),
    );
  },
  substring(value, i1, i2) {
    return asString(value).substring(
      Number(i1),
      i2 === undefined ? undefined : Number(i2),
    );
  },
  left(value, searchFor) {
    return asString(value).split(searchFor)[0];
  },
  right(value, searchFor) {
    const s = asString(value);
    const i = s.indexOf(searchFor);
    return i > -1 ? s.substring(i + searchFor.length, s.length) : s;
  },
  trim(value) {
    return asString(value).trim();
  },
  toProjection() {
    throw new Error(
      "toProjection needs the map's projection and only runs in the map client",
    );
  },
};
filterFunctions.fallback = filterFunctions.default;

export const FILTER_NAMES = Object.keys(filterFunctions);

export interface FilterDescriptor {
  name: string;
  /** Argument names, used for the syntax reference and inserted snippets. */
  args: string[];
  example: string;
  /** False when the admin preview can't evaluate the filter like the client does. */
  previewable?: boolean;
}

export const FILTERS: FilterDescriptor[] = [
  {
    name: "default",
    args: ["'fallback'"],
    example: "{attr|default('Saknas')}",
  },
  {
    name: "hasValue",
    args: ["'yes'", "'no'"],
    example: "{attr|hasValue('Ja', 'Nej')}",
  },
  {
    name: "equals",
    args: ["'test'", "'yes'", "'no'"],
    example: "{attr|equals('1', 'Ja', 'Nej')}",
  },
  {
    name: "notEquals",
    args: ["'test'", "'yes'", "'no'"],
    example: "{attr|notEquals('1', 'Inte ett', 'Ett')}",
  },
  { name: "map", args: ["'0:Nej,1:Ja'"], example: "{attr|map('0:Nej,1:Ja')}" },
  {
    name: "lt",
    args: ["'10'", "'less'", "'greater'"],
    example: "{attr|lt('10', 'Under', 'Över')}",
  },
  {
    name: "gt",
    args: ["'10'", "'greater'", "'less'"],
    example: "{attr|gt('10', 'Över', 'Under')}",
  },
  { name: "date", args: [], example: "{attr|date}" },
  { name: "time", args: [], example: "{attr|time}" },
  { name: "datetime", args: [], example: "{attr|datetime}" },
  { name: "dateAddDays", args: ["1"], example: "{attr|dateAddDays(1)|date}" },
  {
    name: "dateAddHours",
    args: ["1"],
    example: "{attr|dateAddHours(1)|datetime}",
  },
  { name: "formatNumber", args: [], example: "{attr|formatNumber}" },
  {
    name: "roundToDecimals",
    args: ["2"],
    example: "{attr|roundToDecimals(2)}",
  },
  { name: "multiplyBy", args: ["100"], example: "{attr|multiplyBy(100)}" },
  { name: "naNToNum", args: ["'0'"], example: "{attr|naNToNum('0')}" },
  { name: "toUpper", args: [], example: "{attr|toUpper}" },
  { name: "toLower", args: [], example: "{attr|toLower}" },
  { name: "capitalize", args: [], example: "{attr|capitalize}" },
  { name: "trim", args: [], example: "{attr|trim}" },
  {
    name: "replace",
    args: ["'from'", "'to'"],
    example: "{attr|replace('_', ' ')}",
  },
  { name: "left", args: ["'_'"], example: "{attr|left('_')}" },
  { name: "right", args: ["'_'"], example: "{attr|right('_')}" },
  { name: "substr", args: ["0", "4"], example: "{attr|substr(0,4)}" },
  { name: "substring", args: ["0", "4"], example: "{attr|substring(0,4)}" },
  { name: "subscript", args: [], example: "{attr|subscript}" },
  { name: "superscript", args: [], example: "{attr|superscript}" },
  {
    name: "toProjection",
    args: ["'x'", "'xprop'", "'yprop'", "'EPSG:4326'", "4"],
    example: "{x|toProjection('x','x','y','EPSG:4326',4)}",
    previewable: false,
  },
];

export interface FilterIssue {
  filterName: string;
  message: string;
}

const freeString = (s: string) =>
  s.startsWith("'") ? s.substring(1, s.length - 1) : s;

export function applyFilters(
  properties: FeatureProperties,
  input: string,
  onIssue?: (issue: FilterIssue) => void,
): unknown {
  const filters = input.split("|");
  const key = (filters.shift() ?? "").trim();

  let value: unknown;
  if (key.startsWith("'")) {
    value = key.substring(1, key.length - 1);
  } else {
    value = properties[key];
    if (typeof value === "boolean" || typeof value === "number") {
      value = String(value);
    }
    value ??= "";
  }

  const splitArgsRegEx = /^''|'[^']+'|^\d+\.?\d{1,}$|[a-z_0-9]+/gm;
  const isPropertyRegEx = /^[a-z][a-z_0-9]+$/gm;

  filters.forEach((inFilter) => {
    const argsStart = inFilter.indexOf("(");
    let filterName = inFilter;
    let args: string[] = [];

    if (argsStart > -1) {
      filterName = inFilter.substr(0, argsStart);
      const matched = inFilter
        .substring(argsStart + 1, inFilter.lastIndexOf(")"))
        .match(splitArgsRegEx);
      if (matched === null) {
        throw new Error(`Filter '${filterName}' has empty parentheses`);
      }
      args = matched;
      args.forEach((v, i, a) => {
        v = v.trim();
        if (isPropertyRegEx.test(v)) {
          const nested = properties[v];
          a[i] = nested ? (nested as string).trim() : "";
        } else {
          a[i] = freeString(v);
        }
      });
    }

    const filter = Object.hasOwn(filterFunctions, filterName)
      ? filterFunctions[filterName]
      : undefined;
    if (!filter) {
      onIssue?.({ filterName, message: "unknownFilter" });
      return;
    }
    try {
      value = filter.apply({ properties }, [value, ...args]);
    } catch (err) {
      onIssue?.({
        filterName,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });

  return value;
}

// ---- Template ---------------------------------------------------------------

const valueFromJson = (str: unknown): Record<string, unknown> | false => {
  if (typeof str !== "string") return false;
  const start = /^\[|^\{(?!\{)/.exec(str);
  const jsonEnds: Record<string, RegExp> = { "[": /]$/, "{": /}$/ };
  if (!start || !jsonEnds[start[0]].test(str)) return false;
  try {
    return JSON.parse(str) as Record<string, unknown>;
  } catch {
    return false;
  }
};

/** Same as the client: JSON-looking property values are spread into the properties. */
export function extractPropertiesFromJson(
  properties: FeatureProperties,
): FeatureProperties {
  let result = { ...properties };
  Object.keys(properties).forEach((property) => {
    const jsonData = valueFromJson(properties[property]);
    if (jsonData) {
      delete result[property];
      result = { ...result, ...jsonData };
    }
  });
  return result;
}

const linkAttributeReplacer = (
  _match: string,
  text: string,
  href: string,
  attrsStr: string,
) => {
  const attrs = (attrsStr.match(/[\w-]+=(?:"[^"]*"|'[^']*'|\S+)|[\w-]+/g) ?? [])
    .map((attr) => {
      const eqIdx = attr.indexOf("=");
      if (eqIdx === -1) return attr;
      const key = attr.substring(0, eqIdx);
      const value = attr.substring(eqIdx + 1).replace(/^["']|["']$/g, "");
      return `${key}="${value}"`;
    })
    .join(" ");
  return `<a href="${href}" ${attrs}>${text}</a>`;
};

interface ConditionalGroups {
  condition: string;
  attributes?: string;
  content?: string;
}

const conditionalReplacer = (...args: unknown[]) => {
  const matched = args[args.length - 1] as ConditionalGroups;
  if (matched.condition !== "if") return args[0] as string;

  const content = String(matched.content) + "\n";
  if (matched.attributes?.includes("=") && !isValidUrl(matched.attributes)) {
    const comparer = matched.attributes.includes("!=") ? "!=" : "=";
    const [k, v] = matched.attributes
      .split(comparer)
      .map((e) => e.replaceAll('"', "").trim());
    if (comparer === "=") return k === v ? content : "";
    return k !== v ? content : "";
  }
  if ((matched.attributes?.trim().length ?? 0) > 0) return content;
  return "";
};

interface HrefGroups {
  text: string;
  href: string;
  title?: string;
}

const markdownHrefEncoder = (...args: unknown[]) => {
  const matched = args[args.length - 1] as HrefGroups;
  const title = matched.title ? " " + matched.title : "";
  let href: string;
  try {
    href = new URL(matched.href).toString();
  } catch {
    href = encodeURI(matched.href);
  }
  return `[${matched.text}](${href}${title})`;
};

export const CONDITIONAL_REGEX =
  /{{(?<condition>\w+)[\s/]?(?<attributes>[^}}]+)?}}(?<content>[^{{]+)?(?:{{\/\1}}\n?)/gi;

export interface RenderOptions extends TemplateOptions {
  onFilterIssue?: (placeholder: string, issue: FilterIssue) => void;
}

/** Text for a feature value. Objects become JSON, never "[object Object]". */
function propertyText(value: unknown): string {
  switch (typeof value) {
    case "string":
      return value;
    case "number":
    case "boolean":
    case "bigint":
      return String(value);
    default: {
      const json = JSON.stringify(value);
      return typeof json === "string" ? json : "";
    }
  }
}

/** Turns a template and feature properties into the markdown the client renders. */
export function renderTemplate(
  template: string,
  properties: FeatureProperties,
  options: RenderOptions = {},
): TemplateResult {
  const allowDangerousHtml = options.allowDangerousHtml ?? true;
  const externals: ExternalPlaceholder[] = [];
  let markdown = template;

  if (allowDangerousHtml) {
    markdown = markdown.replace(
      /\[([^\]]*)\]\(([^)]*)\)\{(?!\{)([^}]+)\}/g,
      linkAttributeReplacer,
    );
  }

  const valueForPlaceholder = (raw: string): string => {
    const placeholder = raw.substring(1, raw.length - 1);

    if (placeholder.includes("@@") && !placeholder.includes("@@@")) {
      const [propertyName, pluginName] = placeholder.split("@@");
      const propertyValue = properties[propertyName];
      if (propertyValue == null) return "";
      const text = propertyText(propertyValue);
      if (text.trim() === "") return "";
      externals.push({ pluginName, value: text });
      return `{${externals.length - 1}}`;
    }
    if (placeholder.includes("|")) {
      return String(
        applyFilters(properties, placeholder, (issue) =>
          options.onFilterIssue?.(placeholder, issue),
        ),
      );
    }
    const value = properties[placeholder];
    const hasValue =
      (typeof value === "string" && value.replace(/=/g, "&equal;")) ||
      value != null;
    return hasValue ? propertyText(value) : "";
  };

  (markdown.match(placeholderRegex(options)) ?? [])
    .map((match) => match.replace("{{if ", ""))
    .filter((match) => match !== "{{/if}")
    .forEach((placeholder) => {
      markdown = markdown.replace(
        placeholder,
        valueForPlaceholder(placeholder),
      );
    });

  markdown = markdown.replace(CONDITIONAL_REGEX, conditionalReplacer);
  markdown = markdown.replace(
    /\[(?<text>[^[]+)\]\((?<href>[^")]+)(?<title>".*")?\)/gm,
    markdownHrefEncoder,
  );
  markdown = markdown.replace(/&equal;/g, "=");

  return { markdown, externals };
}
