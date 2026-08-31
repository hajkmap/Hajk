import { TextField, FormControlLabel, Checkbox } from "@mui/material";
import FormPanel from "../../../components/form-components/form-panel";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import FormAccordion from "../../../components/form-components/form-accordion";
import { useTranslation } from "react-i18next";
import { Control, Controller, FieldValues, useForm } from "react-hook-form";
import { useEffect } from "react";
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

interface LayerSwitcherRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

export default function LayerSwitcherRenderer({
  tool,
  control: parentControl,
}: LayerSwitcherRendererProps) {
  const { t } = useTranslation();
  const options = tool?.options;
  const { control: localControl, reset } = useForm<FieldValues>({
    mode: "onChange",
    reValidateMode: "onChange",
  });
  const control = parentControl ?? localControl;

  useEffect(() => {
    if (tool && !parentControl) {
      reset({
        type: tool.type ?? "",
        options: {
          title:
            getOption(options, "title", "") ||
            (typeof tool.title === "string" ? tool.title : "") ||
            "",
          description: getOption(options, "description", ""),
          visibleAtStart: getOption(options, "visibleAtStart", false),
          visibleAtStartMobile: getOption(
            options,
            "visibleAtStartMobile",
            false,
          ),
          showBreadcrumbs: getOption(options, "showBreadcrumbs", false),
          showDrawOrderView: getOption(options, "showDrawOrderView", false),
          showFilter: getOption(options, "showFilter", false),
          showQuickAccess: getOption(options, "showQuickAccess", false),
          legendForceTransparency: getOption(
            options,
            "legendForceTransparency",
            false,
          ),
          legendTryHiDPI: getOption(options, "legendTryHiDPI", false),
          enableTransparencySlider: getOption(
            options,
            "enableTransparencySlider",
            true,
          ),
          cqlFilterVisible: getOption(options, "cqlFilterVisible", false),
          enableSystemLayersSwitch: getOption(
            options,
            "enableSystemLayersSwitch",
            false,
          ),
          lockDrawOrderBaselayer: getOption(
            options,
            "lockDrawOrderBaselayer",
            false,
          ),
          drawOrderViewInfoText: getOption(
            options,
            "drawOrderViewInfoText",
            "",
          ),
          enableQuickAccessPresets: getOption(
            options,
            "enableQuickAccessPresets",
            false,
          ),
          quickAccessTopicsInfoText: getOption(
            options,
            "quickAccessTopicsInfoText",
            "",
          ),
          enableUserQuickAccessFavorites: getOption(
            options,
            "enableUserQuickAccessFavorites",
            false,
          ),
          userQuickAccessFavoritesInfoText: getOption(
            options,
            "userQuickAccessFavoritesInfoText",
            "",
          ),
          dropdownThemeMaps: getOption(options, "dropdownThemeMaps", false),
          themeMapHeaderCaption: getOption(
            options,
            "themeMapHeaderCaption",
            "",
          ),
          minMaxZoomAlertOnToggleOnly: getOption(
            options,
            "minMaxZoomAlertOnToggleOnly",
            false,
          ),
          backgroundSwitcherBlack: getOption(
            options,
            "backgroundSwitcherBlack",
            true,
          ),
          backgroundSwitcherWhite: getOption(
            options,
            "backgroundSwitcherWhite",
            true,
          ),
          enableOSM: getOption(options, "enableOSM", false),
          OSMVisibleAtStart: getOption(options, "OSMVisibleAtStart", false),
          renderSpecialBackgroundsAtBottom: getOption(
            options,
            "renderSpecialBackgroundsAtBottom",
            false,
          ),
          instruction: getOption(options, "instruction", ""),
        },
      });
    }
  }, [tool, options, parentControl, reset]);

  return (
    <>
      {/* Basic Information Panel */}
      <FormPanel title={t("common.information")}>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.title"
              control={control}
              defaultValue={
                getOption(options, "title", "") ||
                (typeof tool.title === "string" ? tool.title : "") ||
                ""
              }
              render={({ field }) => (
                <TextField label={t("tools.title")} fullWidth {...field} />
              )}
            />
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
    </>
  );
}
