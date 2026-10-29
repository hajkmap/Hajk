import { useState } from "react";
import {
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useTranslation } from "react-i18next";

import { SelectWithHelp } from "../../../components/form-components/field-label-with-help";
import {
  textTypeLabelKey,
  textTypesFor,
  type EditingFieldRow,
} from "../types/editing-layer";
import { useLayerFieldLabels } from "../use-layer-field-labels";
import EditingFieldDetails from "./editing-field-details";

/** The list and the chosen field, each on its own surface in the panel. */
const CARD = {
  border: 1,
  borderColor: "divider",
  borderRadius: 2,
  bgcolor: "background.paper",
  overflow: "hidden",
} as const;

interface EditingFieldsEditorProps {
  rows: EditingFieldRow[];
  /** Empty: found automatically. */
  idField: string;
  onRowsChange: (rows: EditingFieldRow[]) => void;
  onIdFieldChange: (idField: string) => void;
}

/**
 * A layer's fields: which can be edited, in a list, and all about the chosen
 * one beside it.
 */
export default function EditingFieldsEditor({
  rows,
  idField,
  onRowsChange,
  onIdFieldChange,
}: EditingFieldsEditorProps) {
  const { t } = useTranslation();
  const { fieldLabel } = useLayerFieldLabels();
  const [selectedName, setSelectedName] = useState(rows[0]?.name ?? "");
  const [search, setSearch] = useState("");

  const term = search.trim().toLowerCase();
  const shown = term
    ? rows.filter(
        (row) =>
          row.name.toLowerCase().includes(term) ||
          (row.alias ?? "").toLowerCase().includes(term),
      )
    : rows;
  const selected = rows.find((row) => row.name === selectedName) ?? rows[0];
  const editableShown = shown.filter((row) => row.editable).length;

  const patch = (names: string[], change: Partial<EditingFieldRow>) =>
    onRowsChange(
      rows.map((row) =>
        names.includes(row.name) ? { ...row, ...change } : row,
      ),
    );

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        useFlexGap
        sx={{ alignItems: { sm: "flex-end" } }}
      >
        <SelectWithHelp
          labelKey="layers.editing.idField"
          helpKey="layers.help.editingColIdField"
          fullWidth={false}
          sx={{ minWidth: 220 }}
          displayEmpty
          value={idField}
          onChange={(e) => onIdFieldChange(String(e.target.value))}
        >
          <MenuItem value="">{t("layers.editing.idFieldAuto")}</MenuItem>
          {rows.map((row) => (
            <MenuItem key={row.name} value={row.name}>
              {row.name}
            </MenuItem>
          ))}
          {/* One the service no longer has still shows what is saved. */}
          {idField && !rows.some((row) => row.name === idField) ? (
            <MenuItem value={idField}>{idField}</MenuItem>
          ) : null}
        </SelectWithHelp>
        <TextField
          size="small"
          placeholder={t("layers.editing.searchFields")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ ml: { sm: "auto" } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(240px, 2fr) 3fr" },
          gap: 2,
          alignItems: "start",
        }}
      >
        <Box sx={CARD}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              pl: 2,
              pr: 1.5,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <FormControlLabel
              sx={{ flex: 1 }}
              control={
                <Checkbox
                  size="small"
                  checked={shown.length > 0 && editableShown === shown.length}
                  indeterminate={
                    editableShown > 0 && editableShown < shown.length
                  }
                  onChange={(e) =>
                    patch(
                      shown.map((row) => row.name),
                      { editable: e.target.checked },
                    )
                  }
                />
              }
              label={fieldLabel(
                "layers.editing.allEditable",
                "layers.help.editingColEditable",
              )}
              slotProps={{ typography: { variant: "body2" } }}
            />
            <Typography variant="caption" color="text.secondary">
              {t("layers.editing.editableCount", {
                editable: rows.filter((row) => row.editable).length,
                total: rows.length,
              })}
            </Typography>
          </Box>
          <List
            dense
            disablePadding
            sx={{ maxHeight: "min(60vh, 520px)", overflowY: "auto" }}
          >
            {shown.map((row) => (
              <ListItem
                key={row.name}
                disablePadding
                sx={{
                  bgcolor:
                    row.name === selected?.name ? "action.selected" : undefined,
                }}
              >
                <Checkbox
                  size="small"
                  sx={{ ml: 0.5 }}
                  checked={row.editable}
                  onChange={(e) =>
                    patch([row.name], { editable: e.target.checked })
                  }
                  slotProps={{
                    input: {
                      "aria-label": t("layers.editing.editableAria", {
                        name: row.name,
                      }),
                    },
                  }}
                />
                <ListItemButton
                  onClick={() => setSelectedName(row.name)}
                  sx={{ gap: 1 }}
                >
                  <ListItemText
                    primary={
                      <Stack
                        component="span"
                        direction="row"
                        spacing={0.5}
                        useFlexGap
                        sx={{ alignItems: "center", flexWrap: "wrap" }}
                      >
                        <span>{row.name}</span>
                        {row.name === idField ? (
                          <Chip
                            label={t("layers.editing.col.idField")}
                            size="small"
                          />
                        ) : null}
                        {row.hidden ? (
                          <Chip
                            label={t("layers.editing.col.hidden")}
                            size="small"
                            variant="outlined"
                          />
                        ) : null}
                      </Stack>
                    }
                    secondary={
                      row.alias && row.alias !== row.name
                        ? row.alias
                        : undefined
                    }
                    sx={{ overflowWrap: "anywhere" }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    {t(
                      textTypeLabelKey(
                        row.textType ?? textTypesFor(row.localType)[0],
                        row.localType,
                      ),
                    )}
                    {row.values?.length ? ` (${row.values.length})` : ""}
                  </Typography>
                </ListItemButton>
              </ListItem>
            ))}
            {shown.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ px: 2, py: 1.5 }}
              >
                {t("layers.editing.noMatches")}
              </Typography>
            ) : null}
          </List>
        </Box>

        <Box sx={{ ...CARD, p: 2 }}>
          {selected ? (
            <EditingFieldDetails
              // Afresh for each field, so a half-typed list value stays behind.
              key={selected.name}
              row={selected}
              onPatch={(change) => patch([selected.name], change)}
            />
          ) : null}
        </Box>
      </Box>
    </Stack>
  );
}
