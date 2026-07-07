import {
  TextField,
  FormControl,
  Switch,
  InputLabel,
  FormControlLabel,
  Select,
  MenuItem,
} from "@mui/material";

import { Control, Controller, FieldValues, useForm } from "react-hook-form";
import FormAccordion from "../../../components/form-components/form-accordion";
import FormPanel from "../../../components/form-components/form-panel";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import { useTranslation } from "react-i18next";
import { Tool } from "../../../api/tools";

interface MeasureRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

export default function MeasureRenderer({ tool }: MeasureRendererProps) {
  const { t } = useTranslation();

  const { control } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "sketch",
      ...(tool?.options
        ? Object.fromEntries(
            Object.entries(tool.options).map(([k, v]) => [`options.${k}`, v]),
          )
        : {}),
    },
  });

  return (
    <>
      <FormPanel title={t("common.information")}>
        {/* Aktiverad */}
        <FormFieldRow>
          <Controller
            name="options.active"
            control={control}
            defaultValue={Boolean(tool?.options?.active)}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={!!field.value}
                    onChange={(_, checked) => field.onChange(checked)}
                  />
                }
                label={t("tools.active")}
              />
            )}
          />
        </FormFieldRow>
      </FormPanel>
      <FormAccordion title={t("tools.windowSettings")} defaultExpanded>
        <FormFieldGrid>
          {/* Sorteringsordning */}
          <FormFieldRow>
            <Controller
              name="options.index"
              control={control}
              defaultValue={tool?.options?.index ?? 300}
              render={({ field }) => (
                <TextField
                  type="number"
                  label={t("tools.sortIndex")}
                  fullWidth
                  {...field}
                />
              )}
            />
          </FormFieldRow>

          {/* Verktygsplacering */}
          <FormFieldRow>
            <FormControl fullWidth>
              <InputLabel>{t("tools.toolPlacement")}</InputLabel>
              <Controller
                name="options.placement"
                control={control}
                defaultValue={tool?.options?.placement ?? "drawer"}
                render={({ field }) => (
                  <Select {...field} label={t("tools.toolPlacement")}>
                    <MenuItem value="drawer">{t("tools.drawer")}</MenuItem>
                    <MenuItem value="sidepanel">
                      {t("tools.sidepanel")}
                    </MenuItem>
                    <MenuItem value="window">{t("tools.window")}</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </FormFieldRow>

          {/* Fönsterplacering */}
          <FormFieldRow>
            <FormControl fullWidth>
              <InputLabel>{t("tools.windowPlacement")}</InputLabel>
              <Controller
                name="options.position"
                control={control}
                defaultValue={tool?.options?.position ?? "right"}
                render={({ field }) => (
                  <Select {...field} label={t("tools.windowPlacement")}>
                    <MenuItem value="left">{t("tools.left")}</MenuItem>
                    <MenuItem value="right">{t("tools.right")}</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </FormFieldRow>

          {/* Fönsterbredd */}
          <FormFieldRow>
            <Controller
              name="options.width"
              control={control}
              defaultValue={tool?.options?.width ?? ""}
              render={({ field }) => (
                <TextField
                  label={t("tools.windowWidth")}
                  fullWidth
                  {...field}
                />
              )}
            />
          </FormFieldRow>

          {/* Fönsterhöjd */}
          <FormFieldRow>
            <Controller
              name="options.height"
              control={control}
              defaultValue={tool?.options?.height ?? ""}
              render={({ field }) => (
                <TextField
                  label={t("tools.windowHeight")}
                  fullWidth
                  {...field}
                />
              )}
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormAccordion>
    </>
  );
}
