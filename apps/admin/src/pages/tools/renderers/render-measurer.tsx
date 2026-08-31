import { FormControlLabel, Checkbox } from "@mui/material";
import { Control, Controller, FieldValues, useForm } from "react-hook-form";
import FormPanel from "../../../components/form-components/form-panel";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import { useTranslation } from "react-i18next";
import { Tool } from "../../../api/tools";

interface MeasurerRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

/** Placement, active, and window size are managed per-map in map-tools-list. */
export default function MeasurerRenderer({
  tool,
  control: parentControl,
}: MeasurerRendererProps) {
  const { t } = useTranslation();

  const { control: localControl } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "measurer",
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
      <FormPanel title={t("common.information")}>
        <FormFieldGrid>
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
        </FormFieldGrid>
      </FormPanel>
    </>
  );
}
