import { TextField, Typography } from "@mui/material";
import { Control, Controller, FieldValues, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FormAccordion from "../../../components/form-components/form-accordion";
import FormFieldGrid from "../../../components/form-components/form-field-grid";
import { useLayers } from "../../../api/layers";
import { Tool } from "../../../api/tools";
import LayerPicker from "../components/layer-picker";
import { editDefaults } from "./tool-option-defaults";
import {
  CheckboxOption,
  GroupsOption,
  InstructionOption,
} from "./tool-option-fields";

interface ActiveService {
  id: string;
  visibleForGroups?: string[];
}

interface EditRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

/** The client builds the WFS sources from these services. Placement is per map. */
export default function EditRenderer({
  tool,
  control: parentControl,
}: EditRendererProps) {
  const { t } = useTranslation();
  const { control: localControl } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "edit",
      options: { ...editDefaults, ...tool?.options },
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
          <InstructionOption control={control} />
          <GroupsOption control={control} />
        </FormFieldGrid>
      </FormAccordion>
      <FormAccordion title={t("tools.edit.services")} defaultExpanded>
        <Controller
          name="options.activeServices"
          control={control}
          render={({ field }) => (
            <EditingServices
              value={servicesOf(field.value)}
              onChange={field.onChange}
            />
          )}
        />
      </FormAccordion>
    </>
  );
}

function servicesOf(value: unknown): ActiveService[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string" || typeof item === "number") {
      return [{ id: String(item), visibleForGroups: [] }];
    }
    if (!item || typeof item !== "object") return [];
    const service = item as { id?: unknown; visibleForGroups?: unknown };
    if (service.id == null) return [];
    return [
      {
        id: String(service.id),
        visibleForGroups: Array.isArray(service.visibleForGroups)
          ? service.visibleForGroups.map(String)
          : [],
      },
    ];
  });
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

  const options = layers
    .filter((layer) => layer.layerKind === "editing")
    .sort((a, b) => a.name.localeCompare(b.name, "sv"))
    .map((layer) => ({
      id: layer.id,
      name: layer.name,
      secondary: layer.internalName,
    }));
  const byId = new Map(value.map((service) => [service.id, service]));

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
        {t("tools.edit.servicesHint")}
      </Typography>
      <LayerPicker
        options={options}
        selectedIds={value.map((service) => service.id)}
        onChange={(ids) =>
          onChange(ids.map((id) => byId.get(id) ?? { id, visibleForGroups: [] }))
        }
        isLoading={isLoading}
        error={isError ? t("tools.edit.layersLoadFailed") : undefined}
        emptyText={t("tools.edit.noServices")}
        renderSelectedDetails={(id) => (
          <TextField
            size="small"
            label={t("tools.visibleForGroups")}
            fullWidth
            value={(byId.get(id)?.visibleForGroups ?? []).join(", ")}
            onChange={(event) => setGroups(id, event.target.value)}
          />
        )}
      />
    </FormFieldGrid>
  );
}
