import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import UsedInMapsPanel, {
  type UsedInMapsRow,
} from "../../components/used-in-maps-panel";
import { useLayerUsage } from "../../api/layers";
import { useMaps } from "../../api/maps";

function UsedInMapsGrid({ layerId }: { layerId: string }) {
  const { t } = useTranslation();
  const { data: usage = [], isLoading } = useLayerUsage(layerId);
  const { data: maps } = useMaps();

  const rows = useMemo(() => {
    const mapIdByName = new Map(
      (maps ?? []).map((map) => [map.name, map.id] as const),
    );
    const result: UsedInMapsRow[] = [];

    for (const entry of usage) {
      const groupName = entry.group?.name ?? "—";
      const usageLabel = t(`common.usage.${entry.usage}`);

      // Maps where this layer is active: direct map placement and/or every
      // map that hosts the layer's group (same rule as usage-summary).
      const mapNames = new Set<string>();
      if (entry.map?.name) {
        mapNames.add(entry.map.name);
      }
      for (const groupMap of entry.group?.maps ?? []) {
        if (groupMap.mapName) {
          mapNames.add(groupMap.mapName);
        }
      }

      if (mapNames.size === 0) {
        result.push({
          id: entry.id,
          map: "—",
          group: groupName,
          usage: usageLabel,
        });
        continue;
      }

      for (const mapName of [...mapNames].sort((a, b) => a.localeCompare(b))) {
        result.push({
          id: `${entry.id}:${mapName}`,
          map: mapName,
          mapId:
            entry.map?.name === mapName
              ? entry.map.id
              : mapIdByName.get(mapName),
          group: groupName,
          usage: usageLabel,
        });
      }
    }

    return result;
  }, [usage, maps, t]);

  return (
    <UsedInMapsPanel
      rows={rows}
      isLoading={isLoading}
      emptyMessage={t("layers.usedInMapsNone")}
      showGroupColumn
      showUsageColumn
      mapTab="menu"
    />
  );
}

export default UsedInMapsGrid;
