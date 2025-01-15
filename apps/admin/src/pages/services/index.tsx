import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Grid from "@mui/material/Grid2";
import {
  Button,
  Box,
  useTheme,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
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
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

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
    watch,
  } = DefaultUseForm(defaultValues);

  const formFields = watch();

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

  const RowMenu = (params: { row: { id: string } }) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget as HTMLElement | null);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    return (
      <Box component="div" sx={{ textAlign: "center" }}>
        <IconButton onClick={handleClick}>
          <MoreHorizIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
        >
          <MenuItem onClick={() => alert(`View ${params.row.id}`)}>
            View
          </MenuItem>
          <MenuItem onClick={() => alert(`Edit ${params.row.id}`)}>
            Edit
          </MenuItem>
          <MenuItem onClick={() => alert(`Delete ${params.row.id}`)}>
            Delete
          </MenuItem>
        </Menu>
      </Box>
    );
  };

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
                formControls={service}
                formFields={formFields}
                register={register}
                control={control}
                errors={errors}
              />
            </DialogWrapper>
            <Grid size={12}>
              <DataGrid
                onCellClick={(params) => {
                  if (params.field === "actions") {
                    return;
                  }
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
                  {
                    field: "brokenService",
                    flex: 0.3,
                    headerName: t("common.brokenService"),
                  },
                  {
                    field: "actions",
                    headerName: t("common.actions"),
                    flex: 0.2,
                    renderCell: (params: { row: { id: string } }) => (
                      <RowMenu {...params} />
                    ),
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
