import { MenuItem, TextField, Typography } from "@mui/material";
import { Control, Controller, FieldValues, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FormAccordion from "../../../components/form-components/form-accordion";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import { useLayers } from "../../../api/layers";
import { Tool } from "../../../api/tools";
import LayerPicker from "../components/layer-picker";
import { timesliderDefaults } from "./tool-option-defaults";
import {
  CheckboxOption,
  InstructionOption,
  TextOption,
} from "./tool-option-fields";

interface TimeSliderRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

/** Window placement is set per map. */
export default function TimeSliderRenderer({
  tool,
  control: parentControl,
}: TimeSliderRendererProps) {
  const { t } = useTranslation();
  const { control: localControl } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "timeslider",
      options: { ...timesliderDefaults, ...tool?.options },
    },
  });
  const control = parentControl ?? localControl;

  return (
    <>
      <FormAccordion title={t("tools.generalSettings")} defaultExpanded>
        <FormFieldGrid>
          <TextOption
            control={control}
            name="options.title"
            labelKey="tools.title"
          />
          <CheckboxOption
            control={control}
            name="options.visibleAtStart"
            labelKey="tools.visibleAtStart"
          />
          <InstructionOption control={control} />
          <FormFieldRow>
            <Controller
              name="options.defaultResolution"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  fullWidth
                  label={t("tools.timeslider.resolution")}
                  helperText={t("tools.timeslider.resolutionHelp")}
                  value={
                    field.value === "days" || field.value === "months"
                      ? field.value
                      : "years"
                  }
                  onChange={(event) => field.onChange(event.target.value)}
                  onBlur={field.onBlur}
                >
                  <MenuItem value="days">{t("tools.timeslider.days")}</MenuItem>
                  <MenuItem value="months">
                    {t("tools.timeslider.months")}
                  </MenuItem>
                  <MenuItem value="years">
                    {t("tools.timeslider.years")}
                  </MenuItem>
                </TextField>
              )}
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormAccordion>
      <FormAccordion title={t("tools.timeslider.layers")} defaultExpanded>
        <Controller
          name="options.layers"
          control={control}
          render={({ field }) => (
            <TimedLayers
              value={layerIdsOf(field.value)}
              onChange={field.onChange}
            />
          )}
        />
      </FormAccordion>
    </>
  );
}

function layerIdsOf(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string" || typeof item === "number") {
      return [String(item)];
    }
    if (item && typeof item === "object" && "id" in item && item.id != null) {
      return [String(item.id)];
    }
    return [];
  });
}

function formatDate(value?: string): string {
  return value && value.length === 8
    ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}`
    : "";
}

function TimedLayers({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const { t } = useTranslation();
  const { data: layers = [], isLoading, isError } = useLayers();

  const options = layers
    .filter(
      (layer) =>
        (layer.layerKind ?? "display") === "display" &&
        layer.timeSliderStart?.length === 8 &&
        layer.timeSliderEnd?.length === 8,
    )
    .sort((a, b) => a.name.localeCompare(b.name, "sv"))
    .map((layer) => ({
      id: layer.id,
      name: layer.name,
      secondary: `${formatDate(layer.timeSliderStart)} – ${formatDate(layer.timeSliderEnd)}`,
    }));

  return (
    <FormFieldGrid>
      <Typography variant="body2" color="text.secondary">
        {t("tools.timeslider.layersHint")}
      </Typography>
      <LayerPicker
        options={options}
        selectedIds={value}
        onChange={onChange}
        isLoading={isLoading}
        error={isError ? t("tools.timeslider.layersLoadFailed") : undefined}
        emptyText={t("tools.timeslider.noLayers")}
      />
    </FormFieldGrid>
  );
}
