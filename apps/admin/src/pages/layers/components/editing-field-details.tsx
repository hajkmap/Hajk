import { useState } from "react";
import {
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import {
  SelectWithHelp,
  TextFieldWithHelp,
} from "../../../components/form-components/field-label-with-help";
import { FieldLabelWithHelp } from "../../../components/form-components/field-help-tooltip";
import {
  isListTextType,
  LIST_SEPARATOR,
  textTypeLabelKey,
  textTypesFor,
  type EditingFieldRow,
} from "../types/editing-layer";
import { useLayerFieldLabels } from "../use-layer-field-labels";
import EditingFieldDefaultValue from "./editing-field-default-value";

interface EditingFieldDetailsProps {
  row: EditingFieldRow;
  onPatch: (patch: Partial<EditingFieldRow>) => void;
}

/** Everything about one field, only what its type can use. */
export default function EditingFieldDetails({
  row,
  onPatch,
}: EditingFieldDetailsProps) {
  const { t } = useTranslation();
  const { fieldLabel } = useLayerFieldLabels();
  const textTypes = textTypesFor(row.localType);
  const textType = row.textType ?? textTypes[0];
  const values = row.values ?? [];

  return (
    <Stack spacing={2} useFlexGap>
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{ alignItems: "baseline", flexWrap: "wrap" }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, overflowWrap: "anywhere" }}
        >
          {row.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {row.localType}
        </Typography>
      </Stack>
      <TextFieldWithHelp
        labelKey="layers.editing.col.alias"
        helpKey="layers.help.editingColAlias"
        size="small"
        fullWidth
        placeholder={row.name}
        value={row.alias ?? ""}
        onChange={(e) => onPatch({ alias: e.target.value })}
      />
      <TextFieldWithHelp
        labelKey="layers.editing.col.description"
        helpKey="layers.help.editingColDescription"
        size="small"
        fullWidth
        multiline
        maxRows={4}
        value={row.description ?? ""}
        onChange={(e) => onPatch({ description: e.target.value })}
      />
      {textTypes.length > 1 ? (
        <SelectWithHelp
          labelKey="layers.editing.col.inputType"
          helpKey="layers.help.editingColInputType"
          value={textType}
          onChange={(e) => {
            const next = String(e.target.value);
            // The list stays between Lista and Flerval; the default starts
            // over.
            onPatch({
              textType: next,
              values: isListTextType(next) ? row.values : null,
              defaultValue: "",
            });
          }}
        >
          {textTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {t(textTypeLabelKey(type, row.localType))}
            </MenuItem>
          ))}
        </SelectWithHelp>
      ) : (
        // The only way the data type can be edited: nothing to choose.
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            <FieldLabelWithHelp
              label={t("layers.editing.col.inputType")}
              help={t("layers.help.editingColInputType")}
            />
          </Typography>
          <Typography variant="body2">
            {t(textTypeLabelKey(textType, row.localType))}
          </Typography>
        </Box>
      )}
      {isListTextType(textType) ? (
        <ListValues
          values={values}
          onChange={(next) =>
            onPatch({
              values: next.length > 0 ? next : null,
              // Only values still in the list.
              defaultValue: String(row.defaultValue ?? "")
                .split(LIST_SEPARATOR)
                .filter((value) => next.includes(value))
                .join(LIST_SEPARATOR),
            })
          }
        />
      ) : null}
      <EditingFieldDefaultValue
        row={row}
        onChange={(defaultValue) => onPatch({ defaultValue })}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={row.hidden ?? false}
            onChange={(e) => onPatch({ hidden: e.target.checked })}
          />
        }
        label={fieldLabel(
          "layers.editing.hidden",
          "layers.help.editingColHidden",
        )}
      />
    </Stack>
  );
}

function ListValues({
  values,
  onChange,
}: {
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");

  const add = () => {
    const value = input.trim();
    if (value && !values.includes(value)) onChange([...values, value]);
    setInput("");
  };

  return (
    <Box>
      <TextFieldWithHelp
        labelKey="layers.editing.col.listValues"
        helpKey="layers.help.editingColListValues"
        size="small"
        fullWidth
        placeholder={t("layers.editing.listValueAddPlaceholder")}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          // Adds the value instead of saving the page.
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
      />
      {values.length > 0 ? (
        <Stack
          direction="row"
          useFlexGap
          spacing={0.5}
          sx={{ flexWrap: "wrap", mt: 1 }}
        >
          {values.map((value) => (
            <Chip
              key={value}
              label={value}
              size="small"
              variant="outlined"
              color="primary"
              onDelete={() => onChange(values.filter((v) => v !== value))}
            />
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}
