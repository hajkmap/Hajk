/** Field config persisted in layer.options (legacy wfstlayers shape). */
export interface EditableFieldConfig {
  index: number;
  name: string;
  alias?: string;
  description?: string;
  dataType: string;
  textType?: string | null;
  values?: string[] | null;
  hidden?: boolean;
  defaultValue?: string;
}

export interface EditingFieldRow extends EditableFieldConfig {
  editable: boolean;
  localType: string;
  type: string;
}

/** Editing settings persisted in layer.options; an empty idField means automatic. */
export interface EditingOptions {
  uri: string;
  idField: string;
  forceZ: boolean;
  editPoint: boolean;
  editLine: boolean;
  editPolygon: boolean;
  allowMultiGeometries: boolean;
}

export const defaultEditingOptions = (): EditingOptions => ({
  uri: "",
  idField: "",
  forceZ: false,
  editPoint: false,
  editLine: false,
  editPolygon: false,
  allowMultiGeometries: false,
});

export function editingOptionsFrom(
  options: Record<string, unknown> | undefined,
): EditingOptions {
  if (!options) return defaultEditingOptions();
  return {
    uri: typeof options.uri === "string" ? options.uri : "",
    idField: typeof options.idField === "string" ? options.idField : "",
    forceZ: options.forceZ === true,
    editPoint: options.editPoint === true,
    editLine: options.editLine === true,
    editPolygon: options.editPolygon === true,
    allowMultiGeometries: options.allowMultiGeometries === true,
  };
}

export function mergeDescribeWithSavedFields(
  describeProperties: {
    index: number;
    name: string;
    localType: string;
    type: string;
  }[],
  savedEditable: EditableFieldConfig[],
  savedNonEditable: EditableFieldConfig[],
): EditingFieldRow[] {
  const savedByName = new Map<string, EditableFieldConfig>();
  for (const f of [...savedEditable, ...savedNonEditable]) {
    savedByName.set(f.name, f);
  }
  const editableNames = new Set(savedEditable.map((f) => f.name));

  return describeProperties
    .filter((p) => !p.type.includes("gml:"))
    .map((p, index) => {
      const saved = savedByName.get(p.name);
      const allowed = textTypesFor(p.localType);
      const normalized = normalizeTextType(saved?.textType);
      const textType =
        normalized && allowed.includes(normalized) ? normalized : allowed[0];
      return {
        index: saved?.index ?? index,
        name: p.name,
        localType: p.localType,
        type: p.type,
        alias: saved?.alias ?? p.name,
        description: saved?.description ?? "",
        dataType: saved?.dataType ?? p.localType,
        textType,
        values: isListTextType(textType) ? (saved?.values ?? null) : null,
        hidden: saved?.hidden ?? false,
        defaultValue: saved?.defaultValue ?? "",
        editable: saved ? editableNames.has(p.name) : false,
      };
    });
}

const TEXT_TYPE_ALIASES: Record<string, string> = {
  text: "fritext",
  "Positiva heltal": "positive",
  date: "datum",
  "date-time": "datumtid",
};

/** Maps legacy/admin textType values to the canonical option values. */
export function normalizeTextType(
  textType: string | null | undefined,
): string | null {
  if (!textType) return textType ?? null;
  return TEXT_TYPE_ALIASES[textType] ?? textType;
}

/** A data type's family, which decides how a field of it can be edited. */
export type EditingFieldKind =
  "text" | "integer" | "decimal" | "boolean" | "date" | "dateTime";

// GeoServer's JSON names and the XSD names other services give.
const INTEGER_TYPES = new Set([
  "int",
  "integer",
  "long",
  "short",
  "byte",
  "unsignedint",
  "unsignedlong",
  "unsignedshort",
  "unsignedbyte",
  "positiveinteger",
  "negativeinteger",
  "nonnegativeinteger",
  "nonpositiveinteger",
]);
const DECIMAL_TYPES = new Set(["number", "decimal", "double", "float"]);

export function editingFieldKind(localType: string): EditingFieldKind {
  const type = localType.toLowerCase();
  if (INTEGER_TYPES.has(type)) return "integer";
  if (DECIMAL_TYPES.has(type)) return "decimal";
  if (type === "boolean") return "boolean";
  if (type === "date") return "date";
  if (type === "date-time" || type === "datetime") return "dateTime";
  return "text";
}

/** How a field of each kind can be edited in the client; the first is its default. */
const TEXT_TYPES: Record<EditingFieldKind, string[]> = {
  text: ["fritext", "datum", "lista", "flerval", "url"],
  integer: ["heltal", "positive", "negative", "boolean"],
  decimal: ["tal"],
  boolean: ["boolean"],
  date: ["datum"],
  dateTime: ["datumtid", "datum"],
};

export const textTypesFor = (localType: string) =>
  TEXT_TYPES[editingFieldKind(localType)];

const TEXT_TYPE_LABELS: Record<string, string> = {
  fritext: "layers.editing.textType.text",
  datum: "layers.editing.textType.date",
  lista: "layers.editing.textType.list",
  flerval: "layers.editing.textType.multiSelect",
  url: "layers.editing.textType.url",
  heltal: "layers.editing.textType.integer",
  positive: "layers.editing.textType.positiveInteger",
  negative: "layers.editing.textType.negativeInteger",
  tal: "layers.editing.textType.number",
  boolean: "layers.editing.textType.boolean",
  datumtid: "layers.editing.textType.dateTime",
};

/** Ja/nej on an integer field is stored as 1 or 0, and named so. */
export const textTypeLabelKey = (textType: string, localType: string) =>
  textType === "boolean" && editingFieldKind(localType) === "integer"
    ? "layers.editing.textType.trueFalse"
    : (TEXT_TYPE_LABELS[textType] ?? TEXT_TYPE_LABELS.fritext);

/** Whether the field takes its values from a list. */
export const isListTextType = (textType: string | null | undefined) =>
  textType === "lista" || textType === "flerval";

/** Between the values of a multi-select, as the client stores them. */
export const LIST_SEPARATOR = ";";

export function splitEditingFields(rows: EditingFieldRow[]): {
  editableFields: EditableFieldConfig[];
  nonEditableFields: EditableFieldConfig[];
} {
  const mapRow = (row: EditingFieldRow): EditableFieldConfig => ({
    index: row.index,
    name: row.name,
    alias: row.alias,
    description: row.description,
    dataType: row.dataType,
    textType: row.textType,
    values: row.values,
    hidden: row.hidden,
    defaultValue: row.defaultValue,
  });

  return {
    editableFields: rows.filter((r) => r.editable).map(mapRow),
    nonEditableFields: rows.filter((r) => !r.editable).map(mapRow),
  };
}
