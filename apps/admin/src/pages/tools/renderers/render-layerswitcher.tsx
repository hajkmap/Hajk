import {
  TextField,
  FormGroup,
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
import FormContainer from "../../../components/form-components/form-container";
import { useTranslation } from "react-i18next";
import { Controller, FieldValues, useForm } from "react-hook-form";
import { Tool } from "../../../api/tools";

// Helper function to safely get option values
const getOption = <T,>(
  options: Record<string, unknown> | undefined,
  key: string,
  defaultValue: T,
): T => {
  if (!options || !(key in options)) return defaultValue;
  return options[key] as T;
};

export default function LayerSwitcherRenderer({ tool }: { tool: Tool }) {
  const { t } = useTranslation();
  const options = tool?.options;

  const { control } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "",
      ...(options
        ? Object.fromEntries(
            Object.entries(options).map(([k, v]) => {
              if (v == null) return [`options.${k}`, ""];
              if (typeof v === "object")
                return [`options.${k}`, JSON.stringify(v)];
              if (
                typeof v === "string" ||
                typeof v === "number" ||
                typeof v === "boolean"
              ) {
                return [`options.${k}`, String(v)];
              }
              return [`options.${k}`, ""];
            }),
          )
        : {}),
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  return (
    <FormContainer>
      {/* Basic Information Panel */}
      <FormPanel title={t("common.information")}>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.title"
              control={control}
              defaultValue={getOption(options, "title", "")}
              render={({ field }) => (
                <TextField
                  label={t("tools.displayName")}
                  fullWidth
                  {...field}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <FormGroup>
              <Controller
                name="options.active"
                control={control}
                defaultValue={getOption(options, "active", false)}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!field.value}
                        onChange={(_, checked) => field.onChange(checked)}
                        size="medium"
                      />
                    }
                    label={t("tools.active")}
                  />
                )}
              />
            </FormGroup>
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.description"
              control={control}
              defaultValue={getOption(options, "description", "")}
              render={({ field }) => (
                <TextField
                  label={t("tools.description")}
                  fullWidth
                  multiline
                  rows={4}
                  {...field}
                />
              )}
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormPanel>

      {/* Window Settings */}
      <FormAccordion title={t("tools.windowSettings")}>
        <FormFieldGrid>
          <FormFieldRow>
            <FormControl fullWidth>
              <InputLabel id="target-label" shrink>
                {t("tools.target")}
              </InputLabel>
              <Controller
                name="options.target"
                control={control}
                defaultValue={getOption(options, "target", "toolbar")}
                render={({ field }) => (
                  <Select
                    labelId="target-label"
                    label={t("tools.target")}
                    displayEmpty
                    {...field}
                  >
                    <MenuItem value="toolbar">Drawer</MenuItem>
                    <MenuItem value="left">Widget left</MenuItem>
                    <MenuItem value="right">Widget right</MenuItem>
                    <MenuItem value="control">Control button</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </FormFieldRow>
          <FormFieldRow>
            <FormControl fullWidth>
              <InputLabel id="position-label" shrink>
                {t("tools.position")}
              </InputLabel>
              <Controller
                name="options.position"
                control={control}
                defaultValue={getOption(options, "position", "left")}
                render={({ field }) => (
                  <Select
                    labelId="position-label"
                    label={t("tools.position")}
                    displayEmpty
                    {...field}
                  >
                    <MenuItem value="left">Left</MenuItem>
                    <MenuItem value="right">Right</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.width"
              control={control}
              defaultValue={getOption(options, "width", "")}
              render={({ field }) => (
                <TextField
                  label={t("tools.width")}
                  fullWidth
                  type="number"
                  {...field}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.height"
              control={control}
              defaultValue={getOption(options, "height", "")}
              render={({ field }) => (
                <TextField label={t("tools.height")} fullWidth {...field} />
              )}
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormAccordion>

      {/* Layer Manager Settings */}
      <FormAccordion title={t("tools.displaySettings")}>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.visibleAtStart"
              control={control}
              defaultValue={getOption(options, "visibleAtStart", false)}
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
              name="options.visibleAtStartMobile"
              control={control}
              defaultValue={getOption(options, "visibleAtStartMobile", false)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.visibleAtStartMobile")}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.showBreadcrumbs"
              control={control}
              defaultValue={getOption(options, "showBreadcrumbs", false)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.showBreadCrumbs")}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.showDrawOrderView"
              control={control}
              defaultValue={getOption(options, "showDrawOrderView", false)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.showDrawOrderView")}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.showFilter"
              control={control}
              defaultValue={getOption(options, "showFilter", false)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.showFilter")}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.showQuickAccess"
              control={control}
              defaultValue={getOption(options, "showQuickAccess", false)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.showQuickAccess")}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.legendForceTransparency"
              control={control}
              defaultValue={getOption(
                options,
                "legendForceTransparency",
                false,
              )}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.legendForceTransparency")}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.legendTryHiDPI"
              control={control}
              defaultValue={getOption(options, "legendTryHiDPI", false)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.legendTryHiDPI")}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.enableTransparencySlider"
              control={control}
              defaultValue={getOption(
                options,
                "enableTransparencySlider",
                true,
              )}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.enableTransparencySlider")}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.cqlFilterVisible"
              control={control}
              defaultValue={getOption(options, "cqlFilterVisible", false)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.cqlFilterVisible")}
                />
              )}
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormAccordion>

      {/* Draw Order Tab Settings */}
      <FormAccordion title={t("tools.drawOrderViewInfoText")}>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.enableSystemLayersSwitch"
              control={control}
              defaultValue={getOption(
                options,
                "enableSystemLayersSwitch",
                false,
              )}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.enableSystemLayersSwitch")}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.lockDrawOrderBaselayer"
              control={control}
              defaultValue={getOption(options, "lockDrawOrderBaselayer", false)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.lockDrawOrderBaselayer")}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.drawOrderViewInfoText"
              control={control}
              defaultValue={getOption(options, "drawOrderViewInfoText", "")}
              render={({ field }) => (
                <TextField
                  label={t("tools.drawOrderViewInfoText")}
                  fullWidth
                  multiline
                  rows={2}
                  {...field}
                />
              )}
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormAccordion>

      {/* Quick Access Settings */}
      <FormAccordion title={t("tools.showQuickAccess")}>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.enableQuickAccessPresets"
              control={control}
              defaultValue={getOption(
                options,
                "enableQuickAccessPresets",
                false,
              )}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.enableQuickAccessPresets")}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.quickAccessTopicsInfoText"
              control={control}
              defaultValue={getOption(options, "quickAccessTopicsInfoText", "")}
              render={({ field }) => (
                <TextField
                  label={t("tools.quickAccessTopicsInfoText")}
                  fullWidth
                  multiline
                  rows={2}
                  {...field}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.enableUserQuickAccessFavorites"
              control={control}
              defaultValue={getOption(
                options,
                "enableUserQuickAccessFavorites",
                false,
              )}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.enableUserQuickAccessFavorites")}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.userQuickAccessFavoritesInfoText"
              control={control}
              defaultValue={getOption(
                options,
                "userQuickAccessFavoritesInfoText",
                "",
              )}
              render={({ field }) => (
                <TextField
                  label={t("tools.userQuickAccessFavoritesInfoText")}
                  fullWidth
                  multiline
                  rows={2}
                  {...field}
                />
              )}
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormAccordion>

      {/* Map Settings */}
      <FormAccordion title={t("tools.themeMapHeaderCaption")}>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.dropdownThemeMaps"
              control={control}
              defaultValue={getOption(options, "dropdownThemeMaps", false)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.dropdownThemeMaps")}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.themeMapHeaderCaption"
              control={control}
              defaultValue={getOption(options, "themeMapHeaderCaption", "")}
              render={({ field }) => (
                <TextField
                  label={t("tools.themeMapHeaderCaption")}
                  fullWidth
                  {...field}
                />
              )}
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormAccordion>

      {/* Zoom Alert Settings */}
      <FormAccordion title={t("tools.otherSettings")}>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.minMaxZoomAlertOnToggleOnly"
              control={control}
              defaultValue={getOption(
                options,
                "minMaxZoomAlertOnToggleOnly",
                false,
              )}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.minMaxZoomAlertOnToggleOnly")}
                />
              )}
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormAccordion>

      {/* Background Layer Settings */}
      <FormAccordion title={t("tools.backgroundSwitcherBlack")}>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.backgroundSwitcherBlack"
              control={control}
              defaultValue={getOption(options, "backgroundSwitcherBlack", true)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.backgroundSwitcherBlack")}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.backgroundSwitcherWhite"
              control={control}
              defaultValue={getOption(options, "backgroundSwitcherWhite", true)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.backgroundSwitcherWhite")}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.enableOSM"
              control={control}
              defaultValue={getOption(options, "enableOSM", false)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.enableOSM")}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.OSMVisibleAtStart"
              control={control}
              defaultValue={getOption(options, "OSMVisibleAtStart", false)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label="OSM visible at start"
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.renderSpecialBackgroundsAtBottom"
              control={control}
              defaultValue={getOption(
                options,
                "renderSpecialBackgroundsAtBottom",
                false,
              )}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label="Render special backgrounds at bottom"
                />
              )}
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormAccordion>

      {/* Instruction Text */}
      <FormAccordion title={t("tools.instruction")}>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.instruction"
              control={control}
              defaultValue={getOption(options, "instruction", "")}
              render={({ field }) => (
                <TextField
                  label={t("tools.instruction")}
                  fullWidth
                  multiline
                  rows={4}
                  {...field}
                />
              )}
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormAccordion>
    </FormContainer>
  );
}
