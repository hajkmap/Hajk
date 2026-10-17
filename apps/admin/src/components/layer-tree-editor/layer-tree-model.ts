import type {
  GroupNestedPlacement,
  LayerTreeNode,
  LayerTreeUsage,
  LayerTreeWriteNode,
  MapBackgroundLayer,
  MapGroupException,
} from "../../api/layer-tree";
import type { LayerTreeSettings } from "./layer-tree-settings";

// POC (layer trees): the editor works on a flat node list, as
// @minoru/react-dnd-treeview wants it. Siblings keep their order from the
// array (the tree runs with sort={false}).

export const LAYER_TREE_ROOT_ID = "root";

/** Drag type of catalog rows; the tree accepts it next to its own nodes. */
export const LAYER_TREE_CATALOG_DRAG_TYPE = "LAYER_TREE_CATALOG_ITEM";

/**
 * "group": edit a group's content. The groups in it are linked, so their own
 * content is locked and edited on each group; only groups made in the editor
 * are filled here, until they are saved.
 * "map": place groups on a map's top level. Their content is locked, but the
 * map can add layers to them and hide their items, on this map only.
 */
export type LayerTreeEditorMode = "group" | "map";

export type LayerTreeItemKind = "group" | "layer";

export interface LayerTreeNodeData {
  kind: LayerTreeItemKind;
  sourceId: string;
  usedIn?: LayerTreeUsage;
  /** The group is already on the path above, so its content isn't shown. */
  cycle?: boolean;
  /** Made in the editor; the group is created when the page is saved. */
  isNew?: boolean;
  /** Map mode: a layer or group put in its group on this map only. */
  added?: boolean;
  /**
   * Put in its linked group by the tree of this group (its id, or a new
   * group's temporary id), not by the group itself.
   */
  placedBy?: string;
  /** Map mode: one of a group's own items, hidden on this map. */
  hidden?: boolean;
}

export interface LayerTreeFlatNode {
  id: string;
  parent: string;
  text: string;
  droppable: boolean;
  data: LayerTreeNodeData;
}

export interface LayerTreeCatalogItem {
  kind: LayerTreeItemKind;
  id: string;
  name: string;
}

/**
 * Unsaved edits. Kept by the page, which saves them with its own save button
 * and keeps them across tab switches. In map mode `settings`, `background`
 * and `drawOrder` are only set once they have been changed.
 */
export interface LayerTreeDraft {
  mode: LayerTreeEditorMode;
  /** The group's id in group mode, the map's name in map mode. */
  ownerId: string;
  nodes: LayerTreeFlatNode[];
  /** The map's settings for the groups and layers in its tree. */
  settings?: LayerTreeSettings;
  background?: MapBackgroundLayer[];
  /** Layer ids, top first. */
  drawOrder?: string[];
}

export type LayerTreePlaceProblem =
  "notHere" | "duplicate" | "cycle" | "layerInMap";

export const isLayerTreeDraftFor = (
  draft: LayerTreeDraft | null,
  mode: LayerTreeEditorMode,
  ownerId: string | undefined,
): draft is LayerTreeDraft =>
  draft !== null && draft.mode === mode && draft.ownerId === ownerId;

let lastNodeId = 0;
const newNodeId = () => `n${++lastNodeId}`;

const isGroup = (node: LayerTreeFlatNode) => node.data.kind === "group";

/** A group made in the editor. Its temporary id is replaced on save. */
export function createNewGroupNode(
  name: string,
  parent: string,
): LayerTreeFlatNode {
  const id = newNodeId();
  return {
    id,
    parent,
    text: name,
    droppable: true,
    data: { kind: "group", sourceId: `new:${id}`, isNew: true },
  };
}

/** A layer added to a group on this map only. */
export function createAddedLayerNode(
  layer: { id: string; name: string },
  parent: string,
): LayerTreeFlatNode {
  return {
    id: newNodeId(),
    parent,
    text: layer.name,
    droppable: false,
    data: { kind: "layer", sourceId: layer.id, added: true },
  };
}

