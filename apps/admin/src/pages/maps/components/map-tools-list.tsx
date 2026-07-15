import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { useNavigate } from "react-router";
import {
  Box,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import type { GridRenderCellParams } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  ListFilterField,
  ListFilterRow,
  ListFilterSearch,
} from "../../../components/form-components/list-filter-row";
import type {
  ToolOnMap,
  ToolWindowPosition,
  ToolZone,
} from "../../../api/maps";
import type { Tool } from "../../../api/tools";
import StyledDataGrid from "../../../components/data-grid";
import {
  findToolZoneForId,
  getCatalogToolDisplayName,
  getCatalogToolWindowSize,
  type ToolWindowSize,
  type ToolZones,
  zoneKeyToTarget,
} from "../map-tools-utils";
import {
  getMapToolFieldConfig,
  type MapToolFieldConfig,
} from "../map-tool-field-config";

const TOOL_PLACEMENT_OPTIONS: ToolZone[] = [
  "drawer",
  "widgetLeft",
  "widgetRight",
  "controlButton",
];

const WINDOW_PLACEMENT_OPTIONS: ToolWindowPosition[] = ["left", "right"];

const CELL_FIELD_SX = { mt: 0.5, width: "100%", minWidth: 0 };

function NotApplicableCell() {
  return (
    <Typography color="text.secondary" sx={{ px: 0.5 }}>
      —
    </Typography>
  );
}

const MAP_TOOLS_GRID_SX = {
  height: "calc(100vh - 320px)",
  minHeight: 420,
  "& .MuiDataGrid-columnHeader": {
    minHeight: "48px !important",
    maxHeight: "none !important",
  },
  "& .MuiDataGrid-columnHeaderTitleContainer": {
    alignItems: "flex-start",
    py: 0.5,
  },
  "& .MuiDataGrid-columnHeaderTitle": {
    fontSize: "0.9125rem",
    fontWeight: 600,
    lineHeight: 1.25,
    whiteSpace: "normal",
  },
  "& .MuiDataGrid-cell": {
    display: "flex",
    alignItems: "center",
    py: 0.75,
  },
};

interface WindowSizeNumberInputProps {
  toolId: number;
  value?: number;
  placeholder?: string;
  disabled: boolean;
  dimension: "width" | "height";
  onCommit: (toolId: number, size: Partial<ToolWindowSize>) => void;
  onPendingChange: (
    toolId: number,
    dimension: "width" | "height",
    nextValue: number | undefined,
    committedValue: number | undefined,
  ) => void;
  onRegisterFlush: (flush: () => void) => void;
  onUnregisterFlush: (flush: () => void) => void;
}

const WindowSizeNumberInput = memo(function WindowSizeNumberInput({
  toolId,
  value,
  placeholder,
  disabled,
  dimension,
  onCommit,
  onPendingChange,
  onRegisterFlush,
  onUnregisterFlush,
}: WindowSizeNumberInputProps) {
  const [localValue, setLocalValue] = useState(
    value != null ? String(value) : "",
  );
  const localValueRef = useRef(localValue);
  const valueRef = useRef(value);
  const onCommitRef = useRef(onCommit);

  useEffect(() => {
    localValueRef.current = localValue;
  }, [localValue]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  const flushCommit = useCallback(() => {
    const raw = localValueRef.current;
    const parsed = Number.parseInt(raw, 10);
    const next = raw === "" || Number.isNaN(parsed) ? undefined : parsed;
    onPendingChange(toolId, dimension, next, next);
    if (next === valueRef.current) {
      return;
    }
    onCommitRef.current(toolId, { [dimension]: next });
  }, [toolId, dimension, onPendingChange]);

  useEffect(() => {
    const currentRaw = localValueRef.current;
    const currentParsed = Number.parseInt(currentRaw, 10);
    const currentValue =
      currentRaw === "" || Number.isNaN(currentParsed) ? undefined : currentParsed;
    onPendingChange(toolId, dimension, currentValue, value);
  }, [toolId, dimension, value, onPendingChange]);

  useEffect(() => {
    onRegisterFlush(flushCommit);
    return () => {
      flushCommit();
      onUnregisterFlush(flushCommit);
    };
  }, [flushCommit, onRegisterFlush, onUnregisterFlush]);

  return (
    <TextField
      size="small"
      type="text"
      fullWidth
      sx={CELL_FIELD_SX}
      disabled={disabled}
      value={localValue}
      placeholder={placeholder}
      slotProps={{
        htmlInput: { inputMode: "numeric", pattern: "[0-9]*" },
      }}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => {
        const next = event.target.value;
        if (next === "" || /^\d+$/.test(next)) {
          const parsed = Number.parseInt(next, 10);
          const nextValue =
            next === "" || Number.isNaN(parsed) ? undefined : parsed;
          onPendingChange(toolId, dimension, nextValue, valueRef.current);
          setLocalValue(next);
        }
      }}
      onBlur={flushCommit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          flushCommit();
        }
      }}
    />
  );
});

