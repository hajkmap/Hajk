import { useEffect, useMemo, useState } from "react";

import {
  nodePathKeys,
  type LayerTreeEditorMode,
  type LayerTreeFlatNode,
} from "./layer-tree-model";

const EMPTY_IDS: string[] = [];

const storageKey = (ownerKey: string) => `layer-tree-open-${ownerKey}`;

/** The open groups this browser remembers for the tree, as node ids. */
function readRemembered(
  ownerKey: string,
  nodes: LayerTreeFlatNode[],
): string[] | undefined {
  let stored: unknown;
  try {
    stored = JSON.parse(localStorage.getItem(storageKey(ownerKey)) ?? "null");
  } catch {
    return undefined;
  }
  if (!Array.isArray(stored)) return undefined;
  const open = new Set(stored);
  return [...nodePathKeys(nodes)]
    .filter(([, key]) => open.has(key))
    .map(([id]) => id);
}

function writeRemembered(
  ownerKey: string,
  nodes: LayerTreeFlatNode[],
  openIds: string[],
) {
  const keys = nodePathKeys(nodes);
  try {
    localStorage.setItem(
      storageKey(ownerKey),
      JSON.stringify(openIds.flatMap((id) => keys.get(id) ?? [])),
    );
  } catch {
    // Storage may be full or blocked; the tree just won't remember.
  }
}

/**
 * Which groups are open in a group's or a map's tree. Groups start open in
 * group mode and closed in a map; what is opened or closed is remembered per
 * group or map in this browser, so it stays when the tree is saved, when
 * switching tabs and when coming back.
 */
export function useOpenGroups(
  ownerKey: string,
  mode: LayerTreeEditorMode,
  nodes: LayerTreeFlatNode[],
) {
  const expandableIds = useMemo(
    () =>
      nodes
        .filter((node) => nodes.some((child) => child.parent === node.id))
        .map((node) => node.id),
    [nodes],
  );
  const [openState, setOpenState] = useState<{
    key: string | null;
    ids: string[];
  }>({ key: null, ids: [] });
  const remembered = useMemo(
    () => readRemembered(ownerKey, nodes),
    [ownerKey, nodes],
  );
  const openIds =
    openState.key === ownerKey
      ? openState.ids
      : (remembered ?? (mode === "group" ? expandableIds : EMPTY_IDS));

  useEffect(() => {
    if (openState.key === ownerKey) {
      writeRemembered(ownerKey, nodes, openState.ids);
    }
  }, [openState, ownerKey, nodes]);

  const setOpen = (ids: string[]) => setOpenState({ key: ownerKey, ids });
  // Opens `ids` too, keeping what is open now (e.g. where a layer was dropped).
  const openNodes = (ids: string[]) =>
    setOpenState((previous) => ({
      key: ownerKey,
      ids: [
        ...new Set([
          ...(previous.key === ownerKey ? previous.ids : openIds),
          ...ids,
        ]),
      ],
    }));

  return { expandableIds, openIds, setOpen, openNodes };
}
