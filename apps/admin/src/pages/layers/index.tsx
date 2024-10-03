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
  GridLocaleText,
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

  const configLoading = useAppStateStore((state) => state.loadConfig);
  console.log(configLoading);

  interface CustomGridLocaleText extends GridLocaleText {
    columnHeaderService?: string;
    columnHeaderName?: string;
    columnHeaderURL?: string;
    columnHeaderUsedBy?: string;
    columnHeaderIsBroken?: string;
    columnHeaderActions?: string;
    brokenLayerWarning?: string;
  }

  const GRID_SWEDISH_LOCALE_TEXT: Partial<CustomGridLocaleText> = {
    columnMenuUnsort: "Ingen sortering",
    columnMenuSortAsc: "Sortera på ordning stigande",
    columnMenuSortDesc: "Sortera på ordning fallande",
    columnMenuFilter: "Filtrera",
    columnMenuHideColumn: "Göm kolumner",
    columnMenuShowColumns: "Visa kolumner",
    columnHeaderService: "Tjänstetyp",
    columnHeaderName: "Internt namn",
    columnHeaderURL: "URL",
    columnHeaderUsedBy: "Används i kartor",
    columnHeaderIsBroken: "Trasigt lager",
    columnHeaderActions: "Åtgärder",
    brokenLayerWarning: "Lagret är fucking trasigt bror, fixa",
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
  };

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

  const columns: GridColDef[] = [
    {
      field: "serviceType",
      minWidth: 120,
      flex: 0.1,
      editable: false,
      renderHeader: () => (
        <strong>{GRID_SWEDISH_LOCALE_TEXT.columnHeaderService}</strong>
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
      renderHeader: () => (
        <strong>{GRID_SWEDISH_LOCALE_TEXT.columnHeaderName}</strong>
      ),
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
      renderHeader: () => (
        <strong>{GRID_SWEDISH_LOCALE_TEXT.columnHeaderURL}</strong>
      ),
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
        <strong>{GRID_SWEDISH_LOCALE_TEXT.columnHeaderUsedBy}</strong>
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
        <strong>{GRID_SWEDISH_LOCALE_TEXT.columnHeaderIsBroken}</strong>
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
            <Tooltip title={GRID_SWEDISH_LOCALE_TEXT.brokenLayerWarning}>
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
        <strong>{GRID_SWEDISH_LOCALE_TEXT.columnHeaderActions}</strong>
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
        localeText={GRID_SWEDISH_LOCALE_TEXT}
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
          boxShadow: 2,
          [`& .${gridClasses.cell}:focus, & .${gridClasses.cell}:focus-within`]:
            {
              outline: "none",
            },
          [`& .${gridClasses.columnHeader}:focus, & .${gridClasses.columnHeader}:focus-within`]:
            {
              outline: "none",
            },
        }}
      ></DataGrid>
    </Box>
  );
}
