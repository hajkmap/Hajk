import { Tree } from "react-arborist";
import type { NodeRendererProps, MoveHandler } from "react-arborist";
import { Box } from "@mui/material";
import type { DocTreeNode } from "./types.ts";
import { DocumentsTreeNode } from "./documents-tree-node";

interface DocumentsTreeProps {
  data: DocTreeNode[];
  selectedDocId: string | null;
  selectedNodeId: string | null;
  activeFolderName: string | null;
  onSelectNode: (id: string | null) => void;
  onOpenDocument: (folderName: string, docName: string) => void;
  onDeleteFolder: (folderName: string) => void;
  onDeleteDocument: (folderName: string, docName: string) => void;
  onMoveDocument: (params: {
    sourceFolder: string;
    name: string;
    targetFolder: string;
  }) => void;
}

export function DocumentsTree({
  data,
  selectedDocId,
  selectedNodeId,
  activeFolderName,
  onSelectNode,
  onOpenDocument,
  onDeleteFolder,
  onDeleteDocument,
  onMoveDocument,
}: DocumentsTreeProps) {
  function NodeRenderer(props: NodeRendererProps<DocTreeNode>) {
    return (
      <DocumentsTreeNode
        {...props}
        selectedDocId={selectedDocId}
        selectedNodeId={selectedNodeId}
        activeFolderName={activeFolderName}
        onOpenDocument={onOpenDocument}
        onDeleteFolder={onDeleteFolder}
        onDeleteDocument={onDeleteDocument}
      />
    );
  }

  const handleMove: MoveHandler<DocTreeNode> = ({ dragIds, parentId }) => {
    if (!parentId) return;

    // Resolve the target folder name from parentId
    // parentId can be a folder node id ("folder:<name>") or a document node id
    let targetFolder: string | undefined;
    if (parentId.startsWith("folder:")) {
      targetFolder = parentId.slice("folder:".length);
    }
    if (!targetFolder) return;

    // Move each dragged document
    for (const dragId of dragIds) {
      // dragId is "doc:<folder>/<name>"
      if (!dragId.startsWith("doc:")) continue;
      const rest = dragId.slice("doc:".length);
      const slashIdx = rest.indexOf("/");
      if (slashIdx === -1) continue;
      const sourceFolder = rest.slice(0, slashIdx);
      const name = rest.slice(slashIdx + 1);
      if (sourceFolder === targetFolder) continue;
      onMoveDocument({ sourceFolder, name, targetFolder });
    }
  };

  // Disallow dragging folders or dropping documents onto documents
  function disableDrop({
    parentNode,
    dragNodes,
  }: {
    parentNode: { data: DocTreeNode } | null;
    dragNodes: { data: DocTreeNode }[];
  }) {
    // Only documents can be dragged
    if (dragNodes.some((n) => n.data.kind === "folder")) return true;
    // Must drop into a folder
    if (parentNode?.data.kind !== "folder") return true;
    return false;
  }

  return (
    <Box
      sx={{
        userSelect: "none",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
        "& [class*='List']": { outline: "none" },
      }}
    >
      <Tree<DocTreeNode>
        data={data}
        idAccessor="id"
        childrenAccessor={(node) =>
          node.kind === "folder" ? (node.children ?? []) : null
        }
        openByDefault
        selection={selectedNodeId ?? undefined}
        rowHeight={36}
        height={480}
        width="100%"
        indent={16}
        disableEdit
        disableDrop={disableDrop}
        onSelect={(nodes) => {
          onSelectNode(nodes.length > 0 ? nodes[0].id : null);
        }}
        onMove={handleMove}
      >
        {NodeRenderer}
      </Tree>
    </Box>
  );
}
