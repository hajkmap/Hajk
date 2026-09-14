import type { MouseEvent } from "react";
import { memo } from "react";
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
  isSubtreeHovered?: boolean;
  clickMode?: boolean;
  /** Position of this row in the continuous click-pick highlight frame. */
  clickPickEdge?: "only" | "start" | "middle" | "end" | null;
  /** Show drop line before/after this row at the given tree depth (null = hidden). */
  clickPlaceLineDepth?: number | null;
  clickPlaceLinePosition?: "before" | "after";
  onClickInteract?: (
    nodeId: GroupLayerTreeNode["id"],
    additive: boolean,
  ) => void;
  onHoverSubtree?: (nodeId: GroupLayerTreeNode["id"]) => void;
  onToggleLayerVisibility: (nodeId: GroupLayerTreeNode["id"]) => void;
  onToggleGroupVisibility: (nodeId: GroupLayerTreeNode["id"]) => void;
  onAddToGroup?: (nodeId: GroupLayerTreeNode["id"]) => void;
  onRemoveFromTree?: (nodeId: GroupLayerTreeNode["id"]) => void;
  onEditGroupMetadata?: (nodeId: GroupLayerTreeNode["id"]) => void;
  onEditLayerSettings?: (nodeId: GroupLayerTreeNode["id"]) => void;
}

function GroupLayerTreeNodeView({
  node,
  options,
  treeData,
  visibleIds,
  groupDisplaySettings,
  isSubtreeHovered = false,
  clickMode = false,
  clickPickEdge = null,
  clickPlaceLineDepth = null,
  clickPlaceLinePosition = "after",
  onClickInteract,
  onHoverSubtree,
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

  const rowCursor = clickMode ? "pointer" : isDragging ? "grabbing" : "grab";

  const isClickPicked = clickPickEdge != null;
  const suppressRowDivider =
    clickPickEdge === "start" || clickPickEdge === "middle";

  const handleRowClick = (event: MouseEvent) => {
    if (clickMode) {
      onClickInteract?.(node.id, event.ctrlKey || event.metaKey);
      return;
    }
    if (isGroup) {
      onToggle();
    }
  };

  const frameBorder = (edge: boolean) =>
    edge
      ? (theme: { palette: { primary: { main: string } } }) =>
          `2px solid ${theme.palette.primary.main}`
      : "none";

  return (
    <Box
      onMouseEnter={() => {
        onHoverSubtree?.(node.id);
      }}
      sx={{
        opacity: isDragging ? 0.45 : 1,
        bgcolor: isSubtreeHovered
          ? "action.hover"
          : isClickPicked
            ? "action.selected"
            : "transparent",
        borderLeft: frameBorder(isClickPicked),
        borderRight: frameBorder(isClickPicked),
        borderTop: frameBorder(
          clickPickEdge === "start" || clickPickEdge === "only",
        ),
        borderBottom: frameBorder(
          clickPickEdge === "end" || clickPickEdge === "only",
        ),
        borderTopLeftRadius:
          clickPickEdge === "start" || clickPickEdge === "only" ? 4 : 0,
        borderTopRightRadius:
          clickPickEdge === "start" || clickPickEdge === "only" ? 4 : 0,
        borderBottomLeftRadius:
          clickPickEdge === "end" || clickPickEdge === "only" ? 4 : 0,
        borderBottomRightRadius:
          clickPickEdge === "end" || clickPickEdge === "only" ? 4 : 0,
        boxSizing: "border-box",
      }}
    >
      {clickPlaceLineDepth != null && clickPlaceLinePosition === "before" ? (
        <Box
          aria-hidden
          sx={{
            height: 2,
            ml: `${clickPlaceLineDepth * 20 + 28}px`,
            mr: 1,
            my: 0.125,
            bgcolor: "primary.main",
            borderRadius: 1,
          }}
        />
      ) : null}
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
          pl: isGroup ? `${depth * 20}px` : `${31 + depth * 20}px`,
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
            cursor: rowCursor,
          }}
        >
          <DragIndicatorOutlinedIcon fontSize="small" />
        </Box>

        {isGroup ? (
          <ListItemButton
            disableTouchRipple
            onClick={handleRowClick}
            dense
            sx={{
              flex: 1,
              alignItems: "flex-start",
              p: 0,
              pl: "2px",
              position: "relative",
              cursor: rowCursor,
              borderBottom: (theme) =>
                suppressRowDivider
                  ? "none"
                  : `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
              "&:hover": {
                backgroundColor: "transparent",
              },
              "& .ls-arrow": {
                transform: isOpen ? "rotate(90deg)" : "none",
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
              disableRipple
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
            onClick={handleRowClick}
            sx={{
              flex: 1,
              p: 0,
              pl: "2px",
              position: "relative",
              cursor: rowCursor,
              "&:hover": {
                backgroundColor: "transparent",
              },
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
                  suppressRowDivider
                    ? "none"
                    : `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
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
      {clickPlaceLineDepth != null && clickPlaceLinePosition === "after" ? (
        <Box
          aria-hidden
          sx={{
            height: 2,
            ml: `${clickPlaceLineDepth * 20 + 28}px`,
            mr: 1,
            my: 0.125,
            bgcolor: "primary.main",
            borderRadius: 1,
          }}
        />
      ) : null}
    </Box>
  );
}

function areNodePropsEqual(
  prev: GroupLayerTreeNodeProps,
  next: GroupLayerTreeNodeProps,
): boolean {
  return (
    prev.node === next.node &&
    prev.treeData === next.treeData &&
    prev.visibleIds === next.visibleIds &&
    prev.groupDisplaySettings === next.groupDisplaySettings &&
    prev.isSubtreeHovered === next.isSubtreeHovered &&
    prev.clickMode === next.clickMode &&
    prev.clickPickEdge === next.clickPickEdge &&
    prev.clickPlaceLineDepth === next.clickPlaceLineDepth &&
    prev.clickPlaceLinePosition === next.clickPlaceLinePosition &&
    prev.options.depth === next.options.depth &&
    prev.options.isOpen === next.options.isOpen &&
    prev.options.isDragging === next.options.isDragging &&
    prev.onHoverSubtree === next.onHoverSubtree &&
    prev.onClickInteract === next.onClickInteract &&
    prev.onToggleLayerVisibility === next.onToggleLayerVisibility &&
    prev.onToggleGroupVisibility === next.onToggleGroupVisibility &&
    prev.onAddToGroup === next.onAddToGroup &&
    prev.onRemoveFromTree === next.onRemoveFromTree &&
    prev.onEditGroupMetadata === next.onEditGroupMetadata &&
    prev.onEditLayerSettings === next.onEditLayerSettings
  );
}

export default memo(GroupLayerTreeNodeView, areNodePropsEqual);
