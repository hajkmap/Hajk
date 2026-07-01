import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import type { TreeViewItemId } from "@mui/x-tree-view/models";
import { useTranslation } from "react-i18next";
import { useFileList, getFileList } from "../api/file-picker";
import type { FileEntry } from "../api/file-picker";

interface FilePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (fileUrl: string) => void;
  filter?: string;
  title?: string;
}

interface Selection {
  /** Id of the selected ReadableDir (root folder). */
  dirId: string;
  /** Relative path within the selected root folder. */
  relPath: string;
}

interface TreeNode {
  id: string;
  label: string;
  dirId: string;
  relPath: string;
  children?: TreeNode[];
}

const KEY_SEP = "\u0000";

function makeKey(dirId: string, relPath: string): string {
  return `${dirId}${KEY_SEP}${relPath}`;
}

function parseKey(key: string): Selection {
  const idx = key.indexOf(KEY_SEP);
  return { dirId: key.slice(0, idx), relPath: key.slice(idx + 1) };
}

/**
 * Build the child nodes for a folder from cached subdirectory data. Returns
 * undefined when the folder has no known subfolders (either not yet fetched or
 * genuinely empty), so the tree only shows an expand arrow once we actually
 * know there are subfolders.
 */
function buildChildren(
  dirId: string,
  relPath: string,
  treeData: Record<string, FileEntry[]>
): TreeNode[] | undefined {
  const subdirs = treeData[makeKey(dirId, relPath)];
  if (!subdirs || subdirs.length === 0) return undefined;
  return subdirs.map((sd) => ({
    id: makeKey(dirId, sd.path),
    label: sd.name,
    dirId,
    relPath: sd.path,
    children: buildChildren(dirId, sd.path, treeData),
  }));
}

