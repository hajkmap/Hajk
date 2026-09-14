import {
  Tree,
  MultiBackend,
  getBackendOptions,
} from "@minoru/react-dnd-treeview";
import { Box } from "@mui/material";
import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DndProvider } from "react-dnd";

import type { MapLayersTreeDropOptions } from "../hooks/maplayers-tree-drop-options";
import type {
  GroupDisplaySettings,
  GroupLayerNodeData,
  GroupLayerTreeNode,
} from "../types";
import {
  CATALOG_DRAG_TYPE,
  GROUP_LAYER_TREE_ROOT_ID,
  MOVE_ZONE_DRAG_TYPE,
} from "../types";
import {
  buildChildrenByParentId,
  canDropGroupLayerNode,
  getDescendantIds,
} from "../utils/tree-model";
import GroupLayerTreeNodeView from "./group-layer-tree-node";

export function MapLayersDndProvider({ children }: { children: ReactNode }) {
  return (
    <DndProvider backend={MultiBackend} options={getBackendOptions()}>
      {children}
    </DndProvider>
  );
}

interface MapLayersTreeViewProps {
  treeData: GroupLayerTreeNode[];
  visibleIds: Set<string>;
  visibleNodeIds: Set<string> | null;
  groupDisplaySettings: Record<string, GroupDisplaySettings>;
  clickMode: boolean;
  clickPickIsNull: boolean;
  /** Parent-driven hover (click-place drop line). Unused while browsing. */
  hoveredSubtreeIds: Set<string> | null;
  clickPickEdgeById: Map<
    string,
    "only" | "start" | "middle" | "end"
  > | null;
  clickPlaceIndicator: { afterNodeId: string; lineDepth: number } | null;
  onChangeOpen: (openIds: Set<string>) => void;
  onDrop: (
    newTree: GroupLayerTreeNode[],
    options: MapLayersTreeDropOptions,
  ) => void;
  onTreeMouseLeave: () => void;
  onTreeClickInteract: (
    nodeId: GroupLayerTreeNode["id"],
    additive: boolean,
  ) => void;
  onHoverSubtree: (nodeId: GroupLayerTreeNode["id"]) => void;
  onToggleLayerVisibility: (nodeId: GroupLayerTreeNode["id"]) => void;
  onToggleGroupVisibility: (nodeId: GroupLayerTreeNode["id"]) => void;
  onAddToGroup: (nodeId: GroupLayerTreeNode["id"]) => void;
  onRemoveFromTree: (nodeId: GroupLayerTreeNode["id"]) => void;
  onEditGroupMetadata: (nodeId: GroupLayerTreeNode["id"]) => void;
  onEditLayerSettings: (nodeId: GroupLayerTreeNode["id"]) => void;
}

