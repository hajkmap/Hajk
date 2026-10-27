import {
  Alert,
  Box,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import { Control, Controller, FieldValues, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FormAccordion from "../../../components/form-components/form-accordion";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import { useLayers } from "../../../api/layers";
import { Tool } from "../../../api/tools";
import { attributeeditorDefaults } from "./tool-option-defaults";
import {
  CheckboxOption,
  GroupsOption,
  NumberOption,
  TextOption,
} from "./tool-option-fields";

/** An editing layer the tool edits, and the groups that may use it. */
interface ActiveService {
  id: string;
  visibleForGroups?: string[];
}

interface AttributeEditorRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

/** Window placement and size are set per map. */
export default function AttributeEditorRenderer({
  tool,
  control: parentControl,
}: AttributeEditorRendererProps) {
  const { t } = useTranslation();
  const { control: localControl } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "attributeeditor",
      options: { ...attributeeditorDefaults, ...tool?.options },
    },
  });
  const control = parentControl ?? localControl;

  return (
    <>
      <FormAccordion title={t("tools.generalSettings")} defaultExpanded>
        <FormFieldGrid>
          <CheckboxOption
            control={control}
            name="options.visibleAtStart"
            labelKey="tools.visibleAtStart"
          />
          <TextOption
            control={control}
            name="options.title"
            labelKey="tools.title"
          />
          <TextOption
            control={control}
            name="options.description"
            labelKey="tools.description"
            helpKey="tools.attributeeditor.descriptionHelp"
          />
          <NumberOption
            control={control}
            name="options.zoomLevel"
            labelKey="tools.attributeeditor.zoomLevel"
            helpKey="tools.attributeeditor.zoomLevelHelp"
          />
          <GroupsOption control={control} />
        </FormFieldGrid>
      </FormAccordion>
      <FormAccordion
        title={t("tools.attributeeditor.services")}
        defaultExpanded
      >
        <Controller
          name="options.activeServices"
          control={control}
          render={({ field }) => (
            <EditingServices
              value={
                Array.isArray(field.value)
                  ? (field.value as ActiveService[])
                  : []
              }
              onChange={field.onChange}
            />
          )}
        />
      </FormAccordion>
    </>
  );
}

function EditingServices({
  value,
  onChange,
}: {
  value: ActiveService[];
  onChange: (services: ActiveService[]) => void;
}) {
  const { t } = useTranslation();
  const { data: layers = [], isLoading, isError } = useLayers();

  if (isLoading) return <CircularProgress size={24} />;
  if (isError) {
    return (
      <Alert severity="error">
        {t("tools.attributeeditor.layersLoadFailed")}
      </Alert>
    );
  }

  const editingLayers = layers
    .filter((layer) => layer.layerKind === "editing")
    .sort((a, b) => a.name.localeCompare(b.name, "sv"));
  const known = new Set(editingLayers.map((layer) => layer.id));
  const gone = value.filter((service) => !known.has(service.id));

  const toggle = (id: string, checked: boolean) =>
    onChange(
      checked
        ? [...value, { id, visibleForGroups: [] }]
        : value.filter((service) => service.id !== id),
    );
  const setGroups = (id: string, text: string) =>
    onChange(
      value.map((service) =>
        service.id === id
          ? {
              ...service,
              visibleForGroups: text
                ? text.split(",").map((part) => part.trim())
                : [],
            }
          : service,
      ),
    );

  return (
    <FormFieldGrid>
      <Typography variant="body2" color="text.secondary">
        {t(
          editingLayers.length > 0
            ? "tools.attributeeditor.servicesHint"
            : "tools.attributeeditor.noServices",
        )}
      </Typography>
      {editingLayers.map((layer) => {
        const service = value.find((entry) => entry.id === layer.id);
        return (
          <FormFieldRow key={layer.id}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(service)}
                  onChange={(_, checked) => toggle(layer.id, checked)}
                />
              }
              label={layer.name}
            />
            {service ? (
              <Box sx={{ pl: 4 }}>
                <TextField
                  label={t("tools.visibleForGroups")}
                  fullWidth
                  value={(service.visibleForGroups ?? []).join(", ")}
                  onChange={(event) => setGroups(layer.id, event.target.value)}
                />
              </Box>
            ) : null}
          </FormFieldRow>
        );
      })}
      {gone.map((service) => (
        <FormFieldRow key={service.id}>
          <FormControlLabel
            control={
              <Checkbox checked onChange={() => toggle(service.id, false)} />
            }
            label={t("tools.attributeeditor.serviceGone", { id: service.id })}
          />
        </FormFieldRow>
      ))}
    </FormFieldGrid>
  );
}
