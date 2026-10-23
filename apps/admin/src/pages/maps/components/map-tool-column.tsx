import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  alpha,
  useTheme,
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
import MapToolFixedRow from "./map-tool-fixed-row";
import MapToolZoneHelp from "./map-tool-zone-help";

/** A map setting that draws this control button. */
export interface FixedControlSetting {
  section: "controls" | "content";
  field: string;
}

export interface FixedControlItem {
  id: string;
  label: string;
  /** Set when this row is a tool that can be turned on, but not moved. */
  toolId?: number;
  active?: boolean;
  /** The tool has its own settings page. The row stays locked. */
  toolSettings?: boolean;
  /** The map setting this button comes from. */
  setting?: FixedControlSetting;
}

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
  /** Map buttons drawn above the tools. Their order is fixed. */
  fixedBefore?: FixedControlItem[];
  /** Map buttons drawn below the tools. Their order is fixed. */
  fixedAfter?: FixedControlItem[];
  onLocateSetting?: (setting: FixedControlSetting) => void;
  /** The pointer is on a locked row, so the tool cannot be placed there. */
  onRejectPlace?: (toolId: number) => void;
}

function showSettingHandler(
  setting: FixedControlSetting | undefined,
  onLocateSetting: ((setting: FixedControlSetting) => void) | undefined,
): (() => void) | undefined {
  if (setting == null || onLocateSetting == null) return undefined;
  return () => onLocateSetting(setting);
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
  if (line) {
    line.style.opacity = "0";
    line.style.removeProperty("background-color");
    delete line.dataset.invalid;
  }
  if (edge) {
    edge.style.opacity = "0";
    edge.style.visibility = "hidden";
  }
}

function fixedRows(body: HTMLElement): HTMLElement[] {
  return [...body.querySelectorAll<HTMLElement>("[data-fixed-row]")];
}

/**
 * The half of a locked block that touches the tool list is a real drop slot:
 * under the last locked row above the tools, or above the first locked row
 * below them. A red line there says the drop is blocked when it is not.
 */
function facesToolList(
  band: HTMLElement[],
  cards: HTMLElement[],
  clientY: number,
): boolean {
  if (cards.length === 0 || band.length === 0) return false;
  const firstTop = cards[0].getBoundingClientRect().top;
  const lastBottom = cards[cards.length - 1].getBoundingClientRect().bottom;
  const bandTop = band[0].getBoundingClientRect().top;
  const bandBottom = band[band.length - 1].getBoundingClientRect().bottom;
  if (bandBottom <= firstTop + 1) {
    const edge = band[band.length - 1].getBoundingClientRect();
    return clientY >= edge.top + edge.height / 2;
  }
  if (bandTop >= lastBottom - 1) {
    const edge = band[0].getBoundingClientRect();
    return clientY <= edge.top + edge.height / 2;
  }
  return false;
}

/**
 * Locked rows sit outside the tool cards, so a pointer on them used to count
 * as "before the first tool" or "after the last tool" and draw the blue line
 * as well as the red one. The whole locked block, including the gaps between
 * its rows, is one rejected region, except the edge that faces the tool list.
 */
function rejectedRow(body: HTMLElement, clientY: number): HTMLElement | null {
  const rows = fixedRows(body);
  if (rows.length === 0) return null;

  const cards = [...body.querySelectorAll<HTMLElement>("[data-tool-card]")];
  const bands: HTMLElement[][] = [];
  if (cards.length === 0) {
    bands.push(rows);
  } else {
    const firstTop = cards[0].getBoundingClientRect().top;
    const lastBottom = cards[cards.length - 1].getBoundingClientRect().bottom;
    const before = rows.filter(
      (row) => row.getBoundingClientRect().bottom <= firstTop + 1,
    );
    const after = rows.filter(
      (row) => row.getBoundingClientRect().top >= lastBottom - 1,
    );
    if (before.length > 0) bands.push(before);
    if (after.length > 0) bands.push(after);
  }

  for (const band of bands) {
    const top = band[0].getBoundingClientRect().top;
    const bottom = band[band.length - 1].getBoundingClientRect().bottom;
    if (clientY < top || clientY > bottom) continue;
    if (facesToolList(band, cards, clientY)) return null;
    const hit = band.find((row) => {
      const rect = row.getBoundingClientRect();
      return clientY >= rect.top && clientY <= rect.bottom;
    });
    if (hit) return hit;
    return band.reduce((nearest, row) => {
      const mid = (item: HTMLElement) => {
        const rect = item.getBoundingClientRect();
        return rect.top + rect.height / 2;
      };
      return Math.abs(clientY - mid(row)) < Math.abs(clientY - mid(nearest))
        ? row
        : nearest;
    });
  }
  return null;
}

function lockedNeighbor(
  row: HTMLElement,
  side: "above" | "below",
): HTMLElement | null {
  const sibling =
    side === "above" ? row.previousElementSibling : row.nextElementSibling;
  return sibling instanceof HTMLElement && sibling.hasAttribute("data-fixed-row")
    ? sibling
    : null;
}

/** One red line in the gap beside a locked row. The blue end line stays hidden. */
function showRejectedCue(
  body: HTMLElement,
  line: HTMLElement,
  edge: HTMLElement,
  row: HTMLElement,
  clientY: number,
) {
  edge.style.opacity = "0";
  edge.style.visibility = "hidden";
  const rect = row.getBoundingClientRect();
  const bodyRect = body.getBoundingClientRect();
  const above = clientY < rect.top + rect.height / 2;
  const neighbor = lockedNeighbor(row, above ? "above" : "below");
  // The shared gap has one midpoint. Marking the bottom of this row and the
  // top of the next row draws two lines a few pixels apart.
  const y = neighbor
    ? (above
        ? neighbor.getBoundingClientRect().bottom + rect.top
        : rect.bottom + neighbor.getBoundingClientRect().top) /
        2 -
      bodyRect.top
    : (above ? rect.top : rect.bottom) - bodyRect.top;
  line.dataset.invalid = "true";
  if (line.dataset.errorColor) {
    line.style.setProperty("background-color", line.dataset.errorColor, "important");
  }
  line.style.transform = `translateY(${Math.max(0, y - 1.5)}px)`;
  line.style.opacity = "1";
}

