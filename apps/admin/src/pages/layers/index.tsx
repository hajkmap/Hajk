import { useState, useEffect, useMemo } from "react";
import Grid from "@mui/material/Grid2";
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  useTheme,
  TextField,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";
import {
  Layer,
  useLayers,
  LayerCreateInput,
  useCreateLayer,
} from "../../api/layers";
import { useServices } from "../../api/services";
import { useNavigate } from "react-router";
import { GRID_SWEDISH_LOCALE_TEXT } from "../../i18n/translations/datagrid/sv";
import useAppStateStore from "../../store/use-app-state-store";
import { SquareSpinnerComponent } from "../../components/progress/square-progress";
import DialogWrapper from "../../components/flexible-dialog";
import FormRenderer from "../../components/form-factory/form-renderer";
import { DefaultUseForm } from "../../components/form-factory/default-use-form";
import { createOnSubmitHandler } from "../../components/form-factory/form-utils";
import DynamicFormContainer from "../../components/form-factory/dynamic-form-container";
import { FieldValues } from "react-hook-form";
import INPUT_TYPE from "../../components/form-factory/types/input-type";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { toast } from "react-toastify";

export default function LayersPage() {
  const { t } = useTranslation();
  const { data: layers, isLoading } = useLayers();
  const navigate = useNavigate();
  const language = useAppStateStore((state) => state.language);
  const [open, setOpen] = useState<boolean>(false);
  const { data: services } = useServices();
  const { mutateAsync: createLayer } = useCreateLayer();
  const { palette } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredLayers = useMemo(() => {
    if (!layers || !services) return [];

    const searchFilter = (layer: Layer) => {
      const service = services.find(
        (service) => service.id === layer.serviceId
      );
      const combinedText = `${layer.name} ${service?.type ?? ""} ${
        service?.url ?? ""
      }`.toLowerCase();
      return combinedText.includes(searchTerm.toLowerCase());
    };

    return layers.filter(searchFilter).map((layer) => {
      const service = services.find(
        (service) => service.id === layer.serviceId
      );
      return {
        ...layer,
        type: service?.type ?? "",
        url: service?.url ?? "",
      };
    });
  }, [layers, services, searchTerm]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const [layer, setLayer] = useState<DynamicFormContainer<FieldValues>>(
    new DynamicFormContainer<FieldValues>()
  );

  const layerContainer = new DynamicFormContainer<FieldValues>();

  layerContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 12,
    name: "name",
    title: `${t("common.name")}`,
    defaultValue: "",
  });

  layerContainer.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 12,
    name: "serviceId",
    title: "Tjänst",
    defaultValue: "",
    optionList: services?.map((service) => ({
      title: service.name + `(${service.type})`,
      value: service.id,
    })),
    registerOptions: {
      required: `${t("common.required")}`,
    },
  });

  useEffect(() => {
    setLayer(layerContainer);
  }, []);

  const defaultValues = layer.getDefaultValues();

  const {
    register,
    handleSubmit,
    control,
    getValues,
    reset,
    formState: { errors, dirtyFields },
  } = DefaultUseForm(defaultValues);

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

  const onSubmit = createOnSubmitHandler({
    handleSubmit,
    dirtyFields,

    onValid: (data: FieldValues) => {
      const layerData = data as LayerCreateInput;
      void handleLayerSubmit(layerData);
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
      <Box component="div" sx={{ textAlign: "start" }}>
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
          <MenuItem
            onClick={() => {
              const id: string = (params.row as Layer).id;
              if (id) {
                void navigate(`/layers/${id}`);
              }
            }}
          >
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
        <Page
          title={t("common.layers")}
          actionButtons={
            <>
              <Button
                onClick={handleClickOpen}
                color="primary"
                variant="contained"
              >
                {t("layers.dialog.addBtn")}
              </Button>
            </>
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
            <FormRenderer
              formControls={layer}
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
            <DataGrid
              onCellClick={(params) => {
                if (params.field === "actions") {
                  return;
                }
                const id: string = (params.row as Layer).id;
                if (id) {
                  void navigate(`/layers/${id}`);
                }
              }}
              sx={{
                maxWidth: "100%",
                "& .MuiDataGrid-row:hover": {
                  cursor: "pointer",
                },
                "& .MuiDataGrid-row.Mui-selected": {
                  backgroundColor: "inherit",
                },
                "& .MuiDataGrid-cell:focus": {
                  outline: "none",
                },
                "& .MuiDataGrid-cell.Mui-selected": {
                  backgroundColor: "inherit",
                },
              }}
              rows={filteredLayers ?? []}
              getRowId={(row) => row.id}
              columns={[
                {
                  field: "type",
                  flex: 0.2,
                  headerName: t("common.serviceType"),
                },
                {
                  field: "name",
                  flex: 0.3,
                  headerName: t("common.name"),
                },
                {
                  field: "url",
                  flex: 0.6,
                  headerName: "Url",
                },
                {
                  field: "usedInMaps",
                  flex: 0.3,
                  headerName: t("common.usedInMaps"),
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
              hideFooterPagination={layers && layers.length < 10}
              pageSizeOptions={[10, 25, 50, 100]}
              slots={{ toolbar: GridToolbar }}
            />
          </Grid>
        </Page>
      )}
    </>
  );
}
