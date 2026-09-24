import type { MapLayer, MapLayerPlacement } from "../../api/maps";
import type { LayerKind } from "../../api/layers";

export interface MapLayerActivationRow {
  layerId: string;
  name: string;
  layerKind: LayerKind;
  active: boolean;
  isBackground: boolean;
}

export function supportsBackground(layerKind: LayerKind): boolean {
  return layerKind === "display";
}

export function buildMapLayerActivationRows(
  catalogLayers: {
    id: string;
    name: string;
    layerKind?: LayerKind;
  }[],
  mapLayers: MapLayer[],
): MapLayerActivationRow[] {
  const instancesByCatalogId = new Map<string, MapLayer[]>();
  for (const layer of mapLayers) {
    const list = instancesByCatalogId.get(layer.id) ?? [];
    list.push(layer);
    instancesByCatalogId.set(layer.id, list);
  }

  return catalogLayers
    .slice()
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    )
    .map((layer) => {
      const layerKind = layer.layerKind ?? "display";
      const instances = instancesByCatalogId.get(layer.id) ?? [];
      const canBeBackground = supportsBackground(layerKind);
      const directBackground = instances.find(
        (instance) =>
          instance.mapId != null && instance.usage === "BACKGROUND",
      );
      return {
        layerId: layer.id,
        name: layer.name,
        layerKind,
        // Active when placed on the map directly or via a group on the map.
        active: instances.length > 0,
        isBackground: canBeBackground && directBackground != null,
      };
    });
}

export function mapLayerActivationSignature(
  rows: MapLayerActivationRow[],
): string {
  return JSON.stringify(
    rows
      .filter((row) => row.active)
      .map((row) => ({
        layerId: row.layerId,
        usage:
          supportsBackground(row.layerKind) && row.isBackground
            ? "BACKGROUND"
            : "FOREGROUND",
      }))
      .sort((a, b) => a.layerId.localeCompare(b.layerId)),
  );
}

export function mapLayerActivationToPayload(
  rows: MapLayerActivationRow[],
): MapLayerPlacement[] {
  const active = rows.filter((row) => row.active);
  const background = active.filter(
    (row) => supportsBackground(row.layerKind) && row.isBackground,
  );
  const backgroundIdSet = new Set(background.map((row) => row.layerId));
  const foreground = active.filter((row) => !backgroundIdSet.has(row.layerId));

  return [
    ...foreground.map((row, index) => ({
      layerId: row.layerId,
      usage: "FOREGROUND" as const,
      zIndex: index,
      visibleAtStart: false,
    })),
    ...background.map((row, index) => ({
      layerId: row.layerId,
      usage: "BACKGROUND" as const,
      zIndex: index,
      visibleAtStart: false,
    })),
  ];
}
