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
  useGridApiRef,
} from "@mui/x-data-grid";
import { TextField, Box } from "@mui/material";
import { grey } from "@mui/material/colors";

interface HajkDataGridProps {
  rows: Record<string, unknown>[];
  columns: GridColDef[];
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  searchFields?: string[];
  toolbar?: ReactNode;
  localeText?: string[];
}

export default function HajkDataGrid({
  rows,
  columns,
  searchFields,
  searchPlaceholder,
  onSearch,
  localeText,
}: HajkDataGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const apiRef = useGridApiRef();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  let filteredRows = rows;
  if (searchQuery.length > 2) {
    const lowerSearchQuery = searchQuery.toLowerCase(); // Calculate this once
    filteredRows = rows?.filter((row) =>
      searchFields?.some((field) => {
        const fieldValue = row[field]?.toString().toLowerCase() ?? "";
        return fieldValue.includes(lowerSearchQuery);
      })
    );
  }

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
        apiRef={apiRef}
        autoHeight
        disableRowSelectionOnClick
        localeText={localeText}
        rows={filteredRows}
        columns={columns}
        pageSizeOptions={[5, 10, 100]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10, page: 0 },
          },
        }}
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
