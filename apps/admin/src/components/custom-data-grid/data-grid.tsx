import React from "react";
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
import { grey } from "@mui/material/colors";

interface CustomDataGridProps {
  rows: Record<string, unknown>[];
  columns: GridColDef[];
  filteredRows: Record<string, unknown>[];
  localeText?: Partial<GridColDef>;
  onRowClick?: () => void;
}

const CustomGrid: React.FC<CustomDataGridProps> = ({
  rows,
  columns,
  filteredRows,
  localeText,
  onRowClick,
}) => {
  const apiRef = useGridApiRef();

  return (
    <DataGrid
      apiRef={apiRef}
      autoHeight
      disableRowSelectionOnClick
      onRowClick={onRowClick}
      localeText={localeText}
      rows={filteredRows || rows}
      columns={columns}
      pageSizeOptions={[5, 10, 100]}
      initialState={{
        pagination: {
          paginationModel: { pageSize: 10, page: 0 },
        },
      }}
      getRowHeight={({ densityFactor }: GridRowHeightParams) =>
        50 * densityFactor
      }
      slots={{
        toolbar: CustomToolbar,
      }}
      getRowClassName={(params) =>
        params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
      }
      sx={{
        "& .MuiDataGrid-virtualScroller": {
          position: "inherit",
        },
        "& .MuiDataGrid-columnSeparator": {
          color: grey[600],
        },
        [`& .${gridClasses.cell}:focus, & .${gridClasses.cell}:focus-within`]: {
          outline: "none",
        },
        [`& .${gridClasses.columnHeader}:focus, & .${gridClasses.columnHeader}:focus-within`]:
          {
            outline: "none",
          },
      }}
    />
  );
};

function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
    </GridToolbarContainer>
  );
}

export default CustomGrid;
