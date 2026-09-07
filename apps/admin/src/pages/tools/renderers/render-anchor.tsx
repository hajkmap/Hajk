import { useEffect } from "react";
import { TextField, FormControlLabel, Checkbox } from "@mui/material";
import { Controller, useForm, FieldValues, Control } from "react-hook-form";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import FormAccordion from "../../../components/form-components/form-accordion";
import { useTranslation } from "react-i18next";
import { Tool } from "../../../api/tools";

// Matches AnchorView.jsx's own fallbacks. Used as the isDirty baseline in settings.tsx.
export const anchorDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  allowCreatingCleanUrls: true,
  instruction: "",
  visibleForGroups: [],
};

interface AnchorToolRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

export default function AnchorToolRenderer({
  tool,
  control: parentControl,
}: AnchorToolRendererProps) {
  const { t } = useTranslation();

  const { control: localControl, reset } = useForm<FieldValues>({
    mode: "onChange",
    reValidateMode: "onChange",
  });

  // Use parent control if provided, otherwise use local
  const control = parentControl ?? localControl;

  // Reset form with tool data when it loads (only for local control)
  useEffect(() => {
    if (tool && !parentControl) {
      reset({
        type: tool.type ?? "",
        options: { ...anchorDefaults, ...tool.options },
      });
    }
  }, [tool, reset, parentControl]);

  return (
    <>
      <FormAccordion title={t("tools.settings")} defaultExpanded>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.visibleAtStart"
              control={control}
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
              name="options.allowCreatingCleanUrls"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.allowCreatingCleanUrls")}
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.instruction"
              control={control}
              render={({ field }) => (
                <TextField
                  label={t("tools.instruction")}
                  fullWidth
                  multiline
                  rows={3}
                  value={field.value ? atob(field.value as string) : ""}
                  onChange={(e) => field.onChange(btoa(e.target.value))}
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.visibleForGroups"
              control={control}
              render={({ field }) => (
                <TextField
                  label={t("tools.visibleForGroups")}
                  fullWidth
                  value={((field.value as string[]) ?? []).join(",")}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? e.target.value.split(",") : [],
                    )
                  }
                />
              )}
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormAccordion>
    </>
  );
}
