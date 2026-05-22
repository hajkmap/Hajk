import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Tooltip,
  TextField,
  Button,
  Typography,
  IconButton,
  Dialog,
  DialogContent,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import CircularProgress from "../../components/progress/circular-progress";
import { toast } from "react-toastify";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import { LayersGridProps, useLayersByServiceId } from "../../api/services";
import { GRID_SWEDISH_LOCALE_TEXT } from "../../i18n/translations/datagrid/sv";
import useAppStateStore from "../../store/use-app-state-store";
import { useCreateLayer } from "../../api/layers";
import LayerKindBadge from "../layers/components/layer-kind-badge";
import LayerKindSelect from "../layers/components/layer-kind-select";
import {
  getLayerSettingsPath,
  LAYER_CATEGORY_I18N_KEYS,
  LayerCategory,
  normalizeLayerCategory,
} from "../layers/layer-category";

interface CapabilityRow {
  id: number;
  layer: string;
  infoClick: string;
  publications: string;
}

interface PublishedLayerRow {
  id: string;
  name: string;
  layerKind: LayerCategory;
}

function LayersGrid({
  layers,
  workspaces,
  serviceId,
  isError,
  isLoading,
  onRetry,
}: LayersGridProps) {
  const { t } = useTranslation();
  const [dialogSearchTerm, setDialogSearchTerm] = useState("");
  const [serviceLayerSearch, setServiceLayerSearch] = useState("");
  const language = useAppStateStore((state) => state.language);
  const themeMode = useAppStateStore((state) => state.themeMode);
  const isDarkMode = themeMode === "dark";
  const { palette } = useTheme();
  const { mutateAsync: createLayer, isPending: isCreatingLayer } =
    useCreateLayer(serviceId ?? "");
  const [creatingLayerName, setCreatingLayerName] = useState<string | null>(
    null,
  );
  const { data: layersByService, isLoading: isLoadingLayersByService } =
    useLayersByServiceId(serviceId);
  const [open, setOpen] = React.useState(false);
  const [publishLayerKind, setPublishLayerKind] =
    useState<LayerCategory>("display");
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [capabilitiesPaginationModel, setCapabilitiesPaginationModel] =
    useState(() => {
      const stored = localStorage.getItem("capabilities-dialog-page-size");
      const parsed = Number(stored);
      const pageSize = [10, 25, 50, 100].includes(parsed) ? parsed : 10;
      return { page: 0, pageSize };
    });
  const navigate = useNavigate();

  const handleClose = () => {
    setOpen(false);
    setSelectedWorkspace("");
  };

  const tooltipSlotProps = {
    tooltip: {
      sx: {
        "&&": {
          bgcolor: "background.paper",
          color: "text.primary",
          border: "1px solid black",
          borderRadius: 0,
          boxShadow: "none",
          fontSize: "1.1rem",
        },
      },
    },
  } as const;

  const handleCreateLayer = async (
    layerName: string,
    layerKind: LayerCategory = publishLayerKind,
  ) => {
    setCreatingLayerName(layerName);
    try {
      const response = await createLayer({
        layerKind,
        serviceId,
        name: layerName,
        selectedLayers: [layerName],
      });
      void navigate(
        getLayerSettingsPath(layerKind, response?.id ?? "", serviceId),
      );
    } catch (error) {
      console.error("Failed to create layer:", error);
      toast.error(t("layers.createLayerFailed"), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    } finally {
      setCreatingLayerName(null);
    }
  };

  const capabilitiesColumns: GridColDef[] = [
    {
      field: "layer",
      headerName: t("common.layerName"),
      flex: 1,
      renderCell: (params: GridRenderCellParams<CapabilityRow>) => (
        <Tooltip
          title={params.value as string}
          enterDelay={500}
          enterNextDelay={500}
          slotProps={tooltipSlotProps}
        >
          <Box
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              width: "100%",
            }}
          >
            {params.value}
          </Box>
        </Tooltip>
      ),
    },
    { field: "infoClick", headerName: t("common.infoclick"), flex: 0.3 },
    { field: "publications", headerName: t("common.publications"), flex: 0.5 },
    {
      field: "actions",
      headerName: "",
      width: 56,
      sortable: false,
      renderCell: (params: GridRenderCellParams<CapabilityRow>) => {
        const layerName = params.row.layer;
        return (
          <Tooltip
            title={`${t("services.publishLayerAction")} (${t(LAYER_CATEGORY_I18N_KEYS[publishLayerKind])})`}
            slotProps={tooltipSlotProps}
          >
            <span>
              <IconButton
                color="primary"
                disabled={isCreatingLayer}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleCreateLayer(layerName);
                }}
              >
                {creatingLayerName === layerName ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <AddCircleOutlineIcon />
                )}
              </IconButton>
            </span>
          </Tooltip>
        );
      },
    },
  ];

  // Capabilities layers filtered by dialog search and workspace
  const filteredCapabilityLayers = useMemo(() => {
    if (!layers) return [];
    return layers
      .map((layer, index) => ({
        id: index,
        layer,
        infoClick: "",
        publications: "",
      }))
      .filter((layer) => {
        const matchesSearch = layer.layer
          .toLowerCase()
          .includes(dialogSearchTerm.toLowerCase());
        const matchesWorkspace =
          !selectedWorkspace || layer.layer.startsWith(selectedWorkspace + ":");
        return matchesSearch && matchesWorkspace;
      });
  }, [layers, dialogSearchTerm, selectedWorkspace]);

  // Existing service layers filtered by main search
  const filteredLayersByService = useMemo<PublishedLayerRow[]>(() => {
    if (!layersByService?.layers) return [];
    return layersByService.layers
      .filter((layer) =>
        layer.name.toLowerCase().includes(serviceLayerSearch.toLowerCase()),
      )
      .map((layer) => ({
        id: layer.id,
        name: layer.name,
        layerKind: normalizeLayerCategory(layer.layerKind),
      }));
  }, [layersByService?.layers, serviceLayerSearch]);

  const hasExistingLayers = (layersByService?.layers?.length ?? 0) > 0;

  return (
    <Paper
      sx={{
        width: "100%",
        p: 2,
        mb: 3,
        backgroundColor: isDarkMode ? "#121212" : "#efefef",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
          mt: -0.5,
        }}
      >
        <Typography variant="h6">{t("services.publishedLayers")}</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          {hasExistingLayers
            ? t("services.publishLayerAction")
            : t("services.publishLayer")}
        </Button>
      </Box>

      <TextField
        sx={{
          mb: 3,
          mt: 1,
          width: "100%",
          maxWidth: "400px",
          backgroundColor: isDarkMode ? "#3b3b3b" : "#fbfbfb",
        }}
        label={t("common.search")}
        variant="outlined"
        value={serviceLayerSearch}
        onChange={(e) => setServiceLayerSearch(e.target.value)}
        slotProps={{
          input: { endAdornment: <SearchIcon /> },
        }}
      />

      {!isLoadingLayersByService && !hasExistingLayers && (
        <Typography sx={{ textAlign: "center", fontSize: "large", mt: 1 }}>
          {t("services.layerInServiceNone")}
        </Typography>
      )}

      {(isLoadingLayersByService || hasExistingLayers) && (
        <DataGrid
          sx={{
            maxWidth: "100%",
            mb: 2,
            mt: 1,
            height: "auto",
            backgroundColor: isDarkMode ? "#3b3b3b" : "#fbfbfb",
            "& .MuiDataGrid-row": { cursor: "pointer" },
          }}
          rows={filteredLayersByService}
          columns={[
            {
              field: "layerKind",
              headerName: t("layers.layerKind"),
              width: 160,
              renderCell: (params: GridRenderCellParams<PublishedLayerRow>) => (
                <LayerKindBadge layerKind={params.row.layerKind} />
              ),
            },
            {
              field: "name",
              headerName: t("common.name"),
              flex: 1,
              renderCell: (params: GridRenderCellParams<PublishedLayerRow>) => (
                <Tooltip
                  title={params.value as string}
                  enterDelay={500}
                  enterNextDelay={500}
                  slotProps={tooltipSlotProps}
                >
                  <Box
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      width: "100%",
                    }}
                  >
                    {params.value as string}
                  </Box>
                </Tooltip>
              ),
            },
          ]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          slotProps={{
            loadingOverlay: {
              variant: "skeleton",
              noRowsVariant: "skeleton",
            },
          }}
          hideFooter={filteredLayersByService.length <= 10}
          pageSizeOptions={[10, 25, 50, 100]}
          pagination
          loading={isLoadingLayersByService}
          localeText={language === "sv" ? GRID_SWEDISH_LOCALE_TEXT : undefined}
          onRowClick={({ row }: { row: PublishedLayerRow }) => {
            void navigate(getLayerSettingsPath(row.layerKind, row.id));
          }}
          disableMultipleRowSelection
          disableRowSelectionOnClick
        />
      )}

      <Dialog open={open} fullWidth onClose={handleClose} maxWidth="lg">
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 2,
              mb: 1,
            }}
          >
            <Box
              sx={{ display: "flex", gap: 2, flex: 1, mt: 1, flexWrap: "wrap" }}
            >
              <LayerKindSelect
                value={publishLayerKind}
                onChange={setPublishLayerKind}
                labelKey="layers.publishAs"
              />
              <TextField
                sx={{
                  width: "100%",
                  maxWidth: "400px",
                  backgroundColor: isDarkMode ? "#3b3b3b" : "#fbfbfb",
                }}
                label={t("common.search")}
                variant="outlined"
                value={dialogSearchTerm}
                onChange={(e) => setDialogSearchTerm(e.target.value)}
                slotProps={{
                  input: { endAdornment: <SearchIcon /> },
                }}
              />
              {workspaces && workspaces.length > 0 && (
                <FormControl
                  sx={{
                    minWidth: 160,
                    backgroundColor: isDarkMode ? "#3b3b3b" : "#fbfbfb",
                  }}
                >
                  <InputLabel>{t("services.workspace")}</InputLabel>
                  <Select
                    label={t("services.workspace")}
                    value={selectedWorkspace}
                    onChange={(e) => setSelectedWorkspace(e.target.value)}
                  >
                    <MenuItem value="">{t("common.all")}</MenuItem>
                    {workspaces.map((ws) => (
                      <MenuItem key={ws} value={ws}>
                        {ws}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
            <IconButton onClick={handleClose} aria-label="close" sx={{ mt: 1 }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {isLoading ? (
            <CircularProgress
              color="primary"
              size={40}
              typographyText={t("services.loadingLayers")}
            />
          ) : isError ? (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Typography color="error" sx={{ mb: 2 }}>
                {t("services.error.url")}
              </Typography>
              {onRetry && (
                <Button variant="outlined" onClick={onRetry}>
                  {t("common.retry")}
                </Button>
              )}
            </Box>
          ) : filteredCapabilityLayers.length === 0 ? (
            <Typography align="center" color="text.secondary">
              {t("services.error.layers")}
            </Typography>
          ) : (
            <DataGrid
              sx={{
                maxWidth: "100%",
                mb: 2,
                mt: 1,
                height: 400,
                backgroundColor: isDarkMode ? "#3b3b3b" : "#fbfbfb",
                "& .MuiDataGrid-cell:focus": { outline: "none" },
                "& .MuiDataGrid-cell:focus-within": { outline: "none" },
              }}
              rows={filteredCapabilityLayers}
              columns={capabilitiesColumns}
              paginationModel={capabilitiesPaginationModel}
              onPaginationModelChange={(model) => {
                setCapabilitiesPaginationModel(model);
                localStorage.setItem(
                  "capabilities-dialog-page-size",
                  String(model.pageSize),
                );
              }}
              slotProps={{
                loadingOverlay: {
                  variant: "skeleton",
                  noRowsVariant: "skeleton",
                },
              }}
              hideFooter={
                filteredCapabilityLayers.length <=
                capabilitiesPaginationModel.pageSize
              }
              pageSizeOptions={[10, 25, 50, 100]}
              pagination
              loading={isLoading}
              localeText={
                language === "sv" ? GRID_SWEDISH_LOCALE_TEXT : undefined
              }
              disableRowSelectionOnClick
            />
          )}
        </DialogContent>
      </Dialog>
    </Paper>
  );
}

export default LayersGrid;