export default function MapLayersTreeView({
  treeData,
  visibleIds,
  visibleNodeIds,
  groupDisplaySettings,
  clickMode,
  clickPickIsNull,
  hoveredSubtreeIds,
  clickPickEdgeById,
  clickPlaceIndicator,
  onChangeOpen,
  onDrop,
  onTreeMouseLeave,
  onTreeClickInteract,
  onHoverSubtree,
  onToggleLayerVisibility,
  onToggleGroupVisibility,
  onAddToGroup,
  onRemoveFromTree,
  onEditGroupMetadata,
  onEditLayerSettings,
}: MapLayersTreeViewProps) {
  // Keep browse-mode hover local so GroupLayerTree (catalog, dialogs, etc.)
  // does not re-render on every mouseenter.
  const [browseHoveredRootId, setBrowseHoveredRootId] = useState<
    GroupLayerTreeNode["id"] | null
  >(null);

  const browseHoveredSubtreeIds = useMemo(() => {
    if (!clickPickIsNull || browseHoveredRootId == null) {
      return null;
    }
    const childrenByParent = buildChildrenByParentId(treeData);
    const ids = new Set<string>([String(browseHoveredRootId)]);
    const hoveredNode = treeData.find(
      (entry) => entry.id === browseHoveredRootId,
    );
    if (hoveredNode?.data?.kind === "group") {
      for (const id of getDescendantIds(
        treeData,
        browseHoveredRootId,
        childrenByParent,
      )) {
        ids.add(String(id));
      }
    }
    return ids;
  }, [browseHoveredRootId, clickPickIsNull, treeData]);

  const effectiveHoveredSubtreeIds = clickPickIsNull
    ? browseHoveredSubtreeIds
    : hoveredSubtreeIds;

  const handleHoverSubtree = useCallback(
    (nodeId: GroupLayerTreeNode["id"]) => {
      if (clickPickIsNull) {
        setBrowseHoveredRootId((current) =>
          current === nodeId ? current : nodeId,
        );
        return;
      }
      onHoverSubtree(nodeId);
    },
    [clickPickIsNull, onHoverSubtree],
  );

  const handleTreeMouseLeave = useCallback(() => {
    if (clickPickIsNull) {
      setBrowseHoveredRootId(null);
      return;
    }
    onTreeMouseLeave();
  }, [clickPickIsNull, onTreeMouseLeave]);

  return (
    <Box sx={{ pb: "8px" }} onMouseLeave={handleTreeMouseLeave}>
      <Tree<GroupLayerNodeData>
        tree={treeData}
        rootId={GROUP_LAYER_TREE_ROOT_ID}
        extraAcceptTypes={[CATALOG_DRAG_TYPE, MOVE_ZONE_DRAG_TYPE]}
        initialOpen
        onChangeOpen={(newOpenIds) => {
          onChangeOpen(new Set(newOpenIds.map((id) => String(id))));
        }}
        sort={false}
        insertDroppableFirst={false}
        dropTargetOffset={12}
        canDrag={() => !clickMode}
        canDrop={(tree, options) => {
          if (clickMode) {
            return false;
          }
          return canDropGroupLayerNode(tree, options);
        }}
        onDrop={(newTree, options) => {
          onDrop(newTree, options);
        }}
        placeholderRender={(_, { depth }) => (
          <Box
            sx={{
              height: 2,
              ml: `${depth * 20}px`,
              mr: 1,
              bgcolor: "primary.main",
              borderRadius: 1,
            }}
          />
        )}
        rootProps={{
          style: {
            flex: "0 0 auto",
            minHeight: 0,
          },
        }}
        classes={{
          root: "group-layer-tree-root",
          listItem: "group-layer-tree-item",
          dropTarget: "group-layer-tree-drop-target",
          draggingSource: "group-layer-tree-dragging",
        }}
        render={(node, options) => (
          <Box
            sx={{
              display:
                visibleNodeIds && !visibleNodeIds.has(String(node.id))
                  ? "none"
                  : "block",
            }}
          >
            <GroupLayerTreeNodeView
              node={node}
              options={options}
              treeData={treeData}
              visibleIds={visibleIds}
              groupDisplaySettings={groupDisplaySettings}
              isSubtreeHovered={
                clickPickIsNull &&
                (effectiveHoveredSubtreeIds?.has(String(node.id)) ?? false)
              }
              clickMode={clickMode}
              clickPickEdge={clickPickEdgeById?.get(String(node.id)) ?? null}
              clickPlaceLineDepth={
                clickPlaceIndicator?.afterNodeId === String(node.id)
                  ? clickPlaceIndicator.lineDepth
                  : null
              }
              onClickInteract={onTreeClickInteract}
              onHoverSubtree={handleHoverSubtree}
              onToggleLayerVisibility={onToggleLayerVisibility}
              onToggleGroupVisibility={onToggleGroupVisibility}
              onAddToGroup={onAddToGroup}
              onRemoveFromTree={onRemoveFromTree}
              onEditGroupMetadata={onEditGroupMetadata}
              onEditLayerSettings={onEditLayerSettings}
            />
          </Box>
        )}
      />
    </Box>
  );
}
