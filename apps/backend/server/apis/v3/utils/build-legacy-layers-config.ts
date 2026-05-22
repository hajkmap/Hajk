import log4js from "log4js";
import type { Prisma } from "@prisma/client";

import prisma from "../../../common/prisma.ts";
import {
  toClientLayerBucket,
  toClientServiceFields,
  type ClientLayerBucket,
} from "./to-client-format.ts";

const logger = log4js.getLogger("util.build-legacy-layers-config");

/**
 * Layers document shape Hajk Client v4 consumes before `normalizeLayers()`
 * merges buckets into `layersConfig` arrays.
 *
 * @see apps/backend/App_Data/layers.json
 */
export interface HajkLegacyLayersConfigDocument {
  wmslayers: Record<string, unknown>[];
  wmtslayers: Record<string, unknown>[];
  wfslayers: Record<string, unknown>[];
  wfstlayers: Record<string, unknown>[];
  vectorlayers: Record<string, unknown>[];
  arcgislayers: Record<string, unknown>[];
}

const emptyBuckets = (): HajkLegacyLayersConfigDocument => ({
  wmslayers: [],
  wmtslayers: [],
  wfslayers: [],
  wfstlayers: [],
  vectorlayers: [],
  arcgislayers: [],
});

function getOptionsRecord(options: Prisma.JsonValue): Record<string, unknown> {
  if (
    options !== null &&
    typeof options === "object" &&
    !Array.isArray(options)
  ) {
    return options as Record<string, unknown>;
  }
  return {};
}

/** WFST edit-tool fields stored on `layer.options` (legacy `wfstlayers` shape). */
function getWfstEditingFields(
  optionsRec: Record<string, unknown>
): Record<string, unknown> {
  return {
    editPoint: optionsRec.editPoint === true,
    editMultiPoint: optionsRec.editMultiPoint === true,
    editLine: optionsRec.editLine === true,
    editMultiLine: optionsRec.editMultiLine === true,
    editPolygon: optionsRec.editPolygon === true,
    editMultiPolygon: optionsRec.editMultiPolygon === true,
    allowMultipleGeometries: optionsRec.allowMultiGeometries === true,
    editableFields: Array.isArray(optionsRec.editableFields)
      ? optionsRec.editableFields
      : [],
    nonEditableFields: Array.isArray(optionsRec.nonEditableFields)
      ? optionsRec.nonEditableFields
      : [],
  };
}

function searchOutputToClient(fmt: string | undefined | null): string {
  switch (fmt) {
    case "GML2":
      return "GML2";
    case "GML32":
      return "GML32";
    case "GML3":
    default:
      return "GML3";
  }
}

function buildLayersInfoArray(
  selectedLayers: string[],
  options: Prisma.JsonValue
): Record<string, unknown>[] {
  const opts = getOptionsRecord(options);
  const raw = opts.layersInfo;
  if (Array.isArray(raw)) {
    return raw as Record<string, unknown>[];
  }

  const rec =
    raw !== null && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, Record<string, unknown>>)
      : {};

  return selectedLayers.map((layerId) => {
    const row = rec[layerId] ?? {};
    const infobox =
      typeof row.definition === "string"
        ? row.definition
        : typeof row.infobox === "string"
          ? row.infobox
          : "";
    return {
      id: layerId,
      caption: typeof row.caption === "string" ? row.caption : "",
      legend: typeof row.legend === "string" ? row.legend : "",
      legendIcon: typeof row.legendIcon === "string" ? row.legendIcon : "",
      infobox,
      style: typeof row.style === "string" ? row.style : "",
      queryable: typeof row.queryable === "boolean" ? row.queryable : false,
      infoclickIcon:
        typeof row.infoclickIcon === "string" ? row.infoclickIcon : "",
      searchDisplayName: row.searchDisplayName,
      secondaryLabelFields: row.secondaryLabelFields,
      searchShortDisplayName: row.searchShortDisplayName,
      searchUrl: row.searchUrl,
      searchPropertyName: row.searchPropertyName,
      searchOutputFormat: row.searchOutputFormat,
      searchGeometryField: row.searchGeometryField,
      format: typeof row.format === "string" ? row.format : undefined,
      sortProperty: row.sortProperty,
      sortMethod: row.sortMethod,
      sortDescending: row.sortDescending,
    };
  });
}

