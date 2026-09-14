import { randomUUID } from "node:crypto";
import { UseType } from "@prisma/client";

/** Nested group shape accepted by PUT /maps/:mapName/layerswitcher. */
export interface LayerSwitcherWriteLayerRef {
  id: string;
  drawOrder?: number;
  visibleAtStart?: boolean;
  infobox?: string;
}

export interface LayerSwitcherWriteGroup {
  id: string;
  name?: string;
  toggled?: boolean;
  expanded?: boolean;
  exclusiveGroup?: boolean;
  infogroupvisible?: boolean;
  infogrouptitle?: string;
  infogrouptext?: string;
  infogroupurl?: string;
  infogroupurltext?: string;
  infogroupopendatalink?: string;
  infogroupowner?: string;
  layers?: LayerSwitcherWriteLayerRef[];
  groups?: LayerSwitcherWriteGroup[];
  /** Interleaved Lagerordning sibling order (layers + nested group ids). */
  layerSwitcherTree?: Array<
    | { type: "layer"; id: string }
    | { type: "group"; id: string }
  >;
}

export interface FlattenedGroupsOnMapsRow {
  id: string;
  groupId: string;
  parentGroupId: string | null;
  usage: typeof UseType.FOREGROUND;
  name: string;
  toggled: boolean;
  expanded: boolean;
  exclusiveGroup: boolean;
  infoDocument: boolean;
  index: number;
  metadata: {
    title: string;
    description: string;
    owner: string;
    url: string;
    urlTitle: string;
    urlOpenData: string;
  } | null;
}

export interface FlattenedGroupLayers {
  groupId: string;
  layers: {
    layerId: string;
    usage: typeof UseType.FOREGROUND;
    visibleAtStart: boolean;
    zIndex: number;
    options: { infobox?: string };
  }[];
  /**
   * Interleaved Lagerordning sibling order (layers + nested groups).
   * Stored on the first LayerInstance so GET can rebuild free order.
   */
  layerSwitcherTree: Array<
    | { type: "layer"; id: string }
    | { type: "group"; id: string }
  >;
}

function hasInfoDocument(group: LayerSwitcherWriteGroup): boolean {
  return Boolean(
    group.infogroupvisible ||
      group.infogrouptitle ||
      group.infogrouptext ||
      group.infogroupurl ||
      group.infogroupurltext ||
      group.infogroupopendatalink ||
      group.infogroupowner,
  );
}

/**
 * Flatten nested Kartlager groups into GroupsOnMaps rows (seed-aligned) and
 * per-group LayerInstance payloads (catalog layer ids).
 */
export function flattenLayerSwitcherGroupsForWrite(
  groups: LayerSwitcherWriteGroup[],
): {
  placements: FlattenedGroupsOnMapsRow[];
  groupLayers: FlattenedGroupLayers[];
} {
  const placements: FlattenedGroupsOnMapsRow[] = [];
  const layersByGroupId = new Map<string, FlattenedGroupLayers>();

  const walk = (
    nodes: LayerSwitcherWriteGroup[],
    parentGroupId: string | null,
  ) => {
    nodes.forEach((group, index) => {
      const placementId = randomUUID();
      const infoDocument = Boolean(group.infogroupvisible);
      placements.push({
        id: placementId,
        groupId: group.id,
        parentGroupId,
        usage: UseType.FOREGROUND,
        name: group.name ?? "",
        toggled: Boolean(group.toggled),
        expanded: Boolean(group.expanded),
        exclusiveGroup: Boolean(group.exclusiveGroup),
        infoDocument,
        index,
        metadata: hasInfoDocument(group)
          ? {
              title: group.infogrouptitle ?? "",
              description: group.infogrouptext ?? "",
              owner: group.infogroupowner ?? "",
              url: group.infogroupurl ?? "",
              urlTitle: group.infogroupurltext ?? "",
              urlOpenData: group.infogroupopendatalink ?? "",
            }
          : null,
      });

      const layerRows = (group.layers ?? []).map((layer, layerIndex) => ({
        layerId: layer.id,
        usage: UseType.FOREGROUND as typeof UseType.FOREGROUND,
        visibleAtStart: Boolean(layer.visibleAtStart),
        // zIndex remains ritordning (drawOrder), not Lagerordning list index.
        zIndex: layer.drawOrder ?? layerIndex,
        options: layer.infobox ? { infobox: layer.infobox } : {},
      }));
      const layerSwitcherTree =
        group.layerSwitcherTree && group.layerSwitcherTree.length > 0
          ? group.layerSwitcherTree.map((entry) =>
              entry.type === "layer"
                ? { type: "layer" as const, id: entry.id }
                : { type: "group" as const, id: entry.id },
            )
          : [
              ...(group.layers ?? []).map((layer) => ({
                type: "layer" as const,
                id: layer.id,
              })),
              ...(group.groups ?? []).map((nested) => ({
                type: "group" as const,
                id: nested.id,
              })),
            ];
      // Last occurrence wins if the same group appears more than once.
      layersByGroupId.set(group.id, {
        groupId: group.id,
        layers: layerRows,
        layerSwitcherTree,
      });

      if (group.groups?.length) {
        walk(group.groups, placementId);
      }
    });
  };

  walk(groups, null);

  return {
    placements,
    groupLayers: Array.from(layersByGroupId.values()),
  };
}
