import { Box, Button, Typography } from "@mui/material";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  asPlaced,
  clickDestination,
  descendantIds,
  LAYER_TREE_ROOT_ID,
  moveNodeTo,
  placeProblem,
  selectionRoots,
  type LayerTreeCatalogItem,
  type LayerTreeClickPart,
  type LayerTreeEditorMode,
  type LayerTreeFlatNode,
  type LayerTreePlaceProblem,
} from "./layer-tree-model";
import type { LayerTreeMoveZoneItem } from "./layer-tree-move-zone";
import type { LayerTreeClickPick } from "./use-click-place";

/** Click and place as the editor hands it to the panel. */
export interface PanelClickPlace {
  pick: LayerTreeClickPick | null;
  pickCatalog: (item: LayerTreeCatalogItem, additive: boolean) => void;
  pickTree: (nodeId: string, additive: boolean) => void;
  clear: () => void;
  /** The move zone's items, for what is held from there. */
  zoneItems: LayerTreeMoveZoneItem[];
  /** Items held from the zone were placed in the tree. */
  onZonePlaced: (keys: string[]) => void;
}

interface Destination {
  parentId: string;
  index: number;
}

interface UseTreeClickPlaceOptions {
  clickPlace?: PanelClickPlace;
  nodes: LayerTreeFlatNode[];
  mode: LayerTreeEditorMode;
  rootGroupId?: string;
  movable: (node: LayerTreeFlatNode) => boolean;
  insertItem: (
    item: LayerTreeCatalogItem,
    parentId: string,
    index?: number,
  ) => Promise<boolean>;
  commit: (nodes: LayerTreeFlatNode[]) => void;
  openNodes: (ids: string[]) => void;
  warn: (problem: LayerTreePlaceProblem, name: string) => void;
}

/**
 * The panel's side of click and place (see useClickPlace): rows pick or
 * place, a line shows where what is held would go, and the top and the end
 * of the tree take it too. The same rules hold as when dragging.
 */
