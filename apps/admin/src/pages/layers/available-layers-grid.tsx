import { useMemo, useEffect } from "react";
import { Paper, Grid2 as Grid, Typography, TextField } from "@mui/material";
import Scrollbar from "../../components/scrollbar/scrollbar";
import {
  DataGrid,
  GridRowSelectionModel,
  GridValidRowModel,
} from "@mui/x-data-grid";
import useAppStateStore from "../../store/use-app-state-store";
import { GRID_SWEDISH_LOCALE_TEXT } from "../../i18n/translations/datagrid/sv";
import { useTranslation } from "react-i18next";
import SearchIcon from "@mui/icons-material/Search";
import DataGridBadge from "./components/data-grid-badge";

function AvailableLayersGrid({
  isLoading,
  getCapLayers,
  selectedLayers,
  filteredLayers,
  setSearchTerm,
  setSelectGridId,
  searchTerm,
  selectGridId,
  selectedRowObjects,
}: {
  isLoading: boolean;
  getCapLayers: string[];
  selectedLayers: string[];
  filteredLayers: GridValidRowModel[];
  setSearchTerm: (term: string) => void;
  setSelectGridId: (ids: GridRowSelectionModel) => void;
  searchTerm: string;
  selectGridId?: GridRowSelectionModel;
  selectedRowObjects?: string[];
}) {
  const themeMode = useAppStateStore((state) => state.themeMode);
  const language = useAppStateStore((state) => state.language);
  const isDarkMode = themeMode === "dark";
  const { t } = useTranslation();
  const isDataLoading = isLoading || filteredLayers.length === 0;
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  const columns = [
    { field: "layer", headerName: t("common.layerName"), flex: 1 },
    { field: "infoClick", headerName: t("common.infoclick"), flex: 0.3 },
    { field: "publications", headerName: t("common.publications"), flex: 0.5 },
  ];

  const selectedRowIds = useMemo(
    () =>
      filteredLayers
        .filter((layer) => selectedLayers.includes(layer?.layer as string))
        .map((layer: GridValidRowModel) => layer.id as string),
    [filteredLayers, selectedLayers]
  );
  useEffect(() => {
    if (selectedRowIds.length > 0) {
      setSelectGridId(selectedRowIds);
    }
  }, [selectedRowIds, setSelectGridId]);

  const preSelectedLayers =
    selectedRowObjects?.filter((item) => !selectedLayers.includes(item)) ?? [];

  const removedSelectedLayers =
    selectedRowObjects?.filter((item) => selectedLayers.includes(item)) ?? [];

  return (
    <Paper
      key=""
      sx={{
        width: "100%",
        p: 2,
        mb: 3,
        backgroundColor: isDarkMode ? "#121212" : "#efefef",
      }}
    >
      <Typography variant="h6" sx={{ mt: -0.5, mb: 1.5 }}>
        {t("layers.availableLayers")}
      </Typography>
      <TextField
        sx={{
          mb: 3,
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
      {(selectedLayers.length !== 0 || preSelectedLayers.length !== 0) && (
        <DataGridBadge
          selectedLayers={selectedLayers}
          preSelectedLayers={preSelectedLayers}
          removedSelectedLayers={removedSelectedLayers}
        />
      )}
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
            loading={isDataLoading}
            localeText={
              language === "sv" ? GRID_SWEDISH_LOCALE_TEXT : undefined
            }
            rowSelectionModel={selectGridId}
            onRowSelectionModelChange={(ids) => setSelectGridId(ids)}
            checkboxSelection
            disableRowSelectionOnClick
          />
        </Scrollbar>
      </Grid>
    </Paper>
  );
}

export default AvailableLayersGrid;
