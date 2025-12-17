import { Grid2 as Grid } from "@mui/material";
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
import FormAccordion from "../../../components/form-components/form-accordion";

import { Controller, FieldValues, useForm } from "react-hook-form";
import { SketchPicker } from "react-color";
import { useTranslation } from "react-i18next";

export default function PrintToolRenderer({
  tool,
}: {
  tool: { [key: string]: any };
}) {
  const { t } = useTranslation();

  const { control } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "print",
      ...(tool?.options
        ? Object.fromEntries(
            Object.entries(tool.options).map(([k, v]) => [`options.${k}`, v])
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
        <Grid container>
          <Grid size={{ xs: 12, md: 10 }}>
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
          </Grid>

          <Grid size={{ xs: 12 }}>
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
                  value={field.value ? atob(field.value) : ""}
                  onChange={(e) => field.onChange(btoa(e.target.value))}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
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
          </Grid>
        </Grid>
      </FormPanel>

      {/* ─────────────────────────────────────────────
         WINDOW SETTINGS
      ───────────────────────────────────────────── */}
      <FormAccordion title={t("tools.windowSettings")}>
        <Grid container>
          <Grid size={{ xs: 12, md: 10 }}>
            <Controller
              name="options.index"
              control={control}
              defaultValue={tool?.options?.index ?? 0}
              render={({ field }) => (
                <TextField
                  type="number"
                  label={t("tools.sortIndex")}
                  fullWidth
                  {...field}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 10 }}>
            <FormControl fullWidth>
              <InputLabel>{t("tools.windowPlacement")}</InputLabel>
              <Controller
                name="options.position"
                control={control}
                defaultValue={tool?.options?.position ?? "left"}
                render={({ field }) => (
                  <Select {...field} label={t("tools.windowPlacement")}>
                    <MenuItem value="left">{t("tools.left")}</MenuItem>
                    <MenuItem value="right">{t("tools.right")}</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 10 }}>
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
          </Grid>

          <Grid size={{ xs: 12, md: 10 }}>
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
          </Grid>
        </Grid>
      </FormAccordion>

      {/* ─────────────────────────────────────────────
         IMAGE PROCESSING SETTINGS
      ───────────────────────────────────────────── */}
      <FormAccordion title={t("tools.imageProcessing")}>
        <Grid container>
          <Grid size={{ xs: 12, md: 10 }}>
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
          </Grid>

          <Grid size={{ xs: 12, md: 10 }}>
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
          </Grid>
        </Grid>
      </FormAccordion>

      {/* ─────────────────────────────────────────────
         PRINT METADATA
      ───────────────────────────────────────────── */}
      <FormAccordion title={t("tools.printMetadata")}>
        <Grid container>
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
            <Grid size={{ xs: 12, md: 10 }} key={key}>
              <Controller
                name={`options.${key}`}
                control={control}
                defaultValue={tool?.options?.[key] ?? ""}
                render={({ field }) => (
                  <TextField label={t(label)} fullWidth {...field} />
                )}
              />
            </Grid>
          ))}
        </Grid>
      </FormAccordion>

      {/* ─────────────────────────────────────────────
         PRINT TOGGLES
      ───────────────────────────────────────────── */}
      <FormAccordion title={t("tools.printToggles")}>
        <Grid container>
          {[
            ["includeLogo", "tools.includeLogo"],
            ["includeNorthArrow", "tools.includeNorthArrow"],
            ["includeScaleBar", "tools.includeScaleBar"],
            ["includeQrCode", "tools.includeQrCode"],
            ["includeImageBorder", "tools.includeImageBorder"],
          ].map(([key, label]) => (
            <Grid size={{ xs: 12, md: 10 }} key={key}>
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
            </Grid>
          ))}
          {[
            ["logoPlacement", "tools.logoPlacement"],
            ["northArrowPlacement", "tools.northArrowPlacement"],
            ["scaleBarPlacement", "tools.scaleBarPlacement"],
            ["qrCodePlacement", "tools.qrCodePlacement"],
          ].map(([key, label]) => (
            <Grid size={{ xs: 12, md: 10 }} key={key}>
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
            </Grid>
          ))}
        </Grid>
        <Grid container></Grid>
      </FormAccordion>

      {/* ─────────────────────────────────────────────
         PRINT COLORS
      ───────────────────────────────────────────── */}
      <FormAccordion title={t("tools.printColors")} defaultExpanded>
        <Grid container>
          <Grid size={{ xs: 12 }}>
            <InputLabel>{t("tools.mapBackgroundColor")}</InputLabel>
            <Controller
              name="options.mapTextColor"
              control={control}
              defaultValue={tool?.options?.mapTextColor ?? "#000000"}
              render={({ field }) => (
                <SketchPicker
                  label={t("tools.mapTextColor")}
                  labelId="map-text-color-label"
                  color={field.value}
                  onChangeComplete={(color) => field.onChange(color.hex)}
                />
              )}
            />
          </Grid>
        </Grid>
      </FormAccordion>
    </>
  );
}
