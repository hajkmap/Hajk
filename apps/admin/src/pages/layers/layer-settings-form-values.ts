import type { FieldValues } from "react-hook-form";
import type { Layer } from "../../api/layers";
import type { EditableFieldConfig } from "./types/editing-layer";
import { geometryTypesFromOptions } from "./types/editing-layer";

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
  const savedGeometry = geometryTypesFromOptions(layerOptions);
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
    infoClickActive: layer.infoClickActive ?? false,
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
      active: layer.searchSettings?.active ?? false,
      url: layer.searchSettings?.url ?? "",
      searchFields: (layer.searchSettings?.searchFields ?? []).join(", "),
      primaryDisplayFields: (
        layer.searchSettings?.primaryDisplayFields ?? []
      ).join(", "),
      secondaryDisplayFields: (
        layer.searchSettings?.secondaryDisplayFields ?? []
      ).join(", "),
      shortDisplayFields: (layer.searchSettings?.shortDisplayFields ?? []).join(
        ", ",
      ),
      geometryField: getLayerGeometryField(layer),
      outputFormat: layer.searchSettings?.outputFormat ?? "",
    },
    infoClickSettings: {
      definition: layer.infoClickSettings?.definition ?? "",
      icon: layer.infoClickSettings?.icon ?? "",
      format: layer.infoClickSettings?.format ?? "",
      sortProperty: layer.infoClickSettings?.sortProperty ?? "",
      sortMethod: layer.infoClickSettings?.sortMethod ?? "",
      sortDescending: layer.infoClickSettings?.sortDescending ?? false,
    },
    options: {
      keyword: layer.options?.keyword ?? "",
      category: layer.options?.category ?? "",
      layerDisplayDescription: layer.options?.layerDisplayDescription ?? "",
      geoWebCache: layer.options?.geoWebCache ?? false,
      showAttributeTableButton:
        layer.options?.showAttributeTableButton ?? false,
      editPoint: savedGeometry.editPoint,
      editMultiPoint: savedGeometry.editMultiPoint,
      editLine: savedGeometry.editLine,
      editMultiLine: savedGeometry.editMultiLine,
      editPolygon: savedGeometry.editPolygon,
      editMultiPolygon: savedGeometry.editMultiPolygon,
      allowMultiGeometries: savedGeometry.allowMultiGeometries,
      editableFields: savedEditableFields,
      nonEditableFields: savedNonEditableFields,
    },
  };
}
