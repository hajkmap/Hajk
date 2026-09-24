import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Chip,
  Tooltip,
  TextField,
  Button,
  Typography,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  useTheme,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import CircularProgress from "../../components/progress/circular-progress";
import { toast } from "react-toastify";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { Trans, useTranslation } from "react-i18next";
import { LayersGridProps, useLayersByServiceId } from "../../api/services";
import { GRID_SWEDISH_LOCALE_TEXT } from "../../i18n/translations/datagrid/sv";
import useAppStateStore from "../../store/use-app-state-store";
import { useCreateLayer, type LayersApiResponse } from "../../api/layers";
import { LayerCreationError } from "../../api/layers/types";
import LayerKindBadge from "../layers/components/layer-kind-badge";
import LayerKindSelect from "../layers/components/layer-kind-select";
import {
  getLayerSettingsPath,
  getSelectableLayerCategories,
  LAYER_CATEGORIES,
  LAYER_CATEGORY_I18N_KEYS,
  LayerCategory,
  normalizeLayerCategory,
} from "../layers/layer-category";

type PublicationsByKind = Record<LayerCategory, PublishedLayerRow[]>;

interface CapabilityRow {
  id: number;
  layer: string;
  infoClick: string;
  publications: PublicationsByKind;
}

interface PublishedLayerRow {
  id: string;
  name: string;
  layerKind: LayerCategory;
}

const EMPTY_PUBLICATIONS: PublicationsByKind = {
  display: [],
  search: [],
  editing: [],
};

function buildPublicationsByLayerName(
  layersByService: LayersApiResponse | undefined,
): Map<string, PublicationsByKind> {
  const map = new Map<string, PublicationsByKind>();
  const existing = layersByService?.layers ?? [];
  for (const layer of existing) {
    const kind = normalizeLayerCategory(layer.layerKind);
    const sel = layer.selectedLayers ?? [];
    for (const name of sel) {
      const bucket = map.get(name) ?? {
        display: [],
        search: [],
        editing: [],
      };
      bucket[kind].push({ id: layer.id, name: layer.name, layerKind: kind });
      map.set(name, bucket);
    }
  }
  return map;
}