export default function FilePickerDialog({
  open,
  onClose,
  onSelect,
  filter = "",
  title,
}: FilePickerDialogProps) {
  const { t } = useTranslation();
  const dialogTitle = title ?? t("filePicker.title");
  const [selected, setSelected] = useState<Selection | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [manualValue, setManualValue] = useState("");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [treeData, setTreeData] = useState<Record<string, FileEntry[]>>({});

  // Mirror of treeData plus in-flight fetches, used by the async fetch helpers
  // to avoid duplicate requests without depending on render-time snapshots.
  const treeDataRef = useRef<Record<string, FileEntry[]>>({});
  const inFlight = useRef<Record<string, Promise<FileEntry[]>>>({});
  useEffect(() => {
    treeDataRef.current = treeData;
  }, [treeData]);

  // Root listing — always enabled — provides the configured readable dirs.
  const { data: rootData, isPending: rootPending } = useFileList(
    "",
    filter,
    undefined
  );
  const dirs = useMemo(() => rootData?.dirs ?? [], [rootData]);
  const dirsConfigured = dirs.length > 0;

  // Files for the currently selected folder.
  const { data: filesData, isPending: filesPending } = useFileList(
    selected ? selected.relPath : undefined,
    filter,
    selected?.dirId
  );

  // Fetch (once) the subdirectories of a folder and cache them.
  const ensureFetched = useCallback(
    (dirId: string, relPath: string): Promise<FileEntry[]> => {
      const key = makeKey(dirId, relPath);
      const cached = treeDataRef.current[key];
      if (cached) return Promise.resolve(cached);
      if (key in inFlight.current) return inFlight.current[key];
      const promise = getFileList(relPath, undefined, dirId)
        .then((result) => result.items.filter((i) => i.type === "directory"))
        .catch(() => [] as FileEntry[])
        .then((subdirs) => {
          treeDataRef.current = { ...treeDataRef.current, [key]: subdirs };
          setTreeData((prev) =>
            key in prev ? prev : { ...prev, [key]: subdirs }
          );
          delete inFlight.current[key];
          return subdirs;
        });
      inFlight.current[key] = promise;
      return promise;
    },
    []
  );

  // Fetch a folder's subfolders plus one level deeper, so every visible folder
  // node knows whether it has children (accurate expand arrows).
  const prefetch = useCallback(
    async (dirId: string, relPath: string) => {
      const subdirs = await ensureFetched(dirId, relPath);
      await Promise.all(subdirs.map((sd) => ensureFetched(dirId, sd.path)));
    },
    [ensureFetched]
  );

  // Reset all state when the dialog opens.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setSelectedFile(null);
    setManualValue("");
    setExpandedItems([]);
    setTreeData({});
    treeDataRef.current = {};
    inFlight.current = {};
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Pre-fetch the first two levels of each configured root folder so the tree
  // shows accurate expand arrows from the start.
  const dirIdsKey = dirs.map((d) => d.id).join("|");
  useEffect(() => {
    if (!open || dirs.length === 0) return;
    dirs.forEach((d) => {
      void prefetch(d.id, "");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dirIdsKey]);

  const treeItems = useMemo<TreeNode[]>(
    () =>
      dirs.map((d) => ({
        id: makeKey(d.id, ""),
        label: d.label,
        dirId: d.id,
        relPath: "",
        children: buildChildren(d.id, "", treeData),
      })),
    [dirs, treeData]
  );

  const handleExpandedItemsChange = useCallback(
    (_event: React.SyntheticEvent | null, itemIds: TreeViewItemId[]) => {
      setExpandedItems([...itemIds]);
      const newlyExpanded = itemIds.filter((id) => !expandedItems.includes(id));
      newlyExpanded.forEach((id) => {
        const { dirId, relPath } = parseKey(id);
        void prefetch(dirId, relPath);
      });
    },
    [expandedItems, prefetch]
  );

  const handleTreeItemClick = useCallback(
    (_event: React.MouseEvent, itemId: TreeViewItemId) => {
      const { dirId, relPath } = parseKey(itemId);
      setSelected({ dirId, relPath });
      setSelectedFile(null);
      setExpandedItems((prev) =>
        prev.includes(itemId) ? prev : [...prev, itemId]
      );
      void prefetch(dirId, relPath);
    },
    [prefetch]
  );

  const handleFileClick = useCallback((file: FileEntry) => {
    setSelectedFile(file);
  }, []);

  const canConfirm = dirsConfigured
    ? !!selectedFile
    : manualValue.trim().length > 0;

  const handleOk = useCallback(() => {
    if (dirsConfigured) {
      if (selectedFile) onSelect(selectedFile.url ?? selectedFile.path);
    } else {
      onSelect(manualValue.trim());
    }
    onClose();
  }, [dirsConfigured, selectedFile, manualValue, onSelect, onClose]);

  const handleFileDoubleClick = useCallback(
    (file: FileEntry) => {
      onSelect(file.url ?? file.path);
      onClose();
    },
    [onSelect, onClose]
  );

  const breadcrumbParts = selected
    ? selected.relPath.split("/").filter(Boolean)
    : [];
  const currentDirLabel = selected
    ? (dirs.find((d) => d.id === selected.dirId)?.label ?? selected.dirId)
    : "";

  const files = filesData?.items.filter((i) => i.type === "file") ?? [];
  const selectedTreeId = selected
    ? makeKey(selected.dirId, selected.relPath)
    : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent dividers>
        {rootPending && !rootData ? (
          <Typography variant="body2" sx={{ p: 2, color: "text.secondary" }}>
            {t("common.loading")}
          </Typography>
        ) : !dirsConfigured ? (
          /* Not-configured state: message + manual path entry */
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              pt: 1,
              minHeight: 200,
            }}
          >
            <Alert severity="info">{t("filePicker.notConfigured")}</Alert>
            <TextField
              label={t("filePicker.enterPathManually")}
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              placeholder="/uploads/images/example.png"
              helperText={t("filePicker.manualHelp")}
              size="small"
              fullWidth
              autoFocus
            />
          </Box>
        ) : (
          /* Configured state: breadcrumb + folder tree (left) / files (right) */
          <>
            <Breadcrumbs sx={{ mb: 1 }}>
              <Link
                component="button"
                variant="body2"
                underline="hover"
                color={selected ? "inherit" : "text.primary"}
                onClick={() => {
                  if (selected) {
                    setSelected(null);
                    setSelectedFile(null);
                  }
                }}
                sx={{ cursor: selected ? "pointer" : "default" }}
              >
                {t("filePicker.allFolders")}
              </Link>
              {selected && (
                <Link
                  component="button"
                  variant="body2"
                  underline="hover"
                  color={
                    breadcrumbParts.length === 0 ? "text.primary" : "inherit"
                  }
                  onClick={() => {
                    setSelected({ dirId: selected.dirId, relPath: "" });
                    setSelectedFile(null);
                  }}
                  sx={{
                    cursor:
                      breadcrumbParts.length === 0 ? "default" : "pointer",
                  }}
                >
                  {currentDirLabel}
                </Link>
              )}
              {selected &&
                breadcrumbParts.map((part, i) => {
                  const partPath = breadcrumbParts.slice(0, i + 1).join("/");
                  const isLast = i === breadcrumbParts.length - 1;
                  return (
                    <Link
                      key={partPath}
                      component="button"
                      variant="body2"
                      underline="hover"
                      color={isLast ? "text.primary" : "inherit"}
                      onClick={() => {
                        if (!isLast) {
                          setSelected({
                            dirId: selected.dirId,
                            relPath: partPath,
                          });
                          setSelectedFile(null);
                        }
                      }}
                      sx={{ cursor: isLast ? "default" : "pointer" }}
                    >
                      {part}
                    </Link>
                  );
                })}
            </Breadcrumbs>

            <Box sx={{ display: "flex", gap: 2, minHeight: 400 }}>
              {/* Left: full folder tree */}
              <Box
                sx={{
                  width: 280,
                  flexShrink: 0,
                  borderRight: 1,
                  borderColor: "divider",
                  overflow: "auto",
                  pr: 1,
                }}
              >
                <RichTreeView
                  items={treeItems}
                  expandedItems={expandedItems}
                  onExpandedItemsChange={handleExpandedItemsChange}
                  selectedItems={selectedTreeId}
                  onItemClick={handleTreeItemClick}
                  getItemId={(item: TreeNode) => item.id}
                  getItemLabel={(item: TreeNode) => item.label}
                  getItemChildren={(item: TreeNode) => item.children}
                />
              </Box>

              {/* Right: files in the selected folder */}
              <Box sx={{ flex: 1, overflow: "auto" }}>
                {!selected ? (
                  <Typography
                    variant="body2"
                    sx={{ p: 2, color: "text.secondary" }}
                  >
                    {t("filePicker.selectFolderToBrowse")}
                  </Typography>
                ) : filesPending && !filesData ? (
                  <Typography
                    variant="body2"
                    sx={{ p: 2, color: "text.secondary" }}
                  >
                    {t("common.loading")}
                  </Typography>
                ) : (
                  <>
                    <Typography
                      variant="caption"
                      sx={{ px: 1, color: "text.secondary" }}
                    >
                      {filter
                        ? t("filePicker.filesCount", { count: files.length })
                        : t("filePicker.allFilesCount", { count: files.length })}
                    </Typography>
                    <List dense disablePadding>
                      {files.map((file) => (
                        <ListItemButton
                          key={file.path}
                          selected={selectedFile?.path === file.path}
                          onClick={() => handleFileClick(file)}
                          onDoubleClick={() => handleFileDoubleClick(file)}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <InsertDriveFileOutlined fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={file.name}
                            secondary={
                              file.size !== undefined
                                ? `${(file.size / 1024).toFixed(1)} KB`
                                : undefined
                            }
                          />
                        </ListItemButton>
                      ))}
                      {files.length === 0 && (
                        <Typography
                          variant="body2"
                          sx={{ p: 2, color: "text.secondary" }}
                        >
                          {t("filePicker.noFiles")}
                        </Typography>
                      )}
                    </List>
                  </>
                )}
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button variant="contained" onClick={handleOk} disabled={!canConfirm}>
          {t("filePicker.ok")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
