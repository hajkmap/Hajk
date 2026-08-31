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
  const layersByGroupId = new Map<string, FlattenedGroupLayers["layers"]>();

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
        zIndex: layer.drawOrder ?? layerIndex,
        options: layer.infobox ? { infobox: layer.infobox } : {},
      }));
      // Last occurrence wins if the same group appears more than once.
      layersByGroupId.set(group.id, layerRows);

      if (group.groups?.length) {
        walk(group.groups, placementId);
      }
    });
  };

  walk(groups, null);

  return {
    placements,
    groupLayers: Array.from(layersByGroupId.entries()).map(
      ([groupId, layers]) => ({ groupId, layers }),
    ),
  };
}
