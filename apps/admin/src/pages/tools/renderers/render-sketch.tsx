import { TextField, FormControlLabel, Checkbox } from "@mui/material";

import { Control, Controller, FieldValues, useForm } from "react-hook-form";
import FormPanel from "../../../components/form-components/form-panel";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import { useTranslation } from "react-i18next";
import { Tool } from "../../../api/tools";
import ToolNameField from "./tool-name-field";
import { sketchDefaults } from "./tool-option-defaults";
import { GroupsOption } from "./tool-option-fields";

interface SketchRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

export default function SketchRenderer({
  tool,
  control: parentControl,
}: SketchRendererProps) {
  const { t } = useTranslation();

  const { control: localControl } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "sketch",
      options: { ...sketchDefaults, ...tool?.options },
    },
  });

  // Use the parent form's control when provided (keeps these fields in the
  // page's single save flow); otherwise fall back to a local, standalone form.
  const control = parentControl ?? localControl;

  return (
    <>
      <FormPanel title={t("common.information")}>
        <FormFieldGrid>
          <ToolNameField control={control} />
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
              name="options.instruction"
              control={control}
              defaultValue={tool?.options?.instruction ?? ""}
              render={({ field }) => (
                <TextField
                  label={t("tools.instruction")}
                  fullWidth
                  multiline
                  rows={4}
                  value={
                    typeof field.value === "string" && field.value
                      ? atob(field.value)
                      : ""
                  }
                  onChange={(e) => field.onChange(btoa(e.target.value))}
                />
              )}
            />
          </FormFieldRow>

          <GroupsOption control={control} />
        </FormFieldGrid>
      </FormPanel>
    </>
  );
}
