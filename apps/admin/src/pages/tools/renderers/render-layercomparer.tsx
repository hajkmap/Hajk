import {
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import {
  Control,
  Controller,
  FieldValues,
  UseFormSetValue,
  useForm,
  useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import FormAccordion from "../../../components/form-components/form-accordion";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import { useLayers } from "../../../api/layers";
import { Tool } from "../../../api/tools";
import LayerPicker from "../components/layer-picker";
import { layercomparerDefaults } from "./tool-option-defaults";
import {
  CheckboxOption,
  GroupsOption,
  InstructionOption,
} from "./tool-option-fields";

interface ChosenLayer {
  id: string;
  caption: string;
}

interface LayerComparerRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
  setValue?: UseFormSetValue<FieldValues>;
}

function chosenLayersOf(value: unknown): ChosenLayer[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const layer = item as { id?: unknown; caption?: unknown };
    const id = layer.id != null ? String(layer.id) : "";
    if (!id) return [];
    return [
      {
        id,
        caption: typeof layer.caption === "string" ? layer.caption : id,
      },
    ];
  });
}

/** Window placement is set per map. */
export default function LayerComparerRenderer({
  tool,
  control: parentControl,
  setValue: parentSetValue,
}: LayerComparerRendererProps) {
  const { t } = useTranslation();
  const { control: localControl, setValue: localSetValue } =
    useForm<FieldValues>({
      defaultValues: {
        type: tool?.type ?? "layercomparer",
        options: { ...layercomparerDefaults, ...tool?.options },
      },
    });
  const control = parentControl ?? localControl;
  const setValue = parentSetValue ?? localSetValue;
  const selectChosen = Boolean(
    useWatch({ control, name: "options.selectChosenLayers" }),
  );

  return (
    <>
      <FormAccordion title={t("tools.generalSettings")} defaultExpanded>
        <FormFieldGrid>
          <CheckboxOption
            control={control}
            name="options.visibleAtStart"
            labelKey="tools.visibleAtStart"
          />
          <InstructionOption control={control} />
          <GroupsOption control={control} />
          <FormFieldRow>
            <Controller
              name="options.startCompareMode"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  fullWidth
                  label={t("tools.layercomparer.startCompareMode")}
                  value={field.value === "spyGlass" ? "spyGlass" : "sideBySide"}
                  onChange={(event) => field.onChange(event.target.value)}
                  onBlur={field.onBlur}
                >
                  <MenuItem value="sideBySide">
                    {t("tools.layercomparer.sideBySide")}
                  </MenuItem>
                  <MenuItem value="spyGlass">
                    {t("tools.layercomparer.spyGlass")}
                  </MenuItem>
                </TextField>
              )}
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormAccordion>

      <FormAccordion title={t("tools.layercomparer.layers")} defaultExpanded>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.selectChosenLayers"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => {
                        field.onChange(checked);
                        if (checked) {
                          setValue("options.showNonBaseLayersInSelect", false, {
                            shouldDirty: true,
                          });
                        } else {
                          setValue("options.chosenLayers", [], {
                            shouldDirty: true,
                          });
                        }
                      }}
                    />
                  }
                  label={t("tools.layercomparer.selectChosenLayers")}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.showNonBaseLayersInSelect"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  disabled={selectChosen}
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.layercomparer.showNonBaseLayers")}
                />
              )}
            />
          </FormFieldRow>
          {selectChosen ? (
            <Controller
              name="options.chosenLayers"
              control={control}
              render={({ field }) => (
                <ChosenLayerPicker
                  value={chosenLayersOf(field.value)}
                  onChange={field.onChange}
                />
              )}
            />
          ) : null}
        </FormFieldGrid>
      </FormAccordion>
    </>
  );
}

function ChosenLayerPicker({
  value,
  onChange,
}: {
  value: ChosenLayer[];
  onChange: (layers: ChosenLayer[]) => void;
}) {
  const { t } = useTranslation();
  const { data: layers = [], isLoading, isError } = useLayers();

  const options = layers
    .filter((layer) => (layer.layerKind ?? "display") === "display")
    .sort((a, b) => a.name.localeCompare(b.name, "sv"))
    .map((layer) => ({
      id: layer.id,
      name: layer.name,
      secondary: layer.internalName,
    }));
  const names = new Map(options.map((option) => [option.id, option.name]));
  const captions = new Map(value.map((layer) => [layer.id, layer.caption]));

  return (
    <>
      <Typography variant="body2" color="text.secondary">
        {t("tools.layercomparer.chosenLayersHint")}
      </Typography>
      <LayerPicker
        options={options}
        selectedIds={value.map((layer) => layer.id)}
        onChange={(ids) =>
          onChange(
            ids.map((id) => ({
              id,
              caption: names.get(id) ?? captions.get(id) ?? id,
            })),
          )
        }
        isLoading={isLoading}
        error={isError ? t("tools.layercomparer.layersLoadFailed") : undefined}
        emptyText={t("tools.layercomparer.noLayers")}
      />
    </>
  );
}
