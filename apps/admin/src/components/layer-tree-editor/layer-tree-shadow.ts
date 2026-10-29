import type { LayerTreeGroupNode, MapLayerTree } from "../../api/layer-tree";
import type { LayerTreeShadow, LayerTreeShadowNode } from "../../api/presence";
import {
  LAYER_TREE_ROOT_ID,
  toFlatNodes,
  type LayerTreeDraft,
  type LayerTreeEditorMode,
  type LayerTreeFlatNode,
  type LayerTreeItemKind,
} from "./layer-tree-model";
import {
  fromMapTreeSettings,
  groupSettingsOf,
  layerSettingsOf,
  toMapTreeSettings,
  type LayerTreeSettings,
} from "./layer-tree-settings";

// The shadow view shows another tab's draft, or a save made after one's own
// draft began, as a tree marked with how it differs from the saved tree one
// has loaded. A node is matched by its kind, its source id and its parent's
// source id, so the content of a moved group keeps its matches and only the
// group shows as moved.

/** What the rows are made from: a draft's tree, or a saved one. */
type ShadowSource = Pick<LayerTreeShadow, "nodes" | "settings">;

export type LayerTreeShadowStatus =
  "new" | "added" | "removed" | "moved" | "hidden" | "shown" | "changed";

export interface LayerTreeShadowRow {
  key: string;
  depth: number;
  kind: LayerTreeItemKind;
  text: string;
  statuses: LayerTreeShadowStatus[];
  /** In the saved tree but not in the draft. */
  removed: boolean;
}

interface ShadowTreeNode {
  /** The node shown: the draft's, or the saved tree's when taken out. */
  source: LayerTreeShadowNode;
  key: string;
  kind: LayerTreeItemKind;
  text: string;
  statuses: LayerTreeShadowStatus[];
  removed: boolean;
  children: ShadowTreeNode[];
}

export function toLayerTreeShadow(draft: LayerTreeDraft): LayerTreeShadow {
  return {
    nodes: draft.nodes.map(({ id, parent, text, data }) => ({
      id,
      parent,
      text,
      kind: data.kind,
      sourceId: data.sourceId,
      ...(data.isNew ? { isNew: true } : {}),
      ...(data.hidden ? { hidden: true } : {}),
    })),
    settings: draft.settings
      ? toMapTreeSettings(draft.settings, draft.nodes)
      : undefined,
    background: draft.background !== undefined,
    drawOrder: draft.drawOrder !== undefined,
  };
}

const fromFlat = ({
  id,
  parent,
  text,
  data,
}: LayerTreeFlatNode): LayerTreeShadowNode => ({
  id,
  parent,
  text,
  kind: data.kind,
  sourceId: data.sourceId,
  isNew: data.isNew,
  hidden: data.hidden,
});

/** A saved tree in the shape of a draft's, to be compared the same way. */
export function savedTreeShadow(
  tree: LayerTreeGroupNode | MapLayerTree,
  mode: LayerTreeEditorMode,
): ShadowSource {
  return {
    nodes: toFlatNodes(tree.items, LAYER_TREE_ROOT_ID, mode).map(fromFlat),
    settings: "settings" in tree ? tree.settings : undefined,
  };
}

/** Object keys sorted, so the same settings give the same text. */
const canonical = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonical)
    : value !== null && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [
              key,
              canonical((value as Record<string, unknown>)[key]),
            ]),
        )
      : value;
const same = (a: unknown, b: unknown) =>
  JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

function indexed(nodes: LayerTreeShadowNode[]) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const children = new Map<string, LayerTreeShadowNode[]>();
  const keyOf = new Map<string, string>();
  for (const node of nodes) {
    const parent = byId.get(node.parent);
    keyOf.set(
      node.id,
      `${node.kind}:${node.sourceId}@${parent?.sourceId ?? LAYER_TREE_ROOT_ID}`,
    );
    const siblings = children.get(node.parent) ?? [];
    siblings.push(node);
    children.set(node.parent, siblings);
  }
  return { byId, children, keyOf };
}

/** The keys of the longest run of `a` that `b` keeps in the same order. */
function longestCommonOrder(a: string[], b: string[]): Set<string> {
  const table = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] =
        a[i] === b[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const kept = new Set<string>();
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      kept.add(a[i]);
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return kept;
}

/**
 * The draft as rows, top first, each marked with how it differs from the saved
 * tree. Items taken out show at their old place. With `onlyChanges` only the
 * marked rows and the groups above them are kept.
 */