/**
 * Map mode: a group the map puts in another group is the map's own addition
 * there; on the top level it is a plain placement. Layers always lie in groups.
 */
export function asPlacedInMap(node: LayerTreeFlatNode): LayerTreeFlatNode {
  const added = node.parent !== LAYER_TREE_ROOT_ID;
  return Boolean(node.data.added) === added
    ? node
    : { ...node, data: { ...node.data, added: added || undefined } };
}

/**
 * Group mode: what lies in a linked group belongs to the tree of the nearest
 * group above that is edited here (a new group, else the group itself), as
 * `placedBy`. What lies on the top level or in a new group is plain content.
 */
export function asPlacedInGroup(
  node: LayerTreeFlatNode,
  nodes: LayerTreeFlatNode[],
  rootGroupId: string,
): LayerTreeFlatNode {
  const byId = new Map(nodes.map((other) => [other.id, other]));
  const parent = byId.get(node.parent);
  let placedBy: string | undefined;
  if (parent && !parent.data.isNew) {
    placedBy = rootGroupId;
    for (
      let above: LayerTreeFlatNode | undefined = parent;
      above;
      above = byId.get(above.parent)
    ) {
      if (above.data.isNew) {
        placedBy = above.data.sourceId;
        break;
      }
    }
  }
  return node.data.placedBy === placedBy
    ? node
    : { ...node, data: { ...node.data, placedBy } };
}

/** The node as placed where it now lies, in either mode. */
export function asPlaced(
  node: LayerTreeFlatNode,
  nodes: LayerTreeFlatNode[],
  mode: LayerTreeEditorMode,
  rootGroupId?: string,
): LayerTreeFlatNode {
  return mode === "map"
    ? asPlacedInMap(node)
    : asPlacedInGroup(node, nodes, rootGroupId ?? "");
}

/** Whether a placement belongs to the tree edited here. */
export const placedHere = (
  placedBy: string | undefined,
  rootGroupId?: string,
) =>
  placedBy !== undefined &&
  (placedBy === rootGroupId || placedBy.startsWith("new:"));

/**
 * For what isn't edited here: the group it comes from. A linked group's own
 * item comes from that group; a placement from the group that made it.
 */
export function placedFrom(
  node: LayerTreeFlatNode,
  nodes: LayerTreeFlatNode[],
): string | undefined {
  const byId = new Map(nodes.map((other) => [other.id, other]));
  const { placedBy } = node.data;
  if (!placedBy) return byId.get(node.parent)?.text;
  for (
    let above = byId.get(node.parent);
    above;
    above = byId.get(above.parent)
  ) {
    if (above.data.sourceId === placedBy) return above.text;
  }
  return undefined;
}

export function buildChildren(
  nodes: LayerTreeFlatNode[],
): Map<string, LayerTreeFlatNode[]> {
  const children = new Map<string, LayerTreeFlatNode[]>();
  for (const node of nodes) {
    const list = children.get(node.parent) ?? [];
    list.push(node);
    children.set(node.parent, list);
  }
  return children;
}

/** Flattens loaded nodes depth first, giving each placement its own id. */
export function toFlatNodes(
  items: LayerTreeNode[],
  parent: string,
  mode: LayerTreeEditorMode,
  out: LayerTreeFlatNode[] = [],
): LayerTreeFlatNode[] {
  for (const item of items) {
    const id = newNodeId();
    if (item.type === "layer") {
      out.push({
        id,
        parent,
        text: item.name,
        droppable: false,
        data: {
          kind: "layer",
          sourceId: item.id,
          added: item.added,
          placedBy: item.placedBy,
          hidden: item.hidden,
        },
      });
      continue;
    }
    out.push({
      id,
      parent,
      text: item.name,
      // A linked group's content is edited on the group itself, but the tree
      // edited here can put things in it; in a map not when it is hidden.
      droppable: !item.cycle && !(mode === "map" && item.hidden),
      data: {
        kind: "group",
        sourceId: item.id,
        usedIn: item.usedIn,
        cycle: item.cycle,
        added: item.added,
        placedBy: item.placedBy,
        hidden: item.hidden,
      },
    });
    toFlatNodes(item.items, id, mode, out);
  }
  return out;
}

