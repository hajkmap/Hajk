import { type MutableRefObject, type RefObject } from "react";
import { Box, CircularProgress } from "@mui/material";
import type { ToolOnMap, ToolWindowPosition, ToolZone } from "../../../api/maps";
import type { Tool } from "../../../api/tools";
import { useTools } from "../../../api/tools";
import type { ToolZones, ToolWindowSize } from "../map-tools-utils";
import type { ToolColumnOrder } from "../map-tools-layout";
import MapToolsList from "./map-tools-list";

interface MapToolsPanelProps {
  mapTools: ToolOnMap[] | undefined;
  catalogTools?: Tool[] | undefined;
  toolZones: ToolZones;
  activeToolIds: Set<number>;
  windowPositions: Record<number, ToolWindowPosition>;
  windowSizes: Record<number, ToolWindowSize>;
  indexes: Record<number, number>;
  onToggleToolActive: (toolId: number, active: boolean) => void;
  onAddToolToPlacement: (toolId: number, target: ToolZone) => void;
  onCommitToolColumns: (order: ToolColumnOrder) => void;
  onToolWindowPositionChange: (
    toolId: number,
    position: ToolWindowPosition,
  ) => void;
  onToolWindowSizeChange: (
    toolId: number,
    size: Partial<ToolWindowSize>,
  ) => void;
  flushPendingEditsRef?: MutableRefObject<(() => void) | null>;
  onPendingWindowSizeDirtyChange?: (pending: boolean) => void;
  moveZoneHostRef?: RefObject<HTMLDivElement | null>;
}

export default function MapToolsPanel({
  mapTools,
  catalogTools: catalogToolsProp,
  toolZones,
  activeToolIds,
  windowPositions,
  windowSizes,
  indexes,
  onToggleToolActive,
  onAddToolToPlacement,
  onCommitToolColumns,
  onToolWindowPositionChange,
  onToolWindowSizeChange,
  flushPendingEditsRef,
  onPendingWindowSizeDirtyChange,
  moveZoneHostRef,
}: MapToolsPanelProps) {
  const { data: catalogToolsQuery } = useTools();
  const catalogTools = catalogToolsProp ?? catalogToolsQuery;

  if (mapTools === undefined || catalogTools === undefined) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <MapToolsList
        catalogTools={catalogTools}
        mapTools={mapTools}
        toolZones={toolZones}
        activeToolIds={activeToolIds}
        windowPositions={windowPositions}
        windowSizes={windowSizes}
        indexes={indexes}
        onToggleActive={onToggleToolActive}
        onAddTool={onAddToolToPlacement}
        onCommitColumns={onCommitToolColumns}
        onWindowPositionChange={onToolWindowPositionChange}
        onWindowSizeChange={onToolWindowSizeChange}
        flushPendingEditsRef={flushPendingEditsRef}
        onPendingWindowSizeDirtyChange={onPendingWindowSizeDirtyChange}
        moveZoneHostRef={moveZoneHostRef}
      />
    </Box>
  );
}