export function layerTreeShadowRows(
  saved: { nodes: LayerTreeFlatNode[]; settings?: LayerTreeSettings },
  shadow: ShadowSource,
  onlyChanges: boolean,
): LayerTreeShadowRow[] {
  const savedNodes = saved.nodes.map(fromFlat);
  const before = indexed(savedNodes);
  const after = indexed(shadow.nodes);
  const savedSettings = saved.settings;
  const theirSettings = shadow.settings
    ? fromMapTreeSettings(shadow.settings)
    : undefined;

  const savedByKey = new Map<string, LayerTreeShadowNode>();
  for (const [id, key] of before.keyOf) {
    if (!savedByKey.has(key)) savedByKey.set(key, before.byId.get(id)!);
  }
  const theirKeys = new Set(after.keyOf.values());
  const identity = (node: LayerTreeShadowNode) =>
    `${node.kind}:${node.sourceId}`;
  // Gone from one place and come to another: moved.
  const goneFrom = new Set(
    savedNodes
      .filter((node) => !theirKeys.has(before.keyOf.get(node.id)!))
      .map(identity),
  );
  const cameTo = new Set(
    shadow.nodes
      .filter((node) => !savedByKey.has(after.keyOf.get(node.id)!))
      .map(identity),
  );

  // Reordered among the same siblings: not in their longest common order.
  const reordered = new Set<string>();
  for (const [parentId, children] of after.children) {
    const savedParentId =
      parentId === LAYER_TREE_ROOT_ID
        ? LAYER_TREE_ROOT_ID
        : savedByKey.get(after.keyOf.get(parentId)!)?.id;
    if (savedParentId === undefined) continue;
    const savedOrder = (before.children.get(savedParentId) ?? []).map((node) =>
      before.keyOf.get(node.id)!,
    );
    const theirOrder = children.map((node) => after.keyOf.get(node.id)!);
    const common = new Set(
      savedOrder.filter((key) => theirOrder.includes(key)),
    );
    const kept = longestCommonOrder(
      savedOrder.filter((key) => common.has(key)),
      theirOrder.filter((key) => common.has(key)),
    );
    for (const key of common) {
      if (!kept.has(key)) reordered.add(key);
    }
  }

  const settingsChanged = (
    node: LayerTreeShadowNode,
    parentSource?: string,
  ) => {
    if (!theirSettings || !savedSettings) return false;
    if (node.kind === "group") {
      return !same(
        groupSettingsOf(theirSettings, node.sourceId),
        groupSettingsOf(savedSettings, node.sourceId),
      );
    }
    return (
      parentSource !== undefined &&
      !same(
        layerSettingsOf(theirSettings, parentSource, node.sourceId),
        layerSettingsOf(savedSettings, parentSource, node.sourceId),
      )
    );
  };

  // Their tree. What lies inside a new or added item is new with it; what
  // lies inside a moved group is compared as usual.
  const build = (
    parentId: string,
    parentSource: string | undefined,
    inherited: boolean,
  ): ShadowTreeNode[] =>
    (after.children.get(parentId) ?? []).map((node) => {
      const key = after.keyOf.get(node.id)!;
      const was = savedByKey.get(key);
      const moved = !was && !node.isNew && goneFrom.has(identity(node));
      const statuses: LayerTreeShadowStatus[] = [];
      if (!inherited) {
        if (node.isNew) statuses.push("new");
        else if (!was) statuses.push(moved ? "moved" : "added");
        else {
          if (reordered.has(key)) statuses.push("moved");
          if (node.hidden && !was.hidden) statuses.push("hidden");
          if (!node.hidden && was.hidden) statuses.push("shown");
        }
        if (settingsChanged(node, parentSource)) statuses.push("changed");
      }
      return {
        source: node,
        key: `+${node.id}`,
        kind: node.kind,
        text: node.text,
        statuses,
        removed: false,
        children: build(
          node.id,
          node.sourceId,
          inherited || node.isNew === true || (!was && !moved),
        ),
      };
    });

  const savedSubtree = (
    node: LayerTreeShadowNode,
    top: boolean,
  ): ShadowTreeNode => ({
    source: node,
    key: `-${node.id}`,
    kind: node.kind,
    text: node.text,
    statuses: top ? ["removed"] : [],
    removed: true,
    children: (before.children.get(node.id) ?? []).map((child) =>
      savedSubtree(child, false),
    ),
  });

  const tree = build(LAYER_TREE_ROOT_ID, undefined, false);
  const shownByKey = new Map<string, ShadowTreeNode>();
  const shownByIdentity = new Map<string, ShadowTreeNode>();
  const register = (nodes: ShadowTreeNode[]) => {
    for (const node of nodes) {
      shownByKey.set(after.keyOf.get(node.source.id)!, node);
      if (!shownByIdentity.has(identity(node.source))) {
        shownByIdentity.set(identity(node.source), node);
      }
      register(node.children);
    }
  };
  register(tree);

  // Taken out (not moved): shown at the old place, under the same parent.
  for (const node of savedNodes) {
    const key = before.keyOf.get(node.id)!;
    if (theirKeys.has(key) || cameTo.has(identity(node))) continue;
    const parent = before.byId.get(node.parent);
    if (parent && !theirKeys.has(before.keyOf.get(parent.id)!)) {
      // Its parent is taken out or moved too; it shows with it, or not at all.
      if (!cameTo.has(identity(parent))) continue;
    }
    const siblings = parent
      ? (
          shownByKey.get(before.keyOf.get(parent.id)!) ??
          shownByIdentity.get(identity(parent))
        )?.children
      : tree;
    if (!siblings) continue;
    const index = (before.children.get(node.parent) ?? []).indexOf(node);
    siblings.splice(
      Math.min(index, siblings.length),
      0,
      savedSubtree(node, true),
    );
  }

  const rows: LayerTreeShadowRow[] = [];
  const hasChange = (node: ShadowTreeNode): boolean =>
    node.statuses.length > 0 || node.children.some(hasChange);
  const flatten = (nodes: ShadowTreeNode[], depth: number) => {
    for (const node of nodes) {
      if (onlyChanges && !hasChange(node)) continue;
      rows.push({
        key: node.key,
        depth,
        kind: node.kind,
        text: node.text,
        statuses: node.statuses,
        removed: node.removed,
      });
      flatten(node.children, depth + 1);
    }
  };
  flatten(tree, 0);
  return rows;
}
