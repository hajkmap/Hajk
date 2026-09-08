import { TextField, FormControlLabel, Checkbox } from "@mui/material";
import { Control, Controller, FieldValues, useForm } from "react-hook-form";
import FormPanel from "../../../components/form-components/form-panel";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import { useTranslation } from "react-i18next";
import { Tool } from "../../../api/tools";

// Matches Information.jsx's own fallback for `title`. Used as the isDirty baseline in settings.tsx.
export const informationDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  showInfoOnce: false,
  title: "Om kartan",
  headerText: "Om kartan",
  text: "Information om kartan",
  buttonText: "Stäng",
  visibleForGroups: [],
};

interface InformationRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

/** Placement, active, and window size are managed per-map in map-tools-list. */
export default function InformationRenderer({
  tool,
  control: parentControl,
}: InformationRendererProps) {
  const { t } = useTranslation();

  const { control: localControl } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "information",
      options: { ...informationDefaults, ...tool?.options },
    },
  });

  // Use the parent form's control when provided (keeps these fields in the
  // page's single save flow); otherwise fall back to a local, standalone form.
  const control = parentControl ?? localControl;

  return (
    <>
      <FormPanel title={t("common.information")}>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.title"
              control={control}
              defaultValue={tool?.options?.title ?? ""}
              render={({ field }) => (
                <TextField
                  label={t("tools.information.title")}
                  fullWidth
                  {...field}
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.headerText"
              control={control}
              defaultValue={tool?.options?.headerText ?? ""}
              render={({ field }) => (
                <TextField
                  label={t("tools.information.headerText")}
                  fullWidth
                  {...field}
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.text"
              control={control}
              defaultValue={tool?.options?.text ?? ""}
              render={({ field }) => (
                <TextField
                  label={t("tools.information.text")}
                  fullWidth
                  multiline
                  rows={4}
                  {...field}
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.buttonText"
              control={control}
              defaultValue={tool?.options?.buttonText ?? ""}
              render={({ field }) => (
                <TextField
                  label={t("tools.information.buttonText")}
                  fullWidth
                  {...field}
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.visibleAtStart"
              control={control}
              defaultValue={Boolean(tool?.options?.visibleAtStart)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.visibleAtStart")}
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.showInfoOnce"
              control={control}
              defaultValue={Boolean(tool?.options?.showInfoOnce)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.information.showInfoOnce")}
                />
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
    </>
  );
}