/**
 * Gives the nodes of a tree loaded again the ids of the nodes shown until
 * then, matched place by place, so the open groups stay open (e.g. after
 * saving). A group made in the editor matches its saved group by name.
 */
export function keepNodeIds(
  loaded: LayerTreeFlatNode[],
  shown: LayerTreeFlatNode[],
): LayerTreeFlatNode[] {
  const shownChildren = buildChildren(shown);
  const taken = new Set<string>();
  const ids = new Map<string, string>();
  return loaded.map((node) => {
    const parent = ids.get(node.parent) ?? node.parent;
    const candidates = (shownChildren.get(parent) ?? []).filter(
      (other) => !taken.has(other.id) && other.data.kind === node.data.kind,
    );
    const match =
      candidates.find((other) => other.data.sourceId === node.data.sourceId) ??
      candidates.find((other) => other.data.isNew && other.text === node.text);
    const id = match?.id ?? node.id;
    if (match) taken.add(id);
    ids.set(node.id, id);
    return { ...node, id, parent };
  });
}

// The two signatures below must give the same text for the same content.
// Added items are marked "+", hidden ones "-", placements with their owner.

const mark = (flags: {
  added?: boolean;
  hidden?: boolean;
  placedBy?: string;
}) =>
  `${flags.added ? "+" : ""}${flags.hidden ? "-" : ""}${flags.placedBy ? `@${flags.placedBy}:` : ""}`;

/** Signature of loaded content. */
export function loadedSignature(items: LayerTreeNode[]): string {
  return items
    .map((item) =>
      item.type === "layer"
        ? `${mark(item)}l:${item.id}`
        : item.cycle
          ? `${mark(item)}g:${item.id}`
          : `${mark(item)}g:${item.id}[${loadedSignature(item.items)}]`,
    )
    .join(",");
}

/** Signature of the content under `parentId` in the flat list. */
export function contentSignature(
  nodes: LayerTreeFlatNode[],
  parentId: string = LAYER_TREE_ROOT_ID,
  children = buildChildren(nodes),
): string {
  return (children.get(parentId) ?? [])
    .map(({ id, data }) =>
      data.kind === "layer"
        ? `${mark(data)}l:${data.sourceId}`
        : data.cycle
          ? `${mark(data)}g:${data.sourceId}`
          : `${mark(data)}g:${data.sourceId}[${contentSignature(nodes, id, children)}]`,
    )
    .join(",");
}

/**
 * What to save. Groups are only linked; their content is edited on each
 * group. A group made in the editor is sent with its name and content, to be
 * created. A map's tree only links groups (see toMapExceptions).
 */
export function toWriteNodes(
  nodes: LayerTreeFlatNode[],
  parentId: string = LAYER_TREE_ROOT_ID,
): LayerTreeWriteNode[] {
  const children = buildChildren(nodes);
  const write = (id: string): LayerTreeWriteNode[] =>
    (children.get(id) ?? []).map((node) => {
      if (node.data.kind === "layer") {
        return { type: "layer", id: node.data.sourceId };
      }
      return node.data.isNew
        ? {
            type: "group",
            id: node.data.sourceId,
            new: true,
            name: node.text,
            items: write(node.id),
          }
        : { type: "group", id: node.data.sourceId };
    });
  return write(parentId);
}

/**
 * Map mode: the map's exceptions to its groups. An added layer remembers what
 * it comes after, so it keeps its place when the group changes.
 */
export function toMapExceptions(
  nodes: LayerTreeFlatNode[],
): MapGroupException[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const exceptions: MapGroupException[] = [];
  for (const [parentId, siblings] of buildChildren(nodes)) {
    const parent = byId.get(parentId);
    if (!parent || !isGroup(parent)) continue;
    siblings.forEach((node, index) => {
      const { kind, sourceId, added, hidden } = node.data;
      if (added) {
        const previous = siblings[index - 1];
        exceptions.push({
          groupId: parent.data.sourceId,
          kind: "add",
          type: kind,
          id: sourceId,
          after: previous
            ? { type: previous.data.kind, id: previous.data.sourceId }
            : null,
        });
      } else if (hidden) {
        exceptions.push({
          groupId: parent.data.sourceId,
          kind: "hide",
          type: kind,
          id: sourceId,
        });
      }
    });
  }
  return exceptions;
}

