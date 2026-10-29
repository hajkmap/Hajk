import { useEffect, useRef } from "react";
import {
  Paper,
  Typography,
  TextField,
  Tooltip,
  Box,
  Button,
} from "@mui/material";
import {
  DataGrid,
  GRID_CHECKBOX_SELECTION_COL_DEF,
  GridColDef,
  GridRenderCellParams,
  GridRowSelectionModel,
  GridValidRowModel,
} from "@mui/x-data-grid";
import useAppStateStore from "../../store/use-app-state-store";
import { GRID_SWEDISH_LOCALE_TEXT } from "../../i18n/translations/datagrid/sv";
import { useTranslation } from "react-i18next";
import SearchIcon from "@mui/icons-material/Search";
import DataGridBadgeButton from "./components/data-grid-badge";
import GridRowRadio from "./components/grid-row-radio";
import {
  emptyIncludeSelectionModel,
  includeSelectionModel,
  normalizeRowSelectionModel,
} from "./row-selection-model";

function AvailableLayersGrid({
  isLoading,
  isError,
  onRetry,
  getCapLayers,
  selectedLayers,
  filteredLayers,
  setSearchTerm,
  setSelectGridId,
  onSelectionChange,
  searchTerm,
  selectGridId,
  selectedRowObjects,
  onLayerClick,
  singleSelection = false,
}: {
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  getCapLayers: string[];
  selectedLayers: string[];
  filteredLayers: GridValidRowModel[];
  setSearchTerm: (term: string) => void;
  setSelectGridId: (ids: GridRowSelectionModel) => void;
  onSelectionChange?: (ids: GridRowSelectionModel) => void;
  searchTerm: string;
  selectGridId?: GridRowSelectionModel;
  selectedRowObjects?: string[];
  onLayerClick: (layerName: string) => void;
  /** One layer at most: ticking one unticks the other. */
  singleSelection?: boolean;
}) {
  const themeMode = useAppStateStore((state) => state.themeMode);
  const language = useAppStateStore((state) => state.language);
  const isDarkMode = themeMode === "dark";
  const { t } = useTranslation();
  const userHasInteractedRef = useRef(false);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const tooltipSlotProps = {
    tooltip: {
      sx: {
        "&&": {
          bgcolor: "background.paper",
          color: "text.primary",
          border: "1px solid black",
          borderRadius: 0,
          boxShadow: "none",
          fontSize: "1.1rem",
        },
      },
    },
  } as const;

  const columns: GridColDef[] = [
    {
      field: "layer",
      headerName: t("common.layerName"),
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip
          title={params.value as string}
          enterDelay={500}
          enterNextDelay={500}
          slotProps={tooltipSlotProps}
        >
          <Box
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              width: "100%",
            }}
          >
            {params.value as string}
          </Box>
        </Tooltip>
      ),
    },
    { field: "infoClick", headerName: t("common.infoclick"), flex: 0.3 },
    { field: "publications", headerName: t("common.publications"), flex: 0.5 },
  ];
  // With one layer to choose, its column has radio buttons and no "all".
  const gridColumns = singleSelection
    ? [
        { ...GRID_CHECKBOX_SELECTION_COL_DEF, renderHeader: () => null },
        ...columns,
      ]
    : columns;

  useEffect(() => {
    if (userHasInteractedRef.current) return;
    const expectedIds = filteredLayers
      .filter((layer) => selectedLayers.includes(layer?.layer as string))
      .map((layer: GridValidRowModel) => layer.id as string)
      // The grid takes one in single mode.
      .slice(0, singleSelection ? 1 : undefined);

    const normalized = normalizeRowSelectionModel(selectGridId);
    const currentIdsArray =
      normalized?.type === "include" ? Array.from(normalized.ids) : [];
    const currentIds = currentIdsArray.slice().sort().join(",");
    const expectedIdsStr = expectedIds.slice().sort().join(",");

    if (expectedIds.length > 0 && currentIds !== expectedIdsStr) {
      setSelectGridId(includeSelectionModel(expectedIds));
    } else if (expectedIds.length === 0 && currentIdsArray.length > 0) {
      setSelectGridId(emptyIncludeSelectionModel());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLayers, filteredLayers, singleSelection]);

  useEffect(() => {
    userHasInteractedRef.current = false;
  }, [selectedLayers]);

  const preSelectedLayers =
    selectedRowObjects?.filter((item) => !selectedLayers.includes(item)) ?? [];

  const removedSelectedLayers =
    selectedRowObjects?.filter((item) => selectedLayers.includes(item)) ?? [];

  const isEmpty = !isLoading && !isError && getCapLayers.length === 0;

  return (
    <Paper
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

      {isError ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="error" sx={{ mb: 2 }}>
            {t("layers.errorLoadingCapabilities")}
          </Typography>
          {onRetry && (
            <Button variant="outlined" onClick={onRetry}>
              {t("common.retry")}
            </Button>
          )}
        </Box>
      ) : isEmpty ? (
        <Typography
          sx={{ textAlign: "center", fontSize: "large", mt: 1, py: 4 }}
          color="text.secondary"
        >
          {t("services.error.layers")}
        </Typography>
      ) : (
        <>
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
          {(selectedLayers.length !== 0 || preSelectedLayers.length !== 0) &&
            !isLoading && (
              <DataGridBadgeButton
                selectedLayers={selectedLayers}
                preSelectedLayers={preSelectedLayers}
                removedSelectedLayers={removedSelectedLayers}
                isDarkMode={isDarkMode}
                onLayerClick={onLayerClick}
              />
            )}
          <DataGrid
            sx={{
              maxWidth: "100%",
              mb: 2,
              mt: 1,
              height: 400,
              backgroundColor: isDarkMode ? "#3b3b3b" : "#fbfbfb",
            }}
            rows={filteredLayers}
            columns={gridColumns}
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
            hideFooter={filteredLayers.length <= 10}
            pageSizeOptions={[10, 25, 50, 100]}
            pagination
            loading={isLoading}
            localeText={
              language === "sv" ? GRID_SWEDISH_LOCALE_TEXT : undefined
            }
            disableRowSelectionExcludeModel
            rowSelectionModel={selectGridId ?? emptyIncludeSelectionModel()}
            onRowSelectionModelChange={(ids) => {
              userHasInteractedRef.current = true;
              if (onSelectionChange) {
                onSelectionChange(ids);
              } else {
                setSelectGridId(ids);
              }
            }}
            checkboxSelection
            disableMultipleRowSelection={singleSelection}
            slots={singleSelection ? { rowCheckbox: GridRowRadio } : undefined}
            disableRowSelectionOnClick
          />
        </>
      )}
    </Paper>
  );
}

export default AvailableLayersGrid;
