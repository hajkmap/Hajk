import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Radio,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { fetchDescribeFeatureType } from "../../../api/services/describe-feature-type";
import DialogWrapper from "../../../components/flexible-dialog";
import FormPanel from "../../../components/form-components/form-panel";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import { TextFieldWithHelp } from "../../../components/form-components/field-label-with-help";
import {
  EditingFieldRow,
  EditingOptions,
  mergeDescribeWithSavedFields,
} from "../types/editing-layer";
import type { EditableFieldConfig } from "../types/editing-layer";
import { useLayerFieldLabels } from "../use-layer-field-labels";

type EditingCheckboxOption =
  "editPoint" | "editLine" | "editPolygon" | "allowMultiGeometries" | "forceZ";

const GEOMETRY_TYPES = [
  {
    field: "editPoint",
    labelKey: "layers.editing.geometry.point",
    helpKey: "layers.help.editingGeometryPoint",
  },
  {
    field: "editLine",
    labelKey: "layers.editing.geometry.line",
    helpKey: "layers.help.editingGeometryLine",
  },
  {
    field: "editPolygon",
    labelKey: "layers.editing.geometry.polygon",
    helpKey: "layers.help.editingGeometryPolygon",
  },
] as const;

interface EditingLayerSettingsProps {
  serviceUrl: string;
  typeName: string;
  geometryField: string;
  onGeometryFieldChange: (value: string) => void;
  options: EditingOptions;
  onOptionsChange: (value: EditingOptions) => void;
  savedEditableFields: EditableFieldConfig[];
  savedNonEditableFields: EditableFieldConfig[];
  onFieldsChange: (
    editable: EditableFieldConfig[],
    nonEditable: EditableFieldConfig[],
  ) => void;
}

const STRING_INPUT_TYPES = [
  { value: "fritext", labelKey: "layers.editing.textType.text" },
  { value: "datum", labelKey: "layers.editing.textType.dateInput" },
  { value: "lista", labelKey: "layers.editing.textType.list" },
  { value: "flerval", labelKey: "layers.editing.textType.multiSelect" },
  { value: "url", labelKey: "layers.editing.textType.url" },
] as const;

const INTEGER_INPUT_TYPES = [
  { value: "heltal", labelKey: "layers.editing.textType.integer" },
  { value: "positive", labelKey: "layers.editing.textType.positiveInteger" },
  { value: "negative", labelKey: "layers.editing.textType.negativeInteger" },
  { value: "boolean", labelKey: "layers.editing.textType.trueFalse" },
] as const;

const NUMBER_INPUT_TYPES = [
  { value: "tal", labelKey: "layers.editing.textType.number" },
  ...INTEGER_INPUT_TYPES,
] as const;

const TEXT_TYPE_OPTIONS: Record<string, { value: string; labelKey: string }[]> =
  {
    string: [...STRING_INPUT_TYPES],
    int: [...INTEGER_INPUT_TYPES],
    integer: [...INTEGER_INPUT_TYPES],
    number: [...NUMBER_INPUT_TYPES],
    decimal: [...NUMBER_INPUT_TYPES],
    boolean: [
      { value: "boolean", labelKey: "layers.editing.textType.boolean" },
    ],
    date: [{ value: "datum", labelKey: "layers.editing.textType.date" }],
    "date-time": [
      { value: "datumtid", labelKey: "layers.editing.textType.dateTime" },
      { value: "datum", labelKey: "layers.editing.textType.date" },
    ],
  };

function textTypeOptionsFor(localType: string) {
  return TEXT_TYPE_OPTIONS[localType] ?? TEXT_TYPE_OPTIONS.string;
}

function textTypeSelectValue(row: EditingFieldRow): string {
  if (row.textType) return row.textType;
  return textTypeOptionsFor(row.localType)[0]?.value ?? "fritext";
}

