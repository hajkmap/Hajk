import {
  TextField,
  FormControlLabel,
  FormControl,
  Switch,
  Checkbox,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

import { Control, Controller, FieldValues, useForm } from "react-hook-form";
import FormPanel from "../../../components/form-components/form-panel";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import FormAccordion from "../../../components/form-components/form-accordion";
import { useTranslation } from "react-i18next";
import { Tool } from "../../../api/tools";

interface SketchRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

export default function SketchRenderer({ tool }: SketchRendererProps) {
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
      {/* ─────────────────────────────────────────────
          BASIC SETTINGS
      ───────────────────────────────────────────── */}
      <FormPanel title={t("common.information")}>
        <FormFieldGrid>
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
        </FormFieldGrid>
      </FormPanel>

      {/* ─────────────────────────────────────────────
          WINDOW SETTINGS
      ───────────────────────────────────────────── */}
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
