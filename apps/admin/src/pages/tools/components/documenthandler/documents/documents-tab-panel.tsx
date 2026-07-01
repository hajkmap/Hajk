import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  CreateNewFolder as CreateNewFolderIcon,
} from "@mui/icons-material";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  useFolders,
  useCreateFolder,
  useDeleteFolder,
  useCreateDocument,
  useDeleteDocument,
  useMoveDocumentAcrossFolders,
} from "@/api/documents";
import { getDocuments } from "@/api/documents/requests";
import { DocumentsTree } from "./documents-tree";
import type { DocTreeNode } from "./types.ts";

interface DocumentsTabPanelProps {
  toolId: number | undefined;
  openDocument?: { folder: string; document: string } | null;
  onOpenDocument: (folder: string, document: string) => void;
  onCloseDocument: () => void;
}

export function DocumentsTabPanel({
  toolId,
  openDocument,
  onOpenDocument,
  onCloseDocument,
}: DocumentsTabPanelProps) {
  const { t } = useTranslation();

  // Tracks which node is highlighted in the tree (drives New document target)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Dialog state
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState("");
  const [newDocDialogOpen, setNewDocDialogOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [deleteFolderName, setDeleteFolderName] = useState<string | null>(null);
  const [deleteDocInfo, setDeleteDocInfo] = useState<{
    folderName: string;
    docName: string;
    docTitle: string;
  } | null>(null);

  // ─── Data queries ────────────────────────────────────────────────────────────

  const { data: folders = [], isLoading: foldersLoading } =
    useFolders(toolId);

  // Fetch all documents for all folders so the tree is fully populated
  const allDocQueries = useQueries({
    queries: folders.map((folder) => ({
      queryKey: ["documents", toolId, folder.name],
      queryFn: () => getDocuments(toolId!, folder.name),
      enabled: toolId !== undefined,
      staleTime: 30_000,
    })),
  });

  const allDocsLoading = allDocQueries.some((q) => q.isLoading);

  // ─── Build sorted tree data ──────────────────────────────────────────────────

  const treeData = useMemo<DocTreeNode[]>(() => {
    const sorted = [...folders].sort((a, b) =>
      a.title.localeCompare(b.title)
    );
    return sorted.map((folder, idx) => {
      const docs = allDocQueries[idx]?.data ?? [];
      const sortedDocs = [...docs].sort((a, b) =>
        a.title.localeCompare(b.title)
      );
      return {
        id: `folder:${folder.name}`,
        kind: "folder" as const,
        name: folder.name,
        title: folder.title || folder.name,
        docCount: docs.length,
        children: sortedDocs.map((doc) => ({
          id: `doc:${folder.name}/${doc.name}`,
          kind: "document" as const,
          name: doc.name,
          title: doc.title || doc.name,
          folderName: folder.name,
          children: [],
        })),
      };
    });
  }, [folders, allDocQueries]);

  // ─── Resolve target folder for "New document" ────────────────────────────────

  function getNewDocFolder(): string | undefined {
    if (!selectedNodeId) return undefined;
    if (selectedNodeId.startsWith("folder:")) {
      return selectedNodeId.slice("folder:".length);
    }
    if (selectedNodeId.startsWith("doc:")) {
      const rest = selectedNodeId.slice("doc:".length);
      const slashIdx = rest.indexOf("/");
      return slashIdx !== -1 ? rest.slice(0, slashIdx) : undefined;
    }
    return undefined;
  }

  const activeNewDocFolder = getNewDocFolder();

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const createFolderMutation = useCreateFolder(toolId ?? 0);
  const deleteFolderMutation = useDeleteFolder(toolId ?? 0);
  const createDocMutation = useCreateDocument(
    toolId ?? 0,
    activeNewDocFolder ?? ""
  );
  const deleteDocMutation = useDeleteDocument(
    toolId ?? 0,
    deleteDocInfo?.folderName ?? ""
  );
  const moveDocMutation = useMoveDocumentAcrossFolders(toolId ?? 0);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  function handleCreateFolder() {
    if (!newFolderTitle.trim() || toolId === undefined) return;
    createFolderMutation.mutate(
      { title: newFolderTitle.trim() },
      {
        onSuccess: () => {
          setNewFolderDialogOpen(false);
          setNewFolderTitle("");
        },
      }
    );
  }

  function handleCreateDocument() {
    if (!newDocTitle.trim() || !activeNewDocFolder || toolId === undefined) return;
    createDocMutation.mutate(
      { title: newDocTitle.trim() },
      {
        onSuccess: (doc) => {
          setNewDocDialogOpen(false);
          setNewDocTitle("");
          onOpenDocument(activeNewDocFolder, doc.name);
        },
      }
    );
  }

  function handleDeleteFolder(name: string) {
    setDeleteFolderName(name);
  }

  function handleDeleteDocument(folderNameArg: string, docName: string) {
    const folder = folders.find((f) => f.name === folderNameArg);
    const docs = allDocQueries[folders.indexOf(folder!)]?.data ?? [];
    const doc = docs.find((d) => d.name === docName);
    setDeleteDocInfo({
      folderName: folderNameArg,
      docName,
      docTitle: doc?.title ?? docName,
    });
  }

  if (toolId === undefined) {
    return null;
  }

  const isLoading = foldersLoading || allDocsLoading;
  const selectedDocTreeId = openDocument
    ? `doc:${openDocument.folder}/${openDocument.document}`
    : null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Button
          size="small"
          startIcon={<CreateNewFolderIcon />}
          onClick={() => setNewFolderDialogOpen(true)}
        >
          {t("tools.documenthandler.documents.newFolder")}
        </Button>

        <Tooltip
          title={
            !activeNewDocFolder
              ? t(
                  "tools.documenthandler.documents.selectFolderForNewDocument"
                )
              : ""
          }
        >
          <span>
            <Button
              size="small"
              startIcon={<AddIcon />}
              disabled={!activeNewDocFolder}
              onClick={() => setNewDocDialogOpen(true)}
            >
              {t("tools.documenthandler.documents.newDocument")}
            </Button>
          </span>
        </Tooltip>
      </Box>

      <Divider />

      {/* ── Tree ────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : folders.length === 0 ? (
        <Alert severity="info">
          {t("tools.documenthandler.documents.noFolders")}
        </Alert>
      ) : (
        <Box sx={{ maxWidth: { md: "50%" } }}>
          {moveDocMutation.isError && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {moveDocMutation.error instanceof Error
                ? moveDocMutation.error.message
                : t("tools.documenthandler.documents.moveError")}
            </Alert>
          )}
          <DocumentsTree
            data={treeData}
            selectedDocId={selectedDocTreeId}
            selectedNodeId={selectedNodeId}
            activeFolderName={activeNewDocFolder ?? null}
            onSelectNode={setSelectedNodeId}
            onOpenDocument={onOpenDocument}
            onDeleteFolder={handleDeleteFolder}
            onDeleteDocument={handleDeleteDocument}
            onMoveDocument={({ sourceFolder, name, targetFolder }) => {
              moveDocMutation.mutate({ sourceFolder, name, targetFolder });
            }}
          />
        </Box>
      )}

      {/* ── New folder dialog ───────────────────────────────────────────── */}
      <Dialog
        open={newFolderDialogOpen}
        onClose={() => setNewFolderDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {t("tools.documenthandler.documents.newFolder")}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label={t("tools.documenthandler.documents.folderTitle")}
            value={newFolderTitle}
            onChange={(e) => setNewFolderTitle(e.target.value)}
            fullWidth
            size="small"
            sx={{ mt: 1 }}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewFolderDialogOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateFolder}
            disabled={!newFolderTitle.trim() || createFolderMutation.isPending}
          >
            {t("common.create")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── New document dialog ─────────────────────────────────────────── */}
      <Dialog
        open={newDocDialogOpen}
        onClose={() => setNewDocDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {t("tools.documenthandler.documents.newDocument")}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label={t("tools.documenthandler.documents.documentTitle")}
            value={newDocTitle}
            onChange={(e) => setNewDocTitle(e.target.value)}
            fullWidth
            size="small"
            sx={{ mt: 1 }}
            onKeyDown={(e) => e.key === "Enter" && handleCreateDocument()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewDocDialogOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateDocument}
            disabled={!newDocTitle.trim() || createDocMutation.isPending}
          >
            {t("common.create")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete folder confirmation ──────────────────────────────────── */}
      <Dialog
        open={deleteFolderName !== null}
        onClose={() => setDeleteFolderName(null)}
        maxWidth="xs"
      >
        <DialogTitle>
          {t("tools.documenthandler.documents.confirmDeleteFolder")}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {folders.find((f) => f.name === deleteFolderName)?.title ??
              deleteFolderName}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteFolderName(null)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (!deleteFolderName) return;
              deleteFolderMutation.mutate(deleteFolderName, {
                onSuccess: () => setDeleteFolderName(null),
              });
            }}
          >
            {t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete document confirmation ────────────────────────────────── */}
      <Dialog
        open={deleteDocInfo !== null}
        onClose={() => setDeleteDocInfo(null)}
        maxWidth="xs"
      >
        <DialogTitle>
          {t("tools.documenthandler.documents.confirmDeleteDocument")}
        </DialogTitle>
        <DialogContent>
          <Typography>{deleteDocInfo?.docTitle ?? deleteDocInfo?.docName}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDocInfo(null)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (!deleteDocInfo) return;
              deleteDocMutation.mutate(deleteDocInfo.docName, {
                onSuccess: () => {
                  const wasOpen =
                    openDocument?.folder === deleteDocInfo.folderName &&
                    openDocument?.document === deleteDocInfo.docName;
                  setDeleteDocInfo(null);
                  if (wasOpen) {
                    onCloseDocument();
                  }
                },
              });
            }}
          >
            {t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
