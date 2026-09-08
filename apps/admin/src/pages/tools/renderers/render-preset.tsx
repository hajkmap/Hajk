import { useState } from "react";
import { TextField, Button, IconButton, Stack } from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import {
  Control,
  Controller,
  FieldValues,
  useFieldArray,
  useForm,
} from "react-hook-form";
import FormPanel from "../../../components/form-components/form-panel";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import { useTranslation } from "react-i18next";
import { Tool } from "../../../api/tools";

// Preset isn't a BaseWindowPlugin (client PresetLinks.jsx) — no window
// placement, instruction tooltip, or visibleAtStart to configure.
export const presetDefaults: Record<string, unknown> = {
  title: "Snabbval", // client PresetLinks.jsx:38 `this.options.title || "Snabbval"`
  presetList: [],
  visibleForGroups: [],
};

interface PresetRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

export default function PresetRenderer({
  tool,
  control: parentControl,
}: PresetRendererProps) {
  const { t } = useTranslation();

  const { control: localControl } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "preset",
      options: { ...presetDefaults, ...tool?.options },
    },
  });

  // Use the parent form's control when provided (keeps these fields in the
  // page's single save flow); otherwise fall back to a local, standalone form.
  const control = parentControl ?? localControl;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options.presetList",
  });

  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const addPreset = () => {
    if (!newName.trim() || !newUrl.trim()) return;
    append({ name: newName.trim(), presetUrl: newUrl.trim() });
    setNewName("");
    setNewUrl("");
  };

  return (
    <>
      <FormPanel title={t("common.information")}>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.title"
              control={control}
              defaultValue={tool?.options?.title ?? presetDefaults.title}
              render={({ field }) => (
                <TextField label={t("tools.title")} fullWidth {...field} />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.visibleForGroups"
              control={control}
              defaultValue={
                Array.isArray(tool?.options?.visibleForGroups)
                  ? (tool.options.visibleForGroups as string[]).join(",")
                  : ""
              }
              render={({ field }) => (
                <TextField
                  label={t("tools.visibleForGroups")}
                  fullWidth
                  value={
                    Array.isArray(field.value)
                      ? (field.value as string[]).join(",")
                      : ((field.value as string) ?? "")
                  }
                  onChange={(e) =>
                    field.onChange(
                      e.target.value
                        ? e.target.value.split(",").map((s) => s.trim())
                        : [],
                    )
                  }
                />
              )}
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormPanel>

      <FormPanel title={t("tools.preset.presetList")}>
        <FormFieldGrid>
          {fields.map((item, index) => (
            <FormFieldRow key={item.id}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                <Controller
                  name={`options.presetList.${index}.name`}
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      label={t("tools.preset.presetName")}
                      sx={{ flex: 1 }}
                      {...field}
                    />
                  )}
                />
                <Controller
                  name={`options.presetList.${index}.presetUrl`}
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      label={t("tools.preset.presetUrl")}
                      sx={{ flex: 2 }}
                      {...field}
                    />
                  )}
                />
                <IconButton
                  onClick={() => remove(index)}
                  aria-label={t("common.delete")}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </FormFieldRow>
          ))}

          <FormFieldRow>
            <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
              <TextField
                label={t("tools.preset.presetName")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                sx={{ flex: 1 }}
              />
              <TextField
                label={t("tools.preset.presetUrl")}
                placeholder={t("tools.preset.presetUrlPlaceholder")}
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                sx={{ flex: 2 }}
              />
              <Button
                startIcon={<AddIcon />}
                onClick={addPreset}
                variant="outlined"
              >
                {t("common.add")}
              </Button>
            </Stack>
          </FormFieldRow>
        </FormFieldGrid>
      </FormPanel>
    </>
  );
}
