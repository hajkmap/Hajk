import { useState } from "react";
import {
  DataGrid,
  gridClasses,
  GridColDef,
  GridRowHeightParams,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
} from "@mui/x-data-grid";
import { Typography, TextField, Box, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLayers } from "../../api/layers";
import useAppStateStore from "../../store/use-app-state-store";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Button from "@mui/material/Button";
import { grey } from "@mui/material/colors";
import Grid from "@mui/material/Grid2";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export default function LayersPage() {
  const { t } = useTranslation();
  const {
    data: layers,
    isLoading: layersLoading,
    error: layersError,
  } = useLayers();

  const themeMode = useAppStateStore((state) => state.themeMode);
  const setThemeMode = useAppStateStore((state) => state.setThemeMode);
  const configLoading = useAppStateStore((state) => state.loadConfig);

  const [searchQuery, setSearchQuery] = useState("");
  const [dynamicLabel, setDynamicLabel] = useState(
    "Skriv namn eller ID här för att hitta ett lager..."
  );

  if (layersLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (layersError) {
    return <Typography>Error loading data</Typography>;
  }

  interface LocalizedTextsMap {
    columnMenuUnsort: string;
    columnMenuSortAsc: string;
    columnMenuSortDesc: string;
    columnMenuFilter: string;
    columnMenuHideColumn: string;
    columnMenuShowColumns: string;
    columnMenuHandleColumn: string;
    columnHeaderService: string;
    columnHeaderName: string;
    columnHeaderURL: string;
    columnHeaderUsedBy: string;
    columnHeaderIsBroken: string;
    columnHeaderActions: string;
    toolbarColumns: string;
    toolbarColumnsLabel: string;
    toolbarDensity: string;
    toolbarDensityLabel: string;
    toolbarDensityCompact: string;
    toolbarDensityStandard: string;
    toolbarDensityComfortable: string;
    toolbarFilters: string;
    toolbarFiltersLabel: string;
    toolbarFiltersTooltipShow: string;
    brokenLayerWarning: string;
  }

  const localizedTextsMap: LocalizedTextsMap = {
    columnMenuUnsort: "Ingen sortering",
    columnMenuSortAsc: "Sortera på ordning stigande",
    columnMenuSortDesc: "Sortera på ordning fallande",
    columnMenuFilter: "Filtrera",
    columnMenuHideColumn: "Göm kolumner",
    columnMenuShowColumns: "Visa kolumner",
    columnMenuHandleColumn: "Hantera kolumner",
    columnHeaderService: "Tjänstetyp",
    columnHeaderName: "Internt namn",
    columnHeaderURL: "URL",
    columnHeaderUsedBy: "Används i kartor",
    columnHeaderIsBroken: "Trasigt lager",
    columnHeaderActions: "Åtgärder",
    toolbarDensity: "Densitet",
    toolbarDensityLabel: "Densitet",
    toolbarDensityCompact: "Kompakt",
    toolbarDensityStandard: "Standard",
    toolbarDensityComfortable: "Komfortabel",
    toolbarFilters: "Filter",
    toolbarFiltersLabel: "Visa filter",
    toolbarFiltersTooltipShow: "Visa filter",
    toolbarColumns: "Kolumner",
    toolbarColumnsLabel: "Välj kolumner",
    brokenLayerWarning: "Lagret är fucking trasigt bror, fixa",
  };

  const columns: GridColDef[] = [
    {
      field: "serviceType",
      minWidth: 120,
      flex: 0.1,
      editable: false,
      renderHeader: () => (
        <strong>{localizedTextsMap.columnHeaderService}</strong>
      ),
      renderCell: (params) => (
        <div style={{ userSelect: "none" }}>{params.value}</div>
      ),
      filterable: true,
      sortable: true,
    },
    {
      field: "name",
      minWidth: 150,
      flex: 0.2,
      editable: false,
      renderHeader: () => <strong>{localizedTextsMap.columnHeaderName}</strong>,
      renderCell: (params) => (
        <div
          style={{
            userSelect: "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {params.value}
        </div>
      ),
    },
    {
      field: "url",
      minWidth: 300,
      flex: 0.4,
      editable: false,
      renderHeader: () => <strong>{localizedTextsMap.columnHeaderURL}</strong>,
      renderCell: (params) => (
        <div
          style={{
            userSelect: "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {params.value}
        </div>
      ),
    },
    {
      field: "usedBy",
      minWidth: 150,
      flex: 0.1,
      editable: false,
      renderHeader: () => (
        <strong>{localizedTextsMap.columnHeaderUsedBy}</strong>
      ),
      renderCell: (params) => (
        <div style={{ userSelect: "none" }}>{params.value}</div>
      ),
    },
    {
      field: "isBroken",
      minWidth: 150,
      flex: 0.1,
      editable: false,
      renderHeader: () => (
        <strong>{localizedTextsMap.columnHeaderIsBroken}</strong>
      ),
      renderCell: (params) =>
        params.value !== 1 ? (
          <div
            style={{
              userSelect: "none",
              height: "100%",
              display: "flex",
              justifyContent: "start",
              alignItems: "center",
            }}
          >
            <Tooltip title={localizedTextsMap.brokenLayerWarning}>
              <WarningAmberIcon
                sx={{ color: "black", maxWidth: "fit-content" }}
              />
            </Tooltip>
          </div>
        ) : (
          <div style={{ userSelect: "none" }}></div>
        ),
    },
    {
      field: "actions",
      minWidth: 100,
      flex: 0.2,
      editable: false,
      sortable: false,
      filterable: false,
      renderHeader: () => (
        <strong>{localizedTextsMap.columnHeaderActions}</strong>
      ),
      renderCell: () => (
        <div
          style={{
            height: "100%",
            display: "flex",
            justifyContent: "start",
            alignItems: "center",
          }}
        >
          <Button
            variant="contained"
            size="small"
            sx={{
              backgroundColor: grey[300],
              width: "24px",
              minWidth: "10px",
              height: "28px",
            }}
          >
            <MoreVertIcon sx={{ color: "black", maxWidth: "fit-content" }} />
          </Button>
        </div>
      ),
    },
  ];

  const rows = layers?.map((layer) => ({
    id: layer.id,
    serviceType: layer.serviceId,
    name: layer.options.caption,
    url: layer.options.infoUrl,
    usedBy: layer.options.opacity,
    isBroken: layer.options.opacity,
    actions: "",
  }));

  const filteredRows = rows?.filter(
    (row) =>
      row.name.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function CustomToolbar() {
    return (
      <GridToolbarContainer>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
      </GridToolbarContainer>
    );
  }

  return (
    <Box sx={{ m: 3 }}>
      <Grid size={12} container>
        <Grid size={6}>
          <Typography variant="h3" textAlign="left">
            {t("common.layers")}
          </Typography>
        </Grid>
        <Grid
          size={6}
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"end"}
        >
          <Button
            variant="contained"
            sx={{ backgroundColor: "black", height: "35px", width: "180px" }}
          >
            Lägg till lager
          </Button>
        </Grid>
      </Grid>

      {/*SearchBar*/}
      <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 3, mt: 3 }}>
        <TextField
          label={dynamicLabel}
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setDynamicLabel("Sök lager")}
          onBlur={() =>
            setDynamicLabel(
              "Skriv namn eller ID här för att hitta ett lager..."
            )
          }
          sx={{ width: "100%", label: { color: "gray" } }}
          size="small"
        />
      </Box>

      <DataGrid
        autoHeight
        disableRowSelectionOnClick
        localeText={localizedTextsMap}
        rows={filteredRows ?? []}
        columns={columns}
        pageSizeOptions={[5, 10, 100]}
        getRowHeight={({ densityFactor }: GridRowHeightParams) => {
          return 50 * densityFactor;
        }}
        getRowSpacing={() => ({
          // top: params.isFirstVisible ? 0 : 5,
          // bottom: params.isLastVisible ? 0 : 5,
        })}
        slots={{
          toolbar: CustomToolbar,
        }}
        sx={{
          // border: "none",
          // "& .MuiDataGrid-cell": {
          //   marginRight: "20px",
          // },
          // "& .MuiDataGrid-columnHeader": {
          //   marginRight: "20px",
          //   border: "none !important",
          // },
          [`& .${gridClasses.cell}:focus, & .${gridClasses.cell}:focus-within`]:
            {
              outline: "none",
            },
          [`& .${gridClasses.columnHeader}:focus, & .${gridClasses.columnHeader}:focus-within`]:
            {
              outline: "none",
            },
          // "& .MuiDataGrid-row:hover": {
          //   backgroundColor: "rgba(0, 0, 0, 0.1)",
          // },
          // "& .MuiDataGrid-columnSeparator": {
          //   display: "none",
          // },
          // [`& .${gridClasses.row}`]: {
          //   // bgcolor:theme=>theme.palette.mode === 'light' ? grey[200] : grey[900],
          // },
          // "&, [class^=MuiDataGrid]": { border: "none" },
        }}
      ></DataGrid>
    </Box>
  );
}