/**
 * Whether a node can be moved or removed: what lies on the top level, in a
 * group made in the editor, what this tree put in a linked group or, in a
 * map, what the map added. The rest is a linked group's own content, edited
 * on that group.
 */
export function isMovable(
  node: LayerTreeFlatNode,
  parent: LayerTreeFlatNode | undefined,
  mode: LayerTreeEditorMode,
  rootGroupId?: string,
): boolean {
  if (node.parent === LAYER_TREE_ROOT_ID) return true;
  return mode === "map"
    ? Boolean(node.data.added)
    : Boolean(parent?.data.isNew) ||
        placedHere(node.data.placedBy, rootGroupId);
}

/**
 * Group mode: what the tree edited here puts in the linked groups, in tree
 * order. Each remembers what it comes after, so it keeps its place when the
 * group changes.
 */
export function toGroupNested(
  nodes: LayerTreeFlatNode[],
  rootGroupId: string,
): GroupNestedPlacement[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const nested: GroupNestedPlacement[] = [];
  for (const [parentId, siblings] of buildChildren(nodes)) {
    const parent = byId.get(parentId);
    if (!parent || !isGroup(parent)) continue;
    siblings.forEach((node, index) => {
      const { kind, sourceId, placedBy } = node.data;
      if (!placedBy || !placedHere(placedBy, rootGroupId)) return;
      const previous = siblings[index - 1];
      nested.push({
        ownerId: placedBy,
        groupId: parent.data.sourceId,
        type: kind,
        id: sourceId,
        after: previous
          ? { type: previous.data.kind, id: previous.data.sourceId }
          : null,
        // A group made here is created with its placement.
        ...(node.data.isNew
          ? { new: true, name: node.text, items: toWriteNodes(nodes, node.id) }
          : {}),
      });
    });
  }
  return nested;
}

/** Map mode: hides one of a group's own items on the map, or shows it again. */
export function toggleHidden(
  nodes: LayerTreeFlatNode[],
  nodeId: string,
): LayerTreeFlatNode[] {
  return nodes.map((node) => {
    if (node.id !== nodeId) return node;
    const hidden = !node.data.hidden;
    return {
      ...node,
      // A hidden group takes no additions.
      droppable: isGroup(node) && !node.data.cycle && !hidden,
      data: { ...node.data, hidden },
    };
  });
}

export function descendantIds(
  nodes: LayerTreeFlatNode[],
  nodeId: string,
): Set<string> {
  const children = buildChildren(nodes);
  const found = new Set<string>();
  const queue = [nodeId];
  for (let next = queue.pop(); next !== undefined; next = queue.pop()) {
    for (const child of children.get(next) ?? []) {
      found.add(child.id);
      queue.push(child.id);
    }
  }
  return found;
}

/** Inserts a subtree (root first) under `parentId`, before sibling `index`. */
export function insertNodes(
  nodes: LayerTreeFlatNode[],
  subtree: LayerTreeFlatNode[],
  parentId: string,
  index?: number,
): LayerTreeFlatNode[] {
  const [root, ...rest] = subtree;
  const siblings = nodes.filter((node) => node.parent === parentId);
  const before = index === undefined ? undefined : siblings[index];
  const at = before ? nodes.indexOf(before) : nodes.length;
  return [
    ...nodes.slice(0, at),
    { ...root, parent: parentId },
    ...rest,
    ...nodes.slice(at),
  ];
}

export function removeNode(
  nodes: LayerTreeFlatNode[],
  nodeId: string,
): LayerTreeFlatNode[] {
  const gone = descendantIds(nodes, nodeId).add(nodeId);
  return nodes.filter((node) => !gone.has(node.id));
}

/**
 * Moves a node, with what lies under it, under `parentId` before sibling
 * `index` (counted as the siblings show now, the node itself included).
 */
