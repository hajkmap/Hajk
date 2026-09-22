import { useState, useMemo } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router";
import Grid from "@mui/material/Grid";
import {
  Button,
  TextField,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  FormHelperText,
  CircularProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem as MuiMenuItem,
} from "@mui/material";
import CreateButton from "../../../components/create-button";
import {
  ListFilterField,
  ListFilterRow,
  ListFilterSearch,
} from "../../../components/form-components/list-filter-row";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { TFunction } from "i18next";
import { Trans, useTranslation } from "react-i18next";
import Page from "../../../layouts/root/components/page";
import {
  useServices,
  Service,
  useCreateService,
  useDeleteService,
  useLayerCountByServiceId,
  ServiceCreateInput,
  SERVICE_TYPE,
  SERVICE_STATUS,
  serverTypes,
} from "../../../api/services";
import { getDeleteServiceErrorMessage } from "../../../api/services/error-messages";
import DialogWrapper from "../../../components/flexible-dialog";
import { useForm, Controller, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import StyledDataGrid from "../../../components/data-grid";
import { GridRenderCellParams } from "@mui/x-data-grid";
import ServiceNameCell from "./service-name-cell";
import ServiceStatusIndicator from "../components/service-status-indicator";
import ServiceTypeBadge from "../components/service-type-badge";
import { SquareSpinnerComponent } from "../../../components/progress/square-progress";
import { ApiValidationDetail } from "../../../lib/internal-api-client";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";

interface ServiceCreateErrorBody {
  errorId?: string;
  error?: string;
  details?: ApiValidationDetail[];
}

function getCreateServiceErrorMessage(error: unknown, t: TFunction): string {
  if (!isAxiosError<ServiceCreateErrorBody>(error) || !error.response) {
    return t("services.createServiceFailed");
  }

  const status = error.response.status;
  const data = error.response.data;

  if (status === 409) {
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error.trim();
    }
    return t("services.createServiceConflict");
  }

  if (status === 400 && Array.isArray(data?.details)) {
    const messages = data.details.map((d) => d.message).filter(Boolean);
    if (messages.length > 0) {
      return messages.join(" · ");
    }
  }

  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error.trim();
  }

  return t("services.createServiceFailed");
}

/** Compare URLs for duplicate hint (scheme + host + path, no trailing slash on path). */
function normalizeUrlForDuplicateCheck(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    let path = u.pathname;
    if (path.length > 1 && path.endsWith("/")) {
      path = path.slice(0, -1);
    }
    return `${u.protocol}//${u.hostname}${path}`.toLowerCase();
  } catch {
    return null;
  }
}

interface ServicesListProps {
  filterServices: (services: Service[]) => Service[];
  showCreateButton?: boolean;
  pageTitleKey: string;
  baseRoute: string;
}

