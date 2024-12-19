import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Grid from "@mui/material/Grid2";
import { Button, Box, useTheme } from "@mui/material";
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
  ServiceCreateFormData,
  serviceTypes,
} from "../../api/services/types";
import DialogWrapper from "../../components/flexible-dialog";
import { toast } from "react-toastify";
import { DataGrid } from "@mui/x-data-grid";
import { GRID_SWEDISH_LOCALE_TEXT } from "../../i18n/translations/datagrid/sv";
import useAppStateStore from "../../store/use-app-state-store";
import { SquareSpinnerComponent } from "../../components/progress/square-progress";

export default function ServicesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: services, isLoading } = useServices();
  const { mutateAsync: createService } = useCreateService();
  const [open, setOpen] = useState<boolean>(false);
  const { palette } = useTheme();
  const language = useAppStateStore((state) => state.language);

  const [service, setService] = useState<DynamicFormContainer<FieldValues>>(
    new DynamicFormContainer<FieldValues>()
  );

  const serviceContainer = new DynamicFormContainer<FieldValues>();

  serviceContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 12,
    name: "url",
    title: "Url",
    defaultValue: "",
    registerOptions: {
      required: `${t("common.required")}`,
    },
  });

  serviceContainer.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 4,
    name: "type",
    title: `${t("common.serviceType")}`,
    defaultValue: serviceTypes[4],
    optionList: serviceTypes.map((type) => ({
      title: type,
      value: type,
    })),
    registerOptions: {
      required: `${t("common.required")}`,
    },
  });

  useEffect(() => {
    setService(serviceContainer);
  }, []);

  const defaultValues = service.getDefaultValues();

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
  } = DefaultUseForm(defaultValues);

  const handleServiceSubmit = async (serviceData: ServiceCreateFormData) => {
    try {
      const payload = {
        type: serviceData.type,
        url: serviceData.url,
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
      const serviceData = data as ServiceCreateFormData;
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
                    {t("services.dialog.closeBtn")}
                  </Button>
                  <Button type="submit" color="primary" variant="contained">
                    {t("services.dialog.saveBtn")}
                  </Button>
                </>
              }
            >
              <FormRenderer
                data={service}
                register={register}
                control={control}
                errors={errors}
              />
            </DialogWrapper>
            <Grid size={12}>
              <DataGrid
                onCellClick={(params) => {
                  const id: string = (params.row as Service).id;
                  if (id) {
                    void navigate(`/services/${id}`);
                  }
                }}
                sx={{
                  maxWidth: "100%",
                  mt: 8,
                  "& .MuiDataGrid-row:hover": {
                    cursor: "pointer",
                  },
                }}
                rows={services ?? []}
                columns={[
                  {
                    field: "type",
                    flex: 0.3,
                    headerName: t("common.serviceType"),
                  },
                  { field: "name", flex: 1, headerName: t("common.name") },
                  { field: "url", flex: 1, headerName: "Url" },
                  {
                    field: "version",
                    flex: 0.3,
                    headerName: "Version",
                  },
                ]}
                slotProps={{
                  loadingOverlay: {
                    variant: "skeleton",
                    noRowsVariant: "skeleton",
                  },
                }}
                localeText={
                  language === "sv" ? GRID_SWEDISH_LOCALE_TEXT : undefined
                }
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 10,
                    },
                  },
                }}
                getRowId={(row) => row.id}
                hideFooterPagination={services && services.length < 10}
                pageSizeOptions={[10, 25, 50, 100]}
                disableRowSelectionOnClick
              />
            </Grid>
          </Page>
        </>
      )}
    </>
  );
}
