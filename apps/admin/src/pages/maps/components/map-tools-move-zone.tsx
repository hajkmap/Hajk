import { useState } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import AdsClickIcon from "@mui/icons-material/AdsClick";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { useDrag, useDragLayer, useDrop } from "react-dnd";
import { useTranslation } from "react-i18next";
import { MAP_TOOL_DND_TYPE, type MapToolDragItem } from "../map-tools-layout";
import type { BoardTool } from "../map-tools-board-model";

export type MapToolsInteractionMode = "drag" | "click";

interface MapToolsMoveZoneProps {
  tools: BoardTool[];
  armedToolId?: number | null;
  clickMode?: boolean;
  /** Click-and-drop is armed and this zone can receive another tool. */
  clickPlaceActive?: boolean;
  onInteractionModeChange?: (mode: MapToolsInteractionMode) => void;
  onPick: (toolId: number) => void;
  onDropInZone: () => void;
  onArm: (toolId: number) => void;
  onCancel: (toolId: number) => void;
}

function zoneLabel(tool: BoardTool): string {
  const title = tool.title.trim();
  return title && title !== tool.type ? title : tool.type;
}

function HeldToolRow({
  tool,
  picked = false,
  clickMode = false,
  onArm,
  onCancel,
}: {
  tool: BoardTool;
  picked?: boolean;
  clickMode?: boolean;
  onArm: (toolId: number) => void;
  onCancel: (toolId: number) => void;
}) {
  const { t } = useTranslation();
  const label = zoneLabel(tool);
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: MAP_TOOL_DND_TYPE,
      item: { toolId: tool.toolId } satisfies MapToolDragItem,
      canDrag: !clickMode,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [clickMode, tool.toolId],
  );

  return (
    <Box
      ref={(node: HTMLDivElement | null) => {
        dragRef(node);
      }}
      onClick={(event) => {
        if (!clickMode) return;
        const target = event.target as HTMLElement;
        if (target.closest("button")) return;
        event.stopPropagation();
        onArm(tool.toolId);
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        px: 0.75,
        py: 0.75,
        border: "1px solid",
        borderColor: picked ? "primary.main" : "divider",
        outline: picked ? "2px solid" : "none",
        outlineColor: "primary.main",
        borderRadius: 1.5,
        bgcolor: "action.selected",
        opacity: isDragging ? 0.4 : 1,
        cursor: clickMode ? "pointer" : "grab",
        minWidth: 0,
      }}
    >
      {clickMode ? (
        <AdsClickIcon
          fontSize="small"
          sx={{ color: "text.primary", flexShrink: 0 }}
        />
      ) : (
        <DragIndicatorIcon
          fontSize="small"
          sx={{ color: "text.secondary", flexShrink: 0 }}
        />
      )}
      <Tooltip title={label} placement="left">
        <Typography
          variant="caption"
          component="div"
          sx={{
            flex: 1,
            minWidth: 0,
            fontWeight: 600,
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </Typography>
      </Tooltip>
      <Tooltip title={t("maps.toolsMoveZoneCancel")} placement="right">
        <IconButton
          size="small"
          aria-label={t("maps.toolsMoveZoneCancel")}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onCancel(tool.toolId);
          }}
          sx={{ flexShrink: 0 }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default function MapToolsMoveZone({
  tools,
  armedToolId = null,
  clickMode = false,
  clickPlaceActive = false,
  onInteractionModeChange,
  onPick,
  onDropInZone,
  onArm,
  onCancel,
}: MapToolsMoveZoneProps) {
  const { t } = useTranslation();
  const [pointerOver, setPointerOver] = useState(false);
  const [{ isOver }, dropRef] = useDrop(
    () => ({
      accept: MAP_TOOL_DND_TYPE,
      drop: (item: MapToolDragItem) => {
        onPick(item.toolId);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
      }),
    }),
    [onPick],
  );
  const dragging = useDragLayer(
    (monitor) =>
      monitor.isDragging() && monitor.getItemType() === MAP_TOOL_DND_TYPE,
  );
  const highlight = dragging || clickPlaceActive;
  const showDropHere = isOver || (clickPlaceActive && pointerOver);

  return (
    <Box
      ref={(node: HTMLDivElement | null) => {
        dropRef(node);
      }}
      onMouseEnter={() => setPointerOver(true)}
      onMouseLeave={() => setPointerOver(false)}
      onClick={(event) => {
        if (!clickPlaceActive) return;
        const target = event.target as HTMLElement;
        if (target.closest("button, [role='button']")) return;
        onDropInZone();
      }}
      sx={{
        width: "100%",
        minHeight: 120,
        maxHeight: 420,
        display: "flex",
        flexDirection: "column",
        p: 1,
        boxSizing: "border-box",
        border: "2px dashed",
        borderColor: highlight ? "primary.main" : "divider",
        borderRadius: 2,
        bgcolor: highlight ? "action.selected" : "background.default",
        boxShadow: isOver || clickPlaceActive ? 3 : 0,
        textAlign: "left",
        cursor: clickPlaceActive ? "pointer" : undefined,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.5,
          mb: 0.5,
          minHeight: 32,
          flexShrink: 0,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, textAlign: "center" }}
        >
          {t("layerTree.moveZone.title")}
        </Typography>
        {onInteractionModeChange ? (
          <Tooltip
            title={
              clickMode
                ? t("maps.toolsInteractionDrag")
                : t("maps.toolsInteractionClick")
            }
            placement="right"
          >
            <IconButton
              size="small"
              aria-label={t("maps.toolsInteractionMode")}
              aria-pressed={clickMode}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onInteractionModeChange(clickMode ? "drag" : "click");
              }}
            >
              {clickMode ? (
                <DragIndicatorIcon fontSize="small" />
              ) : (
                <AdsClickIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        ) : null}
      </Box>
      {tools.length > 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.75,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          {tools.map((tool) => (
            <HeldToolRow
              key={tool.toolId}
              tool={tool}
              picked={armedToolId === tool.toolId}
              clickMode={clickMode}
              onArm={onArm}
              onCancel={onCancel}
            />
          ))}
        </Box>
      ) : dragging || clickPlaceActive ? null : (
        <Box
          sx={{
            flex: 1,
            minHeight: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 0.5,
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textAlign: "center" }}
          >
            {t(
              clickMode
                ? "maps.toolsMoveZoneEmptyClick"
                : "maps.toolsMoveZoneEmptyDrag",
            )}
          </Typography>
        </Box>
      )}
      {showDropHere ? (
        <Typography
          variant="caption"
          color="primary"
          sx={{
            textAlign: "center",
            mt: tools.length === 0 ? "auto" : 0.75,
            flexShrink: 0,
          }}
        >
          {t("maps.toolsDropHere")}
        </Typography>
      ) : null}
    </Box>
  );
}
