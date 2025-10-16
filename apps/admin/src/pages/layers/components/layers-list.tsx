import { useState, useMemo } from "react";
import Grid from "@mui/material/Grid2";
import { Button, useTheme, TextField, ListItemText } from "@mui/material";
import { GridRenderCellParams, GridColDef } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import Page from "../../../layouts/root/components/page";
import {
  Layer,
  useLayers,
  LayerCreateInput,
  useCreateLayer,
} from "../../../api/layers";
import {
  useServices,
  Service,
  SERVICE_TYPE,
  SERVICE_STATUS,
} from "../../../api/services";
import { useNavigate } from "react-router";
import { SquareSpinnerComponent } from "../../../components/progress/square-progress";
import DialogWrapper from "../../../components/flexible-dialog";
import { Controller, useForm } from "react-hook-form";
import { MenuItem, FormControl, InputLabel, Select } from "@mui/material";
import { toast } from "react-toastify";
import ServiceTypeBadge from "../../services/components/service-type-badge";
import ServiceStatusIndicator from "../../services/components/service-status-indicator";
import StyledDataGrid from "../../../components/data-grid";

interface LayersListProps {
  filterLayers: (layers: Layer[], services: Service[]) => Layer[];
  showCreateButton?: boolean;
  pageTitleKey: string;
  baseRoute: string;
}

type LayersGridRow = Omit<Layer, "status"> & {
  type: SERVICE_TYPE;
  url: string;
  status: SERVICE_STATUS | undefined;
};

export default function LayersList({
  filterLayers,
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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredLayers = useMemo<LayersGridRow[]>(() => {
    if (!layers || !services) return [];

    // First apply the specific filter for this page type
    const typeFilteredLayers = filterLayers(layers, services);

    // Then apply search filter
    const searchFilter = (layer: Layer) => {
      const service = services.find(
        (service) => service.id === layer.serviceId
      );
      const combinedText = `${layer.name} ${service?.type ?? ""} ${
        service?.url ?? ""
      }`.toLowerCase();
      return combinedText.includes(searchTerm.toLowerCase());
    };

    return typeFilteredLayers.filter(searchFilter).map((layer) => {
      const service = services.find(
        (service) => service.id === layer.serviceId
      );
      const serviceType: SERVICE_TYPE = service?.type ?? SERVICE_TYPE.WMS;
      return {
        ...layer,
        type: serviceType,
        url: service?.url ?? "",
        status: service?.status,
      };
    });
  }, [layers, services, searchTerm, filterLayers]);

  const handleClose = () => {
    setOpen(false);
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

  const handleLayerSubmit = async (layerData: LayerCreateInput) => {
    try {
      const payload = {
        name: layerData.name,
        serviceId: layerData.serviceId,
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

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleSubmit((data) => {
      const layerData: LayerCreateInput = {
        name: data.name,
        serviceId: data.serviceId,
      };
      void handleLayerSubmit(layerData);
    })(e);
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
            onSubmit={onSubmit}
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
                  {...register("name", { required: `${t("common.required")}` })}
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
            <StyledDataGrid<LayersGridRow>
              rows={filteredLayers ?? []}
              columns={
                [
                  {
                    field: "type",
                    flex: 0.1,
                    headerName: t("common.serviceType"),
                    renderCell: (
                      params: GridRenderCellParams<LayersGridRow>
                    ) => <ServiceTypeBadge type={params.row.type} />,
                  },
                  {
                    field: "name",
                    flex: 0.5,
                    headerName: t("common.name"),
                    renderCell: (
                      params: GridRenderCellParams<LayersGridRow>
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
                    field: "brokenService",
                    flex: 0.2,
                    headerName: t("common.status"),
                    headerAlign: "center",
                    renderCell: (
                      params: GridRenderCellParams<LayersGridRow>
                    ) => <ServiceStatusIndicator status={params.row.status!} />,
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
          </Grid>
        </Page>
      )}
    </>
  );
}
