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
      return {
        index: saved?.index ?? index,
        name: p.name,
        localType: p.localType,
        type: p.type,
        alias: saved?.alias ?? p.name,
        description: saved?.description ?? "",
        dataType: saved?.dataType ?? p.localType,
        textType: normalizeTextType(
          saved?.textType ?? defaultTextType(p.localType),
        ),
        values: saved?.values ?? null,
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

export function defaultTextType(localType: string): string | null {
  switch (localType) {
    case "date":
      return "datum";
    case "date-time":
      return "datumtid";
    case "int":
    case "integer":
      return "heltal";
    case "number":
    case "decimal":
      return "tal";
    case "boolean":
      return "boolean";
    default:
      return "fritext";
  }
}

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
