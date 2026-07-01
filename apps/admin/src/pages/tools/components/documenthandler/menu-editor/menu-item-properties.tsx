import {
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  IconButton,
  Tooltip,
  Alert,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Icon,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import FormColorPicker from "@/components/form-components/form-color-picker";
import type { MenuConfigItem, MenuTreeNode } from "./types";
import { isNodeValid, updateNodeById } from "./utils";
import {
  useFolders,
  useDocuments,
  useResolveDocumentFolder,
} from "@/api/documents";

interface MenuItemPropertiesProps {
  node: MenuTreeNode | null;
  tree: MenuTreeNode[];
  onNodeChange: (next: MenuTreeNode[]) => void;
  onOpenDocument: (folder: string, document: string) => void;
  toolId?: number;
}

const FONT_SIZE_OPTIONS = ["small", "medium", "large"];

export function MenuItemProperties({
  node,
  tree,
  onNodeChange,
  onOpenDocument,
  toolId,
}: MenuItemPropertiesProps) {
  const { t } = useTranslation();

  const { data: folders = [] } = useFolders(toolId);
  const { effectiveFolder, isResolving } = useResolveDocumentFolder(
    toolId,
    node?.data.document,
    node?.data.folder,
    folders
  );
  const { data: documents = [] } = useDocuments(toolId, effectiveFolder);

  useEffect(() => {
    if (!node || !effectiveFolder || node.userTouchedFolder) return;
    if ((node.data.folder ?? "").trim() === effectiveFolder) return;

    const next = updateNodeById(tree, node.id, (n) => ({
      ...n,
      hadFolder: true,
      data: { ...n.data, folder: effectiveFolder },
    }));
    onNodeChange(next);
  }, [node, effectiveFolder, tree, onNodeChange]);

  if (!node) {
    return (
      <Box
        sx={{
          p: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "text.secondary",
        }}
      >
        <Typography variant="body2">
          {t("tools.documenthandler.menuEditor.noSelection")}
        </Typography>
      </Box>
    );
  }

  const selectedNode = node;
  const valid = isNodeValid(selectedNode);
  const d = selectedNode.data;
  const hasChildren = selectedNode.children.length > 0;

  type MenuNodeMeta = Pick<
    MenuTreeNode,
    | "userTouchedFolder"
    | "userTouchedExpandedSubMenu"
    | "hadFolder"
    | "hadExpandedSubMenu"
  >;

  function patch(
    dataChanges: Partial<MenuConfigItem>,
    metaChanges?: Partial<MenuNodeMeta>
  ) {
    const next = updateNodeById(tree, selectedNode.id, (n) => ({
      ...n,
      ...metaChanges,
      data: { ...n.data, ...dataChanges },
    }));
    onNodeChange(next);
  }

  const folderValue = effectiveFolder ?? "";
  const documentInList = documents.some((doc) => doc.name === d.document);

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      {!valid && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {t("tools.documenthandler.menuEditor.invalidNodeWarning")}
        </Alert>
      )}

      {/* Title */}
      <TextField
        label={t("tools.documenthandler.menuEditor.fields.title")}
        fullWidth
        size="small"
        value={d.title}
        onChange={(e) => patch({ title: e.target.value })}
      />

      <Divider />

      {/* Icon */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <TextField
          label={t("tools.documenthandler.menuEditor.fields.icon")}
          fullWidth
          size="small"
          value={d.icon.materialUiIconName}
          onChange={(e) =>
            patch({ icon: { ...d.icon, materialUiIconName: e.target.value } })
          }
          slotProps={{
            input: {
              startAdornment: d.icon.materialUiIconName ? (
                <InputAdornment position="start">
                  <Icon sx={{ fontSize: 18 }}>{d.icon.materialUiIconName}</Icon>
                </InputAdornment>
              ) : undefined,
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={t("tools.documenthandler.browseIcons")}>
                    <IconButton
                      size="small"
                      edge="end"
                      onClick={() =>
                        window.open(
                          "https://fonts.google.com/icons",
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      <OpenInNewIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>
            {t("tools.documenthandler.menuEditor.fields.fontSize")}
          </InputLabel>
          <Select
            label={t("tools.documenthandler.menuEditor.fields.fontSize")}
            value={d.icon.fontSize}
            onChange={(e) =>
              patch({ icon: { ...d.icon, fontSize: e.target.value } })
            }
          >
            {FONT_SIZE_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Color */}
      <FormColorPicker
        label={t("tools.documenthandler.menuEditor.fields.color")}
        value={d.color}
        onChange={(hex) => patch({ color: hex })}
      />

      <Divider />

      {/* Document */}
      <Box>
        {folders.length > 0 ? (
          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>
              {t("tools.documenthandler.menuEditor.fields.folder")}
            </InputLabel>
            <Select
              label={t("tools.documenthandler.menuEditor.fields.folder")}
              value={folderValue}
              disabled={isResolving}
              onChange={(e) => {
                patch(
                  { folder: e.target.value, document: "" },
                  { userTouchedFolder: true, hadFolder: true }
                );
              }}
            >
              {folders.map((folder) => (
                <MenuItem key={folder.name} value={folder.name}>
                  {folder.title || folder.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          toolId !== undefined && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1, display: "block" }}
            >
              {t("tools.documenthandler.documents.noFolders")}
            </Typography>
          )
        )}

        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
          <FormControl
            fullWidth
            size="small"
            sx={{ flex: 1 }}
            disabled={!effectiveFolder || isResolving}
          >
            <InputLabel>
              {t("tools.documenthandler.menuEditor.fields.document")}
            </InputLabel>
            <Select
              label={t("tools.documenthandler.menuEditor.fields.document")}
              value={d.document}
              onChange={(e) => patch({ document: e.target.value })}
            >
              <MenuItem value="">
                <em>
                  {t("tools.documenthandler.menuEditor.fields.noDocument")}
                </em>
              </MenuItem>
              {documents.map((doc) => (
                <MenuItem key={doc.name} value={doc.name}>
                  {doc.title ? `${doc.title} (${doc.name})` : doc.name}
                </MenuItem>
              ))}
              {d.document && !documentInList && (
                <MenuItem value={d.document}>{d.document}</MenuItem>
              )}
            </Select>
          </FormControl>
          <Tooltip title={t("tools.documenthandler.menuEditor.openDocument")}>
            <span>
              <IconButton
                size="small"
                disabled={
                  !d.document.trim() || !effectiveFolder || isResolving
                }
                onClick={() =>
                  onOpenDocument(effectiveFolder!, d.document.trim())
                }
                sx={{ mt: 0.5, flexShrink: 0 }}
              >
                <DescriptionIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Map link */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
        <TextField
          label={t("tools.documenthandler.menuEditor.fields.maplink")}
          fullWidth
          size="small"
          value={d.maplink}
          onChange={(e) => patch({ maplink: e.target.value })}
          sx={{ flex: 1 }}
        />
        <Tooltip title={t("tools.documenthandler.menuEditor.openMapLink")}>
          <span>
            <IconButton
              size="small"
              disabled={!d.maplink.trim()}
              onClick={() =>
                window.open(d.maplink.trim(), "_blank", "noopener,noreferrer")
              }
              sx={{ mt: 0.5, flexShrink: 0 }}
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Link */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
        <TextField
          label={t("tools.documenthandler.menuEditor.fields.link")}
          fullWidth
          size="small"
          value={d.link}
          onChange={(e) => patch({ link: e.target.value })}
          sx={{ flex: 1 }}
        />
        <Tooltip title={t("tools.documenthandler.menuEditor.openLink")}>
          <span>
            <IconButton
              size="small"
              disabled={!d.link.trim()}
              onClick={() =>
                window.open(d.link.trim(), "_blank", "noopener,noreferrer")
              }
              sx={{ mt: 0.5, flexShrink: 0 }}
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Expanded sub-menu — only when node has children */}
      {hasChildren && (
        <>
          <Divider />
          <FormControlLabel
            control={
              <Checkbox
                checked={d.expandedSubMenu ?? false}
                onChange={(_, checked) => {
                  patch(
                    { expandedSubMenu: checked },
                    { userTouchedExpandedSubMenu: true }
                  );
                }}
              />
            }
            label={t(
              "tools.documenthandler.menuEditor.fields.expandedSubMenu"
            )}
          />
        </>
      )}
    </Box>
  );
}