interface MapToolGridRow {
  id: number;
  toolId: number;
  title: string;
  type: string;
  active: boolean;
  target: ToolZone | "";
  windowPosition: ToolWindowPosition;
  index: number | null;
}

function fieldsForToolType(toolType: string): MapToolFieldConfig {
  return getMapToolFieldConfig(toolType);
}

interface MapToolsListProps {
  catalogTools: Tool[];
  mapTools: ToolOnMap[];
  toolZones: ToolZones;
  activeToolIds: Set<number>;
  windowPositions: Record<number, ToolWindowPosition>;
  windowSizes: Record<number, ToolWindowSize>;
  onToggleActive: (toolId: number, active: boolean) => void;
  onTargetChange: (toolId: number, target: ToolZone | null) => void;
  onWindowPositionChange: (
    toolId: number,
    position: ToolWindowPosition,
  ) => void;
  onWindowSizeChange: (toolId: number, size: Partial<ToolWindowSize>) => void;
  flushPendingEditsRef?: MutableRefObject<(() => void) | null>;
  onPendingWindowSizeDirtyChange?: (pending: boolean) => void;
}

export default function MapToolsList({
  catalogTools,
  mapTools,
  toolZones,
  activeToolIds,
  windowPositions,
  windowSizes,
  onToggleActive,
  onTargetChange,
  onWindowPositionChange,
  onWindowSizeChange,
  flushPendingEditsRef,
  onPendingWindowSizeDirtyChange,
}: MapToolsListProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const flushCallbacksRef = useRef(new Set<() => void>());
  const pendingFieldsRef = useRef(new Set<string>());
  const pendingWindowSizesRef = useRef(new Map<number, Partial<ToolWindowSize>>());

  const registerFlush = useCallback((flush: () => void) => {
    flushCallbacksRef.current.add(flush);
  }, []);

  const unregisterFlush = useCallback((flush: () => void) => {
    flushCallbacksRef.current.delete(flush);
  }, []);

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
          if (currentPending.width == null && currentPending.height == null) {
            pendingWindowSizes.delete(toolId);
          } else {
            pendingWindowSizes.set(toolId, currentPending);
          }
        }
      }

      if (
        onPendingWindowSizeDirtyChange &&
        (previousSize === 0) !== (pendingFields.size === 0)
      ) {
        onPendingWindowSizeDirtyChange(pendingFields.size > 0);
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
      if (size.width == null && size.height == null) {
        return;
      }
      onWindowSizeChange(toolId, size);
    });
  }, [onPendingWindowSizeDirtyChange, onWindowSizeChange]);

  useEffect(() => {
    if (!flushPendingEditsRef) {
      return;
    }

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

  const catalogToolsById = useMemo(
    () => new Map(catalogTools.map((tool) => [Number(tool.id), tool])),
    [catalogTools],
  );

  const typeOptions = useMemo(
    () =>
      [...new Set(catalogTools.map((tool) => tool.type))].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      ),
    [catalogTools],
  );

  const hasActiveFilters = searchTerm.trim() !== "" || typeFilter !== "";

  const handleToggleActive = useCallback(
    (toolId: number, active: boolean) => {
      if (active) {
        const toolType = catalogToolsById.get(toolId)?.type;
        if (toolType) {
          const conflictingId = [...activeToolIds].find(
            (id) =>
              id !== toolId && catalogToolsById.get(id)?.type === toolType,
          );
          if (conflictingId != null) {
            const conflictingTool = catalogToolsById.get(conflictingId);
            const activatingTool = catalogToolsById.get(toolId);
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
          }
        }
      }

      onToggleActive(toolId, active);
    },
    [activeToolIds, catalogToolsById, onToggleActive, t, theme.palette.mode],
  );

  const rows = useMemo((): MapToolGridRow[] => {
    const query = searchTerm.trim().toLowerCase();
    const mapToolsById = new Map(mapTools.map((tool) => [tool.toolId, tool]));

    return catalogTools
      .slice()
      .sort((a, b) =>
        getCatalogToolDisplayName(a).localeCompare(
          getCatalogToolDisplayName(b),
          undefined,
          { sensitivity: "base" },
        ),
      )
      .filter((tool) => {
        if (typeFilter && tool.type !== typeFilter) return false;
        if (!query) return true;
        const title = getCatalogToolDisplayName(tool).toLowerCase();
        return title.includes(query) || tool.type.toLowerCase().includes(query);
      })
      .map((tool) => {
        const toolId = Number(tool.id);
        const onMap = mapToolsById.get(toolId);
        const active = activeToolIds.has(toolId);
        const zone = active ? findToolZoneForId(toolZones, toolId) : null;

        return {
          id: toolId,
          toolId,
          title: getCatalogToolDisplayName(tool),
          type: tool.type,
          active,
          target: zone ? zoneKeyToTarget(zone) : ("" as const),
          windowPosition: windowPositions[toolId] ?? "right",
          index: onMap?.index ?? null,
        };
      });
  }, [
    catalogTools,
    mapTools,
    searchTerm,
    typeFilter,
    activeToolIds,
    toolZones,
    windowPositions,
  ]);

  const columns = useMemo(
    () => [
      {
        field: "title",
        flex: 0.9,
        minWidth: 100,
        headerName: t("tools.title"),
      },
      {
        field: "type",
        flex: 0.7,
        minWidth: 90,
        headerName: t("tools.type"),
      },
      {
        field: "active",
        width: 76,
        minWidth: 76,
        headerName: t("maps.toolsActive"),
        align: "center" as const,
        headerAlign: "center" as const,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams<MapToolGridRow>) => (
          <Switch
            size="small"
            checked={params.row.active}
            aria-label={t("maps.toolsActive")}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => {
              handleToggleActive(params.row.toolId, event.target.checked);
            }}
          />
        ),
      },
      {
        field: "target",
        flex: 1.2,
        minWidth: 180,
        headerName: t("maps.toolsToolPlacement"),
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams<MapToolGridRow>) => {
          const fields = fieldsForToolType(params.row.type);
          if (!fields.target) {
            return <NotApplicableCell />;
          }

          const placementLabel =
            params.row.target === ""
              ? t("maps.toolPlacement.unplaced")
              : t(`maps.toolPlacement.${params.row.target}`);

          return (
            <FormControl
              size="small"
              fullWidth
              sx={CELL_FIELD_SX}
              disabled={!params.row.active}
              onClick={(event) => event.stopPropagation()}
            >
              <Select
                displayEmpty
                value={params.row.target}
                renderValue={() => placementLabel}
                onChange={(event) => {
                  const value = event.target.value as ToolZone | "";
                  onTargetChange(
                    params.row.toolId,
                    value === "" ? null : value,
                  );
                }}
              >
                <MenuItem value="">
                  <em>{t("maps.toolPlacement.unplaced")}</em>
                </MenuItem>
                {TOOL_PLACEMENT_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {t(`maps.toolPlacement.${option}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        },
      },
      {
        field: "windowPosition",
        flex: 1,
        minWidth: 130,
        headerName: t("maps.toolsWindowPlacement"),
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams<MapToolGridRow>) => {
          const fields = fieldsForToolType(params.row.type);
          if (!fields.windowPosition) {
            return <NotApplicableCell />;
          }

          const positionLabel = t(
            `maps.windowPlacement.${params.row.windowPosition}`,
          );

          return (
            <FormControl
              size="small"
              fullWidth
              sx={CELL_FIELD_SX}
              disabled={!params.row.active}
              onClick={(event) => event.stopPropagation()}
            >
              <Select
                value={params.row.windowPosition}
                renderValue={() => positionLabel}
                onChange={(event) => {
                  onWindowPositionChange(
                    params.row.toolId,
                    event.target.value,
                  );
                }}
              >
                {WINDOW_PLACEMENT_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {t(`maps.windowPlacement.${option}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        },
      },
      {
        field: "windowWidth",
        width: 120,
        minWidth: 120,
        headerName: t("tools.windowWidth"),
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams<MapToolGridRow>) => {
          const fields = fieldsForToolType(params.row.type);
          if (!fields.windowWidth) {
            return <NotApplicableCell />;
          }

          const size = windowSizes[params.row.toolId] ?? {};
          const catalogTool = catalogToolsById.get(params.row.toolId);
          const defaultSize = catalogTool
            ? getCatalogToolWindowSize(catalogTool)
            : {};

          return (
            <WindowSizeNumberInput
              key={`${params.row.toolId}-width-${size.width ?? ""}`}
              toolId={params.row.toolId}
              value={size.width}
              placeholder={
                defaultSize.width != null
                  ? String(defaultSize.width)
                  : undefined
              }
              disabled={!params.row.active}
              dimension="width"
              onCommit={onWindowSizeChange}
              onPendingChange={setPendingFieldState}
              onRegisterFlush={registerFlush}
              onUnregisterFlush={unregisterFlush}
            />
          );
        },
      },
      {
        field: "windowHeight",
        width: 120,
        minWidth: 120,
        headerName: t("tools.windowHeight"),
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams<MapToolGridRow>) => {
          const fields = fieldsForToolType(params.row.type);
          if (!fields.windowHeight) {
            return <NotApplicableCell />;
          }

          const size = windowSizes[params.row.toolId] ?? {};
          const catalogTool = catalogToolsById.get(params.row.toolId);
          const defaultSize = catalogTool
            ? getCatalogToolWindowSize(catalogTool)
            : {};

          return (
            <WindowSizeNumberInput
              key={`${params.row.toolId}-height-${size.height ?? ""}`}
              toolId={params.row.toolId}
              value={size.height}
              placeholder={
                defaultSize.height != null
                  ? String(defaultSize.height)
                  : undefined
              }
              disabled={!params.row.active}
              dimension="height"
              onCommit={onWindowSizeChange}
              onPendingChange={setPendingFieldState}
              onRegisterFlush={registerFlush}
              onUnregisterFlush={unregisterFlush}
            />
          );
        },
      },
      {
        field: "index",
        width: 80,
        minWidth: 80,
        headerName: t("maps.toolsOrder"),
        align: "center" as const,
        headerAlign: "center" as const,
        renderCell: (params: GridRenderCellParams<MapToolGridRow>) => {
          if (!fieldsForToolType(params.row.type).index) {
            return <NotApplicableCell />;
          }
          return params.row.index ?? "—";
        },
      },
      {
        field: "actions",
        headerName: "",
        width: 56,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        align: "center" as const,
        renderCell: (params: GridRenderCellParams<MapToolGridRow>) => (
          <Tooltip title={t("common.settings")}>
            <IconButton
              size="small"
              aria-label={t("common.settings")}
              onClick={() => void navigate(`/tools/${params.row.toolId}`)}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [
      t,
      navigate,
      catalogToolsById,
      windowSizes,
      handleToggleActive,
      onTargetChange,
      onWindowPositionChange,
      onWindowSizeChange,
      setPendingFieldState,
      registerFlush,
      unregisterFlush,
    ],
  );

  return (
    <Box>
      <ListFilterRow>
        <ListFilterSearch>
          <TextField
            fullWidth
            label={t("tools.searchTitle")}
            variant="outlined"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </ListFilterSearch>
        <ListFilterField>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="map-tools-type-filter-label">
              {t("maps.toolsFilterByType")}
            </InputLabel>
            <Select
              labelId="map-tools-type-filter-label"
              label={t("maps.toolsFilterByType")}
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <MenuItem value="">{t("common.all")}</MenuItem>
              {typeOptions.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </ListFilterField>
      </ListFilterRow>

      {rows.length === 0 ? (
        <Typography color="text.secondary">
          {hasActiveFilters
            ? t("maps.toolsNoSearchResults")
            : t("maps.toolsCatalogEmpty")}
        </Typography>
      ) : (
        <StyledDataGrid
          storageKey="map-tools"
          columnHeaderHeight={48}
          rowHeight={52}
          customSx={MAP_TOOLS_GRID_SX}
          rows={rows}
          columns={columns}
        />
      )}
    </Box>
  );
}
