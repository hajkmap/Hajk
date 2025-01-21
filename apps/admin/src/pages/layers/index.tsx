import { useState, useEffect, useMemo } from "react";
import Grid from "@mui/material/Grid2";
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
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
import Page from "../../layouts/root/components/page";
import { SquareSpinnerComponent } from "../../components/progress/square-progress";
// import AddLayerDialog from "./add-layer-dialog";
// import SearchBar from "./searchbar";
// import LayersTable from "./layers-table";
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
  const language = useAppStateStore((state) => state.language);
  const [open, setOpen] = useState<boolean>(false);
  const { data: services } = useServices();
  // const [openDialog, setOpenDialog] = useState(false);
  // const [searchQuery, setSearchQuery] = useState("");
  const { mutateAsync: createLayer } = useCreateLayer();
  const { palette } = useTheme();
  const navigate = useNavigate();

  const processedLayers = useMemo(() => {
    if (!layers || !services) return [];
    return layers.map((layer) => {
      const service = services.find(
        (service) => service.id === layer.serviceId
      );
      return {
        ...layer,
        type: service?.type ?? "",
        url: service?.url ?? "",
      };
    });
  }, [layers, services]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const [layer, setLayer] = useState<DynamicFormContainer<FieldValues>>(
    new DynamicFormContainer<FieldValues>()
  );

  // const handleDialogClose = () => setOpenDialog(false);
  // const handleDialogOpen = () => setOpenDialog(true);

  // Filtered layers based on the search query
  // const filteredLayers = layers?.filter((layer) =>
  //   Object.values(layer)
  //     .join(" ")
  //     .toLowerCase()
  //     .includes(searchQuery.toLowerCase())
  // );

  // return isLoading ? (
  //   <SquareSpinnerComponent />
  // ) : (
  //   <Page
  //     title={t("common.layers")}
  //     actionButtons={
  //       <Button onClick={handleDialogOpen} color="primary" variant="contained">
  //         {t("layers.dialog.addBtn")}
  //       </Button>
  //     }
  //   >
  //     <AddLayerDialog open={openDialog} onClose={handleDialogClose} />
  //     <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
  //     <LayersTable layers={filteredLayers ?? []} language={language} />
  //   </Page>
  // );

  const layerContainer = new DynamicFormContainer<FieldValues>();

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
    watch,
    reset,
    formState: { errors, dirtyFields },
  } = DefaultUseForm(defaultValues);

  const formFields = watch();

  const handleLayerSubmit = async (layerData: LayerCreateInput) => {
    try {
      const payload = {
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
                const id: string = (params.row as Layer).id;
                if (id) {
                  void navigate(`/layers/${id}`);
                }
              }}
              sx={{
                maxWidth: "100%",
                mt: 8,
                "& .MuiDataGrid-row:hover": {
                  cursor: "pointer",
                },
              }}
              rows={processedLayers ?? []}
              getRowId={(row) => row.id}
              columns={[
                {
                  field: "type",
                  flex: 0.3,
                  headerName: t("common.serviceType"),
                },
                {
                  field: "name",
                  flex: 0.3,
                  headerName: t("common.name"),
                },
                { field: "url", flex: 1, headerName: "Url" },
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
              disableRowSelectionOnClick
            />
          </Grid>
        </Page>
      )}
    </>
  );
}
