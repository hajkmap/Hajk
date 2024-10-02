import { useState } from 'react';
import { DataGrid, gridClasses, GridColDef, GridRowHeightParams, GridToolbarContainer, GridToolbarDensitySelector} from "@mui/x-data-grid";
import { Typography, TextField, Box} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLayers } from "../../api/layers";
import { useConfig } from "../../hooks/use-config";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Button from '@mui/material/Button';
import { grey } from '@mui/material/colors';
import Grid from '@mui/material/Grid2';

export default function LayersPage() {
  const { t } = useTranslation();
  const { data: layers, isLoading: layersLoading, error: layersError } = useLayers();
  const { loading: configLoading, loadError: configLoadError } = useConfig();

  const [searchQuery, setSearchQuery] = useState('');
  const [dynamicLabel, setDynamicLabel] = useState('Skriv namn eller ID här för att hitta ett lager...');

  if (configLoading || layersLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (configLoadError || layersError) {
    return <Typography>Error loading data</Typography>;
  }

  const localizedTextsMap = {
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
    columnHeaderActions: "Åtgärder",
  };
  
  const columns: GridColDef[] = [
    {
      field: "serviceType",
      minWidth: 100,
      flex: 0.1,
      editable: false,
      renderHeader: () => <strong>{localizedTextsMap.columnHeaderService}</strong>,
      renderCell: (params) => (
        <div style={{ userSelect: "none" }}>
          {params.value}
        </div>
      ),
      filterable: true,
      sortable: true,
    },
    {
      field: "name", 
      minWidth: 180,
      flex: 0.2,
      editable: false,
      renderHeader: () => <strong>{localizedTextsMap.columnHeaderName}</strong>,
      renderCell: (params) => (
        <div style={{ userSelect: "none" }}>
          {params.value}
          </div>
      ),
    },
    {
      field: "url",
      minWidth: 300,
      flex: 0.4,      editable: false,
      renderHeader: () => <strong>{localizedTextsMap.columnHeaderURL}</strong>,
      renderCell: (params) => (
        <div style={{ userSelect: "none" }}>
          {params.value}
        </div>
      )
    },
    {
      field: "usedBy",
      minWidth: 150,
      flex: 0.1,      editable: false,
      renderHeader: () => <strong>{localizedTextsMap.columnHeaderUsedBy}</strong>,
      renderCell: (params) => (
        <div style={{ userSelect: "none" }}>
          {params.value}
        </div>
      )
    },
    {
      field: "actions",
      minWidth: 150,
      flex: 0.2,      
      editable: false,
      renderHeader: () => <strong>{localizedTextsMap.columnHeaderActions}</strong>,
      renderCell: () => (
        <Button
        variant="contained"
        size='small'
        sx={{
          backgroundColor: grey[300],
          height: "35px",
          width: "30px",
          minWidth: "10px",
        }}
        >
          <MoreVertIcon sx={{color: "black", maxWidth: "auto"}} />
        </Button>
      )
    },
  ];

  const rows = layers?.map((layer) => ({
    id: layer.id,
    serviceType: layer.type,
    name: layer.options.name,
    url: layer.options.url,
    usedBy: layer.options.opacity,
    actions: "",
  }));

  const filteredRows = rows?.filter((row) =>
    row.id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.serviceType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function CustomToolbar() {
    return (
      <GridToolbarContainer>
        <GridToolbarDensitySelector />
      </GridToolbarContainer>
    );
  }

  return (
    <Box sx={{m: 3}}>

      <Grid size={12} container>
        <Grid size={6}>
          <Typography variant="h3" textAlign="left">
            {t("common.layers")}
          </Typography>
        </Grid>
        <Grid size={6} display={"flex"} justifyContent={"flex-end"} alignItems={"end"}>
      <Button 
      variant="contained"
      sx={{backgroundColor: "black", height: "35px", width: "180px"}}
      >
      Lägg till lager
      </Button>
        </Grid>
      </Grid>

        {/*SearchBar*/}
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3, mt: 3}}>
        <TextField
          label={dynamicLabel}
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setDynamicLabel("Sök lager")}
          onBlur={() => setDynamicLabel("Skriv namn eller ID här för att hitta ett lager...")}
          sx={{ width: '100%', label: { color: 'gray' } }} 
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
  getRowSpacing={params => ({
    top: params.isFirstVisible ? 0 : 5,
    bottom: params.isLastVisible ? 0 : 5
  })}
  slots={{
    toolbar: CustomToolbar,
  }}
  sx={{
    border: "none",
    '& .MuiDataGrid-cell': {
      marginRight: '20px', 
    },
    '& .MuiDataGrid-columnHeader': {
      marginRight: '20px', 
      border: "none !important",
    },
    [`& .${gridClasses.cell}:focus, & .${gridClasses.cell}:focus-within`]:
    {
     outline: 'none',
    },
    [`& .${gridClasses.columnHeader}:focus, & .${gridClasses.columnHeader}:focus-within`]:
    {
      outline: 'none',
    },
    '& .MuiDataGrid-row:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.1)', 
    },
    '& .MuiDataGrid-columnSeparator': {
      display: 'none', 
    },
    [`& .${gridClasses.row}`]: {
      // bgcolor:theme=>theme.palette.mode === 'light' ? grey[200] : grey[900],
    },
    '&, [class^=MuiDataGrid]': { border: 'none', },
  }}
></DataGrid>


    </Box>
  );
}