export function moveNodeTo(
  nodes: LayerTreeFlatNode[],
  nodeId: string,
  parentId: string,
  index?: number,
): LayerTreeFlatNode[] {
  const root = nodes.find((node) => node.id === nodeId);
  if (!root) return nodes;
  const inside = descendantIds(nodes, nodeId);
  const rest = nodes.filter((node) => inside.has(node.id));
  const remaining = nodes.filter(
    (node) => node.id !== nodeId && !inside.has(node.id),
  );
  let at = index;
  if (at !== undefined && root.parent === parentId) {
    // Once taken out, the siblings after it move up one.
    const was = nodes
      .filter((node) => node.parent === parentId)
      .findIndex((node) => node.id === nodeId);
    if (was < at) at -= 1;
  }
  return insertNodes(remaining, [root, ...rest], parentId, at);
}

/** Layers shown inside each group node, nested groups included. */
export function countLayers(nodes: LayerTreeFlatNode[]): Map<string, number> {
  const children = buildChildren(nodes);
  const counts = new Map<string, number>();
  const count = (nodeId: string): number => {
    let total = 0;
    for (const child of children.get(nodeId) ?? []) {
      if (child.data.hidden) continue;
      total += isGroup(child) ? count(child.id) : 1;
    }
    counts.set(nodeId, total);
    return total;
  };
  count(LAYER_TREE_ROOT_ID);
  return counts;
}

/**
 * A key per node that stays the same when the tree is loaded again: the path
 * of kinds and source ids from the top.
 */
export function nodePathKeys(nodes: LayerTreeFlatNode[]): Map<string, string> {
  const children = buildChildren(nodes);
  const keys = new Map<string, string>();
  const walk = (parentId: string, prefix: string) => {
    for (const node of children.get(parentId) ?? []) {
      const key = `${prefix}/${node.data.kind}:${node.data.sourceId}`;
      keys.set(node.id, key);
      walk(node.id, key);
    }
  };
  walk(LAYER_TREE_ROOT_ID, "");
  return keys;
}

/**
 * Map mode: what lies under a hidden group is hidden with it. By node id, the
 * name of the nearest hidden group above.
 */
export function hiddenGroupsAbove(
  nodes: LayerTreeFlatNode[],
): Map<string, string> {
  const children = buildChildren(nodes);
  const hiddenWith = new Map<string, string>();
  const walk = (parentId: string, hiddenGroup?: string) => {
    for (const node of children.get(parentId) ?? []) {
      if (hiddenGroup) hiddenWith.set(node.id, hiddenGroup);
      walk(node.id, hiddenGroup ?? (node.data.hidden ? node.text : undefined));
    }
  };
  walk(LAYER_TREE_ROOT_ID);
  return hiddenWith;
}

/** Map mode: layers shown on the map (hidden ones left out), each once. */
export function shownLayers(
  nodes: LayerTreeFlatNode[],
): { id: string; name: string }[] {
  const children = buildChildren(nodes);
  const layers = new Map<string, string>();
  const walk = (parentId: string) => {
    for (const node of children.get(parentId) ?? []) {
      if (node.data.hidden) continue;
      if (isGroup(node)) walk(node.id);
      else if (!layers.has(node.data.sourceId)) {
        layers.set(node.data.sourceId, node.text);
      }
    }
  };
  walk(LAYER_TREE_ROOT_ID);
  return [...layers].map(([id, name]) => ({ id, name }));
}

/**
 * Which part of a row a click lands on: its upper edge puts what is held
 * before the row, its middle into the group, its lower edge after the row.
 */
export type LayerTreeClickPart = "before" | "into" | "after";

/** Where click and place puts what is held. */
export interface LayerTreeClickDestination {
  parentId: string;
  /** Before this sibling. */
  index: number;
  part: LayerTreeClickPart;
}

/**
 * Click and place: before or after the row clicked, or first in the group
 * clicked (a group that takes nothing gets it after it instead).
 */
