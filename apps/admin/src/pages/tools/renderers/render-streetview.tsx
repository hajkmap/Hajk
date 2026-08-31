import { TextField, FormControlLabel, Checkbox } from "@mui/material";
import { Control, Controller, FieldValues, useForm } from "react-hook-form";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import FormAccordion from "../../../components/form-components/form-accordion";
import { useTranslation } from "react-i18next";
import { Tool } from "../../../api/tools";

interface StreetViewRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

export default function StreetViewRenderer({
  tool,
  control: parentControl,
}: StreetViewRendererProps) {
  const { t } = useTranslation();
  const { control: localControl } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "streetview",
      ...(tool?.options
        ? Object.fromEntries(
            Object.entries(tool.options).map(([k, v]) => [`options.${k}`, v]),
          )
        : {}),
    },
  });

  // Use the parent form's control when provided (keeps these fields in the
  // page's single save flow); otherwise fall back to a local, standalone form.
  const control = parentControl ?? localControl;

  return (
    <>
      {/* ─────────────────────────────────────────────
          OTHER SETTINGS
      ───────────────────────────────────────────── */}
      <FormAccordion title={t("tools.generalSettings")} defaultExpanded>
        <FormFieldGrid>
          {/* Synlig vid start */}
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

          {/* Instruktion */}
          <FormFieldRow>
            <Controller
              name="options.instruction"
              control={control}
              defaultValue={tool?.options?.instruction ?? ""}
              render={({ field }) => (
                <TextField
                  label={t("tools.instructionText")}
                  fullWidth
                  multiline
                  rows={4}
                  {...field}
                />
              )}
            />
          </FormFieldRow>

          {/* Tillträde */}
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

          {/* API-nyckel */}
          <FormFieldRow>
            <Controller
              name="options.apiKey"
              control={control}
              defaultValue={tool?.options?.apiKey ?? ""}
              render={({ field }) => (
                <TextField label={t("tools.apiKey")} fullWidth {...field} />
              )}
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormAccordion>
    </>
  );
}
