import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ViewSidebarOutlinedIcon from "@mui/icons-material/ViewSidebarOutlined";
import AlignHorizontalLeftOutlinedIcon from "@mui/icons-material/AlignHorizontalLeftOutlined";
import AlignHorizontalRightOutlinedIcon from "@mui/icons-material/AlignHorizontalRightOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import { useDragLayer, useDrop } from "react-dnd";
import { useTranslation } from "react-i18next";
import type { ToolWindowPosition, ToolZone } from "../../../api/maps";
import type { ToolWindowSize } from "../map-tools-utils";
import {
  MAP_TOOL_DND_TYPE,
  placementAfterMove,
  type MapToolDragItem,
  type ToolColumnOrder,
} from "../map-tools-layout";
import type { BoardTool } from "../map-tools-board-model";
import MapToolCard from "./map-tool-card";

const ZONE_META: Record<
  ToolZone,
  {
    accent: string;
    Icon: typeof ViewSidebarOutlinedIcon;
  }
> = {
  drawer: { accent: "primary.main", Icon: ViewSidebarOutlinedIcon },
  widgetLeft: { accent: "info.main", Icon: AlignHorizontalLeftOutlinedIcon },
  widgetRight: {
    accent: "secondary.main",
    Icon: AlignHorizontalRightOutlinedIcon,
  },
  controlButton: { accent: "success.main", Icon: TuneOutlinedIcon },
};

interface MapToolColumnProps {
  zone: ToolZone;
  tools: BoardTool[];
  order: ToolColumnOrder;
  onAdd: () => void;
  onDropTool: (toolId: number, zone: ToolZone, index: number) => void;
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
  clickPlaceToolId?: number | null;
  clickMode?: boolean;
  moveZoneToolIds?: number[];
  onClickPick?: (toolId: number) => void;
  onClickPlaceAt?: (index: number) => void;
}

function orderIndexForVisibleDrop(
  orderIds: number[],
  tools: { toolId: number }[],
  visibleIndex: number,
): number {
  if (visibleIndex >= tools.length) return orderIds.length;
  const toolId = tools[visibleIndex]?.toolId;
  if (toolId == null) return orderIds.length;
  const index = orderIds.indexOf(toolId);
  return index < 0 ? orderIds.length : index;
}

function dropIndexForPointer(body: HTMLElement, clientY: number): number {
  const cards = body.querySelectorAll<HTMLElement>("[data-tool-card]");
  for (let index = 0; index < cards.length; index += 1) {
    const rect = cards[index].getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) return index;
  }
  return cards.length;
}

function hideDropCue(line: HTMLElement | null, edge: HTMLElement | null) {
  if (line) line.style.opacity = "0";
  if (edge) edge.style.opacity = "0";
}

/**
 * Draws a thin line between tools, or a labelled pill at the first and last
 * slot. Both are absolutely positioned so the list never changes height.
 */
function showDropCue(
  body: HTMLElement,
  line: HTMLElement,
  edge: HTMLElement,
  index: number,
) {
  const cards = body.querySelectorAll<HTMLElement>("[data-tool-card]");
  if (cards.length === 0) {
    hideDropCue(line, edge);
    return;
  }

  const bodyRect = body.getBoundingClientRect();
  const atEnd = index >= cards.length;
  const y = atEnd
    ? cards[cards.length - 1].getBoundingClientRect().bottom - bodyRect.top
    : cards[index].getBoundingClientRect().top - bodyRect.top;

  if (index === 0 || atEnd) {
    line.style.opacity = "0";
    edge.textContent =
      (index === 0 ? edge.dataset.topLabel : edge.dataset.bottomLabel) ?? "";
    const height = edge.offsetHeight || 20;
    const gap = 6;
    const inset = 4;
    const rawY = index === 0 ? y - height - gap : y + gap;
    const maxY = Math.max(inset, body.clientHeight - height - inset);
    edge.style.transform = `translateY(${Math.min(Math.max(rawY, inset), maxY)}px)`;
    edge.style.opacity = "1";
    return;
  }

  edge.style.opacity = "0";
  line.style.transform = `translateY(${Math.max(0, y - 2)}px)`;
  line.style.opacity = "1";
}