export function useTreeClickPlace({
  clickPlace,
  nodes,
  mode,
  rootGroupId,
  movable,
  insertItem,
  commit,
  openNodes,
  warn,
}: UseTreeClickPlaceOptions) {
  const { t } = useTranslation();
  // The row and the part of it the pointer is over.
  const [hover, setHover] = useState<{
    id: string;
    part: LayerTreeClickPart;
  } | null>(null);
  const pick = clickPlace?.pick ?? null;
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const zoneHeld =
    pick?.source === "zone" && clickPlace
      ? clickPlace.zoneItems.filter((item) => pick.keys.includes(item.key))
      : [];

  /** Held nodes in the tree: picked there, or flagged and picked in the zone. */
  const heldNodeIds = new Set(
    pick?.source === "tree"
      ? pick.nodeIds
      : zoneHeld.flatMap((item) => item.nodeId ?? []),
  );

  const problemFor = (
    item: { kind: LayerTreeCatalogItem["kind"]; sourceId: string },
    parentId: string,
    movingId?: string,
  ) =>
    placeProblem({
      nodes,
      mode,
      rootGroupId,
      parentId,
      kind: item.kind,
      sourceId: item.sourceId,
      movingId,
    });

  /** Whether all that is held can go under `parentId`. */
  const canPlace = (parentId: string) => {
    if (!pick) return false;
    if (pick.source === "catalog") {
      return pick.items.every(
        (item) => problemFor({ ...item, sourceId: item.id }, parentId) === null,
      );
    }
    if (pick.source === "tree") {
      return selectionRoots(nodes, pick.nodeIds).every((id) => {
        const node = byId.get(id);
        return node && problemFor(node.data, parentId, id) === null;
      });
    }
    return zoneHeld.every(
      (item) => problemFor(item, parentId, item.nodeId) === null,
    );
  };

  /**
   * The sibling everything goes in front of, or null for the end. A held row
   * can't be it: it moves too. Unlike an index, it stays put while rows are
   * taken out of the same group.
   */
  const anchorOf = (destination: Destination, moving: Set<string>) =>
    nodes
      .filter((node) => node.parent === destination.parentId)
      .slice(destination.index)
      .find((node) => !moving.has(node.id))?.id ?? null;

  /** Where `anchorId` is among the siblings now; the end without one. */
  const indexBefore = (
    current: LayerTreeFlatNode[],
    parentId: string,
    anchorId: string | null,
  ) => {
    if (anchorId === null) return undefined;
    const index = current
      .filter((node) => node.parent === parentId)
      .findIndex((node) => node.id === anchorId);
    return index === -1 ? undefined : index;
  };

  /** Moves nodes to one place, in the order picked; the ones moved. */
  const moveMany = (ids: string[], destination: Destination) => {
    let current = nodes;
    const moved: string[] = [];
    const own = new Set<string>();
    const anchorId = anchorOf(destination, new Set(ids));
    for (const id of ids) {
      const node = byId.get(id);
      if (!node || !movable(node)) continue;
      const problem = placeProblem({
        nodes: current,
        mode,
        rootGroupId,
        parentId: destination.parentId,
        kind: node.data.kind,
        sourceId: node.data.sourceId,
        movingId: id,
      });
      if (problem) {
        warn(problem, node.text);
        continue;
      }
      for (const inside of [id, ...descendantIds(current, id)]) {
        const ownNode = byId.get(inside);
        if (ownNode && movable(ownNode)) own.add(inside);
      }
      current = moveNodeTo(
        current,
        id,
        destination.parentId,
        indexBefore(current, destination.parentId, anchorId),
      );
      moved.push(id);
    }
    if (moved.length > 0) {
      commit(
        current.map((node) =>
          own.has(node.id) ? asPlaced(node, current, mode, rootGroupId) : node,
        ),
      );
      if (destination.parentId !== LAYER_TREE_ROOT_ID) {
        openNodes([destination.parentId]);
      }
    }
    return { moved, nodes: current, anchorId };
  };

  const placeAt = async (destination: Destination) => {
    if (!clickPlace || !pick) return;
    setHover(null);
    if (pick.source === "catalog") {
      let placed = false;
      // The first picked ends first.
      for (const item of [...pick.items].reverse()) {
        if (await insertItem(item, destination.parentId, destination.index)) {
          placed = true;
        }
      }
      if (placed) clickPlace.clear();
      return;
    }
    if (pick.source === "tree") {
      const { moved } = moveMany(
        selectionRoots(nodes, pick.nodeIds),
        destination,
      );
      if (moved.length > 0) clickPlace.clear();
      return;
    }
    const placedKeys: string[] = [];
    const flagged = zoneHeld.filter((item) => item.nodeId !== undefined);
    const result = moveMany(
      selectionRoots(
        nodes,
        flagged.flatMap((item) => item.nodeId ?? []),
      ),
      destination,
    );
    const moved = new Set(result.moved);
    placedKeys.push(
      ...flagged
        .filter((item) => item.nodeId && moved.has(item.nodeId))
        .map((item) => item.key),
    );
    // What isn't in the tree yet goes after what was moved, before the same
    // row; inserted last first, so the first picked ends first.
    const index = indexBefore(
      result.nodes,
      destination.parentId,
      result.anchorId,
    );
    for (const item of zoneHeld
      .filter((entry) => entry.nodeId === undefined)
      .reverse()) {
      if (
        await insertItem(
          { kind: item.kind, id: item.sourceId, name: item.name },
          destination.parentId,
          index,
        )
      ) {
        placedKeys.push(item.key);
      }
    }
    if (placedKeys.length > 0) {
      clickPlace.onZonePlaced(placedKeys);
      clickPlace.clear();
    }
  };

  const clickNode = (
    node: LayerTreeFlatNode,
    additive: boolean,
    part: LayerTreeClickPart,
  ) => {
    if (!clickPlace) return;
    if (additive) {
      if (movable(node)) clickPlace.pickTree(node.id, true);
      return;
    }
    if (pick) {
      // Not onto itself: a second click lets go of one picked row.
      if (heldNodeIds.has(node.id)) {
        if (pick.source === "tree" && pick.nodeIds.length === 1) {
          clickPlace.clear();
        }
        return;
      }
      const destination = clickDestination(nodes, node.id, part);
      if (destination) void placeAt(destination);
      return;
    }
    if (movable(node)) clickPlace.pickTree(node.id, false);
  };

  const rowProps = (node: LayerTreeFlatNode, depth: number) => {
    if (!clickPlace) return {};
    const target =
      pick && hover?.id === node.id && !heldNodeIds.has(node.id)
        ? clickDestination(nodes, node.id, hover.part)
        : null;
    return {
      onRowClick: (additive: boolean, part: LayerTreeClickPart) =>
        clickNode(node, additive, part),
      onRowHover: (part: LayerTreeClickPart) =>
        setHover((current) =>
          current?.id === node.id && current.part === part
            ? current
            : { id: node.id, part },
        ),
      picked: heldNodeIds.has(node.id),
      // Above the row before it, under it after it or (inset) in it.
      placeLine: target
        ? {
            depth: target.part === "into" ? depth + 1 : depth,
            edge:
              target.part === "before" ? ("top" as const) : ("bottom" as const),
            ok: canPlace(target.parentId),
          }
        : undefined,
    };
  };

  const heldName = (() => {
    if (!pick) return null;
    if (pick.source === "catalog") return pick.items.map((item) => item.name);
    if (pick.source === "tree") {
      return pick.nodeIds.map((id) => byId.get(id)?.text ?? id);
    }
    return zoneHeld.map((item) => item.name);
  })();

  const rootCount = nodes.filter(
    (node) => node.parent === LAYER_TREE_ROOT_ID,
  ).length;
  const edge = (label: string, index: number): ReactNode => {
    const ok = canPlace(LAYER_TREE_ROOT_ID);
    return (
      <Box
        role="button"
        aria-disabled={!ok}
        onClick={() => {
          if (ok) void placeAt({ parentId: LAYER_TREE_ROOT_ID, index });
        }}
        sx={{
          m: 1,
          py: 0.5,
          border: 1,
          borderStyle: "dashed",
          borderColor: ok ? "primary.main" : "divider",
          borderRadius: 1,
          textAlign: "center",
          cursor: ok ? "pointer" : "not-allowed",
          color: ok ? "primary.main" : "text.disabled",
          "&:hover": ok ? { bgcolor: "action.hover" } : undefined,
        }}
      >
        <Typography variant="caption">{label}</Typography>
      </Box>
    );
  };

  return {
    active: clickPlace !== undefined,
    rowProps,
    /** Hands the catalog its clicks. */
    catalogPick: clickPlace
      ? {
          picked: new Set(
            pick?.source === "catalog"
              ? pick.items.map((item) => `${item.kind}:${item.id}`)
              : [],
          ),
          onPick: clickPlace.pickCatalog,
        }
      : undefined,
    /** Above the tree: what is held, and a way to let go. */
    holding:
      clickPlace && heldName && heldName.length > 0 ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 0.75,
            mb: 1,
            borderRadius: 1,
            bgcolor: "action.selected",
            flexShrink: 0,
          }}
        >
          <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
            {heldName.length === 1
              ? t("layerTree.clickPlace.holding", { name: heldName[0] })
              : t("layerTree.clickPlace.holdingMany", {
                  count: heldName.length,
                })}
          </Typography>
          <Button size="small" onClick={clickPlace.clear}>
            {t("common.cancel")}
          </Button>
        </Box>
      ) : clickPlace ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 1, px: 0.5, flexShrink: 0 }}
        >
          {t("layerTree.clickPlace.help")}
        </Typography>
      ) : null,
    /** The top and the end of the tree, while something is held. */
    top: pick ? edge(t("layerTree.clickPlace.first"), 0) : null,
    bottom: pick ? edge(t("layerTree.clickPlace.last"), rootCount) : null,
    clearHover: () => setHover(null),
  };
}
