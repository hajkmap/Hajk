import CreateNewFolderOutlinedIcon from "@mui/icons-material/CreateNewFolderOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FolderIcon from "@mui/icons-material/Folder";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import LayersIcon from "@mui/icons-material/Layers";
import LinkIcon from "@mui/icons-material/Link";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import SyncProblemIcon from "@mui/icons-material/SyncProblem";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import LayerTreeItemTooltip from "./layer-tree-item-tooltip";
import type { LayerTreeFlatNode } from "./layer-tree-model";
import type { LayerTreeItemDetails } from "./use-item-details";

interface LayerTreeRowProps {
  node: LayerTreeFlatNode;
  details: LayerTreeItemDetails;
  depth: number;
  isOpen: boolean;
  hasChild: boolean;
  isDragging: boolean;
  /** Can't be dragged, e.g. the content of a linked group in a map. */
  fixed: boolean;
  /** A linked group: its content is edited on the group itself. */
  locked: boolean;
  /** Part of a linked group's own content: the name of that group. */
  from?: string;
  /** A layer straight in a map's tree, which the client can't show. */
  misplaced?: boolean;
  layerCount?: number;
  onToggle: () => void;
  onRemove?: () => void;
  onEditGroup?: () => void;
  /** Adds a new group inside this one. */
  onNewGroup?: () => void;
  /** Map mode: hides one of a group's own items on the map, or shows it. */
  onToggleHidden?: () => void;
  /** Map mode: hidden with a group above it; the name of that group. */
  hiddenWith?: string;
}

