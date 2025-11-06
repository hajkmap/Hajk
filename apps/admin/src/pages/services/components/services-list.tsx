import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import Grid from "@mui/material/Grid2";
import {
  Button,
  TextField,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  ListItemText,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import Page from "../../../layouts/root/components/page";
import {
  useServices,
  Service,
  useCreateService,
  ServiceCreateInput,
  SERVICE_TYPE,
  SERVICE_STATUS,
} from "../../../api/services";
import DialogWrapper from "../../../components/flexible-dialog";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import StyledDataGrid from "../../../components/data-grid";
import { GridRenderCellParams } from "@mui/x-data-grid";
import ServiceStatusIndicator from "../components/service-status-indicator";
import ServiceTypeBadge from "../components/service-type-badge";
import { SquareSpinnerComponent } from "../../../components/progress/square-progress";

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
  const { data: services, isLoading } = useServices();
  const { mutateAsync: createService } = useCreateService();
  const { palette } = useTheme();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const filteredServices = useMemo<Service[]>(() => {
    if (!services) return [];

    // First apply the specific filter for this page type
    const typeFilteredServices = filterServices(services);

    // Then apply search filter
    const searchFilter = (service: Service) => {
      const combinedText =
        `${service.name} ${service.url} ${service.type}`.toLowerCase();
      return combinedText.includes(searchTerm.toLowerCase());
    };

    return typeFilteredServices.filter(searchFilter);
  }, [services, searchTerm, filterServices]);

  const defaultValues = {
    name: "",
    url: "",
    type: SERVICE_TYPE.WMS,
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

  const handleServiceSubmit = async (serviceData: ServiceCreateInput) => {
    try {
      const payload = {
        name: serviceData.name,
        url: serviceData.url,
        type: serviceData.type,
      };
      const response = await createService(payload);
      toast.success(
        t("services.createServiceSuccess", { name: response?.name }),
        {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        }
      );
      void navigate(`${baseRoute}/${response?.id}`);
      reset();
      handleClose();
    } catch (error) {
      console.error("Failed to submit service:", error);
      toast.error(t("services.createServiceFailed"), {
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
      ) : (
        <>
          {!services && <Box component="div">No services found</Box>}
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
                    {t("services.dialog.addBtn")}
                  </Button>
                </>
              ) : undefined
            }
          >
            <DialogWrapper
              fullWidth
              open={open}
              title={t("services.dialog.title")}
              onClose={handleClose}
              onSubmit={(e) => {
                e.preventDefault();
                void handleSubmit(onSubmit)(e);
              }}
              actions={
                <>
                  <Button variant="text" onClick={handleClose} color="primary">
                    {t("common.dialog.closeBtn")}
                  </Button>
                  <Button type="submit" color="primary" variant="contained">
                    {t("common.dialog.saveBtn")}
                  </Button>
                </>
              }
            >
              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField
                    label={t("common.name")}
                    fullWidth
                    {...register("name")}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    label="Url"
                    fullWidth
                    {...register("url", {
                      required: `${t("common.required")}`,
                    })}
                    error={!!errors.url}
                    helperText={errors.url?.message}
                  />
                </Grid>
                <Grid size={12}>
                  <FormControl fullWidth>
                    <InputLabel id="type-label">
                      {t("common.serviceType")}
                    </InputLabel>
                    <Controller
                      name="type"
                      control={control}
                      rules={{ required: `${t("common.required")}` }}
                      render={({ field }) => (
                        <Select
                          labelId="type-label"
                          label={t("common.serviceType")}
                          {...field}
                        >
                          {Object.keys(SERVICE_TYPE).map((type) => (
                            <MenuItem key={type} value={type}>
                              {type}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </DialogWrapper>

            <Grid size={12} container sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label={t("layers.searchTitle")}
                variant="outlined"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </Grid>
            <Grid size={12}>
              <StyledDataGrid<Service>
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
                      <ListItemText
                        primary={params.row.name}
                        secondary={params.row.url}
                        slotProps={{
                          secondary: {
                            sx: {
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            },
                          },
                        }}
                      />
                    ),
                  },
                  {
                    field: "version",
                    flex: 0.2,
                    headerName: "Version",
                  },
                  {
                    field: "status",
                    disableColumnMenu: true,
                    headerAlign: "center",
                    flex: 0.2,
                    headerName: "Status",
                    renderCell: (params: { row: { id: string } }) => {
                      const status: SERVICE_STATUS =
                        (params.row as Service)?.status ??
                        SERVICE_STATUS.UNKNOWN;
                      return <ServiceStatusIndicator status={status} />;
                    },
                  },
                ]}
                onRowClick={({ row }) => {
                  const id: string = row.id;
                  if (id) {
                    void navigate(`${baseRoute}/${id}`);
                  }
                }}
              />
            </Grid>
          </Page>
        </>
      )}
    </>
  );
}