/** Pick WMTS matrix metadata when stored under `layer.options.wmts`. */
function getWmtsOptions(options: Prisma.JsonValue): {
  layer?: string;
  matrixSet?: string;
  style?: string;
  matrixIds?: unknown[];
  origin?: unknown[];
  resolutions?: unknown[];
} | null {
  const opts = getOptionsRecord(options);
  const wmts = opts.wmts;
  if (wmts === null || typeof wmts !== "object" || Array.isArray(wmts)) {
    return null;
  }
  return wmts as {
    layer?: string;
    matrixSet?: string;
    style?: string;
    matrixIds?: unknown[];
    origin?: unknown[];
    resolutions?: unknown[];
  };
}

type SearchLayerWithRelations = Prisma.SearchLayerGetPayload<{
  include: {
    service: { include: { projection: true } };
    metadata: true;
  };
}>;

type EditingLayerWithRelations = Prisma.EditingLayerGetPayload<{
  include: { service: { include: { projection: true } } };
}>;

const mapPlacementFilter = (
  mapName: string
): Prisma.LayerInstanceWhereInput => ({
  OR: [{ map: { name: mapName } }, { group: { maps: { some: { mapName } } } }],
});

function appendSearchLayerToWfs(
  out: HajkLegacyLayersConfigDocument,
  searchLayer: SearchLayerWithRelations,
  instance?: { id: string; zIndex: number; visibleAtStart: boolean }
) {
  const service = searchLayer.service;
  const svc = toClientServiceFields({
    url: service.url,
    type: service.type,
    serverType: service.serverType,
    version: service.version,
    imageFormat: service.imageFormat,
    projection: service.projection
      ? { code: service.projection.code }
      : undefined,
    workspace: service.workspace ?? undefined,
    getMapUrl: service.getMapUrl ?? undefined,
  });
  const selected = searchLayer.selectedLayers ?? [];
  const metadata = searchLayer.metadata;
  const optionsRec = getOptionsRecord(searchLayer.options);

  out.wfslayers.push({
    id: instance?.id ?? searchLayer.id,
    caption: searchLayer.name,
    url: searchLayer.url ?? svc.url,
    layers: selected,
    searchFields: searchLayer.active ? searchLayer.searchFields : [],
    infobox: searchLayer.infobox ?? "",
    aliasDict: searchLayer.aliasDict ?? "",
    displayFields: searchLayer.primaryDisplayFields,
    geometryField: searchLayer.geometryField ?? "geom",
    outputFormat: searchOutputToClient(searchLayer.outputFormat),
    infoVisible: false,
    infoTitle: metadata?.title ?? null,
    infoText: searchLayer.description ?? null,
    infoUrl: metadata?.url ?? null,
    infoUrlText: metadata?.urlTitle ?? null,
    infoOwner: metadata?.owner ?? null,
    zIndex:
      instance && instance.zIndex !== 0
        ? instance.zIndex
        : searchLayer.zIndex !== 0
          ? searchLayer.zIndex
          : null,
    visibleAtStart: instance?.visibleAtStart,
    secondaryLabelFields: searchLayer.secondaryDisplayFields,
    shortDisplayFields: searchLayer.shortDisplayFields,
    serverType: svc.serverType,
    projection: svc.projection ?? "",
    version: svc.version ?? "1.1.0",
    layer: selected[0] ?? "",
    dataFormat: searchOutputToClient(searchLayer.outputFormat),
    ...optionsRec,
  });
}

function appendEditingLayerToWfst(
  out: HajkLegacyLayersConfigDocument,
  editingLayer: EditingLayerWithRelations,
  instance?: { id: string; zIndex: number }
) {
  const service = editingLayer.service;
  const svc = toClientServiceFields({
    url: service.url,
    type: service.type,
    serverType: service.serverType,
    version: service.version,
    imageFormat: service.imageFormat,
    projection: service.projection
      ? { code: service.projection.code }
      : undefined,
    workspace: service.workspace ?? undefined,
    getMapUrl: service.getMapUrl ?? undefined,
  });
  const selected = editingLayer.selectedLayers ?? [];
  const optionsRec = getOptionsRecord(editingLayer.options);

  out.wfstlayers.push({
    id: instance?.id ?? editingLayer.id,
    caption: editingLayer.name,
    url: svc.url,
    serverType: svc.serverType,
    projection: svc.projection ?? "",
    version: svc.version ?? "1.1.0",
    layers: selected,
    layer: selected[0] ?? "",
    geometryField: editingLayer.geometryField ?? "geom",
    zIndex: instance && instance.zIndex !== 0 ? instance.zIndex : null,
    ...getWfstEditingFields(optionsRec),
  });
}