function splitRows(rows: EditingFieldRow[]) {
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

function ListValuesCell({
  row,
  rowIndex,
  onPatch,
}: {
  row: EditingFieldRow;
  rowIndex: number;
  onPatch: (index: number, patch: Partial<EditingFieldRow>) => void;
}) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const list = row.values ?? [];

  const commitValue = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (list.includes(trimmed)) {
      setInput("");
      return;
    }
    onPatch(rowIndex, { values: [...list, trimmed] });
    setInput("");
  };

  return (
    <Box sx={{ minWidth: 160, maxWidth: 280 }}>
      <Stack spacing={1}>
        <TextField
          size="small"
          fullWidth
          placeholder={String(
            t("layers.editing.listValueAddPlaceholder"),
          )}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitValue();
            }
          }}
        />
        {list.length > 0 ? (
          <Stack
            direction="row"
            useFlexGap
            spacing={0.5}
            sx={{ flexWrap: "wrap" }}
          >
            {list.map((v, valueIdx) => (
              <Chip
                key={`${rowIndex}-${valueIdx}`}
                label={v}
                size="small"
                variant="outlined"
                color="primary"
                deleteIcon={
                  <CloseRoundedIcon
                    fontSize="small"
                    aria-label={String(
                      t("layers.editing.listValueRemoveAria", {
                        value: v,
                      }),
                    )}
                  />
                }
                onDelete={() => {
                  const next = list.filter((_, j) => j !== valueIdx);
                  onPatch(rowIndex, { values: next.length > 0 ? next : null });
                }}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}

export default function EditingLayerSettings({
  serviceUrl,
  typeName,
  geometryField,
  onGeometryFieldChange,
  options,
  onOptionsChange,
  savedEditableFields,
  savedNonEditableFields,
  onFieldsChange,
}: EditingLayerSettingsProps) {
  const { t } = useTranslation();
  const { fieldLabel } = useLayerFieldLabels();
  const [fieldsDialogOpen, setFieldsDialogOpen] = useState(false);
  const [draftFieldRows, setDraftFieldRows] = useState<EditingFieldRow[]>([]);
  const [draftIdField, setDraftIdField] = useState("");

  const {
    data: describeProperties,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["describeFeatureType", serviceUrl, typeName],
    queryFn: () => fetchDescribeFeatureType(serviceUrl, typeName),
    enabled: Boolean(serviceUrl && typeName),
  });

  const fieldRows = useMemo(() => {
    if (!describeProperties) return [];
    return mergeDescribeWithSavedFields(
      describeProperties,
      savedEditableFields,
      savedNonEditableFields,
    );
  }, [describeProperties, savedEditableFields, savedNonEditableFields]);

  const updateDraftFieldRow = (
    index: number,
    patch: Partial<EditingFieldRow>,
  ) => {
    setDraftFieldRows((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const handleOpenFieldsDialog = () => {
    setDraftFieldRows(fieldRows);
    setDraftIdField(options.idField);
    setFieldsDialogOpen(true);
  };

  const handleCloseFieldsDialog = () => {
    setFieldsDialogOpen(false);
  };

  const handleApplyFieldsDialog = () => {
    const { editableFields, nonEditableFields } = splitRows(draftFieldRows);
    onFieldsChange(editableFields, nonEditableFields);
    onOptionsChange({ ...options, idField: draftIdField });
    setFieldsDialogOpen(false);
  };

  const editableCount = fieldRows.filter((r) => r.editable).length;

  const optionCheckbox = (
    field: EditingCheckboxOption,
    labelKey: string,
    helpKey: string,
  ) => (
    <FormControlLabel
      key={field}
      control={
        <Checkbox
          checked={options[field]}
          onChange={(e) =>
            onOptionsChange({ ...options, [field]: e.target.checked })
          }
        />
      }
      label={fieldLabel(labelKey, helpKey)}
    />
  );

  return (
    <>
      <FormPanel title={t("layers.editing.wfstSection")}>
        <FormFieldGrid>
          <FormFieldRow>
            <TextFieldWithHelp
              labelKey="layers.editing.uri"
              helpKey="layers.help.editingUri"
              fullWidth
              value={options.uri}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onOptionsChange({ ...options, uri: e.target.value })
              }
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormPanel>

      <FormPanel title={t("layers.editing.geometrySection")}>
        <FormFieldGrid>
          <FormFieldRow>
            <TextFieldWithHelp
              labelKey="layers.searchSettings.geometryField"
              helpKey="layers.help.editingGeometryField"
              fullWidth
              value={geometryField}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onGeometryFieldChange(e.target.value)
              }
            />
          </FormFieldRow>
          <FormFieldRow>
            <Typography variant="subtitle2" gutterBottom>
              {t("layers.editing.geometryTypes")}
            </Typography>
            <FormGroup>
              {GEOMETRY_TYPES.map(({ field, labelKey, helpKey }) =>
                optionCheckbox(field, labelKey, helpKey),
              )}
            </FormGroup>
          </FormFieldRow>
          <FormFieldRow>
            <FormGroup>
              {optionCheckbox(
                "allowMultiGeometries",
                "layers.editing.allowMultiGeometries",
                "layers.help.editingAllowMultiGeometries",
              )}
              {optionCheckbox(
                "forceZ",
                "layers.editing.forceZ",
                "layers.help.editingForceZ",
              )}
            </FormGroup>
          </FormFieldRow>
        </FormFieldGrid>
      </FormPanel>

      <FormPanel title={t("layers.editing.editableFields")}>
        {!typeName ? (
          <Alert severity="info">{t("layers.editing.selectLayerFirst")}</Alert>
        ) : isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={32} />
          </Box>
        ) : isError ? (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => void refetch()}
              >
                {t("common.retry")}
              </Button>
            }
          >
            {t("layers.editing.describeFeatureTypeFailed")}
          </Alert>
        ) : fieldRows.length === 0 ? (
          <Alert severity="warning">
            {t("layers.editing.noFieldsFromCapabilities")}
          </Alert>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {t("layers.editing.fieldsSummary", {
                  editable: editableCount,
                  total: fieldRows.length,
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("layers.editing.idFieldSummary", {
                  field:
                    options.idField || t("layers.editing.idFieldAutomatic"),
                })}
              </Typography>
            </Box>
            <Box>
              <Button variant="outlined" onClick={handleOpenFieldsDialog}>
                {t("layers.editing.manageFields")}
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {t("layers.editing.fieldsFromDescribeFeatureType")}
            </Typography>
          </Box>
        )}
      </FormPanel>

      <DialogWrapper
        open={fieldsDialogOpen}
        title={t("layers.editing.editableFields")}
        onClose={handleCloseFieldsDialog}
        fullWidth
        maxWidth="xl"
        actions={
          <>
            <Button onClick={handleCloseFieldsDialog}>
              {t("common.cancel")}
            </Button>
            <Button variant="contained" onClick={handleApplyFieldsDialog}>
              {t("common.dialog.okBtn")}
            </Button>
          </>
        }
      >
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : isError ? (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => void refetch()}
              >
                {t("common.retry")}
              </Button>
            }
          >
            {t("layers.editing.describeFeatureTypeFailed")}
          </Alert>
        ) : (
          <TableContainer sx={{ maxHeight: "min(70vh, 640px)" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>
                    {fieldLabel(
                      "layers.editing.col.editable",
                      "layers.help.editingColEditable",
                    )}
                  </TableCell>
                  <TableCell>
                    {fieldLabel(
                      "layers.editing.col.hidden",
                      "layers.help.editingColHidden",
                    )}
                  </TableCell>
                  <TableCell>
                    {fieldLabel(
                      "layers.editing.col.idField",
                      "layers.help.editingColIdField",
                    )}
                  </TableCell>
                  <TableCell>
                    {fieldLabel("common.name", "layers.help.fieldName")}
                  </TableCell>
                  <TableCell>
                    {fieldLabel(
                      "layers.editing.col.alias",
                      "layers.help.editingColAlias",
                    )}
                  </TableCell>
                  <TableCell>
                    {fieldLabel(
                      "layers.editing.col.description",
                      "layers.help.editingColDescription",
                    )}
                  </TableCell>
                  <TableCell>
                    {fieldLabel(
                      "layers.editing.col.inputType",
                      "layers.help.editingColInputType",
                    )}
                  </TableCell>
                  <TableCell>
                    {fieldLabel(
                      "layers.editing.col.dataType",
                      "layers.help.editingColDataType",
                    )}
                  </TableCell>
                  <TableCell>
                    {fieldLabel(
                      "layers.editing.col.listValues",
                      "layers.help.editingColListValues",
                    )}
                  </TableCell>
                  <TableCell>
                    {fieldLabel(
                      "layers.editing.col.defaultValue",
                      "layers.help.editingColDefaultValue",
                    )}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell padding="checkbox" />
                  <TableCell padding="checkbox">
                    <Radio
                      name="idField"
                      checked={draftIdField === ""}
                      onChange={() => setDraftIdField("")}
                    />
                  </TableCell>
                  <TableCell sx={{ fontStyle: "italic" }}>
                    {t("layers.editing.idFieldAuto")}
                  </TableCell>
                  <TableCell
                    colSpan={6}
                    sx={{ fontStyle: "italic", color: "text.secondary" }}
                  >
                    {t("layers.editing.idFieldAutoDescription")}
                  </TableCell>
                </TableRow>
                {draftFieldRows.map((row, rowIndex) => (
                  <TableRow key={row.name}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={row.editable}
                        onChange={(e) =>
                          updateDraftFieldRow(rowIndex, {
                            editable: e.target.checked,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={row.hidden ?? false}
                        onChange={(e) =>
                          updateDraftFieldRow(rowIndex, {
                            hidden: e.target.checked,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell padding="checkbox">
                      <Radio
                        name="idField"
                        checked={draftIdField === row.name}
                        onChange={() => setDraftIdField(row.name)}
                      />
                    </TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell sx={{ p: 0 }}>
                      <TextField
                        size="small"
                        value={row.alias ?? ""}
                        onChange={(e) =>
                          updateDraftFieldRow(rowIndex, {
                            alias: e.target.value,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        multiline
                        fullWidth
                        rows={4}
                        value={row.description ?? ""}
                        onChange={(e) =>
                          updateDraftFieldRow(rowIndex, {
                            description: e.target.value,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <InputLabel>
                          {t("layers.editing.col.inputType")}
                        </InputLabel>
                        <Select
                          label={t("layers.editing.col.inputType")}
                          value={textTypeSelectValue(row)}
                          onChange={(e) =>
                            updateDraftFieldRow(rowIndex, {
                              textType: e.target.value,
                            })
                          }
                        >
                          {textTypeOptionsFor(row.localType).map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {t(opt.labelKey)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>{row.localType}</TableCell>
                    <TableCell sx={{ verticalAlign: "top", py: 1 }}>
                      <ListValuesCell
                        row={row}
                        rowIndex={rowIndex}
                        onPatch={updateDraftFieldRow}
                      />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: "top", py: 1 }}>
                      <TextField
                        size="small"
                        value={row.defaultValue ?? ""}
                        onChange={(e) =>
                          updateDraftFieldRow(rowIndex, {
                            defaultValue: e.target.value,
                          })
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogWrapper>
    </>
  );
}
