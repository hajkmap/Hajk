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

// ExternalLinks isn't a BaseWindowPlugin (client controls/ExternalLinks.jsx)
// — no window placement, instruction tooltip, or visibleAtStart to configure.
export const externalLinksDefaults: Record<string, unknown> = {
  title: "Öppna koordinat i extern applikation", // client ExternalLinks.jsx:34 fallback
  list: [],
  visibleForGroups: [],
};

interface ExternalLinksRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

export default function ExternalLinksRenderer({
  tool,
  control: parentControl,
}: ExternalLinksRendererProps) {
  const { t } = useTranslation();

  const { control: localControl } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "externalLinks",
      options: { ...externalLinksDefaults, ...tool?.options },
    },
  });

  // Use the parent form's control when provided (keeps these fields in the
  // page's single save flow); otherwise fall back to a local, standalone form.
  const control = parentControl ?? localControl;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options.list",
  });

  const [newName, setNewName] = useState("");
  const [newUri, setNewUri] = useState("");

  const addLink = () => {
    if (!newName.trim() || !newUri.trim()) return;
    append({ name: newName.trim(), uri: newUri.trim() });
    setNewName("");
    setNewUri("");
  };

  return (
    <>
      <FormPanel title={t("common.information")}>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.title"
              control={control}
              defaultValue={
                tool?.options?.title ?? externalLinksDefaults.title
              }
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

      <FormPanel title={t("tools.externalLinks.linkList")}>
        <FormFieldGrid>
          {fields.map((item, index) => (
            <FormFieldRow key={item.id}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                <Controller
                  name={`options.list.${index}.name`}
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      label={t("tools.externalLinks.linkName")}
                      sx={{ flex: 1 }}
                      {...field}
                    />
                  )}
                />
                <Controller
                  name={`options.list.${index}.uri`}
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      label={t("tools.externalLinks.linkUrl")}
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
                label={t("tools.externalLinks.linkName")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                sx={{ flex: 1 }}
              />
              <TextField
                label={t("tools.externalLinks.linkUrl")}
                placeholder={t("tools.externalLinks.linkUrlPlaceholder")}
                value={newUri}
                onChange={(e) => setNewUri(e.target.value)}
                sx={{ flex: 2 }}
              />
              <Button
                startIcon={<AddIcon />}
                onClick={addLink}
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
