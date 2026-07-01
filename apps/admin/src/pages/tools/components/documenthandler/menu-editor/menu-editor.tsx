import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  UnfoldMore as ExpandAllIcon,
  UnfoldLess as CollapseAllIcon,
} from "@mui/icons-material";
import type { TreeApi } from "react-arborist";
import { useTranslation } from "react-i18next";
import type { MenuConfig, MenuTreeNode } from "./types";
import {
  toTree,
  fromTree,
  createNewNode,
  addChildNode,
  removeNodeById,
  findNodeById,
} from "./utils";
import { MenuTree } from "./menu-tree";
import { MenuItemProperties } from "./menu-item-properties";

interface MenuEditorProps {
  value: MenuConfig | undefined;
  onChange: (next: MenuConfig) => void;
  onOpenDocument: (folder: string, document: string) => void;
  toolId?: number;
}

export function MenuEditor({ value, onChange, onOpenDocument, toolId }: MenuEditorProps) {
  const { t } = useTranslation();
  const [tree, setTree] = useState<MenuTreeNode[]>(() =>
    toTree(value?.menu ?? [])
  );

  // Track the last menu we emitted via onChange to distinguish external resets
  // (e.g. form reset after tool data loads) from our own internal updates.
  const lastSentMenuRef = useRef<string>(JSON.stringify(value?.menu ?? []));

  useEffect(() => {
    const incoming = JSON.stringify(value?.menu ?? []);
    if (incoming !== lastSentMenuRef.current) {
      lastSentMenuRef.current = incoming;
      setTree(toTree(value?.menu ?? []));
    }
  }, [value]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null);
  const treeRef = useRef<TreeApi<MenuTreeNode> | undefined>(undefined);

  // Propagate tree changes upward via onChange.
  function handleTreeChange(next: MenuTreeNode[]) {
    setTree(next);
    const nextMenu = fromTree(next);
    lastSentMenuRef.current = JSON.stringify(nextMenu);
    onChange({ ...(value ?? {}), menu: nextMenu });
  }

  function handleAddRoot() {
    const next = addChildNode(tree, null, createNewNode());
    handleTreeChange(next);
  }

  function handleAddChild(parentId: string) {
    const newNode = createNewNode();
    const next = addChildNode(tree, parentId, newNode);
    handleTreeChange(next);
    setSelectedId(newNode.id);
    queueMicrotask(() => {
      treeRef.current?.open(parentId);
      void treeRef.current?.scrollTo(newNode.id);
    });
  }

  function handleDeleteRequest(id: string) {
    setNodeToDelete(id);
  }

  function handleConfirmDelete() {
    if (!nodeToDelete) return;
    const next = removeNodeById(tree, nodeToDelete);
    if (selectedId === nodeToDelete) setSelectedId(null);
    handleTreeChange(next);
    setNodeToDelete(null);
  }

  const selectedNode = selectedId ? findNodeById(tree, selectedId) : null;
  const pendingDeleteNode = nodeToDelete
    ? findNodeById(tree, nodeToDelete)
    : null;
  const pendingDeleteChildCount = pendingDeleteNode
    ? countDescendants(pendingDeleteNode.children)
    : 0;
  const pendingDeleteTitle =
    (pendingDeleteNode?.data.title.trim() ?? "") ||
    t("tools.documenthandler.menuEditor.untitled");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {/* Toolbar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pb: 1,
        }}
      >
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddRoot}
        >
          {t("tools.documenthandler.menuEditor.addRoot")}
        </Button>
        <Tooltip title={t("tools.documenthandler.menuEditor.expandAll")}>
          <span>
            <Button
              size="small"
              variant="text"
              onClick={() => treeRef.current?.openAll()}
              sx={{ minWidth: 0 }}
            >
              <ExpandAllIcon fontSize="small" />
            </Button>
          </span>
        </Tooltip>
        <Tooltip title={t("tools.documenthandler.menuEditor.collapseAll")}>
          <span>
            <Button
              size="small"
              variant="text"
              onClick={() => treeRef.current?.closeAll()}
              sx={{ minWidth: 0 }}
            >
              <CollapseAllIcon fontSize="small" />
            </Button>
          </span>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary">
          {tree.length === 0
            ? t("tools.documenthandler.menuEditor.emptyMenu")
            : t("tools.documenthandler.menuEditor.itemCount", {
                count: countNodes(tree),
              })}
        </Typography>
      </Box>

      <Divider />

      {/* Main editor area */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          minHeight: 500,
          alignItems: "flex-start",
        }}
      >
        {/* Left: tree */}
        <Box
          sx={{
            flex: "0 0 55%",
            maxWidth: "55%",
            minHeight: 500,
          }}
        >
          {tree.length === 0 ? (
            <Box
              sx={{
                p: 4,
                textAlign: "center",
                color: "text.secondary",
              }}
            >
              <Typography variant="body2">
                {t("tools.documenthandler.menuEditor.emptyPrompt")}
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddRoot}
                sx={{ mt: 1 }}
              >
                {t("tools.documenthandler.menuEditor.addRoot")}
              </Button>
            </Box>
          ) : (
            <MenuTree
              treeRef={treeRef}
              data={tree}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChange={handleTreeChange}
              onAddChild={handleAddChild}
              onDelete={handleDeleteRequest}
              onOpenDocument={onOpenDocument}
              toolId={toolId}
            />
          )}
        </Box>

        {/* Right: properties panel */}
        <Paper
          variant="outlined"
          sx={{
            flex: 1,
            minHeight: 500,
            overflow: "auto",
          }}
        >
          <MenuItemProperties
            node={selectedNode}
            tree={tree}
            onNodeChange={handleTreeChange}
            onOpenDocument={onOpenDocument}
            toolId={toolId}
          />
        </Paper>
      </Box>

      <Dialog
        open={nodeToDelete !== null}
        onClose={() => setNodeToDelete(null)}
        aria-labelledby="delete-menu-item-dialog-title"
        aria-describedby="delete-menu-item-dialog-description"
      >
        <DialogTitle id="delete-menu-item-dialog-title">
          {t("tools.documenthandler.menuEditor.deleteConfirmTitle")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-menu-item-dialog-description">
            {pendingDeleteChildCount > 0
              ? t(
                  "tools.documenthandler.menuEditor.deleteConfirmMessageWithChildren",
                  {
                    title: pendingDeleteTitle,
                    count: pendingDeleteChildCount,
                  }
                )
              : t("tools.documenthandler.menuEditor.deleteConfirmMessage", {
                  title: pendingDeleteTitle,
                })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setNodeToDelete(null)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            color="error"
            autoFocus
            onClick={handleConfirmDelete}
          >
            {t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function countNodes(nodes: MenuTreeNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countNodes(n.children), 0);
}

function countDescendants(nodes: MenuTreeNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countDescendants(n.children), 0);
}
