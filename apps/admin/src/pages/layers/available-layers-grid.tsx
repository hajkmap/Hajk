import { useState, useMemo } from "react";
import { Paper, Grid2 as Grid, Typography, TextField } from "@mui/material";
import Scrollbar from "../../components/scrollbar/scrollbar";
import { DataGrid } from "@mui/x-data-grid";
import useAppStateStore from "../../store/use-app-state-store";
import { useServiceByLayerId } from "../../api/layers";
import { useServiceCapabilities } from "../../api/services";
import { GRID_SWEDISH_LOCALE_TEXT } from "../../i18n/translations/datagrid/sv";
import { useTranslation } from "react-i18next";
import SearchIcon from "@mui/icons-material/Search";
import { Layer } from "../../api/layers";

function AvailableLayersGrid({
  layerId,
  layer,
}: {
  layerId: string;
  layer: Layer;
}) {
  const themeMode = useAppStateStore((state) => state.themeMode);
  const language = useAppStateStore((state) => state.language);
  const isDarkMode = themeMode === "dark";
  const { data: service, isLoading } = useServiceByLayerId(layerId);
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const { selectedLayers } = layer;

  const { layers: getCapLayers } = useServiceCapabilities({
    baseUrl: service?.url ?? "",
    type: service?.type ?? "",
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const columns = [
    { field: "layer", headerName: t("common.layerName"), flex: 1 },
    { field: "infoClick", headerName: t("common.infoclick"), flex: 0.3 },
    { field: "publications", headerName: t("common.publications"), flex: 0.5 },
  ];

  const filteredLayers = useMemo(() => {
    if (!getCapLayers) return [];
    return getCapLayers
      .filter((layer) => layer.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((layer, index) => ({
        id: index,
        layer,
        infoClick: "",
        publications: "",
        actions: "",
      }));
  }, [getCapLayers, searchTerm]);

  const selectedRowIds = filteredLayers
    .filter((layer) => selectedLayers?.includes(layer.layer))
    .map((layer) => layer.id.toString());

  console.log("selectedRowIds", selectedRowIds);

  const [selectionModel, setSelectionModel] =
    useState<string[]>(selectedRowIds);

  return (
    <Paper
      key=""
      sx={{
        width: "100%",
        p: 2,
        mb: 3,
      }}
    >
      <Typography variant="h6" sx={{ mt: -0.5, mb: 1.5 }}>
        Tillgängliga lager
      </Typography>
      <TextField
        sx={{
          mb: 2,
          mt: 1,
          width: "100%",
          maxWidth: "400px",
          backgroundColor: isDarkMode ? "#3b3b3b" : "#fbfbfb",
        }}
        label={t("layers.searchTitle")}
        variant="outlined"
        value={searchTerm}
        onChange={handleSearchChange}
        slotProps={{
          input: {
            endAdornment: <SearchIcon />,
          },
        }}
      />
      <Grid container>
        <Scrollbar sx={{ maxHeight: "400px" }}>
          <DataGrid
            sx={{
              maxWidth: "100%",
              mb: 2,
              mt: 1,
              backgroundColor: isDarkMode ? "#3b3b3b" : "#fbfbfb",
            }}
            rows={filteredLayers}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 10,
                },
              },
            }}
            slotProps={{
              loadingOverlay: {
                variant: "skeleton",
                noRowsVariant: "skeleton",
              },
            }}
            hideFooterPagination={getCapLayers && getCapLayers.length < 10}
            pageSizeOptions={[10, 25, 50, 100]}
            pagination
            loading={isLoading}
            localeText={
              language === "sv" ? GRID_SWEDISH_LOCALE_TEXT : undefined
            }
            rowSelectionModel={selectedRowIds}
            onRowSelectionModelChange={(ids) =>
              setSelectionModel(ids.map((id) => id.toString()))
            }
            checkboxSelection
            disableRowSelectionOnClick
          />
        </Scrollbar>
      </Grid>
    </Paper>
  );
}

export default AvailableLayersGrid;
