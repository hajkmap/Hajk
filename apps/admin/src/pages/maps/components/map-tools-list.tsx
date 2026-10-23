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
import { getMapToolFieldConfig } from "../map-tool-field-config";
import {
  getCatalogToolDisplayName,
  getToolDisplayName,
  type ToolWindowSize,
  type ToolZones,
} from "../map-tools-utils";
import {
  TOOL_PLACEMENT_ZONES,
  placementAfterMove,
  type ToolColumnOrder,
} from "../map-tools-layout";
import {
  buildToolBoard,
  toolsAvailableToAdd,
  type AddableTool,
} from "../map-tools-board-model";
import MapToolColumn, {
  type FixedControlItem,
  type FixedControlSetting,
} from "./map-tool-column";
import MapToolsUnplaced from "./map-tools-unplaced";

interface UnplacedBoardTool {
  toolId: number;
  title: string;
  type: string;
  active: boolean;
}
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
  /** Map settings that draw a control button in a fixed place. */
  mapControls?: MapControlVisibility;
  onLocateSetting?: (setting: FixedControlSetting) => void;
}

export interface MapControlVisibility {
  showCookieNoticeButton: boolean;
  showUserAvatar: boolean;
  showIntroductionButton: boolean;
  mapresetter: boolean;
  showMapSelectorButton: boolean;
  mapcleaner: boolean;
  showThemeToggler: boolean;
  showRecentlyUsedPlugins: boolean;
}

function listUnplacedTools(
  catalogTools: Tool[],
  mapTools: ToolOnMap[],
  activeToolIds: Set<number>,
): UnplacedBoardTool[] {
  const byId = new Map<number, UnplacedBoardTool>();

  const consider = (toolId: number, type: string, title: string) => {
    if (!Number.isFinite(toolId) || getMapToolFieldConfig(type).target) return;
    const nextTitle = title.trim() || type;
    const current = byId.get(toolId);
    if (current) {
      if (title.trim()) current.title = nextTitle;
      return;
    }
    byId.set(toolId, {
      toolId,
      title: nextTitle,
      type,
      active: activeToolIds.has(toolId),
    });
  };

  for (const tool of catalogTools) {
    consider(Number(tool.id), tool.type, getCatalogToolDisplayName(tool));
  }
  for (const tool of mapTools) {
    consider(tool.toolId, tool.tool.type, getToolDisplayName(tool));
  }

  return [...byId.values()].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
  );
}