export default function ServicesList({
  filterServices,
  showCreateButton = true,
  pageTitleKey,
  baseRoute,
}: ServicesListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: services, isLoading, isError } = useServices();
  const { mutateAsync: createService, isPending: isCreatingService } =
    useCreateService();
  const { mutateAsync: removeService, isPending: isDeletingService } =
    useDeleteService();
  const { palette } = useTheme();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<SERVICE_TYPE | "">("");
  const [statusFilter, setStatusFilter] = useState<SERVICE_STATUS | "">("");
  const [open, setOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const actionsMenuOpen = Boolean(anchorEl);
  const selectedService = useMemo(
    () => services?.find((service) => service.id === selectedServiceId),
    [services, selectedServiceId],
  );
  const { data: layerCountByService } = useLayerCountByServiceId(
    selectedServiceId ?? "",
  );
  const selectedServiceLayerCount = layerCountByService?.count ?? 0;
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleOpenActionsMenu = (
    event: React.MouseEvent<HTMLElement>,
    serviceId: string,
  ) => {
    if (isDeletingService) return;
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedServiceId(serviceId);
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
    if (isDeletingService) return;
    setIsDeleteDialogOpen(false);
    setSelectedServiceId(null);
    setDeleteConfirmName("");
  };

  const isDeleteConfirmNameMatching =
    Boolean(selectedService?.name) &&
    deleteConfirmName === selectedService?.name;

  const handleConfirmDelete = async () => {
    if (!selectedServiceId || !selectedService) return;
    if (!isDeleteConfirmNameMatching) return;
    try {
      await removeService(selectedServiceId);
      toast.success(
        t("services.deleteServiceSuccess", { name: selectedService.name }),
        {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        },
      );
      handleCloseDeleteDialog();
    } catch (error) {
      console.error("Failed to delete service:", error);
      toast.error(
        getDeleteServiceErrorMessage(error, t, selectedService.name),
        {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        },
      );
    }
  };

  const filteredServices = useMemo<Service[]>(() => {
    if (!services) return [];

    return filterServices(services).filter((service) => {
      if (
        searchTerm &&
        !`${service.name} ${service.url} ${service.type} ${service.version ?? ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      if (typeFilter && service.type !== typeFilter) return false;
      if (statusFilter !== "" && service.status !== statusFilter) return false;
      return true;
    });
  }, [services, searchTerm, typeFilter, statusFilter, filterServices]);

  const defaultValues: ServiceCreateInput = {
    name: "",
    url: "",
    type: SERVICE_TYPE.WMS,
    serverType: "GEOSERVER",
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<ServiceCreateInput>({
    defaultValues,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const handleClickOpen = () => {
    reset(defaultValues);
    setOpen(true);
  };

  const handleClose = () => {
    if (isCreatingService) return;
    setOpen(false);
  };

  const watchedUrl = useWatch({ control, name: "url" });

  const showUrlUsedElsewhereWarning = useMemo(() => {
    const norm = normalizeUrlForDuplicateCheck(watchedUrl ?? "");
    if (!norm || !services?.length) return false;
    return services.some((s) => normalizeUrlForDuplicateCheck(s.url) === norm);
  }, [watchedUrl, services]);

  const validateServiceUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return t("common.required");
    }
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return t("services.dialog.urlMustBeHttp");
      }
      return true;
    } catch {
      return t("services.dialog.invalidUrl");
    }
  };

  const handleServiceSubmit = async (serviceData: ServiceCreateInput) => {
    try {
      const payload: ServiceCreateInput = {
        name: serviceData.name.trim(),
        url: serviceData.url.trim(),
        type: serviceData.type,
        serverType: serviceData.serverType,
      };
      const response = await createService(payload);
      if (!response?.id) {
        toast.error(t("services.createResponseMissingId"), {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        });
        return;
      }
      toast.success(
        t("services.createServiceSuccess", { name: response.name }),
        {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        },
      );
      void navigate(`${baseRoute}/${response.id}`);
      reset();
      handleClose();
    } catch (error) {
      console.error("Failed to submit service:", error);
      toast.error(getCreateServiceErrorMessage(error, t), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };

  const onSubmit = (data: ServiceCreateInput) => {
    void handleServiceSubmit(data);
  };

  return (
    <>
      {isLoading ? (
        <SquareSpinnerComponent />
      ) : isError ? (
        <Page title={t(pageTitleKey)}>
          <Alert severity="error">{t("services.loadServicesFailed")}</Alert>
        </Page>
      ) : (
        <>
          {!services && <Box component="div">No services found</Box>}
          <Page
            title={t(pageTitleKey)}
            actionButtons={
              showCreateButton ? (
                <CreateButton
                  onClick={handleClickOpen}
                  label={t("services.dialog.addBtn")}
                />
              ) : undefined
            }
          >
            <DialogWrapper
              fullWidth
              formNoValidate
              open={open}
              title={t("services.dialog.title")}
              onClose={handleClose}
              onSubmit={(e) => {
                e.preventDefault();
                void handleSubmit(onSubmit)(e);
              }}
              actions={
                <>
                  <Button
                    variant="text"
                    onClick={handleClose}
                    color="primary"
                    disabled={isCreatingService}
                  >
                    {t("common.dialog.closeBtn")}
                  </Button>
                  <Button
                    type="submit"
                    color="primary"
                    variant="contained"
                    disabled={isCreatingService}
                    startIcon={
                      isCreatingService ? (
                        <CircularProgress color="inherit" size={18} />
                      ) : undefined
                    }
                  >
                    {t("common.dialog.saveBtn")}
                  </Button>
                </>
              }
            >
              <Grid container spacing={2}>
                <Grid size={12}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {t("services.dialog.subtitle")}
                  </Typography>
                </Grid>
                <Grid size={12}>
                  <TextField
                    required
                    label={t("common.name")}
                    fullWidth
                    {...register("name", {
                      required: t("common.required"),
                      validate: (v) =>
                        v.trim().length > 0 ? true : t("common.required"),
                    })}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    label={t("services.dialog.urlField")}
                    fullWidth
                    {...register("url", {
                      required: t("common.required"),
                      validate: validateServiceUrl,
                    })}
                    error={!!errors.url}
                    helperText={errors.url?.message}
                  />
                  {showUrlUsedElsewhereWarning && !errors.url ? (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      {t("services.dialog.urlDuplicateWarning")}
                    </Alert>
                  ) : null}
                </Grid>
                <Grid size={12}>
                  <Controller
                    name="type"
                    control={control}
                    rules={{ required: t("common.required") }}
                    render={({ field, fieldState }) => (
                      <FormControl fullWidth error={!!fieldState.error}>
                        <InputLabel id="type-label">
                          {t("common.serviceType")}
                        </InputLabel>
                        <Select
                          labelId="type-label"
                          label={t("common.serviceType")}
                          {...field}
                          error={!!fieldState.error}
                        >
                          {(
                            Object.keys(
                              SERVICE_TYPE,
                            ) as (keyof typeof SERVICE_TYPE)[]
                          ).map((key) => (
                            <MenuItem key={key} value={SERVICE_TYPE[key]}>
                              {SERVICE_TYPE[key]}
                            </MenuItem>
                          ))}
                        </Select>
                        {fieldState.error?.message ? (
                          <FormHelperText>
                            {fieldState.error.message}
                          </FormHelperText>
                        ) : null}
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid size={12}>
                  <Controller
                    name="serverType"
                    control={control}
                    rules={{ required: t("common.required") }}
                    render={({ field, fieldState }) => (
                      <FormControl fullWidth error={!!fieldState.error}>
                        <InputLabel id="serverType-create-label">
                          {t("common.serverType")}
                        </InputLabel>
                        <Select
                          labelId="serverType-create-label"
                          label={t("common.serverType")}
                          {...field}
                          value={field.value ?? ""}
                          error={!!fieldState.error}
                        >
                          {serverTypes.map((s) => (
                            <MenuItem key={s.value} value={s.value}>
                              {s.title}
                            </MenuItem>
                          ))}
                        </Select>
                        {fieldState.error?.message ? (
                          <FormHelperText>
                            {fieldState.error.message}
                          </FormHelperText>
                        ) : null}
                      </FormControl>
                    )}
                  />
                </Grid>
              </Grid>
            </DialogWrapper>

            <ListFilterRow>
              <ListFilterSearch>
                <TextField
                  fullWidth
                  label={t("layers.searchTitle")}
                  variant="outlined"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </ListFilterSearch>
              <ListFilterField>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="type-filter-label">
                    {t("services.filterByType")}
                  </InputLabel>
                  <Select
                    labelId="type-filter-label"
                    label={t("services.filterByType")}
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <MenuItem value="">{t("common.all")}</MenuItem>
                    {(Object.values(SERVICE_TYPE) as SERVICE_TYPE[]).map(
                      (type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ),
                    )}
                  </Select>
                </FormControl>
              </ListFilterField>
              <ListFilterField>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="status-filter-label">
                    {t("services.filterByStatus")}
                  </InputLabel>
                  <Select
                    labelId="status-filter-label"
                    label={t("services.filterByStatus")}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">{t("common.all")}</MenuItem>
                    <MenuItem value={SERVICE_STATUS.HEALTHY}>
                      {t("services.status.healthy")}
                    </MenuItem>
                    <MenuItem value={SERVICE_STATUS.UNHEALTHY}>
                      {t("services.status.unhealthy")}
                    </MenuItem>
                    <MenuItem value={SERVICE_STATUS.UNKNOWN}>
                      {t("services.status.unknown")}
                    </MenuItem>
                  </Select>
                </FormControl>
              </ListFilterField>
            </ListFilterRow>
            <Grid size={12}>
              <StyledDataGrid<Service>
                storageKey="services"
                customSx={{ height: "calc(100vh - 320px)", minHeight: 420  }}
                rows={filteredServices ?? []}
                columns={[
                  {
                    field: "type",
                    width: 130,
                    headerName: t("common.serviceType"),
                    renderCell: (params: { row: { id: string } }) => {
                      const type: SERVICE_TYPE = (params.row as Service).type;
                      return <ServiceTypeBadge type={type} />;
                    },
                  },
                  {
                    field: "name",
                    flex: 0.5,
                    headerName: t("common.name"),
                    renderCell: (params: GridRenderCellParams<Service>) => (
                      <ServiceNameCell
                        name={params.row.name}
                        url={params.row.url}
                        comment={params.row.comment}
                      />
                    ),
                  },
                  {
                    field: "version",
                    flex: 0.2,
                    headerName: "Version",
                  },
                  {
                    field: "lastSavedDate",
                    flex: 0.3,
                    headerName: t("common.lastSaved"),
                    valueFormatter: (value: string) =>
                      value ? new Date(value).toLocaleDateString("sv-SE") : "–",
                  },
                  {
                    field: "status",
                    disableColumnMenu: true,
                    headerAlign: "center",
                    flex: 0.2,
                    headerName: "Status",
                    renderCell: (params: { row: { id: string } }) => {
                      const row = params.row as Service;
                      const status = row?.status ?? SERVICE_STATUS.UNKNOWN;
                      return (
                        <ServiceStatusIndicator
                          status={status}
                          lastChecked={row?.lastChecked}
                        />
                      );
                    },
                  },
                  {
                    field: "actions",
                    headerName: "",
                    width: 60,
                    align: "center",
                    sortable: false,
                    filterable: false,
                    disableColumnMenu: true,
                    renderCell: (params: GridRenderCellParams<Service>) => (
                      <IconButton
                        aria-label={t("common.actions")}
                        size="small"
                        disabled={isDeletingService}
                        onClick={(event) =>
                          handleOpenActionsMenu(event, params.row.id)
                        }
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    ),
                  },
                ]}
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
                <MuiMenuItem
                  onClick={handleOpenDeleteDialog}
                  data-service-id={selectedServiceId ?? ""}
                  disabled={isDeletingService}
                >
                  {t("common.delete")}
                </MuiMenuItem>
              </Menu>
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
                      variant="contained"
                      color="error"
                      disabled={
                        isDeletingService || !isDeleteConfirmNameMatching
                      }
                      onClick={() => {
                        void handleConfirmDelete();
                      }}
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
                    values={{ name: selectedService?.name ?? "" }}
                    components={{ strong: <strong /> }}
                  />
                </Typography>
                {selectedServiceLayerCount > 0 ? (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Trans
                      i18nKey="services.deleteServiceAffectedLayers"
                      values={{ count: selectedServiceLayerCount }}
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
                      values={{ name: selectedService?.name ?? "" }}
                      components={{ strong: <strong /> }}
                    />
                  }
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  disabled={isDeletingService}
                />
              </DialogWrapper>
            </Grid>
          </Page>
        </>
      )}
    </>
  );
}
