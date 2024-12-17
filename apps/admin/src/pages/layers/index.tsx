import Grid from "@mui/material/Grid2";
import { Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";
import { Layer, useLayers } from "../../api/layers";
import { useNavigate } from "react-router";
import { GRID_SWEDISH_LOCALE_TEXT } from "../../i18n/translations/datagrid/sv";
import useAppStateStore from "../../store/use-app-state-store";

export default function LayersPage() {
  const { t } = useTranslation();
  const { data: layers, isLoading } = useLayers();
  const navigate = useNavigate();
  const language = useAppStateStore((state) => state.language);

  console.log("layers", layers);

  return (
    <>
      {isLoading ? (
        <div>{t("common.loading")}</div>
      ) : (
        <Page
          title={t("common.layers")}
          actionButtons={
            <>
              <Button color="primary" variant="contained">
                {t("layers.dialog.addBtn")}
              </Button>
            </>
          }
        >
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
                  renderCell: (params) => (params?.value as string) || "N/A",
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
