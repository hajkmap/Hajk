import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import type { GridRenderCellParams } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import type { ToolOnMap, ToolWindowPosition, ToolZone } from "../../../api/maps";
import type { Tool } from "../../../api/tools";
import StyledDataGrid from "../../../components/data-grid";
import {
  findToolZoneForId,
  getCatalogToolDisplayName,
  type ToolZones,
  zoneKeyToTarget,
} from "../map-tools-utils";

const TOOL_PLACEMENT_OPTIONS: ToolZone[] = [
  "drawer",
  "widgetLeft",
  "widgetRight",
  "controlButton",
];

const WINDOW_PLACEMENT_OPTIONS: ToolWindowPosition[] = ["left", "right"];

interface MapToolsListProps {
  catalogTools: Tool[];
  mapTools: ToolOnMap[];
  toolZones: ToolZones;
  activeToolIds: Set<number>;
  windowPositions: Record<number, ToolWindowPosition>;
  onToggleActive: (toolId: number, active: boolean) => void;
  onTargetChange: (toolId: number, target: ToolZone | null) => void;
  onWindowPositionChange: (
    toolId: number,
    position: ToolWindowPosition,
  ) => void;
}

export default function MapToolsList({
  catalogTools,
  mapTools,
  toolZones,
  activeToolIds,
  windowPositions,
  onToggleActive,
  onTargetChange,
  onWindowPositionChange,
}: MapToolsListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const rows = useMemo(() => {
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
    activeToolIds,
    toolZones,
    windowPositions,
  ]);

  return (
    <Box>
      <Box sx={{ mb: 2, width: { xs: "100%", sm: "50%", md: "33%" } }}>
        <TextField
          fullWidth
          label={t("tools.searchTitle")}
          variant="outlined"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </Box>

      {rows.length === 0 ? (
        <Typography color="text.secondary">
          {t("maps.toolsCatalogEmpty")}
        </Typography>
      ) : (
        <StyledDataGrid
          storageKey="map-tools"
          customSx={{ height: "calc(100vh - 380px)" }}
          rows={rows}
          columns={[
            {
              field: "title",
              flex: 0.25,
              headerName: t("tools.title"),
            },
            {
              field: "type",
              flex: 0.15,
              headerName: t("tools.type"),
            },
            {
              field: "active",
              width: 90,
              headerName: t("maps.toolsActive"),
              align: "center",
              headerAlign: "center",
              sortable: false,
              filterable: false,
              disableColumnMenu: true,
              renderCell: (
                params: GridRenderCellParams<(typeof rows)[number]>,
              ) => (
                <Switch
                  size="small"
                  checked={params.row.active}
                  aria-label={t("maps.toolsActive")}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => {
                    onToggleActive(params.row.toolId, event.target.checked);
                  }}
                />
              ),
            },
            {
              field: "target",
              flex: 0.2,
              headerName: t("maps.toolsToolPlacement"),
              sortable: false,
              filterable: false,
              disableColumnMenu: true,
              renderCell: (
                params: GridRenderCellParams<(typeof rows)[number]>,
              ) => (
                <FormControl
                  size="small"
                  fullWidth
                  disabled={!params.row.active}
                  onClick={(event) => event.stopPropagation()}
                >
                  <Select
                    displayEmpty
                    value={params.row.target}
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
              ),
            },
            {
              field: "windowPosition",
              flex: 0.15,
              headerName: t("maps.toolsWindowPlacement"),
              sortable: false,
              filterable: false,
              disableColumnMenu: true,
              renderCell: (
                params: GridRenderCellParams<(typeof rows)[number]>,
              ) => (
                <FormControl
                  size="small"
                  fullWidth
                  disabled={!params.row.active}
                  onClick={(event) => event.stopPropagation()}
                >
                  <Select
                    value={params.row.windowPosition}
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
              ),
            },
            {
              field: "index",
              width: 90,
              headerName: t("maps.toolsOrder"),
              align: "center",
              headerAlign: "center",
              valueFormatter: (value: number | null) =>
                value ?? "—",
            },
            {
              field: "actions",
              headerName: "",
              width: 56,
              sortable: false,
              filterable: false,
              disableColumnMenu: true,
              align: "center",
              renderCell: (
                params: GridRenderCellParams<(typeof rows)[number]>,
              ) => (
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
          ]}
        />
      )}
    </Box>
  );
}
