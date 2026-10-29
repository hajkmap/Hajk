import { MenuItem } from "@mui/material";
import { useTranslation } from "react-i18next";

import {
  SelectWithHelp,
  TextFieldWithHelp,
} from "../../../components/form-components/field-label-with-help";
import {
  editingFieldKind,
  LIST_SEPARATOR,
  type EditingFieldRow,
} from "../types/editing-layer";

const LABEL_KEY = "layers.editing.col.defaultValue";
const HELP_KEY = "layers.help.editingColDefaultValue";

/** The browser's own input for the types that have one. */
const INPUTS: Record<
  string,
  { type: string; step?: number | "any"; min?: number; max?: number }
> = {
  datum: { type: "date" },
  datumtid: { type: "datetime-local" },
  heltal: { type: "number", step: 1 },
  positive: { type: "number", step: 1, min: 1 },
  negative: { type: "number", step: 1, max: -1 },
  tal: { type: "number", step: "any" },
};

interface EditingFieldDefaultValueProps {
  row: EditingFieldRow;
  onChange: (value: string) => void;
}

/** The value a new feature gets, entered as the client edits the field. */
export default function EditingFieldDefaultValue({
  row,
  onChange,
}: EditingFieldDefaultValueProps) {
  const { t } = useTranslation();
  const value = row.defaultValue == null ? "" : String(row.defaultValue);
  const values = row.values ?? [];
  const none = (
    <MenuItem value="">
      <em>{t("layers.editing.noDefault")}</em>
    </MenuItem>
  );

  if (row.textType === "boolean") {
    // An integer field stores 1 or 0.
    const [yes, no] =
      editingFieldKind(row.localType) === "integer"
        ? ["1", "0"]
        : ["true", "false"];
    return (
      <SelectWithHelp
        labelKey={LABEL_KEY}
        helpKey={HELP_KEY}
        displayEmpty
        value={value === yes || value === no ? value : ""}
        onChange={(e) => onChange(String(e.target.value))}
      >
        {none}
        <MenuItem value={yes}>{t("layers.editing.yes")}</MenuItem>
        <MenuItem value={no}>{t("layers.editing.no")}</MenuItem>
      </SelectWithHelp>
    );
  }

  if (row.textType === "lista") {
    return (
      <SelectWithHelp
        labelKey={LABEL_KEY}
        helpKey={HELP_KEY}
        displayEmpty
        value={value}
        onChange={(e) => onChange(String(e.target.value))}
      >
        {none}
        {values.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </SelectWithHelp>
    );
  }

  if (row.textType === "flerval") {
    const chosen = value ? value.split(LIST_SEPARATOR) : [];
    return (
      <SelectWithHelp
        labelKey={LABEL_KEY}
        helpKey={HELP_KEY}
        multiple
        displayEmpty
        value={chosen}
        renderValue={() =>
          chosen.length > 0 ? (
            chosen.join(", ")
          ) : (
            <em>{t("layers.editing.noDefault")}</em>
          )
        }
        onChange={(e) => {
          const next: unknown[] = Array.isArray(e.target.value)
            ? e.target.value
            : [];
          // In the list's order.
          onChange(values.filter((v) => next.includes(v)).join(LIST_SEPARATOR));
        }}
      >
        {values.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </SelectWithHelp>
    );
  }

  const { type, ...limits } = INPUTS[row.textType ?? ""] ?? { type: "text" };
  return (
    <TextFieldWithHelp
      labelKey={LABEL_KEY}
      helpKey={HELP_KEY}
      size="small"
      fullWidth
      type={type}
      value={value}
      slotProps={{ htmlInput: limits }}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
