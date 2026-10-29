import { useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { fetchDescribeFeatureType } from "../../../api/services/describe-feature-type";
import FormPanel from "../../../components/form-components/form-panel";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import { TextFieldWithHelp } from "../../../components/form-components/field-label-with-help";
import {
  EditingOptions,
  mergeDescribeWithSavedFields,
  splitEditingFields,
} from "../types/editing-layer";
import type { EditableFieldConfig } from "../types/editing-layer";
import { useLayerFieldLabels } from "../use-layer-field-labels";
import EditingFieldsEditor from "./editing-fields-editor";

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
            <EditingFieldsEditor
              rows={fieldRows}
              idField={options.idField}
              onRowsChange={(rows) => {
                const { editableFields, nonEditableFields } =
                  splitEditingFields(rows);
                onFieldsChange(editableFields, nonEditableFields);
              }}
              onIdFieldChange={(idField) =>
                onOptionsChange({ ...options, idField })
              }
            />
            <Typography variant="caption" color="text.secondary">
              {t("layers.editing.fieldsFromDescribeFeatureType")}
            </Typography>
          </Box>
        )}
      </FormPanel>
    </>
  );
}
