import type { MapLayer, MapLayerPlacement } from "../../api/maps";
import type { LayerKind } from "../../api/layers";

/**
 * A search or editing layer in the map's "Lager" list. The map's display
 * layers are its layer tree and background, edited under Lagerordning.
 */
export interface MapLayerActivationRow {
  layerId: string;
  name: string;
  layerKind: LayerKind;
  active: boolean;
}

/** Layers the "Lager" list holds: those not placed through the layer tree. */
export function isActivatedLayerKind(layerKind: LayerKind): boolean {
  return layerKind === "search" || layerKind === "editing";
}

export function buildMapLayerActivationRows(
  catalogLayers: {
    id: string;
    name: string;
    layerKind?: LayerKind;
  }[],
  mapLayers: MapLayer[],
): MapLayerActivationRow[] {
  const onMap = new Set(mapLayers.map((layer) => layer.id));

  return catalogLayers
    .filter((layer) => isActivatedLayerKind(layer.layerKind ?? "display"))
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    )
    .map((layer) => ({
      layerId: layer.id,
      name: layer.name,
      layerKind: layer.layerKind ?? "display",
      active: onMap.has(layer.id),
    }));
}

export function mapLayerActivationSignature(
  rows: MapLayerActivationRow[],
): string {
  return JSON.stringify(
    rows
      .filter((row) => row.active)
      .map((row) => row.layerId)
      .sort(),
  );
}

export function mapLayerActivationToPayload(
  rows: MapLayerActivationRow[],
): MapLayerPlacement[] {
  return rows
    .filter((row) => row.active)
    .map((row, index) => ({ layerId: row.layerId, zIndex: index }));
}
