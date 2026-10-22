import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { Box, Typography, useTheme } from "@mui/material";
import { MultiBackend, getBackendOptions } from "@minoru/react-dnd-treeview";
import { DndProvider } from "react-dnd";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import type { ToolOnMap, ToolWindowPosition, ToolZone } from "../../../api/maps";
import type { Tool } from "../../../api/tools";
import { getCatalogToolDisplayName, type ToolWindowSize, type ToolZones } from "../map-tools-utils";
import {
  TOOL_PLACEMENT_ZONES,
  placementAfterMove,
  type ToolColumnOrder,
} from "../map-tools-layout";
import { buildToolBoard, toolsAvailableToAdd } from "../map-tools-board-model";
import MapToolColumn from "./map-tool-column";
import MapToolsAddDialog, {
  type PlacedToolOfType,
} from "./map-tools-add-dialog";
import MapToolsMoveZone, {
  type MapToolsInteractionMode,
} from "./map-tools-move-zone";

interface MapToolsListProps {
  catalogTools: Tool[];
  mapTools: ToolOnMap[];
  toolZones: ToolZones;
  activeToolIds: Set<number>;
  windowPositions: Record<number, ToolWindowPosition>;
  windowSizes: Record<number, ToolWindowSize>;
  indexes: Record<number, number>;
  onToggleActive: (toolId: number, active: boolean) => void;
  onAddTool: (toolId: number, target: ToolZone) => void;
  onCommitColumns: (order: ToolColumnOrder) => void;
  onWindowPositionChange: (
    toolId: number,
    position: ToolWindowPosition,
  ) => void;
  onWindowSizeChange: (toolId: number, size: Partial<ToolWindowSize>) => void;
  flushPendingEditsRef?: MutableRefObject<(() => void) | null>;
  onPendingWindowSizeDirtyChange?: (pending: boolean) => void;
  moveZoneHostRef?: RefObject<HTMLDivElement | null>;
}

function notifyPendingDirtyAfterPaint(
  notify: ((pending: boolean) => void) | undefined,
  pending: boolean,
) {
  if (!notify) return;
  window.setTimeout(() => {
    notify(pending);
  }, 0);
}