export function clickDestination(
  nodes: LayerTreeFlatNode[],
  targetId: string,
  part: LayerTreeClickPart,
): LayerTreeClickDestination | null {
  const target = nodes.find((node) => node.id === targetId);
  if (!target) return null;
  if (part === "into" && isGroup(target) && target.droppable) {
    return { parentId: target.id, index: 0, part };
  }
  const siblings = nodes.filter((node) => node.parent === target.parent);
  const index = siblings.findIndex((node) => node.id === target.id);
  return part === "before"
    ? { parentId: target.parent, index, part }
    : { parentId: target.parent, index: index + 1, part: "after" };
}

/** The picked nodes, less those inside another picked one (they move with it). */
export function selectionRoots(
  nodes: LayerTreeFlatNode[],
  ids: string[],
): string[] {
  const picked = new Set(ids);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return ids.filter((id) => {
    for (
      let above = byId.get(byId.get(id)?.parent ?? "");
      above;
      above = byId.get(above.parent)
    ) {
      if (picked.has(above.id)) return false;
    }
    return byId.has(id);
  });
}

/**
 * The draw order as shown: the shown layers in the saved order, those not in
 * it yet on top, and removed ones left out.
 */
export function completeDrawOrder(
  layers: { id: string }[],
  order: string[],
): string[] {
  const shown = new Set(layers.map((layer) => layer.id));
  const known = order.filter((id) => shown.has(id));
  const placed = new Set(known);
  return [
    ...layers.map((layer) => layer.id).filter((id) => !placed.has(id)),
    ...known,
  ];
}

/** Group ids from `parentId` up to the top, plus the edited group. */
function groupIdsAbove(
  nodes: LayerTreeFlatNode[],
  parentId: string,
  rootGroupId?: string,
): Set<string> {
  const ids = new Set<string>(rootGroupId ? [rootGroupId] : []);
  let current = nodes.find((node) => node.id === parentId);
  while (current) {
    ids.add(current.data.sourceId);
    const parent = current.parent;
    current = nodes.find((node) => node.id === parent);
  }
  return ids;
}

export interface LayerTreePlacement {
  nodes: LayerTreeFlatNode[];
  mode: LayerTreeEditorMode;
  /** The group being edited, in group mode. */
  rootGroupId?: string;
  parentId: string;
  kind: LayerTreeItemKind;
  sourceId: string;
  /** Every group id inside the placed group, itself included, when known. */
  groupIds?: string[];
  /** Set when a node already in the tree is moved. */
  movingId?: string;
}

/** Why an item can't go under `parentId`, or null when it can. */
export function placeProblem({
  nodes,
  mode,
  rootGroupId,
  parentId,
  kind,
  sourceId,
  groupIds,
  movingId,
}: LayerTreePlacement): LayerTreePlaceProblem | null {
  // In a map, layers go in a group: the client only shows layers inside
  // groups. What the map puts in a group is its own, on this map only.
  if (mode === "map" && kind === "layer" && parentId === LAYER_TREE_ROOT_ID) {
    return "layerInMap";
  }
  if (parentId !== LAYER_TREE_ROOT_ID) {
    const parent = nodes.find((node) => node.id === parentId);
    // Nothing goes in a hidden group, or in a group inside one.
    if (!parent?.droppable || hiddenGroupsAbove(nodes).has(parentId)) {
      return "notHere";
    }
  }

  const moving = movingId ? descendantIds(nodes, movingId) : null;
  if (movingId && (parentId === movingId || moving?.has(parentId))) {
    return "notHere";
  }

  const duplicate = nodes.some(
    (node) =>
      node.parent === parentId &&
      node.id !== movingId &&
      node.data.kind === kind &&
      node.data.sourceId === sourceId,
  );
  if (duplicate) {
    return "duplicate";
  }

  if (kind === "group") {
    const above = groupIdsAbove(nodes, parentId, rootGroupId);
    const inside =
      groupIds ??
      (movingId
        ? nodes
            .filter(
              (node) =>
                isGroup(node) &&
                (node.id === movingId || Boolean(moving?.has(node.id))),
            )
            .map((node) => node.data.sourceId)
        : [sourceId]);
    if (inside.some((id) => above.has(id))) {
      return "cycle";
    }
  }

  return null;
}
