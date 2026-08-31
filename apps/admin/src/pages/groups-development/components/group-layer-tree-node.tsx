import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import KeyboardArrowRightOutlinedIcon from "@mui/icons-material/KeyboardArrowRightOutlined";
import DragIndicatorOutlinedIcon from "@mui/icons-material/DragIndicatorOutlined";
import LayersClearIcon from "@mui/icons-material/LayersClear";
import LayersIcon from "@mui/icons-material/Layers";
import MoreOutlinedIcon from "@mui/icons-material/MoreOutlined";
import {
  Box,
  IconButton,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";
import type { RenderParams } from "@minoru/react-dnd-treeview";

import { useTranslation } from "react-i18next";

import type { GroupDisplaySettings, GroupLayerTreeNode } from "../types";
import { DEFAULT_GROUP_DISPLAY_SETTINGS } from "../types";
import LayerSwitcherCheckbox, {
  type LayerSwitcherToggleState,
} from "./layer-switcher-checkbox";
import {
  getGroupToggleState,
  isGroupActive,
  isLayerVisible,
} from "../utils/tree-visibility";

interface GroupLayerTreeNodeProps {
  node: GroupLayerTreeNode;
  options: RenderParams;
  treeData: GroupLayerTreeNode[];
  visibleIds: Set<string>;
  groupDisplaySettings: Record<string, GroupDisplaySettings>;
  onToggleLayerVisibility: (nodeId: GroupLayerTreeNode["id"]) => void;
  onToggleGroupVisibility: (nodeId: GroupLayerTreeNode["id"]) => void;
  onAddToGroup?: (nodeId: GroupLayerTreeNode["id"]) => void;
  onRemoveFromTree?: (nodeId: GroupLayerTreeNode["id"]) => void;
  onEditGroupMetadata?: (nodeId: GroupLayerTreeNode["id"]) => void;
  onEditLayerSettings?: (nodeId: GroupLayerTreeNode["id"]) => void;
}

export default function GroupLayerTreeNodeView({
  node,
  options,
  treeData,
  visibleIds,
  groupDisplaySettings,
  onToggleLayerVisibility,
  onToggleGroupVisibility,
  onAddToGroup,
  onRemoveFromTree,
  onEditGroupMetadata,
  onEditLayerSettings,
}: GroupLayerTreeNodeProps) {
  const { t } = useTranslation();
  const { depth, isOpen, onToggle, isDragging } = options;
  const isGroup = node.data?.kind === "group";
  const isVisible = isLayerVisible(visibleIds, node.id);

  const groupToggleState: LayerSwitcherToggleState = isGroup
    ? getGroupToggleState(treeData, node.id, visibleIds)
    : "unchecked";

  const layerToggleState: LayerSwitcherToggleState = isVisible
    ? "checked"
    : "unchecked";

  const rowIsActive = isGroup
    ? isGroupActive(treeData, node.id, visibleIds)
    : isVisible;

  const groupHasChildren =
    isGroup && treeData.some((entry) => entry.parent === node.id);
  const showGroupToggle =
    !isGroup ||
    (node.data?.sourceId
      ? (groupDisplaySettings[node.data.sourceId]?.toggled ??
        DEFAULT_GROUP_DISPLAY_SETTINGS.toggled)
      : true);

  return (
    <Box
      sx={{
        opacity: isDragging ? 0.45 : 1,
        pl: isGroup ? `${depth * 20}px` : `${31 + depth * 20}px`,
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        <Box
          aria-hidden
          sx={{
            display: "flex",
            alignItems: "center",
            px: 0,
            pt: "7px",
            flexShrink: 0,
            color: "action.active",
            cursor: isDragging ? "grabbing" : "grab",
          }}
        >
          <DragIndicatorOutlinedIcon fontSize="small" />
        </Box>

        {isGroup ? (
          <ListItemButton
            disableTouchRipple
            onClick={onToggle}
            dense
            sx={{
              flex: 1,
              alignItems: "flex-start",
              p: 0,
              pl: "2px",
              position: "relative",
              cursor: isDragging ? "grabbing" : "grab",
              borderBottom: (theme) =>
                `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
              "& .ls-arrow": {
                transform: isOpen ? "rotate(90deg)" : "none",
                transition: "transform 300ms ease",
              },
              "&:hover .ls-arrow": {
                transform: isOpen
                  ? "rotate(90deg) translateX(-3px)"
                  : "translateX(3px)",
              },
            }}
          >
            <IconButton
              size="small"
              onMouseDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
                onToggle();
              }}
              aria-label={isOpen ? "Collapse group" : "Expand group"}
              sx={{
                mt: "2px",
                pl: "3px",
                pr: "4px",
                "&:hover": {
                  backgroundColor: "transparent",
                },
              }}
            >
              <KeyboardArrowRightOutlinedIcon
                className="ls-arrow"
                fontSize="small"
              />
            </IconButton>

            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                width: "100%",
                py: 0.25,
                pr: 1,
              }}
            >
              {showGroupToggle ? (
                <LayerSwitcherCheckbox
                  toggleState={groupToggleState}
                  ariaLabel={`Toggle all layers in ${node.text}`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onToggleGroupVisibility(node.id);
                  }}
                />
              ) : null}

              {!groupHasChildren ? (
                <LayersClearIcon
                  aria-hidden
                  titleAccess={t("groupsDevelopment.emptyGroup")}
                  sx={{
                    display: "block",
                    mr: "5px",
                    mt: "6px",
                    width: 18,
                    height: 18,
                    color: "action.active",
                    flexShrink: 0,
                  }}
                />
              ) : null}

              <ListItemText
                primary={node.text}
                slotProps={{
                  primary: {
                    variant: "body1",
                    sx: {
                      fontWeight: rowIsActive ? "bold" : "inherit",
                      pr: 5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    },
                  },
                }}
              />
            </Box>

            {onAddToGroup || onRemoveFromTree || onEditGroupMetadata ? (
              <ListItemSecondaryAction
                sx={{
                  right: 4,
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {onEditGroupMetadata ? (
                  <IconButton
                    size="small"
                    aria-label={t("groupsDevelopment.editGroup")}
                    title={t("groupsDevelopment.editGroup")}
                    sx={{ mt: "1px", cursor: "pointer" }}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditGroupMetadata(node.id);
                    }}
                  >
                    <MoreOutlinedIcon
                      sx={{
                        width: "0.7em",
                        height: "0.7em",
                        transform: "rotate(180deg)",
                        color: "grey.500",
                      }}
                    />
                  </IconButton>
                ) : null}
                {onAddToGroup ? (
                  <IconButton
                    size="small"
                    aria-label={t("common.addToGroup")}
                    title={t("common.addToGroup")}
                    sx={{ mt: "1px", cursor: "pointer" }}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      onAddToGroup(node.id);
                    }}
                  >
                    <AddIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                ) : null}
                {onRemoveFromTree ? (
                  <IconButton
                    size="small"
                    aria-label={t("groupsDevelopment.removeFromTree")}
                    title={t("groupsDevelopment.removeFromTree")}
                    sx={{ mt: "1px", cursor: "pointer" }}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemoveFromTree(node.id);
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                ) : null}
              </ListItemSecondaryAction>
            ) : null}
          </ListItemButton>
        ) : (
          <ListItemButton
            disableTouchRipple
            dense
            sx={{
              flex: 1,
              p: 0,
              pl: "2px",
              position: "relative",
              cursor: isDragging ? "grabbing" : "grab",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                width: "100%",
                py: 0.25,
                pr: 1,
                borderBottom: (theme) =>
                  `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
              }}
            >
              <LayerSwitcherCheckbox
                toggleState={layerToggleState}
                ariaLabel={`Toggle ${node.text}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onToggleLayerVisibility(node.id);
                }}
              />

              <LayersIcon
                sx={{
                  display: "block",
                  mr: "5px",
                  mt: "6px",
                  width: 18,
                  height: 18,
                  color: "action.active",
                }}
              />

              <ListItemText
                primary={node.text}
                slotProps={{
                  primary: {
                    variant: "body1",
                    sx: {
                      fontWeight: rowIsActive ? "bold" : "inherit",
                      pr: 5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    },
                  },
                }}
              />
            </Box>

            <ListItemSecondaryAction
              sx={{
                right: 4,
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
              }}
            >
              {onEditLayerSettings ? (
                <IconButton
                  size="small"
                  aria-label={t("groupsDevelopment.editLayer")}
                  title={t("groupsDevelopment.editLayer")}
                  sx={{ mt: "1px", cursor: "pointer" }}
                  onMouseDown={(event) => {
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onEditLayerSettings(node.id);
                  }}
                >
                  <MoreOutlinedIcon
                    sx={{
                      width: "0.7em",
                      height: "0.7em",
                      transform: "rotate(180deg)",
                      color: "grey.500",
                    }}
                  />
                </IconButton>
              ) : null}
              {onRemoveFromTree ? (
                <IconButton
                  size="small"
                  aria-label={t("groupsDevelopment.removeLayerFromTree")}
                  title={t("groupsDevelopment.removeLayerFromTree")}
                  sx={{ mt: "1px", cursor: "pointer" }}
                  onMouseDown={(event) => {
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemoveFromTree(node.id);
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              ) : null}
            </ListItemSecondaryAction>
          </ListItemButton>
        )}
      </Box>
    </Box>
  );
}
