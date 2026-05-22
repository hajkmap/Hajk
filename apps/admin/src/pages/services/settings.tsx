import { useParams, Link, useNavigate, useSearchParams } from "react-router";
import { useState, useRef, useEffect } from "react";
import { useTranslation, Trans } from "react-i18next";
import Page from "../../layouts/root/components/page";
import { Controller, FieldValues, useForm } from "react-hook-form";
import {
  useTheme,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  styled,
  List,
  ListItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import LayersIcon from "@mui/icons-material/Layers";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchablePanel from "../../components/form-components/searchable-panel";
import {
  useServiceById,
  useUpdateService,
  useDeleteService,
  useLayersByServiceId,
  SERVICE_TYPE,
  ServiceUpdateInput,
  serverTypes,
  versions,
  imageFormats,
  useProjections,
  useServiceCapabilities,
} from "../../api/services";
import { getDeleteServiceErrorMessage } from "../../api/services/error-messages";
import Grid from "@mui/material/Grid2";

const StyledTabButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "isActive",
})<{ isActive: boolean }>(({ theme, isActive }) => ({
    textTransform: "none",
    width: "100%",
    borderRadius: 14,
    justifyContent: "flex-start",
    color: theme.palette.text.primary,
    paddingTop: theme.spacing(1.8),
    paddingBottom: theme.spacing(1.8),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    minHeight: 48,
    backgroundColor: isActive ? theme.palette.action.focus : "transparent",
    transition: "all 200ms ease",
    "&:hover": {
      backgroundColor: isActive
        ? theme.palette.action.selected
        : theme.palette.action.hover,
    },
    "& .MuiButton-startIcon": {
      fontSize: "1.25rem",
      marginRight: theme.spacing(2),
    },
  }),
);
import FormContainer from "../../components/form-components/form-container";
import FormPanel from "../../components/form-components/form-panel";

import DialogWrapper from "../../components/flexible-dialog";
import LayersGrid from "./layers-grid";
import ServiceUsagePanel from "./service-usage-panel";
import { toast } from "react-toastify";

import FormActionPanel from "../../components/form-action-panel";
import { SquareSpinnerComponent } from "../../components/progress/square-progress";
import useAppStateStore from "../../store/use-app-state-store";

