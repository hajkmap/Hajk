import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  Box,
  ButtonBase,
  Chip,
  Collapse,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";
import type { ToolWindowPosition } from "../../../api/maps";
import type { ToolWindowSize } from "../map-tools-utils";
import type { BoardTool } from "../map-tools-board-model";
import MapToolsUnplacedRow from "./map-tools-unplaced-row";

interface MapToolsUnplacedProps {
  tools: (BoardTool & { active: boolean })[];
  onAdd: () => void;
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
}

function hasWindowSettings(tool: BoardTool): boolean {
  return (
    tool.showWindowPosition || tool.showWindowWidth || tool.showWindowHeight
  );
}

function columnCountFor(width: number): number {
  if (width >= 1160) return 3;
  if (width >= 720) return 2;
  return 1;
}

/** Top to bottom, column by column, with columns that differ by one item at most. */
function stackByColumn<T>(items: T[], columnCount: number): T[][] {
  const count = Math.min(columnCount, items.length);
  const columns: T[][] = [];
  let start = 0;
  for (let column = 0; column < count; column++) {
    const size = Math.ceil((items.length - start) / (count - column));
    columns.push(items.slice(start, start + size));
    start += size;
  }
  return columns;
}

function whereKey(type: string): string {
  switch (type) {
    case "search":
      return "maps.toolsUnplacedWhere.search";
    case "infoclick":
      return "maps.toolsUnplacedWhere.infoclick";
    case "documenthandler":
      return "maps.toolsUnplacedWhere.documents";
    case "commandpalette":
      return "maps.toolsUnplacedWhere.commandpalette";
    case "preset":
    case "externalLinks":
      return "maps.toolsUnplacedWhere.control";
    case "information":
      return "maps.toolsUnplacedWhere.information";
    default:
      return "maps.toolsUnplacedWhere.default";
  }
}

export default function MapToolsUnplaced({
  tools,
  onAdd,
  onRemove,
  onOpenSettings,
  onWindowPositionChange,
  onWindowSizeChange,
  onPendingSizeChange,
}: MapToolsUnplacedProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [columnCount, setColumnCount] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(
    () => new Set(),
  );
  const columnsRef = useRef<HTMLDivElement>(null);
  const activeCount = tools.filter((tool) => tool.active).length;
  const orderedTools = [
    ...tools.filter((tool) => !hasWindowSettings(tool)),
    ...tools.filter((tool) => hasWindowSettings(tool)),
  ];
  const columns = stackByColumn(orderedTools, columnCount);

  const toggleExpanded = useCallback((toolId: number) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(toolId)) next.delete(toolId);
      else next.add(toolId);
      return next;
    });
  }, []);

  useLayoutEffect(() => {
    const node = columnsRef.current;
    if (!node) return;
    const update = () => setColumnCount(columnCountFor(node.clientWidth));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [open]);

  return (
    <Box
      sx={{
        mb: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, pr: 1 }}>
        <ButtonBase
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 1,
            textAlign: "left",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
            {t("maps.toolsUnplacedTitle")}
          </Typography>
          <Chip
            size="small"
            label={activeCount}
            color={activeCount > 0 ? "primary" : "default"}
            variant="outlined"
            sx={{ height: 20, "& .MuiChip-label": { px: 0.75 } }}
          />
          <ExpandMoreIcon
            fontSize="small"
            sx={{
              color: "text.secondary",
              transition: "transform 150ms ease",
              transform: open ? "rotate(180deg)" : "none",
            }}
          />
        </ButtonBase>
        <Tooltip
          title={t("maps.toolsAddToPlacement", {
            placement: t("maps.toolsUnplacedTitle"),
          })}
        >
          <IconButton
            size="small"
            type="button"
            aria-label={t("maps.toolsAddToPlacement", {
              placement: t("maps.toolsUnplacedTitle"),
            })}
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
      <Collapse in={open} unmountOnExit>
        <Box sx={{ px: 1.5, pb: 1.5 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1.5, mt: 2, maxWidth: 760 }}
          >
            {t("maps.toolsUnplacedHelp")}
          </Typography>
          <Box
            ref={columnsRef}
            sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
          >
            {columns.map((column, index) => (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                {column.map((tool) => (
                  <MapToolsUnplacedRow
                    key={tool.toolId}
                    tool={tool}
                    where={t(whereKey(tool.type))}
                    expanded={expandedIds.has(tool.toolId)}
                    onToggleExpanded={toggleExpanded}
                    onRemove={onRemove}
                    onOpenSettings={onOpenSettings}
                    onWindowPositionChange={onWindowPositionChange}
                    onWindowSizeChange={onWindowSizeChange}
                    onPendingSizeChange={onPendingSizeChange}
                  />
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}
