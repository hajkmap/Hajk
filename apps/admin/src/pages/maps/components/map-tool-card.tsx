import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import AdsClickIcon from "@mui/icons-material/AdsClick";
import BlockIcon from "@mui/icons-material/Block";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useDrag } from "react-dnd";
import { useTranslation } from "react-i18next";
import type { ToolWindowPosition } from "../../../api/maps";
import { toolLabels, type ToolWindowSize } from "../map-tools-utils";
import { MAP_TOOL_DND_TYPE, type MapToolDragItem } from "../map-tools-layout";
import type { BoardTool } from "../map-tools-board-model";
import MapToolWindowSettings from "./map-tool-window-settings";

interface MapToolCardProps {
  tool: BoardTool;
  orderNumber?: number;
  onRemove: (toolId: number) => void;
  onOpenSettings: (toolId: number) => void;
  onWindowPositionChange: (
    toolId: number,
    position: ToolWindowPosition,
  ) => void;
  onWindowSizeChange: (toolId: number, size: Partial<ToolWindowSize>) => void;
  onPendingSizeChange: (
    toolId: number,
    dimension: "width" | "height",
    nextValue: number | undefined,
    committedValue: number | undefined,
  ) => void;
  clickPicked?: boolean;
  inMoveZone?: boolean;
  clickMode?: boolean;
  /** A click-and-drop is in progress, so the summary must stay as it is. */
  placementActive?: boolean;
}

