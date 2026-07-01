import React from "react";
import { Tree } from "react-arborist";
import type { TreeApi, CursorProps } from "react-arborist";
import { Box } from "@mui/material";
import type { MenuTreeNode } from "./types";
import type { NodeRendererProps } from "react-arborist";
import { MenuTreeNodeRenderer } from "./menu-tree-node";
import { moveNodes } from "./utils";

// The DefaultCursor circle has a 3px box-shadow that bleeds left at indent
// level 0 (left=0) and gets clipped by react-window's overflow:auto container.
// Nudging left to at least 4px keeps the shadow fully inside the scroll pane.
function MenuCursor({ top, left, indent }: CursorProps) {
  const safeLeft = Math.max(4, left);
  return (
    <div
      style={{
        position: "absolute",
        pointerEvents: "none",
        top: top - 2,
        left: safeLeft,
        right: indent,
        display: "flex",
        alignItems: "center",
        zIndex: 1,
      }}
    >
      <div
        style={{
          width: 4,
          height: 4,
          boxShadow: "0 0 0 3px #4B91E2",
          borderRadius: "50%",
          flexShrink: 0,
        }}
      />
      <div
        style={{
          flex: 1,
          height: 2,
          background: "#4B91E2",
          borderRadius: 1,
        }}
      />
    </div>
  );
}

interface MenuTreeProps {
  data: MenuTreeNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (next: MenuTreeNode[]) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
  onOpenDocument: (folder: string, document: string) => void;
  toolId?: number;
  treeRef?: React.RefObject<TreeApi<MenuTreeNode> | undefined>;
}

export function MenuTree({
  data,
  selectedId,
  onSelect,
  onChange,
  onAddChild,
  onDelete,
  onOpenDocument,
  toolId,
  treeRef,
}: MenuTreeProps) {
  function NodeRenderer(props: NodeRendererProps<MenuTreeNode>) {
    return (
      <MenuTreeNodeRenderer
        {...props}
        selectedId={selectedId}
        onDelete={onDelete}
        onAddChild={onAddChild}
        onOpenDocument={onOpenDocument}
        toolId={toolId}
      />
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 300,
        userSelect: "none",
        "& [class*='List']": {
          outline: "none",
        },
      }}
    >
      <Tree<MenuTreeNode>
        ref={treeRef}
        data={data}
        idAccessor="id"
        childrenAccessor="children"
        openByDefault
        selection={selectedId ?? undefined}
        rowHeight={40}
        height={500}
        width="100%"
        indent={20}
        disableEdit
        renderCursor={MenuCursor}
        onSelect={(nodes) => {
          onSelect(nodes.length > 0 ? nodes[0].id : null);
        }}
        onMove={({ dragIds, parentId, index }) => {
          const next = moveNodes(data, dragIds, parentId, index);
          onChange(next);
        }}
      >
        {NodeRenderer}
      </Tree>
    </Box>
  );
}
