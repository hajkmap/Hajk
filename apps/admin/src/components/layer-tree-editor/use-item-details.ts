import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useGroups } from "../../api/groups";
import {
  useLayerTreePlacements,
  type LayerTreePlacements,
} from "../../api/layer-tree";
import { useLayers } from "../../api/layers";
import { useServices } from "../../api/services";
import type { LayerTreeItemKind } from "./layer-tree-model";

export interface LayerTreeItemDetails {
  /** Where the item is placed, and its service or internal name. */
  lines: string[];
  /** Short text that tells apart items with the same name. */
  context: string;
}

interface GroupRef {
  id: string;
  name: string;
}

const MAX_PATHS = 5;

/** Chains of groups from a top group down to `group`, through every parent. */
function pathsTo(
  group: GroupRef,
  placements: LayerTreePlacements,
  seen = new Set<string>(),
): GroupRef[][] {
  const parents = placements.groups[group.id]?.groups ?? [];
  if (parents.length === 0 || seen.has(group.id)) {
    return [[group]];
  }
  const next = new Set(seen).add(group.id);
  return parents.flatMap((parent) =>
    pathsTo(parent, placements, next).map((path) => [...path, group]),
  );
}

/** Tells where a group or layer belongs, e.g. "Naturvårdsverket › Skyddade områden". */
export function useItemDetails() {
  const { t } = useTranslation();
  const { data: placements } = useLayerTreePlacements();
  const { data: groups } = useGroups();
  const { data: layers } = useLayers();
  const { data: services } = useServices();

  const internalNames = useMemo(
    () =>
      new Map((groups ?? []).map((group) => [group.id, group.internalName])),
    [groups],
  );
  const serviceNames = useMemo(() => {
    const names = new Map(
      (services ?? []).map((service) => [service.id, service.name]),
    );
    return new Map(
      (layers ?? []).map((layer) => [layer.id, names.get(layer.serviceId)]),
    );
  }, [layers, services]);

  return useCallback(
    (kind: LayerTreeItemKind, id: string): LayerTreeItemDetails => {
      const placement =
        placements?.[kind === "group" ? "groups" : "layers"][id];
      const paths = placements
        ? (placement?.groups ?? []).flatMap((parent) =>
            pathsTo(parent, placements),
          )
        : [];
      const chain = (path: GroupRef[]) =>
        path.map((group) => group.name).join(" › ");

      const lines: string[] = [];
      const internalName = kind === "group" ? internalNames.get(id) : undefined;
      const service = kind === "layer" ? serviceNames.get(id) : undefined;
      if (internalName) {
        lines.push(t("layerTree.details.internalName", { name: internalName }));
      }
      if (service) {
        lines.push(t("layerTree.details.service", { name: service }));
      }
      for (const path of paths.slice(0, MAX_PATHS)) {
        const maps = placements?.groups[path[0].id]?.maps ?? [];
        lines.push(
          maps.length > 0
            ? t("layerTree.details.pathInMaps", {
                path: chain(path),
                maps: maps.join(", "),
              })
            : t("layerTree.details.path", { path: chain(path) }),
        );
      }
      if (paths.length > MAX_PATHS) {
        lines.push(
          t("layerTree.details.morePaths", { count: paths.length - MAX_PATHS }),
        );
      }
      if (placement?.maps.length) {
        lines.push(
          t("layerTree.details.directInMaps", {
            maps: placement.maps.join(", "),
          }),
        );
      }
      if (paths.length === 0 && !placement?.maps.length) {
        lines.push(t("layerTree.details.nowhere"));
      }

      const context = paths[0]
        ? t("layerTree.details.context", { path: chain(paths[0]) })
        : placement?.maps.length
          ? t("layerTree.details.directInMaps", {
              maps: placement.maps.join(", "),
            })
          : (service ?? t("layerTree.details.nowhereShort"));

      return { lines, context };
    },
    [placements, internalNames, serviceNames, t],
  );
}
