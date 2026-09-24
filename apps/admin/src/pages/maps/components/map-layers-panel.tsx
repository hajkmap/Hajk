import LayersIcon from "@mui/icons-material/Layers";
import {
  Box,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import LayerKindBadge from "../../layers/components/layer-kind-badge";
import {
  supportsBackground,
  type MapLayerActivationRow,
} from "../map-layer-activation";

interface MapLayersPanelProps {
  rows: MapLayerActivationRow[];
  onRowsChange: (rows: MapLayerActivationRow[]) => void;
}

export default function MapLayersPanel({
  rows,
  onRowsChange,
}: MapLayersPanelProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const visibleRows = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return rows;
    }
    return rows.filter((row) => row.name.toLowerCase().includes(normalized));
  }, [rows, search]);

  const allVisibleActive =
    visibleRows.length > 0 && visibleRows.every((row) => row.active);
  const someVisibleActive = visibleRows.some((row) => row.active);

  const updateRow = (
    layerId: string,
    patch: Partial<Pick<MapLayerActivationRow, "active" | "isBackground">>,
  ) => {
    onRowsChange(
      rows.map((row) => {
        if (row.layerId !== layerId) {
          return row;
        }
        const next = { ...row, ...patch };
        if (!supportsBackground(next.layerKind)) {
          next.isBackground = false;
        }
        return next;
      }),
    );
  };

  const setVisibleActive = (active: boolean) => {
    const visibleIds = new Set(visibleRows.map((row) => row.layerId));
    onRowsChange(
      rows.map((row) => {
        if (!visibleIds.has(row.layerId)) {
          return row;
        }
        return { ...row, active };
      }),
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minHeight: { xs: 360, lg: "clamp(480px, calc(100vh - 280px), 720px)" },
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {t("maps.layersTab.help")}
      </Typography>

      <TextField
        size="small"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t("common.search-layers")}
        fullWidth
      />

      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
        }}
      >
        {visibleRows.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t("maps.layersTab.noLayers")}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            <ListItem
              divider
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                py: 0.5,
                px: 1.5,
                position: "sticky",
                top: 0,
                zIndex: 1,
                bgcolor: "background.paper",
              }}
            >
              <Box sx={{ flex: 1 }} />
              <FormControlLabel
                sx={{ mr: 0, ml: 0 }}
                control={
                  <Checkbox
                    size="small"
                    checked={allVisibleActive}
                    indeterminate={someVisibleActive && !allVisibleActive}
                    onChange={(_, checked) => setVisibleActive(checked)}
                  />
                }
                label={t("maps.layersTab.activateAll")}
              />
            </ListItem>
            {visibleRows.map((row) => {
              const showBackground = supportsBackground(row.layerKind);
              return (
                <ListItem
                  key={row.layerId}
                  divider
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    py: 0.75,
                    px: 1.5,
                  }}
                >
                  <LayersIcon fontSize="small" color="action" />
                  <Typography
                    variant="body2"
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.name}
                  </Typography>
                  <LayerKindBadge layerKind={row.layerKind} />
                  <FormControlLabel
                    sx={{ mr: showBackground ? 1 : 0, ml: 0 }}
                    control={
                      <Checkbox
                        size="small"
                        checked={row.active}
                        onChange={(_, checked) =>
                          updateRow(row.layerId, { active: checked })
                        }
                      />
                    }
                    label={t("maps.layersTab.active")}
                  />
                  {showBackground ? (
                    <FormControlLabel
                      sx={{ mr: 0 }}
                      control={
                        <Checkbox
                          size="small"
                          checked={row.active && row.isBackground}
                          disabled={!row.active}
                          onChange={(_, checked) =>
                            updateRow(row.layerId, { isBackground: checked })
                          }
                        />
                      }
                      label={t("common.usage.BACKGROUND")}
                    />
                  ) : null}
                </ListItem>
              );
            })}
          </List>
        )}
      </Paper>
    </Box>
  );
}
