import { type MutableRefObject } from "react";
import { Box, CircularProgress } from "@mui/material";
import type { ToolOnMap, ToolWindowPosition, ToolZone } from "../../../api/maps";
import type { Tool } from "../../../api/tools";
import { useTools } from "../../../api/tools";
import type { ToolZones, ToolWindowSize } from "../map-tools-utils";
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
  onToolTargetChange: (toolId: number, target: ToolZone | null) => void;
  onToolWindowPositionChange: (
    toolId: number,
    position: ToolWindowPosition,
  ) => void;
  onToolWindowSizeChange: (
    toolId: number,
    size: Partial<ToolWindowSize>,
  ) => void;
  onToolIndexChange: (toolId: number, index: number) => void;
  flushPendingEditsRef?: MutableRefObject<(() => void) | null>;
  onPendingWindowSizeDirtyChange?: (pending: boolean) => void;
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
  onToolTargetChange,
  onToolWindowPositionChange,
  onToolWindowSizeChange,
  onToolIndexChange,
  flushPendingEditsRef,
  onPendingWindowSizeDirtyChange,
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
        onTargetChange={onToolTargetChange}
        onWindowPositionChange={onToolWindowPositionChange}
        onWindowSizeChange={onToolWindowSizeChange}
        onIndexChange={onToolIndexChange}
        flushPendingEditsRef={flushPendingEditsRef}
        onPendingWindowSizeDirtyChange={onPendingWindowSizeDirtyChange}
      />
    </Box>
  );
}