export async function buildLegacyLayersConfigForMap(
  mapName: string
): Promise<HajkLegacyLayersConfigDocument> {
  const instances = await prisma.layerInstance.findMany({
    where: {
      AND: [
        mapPlacementFilter(mapName),
        {
          OR: [
            {
              displayLayer: {
                deletedAt: null,
                service: { deletedAt: null },
              },
            },
            {
              searchLayer: {
                deletedAt: null,
                service: { deletedAt: null },
              },
            },
            {
              editingLayer: {
                deletedAt: null,
                service: { deletedAt: null },
              },
            },
          ],
        },
      ],
    },
    orderBy: { zIndex: "asc" },
    include: {
      displayLayer: {
        include: {
          service: { include: { projection: true } },
          metadata: true,
          infoClickSettings: true,
        },
      },
      searchLayer: {
        include: {
          service: { include: { projection: true } },
          metadata: true,
        },
      },
      editingLayer: {
        include: { service: { include: { projection: true } } },
      },
    },
  });

  const searchLayerIdsOnMap = instances
    .map((inst) => inst.searchLayerId)
    .filter((id): id is string => Boolean(id));

  const editingLayerIdsOnMap = instances
    .map((inst) => inst.editingLayerId)
    .filter((id): id is string => Boolean(id));

  const searchLayers = await prisma.searchLayer.findMany({
    where: {
      deletedAt: null,
      service: { deletedAt: null },
      ...(searchLayerIdsOnMap.length > 0
        ? { id: { notIn: searchLayerIdsOnMap } }
        : {}),
    },
    include: {
      service: { include: { projection: true } },
      metadata: true,
    },
  });

  const editingLayers = await prisma.editingLayer.findMany({
    where: {
      deletedAt: null,
      service: { deletedAt: null },
      ...(editingLayerIdsOnMap.length > 0
        ? { id: { notIn: editingLayerIdsOnMap } }
        : {}),
    },
    include: { service: { include: { projection: true } } },
  });

  if (
    instances.length === 0 &&
    searchLayers.length === 0 &&
    editingLayers.length === 0
  ) {
    return emptyBuckets();
  }

  const out = emptyBuckets();

  for (const inst of instances) {
    if (inst.searchLayer) {
      appendSearchLayerToWfs(out, inst.searchLayer, inst);
      continue;
    }

    if (inst.editingLayer) {
      appendEditingLayerToWfst(out, inst.editingLayer, inst);
      continue;
    }

    const layer = inst.displayLayer;
    if (!layer) {
      continue;
    }

    const service = layer.service;
    const svc = toClientServiceFields({
      url: service.url,
      type: service.type,
      serverType: service.serverType,
      version: service.version,
      imageFormat: service.imageFormat,
      projection: service.projection
        ? { code: service.projection.code }
        : undefined,
      workspace: service.workspace ?? undefined,
      getMapUrl: service.getMapUrl ?? undefined,
    });

    const bucket = toClientLayerBucket(service.type);
    if (!bucket) {
      logger.warn(
        `Layer instance "${inst.id}": unknown service.type "${String(service.type)}" — skipped.`
      );
      continue;
    }

    const selected = layer.selectedLayers ?? [];
    if (selected.length === 0 && bucket !== "arcgislayers") {
      logger.warn(
        `Layer instance "${inst.id}" (layer "${layer.name}") has empty selectedLayers — skipped.`
      );
      continue;
    }

    const metadata = layer.metadata;
    const infClick = layer.infoClickSettings;

    const optionsRec = getOptionsRecord(layer.options);
    const wmtsExtras =
      bucket === "wmtslayers" ? getWmtsOptions(layer.options) : null;

    const baseId = inst.id;

    /** Common Hajk attribution / infobox footer fields */
    const commonInfo = () => ({
      infoVisible:
        layer.showMetadata === true ||
        ((metadata?.url?.length ?? 0) > 0 &&
          metadata?.title != null &&
          metadata.title !== ""),
      infoTitle: metadata?.title ?? "",
      infoText: layer.description ?? "",
      infoUrl: metadata?.url ?? "",
      infoUrlText: metadata?.urlTitle ?? "",
      infoOwner: metadata?.owner ?? "",
      infoOpenDataLink: "",
      attribution: metadata?.attribution ?? "",
      hideExpandArrow: layer.hideExpandArrow,
      timeSliderStart: layer.timeSliderStart ?? "",
      timeSliderEnd: layer.timeSliderEnd ?? "",
      rotateMap: "n",
      drawOrder: inst.zIndex,
    });

    if (bucket === "wmslayers") {
      out.wmslayers.push({
        id: baseId,
        caption: layer.name,
        internalLayerName: layer.internalName ?? "",
        url: svc.url,
        customGetMapUrl: svc.customGetMapUrl ?? "",
        owner: metadata?.owner ?? "",
        date: layer.lastSavedDate ? String(layer.lastSavedDate.getTime()) : "",
        content: "",
        legend: "",
        legendIcon: layer.legendIconUrl ?? "",
        projection: svc.projection ?? "",
        workspace: svc.workspace ?? "",
        layers: selected,
        layersInfo: buildLayersInfoArray(selected, layer.options),
        searchFields: null,
        displayFields: null,
        visibleAtStart: inst.visibleAtStart,
        tiled: layer.tiled,
        opacity: layer.opacity,
        singleTile: layer.singleTile,
        hidpi: layer.hidpi,
        useCustomDpiList:
          typeof optionsRec.useCustomDpiList === "boolean"
            ? optionsRec.useCustomDpiList
            : false,
        customDpiList: Array.isArray(optionsRec.customDpiList)
          ? optionsRec.customDpiList
          : [],
        imageFormat: svc.imageFormat ?? "image/png",
        serverType: svc.serverType ?? "geoserver",
        version: svc.version ?? "1.1.1",
        infoFormat:
          typeof infClick?.format === "string"
            ? infClick.format
            : "application/json",
        legendUrl: layer.legendUrl ?? "",
        legendOptions: layer.legendOptions ?? "",
        legendIconUrl: layer.legendIconUrl ?? "",
        searchUrl: "",
        searchPropertyName: "",
        searchDisplayName: "",
        searchShortDisplayName: "",
        secondaryLabelFields: "",
        searchOutputFormat: "",
        searchGeometryField: "",
        maxZoom: layer.maxZoom >= 0 ? layer.maxZoom : -1,
        minZoom: layer.minZoom >= 0 ? layer.minZoom : -1,
        minMaxZoomAlertOnToggleOnly: layer.minMaxZoomAlertOnToggleOnly,
        infoClickSortType: infClick?.sortMethod ?? "text",
        infoClickSortDesc: infClick?.sortDescending ?? false,
        infoClickSortProperty: infClick?.sortProperty ?? "",
        zIndex:
          inst.zIndex !== 0
            ? inst.zIndex
            : layer.zIndex !== 0
              ? layer.zIndex
              : null,
        geoWebCache:
          typeof optionsRec.geoWebCache === "boolean"
            ? optionsRec.geoWebCache
            : false,
        showAttributeTableButton:
          typeof optionsRec.showAttributeTableButton === "boolean"
            ? optionsRec.showAttributeTableButton
            : false,
        keyword:
          typeof optionsRec.keyword === "string" ? optionsRec.keyword : "",
        category:
          typeof optionsRec.category === "string" ? optionsRec.category : "",
        layerDisplayDescription:
          typeof optionsRec.layerDisplayDescription === "string"
            ? optionsRec.layerDisplayDescription
            : "",
        customRatio: layer.customRatio ?? 0,
        style: layer.style ?? "",
        ...commonInfo(),
      });
      continue;
    }

    if (bucket === "wmtslayers") {
      const capLayer = wmtsExtras?.layer ?? selected[0] ?? "";
      out.wmtslayers.push({
        id: baseId,
        caption: layer.name,
        url: svc.url,
        layer: capLayer,
        matrixSet: wmtsExtras?.matrixSet ?? "",
        style:
          wmtsExtras?.style !== undefined && wmtsExtras.style !== ""
            ? wmtsExtras.style
            : (layer.style ?? ""),
        projection: svc.projection ?? "",
        opacity: layer.opacity,
        tiled: layer.tiled,
        maxZoom: layer.maxZoom >= 0 ? layer.maxZoom : -1,
        minZoom: layer.minZoom >= 0 ? layer.minZoom : -1,
        origin: wmtsExtras?.origin ?? [],
        resolutions: wmtsExtras?.resolutions ?? [],
        matrixIds: wmtsExtras?.matrixIds ?? [],
        visibleAtStart: inst.visibleAtStart,
        attribution: metadata?.attribution ?? "",
        legend: layer.legendUrl ?? "",
        legendIcon: layer.legendIconUrl ?? "",
        rotateMap: "n",
        drawOrder: inst.zIndex,
      });
      continue;
    }

    if (bucket === "vectorlayers") {
      const typename =
        typeof optionsRec.vectorLayerName === "string" &&
        optionsRec.vectorLayerName.length > 0
          ? optionsRec.vectorLayerName
          : (selected[0] ?? "");

      const dataFormat =
        typeof optionsRec.dataFormat === "string" &&
        optionsRec.dataFormat.length > 0
          ? optionsRec.dataFormat
          : "GeoJSON";

      appendToBucket("vectorlayers", out, {
        id: baseId,
        caption: layer.name,
        url: svc.url,
        serverType: svc.serverType,
        projection: svc.projection ?? "",
        version: svc.version ?? "1.1.0",
        layers: selected,
        layer: typename,
        dataFormat,
        geometryField: "geom",
        outputFormat: dataFormat,
        searchFields: [],
        aliasDict:
          typeof optionsRec.aliasDict === "string" ? optionsRec.aliasDict : "",
        infobox:
          infClick?.definition ??
          (typeof optionsRec.infoboxSummary === "string"
            ? optionsRec.infoboxSummary
            : ""),
        displayFields: [],
        secondaryLabelFields: [],
        shortDisplayFields: [],
        infoclickIcon: infClick?.icon ?? "",
        opacity: layer.opacity,
        maxZoom: layer.maxZoom >= 0 ? layer.maxZoom : -1,
        minZoom: layer.minZoom >= 0 ? layer.minZoom : -1,
        visibleAtStart: inst.visibleAtStart,
        queryable: inst.infoClickActive !== false,
        infoClickSortType: infClick?.sortMethod ?? "text",
        infoClickSortDesc: infClick?.sortDescending ?? false,
        infoClickSortProperty: infClick?.sortProperty ?? "",
        content:
          typeof optionsRec.content === "string" ? optionsRec.content : "",
        extent: Array.isArray(optionsRec.extent) ? optionsRec.extent : [],
        legend: layer.legendUrl ?? "",
        legendIcon: layer.legendIconUrl ?? "",
        rotateMap: "n",
        drawOrder: inst.zIndex,
        infoVisible:
          layer.showMetadata === true ||
          (metadata?.url != null && metadata.url.length > 0),
        infoTitle: metadata?.title ?? null,
        infoText:
          typeof optionsRec.vectorInfoText === "string"
            ? optionsRec.vectorInfoText
            : (layer.description ?? null),
        infoUrl: metadata?.url ?? null,
        infoUrlText: metadata?.urlTitle ?? null,
        infoOwner: metadata?.owner ?? null,
        zIndex:
          inst.zIndex !== 0
            ? inst.zIndex
            : layer.zIndex !== 0
              ? layer.zIndex
              : null,
      });
      continue;
    }

    if (bucket === "arcgislayers") {
      out.arcgislayers.push({
        id: baseId,
        caption: layer.name,
        url: svc.url,
        layers: selected.length > 0 ? selected : ([] as string[]),
        opacity: layer.opacity,
        visibleAtStart: inst.visibleAtStart,
        projection: svc.projection ?? "",
        legend: layer.legendUrl ?? "",
        queryable: true,
        singleTile: true,
        ...commonInfo(),
      });
    }
  }

  for (const searchLayer of searchLayers) {
    appendSearchLayerToWfs(out, searchLayer);
  }

  for (const editingLayer of editingLayers) {
    appendEditingLayerToWfst(out, editingLayer);
  }

  return out;
}

function appendToBucket(
  bucket: Exclude<ClientLayerBucket, "wmslayers" | "wmtslayers">,
  out: HajkLegacyLayersConfigDocument,
  vecEntry: Record<string, unknown>
) {
  switch (bucket) {
    case "wfslayers":
      out.wfslayers.push(vecEntry);
      break;
    case "vectorlayers":
      out.vectorlayers.push(vecEntry);
      break;
    case "wfstlayers":
      out.wfstlayers.push(vecEntry);
      break;
    default:
      break;
  }
}
