import {
  Tree,
  type DropOptions,
  type NodeModel,
} from "@minoru/react-dnd-treeview";
import { Alert, Box, Paper, Typography, useTheme } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

import { getGroupTree } from "../../api/layer-tree";
import LayerTreeCatalog from "./layer-tree-catalog";
import LayerTreeCatalogColumn from "./layer-tree-catalog-column";
import LayerTreeEditorWindow from "./layer-tree-editor-window";
import { EDITOR_COLUMN } from "./layer-tree-layout";
import {
  asPlaced,
  countLayers,
  createNewGroupNode,
  descendantIds,
  hiddenGroupsAbove,
  insertNodes,
  isMovable,
  LAYER_TREE_CATALOG_DRAG_TYPE,
  LAYER_TREE_ROOT_ID,
  moveNodeTo,
  placedFrom,
  placedHere,
  placeProblem,
  removeNode,
  toFlatNodes,
  toggleHidden,
  type LayerTreeCatalogItem,
  type LayerTreeEditorMode,
  type LayerTreeFlatNode,
  type LayerTreeNodeData,
  type LayerTreePlaceProblem,
} from "./layer-tree-model";
import {
  MOVE_ZONE_DRAG_TYPE,
  type LayerTreeMoveZoneItem,
} from "./layer-tree-move-zone";
import LayerTreeNewGroupDialog from "./layer-tree-new-group-dialog";
import LayerTreeRow from "./layer-tree-row";
import type { LayerTreeSettings } from "./layer-tree-settings";
import LayerTreeToolbar from "./layer-tree-toolbar";
import { useItemDetails, type LayerTreeItemDetails } from "./use-item-details";
import type { LayerTreeHistoryControls } from "./use-draft-history";
import { useOpenGroups } from "./use-open-groups";
import {
  useTreeClickPlace,
  type PanelClickPlace,
} from "./use-tree-click-place";
import { useTreeSettingsUi } from "./use-tree-settings-ui";

interface LayerTreePanelProps {
  mode: LayerTreeEditorMode;
  /** The group being edited, in group mode. */
  rootGroupId?: string;
  /** Group mode: the name of the group being edited. */
  rootGroupName?: string;
  nodes: LayerTreeFlatNode[];
  /** The group or map shown; another one starts with the default open groups. */
  ownerKey: string;
  isSaving: boolean;
  onChange: (nodes: LayerTreeFlatNode[]) => void;
  /** Map mode: the map's settings for the groups and layers in its tree. */
  settings?: LayerTreeSettings;
  onSettingsChange: (settings: LayerTreeSettings) => void;
  /** Wraps the tree and its toolbar, e.g. framed as the client's layerswitcher. */
  frame?: (tree: ReactNode, toolbar: ReactNode) => ReactNode;
  /** As the client: no search where its layerswitcher has no filter. */
  showSearch?: boolean;
  /** Map mode: the move zone, whose items the tree takes. */
  moveZone?: {
    /** Nodes flagged as in the zone. */
    flagged: ReadonlySet<string>;
    /** An item was dropped from the zone where it goes. */
    onPlaced: (key: string) => void;
  };
  /** Map mode: click and place, instead of dragging, when it is on. */
  clickPlace?: PanelClickPlace;
  /** Undo and redo, shown in the toolbar. */
  history?: LayerTreeHistoryControls;
}

