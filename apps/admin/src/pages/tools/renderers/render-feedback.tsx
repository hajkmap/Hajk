import { Typography } from "@mui/material";
import { Control, Controller, FieldValues, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FormAccordion from "../../../components/form-components/form-accordion";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import { TextFieldWithHelp } from "../../../components/form-components/field-label-with-help";
import { Tool } from "../../../api/tools";
import { feedbackDefaults } from "./tool-option-defaults";
import {
  CheckboxOption,
  GroupsOption,
  TextOption,
} from "./tool-option-fields";

interface FeedbackRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

/** Window placement is set per map. These are the message fields. */
export default function FeedbackRenderer({
  tool,
  control: parentControl,
}: FeedbackRendererProps) {
  const { t } = useTranslation();
  const { control: localControl } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "feedback",
      options: { ...feedbackDefaults, ...tool?.options },
    },
  });
  const control = parentControl ?? localControl;

  return (
    <FormAccordion title={t("tools.generalSettings")} defaultExpanded>
      <FormFieldGrid>
        <Typography variant="body2" color="text.secondary">
          {t("tools.feedback.backendHint")}
        </Typography>
        <CheckboxOption
          control={control}
          name="options.visibleAtStart"
          labelKey="tools.visibleAtStart"
        />
        <CheckboxOption
          control={control}
          name="options.visibleAtStartMobile"
          labelKey="tools.visibleAtStartMobile"
        />
        <TextOption control={control} name="options.title" labelKey="tools.title" />
        <TextOption
          control={control}
          name="options.description"
          labelKey="tools.description"
          helpKey="tools.feedback.descriptionHelp"
        />
        <TextOption
          control={control}
          name="options.instructionText"
          labelKey="tools.feedback.instructionText"
          helpKey="tools.feedback.instructionTextHelp"
          multiline
        />
        <TextOption
          control={control}
          name="options.thankYouText"
          labelKey="tools.feedback.thankYouText"
          helpKey="tools.feedback.thankYouTextHelp"
          multiline
        />
        <FormFieldRow>
          <Controller
            name="options.maxLength"
            control={control}
            rules={{
              validate: (value) =>
                Number.isInteger(Number(value)) && Number(value) > 0
                  ? true
                  : t("tools.feedback.maxLengthInvalid"),
            }}
            render={({ field, fieldState }) => (
              <TextFieldWithHelp
                labelKey="tools.feedback.maxLength"
                helpKey="tools.feedback.maxLengthHelp"
                fullWidth
                type="number"
                value={field.value ?? ""}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={(event) => {
                  const raw = event.target.value;
                  field.onChange(raw === "" ? "" : Number(raw));
                }}
                onBlur={field.onBlur}
              />
            )}
          />
        </FormFieldRow>
        <GroupsOption control={control} />
      </FormFieldGrid>
    </FormAccordion>
  );
}