/**
 * Draws a thin line between tools, or a labelled pill at the first and last
 * slot. A pill is skipped when a fixed row already sits on that edge, because
 * it would cover that row. Both are absolutely positioned so the list never
 * changes height.
 */
function showDropCue(
  body: HTMLElement,
  line: HTMLElement,
  edge: HTMLElement,
  index: number,
  fixedEdges: { before: boolean; after: boolean },
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
  const pillBlocked =
    (index === 0 && fixedEdges.before) || (atEnd && fixedEdges.after);

  delete line.dataset.invalid;
  line.style.removeProperty("background-color");
  if ((index === 0 || atEnd) && !pillBlocked) {
    edge.style.visibility = "visible";
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
  edge.style.visibility = "hidden";
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
  fixedBefore = [],
  fixedAfter = [],
  onLocateSetting,
  onRejectPlace,
}: MapToolColumnProps) {
  const { t } = useTranslation();
  const theme = useTheme();
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
        const fixed = rejectedRow(body, offset.y);
        if (fixed) {
          showRejectedCue(body, line, edge, fixed, offset.y);
          return;
        }
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
        showDropCue(body, line, edge, visibleIndex, {
          before: fixedBefore.length > 0,
          after: fixedAfter.length > 0,
        });
      },
      drop: (item: MapToolDragItem, monitor) => {
        const offset = monitor.getClientOffset();
        const body = bodyRef.current;
        if (offset && body && rejectedRow(body, offset.y)) {
          onRejectPlace?.(item.toolId);
          return;
        }
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
    [
      fixedAfter.length,
      fixedBefore.length,
      onDropTool,
      onRejectPlace,
      order,
      tools,
      zone,
    ],
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
    const item = monitor.getItem<MapToolDragItem | null>();
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
      const fixed = rejectedRow(body, clientY);
      if (fixed) {
        clickPlaceIndexRef.current = null;
        showRejectedCue(body, line, edge, fixed, clientY);
        return;
      }
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
      showDropCue(body, line, edge, visibleIndex, {
        before: fixedBefore.length > 0,
        after: fixedAfter.length > 0,
      });
    },
    [
      clickPlaceToolId,
      fixedAfter.length,
      fixedBefore.length,
      hideClickPlaceLine,
      order,
      tools,
      zone,
    ],
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.25,
            flex: 1,
            minWidth: 0,
          }}
        >
          <Typography
            component="h3"
            sx={{
              fontWeight: 700,
              fontSize: "0.95rem",
              lineHeight: 1.25,
              minWidth: 0,
              wordBreak: "break-word",
            }}
          >
            {title}
          </Typography>
          <MapToolZoneHelp
            zone={zone}
            accent={meta.accent}
            title={title}
            disabled={movingToolId != null}
          />
        </Box>
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
          if (!clickPlaceActive || clickPlaceToolId == null) return;
          hideClickPlaceLine();
          const body = bodyRef.current;
          if (body && rejectedRow(body, event.clientY)) {
            onRejectPlace?.(clickPlaceToolId);
            return;
          }
          if (tools.length === 0) {
            placeAtOrderIndex(0);
            return;
          }
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
          pt: tools.length > 0 && fixedBefore.length === 0 ? 4 : 1.25,
          pb: tools.length > 0 && fixedAfter.length === 0 ? 4 : 1.25,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          cursor: clickPlaceActive ? "pointer" : undefined,
        }}
      >
        <Box
          ref={indicatorRef}
          data-error-color={theme.palette.error.main}
          sx={{
            position: "absolute",
            left: 10,
            right: 10,
            top: 0,
            height: 3,
            borderRadius: 99,
            bgcolor: "primary.main",
            "&[data-invalid='true']": { bgcolor: "error.main" },
            opacity: 0,
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
        <Box
          ref={edgeCueRef}
          aria-hidden
          data-top-label={t("layerTree.clickPlace.first")}
          data-bottom-label={t("layerTree.clickPlace.last")}
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
        {fixedBefore.map((item, index) => {
          const toolId = item.toolId;
          return (
            <MapToolFixedRow
              key={item.id}
              orderNumber={index + 1}
              label={item.label}
              onRemove={toolId != null ? () => onRemove(toolId) : undefined}
              onShowSetting={showSettingHandler(item.setting, onLocateSetting)}
              onOpenToolSettings={
                item.toolSettings && toolId != null
                  ? () => onOpenSettings(toolId)
                  : undefined
              }
            />
          );
        })}
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
              orderNumber={fixedBefore.length + index + 1}
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
        {fixedAfter.map((item, index) => {
          const toolId = item.toolId;
          return (
            <MapToolFixedRow
              key={item.id}
              orderNumber={fixedBefore.length + tools.length + index + 1}
              label={item.label}
              onRemove={toolId != null ? () => onRemove(toolId) : undefined}
              onShowSetting={showSettingHandler(item.setting, onLocateSetting)}
              onOpenToolSettings={
                item.toolSettings && toolId != null
                  ? () => onOpenSettings(toolId)
                  : undefined
              }
            />
          );
        })}
      </Box>
    </Box>
  );
}

export default MapToolColumn;
