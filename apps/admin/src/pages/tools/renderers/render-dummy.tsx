import { Typography } from "@mui/material";
import { Control, FieldValues, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FormAccordion from "../../../components/form-components/form-accordion";
import FormFieldGrid from "../../../components/form-components/form-field-grid";
import { Tool } from "../../../api/tools";
import { dummyDefaults } from "./tool-option-defaults";
import { CheckboxOption, GroupsOption } from "./tool-option-fields";

interface DummyRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

/** Test plugin. Placement is set per map. */
export default function DummyRenderer({
  tool,
  control: parentControl,
}: DummyRendererProps) {
  const { t } = useTranslation();
  const { control: localControl } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "dummy",
      options: { ...dummyDefaults, ...tool?.options },
    },
  });
  const control = parentControl ?? localControl;

  return (
    <FormAccordion title={t("tools.generalSettings")} defaultExpanded>
      <FormFieldGrid>
        <Typography variant="body2" color="text.secondary">
          {t("tools.dummy.hint")}
        </Typography>
        <CheckboxOption
          control={control}
          name="options.visibleAtStart"
          labelKey="tools.visibleAtStart"
        />
        <GroupsOption control={control} />
      </FormFieldGrid>
    </FormAccordion>
  );
}
