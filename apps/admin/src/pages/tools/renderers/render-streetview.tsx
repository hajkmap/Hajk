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

export default function StreetViewRenderer({ tool }: StreetViewRendererProps) {
  const { t } = useTranslation();
  const { control } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "streetview",
      ...(tool?.options
        ? Object.fromEntries(
            Object.entries(tool.options).map(([k, v]) => [`options.${k}`, v]),
          )
        : {}),
    },
  });

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
              name="options.access"
              control={control}
              defaultValue={tool?.options?.access ?? ""}
              render={({ field }) => (
                <TextField label={t("tools.access")} fullWidth {...field} />
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
