import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
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
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import type { TreeViewItemId } from "@mui/x-tree-view/models";
import { useTranslation } from "react-i18next";
import { useFileList, getFileList } from "../api/file-picker";
import type { FileEntry, ReadableDir } from "../api/file-picker";

interface FilePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (fileUrl: string) => void;
  filter?: string;
  title?: string;
}

interface NavState {
  /** Id of the selected ReadableDir, or undefined when at the root listing. */
  dirId: string | undefined;
  /** Relative path within the selected dir. */
  relPath: string;
}

interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

function buildTreeItems(
  parentPath: string,
  treeData: Record<string, FileEntry[]>
): TreeNode[] {
  const dirs = treeData[parentPath] ?? [];
  return dirs.map((dir) => {
    const hasChildren = dir.path in treeData;
    const children = hasChildren
      ? buildTreeItems(dir.path, treeData)
      : undefined;
    return {
      id: dir.path,
      label: dir.name,
      children: children && children.length > 0 ? children : undefined,
    };
  });
}

async function fetchTreeDirs(
  relPath: string,
  dirId: string,
  treeData: Record<string, FileEntry[]>,
  setTreeData: Dispatch<SetStateAction<Record<string, FileEntry[]>>>
) {
  if (relPath in treeData) return;
  try {
    const result = await getFileList(relPath, undefined, dirId);
    const dirs = result.items.filter((i) => i.type === "directory");
    setTreeData((prev) => ({ ...prev, [relPath]: dirs }));
  } catch {
    // directory read failed, skip
  }
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
  const [nav, setNav] = useState<NavState>({ dirId: undefined, relPath: "" });
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [manualValue, setManualValue] = useState("");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [treeData, setTreeData] = useState<Record<string, FileEntry[]>>({});
  const prevDirId = useRef<string | undefined>(undefined);

  // Fetch the current listing. Always enabled — root uses dirId=undefined, path="".
  const { data, isPending } = useFileList(nav.relPath, filter, nav.dirId);

  const dirsConfigured = (data?.dirs.length ?? 0) > 0;

  // Reset all state when the dialog opens.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    setNav({ dirId: undefined, relPath: "" });
    setSelectedFile(null);
    setManualValue("");
    setExpandedItems([]);
    setTreeData({});
    prevDirId.current = undefined;
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // When the user switches to a different root dir, clear the tree cache.
  useEffect(() => {
    if (nav.dirId !== prevDirId.current) {
      prevDirId.current = nav.dirId;
      setTreeData({});
      setExpandedItems([]);
    }
  }, [nav.dirId]);

  // Pre-fetch tree entries for every ancestor of the current relPath so the
  // tree is expanded to the right place when the user navigates.
  useEffect(() => {
    if (!open || !nav.dirId) return;
    const parts = nav.relPath.split("/").filter(Boolean);
    const pathsToFetch: string[] = [];
    for (let i = 0; i <= parts.length; i++) {
      const p = parts.slice(0, i).join("/");
      if (!(p in treeData)) pathsToFetch.push(p);
    }
    if (pathsToFetch.length > 0) {
      void Promise.all(
        pathsToFetch.map((p) =>
          fetchTreeDirs(p, nav.dirId!, treeData, setTreeData)
        )
      );
    }
  }, [open, nav.dirId, nav.relPath, treeData]);

  const treeItems = useMemo(() => buildTreeItems("", treeData), [treeData]);

  const handleExpandedItemsChange = useCallback(
    (_event: React.SyntheticEvent | null, itemIds: TreeViewItemId[]) => {
      setExpandedItems([...itemIds]);
      const newlyExpanded = itemIds.filter(
        (id) => !expandedItems.includes(id)
      );
      if (nav.dirId) {
        newlyExpanded.forEach((id) => {
          void fetchTreeDirs(id, nav.dirId!, treeData, setTreeData);
        });
      }
    },
    [expandedItems, treeData, nav.dirId]
  );

  const handleTreeItemClick = useCallback(
    (_event: React.MouseEvent, itemId: TreeViewItemId) => {
      setNav((prev) => ({ ...prev, relPath: itemId }));
      setSelectedFile(null);
    },
    []
  );

  // Navigate into a readable dir from the root listing.
  const handleDirSelect = useCallback((dir: ReadableDir) => {
    setNav({ dirId: dir.id, relPath: "" });
    setSelectedFile(null);
  }, []);

  // Navigate into a subdirectory within the current dir.
  const handleSubdirClick = useCallback((subdir: FileEntry) => {
    setNav((prev) => ({ ...prev, relPath: subdir.path }));
    setSelectedFile(null);
  }, []);

  const handleFileClick = useCallback((file: FileEntry) => {
    setSelectedFile(file);
  }, []);

  const handleFileDoubleClick = useCallback((file: FileEntry) => {
    if (file.type === "directory") {
      setNav((prev) => ({ ...prev, relPath: file.path }));
      setSelectedFile(null);
    }
  }, []);

  // Navigate up one level.
  const handleNavigateUp = useCallback(() => {
    setSelectedFile(null);
    setNav((prev) => {
      if (!prev.dirId) return prev;
      if (!prev.relPath) {
        // At root of a dir — go back to the root listing.
        return { dirId: undefined, relPath: "" };
      }
      const parentPath = prev.relPath.split("/").slice(0, -1).join("/");
      return { ...prev, relPath: parentPath };
    });
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

  const isAtRoot = !nav.dirId;
  const breadcrumbParts = nav.relPath.split("/").filter(Boolean);
  const currentDirLabel =
    data?.dirs.find((d) => d.id === nav.dirId)?.label ?? nav.dirId ?? "";

  const files = data?.items.filter((i) => i.type === "file") ?? [];
  const subdirs = data?.items.filter((i) => i.type === "directory") ?? [];
  const rootDirs = isAtRoot ? (data?.dirs ?? []) : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent dividers>
        {isPending && !data ? (
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
          /* Configured state: breadcrumb + two-pane browse UI */
          <>
            <Breadcrumbs sx={{ mb: 1 }}>
              <Link
                component="button"
                variant="body2"
                underline="hover"
                color={isAtRoot ? "text.primary" : "inherit"}
                onClick={() => {
                  if (!isAtRoot) {
                    setNav({ dirId: undefined, relPath: "" });
                    setSelectedFile(null);
                  }
                }}
                sx={{ cursor: isAtRoot ? "default" : "pointer" }}
              >
                {t("filePicker.allFolders")}
              </Link>
              {nav.dirId && (
                <Link
                  component="button"
                  variant="body2"
                  underline="hover"
                  color={
                    breadcrumbParts.length === 0 ? "text.primary" : "inherit"
                  }
                  onClick={() => {
                    setNav({ dirId: nav.dirId, relPath: "" });
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
              {breadcrumbParts.map((part, i) => {
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
                        setNav((prev) => ({ ...prev, relPath: partPath }));
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
              {/* Left: folder tree (only when inside a dir) */}
              <Box
                sx={{
                  width: 280,
                  flexShrink: 0,
                  borderRight: 1,
                  borderColor: "divider",
                  overflow: "auto",
                }}
              >
                {isAtRoot ? (
                  <Typography
                    variant="body2"
                    sx={{ p: 2, color: "text.secondary" }}
                  >
                    {t("filePicker.selectFolderToBrowse")}
                  </Typography>
                ) : treeItems.length > 0 ? (
                  <RichTreeView
                    items={treeItems}
                    expandedItems={expandedItems}
                    onExpandedItemsChange={handleExpandedItemsChange}
                    onItemClick={handleTreeItemClick}
                    getItemId={(item: TreeNode) => item.id}
                    getItemLabel={(item: TreeNode) => item.label}
                    getItemChildren={(item: TreeNode) => item.children}
                  />
                ) : (
                  <Typography
                    variant="body2"
                    sx={{ p: 2, color: "text.secondary" }}
                  >
                    {t("filePicker.noSubfolders")}
                  </Typography>
                )}
              </Box>

              {/* Right: contents of the current location */}
              <Box sx={{ flex: 1, overflow: "auto" }}>
                {/* Root listing — show configured readable dirs */}
                {isAtRoot && rootDirs.length > 0 && (
                  <>
                    <Typography
                      variant="caption"
                      sx={{ px: 1, color: "text.secondary" }}
                    >
                      {t("filePicker.folders")}
                    </Typography>
                    <List dense disablePadding>
                      {rootDirs.map((dir) => (
                        <ListItemButton
                          key={dir.id}
                          onClick={() => handleDirSelect(dir)}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <FolderOutlined fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={dir.label} />
                        </ListItemButton>
                      ))}
                    </List>
                  </>
                )}

                {/* Subdirectories within the current dir */}
                {!isAtRoot && subdirs.length > 0 && (
                  <>
                    <Typography
                      variant="caption"
                      sx={{ px: 1, color: "text.secondary" }}
                    >
                      {t("filePicker.folders")}
                    </Typography>
                    <List dense disablePadding>
                      {subdirs.map((d) => (
                        <ListItemButton
                          key={d.path}
                          onClick={() => handleSubdirClick(d)}
                          onDoubleClick={() => handleFileDoubleClick(d)}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <FolderOutlined fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={d.name} />
                        </ListItemButton>
                      ))}
                    </List>
                  </>
                )}

                {/* File listing */}
                {!isAtRoot && (
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
        <Button onClick={handleNavigateUp} disabled={isAtRoot || !dirsConfigured}>
          {t("filePicker.up")}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button variant="contained" onClick={handleOk} disabled={!canConfirm}>
          {t("filePicker.ok")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