function LayersGrid({
  layers,
  workspaces,
  serviceId,
  serviceType,
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
  const [duplicateConfirm, setDuplicateConfirm] = useState<{
    layerName: string;
    layerKind: LayerCategory;
    existing: PublishedLayerRow[];
  } | null>(null);
  const [capabilitiesPaginationModel, setCapabilitiesPaginationModel] =
    useState(() => {
      const stored = localStorage.getItem("capabilities-dialog-page-size");
      const parsed = Number(stored);
      const pageSize = [10, 25, 50, 100].includes(parsed) ? parsed : 10;
      return { page: 0, pageSize };
    });
  const navigate = useNavigate();

  // `serviceType` comes from legacy admin data models where some values are not
  // strongly typed. We only need the string enum value here to control which
  // layer kinds can be selected.
  const serviceTypeValue = serviceType;

  const selectableLayerCategories = useMemo(
    () => getSelectableLayerCategories(serviceTypeValue),
    [serviceTypeValue],
  );

  // Keep a valid selection when service type (and thus options) changes —
  // derive during render instead of syncing in an effect.
  const resolvedPublishLayerKind = selectableLayerCategories.includes(
    publishLayerKind,
  )
    ? publishLayerKind
    : selectableLayerCategories[0];

  const handleOpenPublishDialog = () => {
    setOpen(true);
  };

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
    options: { layerKind?: LayerCategory; force?: boolean } = {},
  ) => {
    const layerKind = options.layerKind ?? resolvedPublishLayerKind;
    setCreatingLayerName(layerName);
    try {
      const response = await createLayer({
        layerKind,
        serviceId,
        name: layerName,
        selectedLayers: [layerName],
        ...(options.force ? { force: true } : {}),
      });
      void navigate(
        getLayerSettingsPath(layerKind, response?.id ?? "", serviceId),
      );
    } catch (error) {
      // Backend-driven safety net: even if our local cache says no
      // duplicate exists, the backend may still 409 (e.g. another admin
      // just published a duplicate). Surface the same confirmation dialog
      // so the admin can decide to override with `force: true`.
      if (error instanceof LayerCreationError && error.isDuplicatePublication) {
        const existing =
          publicationsByLayerName.get(layerName)?.[layerKind] ?? [];
        setDuplicateConfirm({ layerName, layerKind, existing });
        return;
      }
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

  // Click handler for the add icon. Opens a confirmation dialog when a
  // same-kind publication already exists locally; otherwise lets the
  // backend be the source of truth (it may still 409 on race conditions).
  const handleAddClick = (layerName: string, pubs: PublicationsByKind) => {
    const sameKind = pubs[resolvedPublishLayerKind];
    if (sameKind.length > 0) {
      setDuplicateConfirm({
        layerName,
        layerKind: resolvedPublishLayerKind,
        existing: sameKind,
      });
      return;
    }
    void handleCreateLayer(layerName);
  };

  const handleConfirmDuplicate = () => {
    if (!duplicateConfirm) return;
    const { layerName, layerKind } = duplicateConfirm;
    setDuplicateConfirm(null);
    void handleCreateLayer(layerName, { layerKind, force: true });
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
    {
      field: "publications",
      headerName: t("common.publications"),
      flex: 0.6,
      sortable: false,
      valueGetter: (_value, row: CapabilityRow) =>
        LAYER_CATEGORIES.reduce(
          (sum, kind) => sum + row.publications[kind].length,
          0,
        ),
      renderCell: (params: GridRenderCellParams<CapabilityRow>) => {
        const pubs = params.row.publications;
        const chips = LAYER_CATEGORIES.filter(
          (kind) => pubs[kind].length > 0,
        ).map((kind) => {
          const isSameKind = kind === resolvedPublishLayerKind;
          return (
            <Chip
              key={kind}
              size="small"
              color={
                kind === "display"
                  ? "primary"
                  : kind === "search"
                    ? "secondary"
                    : "info"
              }
              variant={isSameKind ? "filled" : "outlined"}
              label={`${t(LAYER_CATEGORY_I18N_KEYS[kind])} ${t(
                "services.publications.count",
                { count: pubs[kind].length },
              )}`}
            />
          );
        });
        if (chips.length === 0) return null;
        return (
          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              flexWrap: "wrap",
              rowGap: 0.5,
              alignItems: "center",
              height: "100%",
              width: "100%",
            }}
          >
            {chips}
          </Stack>
        );
      },
    },
    {
      field: "actions",
      headerName: "",
      width: 56,
      sortable: false,
      renderCell: (params: GridRenderCellParams<CapabilityRow>) => {
        const layerName = params.row.layer;
        const pubs = params.row.publications;
        const sameKindCount = pubs[resolvedPublishLayerKind].length;

        return (
          <IconButton
            color={sameKindCount > 0 ? "warning" : "primary"}
            disabled={isCreatingLayer}
            onClick={(e) => {
              e.stopPropagation();
              handleAddClick(layerName, pubs);
            }}
          >
            {creatingLayerName === layerName ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <AddCircleOutlineIcon />
            )}
          </IconButton>
        );
      },
    },
  ];

  // Build lookup: source layer name -> already-published Hajk layers grouped by layerKind.
  // Used both to render the publications column and to gate creation behind a
  // confirmation dialog when a same-kind publication already exists.
  const publicationsByLayerName = buildPublicationsByLayerName(layersByService);

  // Capabilities layers filtered by dialog search and workspace
  const filteredCapabilityLayers = useMemo<CapabilityRow[]>(() => {
    if (!layers) return [];
    return layers
      .map<CapabilityRow>((layer, index) => ({
        id: index,
        layer,
        infoClick: "",
        publications: publicationsByLayerName.get(layer) ?? EMPTY_PUBLICATIONS,
      }))
      .filter((layer) => {
        const matchesSearch = layer.layer
          .toLowerCase()
          .includes(dialogSearchTerm.toLowerCase());
        const matchesWorkspace =
          !selectedWorkspace || layer.layer.startsWith(selectedWorkspace + ":");
        return matchesSearch && matchesWorkspace;
      });
  }, [layers, dialogSearchTerm, selectedWorkspace, publicationsByLayerName]);

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
  }, [layersByService, serviceLayerSearch]);

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
        <Button variant="contained" onClick={handleOpenPublishDialog}>
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
                value={resolvedPublishLayerKind}
                onChange={setPublishLayerKind}
                labelKey="layers.publishAs"
                serviceType={serviceTypeValue}
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

      <Dialog
        open={duplicateConfirm !== null}
        onClose={() => setDuplicateConfirm(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t("layers.confirmDuplicate.title")}</DialogTitle>
        <DialogContent>
          {duplicateConfirm && (
            <Typography component="div">
              <Trans
                i18nKey="layers.confirmDuplicate.bodyWithExisting"
                values={{
                  layerName: duplicateConfirm.layerName,
                  layerKind: t(
                    LAYER_CATEGORY_I18N_KEYS[duplicateConfirm.layerKind],
                  ),
                  existing: duplicateConfirm.existing
                    .map((p) => p.name)
                    .join(", "),
                }}
                components={{ strong: <strong /> }}
              />
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDuplicateConfirm(null)}
            disabled={isCreatingLayer}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleConfirmDuplicate}
            disabled={isCreatingLayer}
          >
            {t("layers.confirmDuplicate.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default LayersGrid;
