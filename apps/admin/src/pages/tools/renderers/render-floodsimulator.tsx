import { MenuItem, Typography } from "@mui/material";
import { Control, Controller, FieldValues, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FormAccordion from "../../../components/form-components/form-accordion";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import { SelectWithHelp } from "../../../components/form-components/field-label-with-help";
import FormColorPicker from "../../../components/form-components/form-color-picker";
import { Tool } from "../../../api/tools";
import DepthColorList, {
  DepthColorStop,
} from "../components/floodsimulator/depth-color-list";
import { floodsimulatorDefaults } from "./tool-option-defaults";
import {
  CheckboxOption,
  DraftTextOption,
  GroupsOption,
  NumberListOption,
  NumberOption,
  TextOption,
  formatNumberList,
  formatTerrainBreakpoints,
  parseNumberList,
  parseTerrainBreakpoints,
} from "./tool-option-fields";

interface FloodSimulatorRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

interface TileGrid {
  origin?: number[] | null;
  extent?: number[] | null;
  resolutions?: number[] | null;
}

function tileGridText(value: unknown, key: keyof TileGrid): string {
  if (!value || typeof value !== "object") return "";
  return formatNumberList((value as TileGrid)[key]);
}

function withTileGridPart(
  current: unknown,
  key: keyof TileGrid,
  text: string,
): TileGrid | null {
  const next: TileGrid = {
    ...(current && typeof current === "object" ? (current as TileGrid) : {}),
    [key]: parseNumberList(text),
  };
  if (!next.origin && !next.extent && !next.resolutions) return null;
  return next;
}

/** Window placement is set per map. These are the simulation settings. */
export default function FloodSimulatorRenderer({
  tool,
  control: parentControl,
}: FloodSimulatorRendererProps) {
  const { t } = useTranslation();
  const { control: localControl } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "floodsimulator",
      options: { ...floodsimulatorDefaults, ...tool?.options },
    },
  });
  const control = parentControl ?? localControl;
  const depthColors = Array.isArray(tool?.options?.depthColors)
    ? (tool.options.depthColors as DepthColorStop[])
    : [];

  return (
    <>
      <FormAccordion title={t("tools.generalSettings")} defaultExpanded>
        <FormFieldGrid>
          <CheckboxOption
            control={control}
            name="options.visibleAtStart"
            labelKey="tools.visibleAtStart"
          />
          <TextOption
            control={control}
            name="options.title"
            labelKey="tools.title"
          />
          <TextOption
            control={control}
            name="options.description"
            labelKey="tools.description"
            helpKey="tools.floodsimulator.descriptionHelp"
          />
          <GroupsOption control={control} />
        </FormFieldGrid>
      </FormAccordion>

      <FormAccordion title={t("tools.floodsimulator.elevation")}>
        <FormFieldGrid>
          <TextOption
            control={control}
            name="options.elevationUrl"
            labelKey="tools.floodsimulator.elevationUrl"
            helpKey="tools.floodsimulator.elevationUrlHelp"
          />
          <FormFieldRow>
            <Controller
              name="options.elevationEncoding"
              control={control}
              render={({ field }) => (
                <SelectWithHelp
                  labelKey="tools.floodsimulator.encoding"
                  helpKey="tools.floodsimulator.encodingHelp"
                  value={field.value ?? "terrarium"}
                  onChange={(event) => field.onChange(event.target.value)}
                >
                  <MenuItem value="terrarium">terrarium</MenuItem>
                  <MenuItem value="mapbox">mapbox</MenuItem>
                </SelectWithHelp>
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.crossOrigin"
              control={control}
              render={({ field }) => (
                <SelectWithHelp
                  labelKey="tools.floodsimulator.crossOrigin"
                  helpKey="tools.floodsimulator.crossOriginHelp"
                  value={field.value ?? "anonymous"}
                  onChange={(event) => field.onChange(event.target.value)}
                >
                  <MenuItem value="anonymous">anonymous</MenuItem>
                  <MenuItem value="use-credentials">use-credentials</MenuItem>
                  <MenuItem value="">
                    {t("tools.floodsimulator.crossOriginNone")}
                  </MenuItem>
                </SelectWithHelp>
              )}
            />
          </FormFieldRow>
          <NumberOption
            control={control}
            name="options.tileSize"
            labelKey="tools.floodsimulator.tileSize"
          />
          <CheckboxOption
            control={control}
            name="options.interpolate"
            labelKey="tools.floodsimulator.interpolate"
            helpKey="tools.floodsimulator.interpolateHelp"
          />
          <TextOption
            control={control}
            name="options.attributions"
            labelKey="tools.floodsimulator.attributions"
          />
          <NumberListOption
            control={control}
            name="options.elevationExtent"
            labelKey="tools.floodsimulator.elevationExtent"
            helpKey="tools.floodsimulator.elevationExtentHelp"
          />
          <NumberOption
            control={control}
            name="options.minElevation"
            labelKey="tools.floodsimulator.minElevation"
            helpKey="tools.floodsimulator.minElevationHelp"
          />
          <NumberOption
            control={control}
            name="options.maxElevation"
            labelKey="tools.floodsimulator.maxElevation"
            helpKey="tools.floodsimulator.maxElevationHelp"
          />
        </FormFieldGrid>
      </FormAccordion>

      <FormAccordion title={t("tools.floodsimulator.zoom")}>
        <FormFieldGrid>
          <NumberOption
            control={control}
            name="options.minZoom"
            labelKey="tools.floodsimulator.minZoom"
            helpKey="tools.floodsimulator.minZoomHelp"
          />
          <NumberOption
            control={control}
            name="options.maxZoom"
            labelKey="tools.floodsimulator.maxZoom"
            helpKey="tools.floodsimulator.maxZoomHelp"
          />
          <DraftTextOption
            control={control}
            name="options.terrainZoomByMapZoom"
            labelKey="tools.floodsimulator.terrainZoomList"
            helpKey="tools.floodsimulator.terrainZoomListHelp"
            format={formatNumberList}
            parse={(text, current) => {
              const list = parseNumberList(text);
              if (list) return list;
              return Array.isArray(current) ? null : (current ?? null);
            }}
          />
          <DraftTextOption
            control={control}
            name="options.terrainZoomByMapZoom"
            labelKey="tools.floodsimulator.terrainZoomBreakpoints"
            helpKey="tools.floodsimulator.terrainZoomBreakpointsHelp"
            format={formatTerrainBreakpoints}
            disabled={(value) => Array.isArray(value) && value.length > 0}
            parse={(text, current) =>
              Array.isArray(current) && current.length > 0
                ? current
                : parseTerrainBreakpoints(text)
            }
          />
          <NumberOption
            control={control}
            name="options.hideAtMinZoom"
            labelKey="tools.floodsimulator.hideAtMinZoom"
            helpKey="tools.floodsimulator.hideAtMinZoomHelp"
          />
          <NumberOption
            control={control}
            name="options.minMapZoom"
            labelKey="tools.floodsimulator.minMapZoom"
            helpKey="tools.floodsimulator.minMapZoomHelp"
          />
          <NumberOption
            control={control}
            name="options.maxResolution"
            labelKey="tools.floodsimulator.maxResolution"
            helpKey="tools.floodsimulator.maxResolutionHelp"
          />
          <NumberOption
            control={control}
            name="options.maxResolutionSlack"
            labelKey="tools.floodsimulator.maxResolutionSlack"
            helpKey="tools.floodsimulator.maxResolutionSlackHelp"
          />
        </FormFieldGrid>
      </FormAccordion>

      <FormAccordion title={t("tools.floodsimulator.tileGrid")}>
        <FormFieldGrid>
          {(
            [
              ["origin", "tileOrigin", "tileOriginHelp"],
              ["extent", "tileExtent", "tileExtentHelp"],
              ["resolutions", "tileResolutions", "tileResolutionsHelp"],
            ] as const
          ).map(([key, label, help]) => (
            <DraftTextOption
              key={key}
              control={control}
              name="options.elevationTileGrid"
              labelKey={`tools.floodsimulator.${label}`}
              helpKey={`tools.floodsimulator.${help}`}
              format={(value) => tileGridText(value, key)}
              parse={(text, current) => withTileGridPart(current, key, text)}
            />
          ))}
        </FormFieldGrid>
      </FormAccordion>

      <FormAccordion title={t("tools.floodsimulator.waterLevel")}>
        <FormFieldGrid>
          <NumberOption
            control={control}
            name="options.minLevel"
            labelKey="tools.floodsimulator.minLevel"
          />
          <NumberOption
            control={control}
            name="options.maxLevel"
            labelKey="tools.floodsimulator.maxLevel"
          />
          <NumberOption
            control={control}
            name="options.levelStep"
            labelKey="tools.floodsimulator.levelStep"
          />
          <NumberOption
            control={control}
            name="options.defaultLevel"
            labelKey="tools.floodsimulator.defaultLevel"
          />
          <NumberOption
            control={control}
            name="options.animationDurationMs"
            labelKey="tools.floodsimulator.animationDuration"
            helpKey="tools.floodsimulator.animationDurationHelp"
          />
          <CheckboxOption
            control={control}
            name="options.showElevationReadout"
            labelKey="tools.floodsimulator.showElevationReadout"
          />
        </FormFieldGrid>
      </FormAccordion>

      <FormAccordion title={t("tools.floodsimulator.appearance")}>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.waterColor"
              control={control}
              render={({ field }) => (
                <FormColorPicker
                  label={t("tools.floodsimulator.waterColor")}
                  value={typeof field.value === "string" ? field.value : ""}
                  onChange={field.onChange}
                />
              )}
            />
          </FormFieldRow>
          <FormFieldRow>
            <Controller
              name="options.deepWaterColor"
              control={control}
              render={({ field }) => (
                <FormColorPicker
                  label={t("tools.floodsimulator.deepWaterColor")}
                  value={typeof field.value === "string" ? field.value : ""}
                  onChange={field.onChange}
                />
              )}
            />
          </FormFieldRow>
          <NumberOption
            control={control}
            name="options.layerOpacity"
            labelKey="tools.floodsimulator.layerOpacity"
          />
          <CheckboxOption
            control={control}
            name="options.enableDepthShading"
            labelKey="tools.floodsimulator.enableDepthShading"
          />
          <CheckboxOption
            control={control}
            name="options.smoothDepthColors"
            labelKey="tools.floodsimulator.smoothDepthColors"
            helpKey="tools.floodsimulator.smoothDepthColorsHelp"
          />
          <NumberOption
            control={control}
            name="options.maxShadingDepth"
            labelKey="tools.floodsimulator.maxShadingDepth"
            helpKey="tools.floodsimulator.maxShadingDepthHelp"
          />
          <FormFieldRow>
            <Controller
              name="options.depthColors"
              control={control}
              defaultValue={depthColors}
              render={({ field }) => {
                const stops = Array.isArray(field.value)
                  ? (field.value as DepthColorStop[])
                  : [];
                return (
                  <>
                    {stops.length > 0 ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {t("tools.floodsimulator.depthColorsUnused")}
                      </Typography>
                    ) : null}
                    <DepthColorList stops={stops} onChange={field.onChange} />
                  </>
                );
              }}
            />
          </FormFieldRow>
        </FormFieldGrid>
      </FormAccordion>
    </>
  );
}
