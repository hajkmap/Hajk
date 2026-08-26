import {
  TextField,
  FormControlLabel,
  FormControl,
  MenuItem,
  InputLabel,
  Select,
  Switch,
  Checkbox,
} from "@mui/material";

import FormPanel from "../../../components/form-components/form-panel";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import FormAccordion from "../../../components/form-components/form-accordion";

import { Control, Controller, FieldValues, useForm } from "react-hook-form";
import { SketchPicker } from "react-color";
import { useTranslation } from "react-i18next";
import { Tool } from "../../../api/tools";

interface PrintToolRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

export default function PrintToolRenderer({ tool }: PrintToolRendererProps) {
  const { t } = useTranslation();

  const { control } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "print",
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
         BASIC INFORMATION
      ───────────────────────────────────────────── */}
      <FormPanel title={t("common.information")}>
        <FormFieldGrid>
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

      {/* ─────────────────────────────────────────────
         IMAGE PROCESSING SETTINGS
      ───────────────────────────────────────────── */}
      <FormAccordion title={t("tools.imageProcessing")}>
        <FormFieldGrid>
          <FormFieldRow>
            <FormControlLabel
              control={
                <Controller
                  name="options.useCustomTileLoaders"
                  control={control}
                  defaultValue={tool?.options?.useCustomTileLoaders ?? true}
                  render={({ field }) => (
                    <Switch
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  )}
                />
              }
              label={t("tools.useCustomTileLoaders")}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.maxTileSize"
              control={control}
              defaultValue={tool?.options?.maxTileSize ?? 4096}
              render={({ field }) => (
                <TextField
                  type="number"
                  label={t("tools.maxTileSize")}
                  fullWidth
                  {...field}
                />
              )}
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormAccordion>

      {/* ─────────────────────────────────────────────
         PRINT METADATA
      ───────────────────────────────────────────── */}
      <FormAccordion title={t("tools.printMetadata")}>
        <FormFieldGrid>
          {[
            ["copyright", "tools.copyright"],
            ["disclaimer", "tools.disclaimer"],
            ["date", "tools.date"],
            ["scales", "tools.scales"],
            ["scaleMeters", "tools.scaleMeters"],
            ["dpis", "tools.dpis"],
            ["paperFormats", "tools.paperFormats"],
            ["logo", "tools.logo"],
            ["northArrow", "tools.northArrow"],
          ].map(([key, label]) => (
            <FormFieldRow key={key}>
              <Controller
                name={`options.${key}`}
                control={control}
                defaultValue={tool?.options?.[key] ?? ""}
                render={({ field }) => (
                  <TextField label={t(label)} fullWidth {...field} />
                )}
              />
            </FormFieldRow>
          ))}
        </FormFieldGrid>
      </FormAccordion>

      {/* ─────────────────────────────────────────────
         PRINT TOGGLES
      ───────────────────────────────────────────── */}
      <FormAccordion title={t("tools.printToggles")}>
        <FormFieldGrid>
          {[
            ["includeLogo", "tools.includeLogo"],
            ["includeNorthArrow", "tools.includeNorthArrow"],
            ["includeScaleBar", "tools.includeScaleBar"],
            ["includeQrCode", "tools.includeQrCode"],
            ["includeImageBorder", "tools.includeImageBorder"],
          ].map(([key, label]) => (
            <FormFieldRow key={key}>
              <Controller
                name={`options.${key}`}
                control={control}
                defaultValue={Boolean(tool?.options?.[key])}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!field.value}
                        onChange={(_, checked) => field.onChange(checked)}
                      />
                    }
                    label={t(label)}
                  />
                )}
              />
            </FormFieldRow>
          ))}
          {[
            ["logoPlacement", "tools.logoPlacement"],
            ["northArrowPlacement", "tools.northArrowPlacement"],
            ["scaleBarPlacement", "tools.scaleBarPlacement"],
            ["qrCodePlacement", "tools.qrCodePlacement"],
          ].map(([key, label]) => (
            <FormFieldRow key={key}>
              <FormControl fullWidth>
                <InputLabel>{t(label)}</InputLabel>
                <Controller
                  name={`options.${key}`}
                  control={control}
                  defaultValue={tool?.options?.[key] ?? "topRight"}
                  render={({ field }) => (
                    <Select {...field} label={t(label)}>
                      <MenuItem value="topLeft">{t("tools.topLeft")}</MenuItem>
                      <MenuItem value="topRight">
                        {t("tools.topRight")}
                      </MenuItem>
                      <MenuItem value="bottomLeft">
                        {t("tools.bottomLeft")}
                      </MenuItem>
                      <MenuItem value="bottomRight">
                        {t("tools.bottomRight")}
                      </MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </FormFieldRow>
          ))}
        </FormFieldGrid>
      </FormAccordion>

      {/* ─────────────────────────────────────────────
         PRINT COLORS
      ───────────────────────────────────────────── */}
      <FormAccordion title={t("tools.printColors")} defaultExpanded>
        <FormFieldGrid>
          <FormFieldRow>
            <InputLabel>{t("tools.mapBackgroundColor")}</InputLabel>
            <Controller
              name="options.mapTextColor"
              control={control}
              defaultValue={tool?.options?.mapTextColor ?? "#000000"}
              render={({ field }) => (
                <SketchPicker
                  color={
                    typeof field.value === "string" ? field.value : "#000000"
                  }
                  onChangeComplete={(color) => field.onChange(color.hex)}
                />
              )}
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormAccordion>
    </>
  );
}
