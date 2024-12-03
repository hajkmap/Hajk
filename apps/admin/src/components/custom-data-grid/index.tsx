import { useState } from "react";
import Grid from "@mui/material/Grid2";
import CreateButton from "./create-button";
import SearchBar from "./searchbar";
import CustomGrid from "./data-grid";
import CustomDialog from "./custom-dialog";
import { GridColDef, GridLocaleText } from "@mui/x-data-grid";

interface HajkDataGridProps {
  rows: Record<string, unknown>[];
  columns: GridColDef[];
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  localeText?: Partial<GridLocaleText>;
  onRowClick?: () => void;
  buttonText: string;
}

export const CustomDataGrid: React.FC<HajkDataGridProps> = ({
  rows,
  columns,
  searchPlaceholder,
  onSearch,
  localeText,
  onRowClick,
  buttonText,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(""); // Search query state
  const [dialogOpen, setDialogOpen] = useState<boolean>(false); // Dialog state

  // Filter rows based on the search query
  const searchFields = columns
    .filter((column) => column.searchable)
    .map((column) => column.field);

  const filteredRows =
    searchQuery.length > 2
      ? rows.filter((row) =>
          searchFields.some((field) =>
            row[field]
              ?.toString()
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
          )
        )
      : rows;

  return (
    <Grid>
      <Grid size={12} container justifyContent={"end"}>
        <CreateButton text={buttonText} onClick={() => setDialogOpen(true)} />
      </Grid>
      <Grid
        sx={{ display: "flex", justifyContent: "flex-start", mb: 3, mt: 3 }}
      >
        <SearchBar
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (onSearch) onSearch(e.target.value);
          }}
        />
      </Grid>
      <CustomGrid
        rows={rows}
        columns={columns}
        filteredRows={filteredRows}
        localeText={localeText}
        onRowClick={onRowClick}
      />
      <CustomDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={() => setDialogOpen(false)}
        buttonText={buttonText}
      />
    </Grid>
  );
};

export default CustomDataGrid;
