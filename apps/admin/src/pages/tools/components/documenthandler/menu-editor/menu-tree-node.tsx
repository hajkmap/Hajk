import React from "react";
import type { NodeRendererProps } from "react-arborist";
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
  Icon,
} from "@mui/material";
import {
  DragIndicator,
  Delete as DeleteIcon,
  AddCircleOutlined as AddChildIcon,
  Warning as WarningIcon,
  Description as DocumentIcon,
  Map as MapIcon,
  Link as LinkIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useFolders, useResolveDocumentFolder } from "@/api/documents";
import type { MenuTreeNode } from "./types";
import { isNodeValid } from "./utils";

interface MenuTreeNodeProps extends NodeRendererProps<MenuTreeNode> {
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onOpenDocument: (folder: string, document: string) => void;
  toolId?: number;
  selectedId: string | null;
}

const tooltipSlotProps = {
  popper: { sx: { pointerEvents: "none" } },
} as const;

function MenuTreeDocumentIcon({
  toolId,
  document,
  folder,
  onOpenDocument,
}: {
  toolId?: number;
  document: string;
  folder?: string;
  onOpenDocument: (folder: string, document: string) => void;
}) {
  const { t } = useTranslation();
  const { data: folders = [] } = useFolders(toolId);
  const { effectiveFolder, isResolving } = useResolveDocumentFolder(
    toolId,
    document,
    folder,
    folders
  );

  const docName = document.trim();
  const canOpen = !!docName && !!effectiveFolder && !isResolving;

  return (
    <Tooltip
      title={t("tools.documenthandler.menuEditor.openDocumentName", {
        name: document,
      })}
      slotProps={tooltipSlotProps}
    >
      <span>
        <IconButton
          size="small"
          disabled={!canOpen}
          onClick={(e) => {
            e.stopPropagation();
            onOpenDocument(effectiveFolder!, docName);
          }}
          sx={{ p: 0.25, opacity: 0.7, "&:hover": { opacity: 1 } }}
        >
          <DocumentIcon fontSize="small" sx={{ color: "text.secondary" }} />
        </IconButton>
      </span>
    </Tooltip>
  );
}

function getConnectionIcon(node: MenuTreeNode) {
  const { document, maplink, link } = node.data;
  if (document) return null;
  if (maplink)
    return (
      <Tooltip title={maplink} slotProps={tooltipSlotProps}>
        <MapIcon fontSize="small" sx={{ color: "text.secondary" }} />
      </Tooltip>
    );
  if (link)
    return (
      <Tooltip title={link} slotProps={tooltipSlotProps}>
        <LinkIcon fontSize="small" sx={{ color: "text.secondary" }} />
      </Tooltip>
    );
  return null;
}

export const MenuTreeNodeRenderer = React.forwardRef<
  HTMLDivElement,
  MenuTreeNodeProps
>(function MenuTreeNodeRenderer(
  {
    style,
    node,
    dragHandle,
    onDelete,
    onAddChild,
    onOpenDocument,
    toolId,
    selectedId,
  },
  ref
) {
  const { t } = useTranslation();
  const isSelected = node.id === selectedId;
  const isValid = isNodeValid(node.data);
  const { materialUiIconName } = node.data.data.icon;
  const { document, folder, maplink, link } = node.data.data;
  const title = node.data.data.title || (
    <em style={{ opacity: 0.5 }}>
      {t("tools.documenthandler.menuEditor.untitled")}
    </em>
  );
  const connectionIcon = getConnectionIcon(node.data);
  const hasConnection =
    !!document.trim() || !!maplink.trim() || !!link.trim();
  const invalidNodeWarning = t(
    "tools.documenthandler.menuEditor.invalidNodeWarning"
  );

  return (
    <Box
      ref={ref}
      style={style}
      sx={(theme) => ({
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: 0.25,
        borderRadius: 1,
        cursor: "pointer",
        backgroundColor: isSelected
          ? theme.palette.action.selected
          : "transparent",
        "&:hover": {
          backgroundColor: isSelected
            ? theme.palette.action.selected
            : theme.palette.action.hover,
        },
        border: !isValid
          ? `1px solid ${theme.palette.warning.main}`
          : "1px solid transparent",
      })}
      onClick={() => node.select()}
    >
      {/* Drag handle */}
      <Box
        ref={dragHandle}
        sx={{ cursor: "grab", display: "flex", color: "text.disabled", flexShrink: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <DragIndicator fontSize="small" />
      </Box>

      {/* Expand toggle (fixed-width slot so leaf nodes align with parents) */}
      <Box
        onClick={(e) => {
          if (node.data.children.length === 0) return;
          e.stopPropagation();
          node.toggle();
        }}
        sx={{
          width: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: node.data.children.length > 0 ? "pointer" : "default",
          fontSize: 12,
          color: "text.secondary",
          transition: "transform 150ms",
          transform: node.isOpen ? "rotate(90deg)" : "rotate(0deg)",
          flexShrink: 0,
        }}
      >
        {node.data.children.length > 0 ? "▶" : ""}
      </Box>

      {/* Material icon preview */}
      <Box sx={{ display: "flex", flexShrink: 0, mr: 0.5 }}>
        {materialUiIconName ? (
          <Icon
            sx={{
              fontSize: 18,
              color: node.data.data.color || "text.primary",
            }}
          >
            {materialUiIconName}
          </Icon>
        ) : (
          <Box
            sx={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              backgroundColor: node.data.data.color || "transparent",
              border: node.data.data.color
                ? "none"
                : "1px dashed rgba(0,0,0,0.2)",
            }}
          />
        )}
      </Box>

      {/* Title */}
      <Typography
        variant="body2"
        sx={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontWeight: node.data.children.length > 0 ? 600 : 400,
        }}
      >
        {title}
      </Typography>

      {/* Connection indicator */}
      {document ? (
        <Box sx={{ display: "flex", flexShrink: 0 }}>
          <MenuTreeDocumentIcon
            toolId={toolId}
            document={document}
            folder={folder}
            onOpenDocument={onOpenDocument}
          />
        </Box>
      ) : (
        connectionIcon && (
          <Box sx={{ display: "flex", flexShrink: 0 }}>{connectionIcon}</Box>
        )
      )}

      {/* Validation warning */}
      {!isValid && (
        <Tooltip title={invalidNodeWarning}>
          <WarningIcon
            fontSize="small"
            color="warning"
            sx={{ flexShrink: 0 }}
          />
        </Tooltip>
      )}

      {/* Actions */}
      <Box
        sx={{ display: "flex", gap: 0, flexShrink: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Tooltip
          title={
            hasConnection
              ? invalidNodeWarning
              : t("tools.documenthandler.menuEditor.addChild")
          }
        >
          <span>
            <IconButton
              size="small"
              disabled={hasConnection}
              onClick={() => onAddChild(node.id)}
              sx={{ opacity: 0.6, "&:hover": { opacity: 1 } }}
            >
              <AddChildIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={t("common.delete")}>
          <IconButton
            size="small"
            onClick={() => onDelete(node.id)}
            sx={{ opacity: 0.6, "&:hover": { opacity: 1 } }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
});