function toolsAvailableWithoutPlacement(
  catalogTools: Tool[],
  activeToolIds: Set<number>,
): AddableTool[] {
  return catalogTools
    .flatMap((tool) => {
      const toolId = Number(tool.id);
      if (!Number.isFinite(toolId) || activeToolIds.has(toolId)) return [];
      if (getMapToolFieldConfig(tool.type).target) return [];
      if (
        tool.type === "information" ||
        tool.type === "preset" ||
        tool.type === "externalLinks"
      ) {
        return [];
      }
      return [
        {
          toolId,
          title: getCatalogToolDisplayName(tool),
          type: tool.type,
          active: false,
          placement: null,
        },
      ];
    })
    .sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
    );
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
  mapControls,
  onLocateSetting,
}: MapToolsListProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const [addTarget, setAddTarget] = useState<ToolZone | "unplaced" | null>(
    null,
  );
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

  const unplacedTools = useMemo((): UnplacedBoardTool[] => {
    return listUnplacedTools(catalogTools, mapTools, activeToolIds);
  }, [activeToolIds, catalogTools, mapTools]);

  const fixedControls = useMemo(() => {
    const before: FixedControlItem[] = [
      { id: "zoom", label: t("maps.toolsFixedZoom") },
    ];
    const after: FixedControlItem[] = [];
    if (!mapControls) return { before, after };

    if (mapControls.showCookieNoticeButton) {
      before.push({
        id: "cookie",
        label: t("maps.toolsFixedCookie"),
        setting: {
          section: "content",
          field: "options.showCookieNoticeButton",
        },
      });
    }
    if (mapControls.showUserAvatar) {
      before.push({
        id: "user",
        label: t("maps.toolsFixedUser"),
        setting: { section: "controls", field: "options.showUserAvatar" },
      });
    }
    if (mapControls.showIntroductionButton) {
      after.push({
        id: "introduction",
        label: t("maps.toolsFixedIntroduction"),
        setting: {
          section: "content",
          field: "options.introductionShowControlButton",
        },
      });
    }
    if (mapControls.mapresetter) {
      after.push({
        id: "reset",
        label: t("maps.toolsFixedReset"),
        setting: { section: "controls", field: "options.mapresetter" },
      });
    }
    if (mapControls.showMapSelectorButton) {
      after.push({
        id: "map-selector",
        label: t("maps.toolsFixedMapSelector"),
        setting: { section: "controls", field: "options.mapSelectorStyle" },
      });
    }
    if (mapControls.mapcleaner) {
      after.push({
        id: "cleaner",
        label: t("maps.toolsFixedCleaner"),
        setting: { section: "controls", field: "options.mapcleaner" },
      });
    }
    for (const tool of unplacedTools) {
      if (!tool.active || tool.type !== "preset") continue;
      after.push({
        id: `preset-${tool.toolId}`,
        label: tool.title,
        toolId: tool.toolId,
        active: tool.active,
        toolSettings: true,
      });
    }
    for (const tool of unplacedTools) {
      if (!tool.active || tool.type !== "externalLinks") continue;
      after.push({
        id: `links-${tool.toolId}`,
        label: tool.title,
        toolId: tool.toolId,
        active: tool.active,
      });
    }
    if (mapControls.showThemeToggler) {
      after.push({
        id: "theme",
        label: t("maps.toolsFixedTheme"),
        setting: { section: "controls", field: "options.showThemeToggler" },
      });
    }
    for (const tool of unplacedTools) {
      if (!tool.active || tool.type !== "information") continue;
      after.push({
        id: `info-${tool.toolId}`,
        label: tool.title,
        toolId: tool.toolId,
        active: tool.active,
      });
    }
    if (mapControls.showRecentlyUsedPlugins) {
      after.push({
        id: "recent",
        label: t("maps.toolsFixedRecent"),
        setting: {
          section: "controls",
          field: "options.showRecentlyUsedPlugins",
        },
      });
    }
    return { before, after };
  }, [mapControls, t, unplacedTools]);

  const catalogToolsById = useMemo(
    () => new Map(catalogTools.map((tool) => [Number(tool.id), tool])),
    [catalogTools],
  );

  const addableTools = useMemo(() => {
    if (addTarget == null) return [];
    if (addTarget === "unplaced") {
      return toolsAvailableWithoutPlacement(catalogTools, activeToolIds);
    }
    return toolsAvailableToAdd(
      catalogTools,
      activeToolIds,
      board.order,
      addTarget,
    );
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
    for (const tool of unplacedTools) {
      if (!tool.active || byType.has(tool.type)) continue;
      const fixedControl =
        tool.type === "information" ||
        tool.type === "preset" ||
        tool.type === "externalLinks";
      byType.set(tool.type, {
        title: tool.title,
        zone: fixedControl ? "controlButton" : "unplaced",
      });
    }
    return byType;
  }, [board, unplacedTools]);

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

  const heldToolName = useCallback(
    (toolId: number) => {
      for (const zone of TOOL_PLACEMENT_ZONES) {
        const tool = board.columns[zone].find((item) => item.toolId === toolId);
        if (tool) return tool.title;
      }
      const catalog = catalogToolsById.get(toolId);
      return catalog ? getCatalogToolDisplayName(catalog) : String(toolId);
    },
    [board.columns, catalogToolsById],
  );

  const warnCannotPlace = useCallback(
    (toolId: number) => {
      let name = String(toolId);
      for (const zone of TOOL_PLACEMENT_ZONES) {
        const tool = board.columns[zone].find((item) => item.toolId === toolId);
        if (tool) {
          name = tool.title;
          break;
        }
      }
      if (name === String(toolId)) {
        const catalog = catalogToolsById.get(toolId);
        if (catalog) name = getCatalogToolDisplayName(catalog);
      }
      toast.warning(t("layerTree.problem.notHere", { name }), {
        position: "bottom-left",
        theme: theme.palette.mode,
        hideProgressBar: true,
      });
    },
    [board.columns, catalogToolsById, t, theme.palette.mode],
  );

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
      if (addTarget === "unplaced") onToggleActive(toolId, true);
      else onAddTool(toolId, addTarget);
      setAddTarget(null);
    },
    [addTarget, onAddTool, onToggleActive, warnIfDuplicateType],
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

  const dialogTitle =
    addTarget == null
      ? ""
      : t("maps.toolsAddToPlacement", {
          placement: t(
            addTarget === "unplaced"
              ? "maps.toolsUnplacedTitle"
              : `maps.toolPlacement.${addTarget}`,
          ),
        });

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
      {unplacedTools.some(
        (tool) =>
          tool.type !== "information" &&
          tool.type !== "preset" &&
          tool.type !== "externalLinks",
      ) ? (
        <MapToolsUnplaced
          tools={unplacedTools.filter(
            (tool) =>
              tool.active &&
              tool.type !== "information" &&
              tool.type !== "preset" &&
              tool.type !== "externalLinks",
          )}
          onAdd={() => setAddTarget("unplaced")}
          onOpenSettings={openSettings}
          onRemove={(toolId: number) => onToggleActive(toolId, false)}
        />
      ) : null}
      {clickMode && armedToolId != null ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 1.5,
            py: 0.75,
            mb: 2,
            borderRadius: 1,
            bgcolor: "action.selected",
          }}
        >
          <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
            {t("layerTree.clickPlace.holding", {
              name: heldToolName(armedToolId),
            })}
          </Typography>
        </Box>
      ) : null}
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
              fixedBefore={zone === "controlButton" ? fixedControls.before : []}
              fixedAfter={zone === "controlButton" ? fixedControls.after : []}
              onLocateSetting={onLocateSetting}
              onRejectPlace={warnCannotPlace}
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
