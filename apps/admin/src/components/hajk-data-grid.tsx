import { useState, ReactNode } from "react";
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
import { TextField, Box } from "@mui/material";
import { grey } from "@mui/material/colors";
import dataGridLocaleText from "../i18n/translations/datagrid-sv.json";

interface HajkDataGridProps {
  rows: Row[];
  columns: GridColDef[];
  localeText: Partial<GridLocaleText>;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  toolbar?: ReactNode;
}

interface Row {
  name: string;
  serviceType: string;
  url: string;
}

export default function HajkDataGrid({
  rows,
  columns,
  localeText,
  searchPlaceholder = "Search here...",
  onSearch,
}: HajkDataGridProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const GRID_SWEDISH_LOCALE_TEXT = {
    ...dataGridLocaleText.translation,
    ...localeText,
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  const filteredRows = rows?.filter(
    (row) =>
      (row.name ?? "")
        .toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (row.serviceType ?? "")
        .toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (row.url ?? "")
        .toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      {/* Search Bar */}
      <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 3, mt: 3 }}>
        <TextField
          label={searchPlaceholder}
          variant="outlined"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ width: "100%", label: { color: "gray" } }}
          size="small"
        />
      </Box>

      <DataGrid
        autoHeight
        disableRowSelectionOnClick
        localeText={GRID_SWEDISH_LOCALE_TEXT}
        rows={filteredRows}
        columns={columns}
        pageSizeOptions={[5, 10, 100]}
        getRowHeight={({ densityFactor }: GridRowHeightParams) => {
          return 50 * densityFactor;
        }}
        slots={{
          toolbar: CustomToolbar,
        }}
        sx={{
          boxShadow: 2,
          "& .MuiDataGrid-columnSeparator": {
            color: grey[600],
          },
          [`& .${gridClasses.cell}:focus, & .${gridClasses.cell}:focus-within`]:
            {
              outline: "none",
            },
          [`& .${gridClasses.columnHeader}:focus, & .${gridClasses.columnHeader}:focus-within`]:
            {
              outline: "none",
            },
        }}
      />
    </Box>
  );
}

function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
    </GridToolbarContainer>
  );
}