function MapToolCard({
  tool,
  orderNumber,
  onRemove,
  onOpenSettings,
  onWindowPositionChange,
  onWindowSizeChange,
  onPendingSizeChange,
  clickPicked = false,
  inMoveZone = false,
  clickMode = false,
  placementActive = false,
}: MapToolCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [iconTip, setIconTip] = useState({ open: false, inMoveZone: false });
  const iconTipTimer = useRef<number | null>(null);
  const suppressIconTipUntil = useRef(0);
  const clearIconTip = useCallback(() => {
    if (iconTipTimer.current != null) {
      window.clearTimeout(iconTipTimer.current);
      iconTipTimer.current = null;
    }
    setIconTip((tip) => (tip.open ? { ...tip, open: false } : tip));
  }, []);
  const dismissIconTip = useCallback(() => {
    suppressIconTipUntil.current = Date.now() + 500;
    clearIconTip();
  }, [clearIconTip]);
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: MAP_TOOL_DND_TYPE,
      item: () => {
        dismissIconTip();
        return { toolId: tool.toolId } satisfies MapToolDragItem;
      },
      end: () => {
        dismissIconTip();
      },
      canDrag: tool.draggable && !inMoveZone && !clickMode,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [clickMode, dismissIconTip, tool.draggable, tool.toolId, inMoveZone],
  );
  const iconTipVisible =
    iconTip.open && !isDragging && iconTip.inMoveZone === inMoveZone;

  const setCardRef = useCallback(
    (node: HTMLDivElement | null) => {
      preview(node);
    },
    [preview],
  );

  useEffect(() => {
    return () => {
      if (iconTipTimer.current != null) {
        window.clearTimeout(iconTipTimer.current);
      }
    };
  }, []);

  const canDragCard = tool.draggable && !inMoveZone && !clickMode;
  const setRowRef = useCallback(
    (node: HTMLDivElement | null) => {
      drag(canDragCard ? node : null);
    },
    [canDragCard, drag],
  );

  const showWindow =
    tool.showWindowPosition || tool.showWindowWidth || tool.showWindowHeight;
  const { typeName, hasTitle, label: primaryLabel } = toolLabels(tool, t);

  return (
    <Box
      ref={setCardRef}
      data-tool-card=""
      data-tool-id={tool.toolId}
      sx={{
        border: "1px solid",
        borderColor: clickPicked || expanded ? "primary.main" : "divider",
        outline: clickPicked ? "2px solid" : "none",
        outlineColor: "primary.main",
        borderRadius: 1.5,
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "grey.900" : "grey.50",
        opacity: isDragging ? 0.4 : 1,
        cursor: clickMode && !inMoveZone ? "pointer" : undefined,
        transition: "opacity 120ms ease, border-color 120ms ease",
        "&:hover": {
          borderColor:
            clickPicked || expanded
              ? "primary.main"
              : (theme) =>
                  theme.palette.mode === "dark" ? "grey.700" : "grey.400",
        },
        "&:hover .tool-card-actions, &:focus-within .tool-card-actions": {
          opacity: 1,
        },
      }}
    >
      <Box
        ref={setRowRef}
        onDragStart={dismissIconTip}
        onDragEnd={dismissIconTip}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          pl: 0.5,
          pr: 0.25,
          py: 0.75,
          cursor: canDragCard ? "grab" : undefined,
          "&:active": { cursor: canDragCard ? "grabbing" : undefined },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            alignSelf: "stretch",
            flexShrink: 0,
          }}
        >
          {tool.draggable ? (
            <Tooltip
              key={inMoveZone ? "move-zone" : "column"}
              open={iconTipVisible}
              disableHoverListener
              disableFocusListener
              disableTouchListener
              title={
                inMoveZone
                  ? t("maps.toolsMoveZoneLocked")
                  : clickMode
                    ? t("maps.toolsInteractionClick")
                    : t("maps.toolsDragHandle")
              }
              enterDelay={600}
            >
              <Box
                role="button"
                aria-disabled={inMoveZone}
                onMouseEnter={() => {
                  if (isDragging || Date.now() < suppressIconTipUntil.current) {
                    return;
                  }
                  if (iconTipTimer.current != null) {
                    window.clearTimeout(iconTipTimer.current);
                  }
                  iconTipTimer.current = window.setTimeout(() => {
                    setIconTip({ open: true, inMoveZone });
                  }, 600);
                }}
                onMouseLeave={clearIconTip}
                aria-label={
                  inMoveZone
                    ? t("maps.toolsMoveZoneLocked")
                    : clickMode
                      ? t("maps.toolsInteractionClick")
                      : t("maps.toolsDragHandle")
                }
                sx={{
                  display: "flex",
                  alignItems: "center",
                  alignSelf: "stretch",
                  px: 0.25,
                  borderRadius: 1,
                  color: inMoveZone ? "action.disabled" : "text.disabled",
                  cursor: inMoveZone
                    ? "not-allowed"
                    : clickMode
                      ? "pointer"
                      : "grab",
                  touchAction: "none",
                  userSelect: "none",
                  "&:hover": inMoveZone
                    ? undefined
                    : {
                        color: "text.secondary",
                        bgcolor: "action.hover",
                      },
                  "&:active": {
                    cursor: inMoveZone
                      ? "not-allowed"
                      : clickMode
                        ? "pointer"
                        : "grabbing",
                  },
                }}
              >
                {inMoveZone ? (
                  <BlockIcon fontSize="small" />
                ) : clickMode ? (
                  <AdsClickIcon fontSize="small" />
                ) : (
                  <DragIndicatorIcon fontSize="small" />
                )}
              </Box>
            </Tooltip>
          ) : (
            <Box sx={{ width: 24, flexShrink: 0 }} />
          )}
        </Box>
        {orderNumber != null ? (
          <Box
            sx={{
              minWidth: 20,
              height: 20,
              px: 0.5,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              bgcolor: "action.selected",
              color: "text.secondary",
              typography: "caption",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {orderNumber}
          </Box>
        ) : null}
        <Box
          sx={{
            minWidth: 0,
            flex: 1,
            pl: 0.25,
            display: "flex",
            alignItems: "center",
            gap: 0.75,
          }}
        >
          <Typography
            variant="subtitle2"
            title={primaryLabel}
            noWrap
            sx={{
              lineHeight: 1.3,
              flex: 1,
              minWidth: 0,
            }}
          >
            {primaryLabel}
          </Typography>
          {tool.showUnplacedChip ? (
            <Chip
              size="small"
              label={t("maps.toolPlacement.unplaced")}
              color="warning"
              variant="outlined"
              sx={{ height: 20, flexShrink: 0, "& .MuiChip-label": { px: 0.75 } }}
            />
          ) : null}
          {inMoveZone ? (
            <Chip
              size="small"
              label={t("layerTree.moveZone.title")}
              color="primary"
              variant="outlined"
              sx={{ height: 20, flexShrink: 0, "& .MuiChip-label": { px: 0.75 } }}
            />
          ) : null}
        </Box>
        <Box
          className="tool-card-actions"
          sx={{
            display: "flex",
            flexShrink: 0,
            opacity: { xs: 1, md: 0.55 },
            transition: "opacity 120ms ease",
          }}
        >
          <Tooltip title={t("common.settings")}>
            <IconButton
              size="small"
              type="button"
              aria-label={t("common.settings")}
              onDragStart={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={() => onOpenSettings(tool.toolId)}
              sx={{ p: 0.5 }}
            >
              <SettingsOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("maps.toolsRemoveFromMap")}>
            <IconButton
              size="small"
              type="button"
              aria-label={t("maps.toolsRemoveFromMap")}
              onDragStart={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={() => onRemove(tool.toolId)}
              sx={{ p: 0.5, "&:hover": { color: "error.main" } }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      {showWindow ? (
        <MapToolWindowSettings
          tool={tool}
          expanded={expanded}
          onToggle={() => setExpanded((open) => !open)}
          summaryLead={hasTitle ? typeName : null}
          placementActive={placementActive}
          onWindowPositionChange={onWindowPositionChange}
          onWindowSizeChange={onWindowSizeChange}
          onPendingSizeChange={onPendingSizeChange}
        />
      ) : null}
    </Box>
  );
}

export default memo(MapToolCard);
