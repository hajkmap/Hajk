import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid2";
import { Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
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

export default function LayersPage() {
  const { t } = useTranslation();
  const { data: layers, isLoading } = useLayers();
  const navigate = useNavigate();
  const language = useAppStateStore((state) => state.language);
  const [open, setOpen] = useState<boolean>(false);

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
          <Grid size={12}>
            <DataGrid
              onCellClick={(params) => {
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
              rows={layers ?? []}
              columns={[
                {
                  field: "id",
                  flex: 0.3,
                  headerName: "ID",
                },
                { field: "locked", flex: 0.3, headerName: "Locked" },
                {
                  field: "name",
                  flex: 1,
                  headerName: t("common.name"),
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