function MapToolColumn({
  zone,
  tools,
  order,
  onAdd,
  onDropTool,
  onRemove,
  onOpenSettings,
  onWindowPositionChange,
  onWindowSizeChange,
  onPendingSizeChange,
  clickPlaceToolId = null,
  clickMode = false,
  moveZoneToolIds = [],
  onClickPick,
  onClickPlaceAt,
}: MapToolColumnProps) {
  const { t } = useTranslation();
  const bodyRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const edgeCueRef = useRef<HTMLDivElement>(null);
  const clickPlaceIndexRef = useRef<number | null>(null);
  const [pointerInside, setPointerInside] = useState(false);
  const title = t(`maps.toolPlacement.${zone}`);
  const meta = ZONE_META[zone];

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: MAP_TOOL_DND_TYPE,
      hover: (item: MapToolDragItem, monitor) => {
        const offset = monitor.getClientOffset();
        const body = bodyRef.current;
        const line = indicatorRef.current;
        const edge = edgeCueRef.current;
        if (!offset || !body || !line || !edge) return;
        const visibleIndex = dropIndexForPointer(body, offset.y);
        const index = orderIndexForVisibleDrop(
          order[zone],
          tools,
          visibleIndex,
        );
        if (placementAfterMove(order, item.toolId, zone, index) === null) {
          hideDropCue(line, edge);
          return;
        }
        showDropCue(body, line, edge, visibleIndex);
      },
      drop: (item: MapToolDragItem, monitor) => {
        const offset = monitor.getClientOffset();
        const body = bodyRef.current;
        const visibleIndex =
          offset && body ? dropIndexForPointer(body, offset.y) : tools.length;
        onDropTool(
          item.toolId,
          zone,
          orderIndexForVisibleDrop(order[zone], tools, visibleIndex),
        );
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [onDropTool, order, tools, zone],
  );

  useEffect(() => {
    if (isOver) return;
    hideDropCue(indicatorRef.current, edgeCueRef.current);
  }, [isOver]);

  const setBodyRef = useCallback(
    (node: HTMLDivElement | null) => {
      bodyRef.current = node;
      drop(node);
    },
    [drop],
  );

  const ZoneIcon = meta.Icon;
  const clickPlaceActive =
    clickMode && clickPlaceToolId != null && onClickPlaceAt != null;
  const dragItemId = useDragLayer((monitor) => {
    if (!monitor.isDragging() || monitor.getItemType() !== MAP_TOOL_DND_TYPE) {
      return null;
    }
    const item = monitor.getItem() as MapToolDragItem | null;
    return item?.toolId ?? null;
  });
  const movingToolId = dragItemId ?? (clickPlaceActive ? clickPlaceToolId : null);
  const hideClickPlaceLine = useCallback(() => {
    clickPlaceIndexRef.current = null;
    hideDropCue(indicatorRef.current, edgeCueRef.current);
  }, []);

  const showClickPlaceLine = useCallback(
    (clientY: number) => {
      const body = bodyRef.current;
      const line = indicatorRef.current;
      const edge = edgeCueRef.current;
      if (!body || !line || !edge || clickPlaceToolId == null) return;
      const visibleIndex = dropIndexForPointer(body, clientY);
      const orderIndex = orderIndexForVisibleDrop(
        order[zone],
        tools,
        visibleIndex,
      );
      const valid =
        placementAfterMove(order, clickPlaceToolId, zone, orderIndex) !==
        null;
      if (!valid) {
        hideClickPlaceLine();
        return;
      }
      clickPlaceIndexRef.current = orderIndex;
      showDropCue(body, line, edge, visibleIndex);
    },
    [clickPlaceToolId, hideClickPlaceLine, order, tools, zone],
  );

  useEffect(() => {
    if (!clickPlaceActive) hideClickPlaceLine();
  }, [clickPlaceActive, hideClickPlaceLine]);

  const placeAtOrderIndex = (orderIndex: number) => {
    if (!clickPlaceActive) return;
    if (
      clickPlaceToolId == null ||
      placementAfterMove(order, clickPlaceToolId, zone, orderIndex) === null
    ) {
      return;
    }
    hideClickPlaceLine();
    onClickPlaceAt?.(orderIndex);
  };

  const emptyReady = tools.length === 0 && movingToolId != null;
  const emptyHot =
    emptyReady && (isOver || (pointerInside && dragItemId == null));

  return (
    <Box
      aria-label={title}
      sx={{
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        border: "1px solid",
        borderColor: isOver ? "primary.main" : "divider",
        borderTop: "3px solid",
        borderTopColor: meta.accent,
        borderRadius: 2,
        bgcolor: "background.paper",
        boxShadow: isOver ? 3 : 0,
        overflow: "hidden",
        transition: "border-color 120ms ease, box-shadow 120ms ease",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.25,
          py: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "action.hover",
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1,
            display: "grid",
            placeItems: "center",
            color: meta.accent,
            bgcolor: "background.paper",
          }}
        >
          <ZoneIcon sx={{ fontSize: 18 }} />
        </Box>
        <Typography
          component="h3"
          sx={{
            fontWeight: 700,
            fontSize: "0.95rem",
            lineHeight: 1.25,
            flex: 1,
            minWidth: 0,
            wordBreak: "break-word",
          }}
        >
          {title}
        </Typography>
        <Chip
          size="small"
          label={tools.length}
          sx={{ height: 22, minWidth: 28, fontWeight: 700, flexShrink: 0 }}
        />
        <Tooltip title={t("maps.toolsAddToPlacement", { placement: title })}>
          <IconButton
            size="small"
            type="button"
            aria-label={t("maps.toolsAddToPlacement", { placement: title })}
            onClick={onAdd}
            sx={{
              width: 28,
              height: 28,
              flexShrink: 0,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            <AddIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>
      <Box
        ref={setBodyRef}
        onMouseEnter={() => setPointerInside(true)}
        onMouseMove={(event) => {
          if (!clickPlaceActive || isOver) return;
          showClickPlaceLine(event.clientY);
        }}
        onMouseLeave={() => {
          setPointerInside(false);
          if (!isOver) hideClickPlaceLine();
        }}
        onClick={(event) => {
          if (!clickMode) return;
          const target = event.target as HTMLElement;
          if (target.closest("button, a, input, textarea")) return;
          const card = target.closest<HTMLElement>("[data-tool-card]");
          const cardToolId = card ? Number(card.dataset.toolId) : null;
          if (
            cardToolId != null &&
            Number.isFinite(cardToolId) &&
            (!clickPlaceActive || cardToolId === clickPlaceToolId)
          ) {
            if (!moveZoneToolIds.includes(cardToolId)) onClickPick?.(cardToolId);
            return;
          }
          if (!clickPlaceActive) return;
          hideClickPlaceLine();
          if (tools.length === 0) {
            placeAtOrderIndex(0);
            return;
          }
          const body = bodyRef.current;
          if (!body) return;
          const visibleIndex = dropIndexForPointer(body, event.clientY);
          placeAtOrderIndex(
            orderIndexForVisibleDrop(order[zone], tools, visibleIndex),
          );
        }}
        sx={{
          position: "relative",
          flex: 1,
          minHeight: 96,
          px: 1.25,
          pt: tools.length > 0 ? 4 : 1.25,
          pb: tools.length > 0 ? 4 : 1.25,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          cursor: clickPlaceActive ? "pointer" : undefined,
        }}
      >
        <Box
          ref={indicatorRef}
          sx={{
            position: "absolute",
            left: 10,
            right: 10,
            top: 0,
            height: 3,
            borderRadius: 99,
            bgcolor: "primary.main",
            opacity: 0,
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
        <Box
          ref={edgeCueRef}
          aria-hidden
          data-top-label={t("maps.toolsDropAtTop")}
          data-bottom-label={t("maps.toolsDropAtBottom")}
          sx={{
            position: "absolute",
            left: 10,
            right: 10,
            top: 0,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px dashed",
            borderColor: "primary.main",
            borderRadius: 1,
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.85),
            color: "primary.main",
            fontSize: "0.7rem",
            fontWeight: 600,
            lineHeight: 1,
            opacity: 0,
            pointerEvents: "none",
            zIndex: 3,
          }}
        />
        {tools.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              minHeight: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              px: 2,
              borderRadius: 1.5,
              border: "1px dashed",
              borderColor: emptyReady ? "primary.main" : "divider",
              color: emptyHot ? "primary.main" : "text.secondary",
              bgcolor: (theme) =>
                emptyHot ? alpha(theme.palette.primary.main, 0.12) : "transparent",
              cursor: clickPlaceActive ? "pointer" : undefined,
            }}
          >
            <Typography variant="body2" sx={{ color: "inherit" }}>
              {emptyReady ? t("maps.toolsDropHere") : t("maps.toolsColumnEmpty")}
            </Typography>
          </Box>
        ) : (
          tools.map((tool, index) => (
            <MapToolCard
              key={tool.toolId}
              tool={tool}
              orderNumber={index + 1}
              clickPicked={
                tool.toolId ===
                (dragItemId != null && moveZoneToolIds.includes(dragItemId)
                  ? dragItemId
                  : clickPlaceToolId)
              }
              inMoveZone={moveZoneToolIds.includes(tool.toolId)}
              clickMode={clickMode}
              placementActive={clickPlaceActive}
              onRemove={onRemove}
              onOpenSettings={onOpenSettings}
              onWindowPositionChange={onWindowPositionChange}
              onWindowSizeChange={onWindowSizeChange}
              onPendingSizeChange={onPendingSizeChange}
            />
          ))
        )}
      </Box>
    </Box>
  );
}

export default MapToolColumn;
