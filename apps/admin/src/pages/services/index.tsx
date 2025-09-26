import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import Grid from "@mui/material/Grid2";
import { Button, Box, useTheme, ListItemText, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";
import DynamicFormContainer from "../../components/form-factory/dynamic-form-container";
import { FieldValues } from "react-hook-form";
import INPUT_TYPE from "../../components/form-factory/types/input-type";
import FormRenderer from "../../components/form-factory/form-renderer";
import { DefaultUseForm } from "../../components/form-factory/default-use-form";
import { createOnSubmitHandler } from "../../components/form-factory/form-utils";
import { useServices, useCreateService } from "../../api/services";
import {
  Service,
  SERVICE_STATUS,
  SERVICE_TYPE,
  ServiceCreateInput,
} from "../../api/services/types";
import DialogWrapper from "../../components/flexible-dialog";
import { toast } from "react-toastify";
import { SquareSpinnerComponent } from "../../components/progress/square-progress";
import ServiceStatusIndicator from "./components/service-status-indicator";
import ServiceTypeBadge from "./components/service-type-badge";
import StyledDataGrid from "../../components/data-grid";
import { GridRenderCellParams } from "@mui/x-data-grid";

export default function ServicesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: services, isLoading } = useServices();
  const { mutateAsync: createService } = useCreateService();
  const [open, setOpen] = useState<boolean>(false);
  const { palette } = useTheme();

  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredServices = useMemo<Service[]>(() => {
    if (!services) return [];

    // Then apply search filter
    const searchFilter = (service: Service) => {
      return service.name.toLowerCase().includes(searchTerm.toLowerCase());
    };

    return services.filter(searchFilter);
  }, [services, searchTerm]);

  const createServiceContainer = new DynamicFormContainer<FieldValues>();

  createServiceContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 12,
    name: "name",
    title: `${t("common.name")}`,
    defaultValue: "",
  });

  createServiceContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 12,
    name: "url",
    title: "Url",
    defaultValue: "",
    registerOptions: {
      required: `${t("common.required")}`,
    },
  });

  createServiceContainer.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 4,
    name: "type",
    title: `${t("common.serviceType")}`,
    defaultValue: SERVICE_TYPE.WMS,
    optionList: Object.keys(SERVICE_TYPE).map((type) => ({
      title: type,
      value: type,
    })),
    registerOptions: {
      required: `${t("common.required")}`,
    },
  });

  const [createServiceContainerData] = useState(createServiceContainer);
  const defaultValues = createServiceContainerData.getDefaultValues();

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, dirtyFields },
    reset,
    getValues,
  } = DefaultUseForm(defaultValues);

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
      void navigate(`/services/${response?.id}`);
      reset({ url: "" });
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

  const onSubmit = createOnSubmitHandler({
    handleSubmit,
    dirtyFields,

    onValid: (data: FieldValues) => {
      const serviceData = data as ServiceCreateInput;
      void handleServiceSubmit(serviceData);
    },
    onInvalid: (errors) => {
      console.log("Errors: ", errors);
    },
  });

  return (
    <>
      {isLoading ? (
        <SquareSpinnerComponent />
      ) : (
        <>
          {!services && <Box component="div">No services found</Box>}
          <Page
            title={t("common.services")}
            actionButtons={
              <>
                <Button
                  onClick={handleClickOpen}
                  color="primary"
                  variant="contained"
                >
                  {t("services.dialog.addBtn")}
                </Button>
              </>
            }
          >
            <DialogWrapper
              fullWidth
              open={open}
              title={t("services.dialog.title")}
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
              <FormRenderer
                formControls={createServiceContainerData}
                formGetValues={getValues}
                register={register}
                control={control}
                errors={errors}
              />
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
                    void navigate(`/services/${id}`);
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
