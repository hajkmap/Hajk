import { useState } from "react";

import type {
  LayerTreeGroupNode,
  MapBackgroundLayer,
  MapLayerTree,
} from "../../api/layer-tree";
import {
  keepNodeIds,
  LAYER_TREE_ROOT_ID,
  loadedSignature,
  toFlatNodes,
  type LayerTreeEditorMode,
  type LayerTreeFlatNode,
} from "./layer-tree-model";
import {
  EMPTY_SETTINGS,
  fromMapTreeSettings,
  settingsSignature,
  type LayerTreeSettings,
} from "./layer-tree-settings";

/** The saved state, which tells what a draft changes. */
export interface LayerTreeBaseline {
  nodes: LayerTreeFlatNode[];
  signature: string;
  settings: LayerTreeSettings;
  settingsSignature: string;
  background: MapBackgroundLayer[];
  drawOrder: string[];
}

const EMPTY_BACKGROUND: MapBackgroundLayer[] = [];
const EMPTY_ORDER: string[] = [];

/**
 * The saved tree of a group or a map as the editor's nodes. When it is loaded
 * again, e.g. after saving, its nodes take the ids of the nodes shown until
 * then, so the tree keeps its open groups.
 */
export function useLayerTreeBaseline(
  mode: LayerTreeEditorMode,
  ownerId: string,
  data: LayerTreeGroupNode | MapLayerTree | undefined,
  draftNodes: LayerTreeFlatNode[] | undefined,
): LayerTreeBaseline | null {
  const owner = `${mode}:${ownerId}`;
  const [loaded, setLoaded] = useState<{
    data: LayerTreeGroupNode | MapLayerTree;
    baseline: LayerTreeBaseline;
  } | null>(null);
  const [shown, setShown] = useState<{
    owner: string;
    nodes: LayerTreeFlatNode[];
  } | null>(null);

  if (data && data !== loaded?.data) {
    const nodes = toFlatNodes(data.items, LAYER_TREE_ROOT_ID, mode);
    const settings =
      "settings" in data ? fromMapTreeSettings(data.settings) : EMPTY_SETTINGS;
    setLoaded({
      data,
      baseline: {
        nodes: shown?.owner === owner ? keepNodeIds(nodes, shown.nodes) : nodes,
        signature: loadedSignature(data.items),
        settings,
        settingsSignature: settingsSignature(settings),
        background: "background" in data ? data.background : EMPTY_BACKGROUND,
        drawOrder: "drawOrder" in data ? data.drawOrder : EMPTY_ORDER,
      },
    });
  }

  const baseline = loaded && loaded.data === data ? loaded.baseline : null;
  const nodes = draftNodes ?? baseline?.nodes;
  if (nodes && nodes !== shown?.nodes) {
    setShown({ owner, nodes });
  }
  return baseline;
}