/** The catalog and the tree, for a group or a map. */
export default function LayerTreePanel({
  mode,
  rootGroupId,
  rootGroupName,
  nodes,
  ownerKey,
  isSaving,
  onChange,
  settings,
  onSettingsChange,
  frame,
  showSearch = true,
  moveZone,
  clickPlace,
  history,
}: LayerTreePanelProps) {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const getDetails = useItemDetails();
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // The "new group" dialog. The group goes last on the top level, and from
  // there wherever it is dragged.
  const [newGroupOpen, setNewGroupOpen] = useState(false);

  // Inserting a catalog group waits for its content, so it reads the nodes
  // as they are when the content arrives.
  const nodesRef = useRef(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const { expandableIds, openIds, setOpen, openNodes } = useOpenGroups(
    ownerKey,
    mode,
    nodes,
  );
  const allExpanded =
    expandableIds.length > 0 &&
    expandableIds.every((id) => openIds.includes(id));

  // Searching shows the matches and the groups they are in, opened. Dragging
  // is off meanwhile, as hidden rows would throw off the drop positions.
  const term = search.trim().toLowerCase();
  const found = useMemo(() => {
    if (!term) return null;
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const visible = new Set<string>();
    const ancestors = new Set<string>();
    for (const node of nodes) {
      if (!node.text.toLowerCase().includes(term)) continue;
      visible.add(node.id);
      for (
        let parent = byId.get(node.parent);
        parent;
        parent = byId.get(parent.parent)
      ) {
        visible.add(parent.id);
        ancestors.add(parent.id);
      }
    }
    return { visible, ancestors: [...ancestors] };
  }, [nodes, term]);
  const shownOpenIds = useMemo(
    () => (found ? [...new Set([...openIds, ...found.ancestors])] : openIds),
    [found, openIds],
  );
  const canEdit = !isSaving && !found;

  const layerCounts = useMemo(() => countLayers(nodes), [nodes]);
  const topLevelKeys = useMemo(
    () =>
      new Set(
        nodes
          .filter((node) => node.parent === LAYER_TREE_ROOT_ID)
          .map((node) => `${node.data.kind}:${node.data.sourceId}`),
      ),
    [nodes],
  );

  const commit = (next: LayerTreeFlatNode[]) => {
    nodesRef.current = next;
    setError(null);
    onChange(next);
  };

  const warn = (problem: LayerTreePlaceProblem, name: string) =>
    toast.warning(t(`layerTree.problem.${problem}`, { name }), {
      position: "bottom-left",
      theme: palette.mode,
      hideProgressBar: true,
    });

  /** Puts a catalog item in the tree; whether it could be placed there. */
  const insertItem = async (
    item: LayerTreeCatalogItem,
    parentId: string,
    index?: number,
  ): Promise<boolean> => {
    let subtree: LayerTreeFlatNode[];
    if (item.kind === "layer") {
      // In a map, a layer dropped in a linked group is an addition on this
      // map; in a group, this tree's own there. In a new group it is content.
      subtree = toFlatNodes(
        [{ type: "layer", id: item.id, name: item.name }],
        parentId,
        mode,
      ).map((node) => asPlaced(node, nodesRef.current, mode, rootGroupId));
    } else {
      try {
        const group = await queryClient.fetchQuery({
          queryKey: ["layerTree", "group", item.id],
          queryFn: () => getGroupTree(item.id),
        });
        const [root, ...content] = toFlatNodes([group], parentId, mode);
        // Dropped in a group, it is the map's or this tree's own there.
        subtree = [
          asPlaced(root, nodesRef.current, mode, rootGroupId),
          ...content,
        ];
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : t("layerTree.loadFailed"),
        );
        return false;
      }
    }

    const current = nodesRef.current;
    const problem = placeProblem({
      nodes: current,
      mode,
      rootGroupId,
      parentId,
      kind: item.kind,
      sourceId: item.id,
      groupIds: subtree
        .filter((node) => node.data.kind === "group")
        .map((node) => node.data.sourceId),
    });
    if (problem) {
      warn(problem, item.name);
      return false;
    }

    commit(insertNodes(current, subtree, parentId, index));
    // Show what came with a dropped group, and where a layer was added.
    openNodes([
      ...(parentId === LAYER_TREE_ROOT_ID ? [] : [parentId]),
      ...subtree
        .filter(
          (node) =>
            mode === "group" &&
            node.data.kind === "group" &&
            subtree.some((child) => child.parent === node.id),
        )
        .map((node) => node.id),
    ]);
    return true;
  };

  const addNewGroup = (name: string) => {
    setNewGroupOpen(false);
    commit(
      insertNodes(
        nodesRef.current,
        [createNewGroupNode(name, LAYER_TREE_ROOT_ID)],
        LAYER_TREE_ROOT_ID,
      ),
    );
  };

  // Linked groups' own content is locked; it is edited on each group. What
  // this tree (or map) put in them is its own.
  const byId = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );
  const movable = (node: LayerTreeFlatNode) =>
    isMovable(node, byId.get(node.parent), mode, rootGroupId);
  // In a map, everything under a hidden group is hidden with it.
  const hiddenWith = useMemo(() => hiddenGroupsAbove(nodes), [nodes]);
  const { rowSettings, dialog: settingsDialog } = useTreeSettingsUi({
    settings,
    onChange: onSettingsChange,
    nodes,
    disabled: isSaving,
  });
  const click = useTreeClickPlace({
    clickPlace: canEdit ? clickPlace : undefined,
    nodes,
    mode,
    rootGroupId,
    movable,
    insertItem,
    commit,
    openNodes,
    warn,
  });

  /** Moves a node with its content and places it anew where it now lies. */
  const moveTo = (nodeId: string, parentId: string, index?: number) => {
    const own = new Set(
      [nodeId, ...descendantIds(nodes, nodeId)].filter((id) => {
        const node = byId.get(id);
        return node !== undefined && movable(node);
      }),
    );
    const next = moveNodeTo(nodes, nodeId, parentId, index);
    commit(
      next.map((node) =>
        own.has(node.id) ? asPlaced(node, next, mode, rootGroupId) : node,
      ),
    );
    if (parentId !== LAYER_TREE_ROOT_ID) openNodes([parentId]);
  };

  const canDrop = (
    _tree: NodeModel<LayerTreeNodeData>[],
    options: DropOptions<LayerTreeNodeData>,
  ) => {
    if (!canEdit) return false;
    const parentId = String(options.dropTargetId);
    if (options.monitor.getItemType() === MOVE_ZONE_DRAG_TYPE) {
      const item = options.monitor.getItem() as LayerTreeMoveZoneItem;
      if (item.inList) return false;
      // Flagged in the tree: it moves from where it lies.
      const moving = item.nodeId ? byId.get(item.nodeId) : undefined;
      if (item.nodeId && !(moving && movable(moving))) return false;
      return (
        placeProblem({
          nodes,
          mode,
          rootGroupId,
          parentId,
          kind: item.kind,
          sourceId: item.sourceId,
          movingId: moving?.id,
        }) === null
      );
    }
    if (options.monitor.getItemType() === LAYER_TREE_CATALOG_DRAG_TYPE) {
      const item = options.monitor.getItem() as LayerTreeCatalogItem;
      return (
        placeProblem({
          nodes,
          mode,
          rootGroupId,
          parentId,
          kind: item.kind,
          sourceId: item.id,
        }) === null
      );
    }
    const moving = nodes.find((node) => node.id === options.dragSourceId);
    return (
      moving !== undefined &&
      movable(moving) &&
      placeProblem({
        nodes,
        mode,
        rootGroupId,
        parentId,
        kind: moving.data.kind,
        sourceId: moving.data.sourceId,
        movingId: moving.id,
      }) === null
    );
  };

  const handleDrop = (
    newTree: NodeModel<LayerTreeNodeData>[],
    options: DropOptions<LayerTreeNodeData>,
  ) => {
    if (options.monitor.getItemType() === MOVE_ZONE_DRAG_TYPE) {
      const item = options.monitor.getItem() as LayerTreeMoveZoneItem;
      const parentId = String(options.dropTargetId);
      if (item.nodeId) {
        moveTo(item.nodeId, parentId, options.relativeIndex);
        moveZone?.onPlaced(item.key);
      } else {
        void insertItem(
          { kind: item.kind, id: item.sourceId, name: item.name },
          parentId,
          options.relativeIndex,
        ).then((inserted) => {
          if (inserted) moveZone?.onPlaced(item.key);
        });
      }
      return;
    }
    if (options.monitor.getItemType() === LAYER_TREE_CATALOG_DRAG_TYPE) {
      void insertItem(
        options.monitor.getItem() as LayerTreeCatalogItem,
        String(options.dropTargetId),
        options.relativeIndex,
      );
      return;
    }
    // What was moved, and what it holds that is this tree's (or map's) own,
    // is placed anew where it now lies: in a group an addition, on the top
    // level a plain placement.
    const moved = String(options.dragSourceId);
    const own = new Set(
      [moved, ...descendantIds(nodes, moved)].filter((id) => {
        const node = byId.get(id);
        return node !== undefined && movable(node);
      }),
    );
    const next = newTree as LayerTreeFlatNode[];
    commit(
      next.map((node) =>
        own.has(node.id) ? asPlaced(node, next, mode, rootGroupId) : node,
      ),
    );
    // Show where it went, as when something is dropped from the catalog.
    const target = String(options.dropTargetId);
    if (target !== LAYER_TREE_ROOT_ID) openNodes([target]);
  };

  const toolbar = (
    <LayerTreeToolbar
      onNewGroup={() => setNewGroupOpen(true)}
      search={search}
      onSearchChange={setSearch}
      showSearch={showSearch}
      allExpanded={allExpanded}
      canExpand={expandableIds.length > 0 && !found}
      onToggleAll={() => setOpen(allExpanded ? [] : expandableIds)}
      disabled={isSaving}
      history={history}
    />
  );

  const tree = (
    <>
      {click.holding}
      <Paper
        variant="outlined"
        onMouseLeave={click.clearHover}
        sx={{
          position: "relative",
          // Takes the window's height left, and scrolls inside it without
          // taking the page along at its ends.
          flex: { lg: "1 1 0" },
          minHeight: 0,
          overflowY: { lg: "auto" },
          overscrollBehavior: "contain",
          "& ul": { listStyle: "none", m: 0, p: 0 },
          "& .layer-tree-root": { minHeight: 160, pb: 3 },
          "& .layer-tree-drop-target": { bgcolor: "action.hover" },
        }}
      >
        {click.top}
        {nodes.length === 0 || found?.visible.size === 0 ? (
          <Typography
            color="text.secondary"
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              pointerEvents: "none",
            }}
          >
            {t(found ? "layerTree.noMatches" : "layerTree.empty")}
          </Typography>
        ) : null}
        <Tree<LayerTreeNodeData>
          tree={nodes}
          rootId={LAYER_TREE_ROOT_ID}
          extraAcceptTypes={
            moveZone
              ? [LAYER_TREE_CATALOG_DRAG_TYPE, MOVE_ZONE_DRAG_TYPE]
              : [LAYER_TREE_CATALOG_DRAG_TYPE]
          }
          initialOpen={shownOpenIds}
          onChangeOpen={(ids) => setOpen(ids.map(String))}
          sort={false}
          insertDroppableFirst={false}
          enableAnimateExpand
          dropTargetOffset={8}
          canDrag={(node) =>
            canEdit &&
            !click.active &&
            node !== undefined &&
            movable(node as LayerTreeFlatNode)
          }
          canDrop={canDrop}
          onDrop={handleDrop}
          classes={{
            root: "layer-tree-root",
            dropTarget: "layer-tree-drop-target",
          }}
          placeholderRender={(_, { depth }) => (
            <Box
              sx={{
                height: 2,
                ml: `${depth * 24}px`,
                bgcolor: "primary.main",
                borderRadius: 1,
              }}
            />
          )}
          render={(node, { depth, isOpen, hasChild, isDragging, onToggle }) => {
            const flatNode = node as LayerTreeFlatNode;
            const { kind, sourceId, isNew, added, placedBy } = flatNode.data;
            const topLevel = flatNode.parent === LAYER_TREE_ROOT_ID;
            const parent = byId.get(flatNode.parent);
            const editable = movable(flatNode);
            const details: LayerTreeItemDetails = isNew
              ? { lines: [t("layerTree.newGroupHint")], context: "" }
              : getDetails(kind, sourceId);
            return (
              <Box
                sx={{
                  display:
                    found && !found.visible.has(flatNode.id) ? "none" : "block",
                }}
              >
                <LayerTreeRow
                  node={flatNode}
                  details={details}
                  depth={depth}
                  isOpen={isOpen}
                  hasChild={hasChild}
                  isDragging={isDragging}
                  fixed={!editable || !canEdit || click.active}
                  locked={kind === "group" && !isNew && editable}
                  from={editable ? undefined : placedFrom(flatNode, nodes)}
                  // What this tree put in a linked group, as an exception,
                  // and whose: the group edited here, or a new group in it.
                  exceptionIn={
                    mode === "group" && placedHere(placedBy, rootGroupId)
                      ? {
                          group:
                            placedFrom(flatNode, nodes) ?? rootGroupName ?? "",
                          target: parent?.text ?? "",
                        }
                      : undefined
                  }
                  misplaced={mode === "map" && kind === "layer" && topLevel}
                  layerCount={layerCounts.get(flatNode.id)}
                  onToggle={onToggle}
                  onRemove={
                    editable && !isSaving
                      ? () => commit(removeNode(nodes, flatNode.id))
                      : undefined
                  }
                  onEditGroup={
                    kind === "group" && !isNew
                      ? () => void navigate(`/groups/${sourceId}`)
                      : undefined
                  }
                  // A map hides what a linked group holds; what lies in a
                  // new group is its own, and is removed instead.
                  onToggleHidden={
                    mode === "map" &&
                    !topLevel &&
                    !added &&
                    !parent?.data.isNew &&
                    !isSaving
                      ? () => commit(toggleHidden(nodes, flatNode.id))
                      : undefined
                  }
                  hiddenWith={hiddenWith.get(flatNode.id)}
                  inMoveZone={moveZone?.flagged.has(flatNode.id)}
                  {...rowSettings(flatNode)}
                  {...click.rowProps(flatNode, depth)}
                />
              </Box>
            );
          }}
        />
        {click.bottom}
      </Paper>
    </>
  );

  return (
    <>
      {/* Catalog on the left and tree on the right, as in Lagerordning. */}
      <LayerTreeEditorWindow>
        <LayerTreeCatalogColumn>
          <LayerTreeCatalog
            excludeGroupId={rootGroupId}
            placedKeys={topLevelKeys}
            // In a map a layer goes in a group, so it must be dragged there.
            canAdd={(item) => mode === "group" || item.kind === "group"}
            disabled={isSaving}
            onAdd={(item) => void insertItem(item, LAYER_TREE_ROOT_ID)}
            pick={click.catalogPick}
          />
        </LayerTreeCatalogColumn>
        <Box sx={EDITOR_COLUMN}>
          {error ? (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ mb: 1 }}
            >
              {error}
            </Alert>
          ) : null}
          {frame ? (
            frame(tree, toolbar)
          ) : (
            <>
              {toolbar}
              {tree}
            </>
          )}
        </Box>
      </LayerTreeEditorWindow>
      <LayerTreeNewGroupDialog
        open={newGroupOpen}
        onClose={() => setNewGroupOpen(false)}
        onAdd={addNewGroup}
      />
      {settingsDialog}
    </>
  );
}
