import { Typography } from "@mui/material";
import { Control, FieldValues, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FormAccordion from "../../../components/form-components/form-accordion";
import FormFieldGrid from "../../../components/form-components/form-field-grid";
import { Tool } from "../../../api/tools";
import { commandpaletteDefaults } from "./tool-option-defaults";
import { GroupsOption } from "./tool-option-fields";

interface CommandPaletteRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

/** Opens from the keyboard. Placement is not configured here. */
export default function CommandPaletteRenderer({
  tool,
  control: parentControl,
}: CommandPaletteRendererProps) {
  const { t } = useTranslation();
  const { control: localControl } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "commandpalette",
      options: { ...commandpaletteDefaults, ...tool?.options },
    },
  });
  const control = parentControl ?? localControl;

  return (
    <FormAccordion title={t("tools.generalSettings")} defaultExpanded>
      <FormFieldGrid>
        <Typography variant="body2" color="text.secondary">
          {t("tools.commandpalette.hint")}
        </Typography>
        <GroupsOption control={control} />
      </FormFieldGrid>
    </FormAccordion>
  );
}
