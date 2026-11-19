import type { FieldValues } from "react-hook-form";
import type { Layer } from "../../api/layers";
import type { EditableFieldConfig } from "./types/editing-layer";
import { editingOptionsFrom } from "./types/editing-layer";
import { toDateTimeLocal } from "../../lib/availability";
import { infoClickLayersFrom } from "./feature-info/infoclick-target";

/** Geometry field from searchSettings (search) or top-level scalar (editing). */
export function getLayerGeometryField(layer: Layer): string {
  return layer.searchSettings?.geometryField ?? layer.geometryField ?? "";
}

/** Resolve geometry field from a flat or nested update payload. */
export function resolveGeometryFieldFromPayload(
  data: Record<string, unknown>,
): string | undefined {
  if (typeof data.geometryField === "string") return data.geometryField;
  const nested = data.searchSettings;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const value = (nested as { geometryField?: unknown }).geometryField;
    if (typeof value === "string") return value;
  }
  return undefined;
}

const optionText = (value: unknown) => {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
};

/** Form shape used by layer settings reset / dirty comparison. */
export function buildLayerSettingsFormValues(
  layer: Layer,
  roleId?: string,
): FieldValues {
  const layerOptions =
    layer.options &&
    typeof layer.options === "object" &&
    !Array.isArray(layer.options)
      ? layer.options
      : {};
  const savedEditableFields = Array.isArray(layerOptions.editableFields)
    ? (layerOptions.editableFields as EditableFieldConfig[])
    : [];
  const savedNonEditableFields = Array.isArray(layerOptions.nonEditableFields)
    ? (layerOptions.nonEditableFields as EditableFieldConfig[])
    : [];

  return {
    name: layer.name ?? "",
    serviceId: layer.serviceId ?? "",
    internalName: layer.internalName ?? "",
    description: layer.description ?? "",
    hidpi: layer.hidpi ?? false,
    tiled: layer.tiled ?? false,
    singleTile: layer.singleTile ?? false,
    customRatio: layer.customRatio,
    timeSliderVisible: layer.timeSliderVisible ?? false,
    timeSliderStart: layer.timeSliderStart ?? "",
    timeSliderEnd: layer.timeSliderEnd ?? "",
    hideExpandArrow: layer.hideExpandArrow ?? false,
    zIndex: layer.zIndex ?? 0,
    style: layer.style ?? "",
    opacity: layer.opacity,
    minZoom: layer.minZoom,
    maxZoom: layer.maxZoom,
    minMaxZoomAlertOnToggleOnly: layer.minMaxZoomAlertOnToggleOnly ?? false,
    infoClickActive:
      layer.layerKind === "search"
        ? layer.infoClickSettings?.active === true
        : layer.infoClickActive !== false,
    showMetadata: layer.showMetadata ?? false,
    legendUrl: layer.legendUrl ?? "",
    legendIconUrl: layer.legendIconUrl ?? "",
    legendOptions: layer.legendOptions ?? "",
    useCustomDpiList: false,
    roleId: roleId ?? "",
    metadata: {
      title: layer.metadata?.title ?? "",
      description: layer.metadata?.description ?? "",
      owner: layer.metadata?.owner ?? "",
      url: layer.metadata?.url ?? "",
      urlTitle: layer.metadata?.urlTitle ?? "",
      attribution: layer.metadata?.attribution ?? "",
    },
    searchSettings: {
      searchFields: (layer.searchSettings?.searchFields ?? []).join(", "),
      geometryField: getLayerGeometryField(layer),
      outputFormat: layer.searchSettings?.outputFormat ?? "",
      aliasDict: layer.aliasDict ?? "",
    },
    infoClickSettings: {
      definition: layer.infoClickSettings?.definition ?? "",
      icon: layer.infoClickSettings?.icon ?? "",
      format: layer.infoClickSettings?.format ?? "",
      sortProperty: layer.infoClickSettings?.sortProperty ?? "",
      sortMethod: layer.infoClickSettings?.sortMethod ?? "",
      sortDescending: layer.infoClickSettings?.sortDescending ?? false,
      active: layer.infoClickSettings?.active ?? layer.infoClickActive === true,
      displayFields:
        optionText(layer.infoClickSettings?.displayFields) ||
        optionText(layerOptions.displayFields),
      secondaryLabelFields:
        optionText(layer.infoClickSettings?.secondaryLabelFields) ||
        optionText(layerOptions.secondaryLabelFields),
      shortDisplayFields:
        optionText(layer.infoClickSettings?.shortDisplayFields) ||
        optionText(layerOptions.shortDisplayFields),
      legend: layer.infoClickSettings?.legend ?? layer.legendUrl ?? "",
      legendIcon: layer.infoClickSettings?.legendIcon ?? layer.legendIconUrl ?? "",
      options: infoClickLayersFrom(
        layer.infoClickSettings,
        layerOptions,
        layer.selectedLayers,
      ),
    },
    options: {
      keyword: layer.options?.keyword ?? "",
      category: layer.options?.category ?? "",
      layerDisplayDescription: layer.options?.layerDisplayDescription ?? "",
      geoWebCache: layer.options?.geoWebCache ?? false,
      showAttributeTableButton:
        layer.options?.showAttributeTableButton ?? false,
      visible: layer.options?.visible !== "false",
      visibleFrom: toDateTimeLocal(layer.options?.visibleFrom),
      visibleUntil: toDateTimeLocal(layer.options?.visibleUntil),
      ...editingOptionsFrom(layerOptions),
      editableFields: savedEditableFields,
      nonEditableFields: savedNonEditableFields,
      dataFormat: optionText(layerOptions.dataFormat) || "WFS",
      content: optionText(layerOptions.content),
      sldUrl: optionText(layerOptions.sldUrl),
      sldText: optionText(layerOptions.sldText),
      sldStyle: optionText(layerOptions.sldStyle) || "Default Styler",
      icon: optionText(layerOptions.icon),
      symbolXOffset: optionText(layerOptions.symbolXOffset) || "0",
      symbolYOffset: optionText(layerOptions.symbolYOffset) || "0",
      pointSize: optionText(layerOptions.pointSize),
      lineWidth: optionText(layerOptions.lineWidth),
      lineStyle: optionText(layerOptions.lineStyle),
      fillColor: optionText(layerOptions.fillColor),
      lineColor: optionText(layerOptions.lineColor),
      filterable: layerOptions.filterable === true,
      filterAttribute: optionText(layerOptions.filterAttribute),
      filterComparer: optionText(layerOptions.filterComparer) || "eq",
      filterValue: optionText(layerOptions.filterValue),
    },
  };
}
