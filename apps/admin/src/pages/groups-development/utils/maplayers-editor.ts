import type {
  GroupDisplaySettings,
  GroupLayerTreeNode,
  LayerDisplaySettings,
  LayerSwitcherDraft,
} from "../types";
import { DEFAULT_LAYER_DISPLAY_SETTINGS } from "../types";
import {
  layerSwitcherDraftComparableSignature,
  nodeModelsToClientGroups,
} from "./client-groups";
import { collectPlacedSourceIds } from "./tree-model";

/** Draft shape for the map-layers editor (alias of LayerSwitcherDraft). */
export type MapLayersDraft = LayerSwitcherDraft;

export function resolveEffectiveBackgroundOrderedIds(
  backgroundOrderedIds: string[],
  activationBackgroundOrder: string[] | null,
): string[] {
  if (activationBackgroundOrder == null) {
    return backgroundOrderedIds;
  }
  const backgroundIdSet = new Set(activationBackgroundOrder);
  return backgroundOrderedIds.filter((id) => backgroundIdSet.has(id));
}

export function buildDrawOrderLayerRows(
  treeData: GroupLayerTreeNode[],
  layerNames: Map<string, string>,
  activeLayerIds: ReadonlySet<string> | null,
  mapBackgroundLayerIds: ReadonlySet<string>,
): { id: string; name: string }[] {
  const placedLayerIds = collectPlacedSourceIds(treeData).layerIds;
  return [...placedLayerIds]
    .filter((id) => {
      if (!layerNames.has(id)) {
        return false;
      }
      if (mapBackgroundLayerIds.has(id)) {
        return false;
      }
      if (activeLayerIds != null && !activeLayerIds.has(id)) {
        return false;
      }
      return true;
    })
    .map((id) => ({
      id,
      name: layerNames.get(id) ?? id,
    }));
}

export function resolveEffectiveDrawOrderOrderedIds(
  drawOrderOrderedIds: string[],
  drawOrderLayers: { id: string; name: string }[],
  parkedIds: ReadonlySet<string> = new Set(),
): string[] {
  const eligibleIds = new Set(
    drawOrderLayers.map((layer) => layer.id).filter((id) => !parkedIds.has(id)),
  );
  const kept = drawOrderOrderedIds.filter((id) => eligibleIds.has(id));
  const keptSet = new Set(kept);
  const added = drawOrderLayers
    .filter((layer) => eligibleIds.has(layer.id) && !keptSet.has(layer.id))
    .slice()
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    )
    .map((layer) => layer.id);
  return [...kept, ...added];
}

export function insertDrawOrderIdAt(
  orderedIds: string[],
  layerId: string,
  insertIndex?: number,
): string[] {
  const next = orderedIds.filter((id) => id !== layerId);
  const index =
    insertIndex == null
      ? next.length
      : Math.max(0, Math.min(insertIndex, next.length));
  next.splice(index, 0, layerId);
  return next;
}

export function isLayerStillInMapLayersTree(
  tree: GroupLayerTreeNode[],
  layerId: string,
): boolean {
  return tree.some(
    (node) => node.data?.kind === "layer" && node.data.sourceId === layerId,
  );
}

export function applyDrawOrderToLayerDisplaySettings(
  layerDisplaySettings: Record<string, LayerDisplaySettings>,
  orderedIdsTopToBottom: string[],
): Record<string, LayerDisplaySettings> {
  if (orderedIdsTopToBottom.length === 0) {
    return layerDisplaySettings;
  }

  const next: Record<string, LayerDisplaySettings> = {
    ...layerDisplaySettings,
  };
  const total = orderedIdsTopToBottom.length;
  orderedIdsTopToBottom.forEach((layerId, index) => {
    next[layerId] = {
      ...(next[layerId] ?? DEFAULT_LAYER_DISPLAY_SETTINGS),
      drawOrder: total - index,
    };
  });
  return next;
}

export function buildLayerSwitcherEditorSnapshot(input: {
  treeData: GroupLayerTreeNode[];
  groupDisplaySettings: Record<string, GroupDisplaySettings>;
  layerDisplaySettings: Record<string, LayerDisplaySettings>;
  backgroundOrderedIds: string[];
  drawOrderOrderedIds: string[];
  activationBackgroundOrder: string[] | null;
  activeLayerIds: ReadonlySet<string> | null;
  mapBackgroundLayerIds: ReadonlySet<string>;
  layerNames: Map<string, string>;
  drawOrderParkedIds?: ReadonlySet<string>;
}): { draft: MapLayersDraft; signature: string } {
  const effectiveBackgroundOrderedIds = resolveEffectiveBackgroundOrderedIds(
    input.backgroundOrderedIds,
    input.activationBackgroundOrder,
  );
  const drawOrderLayers = buildDrawOrderLayerRows(
    input.treeData,
    input.layerNames,
    input.activeLayerIds,
    input.mapBackgroundLayerIds,
  );
  const effectiveDrawOrderOrderedIds = resolveEffectiveDrawOrderOrderedIds(
    input.drawOrderOrderedIds,
    drawOrderLayers,
    input.drawOrderParkedIds,
  );
  const settingsForGroups = applyDrawOrderToLayerDisplaySettings(
    input.layerDisplaySettings,
    effectiveDrawOrderOrderedIds,
  );
  const draft: MapLayersDraft = {
    groups: nodeModelsToClientGroups(
      input.treeData,
      input.groupDisplaySettings,
      settingsForGroups,
    ),
    baselayers: effectiveBackgroundOrderedIds.map((layerId, index) => ({
      layerId,
      zIndex: index,
      visibleAtStart:
        input.layerDisplaySettings[layerId]?.layerVisibleAtStart ?? false,
      infobox: input.layerDisplaySettings[layerId]?.layerInfoBox ?? "",
    })),
  };
  const signature = layerSwitcherDraftComparableSignature(
    {
      groups: draft.groups,
      baselayers: draft.baselayers.map(
        ({ layerId, visibleAtStart, infobox }) => ({
          layerId,
          visibleAtStart,
          infobox,
        }),
      ),
      baselayerOrder: effectiveBackgroundOrderedIds,
      drawOrderSequence: effectiveDrawOrderOrderedIds,
    },
    input.activeLayerIds,
  );
  return { draft, signature };
}
