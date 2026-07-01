import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  Button,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useSaveDocument } from "@/api/documents";
import type { Document } from "@/api/documents/types";
import { RichTextEditor } from "../rich-text-editor";
import { ChapterTree } from "./chapter-tree";
import {
  addChildNode,
  createChapterNode,
  findNodeById,
  fromChapterTree,
  removeNodeById,
  toChapterTree,
  updateNodeById,
  type Chapter,
  type ChapterTreeNode,
} from "./chapter-tree-utils";

function extractChapters(content: Record<string, unknown>): Chapter[] {
  const raw = content.chapters;
  if (!Array.isArray(raw)) return [];
  return raw as Chapter[];
}

export const CHAPTER_PANEL_WIDTH = 340;

// ─── Component ───────────────────────────────────────────────────────────────

interface ChapterEditorPanelProps {
  document: Document;
  toolId: number;
  folderName: string;
  docName: string;
  docTitle: string;
  onDocTitleChange: (title: string) => void;
  /** Called whenever dirty/saving state changes so the dialog can render the Save button */
  onStateChange?: (state: { isDirty: boolean; isPending: boolean }) => void;
  /** Called by the dialog's Save button — triggers the actual save */
  onSaveRef?: React.MutableRefObject<() => void>;
  /** Called after a successful save so the dialog can update its dirty baseline */
  onSaveSuccess?: () => void;
  /** Ref populated with a function that returns the current unsaved draft on demand */
  getDraftRef?: React.MutableRefObject<() => Document>;
}

