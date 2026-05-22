import { useState, useMemo } from "react";
import Grid from "@mui/material/Grid2";
import {
  Button,
  useTheme,
  TextField,
  ListItemText,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Menu,
  CircularProgress,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { GridRenderCellParams, GridColDef } from "@mui/x-data-grid";
import { Trans, useTranslation } from "react-i18next";
import Page from "../../../layouts/root/components/page";
import {
  Layer,
  useLayers,
  LayerCreateInput,
  useCreateLayer,
  useDeleteLayer,
} from "../../../api/layers";
import {
  useServices,
  SERVICE_TYPE,
  SERVICE_STATUS,
  useServiceCapabilities,
} from "../../../api/services";
import { useNavigate } from "react-router";
import { SquareSpinnerComponent } from "../../../components/progress/square-progress";
import DialogWrapper from "../../../components/flexible-dialog";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import LayerKindBadge from "./layer-kind-badge";
import { LayerCategory, normalizeLayerCategory } from "../layer-category";
import ServiceStatusIndicator from "../../services/components/service-status-indicator";
import StyledDataGrid from "../../../components/data-grid";
import { CapabilityRow, CreateLayerGrid } from "./create-layer-grid";

interface LayersListProps {
  layerKind: LayerCategory;
  showCreateButton?: boolean;
  pageTitleKey: string;
  baseRoute: string;
}

type LayersGridRow = Omit<Layer, "status"> & {
  layerKind: LayerCategory;
  url: string;
  status: SERVICE_STATUS | undefined;
  lastChecked: string | undefined;
};

type CreateLayerStep = "details" | "capabilities";

export default function LayersList({
  layerKind,
  showCreateButton = true,
  pageTitleKey,
  baseRoute,
}: LayersListProps) {
  const { t } = useTranslation();
  const { data: layers, isLoading } = useLayers();
  const navigate = useNavigate();
  const [open, setOpen] = useState<boolean>(false);
  const { data: services } = useServices();

  const { palette } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServiceUrl, setSelectedServiceUrl] = useState("");
  const [createStep, setCreateStep] = useState<CreateLayerStep>("details");

  const [capabilitiesSearchTerm, setCapabilitiesSearchTerm] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [selectedCapabilityLayers, setSelectedCapabilityLayers] = useState<
    string[]
  >([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const actionsMenuOpen = Boolean(anchorEl);
  const selectedLayer = useMemo(
    () => layers?.find((layer) => layer.id === selectedLayerId),
    [layers, selectedLayerId],
  );
  const { mutateAsync: removeLayer, isPending: isDeletingLayer } =
    useDeleteLayer(selectedLayer?.serviceId ?? "");
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleOpenActionsMenu = (
    event: React.MouseEvent<HTMLElement>,
    layerId: string,
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedLayerId(layerId);
  };

  const handleCloseActionsMenu = () => {
    setAnchorEl(null);
  };

  const handleOpenDeleteDialog = () => {
    handleCloseActionsMenu();
    setDeleteConfirmName("");
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (isDeletingLayer) return;
    setIsDeleteDialogOpen(false);
    setSelectedLayerId(null);
    setDeleteConfirmName("");
  };

  const isDeleteConfirmNameMatching =
    Boolean(selectedLayer?.name) && deleteConfirmName === selectedLayer?.name;

  const handleConfirmDelete = async () => {
    if (!selectedLayerId || !selectedLayer || !isDeleteConfirmNameMatching) {
      return;
    }
    try {
      await removeLayer(selectedLayerId);
      toast.success(
        t("layers.deleteLayerSuccess", { name: selectedLayer.name }),
        {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        },
      );
      handleCloseDeleteDialog();
    } catch (error) {
      console.error("Failed to delete layer:", error);
      toast.error(t("layers.deleteLayerFailed", { name: selectedLayer.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };

  const serviceUrlOptions = useMemo(() => {
    const byUrl = new Map<string, { url: string; name: string }>();
    for (const s of services ?? []) {
      if (!s.url) continue;
      if (!byUrl.has(s.url)) {
        byUrl.set(s.url, { url: s.url, name: s.name || s.url });
      }
    }
    return Array.from(byUrl.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [services]);

  const filteredLayers = useMemo<LayersGridRow[]>(() => {
    if (!layers || !services) return [];

    const kindFilteredLayers = layers.filter(
      (layer) => normalizeLayerCategory(layer.layerKind) === layerKind,
    );

    const searchFilter = (layer: Layer) => {
      const service = services.find(
        (service) => service.id === layer.serviceId,
      );
      if (selectedServiceUrl && service?.url !== selectedServiceUrl)
        return false;
      const combinedText = `${layer.name} ${service?.url ?? ""}`.toLowerCase();
      return combinedText.includes(searchTerm.toLowerCase());
    };

    return kindFilteredLayers.filter(searchFilter).map((layer) => {
      const service = services.find(
        (service) => service.id === layer.serviceId,
      );
      return {
        ...layer,
        layerKind: normalizeLayerCategory(layer.layerKind),
        url: service?.url ?? "",
        status: service?.status,
        lastChecked: service?.lastChecked,
      };
    });
  }, [layers, services, searchTerm, selectedServiceUrl, layerKind]);

  const handleClose = () => {
    setOpen(false);
    setCreateStep("details");
    setCapabilitiesSearchTerm("");
    setSelectedWorkspace("");
    setSelectedCapabilityLayers([]);
    reset();
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  interface LayerCreateForm {
    name: string;
    serviceId: string;
  }
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<LayerCreateForm>({
    defaultValues: { name: "", serviceId: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  });
  const watchServiceId = watch("serviceId");
  const { mutateAsync: createLayer } = useCreateLayer(watchServiceId);

  const selectedService = useMemo(
    () => services?.find((s) => s.id === watchServiceId),
    [services, watchServiceId],
  );

  const capabilitiesType = useMemo(() => {
    const serviceType = selectedService?.type;
    if (!serviceType) return undefined;
    return serviceType === SERVICE_TYPE.WMTS
      ? SERVICE_TYPE.WMS
      : serviceType === SERVICE_TYPE.WFST
        ? SERVICE_TYPE.WFS
        : serviceType === SERVICE_TYPE.VECTOR
          ? SERVICE_TYPE.WFS
          : serviceType;
  }, [selectedService?.type]);

  const {
    layers: capabilitiesLayers,
    workspaces,
    isError: capabilitiesError,
    isLoading: capabilitiesLoading,
    refetch: refetchCapabilities,
  } = useServiceCapabilities({
    baseUrl: selectedService?.url ?? "",
    type: capabilitiesType ?? SERVICE_TYPE.WMS,
  });

  const filteredCapabilityLayers = useMemo<CapabilityRow[]>(() => {
    const layersList = Array.isArray(capabilitiesLayers)
      ? capabilitiesLayers
      : [];

    return layersList
      .map((layer, index) => ({
        id: index,
        layer,
        infoClick: "",
        publications: "",
      }))
      .filter((layer) => {
        const matchesSearch = layer.layer
          .toLowerCase()
          .includes(capabilitiesSearchTerm.toLowerCase());
        const matchesWorkspace =
          !selectedWorkspace || layer.layer.startsWith(selectedWorkspace + ":");
        return matchesSearch && matchesWorkspace;
      });
  }, [capabilitiesLayers, capabilitiesSearchTerm, selectedWorkspace]);

  const handleToggleCapabilityLayer = (layerName: string) => {
    setSelectedCapabilityLayers((prev) =>
      prev.includes(layerName) ? [] : prev.length >= 1 ? prev : [layerName],
    );
  };

  const handleLayerSubmit = async (layerData: LayerCreateInput) => {
    try {
      const payload = {
        layerKind,
        name: layerData.name,
        serviceId: layerData.serviceId,
        selectedLayers: layerData.selectedLayers,
      };
      const response = await createLayer(payload);
      toast.success(t("layers.createLayerSuccess", { name: response?.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
      void navigate(`${baseRoute}/${response?.id}`);
      reset();
      handleClose();
    } catch (error) {
      console.error("Failed to submit service:", error);
      toast.error(t("layers.createLayerFailed"), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };

  const handleNext = () => {
    void handleSubmit(() => {
      setCreateStep("capabilities");
    })();
  };

  const handleFinalSave = () => {
    void handleSubmit((data) => {
      const layerData: LayerCreateInput = {
        name: data.name,
        serviceId: data.serviceId,
        selectedLayers: selectedCapabilityLayers,
      };
      void handleLayerSubmit(layerData);
    })();
  };

  // const RowMenu = (params: { row: { id: string } }) => {
  //   const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  //   const open = Boolean(anchorEl);

  //   const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  //     setAnchorEl(event.currentTarget as HTMLElement | null);
  //   };

  //   const handleClose = () => {
  //     setAnchorEl(null);
  //   };

  //   return (
  //     <Box component="div" sx={{ textAlign: "start" }}>
  //       <IconButton onClick={handleClick}>
  //         <MoreHorizIcon />
  //       </IconButton>
  //       <Menu
  //         anchorEl={anchorEl}
  //         open={open}
  //         onClose={handleClose}
  //         anchorOrigin={{
  //           vertical: "bottom",
  //           horizontal: "left",
  //         }}
  //         transformOrigin={{
  //           vertical: "top",
  //           horizontal: "left",
  //         }}
  //       >
  //         <MenuItem
  //           onClick={() => {
  //             const id: string = (params.row as Layer).id;
  //             if (id) {
  //               void navigate(`${baseRoute}/${id}`);
  //             }
  //           }}
  //         >
  //           View
  //         </MenuItem>
  //         <MenuItem onClick={() => alert(`Edit ${params.row.id}`)}>
  //           Edit
  //         </MenuItem>
  //         <MenuItem onClick={() => alert(`Delete ${params.row.id}`)}>
  //           Delete
  //         </MenuItem>
  //       </Menu>
  //     </Box>
  //   );
  // };

  return (
    <>
      {isLoading ? (
        <SquareSpinnerComponent />
      ) : (
        <Page
          title={t(pageTitleKey)}
          actionButtons={
            showCreateButton ? (
              <>
                <Button
                  onClick={handleClickOpen}
                  color="primary"
                  variant="contained"
                >
                  {t("layers.dialog.addBtn")}
                </Button>
              </>
            ) : undefined
          }
        >
          <DialogWrapper
            fullWidth
            open={open}
            title={t("layers.dialog.title")}
            onClose={handleClose}
            maxWidth={createStep === "capabilities" ? "lg" : undefined}
            onSubmit={(e) => {
              e.preventDefault();
              if (createStep === "details") {
                handleNext();
              } else {
                handleFinalSave();
              }
            }}
            actions={
              <>
                {createStep === "capabilities" && (
                  <Button
                    variant="text"
                    onClick={() => setCreateStep("details")}
                    color="primary"
                  >
                    {t("common.back")}
                  </Button>
                )}
                <Button variant="text" onClick={handleClose} color="primary">
                  {t("common.dialog.closeBtn")}
                </Button>
                {createStep === "details" ? (
                  <Button
                    type="button"
                    color="primary"
                    variant="contained"
                    onClick={handleNext}
                  >
                    {t("common.next")}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    color="primary"
                    variant="contained"
                    onClick={handleFinalSave}
                    disabled={selectedCapabilityLayers.length === 0}
                  >
                    {t("common.dialog.saveBtn")}
                  </Button>
                )}
              </>
            }
          >
            {createStep === "details" ? (
              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField
                    label={t("common.name")}
                    fullWidth
                    {...register("name", {
                      required: `${t("common.required")}`,
                    })}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                </Grid>
                <Grid size={12}>
                  <FormControl fullWidth>
                    <InputLabel id="serviceId-label">
                      {t("common.service")}
                    </InputLabel>
                    <Controller
                      name="serviceId"
                      control={control}
                      rules={{ required: `${t("common.required")}` }}
                      render={({ field, fieldState }) => (
                        <Select
                          labelId="serviceId-label"
                          label={t("common.service")}
                          {...field}
                          error={!!fieldState.error}
                        >
                          {(services ?? []).map((service) => (
                            <MenuItem key={service.id} value={service.id}>
                              {service.name}({service.type})
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                  </FormControl>
                </Grid>
                {selectedService && (
                  <Grid size={12}>
                    <Typography variant="body2" color="text.secondary">
                      {t("layers.createDialog.serviceDefaults", {
                        url: selectedService.url,
                        version: selectedService.version,
                        imageFormat: selectedService.imageFormat,
                        projection: selectedService.projection?.code ?? "—",
                      })}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            ) : (
              <CreateLayerGrid
                capabilitiesSearchTerm={capabilitiesSearchTerm}
                onCapabilitiesSearchTermChange={setCapabilitiesSearchTerm}
                workspaces={workspaces ?? []}
                selectedWorkspace={selectedWorkspace}
                onSelectedWorkspaceChange={setSelectedWorkspace}
                selectedCapabilityLayers={selectedCapabilityLayers}
                onToggleCapabilityLayer={handleToggleCapabilityLayer}
                isLoading={capabilitiesLoading}
                isError={capabilitiesError}
                onRetry={() => void refetchCapabilities()}
                rows={filteredCapabilityLayers}
                onClose={handleClose}
              />
            )}
          </DialogWrapper>

          <Grid size={12} container sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
              <TextField
                fullWidth
                label={t("layers.searchTitle")}
                variant="outlined"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <FormControl sx={{ minWidth: 400 }}>
                <InputLabel id="service-url-filter-label">
                  {t("common.service")}
                </InputLabel>
                <Select
                  labelId="service-url-filter-label"
                  label={t("common.service")}
                  value={selectedServiceUrl}
                  onChange={(e) =>
                    setSelectedServiceUrl(String(e.target.value))
                  }
                >
                  <MenuItem value="">{t("common.all")}</MenuItem>
                  {serviceUrlOptions.map((opt) => (
                    <MenuItem key={opt.url} value={opt.url}>
                      <ListItemText primary={opt.name} secondary={opt.url} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Grid>

          <Grid size={12}>
            <StyledDataGrid<LayersGridRow>
              storageKey="layers"
              customSx={{ height: "calc(100vh - 320px)" }}
              rows={filteredLayers ?? []}
              columns={
                [
                  {
                    field: "layerKind",
                    flex: 0.2,
                    headerName: t("layers.layerKind"),
                    renderCell: (
                      params: GridRenderCellParams<LayersGridRow>,
                    ) => <LayerKindBadge layerKind={params.row.layerKind} />,
                  },
                  {
                    field: "name",
                    flex: 0.5,
                    headerName: t("common.name"),
                    renderCell: (
                      params: GridRenderCellParams<LayersGridRow>,
                    ) => (
                      <ListItemText
                        primary={params.row.name}
                        secondary={params.row.url}
                      />
                    ),
                  },
                  {
                    field: "usedInMaps",
                    flex: 0.3,
                    headerName: t("common.usedInMaps"),
                  },
                  {
                    field: "lastSavedDate",
                    flex: 0.3,
                    headerName: t("common.lastSaved"),
                    valueFormatter: (value: string) =>
                      value ? new Date(value).toLocaleDateString("sv-SE") : "–",
                  },
                  {
                    field: "brokenService",
                    flex: 0.2,
                    headerName: t("common.status"),
                    headerAlign: "center",
                    renderCell: (
                      params: GridRenderCellParams<LayersGridRow>,
                    ) => (
                      <ServiceStatusIndicator
                        status={params.row.status!}
                        lastChecked={params.row.lastChecked}
                      />
                    ),
                  },
                  {
                    field: "actions",
                    headerName: "",
                    width: 60,
                    align: "center",
                    sortable: false,
                    filterable: false,
                    disableColumnMenu: true,
                    renderCell: (
                      params: GridRenderCellParams<LayersGridRow>,
                    ) => (
                      <IconButton
                        aria-label={t("common.actions")}
                        size="small"
                        onClick={(event) =>
                          handleOpenActionsMenu(event, params.row.id)
                        }
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    ),
                  },
                ] as GridColDef<LayersGridRow>[]
              }
              onRowClick={({ row }) => {
                const id: string = row.id;
                if (id) {
                  void navigate(`${baseRoute}/${id}`);
                }
              }}
            />
            <Menu
              anchorEl={anchorEl}
              open={actionsMenuOpen}
              onClose={handleCloseActionsMenu}
              onClick={(event) => event.stopPropagation()}
            >
              <MenuItem
                onClick={handleOpenDeleteDialog}
                data-layer-id={selectedLayerId ?? ""}
                disabled={isDeletingLayer}
              >
                {t("common.delete")}
              </MenuItem>
            </Menu>
            <DialogWrapper
              fullWidth
              open={isDeleteDialogOpen}
              title={t("layers.deleteLayerConfirmTitle")}
              onClose={handleCloseDeleteDialog}
              actions={
                <>
                  <Button
                    variant="text"
                    onClick={handleCloseDeleteDialog}
                    color="primary"
                    disabled={isDeletingLayer}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    disabled={isDeletingLayer || !isDeleteConfirmNameMatching}
                    onClick={() => {
                      void handleConfirmDelete();
                    }}
                    startIcon={
                      isDeletingLayer ? (
                        <CircularProgress color="inherit" size={18} />
                      ) : (
                        <DeleteOutlineIcon />
                      )
                    }
                  >
                    {t("common.delete")}
                  </Button>
                </>
              }
            >
              <Typography>
                <Trans
                  i18nKey="layers.deleteLayerConfirmMessage"
                  values={{ name: selectedLayer?.name ?? "" }}
                  components={{ strong: <strong /> }}
                />
              </Typography>
              <TextField
                fullWidth
                autoComplete="off"
                margin="normal"
                label={t("layers.deleteLayerTypeNameLabel")}
                helperText={
                  <Trans
                    i18nKey="layers.deleteLayerTypeNameHelper"
                    values={{ name: selectedLayer?.name ?? "" }}
                    components={{ strong: <strong /> }}
                  />
                }
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                disabled={isDeletingLayer}
              />
            </DialogWrapper>
          </Grid>
        </Page>
      )}
    </>
  );
}
