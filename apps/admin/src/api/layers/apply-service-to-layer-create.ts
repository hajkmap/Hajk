import type { LayerKind } from "./types";
import type { Service } from "../services/types";

function hasNonEmptyString(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

export function applyServiceDefaultsToLayerCreate(
  merged: Record<string, unknown>,
  service: Service,
  layerKind: LayerKind = "display",
): void {
  if (layerKind === "search") {
    const existing =
      (merged.searchSettings as Record<string, unknown> | undefined) ?? {};
    const url = typeof existing.url === "string" ? existing.url.trim() : "";
    if (!url) {
      merged.searchSettings = { ...existing, url: service.url };
    }
    if (merged.url === undefined || merged.url === "") {
      merged.url = service.url;
    }
  }

  if (layerKind === "display" && merged.infoClickSettings === undefined) {
    // Matches Prisma InfoClickSettings defaults (format, sortMethod, sortDescending).
    merged.infoClickSettings = {
      format: "application/json",
      sortMethod: "text",
      sortDescending: false,
    };
  }

  if (!service.metadata) {
    return;
  }

  const meta = (merged.metadata as Record<string, unknown> | undefined) ?? {};
  let changed = false;

  const metadataInheritanceMap: { key: keyof typeof meta; from?: string }[] = [
    { key: "title", from: service.metadata.title ?? undefined },
    { key: "description", from: service.metadata.description ?? undefined },
    { key: "owner", from: service.metadata.owner ?? undefined },
    { key: "url", from: service.metadata.url ?? undefined },
    { key: "urlTitle", from: service.metadata.urlTitle ?? undefined },
    { key: "attribution", from: service.metadata.attribution ?? undefined },
  ];

  for (const { key, from } of metadataInheritanceMap) {
    if (!hasNonEmptyString(meta[key]) && hasNonEmptyString(from)) {
      meta[key] = from;
      changed = true;
    }
  }

  if (changed) {
    merged.metadata = meta;
  }
}
