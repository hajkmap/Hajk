import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  ButtonBase,
  Chip,
  Collapse,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import AdsClickIcon from "@mui/icons-material/AdsClick";
import BlockIcon from "@mui/icons-material/Block";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WebAssetOutlinedIcon from "@mui/icons-material/WebAssetOutlined";
import { useDrag } from "react-dnd";
import { useTranslation } from "react-i18next";
import type { ToolWindowPosition } from "../../../api/maps";
import type { ToolWindowSize } from "../map-tools-utils";
import { MAP_TOOL_DND_TYPE, type MapToolDragItem } from "../map-tools-layout";
import type { BoardTool } from "../map-tools-board-model";
import WindowSizeField from "./map-tool-window-fields";

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
  const showSize = tool.showWindowWidth || tool.showWindowHeight;
  const auto = t("maps.toolsSizeAuto");
  const width = tool.windowWidth ?? tool.defaultWidth;
  const height = tool.windowHeight ?? tool.defaultHeight;
  const hasTitle = tool.title.trim() !== "" && tool.title !== tool.type;
  const primaryLabel = hasTitle ? tool.title : tool.type || tool.title;
  const summary = [
    hasTitle ? tool.type : null,
    tool.showWindowPosition
      ? t(`maps.windowPlacement.${tool.windowPosition}`)
      : null,
    showSize
      ? `${tool.showWindowWidth ? (width ?? auto) : "–"} × ${
          tool.showWindowHeight ? (height ?? auto) : "–"
        }`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

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
              fontSize: "0.7rem",
              fontWeight: 700,
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
            title={primaryLabel}
            noWrap
            sx={{
              fontWeight: 600,
              fontSize: "0.9rem",
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
        <>
          <ButtonBase
            type="button"
            aria-expanded={expanded}
            aria-disabled={placementActive}
            aria-label={t("maps.toolsWindowSettings")}
            onClick={(event) => {
              event.stopPropagation();
              if (placementActive) return;
              setExpanded((open) => !open);
            }}
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.25,
              py: 0.6,
              borderTop: "1px solid",
              borderColor: "divider",
              color: "text.secondary",
              textAlign: "left",
              cursor: placementActive ? "default" : undefined,
              "&:hover": placementActive
                ? undefined
                : { bgcolor: "action.hover", color: "text.primary" },
            }}
          >
            <WebAssetOutlinedIcon sx={{ fontSize: 16, flexShrink: 0 }} />
            <Typography
              variant="caption"
              noWrap
              sx={{ flex: 1, minWidth: 0, fontVariantNumeric: "tabular-nums" }}
            >
              {summary}
            </Typography>
            <ExpandMoreIcon
              sx={{
                fontSize: 18,
                flexShrink: 0,
                transform: expanded ? "rotate(180deg)" : "none",
                transition: "transform 150ms ease",
              }}
            />
          </ButtonBase>
          <Collapse in={expanded} unmountOnExit>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.25,
                px: 1.25,
                pt: 0.5,
                pb: 1.25,
              }}
            >
              {tool.showWindowPosition ? (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 0.5 }}
                  >
                    {t("maps.toolsWindowPlacement")}
                  </Typography>
                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    size="small"
                    value={tool.windowPosition}
                    onChange={(_, next) => {
                      const position: ToolWindowPosition | null =
                        next === "left"
                          ? "left"
                          : next === "right"
                            ? "right"
                            : null;
                      if (position != null) {
                        onWindowPositionChange(tool.toolId, position);
                      }
                    }}
                    sx={{
                      "& .MuiToggleButton-root": {
                        py: 0.4,
                        textTransform: "none",
                      },
                    }}
                  >
                    <ToggleButton value="left">
                      {t("maps.windowPlacement.left")}
                    </ToggleButton>
                    <ToggleButton value="right">
                      {t("maps.windowPlacement.right")}
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              ) : null}
              {showSize ? (
                <Box sx={{ display: "flex", gap: 1 }}>
                  {tool.showWindowWidth ? (
                    <WindowSizeField
                      label={t("tools.width")}
                      value={tool.windowWidth}
                      placeholder={
                        tool.defaultWidth != null
                          ? String(tool.defaultWidth)
                          : auto
                      }
                      onCommit={(next) =>
                        onWindowSizeChange(tool.toolId, { width: next })
                      }
                      onPendingChange={(next, committed) =>
                        onPendingSizeChange(
                          tool.toolId,
                          "width",
                          next,
                          committed,
                        )
                      }
                    />
                  ) : null}
                  {tool.showWindowHeight ? (
                    <WindowSizeField
                      label={t("tools.height")}
                      value={tool.windowHeight}
                      placeholder={
                        tool.defaultHeight != null
                          ? String(tool.defaultHeight)
                          : auto
                      }
                      onCommit={(next) =>
                        onWindowSizeChange(tool.toolId, { height: next })
                      }
                      onPendingChange={(next, committed) =>
                        onPendingSizeChange(
                          tool.toolId,
                          "height",
                          next,
                          committed,
                        )
                      }
                    />
                  ) : null}
                </Box>
              ) : null}
            </Box>
          </Collapse>
        </>
      ) : null}
    </Box>
  );
}

export default memo(MapToolCard);