export function ChapterEditorPanel({
  document,
  toolId,
  folderName,
  docName,
  docTitle,
  onDocTitleChange,
  onStateChange,
  onSaveRef,
  onSaveSuccess,
  getDraftRef,
}: ChapterEditorPanelProps) {
  const { t } = useTranslation();
  const initialTree = toChapterTree(extractChapters(document.content));
  const [tree, setTree] = useState<ChapterTreeNode[]>(initialTree);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialTree.length > 0 ? initialTree[0].id : null
  );
  const [isDirty, setIsDirty] = useState(false);

  // Ref to the currently-mounted RichTextEditor's HTML getter
  const getHtmlRef = useRef<() => string>(() => "");

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const saveDocMutation = useSaveDocument(toolId, folderName, docName);

  // Expose dirty/pending state to parent dialog
  useEffect(() => {
    onStateChange?.({ isDirty, isPending: saveDocMutation.isPending });
  }, [isDirty, saveDocMutation.isPending, onStateChange]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function mutate(updater: (draft: ChapterTreeNode[]) => ChapterTreeNode[]) {
    setTree((prev) => updater(prev));
    setIsDirty(true);
  }

  // ── Chapter HTML sync ─────────────────────────────────────────────────────
  // HTML is NOT synced to the tree on every keystroke. Instead it is flushed
  // into the tree on demand: before switching chapters, before saving, and
  // when the draft is read for the "Visa" preview.

  const flushCurrentHtml = useCallback(() => {
    if (!selectedId) return;
    const html = getHtmlRef.current();
    setTree((prev) =>
      updateNodeById(prev, selectedId, (node) => ({
        ...node,
        data: { ...node.data, html },
      }))
    );
  }, [selectedId]);

  const handleEditorDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  const handleHeaderChange = useCallback((id: string, header: string) => {
    setTree((prev) =>
      updateNodeById(prev, id, (node) => ({
        ...node,
        data: { ...node.data, header },
      }))
    );
    setIsDirty(true);
  }, []);

  // ── Save ─────────────────────────────────────────────────────────────────────

  function handleSave() {
    // Flush the active editor's HTML into the tree before reading it for save.
    flushCurrentHtml();
    setTree((latestTree) => {
      const final = fromChapterTree(latestTree);
      saveDocMutation.mutate(
        {
          title: docTitle || undefined,
          content: { ...document.content, chapters: final },
        },
        {
          onSuccess: () => {
            setIsDirty(false);
            onSaveSuccess?.();
          },
        }
      );
      return latestTree;
    });
  }

  // Keep save and draft refs up to date after every render (no deps — intentional ref sync)
  useEffect(() => {
    if (onSaveRef) onSaveRef.current = handleSave;
    if (getDraftRef) {
      getDraftRef.current = () => {
        const currentHtml = selectedId ? getHtmlRef.current() : "";
        const treeWithLatestHtml = selectedId
          ? updateNodeById(tree, selectedId, (node) => ({
              ...node,
              data: { ...node.data, html: currentHtml },
            }))
          : tree;
        return {
          ...document,
          title: docTitle,
          content: {
            ...document.content,
            chapters: fromChapterTree(treeWithLatestHtml),
          },
        };
      };
    }
  });

  // ── Add chapter ───────────────────────────────────────────────────────────

  function openAddDialog(parentId: string | null) {
    setAddParentId(parentId);
    setAddTitle("");
    setAddDialogOpen(true);
  }

  function handleAdd() {
    if (!addTitle.trim()) return;
    const newNode = createChapterNode(addTitle);
    mutate((prev) => addChildNode(prev, addParentId, newNode));
    setSelectedId(newNode.id);
    setAddTitle("");
    setAddDialogOpen(false);
  }

  // ── Delete chapter ────────────────────────────────────────────────────────

  function handleDeleteOpen(id: string) {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  }

  function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    mutate((prev) => removeNodeById(prev, deleteTargetId));
    setSelectedId((prev) => (prev === deleteTargetId ? null : prev));
    setDeleteDialogOpen(false);
  }

  // ─────────────────────────────────────────────────────────────────────────────

  const selectedChapter = selectedId ? findNodeById(tree, selectedId) : null;
  const deleteTarget = deleteTargetId
    ? findNodeById(tree, deleteTargetId)
    : null;

  return (
    <Box sx={{ display: "flex", height: "100%", width: "100%", gap: 2, minHeight: 0, pt: 1 }}>
      {/* ── Chapter tree panel ── */}
      <Box
        sx={{
          width: CHAPTER_PANEL_WIDTH,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          minHeight: 0,
        }}
      >
        <TextField
          label={t("tools.documenthandler.documents.documentTitle")}
          value={docTitle}
          onChange={(e) => onDocTitleChange(e.target.value)}
          size="small"
          fullWidth
          sx={{ flexShrink: 0 }}
        />

        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              px: 1,
              py: 0.5,
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Typography variant="subtitle2" sx={{ flex: 1 }}>
              {t("tools.documenthandler.documents.chapters")}
            </Typography>
            <Tooltip title={t("tools.documenthandler.documents.addChapter")}>
              <IconButton size="small" onClick={() => openAddDialog(null)}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {tree.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t("tools.documenthandler.documents.noChapters")}
              </Typography>
            </Box>
          ) : (
            <ChapterTree
              data={tree}
              selectedId={selectedId}
              onSelect={(id) => {
                flushCurrentHtml();
                setSelectedId(id);
              }}
              onChange={(next) => {
                setTree(next);
                setIsDirty(true);
              }}
              onAddChild={(parentId) => openAddDialog(parentId)}
              onDelete={handleDeleteOpen}
            />
          )}
        </Box>
      </Box>

      {/* ── Editor panel ── */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          minWidth: 0,
        }}
      >
        {selectedChapter ? (
          <>
            <TextField
              label={t("tools.documenthandler.documents.chapterTitle")}
              value={selectedChapter.data.header}
              onChange={(e) => handleHeaderChange(selectedId!, e.target.value)}
              size="small"
              fullWidth
              sx={{ mb: 1, flexShrink: 0 }}
            />
            <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden", width: "100%" }}>
              {/*
               * TODO: Pass imageList/videoList/audioList once the v3 backend
               * exposes a file-listing API for uploaded media (legacy: ../Upload/).
               * Until then the media insert dialogs fall back to free-text URL input.
               */}
              <RichTextEditor
                key={selectedId ?? "none"}
                html={selectedChapter.data.html}
                onDirty={handleEditorDirty}
                getHtmlRef={getHtmlRef}
                toolId={toolId}
              />
            </Box>
          </>
        ) : (
          <Alert severity="info">
            {tree.length === 0
              ? t("tools.documenthandler.documents.addChapterPrompt")
              : t("tools.documenthandler.documents.selectChapterPrompt")}
          </Alert>
        )}
      </Box>

      {/* ── Add dialog ── */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {addParentId
            ? t("tools.documenthandler.documents.newSubChapter")
            : t("tools.documenthandler.documents.newChapter")}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label={t("tools.documenthandler.documents.chapterTitle")}
            value={addTitle}
            onChange={(e) => setAddTitle(e.target.value)}
            size="small"
            fullWidth
            sx={{ mt: 1 }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={!addTitle.trim()}
          >
            {t("tools.documenthandler.documents.addChapterConfirm")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete dialog ── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
      >
        <DialogTitle>{t("tools.documenthandler.documents.confirmDeleteChapter")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("tools.documenthandler.documents.deleteChapterMessage", {
              header:
                deleteTarget?.data.header ??
                t("tools.documenthandler.documents.untitledChapter"),
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
          >
            {t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