function MapToolsList({
  catalogTools,
  mapTools,
  toolZones,
  activeToolIds,
  windowPositions,
  windowSizes,
  indexes,
  onToggleActive,
  onAddTool,
  onCommitColumns,
  onWindowPositionChange,
  onWindowSizeChange,
  flushPendingEditsRef,
  onPendingWindowSizeDirtyChange,
  moveZoneHostRef,
}: MapToolsListProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const [addTarget, setAddTarget] = useState<ToolZone | null>(null);
  const [armedToolId, setArmedToolId] = useState<number | null>(null);
  const [interactionMode, setInteractionMode] =
    useState<MapToolsInteractionMode>("drag");
  const clickMode = interactionMode === "click";
  const [parkedToolIds, setParkedToolIds] = useState<number[]>([]);
  const [moveZoneHostEl, setMoveZoneHostEl] = useState<HTMLElement | null>(
    null,
  );
  const dndOptions = useMemo(() => getBackendOptions(), []);
  const pendingFieldsRef = useRef(new Set<string>());
  const pendingWindowSizesRef = useRef(
    new Map<number, Partial<ToolWindowSize>>(),
  );

  const setPendingFieldState = useCallback(
    (
      toolId: number,
      dimension: "width" | "height",
      nextValue: number | undefined,
      committedValue: number | undefined,
    ) => {
      const key = `${toolId}:${dimension}`;
      const pendingFields = pendingFieldsRef.current;
      const pendingWindowSizes = pendingWindowSizesRef.current;
      const previousSize = pendingFields.size;
      const hasPendingChange = nextValue !== committedValue;

      if (hasPendingChange) {
        pendingFields.add(key);
        const currentPending = pendingWindowSizes.get(toolId) ?? {};
        pendingWindowSizes.set(toolId, {
          ...currentPending,
          [dimension]: nextValue,
        });
      } else {
        pendingFields.delete(key);
        const currentPending = pendingWindowSizes.get(toolId);
        if (currentPending) {
          delete currentPending[dimension];
          if (!("width" in currentPending) && !("height" in currentPending)) {
            pendingWindowSizes.delete(toolId);
          }
        }
      }

      if ((previousSize === 0) !== (pendingFields.size === 0)) {
        notifyPendingDirtyAfterPaint(
          onPendingWindowSizeDirtyChange,
          pendingFields.size > 0,
        );
      }
    },
    [onPendingWindowSizeDirtyChange],
  );

  const flushPendingWindowSizes = useCallback(() => {
    const pendingWindowSizes = [...pendingWindowSizesRef.current.entries()];
    pendingWindowSizesRef.current.clear();
    pendingFieldsRef.current.clear();
    onPendingWindowSizeDirtyChange?.(false);

    pendingWindowSizes.forEach(([toolId, size]) => {
      if (!("width" in size) && !("height" in size)) return;
      onWindowSizeChange(toolId, size);
    });
  }, [onPendingWindowSizeDirtyChange, onWindowSizeChange]);

  useEffect(() => {
    if (!flushPendingEditsRef) return;
    flushPendingEditsRef.current = flushPendingWindowSizes;
    return () => {
      flushPendingEditsRef.current = null;
    };
  }, [flushPendingEditsRef, flushPendingWindowSizes]);

  useEffect(
    () => () => {
      onPendingWindowSizeDirtyChange?.(false);
    },
    [onPendingWindowSizeDirtyChange],
  );

  const board = useMemo(
    () =>
      buildToolBoard(
        catalogTools,
        mapTools,
        toolZones,
        activeToolIds,
        windowPositions,
        windowSizes,
        indexes,
      ),
    [
      activeToolIds,
      catalogTools,
      indexes,
      mapTools,
      toolZones,
      windowPositions,
      windowSizes,
    ],
  );

  const catalogToolsById = useMemo(
    () => new Map(catalogTools.map((tool) => [Number(tool.id), tool])),
    [catalogTools],
  );

  const addableTools = useMemo(() => {
    if (addTarget == null) return [];
    return toolsAvailableToAdd(catalogTools, activeToolIds, board.order);
  }, [activeToolIds, addTarget, board.order, catalogTools]);

  const placedByType = useMemo(() => {
    const byType = new Map<string, PlacedToolOfType>();
    for (const zone of TOOL_PLACEMENT_ZONES) {
      for (const tool of board.columns[zone]) {
        if (tool.type && !byType.has(tool.type)) {
          byType.set(tool.type, { title: tool.title, zone });
        }
      }
    }
    return byType;
  }, [board]);

  const zoneTools = useMemo(() => {
    if (parkedToolIds.length === 0) return [];
    const byId = new Map<number, (typeof board.columns.drawer)[number]>();
    for (const zone of TOOL_PLACEMENT_ZONES) {
      for (const tool of board.columns[zone]) {
        byId.set(tool.toolId, tool);
      }
    }
    return parkedToolIds.flatMap((toolId) => {
      const tool = byId.get(toolId);
      return tool ? [tool] : [];
    });
  }, [board, parkedToolIds]);

  useEffect(() => {
    if (!moveZoneHostRef) {
      setMoveZoneHostEl(null);
      return;
    }
    const syncHost = () => {
      setMoveZoneHostEl(moveZoneHostRef.current);
    };
    syncHost();
    const frame = window.requestAnimationFrame(syncHost);
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [moveZoneHostRef]);

  useEffect(() => {
    if (armedToolId == null && parkedToolIds.length === 0) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setArmedToolId(null);
      setParkedToolIds([]);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [armedToolId, parkedToolIds.length]);

  const handleDropTool = useCallback(
    (toolId: number, zone: ToolZone, index: number) => {
      const next = placementAfterMove(board.order, toolId, zone, index);
      if (!next) return;
      onCommitColumns(next);
      setArmedToolId((current) => (current === toolId ? null : current));
      setParkedToolIds((current) => current.filter((id) => id !== toolId));
    },
    [board.order, onCommitColumns],
  );

  const handleInteractionModeChange = useCallback(
    (mode: MapToolsInteractionMode) => {
      setInteractionMode(mode);
      if (mode === "drag") setArmedToolId(null);
    },
    [],
  );

  const handleClickPick = useCallback((toolId: number) => {
    setArmedToolId((current) => (current === toolId ? null : toolId));
  }, []);

  const handleDropInZone = useCallback(() => {
    if (armedToolId == null) return;
    setParkedToolIds((current) =>
      current.includes(armedToolId) ? current : [...current, armedToolId],
    );
    setArmedToolId(null);
  }, [armedToolId]);

  const handleArmFromZone = useCallback((toolId: number) => {
    setArmedToolId((current) => (current === toolId ? null : toolId));
  }, []);

  const handleRemoveFromZone = useCallback((toolId: number) => {
    setParkedToolIds((current) => current.filter((id) => id !== toolId));
    setArmedToolId((current) => (current === toolId ? null : current));
  }, []);

  const handleClickPlaceAt = useCallback(
    (zone: ToolZone, index: number) => {
      if (armedToolId == null) return;
      const next = placementAfterMove(board.order, armedToolId, zone, index);
      if (!next) return;
      onCommitColumns(next);
      setArmedToolId(null);
      setParkedToolIds((current) => current.filter((id) => id !== armedToolId));
    },
    [armedToolId, board.order, onCommitColumns],
  );

  const warnIfDuplicateType = useCallback(
    (toolId: number) => {
      const activatingTool = catalogToolsById.get(toolId);
      const toolType = activatingTool?.type;
      if (!toolType) return;
      const conflictingId = [...activeToolIds].find(
        (id) => id !== toolId && catalogToolsById.get(id)?.type === toolType,
      );
      if (conflictingId == null) return;
      const conflictingTool = catalogToolsById.get(conflictingId);
      toast.warning(
        t("maps.toolsDuplicateTypeWarning", {
          type: toolType,
          deactivatedTool: conflictingTool
            ? getCatalogToolDisplayName(conflictingTool)
            : String(conflictingId),
          activatedTool: activatingTool
            ? getCatalogToolDisplayName(activatingTool)
            : String(toolId),
        }),
        {
          position: "bottom-left",
          theme: theme.palette.mode,
          hideProgressBar: true,
        },
      );
    },
    [activeToolIds, catalogToolsById, t, theme.palette.mode],
  );

  const handleAdd = useCallback(
    (toolId: number) => {
      if (addTarget == null) return;
      warnIfDuplicateType(toolId);
      onAddTool(toolId, addTarget);
      setAddTarget(null);
    },
    [addTarget, onAddTool, warnIfDuplicateType],
  );

  const handleRemove = useCallback(
    (toolId: number) => {
      setArmedToolId((current) => (current === toolId ? null : current));
      setParkedToolIds((current) => current.filter((id) => id !== toolId));
      onToggleActive(toolId, false);
    },
    [onToggleActive],
  );

  const openSettings = useCallback(
    (toolId: number) => {
      void navigate(`/tools/${toolId}`);
    },
    [navigate],
  );

  const dialogTitle = addTarget
    ? t("maps.toolsAddToPlacement", {
        placement: t(`maps.toolPlacement.${addTarget}`),
      })
    : "";

  const cardHandlers = {
    onRemove: handleRemove,
    onOpenSettings: openSettings,
    onWindowPositionChange,
    onWindowSizeChange,
    onPendingSizeChange: setPendingFieldState,
  };

  return (
    <Box sx={{ containerType: "inline-size" }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 2, maxWidth: 760 }}
      >
        {t("maps.toolsBoardHelp")}
      </Typography>
      <DndProvider backend={MultiBackend} options={dndOptions}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: 2,
            alignItems: "start",
            "@container (min-width: 560px)": {
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            },
            "@container (min-width: 1160px)": {
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            },
          }}
        >
          {TOOL_PLACEMENT_ZONES.map((zone) => (
            <MapToolColumn
              key={zone}
              zone={zone}
              tools={board.columns[zone]}
              order={board.order}
              onAdd={() => setAddTarget(zone)}
              onDropTool={handleDropTool}
              clickPlaceToolId={clickMode ? armedToolId : null}
              clickMode={clickMode}
              moveZoneToolIds={parkedToolIds}
              onClickPick={handleClickPick}
              onClickPlaceAt={(index: number) =>
                handleClickPlaceAt(zone, index)
              }
              {...cardHandlers}
            />
          ))}
        </Box>
        {moveZoneHostEl
          ? createPortal(
              <MapToolsMoveZone
                tools={zoneTools}
                armedToolId={armedToolId}
                clickMode={clickMode}
                clickPlaceActive={
                  clickMode &&
                  armedToolId != null &&
                  !parkedToolIds.includes(armedToolId)
                }
                onInteractionModeChange={handleInteractionModeChange}
                onPick={(toolId) => {
                  setParkedToolIds((current) =>
                    current.includes(toolId) ? current : [...current, toolId],
                  );
                  setArmedToolId((current) =>
                    current === toolId ? null : current,
                  );
                }}
                onDropInZone={handleDropInZone}
                onArm={handleArmFromZone}
                onCancel={handleRemoveFromZone}
              />,
              moveZoneHostEl,
            )
          : null}
      </DndProvider>
      <MapToolsAddDialog
        open={addTarget != null}
        title={dialogTitle}
        tools={addableTools}
        placedByType={placedByType}
        onClose={() => setAddTarget(null)}
        onSelect={handleAdd}
      />
    </Box>
  );
}

export default memo(MapToolsList);