export default function ServiceSettings() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const navigate = useNavigate();
  const { palette } = useTheme();
  const { t } = useTranslation();
  const { serviceId } = useParams<{ serviceId: string }>();
  const { data: service, isError, isLoading } = useServiceById(serviceId ?? "");
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") ?? "settings") as
    | "settings"
    | "layers"
    | "search";
  const setActiveTab = (tab: string) =>
    setSearchParams({ tab }, { replace: true });
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogUrl, setDialogUrl] = useState("");
  const [dialogServiceType, setDialogServiceType] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const { data: projections } = useProjections();
  const epsgProjections =
    projections?.filter((projection) => projection.code.startsWith("EPSG:")) ??
    [];
  const epsgProjectionsMap = epsgProjections?.map((projection) => ({
    title: projection.code,
    value: projection.code,
  }));
  const { mutateAsync: updateService, status: updateStatus } =
    useUpdateService();
  const { mutateAsync: removeService, isPending: isDeletingService } =
    useDeleteService();
  const { data: layersByServiceId } = useLayersByServiceId(serviceId ?? "");
  const count = layersByServiceId?.layers?.length ?? 0;
  const { defaultCoordinates } = useAppStateStore.getState();
  const {
    layers: getCapLayers,
    workspaces: getCapWorkspaces,
    isError: layersError,
    isLoading: layersLoading,
    refetch: refetchLayers,
  } = useServiceCapabilities({
    baseUrl: service?.url ?? "",
    type:
      service?.type === SERVICE_TYPE.WMS
        ? SERVICE_TYPE.WMS
        : service?.type === SERVICE_TYPE.WMTS
          ? SERVICE_TYPE.WMS
          : service?.type === SERVICE_TYPE.WFS
            ? SERVICE_TYPE.WFS
            : service?.type === SERVICE_TYPE.WFST
              ? SERVICE_TYPE.WFS
              : service?.type === SERVICE_TYPE.VECTOR
                ? SERVICE_TYPE.WFS
                : service?.type,
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<FieldValues>({
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const allValues = watch();

  // Reset form with service data when it loads
  useEffect(() => {
    if (service) {
      reset({
        name: service.name ?? "",
        url: service.url ?? "",
        type: service.type ?? "",
        serverType: service.serverType ?? "",
        version: service.version ?? "",
        imageFormat: service.imageFormat ?? "",
        workspace: service.workspace ?? "All",
        getMapUrl: service.getMapUrl ?? "",
        comment: service.comment ?? "",
        projection: {
          code: service.projection?.code ?? "",
        },
        metadata: {
          description: service.metadata?.description ?? "",
          owner: service.metadata?.owner ?? "",
        },
      });
    }
  }, [service, reset]);

  const handleDialogOpen = () => {
    setIsDialogOpen(true);
    setDialogUrl((getValues("url") as string) || (service?.url ?? ""));
    setDialogServiceType(
      (getValues("type") as string) || (service?.type ?? ""),
    );
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleSaveUrl = () => {
    setValue("url", dialogUrl, { shouldDirty: true });
    setValue("type", dialogServiceType, { shouldDirty: true });
    handleDialogClose();
  };

  const handleExternalSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isDeletingService) return;
    event.preventDefault();
    event.stopPropagation();
    setDeleteConfirmName("");
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (isDeletingService) return;
    setIsDeleteDialogOpen(false);
    setDeleteConfirmName("");
  };

  const isDeleteConfirmNameMatching =
    Boolean(service?.name) && deleteConfirmName === service?.name;

  const handleConfirmDelete = async () => {
    if (!service?.id || !isDeleteConfirmNameMatching) return;
    try {
      await removeService(service.id);
      toast.success(
        t("services.deleteServiceSuccess", { name: service.name }),
        {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        },
      );
      handleCloseDeleteDialog();
      void navigate("/services");
    } catch (error) {
      console.error("Failed to delete service:", error);
      toast.error(getDeleteServiceErrorMessage(error, t, service.name), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };

  const handleUpdateService = async (serviceData: ServiceUpdateInput) => {
    try {
      const payload = {
        name: serviceData.name,
        url: serviceData.url,
        type: serviceData.type,
        serverType: serviceData.serverType,
        version: serviceData.version,
        imageFormat: serviceData.imageFormat,
        workspace: serviceData.workspace,
        getMapUrl: serviceData.getMapUrl,
        comment: serviceData.comment,
        projection: {
          code: serviceData.projection?.code,
        },
        metadata: {
          description: serviceData.metadata?.description,
          owner: serviceData.metadata?.owner,
        },
      };
      await updateService({
        serviceId: service?.id ?? "",
        data: payload,
      });
      toast.success(
        t("services.updateServiceSuccess", { name: serviceData.name }),
        {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        },
      );
    } catch (error) {
      console.error("Failed to update service:", error);
      toast.error(t("services.updateServiceFailed", { name: service?.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };
  // TODO?: Add delete service
  /*
  const handleDeleteService = async () => {
    if (!isLoading && service?.id) {
      try {
        await deleteService(service.id);
        toast.success(
          t("services.deleteServiceSuccess", { name: service.name }),
          {
            position: "bottom-left",
            theme: palette.mode,
            hideProgressBar: true,
          }
        );
      } catch (error) {
        console.error("Deletion failed:", error);
        toast.error(t("services.deleteServiceFailed", { name: service.name }), {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        });
      }
    } else {
      console.error("Service data is still loading or unavailable.");
    }
  };
*/
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleSubmit((data: FieldValues) => {
      const serviceData = data as ServiceUpdateInput;
      void handleUpdateService(serviceData);
    })(e);
  };

  if (isLoading) {
    return <SquareSpinnerComponent />;
  }

  if (isError) {
    return (
      <Page title={t("common.settings")}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {t("services.loadServiceFailed")}
        </Alert>
        <Button
          component={Link}
          to="/services"
          variant="contained"
          color="primary"
        >
          {t("services.backToServices")}
        </Button>
      </Page>
    );
  }

  if (!service) {
    return (
      <Page title={t("common.settings")}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t("services.serviceNotFound")}
        </Alert>
        <Button
          component={Link}
          to="/services"
          variant="contained"
          color="primary"
        >
          {t("services.backToServices")}
        </Button>
      </Page>
    );
  }

  return (
    <Page title={service?.name ? `${t("common.settings")} - ${service.name}` : t("common.settings")}>
      <FormActionPanel
        updateStatus={updateStatus}
        onUpdate={handleExternalSubmit}
        saveButtonText={t("common.dialog.saveBtn")}
        createdBy={service?.createdBy}
        createdDate={service?.createdDate}
        lastSavedBy={service?.lastSavedBy}
        lastSavedDate={service?.lastSavedDate}
        isDirty={isDirty}
        warning={
          <Box sx={{ mt: 1 }}>
            {count > 0 ? (
              <Alert severity="warning">
                <Trans
                  i18nKey="services.settingsWarning"
                  values={{ count }}
                  components={{ strong: <strong /> }}
                />
              </Alert>
            ) : null}
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={handleDeleteClick}
              disabled={isDeletingService}
              sx={{
                mt: count > 0 ? 2 : 0,
                width: "100%",
                justifyContent: "center",
                borderStyle: "dashed",
              }}
            >
              {t("common.delete")}
            </Button>
          </Box>
        }
      >
        <List
          sx={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 1,
            p: 0,
            mb: 2,
          }}
        >
          {(
            [
              {
                key: "settings",
                label: t("common.settings"),
                icon: <SettingsIcon />,
              },
              {
                key: "layers",
                label: t("services.publishedLayers"),
                icon: <LayersIcon />,
              },
              {
                key: "search",
                label: t("common.searchSettings"),
                icon: <ManageSearchIcon />,
              },
            ] as const
          ).map((tab) => (
            <ListItem
              key={tab.key}
              disablePadding
              disableGutters
              sx={{ width: "auto" }}
            >
              <StyledTabButton
                isActive={activeTab === tab.key}
                startIcon={tab.icon}
                onClick={() => setActiveTab(tab.key)}
              >
                <Typography>{tab.label}</Typography>
              </StyledTabButton>
            </ListItem>
          ))}
        </List>
        <FormContainer formRef={formRef} onSubmit={onSubmit} noValidate={false}>
          <Box
            sx={{
              display:
                activeTab === "settings" || activeTab === "search"
                  ? "block"
                  : "none",
            }}
          >
            {activeTab === "search" && (
              <TextField
                placeholder={t("common.searchSettings") + "..."}
                fullWidth
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <ManageSearchIcon
                        sx={{ mr: 1, color: "text.secondary" }}
                      />
                    ),
                  },
                }}
                sx={{ mb: 2 }}
              />
            )}
            <SearchablePanel
              keywords={[
                "namn",
                "name",
                "tjänst",
                "tjänsttyp",
                "service type",
                "beskrivning",
                "description",
                "kommentar",
                "comment",
              ]}
              fields={["name", "type", "comment"]}
              allValues={allValues}
              searchTerm={activeTab === "search" ? searchQuery : ""}
            >
              <FormPanel title={t("common.information")}>
                <Grid container>
                  <Grid size={12}>
                    <TextField
                      label={t("common.name")}
                      fullWidth
                      {...register("name", {
                        required: `${t("common.required")}`,
                      })}
                      error={!!errors.name}
                      helperText={
                        (errors.name as { message?: string } | undefined)
                          ?.message
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 10 }}>
                    <TextField
                      label={t("common.serviceType")}
                      fullWidth
                      slotProps={{ input: { readOnly: true } }}
                      {...register("type")}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 10 }}>
                    <TextField
                      label={t("services.description")}
                      fullWidth
                      multiline
                      rows={3}
                      {...register("comment")}
                    />
                  </Grid>
                </Grid>
              </FormPanel>
            </SearchablePanel>

            <SearchablePanel
              keywords={[
                "anslutning",
                "connection",
                "url",
                "servertyp",
                "server type",
                "geoserver",
                "mapserver",
                "arbetsområde",
                "workspace",
              ]}
              fields={["url", "serverType", "workspace"]}
              allValues={allValues}
              searchTerm={activeTab === "search" ? searchQuery : ""}
            >
              <FormPanel title={t("common.connection")}>
                <Grid container rowSpacing={2}>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <FormControl fullWidth error={!!errors.serverType}>
                      <InputLabel id="serverType-label">
                        {t("common.serverType")}
                      </InputLabel>
                      <Controller
                        name="serverType"
                        control={control}
                        rules={{ required: `${t("common.required")}` }}
                        render={({ field }) => (
                          <Select
                            labelId="serverType-label"
                            label={t("common.serverType")}
                            {...field}
                            value={(field.value as string) ?? ""}
                          >
                            {serverTypes.map((s) => (
                              <MenuItem key={s.value} value={s.value}>
                                {s.title}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <TextField
                      label="Url"
                      fullWidth
                      disabled
                      {...register("url")}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <Button
                              sx={{
                                color: palette.primary.main,
                                fontWeight: 600,
                              }}
                              size="small"
                              onClick={handleDialogOpen}
                            >
                              {t("services.url.btnLabel")}
                            </Button>
                          ),
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <FormControl fullWidth>
                      <InputLabel id="workspace-label">
                        {t("services.workspace")}
                      </InputLabel>
                      <Controller
                        name="workspace"
                        control={control}
                        render={({ field }) => (
                          <Select
                            labelId="workspace-label"
                            label={t("services.workspace")}
                            {...field}
                            value={(field.value as string) ?? ""}
                          >
                            <MenuItem value="All">{t("common.all")}</MenuItem>
                            {(getCapWorkspaces ?? []).map((w) => (
                              <MenuItem key={w} value={w}>
                                {w}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </FormPanel>
            </SearchablePanel>

            <SearchablePanel
              keywords={[
                "förfrågan",
                "request",
                "getmap",
                "version",
                "bildformat",
                "image format",
                "koordinatsystem",
                "projektion",
                "projection",
              ]}
              fields={[
                "getMapUrl",
                "version",
                "imageFormat",
                "projection.code",
              ]}
              allValues={allValues}
              searchTerm={activeTab === "search" ? searchQuery : ""}
            >
              <FormPanel title={t("services.settings.request")}>
                <Grid container rowSpacing={2}>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <TextField
                      label="GetMap-url"
                      fullWidth
                      {...register("getMapUrl")}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <FormControl fullWidth error={!!errors.version}>
                      <InputLabel id="version-label">Version</InputLabel>
                      <Controller
                        name="version"
                        control={control}
                        rules={{ required: `${t("common.required")}` }}
                        render={({ field }) => (
                          <Select
                            labelId="version-label"
                            label="Version"
                            {...field}
                            value={(field.value as string) ?? ""}
                          >
                            {versions.map((v) => (
                              <MenuItem key={v.value} value={v.value}>
                                {v.title}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <FormControl fullWidth>
                      <InputLabel id="imageFormat-label">
                        {t("services.imageFormats")}
                      </InputLabel>
                      <Controller
                        name="imageFormat"
                        control={control}
                        render={({ field }) => (
                          <Select
                            labelId="imageFormat-label"
                            label={t("services.imageFormats")}
                            {...field}
                            value={(field.value as string) ?? ""}
                          >
                            {imageFormats.map((f) => (
                              <MenuItem key={f.value} value={f.value}>
                                {f.title}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <FormControl fullWidth>
                      <InputLabel id="projection-label">
                        {t("services.coordinateSystem")}
                      </InputLabel>
                      <Controller
                        name="projection.code"
                        control={control}
                        render={({ field }) => (
                          <Select
                            labelId="projection-label"
                            label={t("services.coordinateSystem")}
                            {...field}
                            value={(field.value as string) ?? ""}
                          >
                            {defaultCoordinates.map((value) => {
                              const opt = epsgProjectionsMap?.find(
                                (p) => p.value === value,
                              );
                              return (
                                <MenuItem
                                  key={value}
                                  value={opt?.value ?? value}
                                >
                                  {opt?.title ?? value}
                                </MenuItem>
                              );
                            })}
                          </Select>
                        )}
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </FormPanel>
            </SearchablePanel>

            <SearchablePanel
              keywords={[
                "info",
                "infoknapp",
                "ägare",
                "owner",
                "beskrivning",
                "description",
                "metadata",
              ]}
              fields={["metadata.owner", "metadata.description"]}
              allValues={allValues}
              searchTerm={activeTab === "search" ? searchQuery : ""}
            >
              <FormPanel title={t("common.infobutton")}>
                <Grid container rowSpacing={2}>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <TextField
                      label={t("services.owner")}
                      fullWidth
                      {...register("metadata.owner")}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <TextField
                      label={t("services.layerDescription")}
                      fullWidth
                      multiline
                      rows={3}
                      {...register("metadata.description")}
                    />
                  </Grid>
                </Grid>
              </FormPanel>
            </SearchablePanel>
          </Box>

          {activeTab === "layers" && (
            <Box>
              <LayersGrid
                layers={getCapLayers}
                workspaces={getCapWorkspaces}
                serviceId={service.id}
                isError={layersError}
                isLoading={layersLoading}
                onRetry={() => void refetchLayers()}
              />
              <ServiceUsagePanel serviceId={service.id} />
            </Box>
          )}
        </FormContainer>
      </FormActionPanel>
      <DialogWrapper
        fullWidth
        open={isDialogOpen}
        title={t("services.settings.dialog.title")}
        onClose={handleDialogClose}
        actions={
          <>
            <Button variant="text" onClick={handleDialogClose} color="primary">
              {t("common.dialog.closeBtn")}
            </Button>
            <Button onClick={handleSaveUrl} color="primary" variant="contained">
              {t("common.dialog.okBtn")}
            </Button>
          </>
        }
      >
        {count >= 1 && (
          <Trans
            i18nKey="services.affectedLayers"
            values={{ count: layersByServiceId?.count }}
            components={{ strong: <strong /> }}
          />
        )}
        <TextField
          label="Url"
          value={dialogUrl}
          fullWidth
          variant="outlined"
          onChange={(e) => setDialogUrl(e.target.value)}
          error={!!errors.url}
          margin="normal"
        />
        <FormControl
          sx={{ mt: 2, width: "100%", maxWidth: "150px" }}
          fullWidth
          error={!!errors.type}
        >
          <InputLabel id="type">{t("common.serviceType")}</InputLabel>
          <Select
            label={t("common.serviceType")}
            value={dialogServiceType}
            variant="outlined"
            onChange={(e) => setDialogServiceType(e.target.value)}
          >
            {Object.keys(SERVICE_TYPE).map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogWrapper>
      <DialogWrapper
        fullWidth
        open={isDeleteDialogOpen}
        title={t("services.deleteServiceConfirmTitle")}
        onClose={handleCloseDeleteDialog}
        actions={
          <>
            <Button
              variant="text"
              onClick={handleCloseDeleteDialog}
              color="primary"
              disabled={isDeletingService}
            >
              {t("common.cancel")}
            </Button>
            <Button
              disabled={isDeletingService || !isDeleteConfirmNameMatching}
              onClick={() => {
                void handleConfirmDelete();
              }}
              color="error"
              variant="contained"
              startIcon={
                isDeletingService ? (
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
            i18nKey="services.deleteServiceConfirmMessage"
            values={{ name: service?.name ?? "" }}
            components={{ strong: <strong /> }}
          />
        </Typography>
        {count > 0 ? (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Trans
              i18nKey="services.deleteServiceAffectedLayers"
              values={{ count }}
              components={{ strong: <strong /> }}
            />
          </Alert>
        ) : null}
        <TextField
          fullWidth
          autoComplete="off"
          margin="normal"
          label={t("services.deleteServiceTypeNameLabel")}
          helperText={
            <Trans
              i18nKey="services.deleteServiceTypeNameHelper"
              values={{ name: service?.name ?? "" }}
              components={{ strong: <strong /> }}
            />
          }
          value={deleteConfirmName}
          onChange={(e) => setDeleteConfirmName(e.target.value)}
          disabled={isDeletingService}
        />
      </DialogWrapper>
    </Page>
  );
}