export default function LayerTreeRow({
  node,
  details,
  depth,
  isOpen,
  hasChild,
  isDragging,
  fixed,
  locked,
  from,
  misplaced = false,
  layerCount,
  onToggle,
  onRemove,
  onEditGroup,
  onNewGroup,
  onToggleHidden,
  hiddenWith,
}: LayerTreeRowProps) {
  const { t } = useTranslation();
  const isGroup = node.data.kind === "group";
  const isHidden = node.data.hidden === true || hiddenWith !== undefined;
  const canToggle = isGroup && hasChild;
  const usedIn = node.data.usedIn;
  const places = [
    usedIn?.groups
      ? t("layerTree.usedInGroups", { count: usedIn.groups })
      : null,
    usedIn?.maps ? t("layerTree.usedInMaps", { count: usedIn.maps }) : null,
  ].filter(Boolean);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        minHeight: 38,
        pl: `${depth * 24}px`,
        pr: 0.5,
        borderBottom: 1,
        borderColor: "divider",
        opacity: isDragging ? 0.4 : 1,
        cursor: fixed ? "default" : "grab",
      }}
    >
      {/* What comes from a linked group shows a link where yours can be
          dragged, and is toned down. */}
      {from ? (
        <Tooltip title={t("layerTree.borrowedFrom", { group: from })}>
          <LinkIcon fontSize="small" sx={{ color: "text.disabled" }} />
        </Tooltip>
      ) : (
        <DragIndicatorIcon
          fontSize="small"
          sx={{
            color: "action.active",
            visibility: fixed ? "hidden" : "visible",
          }}
        />
      )}
      {isGroup ? (
        <IconButton
          size="small"
          onClick={onToggle}
          disabled={!hasChild}
          aria-label={isOpen ? "Collapse group" : "Expand group"}
        >
          <KeyboardArrowRightIcon
            fontSize="small"
            sx={{
              transform: isOpen ? "rotate(90deg)" : "none",
              transition: "transform 0.15s",
            }}
          />
        </IconButton>
      ) : (
        <Box sx={{ width: 30, flexShrink: 0 }} />
      )}
      {isGroup ? (
        <FolderIcon
          fontSize="small"
          color="primary"
          sx={{ opacity: from ? 0.5 : 1 }}
        />
      ) : (
        <LayersIcon
          fontSize="small"
          color="action"
          sx={{ opacity: from ? 0.5 : 1 }}
        />
      )}
      <LayerTreeItemTooltip name={node.text} details={details}>
        <Typography
          variant="body2"
          noWrap
          onClick={canToggle ? onToggle : undefined}
          sx={{
            flex: 1,
            minWidth: 0,
            color: from ? "text.secondary" : "text.primary",
            fontWeight: isGroup ? 500 : 400,
            opacity: isHidden ? 0.5 : 1,
            textDecoration: isHidden ? "line-through" : "none",
            cursor: canToggle ? "pointer" : "inherit",
          }}
        >
          {node.text}
        </Typography>
      </LayerTreeItemTooltip>
      {node.data.added ? (
        <Chip
          label={t("layerTree.addedBadge")}
          size="small"
          color="secondary"
          variant="outlined"
        />
      ) : null}
      {node.data.hidden ? (
        <Chip
          label={t("layerTree.hiddenBadge")}
          size="small"
          color="secondary"
          variant="outlined"
        />
      ) : null}
      {node.data.isNew ? (
        <Chip
          label={t("layerTree.newBadge")}
          size="small"
          color="primary"
          variant="outlined"
        />
      ) : null}
      {isGroup && layerCount !== undefined ? (
        <Typography variant="caption" color="text.secondary" noWrap>
          {t("layerTree.layerCount", { count: layerCount })}
        </Typography>
      ) : null}
      {places.length > 0 ? (
        <Typography variant="caption" color="text.secondary" noWrap>
          · {t("layerTree.usedIn", { places: places.join(", ") })}
        </Typography>
      ) : null}
      {misplaced ? (
        <Tooltip title={t("layerTree.layerOutsideGroup")}>
          <WarningAmberIcon fontSize="small" color="warning" />
        </Tooltip>
      ) : null}
      {node.data.cycle ? (
        <Tooltip title={t("layerTree.cycle")}>
          <SyncProblemIcon fontSize="small" color="warning" />
        </Tooltip>
      ) : null}
      {locked ? (
        <Tooltip title={t("layerTree.locked")}>
          <LockOutlinedIcon fontSize="small" sx={{ color: "action.active" }} />
        </Tooltip>
      ) : null}
      {hiddenWith ? (
        // Hidden with its group: the group's eye decides.
        <Tooltip title={t("layerTree.hiddenWithGroup", { group: hiddenWith })}>
          <span>
            <IconButton
              size="small"
              disabled
              aria-label={t("layerTree.hiddenWithGroup", { group: hiddenWith })}
            >
              <VisibilityOffOutlinedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      ) : onToggleHidden ? (
        <Tooltip
          title={t(
            node.data.hidden ? "layerTree.showInMap" : "layerTree.hideInMap",
          )}
        >
          <IconButton
            size="small"
            aria-label={t(
              node.data.hidden ? "layerTree.showInMap" : "layerTree.hideInMap",
            )}
            onClick={onToggleHidden}
          >
            {/* The eye shows the state: open while shown, struck when hidden. */}
            {node.data.hidden ? (
              <VisibilityOffOutlinedIcon fontSize="small" color="secondary" />
            ) : (
              <VisibilityOutlinedIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      ) : null}
      {onNewGroup ? (
        <Tooltip title={t("layerTree.newGroupHere")}>
          <IconButton
            size="small"
            aria-label={t("layerTree.newGroupHere")}
            onClick={onNewGroup}
          >
            <CreateNewFolderOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
      {onEditGroup ? (
        <Tooltip title={t("layerTree.editGroup")}>
          <IconButton
            size="small"
            aria-label={t("layerTree.editGroup")}
            onClick={onEditGroup}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
      {onRemove ? (
        <Tooltip title={t("layerTree.remove")}>
          <IconButton
            size="small"
            aria-label={t("layerTree.remove")}
            onClick={onRemove}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
    </Box>
  );
}
