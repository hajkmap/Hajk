import { useMemo } from "react";

import { useDeletedMaps, type Map as MapRecord } from "../../api/maps";
import { useDeletedGroups, type Group } from "../../api/groups";
import { useDeletedServices, type Service } from "../../api/services";
import { useDeletedLayers, type DeletedLayer } from "../../api/layers";
import { useDeletedThemes, type Theme } from "../../api/themes";

export type DeletedItemKind = "map" | "group" | "service" | "layer" | "theme";

export type DeletedItem =
  | {
      id: string;
      kind: "map";
      name: string;
      deletedAt: string | null;
      data: MapRecord;
    }
  | {
      id: string;
      kind: "group";
      name: string;
      deletedAt: string | null;
      data: Group;
    }
  | {
      id: string;
      kind: "service";
      name: string;
      deletedAt: string | null;
      data: Service;
    }
  | {
      id: string;
      kind: "layer";
      name: string;
      deletedAt: string | null;
      data: DeletedLayer;
    }
  | {
      id: string;
      kind: "theme";
      name: string;
      deletedAt: string | null;
      data: Theme;
    };

export type DeletedItemCounts = Record<DeletedItemKind | "all", number>;

function deletedAtTime(value: string | null | undefined): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function useDeletedItems() {
  const mapsQuery = useDeletedMaps();
  const groupsQuery = useDeletedGroups();
  const servicesQuery = useDeletedServices();
  const layersQuery = useDeletedLayers();
  const themesQuery = useDeletedThemes();

  const queries = [
    mapsQuery,
    groupsQuery,
    servicesQuery,
    layersQuery,
    themesQuery,
  ];

  const items = useMemo(() => {
    const next: DeletedItem[] = [
      ...(mapsQuery.data ?? []).map((data) => ({
        id: `map:${data.id}`,
        kind: "map" as const,
        name: data.name,
        deletedAt: data.deletedAt ?? null,
        data,
      })),
      ...(groupsQuery.data ?? []).map((data) => ({
        id: `group:${data.id}`,
        kind: "group" as const,
        name: data.name,
        deletedAt: data.deletedAt ?? null,
        data,
      })),
      ...(servicesQuery.data ?? []).map((data) => ({
        id: `service:${data.id}`,
        kind: "service" as const,
        name: data.name,
        deletedAt: data.deletedAt ?? null,
        data,
      })),
      ...(layersQuery.data ?? []).map((data) => ({
        id: `layer:${data.id}`,
        kind: "layer" as const,
        name: data.name,
        deletedAt: data.deletedAt ?? null,
        data,
      })),
      ...(themesQuery.data ?? []).map((data) => ({
        id: `theme:${data.id}`,
        kind: "theme" as const,
        name: data.title,
        deletedAt: data.deletedAt ?? null,
        data,
      })),
    ];

    next.sort((a, b) => deletedAtTime(b.deletedAt) - deletedAtTime(a.deletedAt));
    return next;
  }, [
    mapsQuery.data,
    groupsQuery.data,
    servicesQuery.data,
    layersQuery.data,
    themesQuery.data,
  ]);

  const counts = useMemo((): DeletedItemCounts => {
    const next: DeletedItemCounts = {
      all: items.length,
      map: 0,
      group: 0,
      service: 0,
      layer: 0,
      theme: 0,
    };
    for (const item of items) {
      next[item.kind] += 1;
    }
    return next;
  }, [items]);

  return {
    items,
    counts,
    isLoading: queries.some((query) => query.isLoading),
    isError: queries.some((query) => query.isError),
  };
}
