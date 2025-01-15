import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid2";
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  TextField,
} from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
  GridRowHeightParams,
} from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";
import { Layer, useLayers } from "../../api/layers";
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

export default function LayersPage() {
  const { t } = useTranslation();
  const { data: layers, isLoading } = useLayers();
  const navigate = useNavigate();
  const language = useAppStateStore((state) => state.language);
  const [open, setOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

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
    name: "url",
    title: "N/A",
    defaultValue: "",
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
    formState: { errors, dirtyFields },
  } = DefaultUseForm(defaultValues);

  const onSubmit = createOnSubmitHandler({
    handleSubmit,
    dirtyFields,

    onValid: (data: FieldValues) => {
      console.log("Data: ", data);
    },
    onInvalid: (errors) => {
      console.log("Errors: ", errors);
    },
  });

  function CustomToolbar() {
    return (
      <GridToolbarContainer>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
      </GridToolbarContainer>
    );
  }

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

  // Filter rows based on search query
  const filteredLayers = layers?.filter((layer) =>
    Object.values(layer)
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

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
              data={layer}
              register={register}
              control={control}
              errors={errors}
            />
          </DialogWrapper>
          <Grid container direction="column" spacing={2} marginTop={3}>
            <Grid>
              <TextField
                fullWidth
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                label={t("common.searchLayer")}
              />
            </Grid>
            <Grid>
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
                  mt: 2,
                  "& .MuiDataGrid-row:hover": {
                    cursor: "pointer",
                  },
                }}
                rows={filteredLayers ?? []}
                columns={[
                  {
                    field: "serviceType",
                    flex: 0.3,
                    headerName: t("common.serviceType"),
                  },
                  {
                    field: "name",
                    flex: 1,
                    headerName: t("common.name"),
                  },
                  { field: "url", flex: 0.3, headerName: "Url" },
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
                slots={{
                  toolbar: CustomToolbar,
                }}
                slotProps={{
                  loadingOverlay: {
                    variant: "skeleton",
                    noRowsVariant: "skeleton",
                  },
                }}
                getRowHeight={({ densityFactor }: GridRowHeightParams) =>
                  50 * densityFactor
                }
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
                hideFooterPagination={
                  filteredLayers && filteredLayers.length < 10
                }
                pageSizeOptions={[10, 25, 50, 100]}
                disableRowSelectionOnClick
              />
            </Grid>
          </Grid>
        </Page>
      )}
    </>
  );
}
