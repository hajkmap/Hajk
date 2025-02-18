import { useState, useMemo, useEffect } from "react";
import {
  Paper,
  Grid2 as Grid,
  Typography,
  TextField,
  Button,
} from "@mui/material";
import Scrollbar from "../../components/scrollbar/scrollbar";
import { DataGrid, GridRowSelectionModel } from "@mui/x-data-grid";
import useAppStateStore from "../../store/use-app-state-store";
import { GRID_SWEDISH_LOCALE_TEXT } from "../../i18n/translations/datagrid/sv";
import { useTranslation } from "react-i18next";
import SearchIcon from "@mui/icons-material/Search";
import { LayerUpdateInput, useUpdateLayer } from "../../api/layers";
import { useToastifyOptions } from "../../lib/toastify-helper";

function AvailableLayersGrid({
  isLoading,
  getCapLayers,
  selectedLayers,
  serviceId,
  layerId,
}: {
  isLoading: boolean;
  getCapLayers: string[];
  selectedLayers: string[];
  serviceId: string;
  layerId: string;
}) {
  const themeMode = useAppStateStore((state) => state.themeMode);
  const language = useAppStateStore((state) => state.language);
  const isDarkMode = themeMode === "dark";
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>();
  const { mutateAsync: updateLayer } = useUpdateLayer();

  const getToastifyOptions = useToastifyOptions();
  const toastifyOptions = getToastifyOptions(
    "layers.updateLayersFailed",
    "layers.updateLayersSuccess"
  );

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

    const searchAndSelectedFilteredLayers = getCapLayers
      .map((layer, index) => {
        const isSelected = selectionModel?.includes(index);
        return {
          id: index,
          layer,
          infoClick: "",
          publications: "",
          selected: isSelected,
        };
      })
      .filter(
        (layer) =>
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          layer?.selected || // Disable lint here since ?? is messing with the data-grid search logic
          layer.layer.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const aMatches = a.layer
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const bMatches = b.layer
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
    return searchAndSelectedFilteredLayers;
  }, [getCapLayers, searchTerm]);

  const selectedRowIds = useMemo(
    () =>
      filteredLayers
        .filter((layer) => selectedLayers.includes(layer.layer))
        .map((layer) => layer.id),
    [filteredLayers, selectedLayers]
  );

  const selectedRowsData = useMemo(
    () =>
      selectionModel?.map((id) => filteredLayers.find((row) => row.id === id)),
    [selectionModel, filteredLayers]
  );

  const selectedRowObjects = useMemo(
    () => selectedRowsData?.map((row) => row?.layer ?? ""),
    [selectedRowsData]
  );

  useEffect(() => {
    setSelectionModel(selectedRowIds);
  }, [selectedRowIds]);

  const handleUpdateLayer = async (data: LayerUpdateInput) => {
    try {
      const payload = {
        serviceId,
        selectedLayers: data.selectedLayers,
      };

      const response = await updateLayer({
        layerId: layerId,
        data: payload,
      });
      if (response) {
        toastifyOptions.onSuccess();
      }
    } catch (error) {
      console.error("Failed to create layer:", error);
      if (error instanceof Error) {
        toastifyOptions.onError();
      }
    }
  };

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
      <Button
        variant="contained"
        onClick={() =>
          void handleUpdateLayer({
            serviceId: serviceId,
            selectedLayers: selectedRowObjects,
          })
        }
        sx={{ display: "block", mb: 1 }}
      >
        Spara
      </Button>
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
            rowSelectionModel={selectionModel}
            onRowSelectionModelChange={(ids) => setSelectionModel(ids)}
            checkboxSelection
          />
        </Scrollbar>
      </Grid>
    </Paper>
  );
}

export default AvailableLayersGrid;
