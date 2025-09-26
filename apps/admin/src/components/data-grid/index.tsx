import {
  DataGrid,
  DataGridProps,
  GridColDef,
  GridValidRowModel,
} from "@mui/x-data-grid";
import { useTheme } from "@mui/material";
import { GRID_SWEDISH_LOCALE_TEXT } from "../../i18n/translations/datagrid/sv";
import useAppStateStore from "../../store/use-app-state-store";

export interface StyledDataGridProps<
  T extends GridValidRowModel = GridValidRowModel
> extends Omit<DataGridProps<T>, "localeText"> {
  columns: GridColDef<T>[];
  rows: T[];
  onRowClick?: (params: { row: T }) => void;
  searchTerm?: string;
  showSearch?: boolean;
  customSx?: Record<string, unknown>;
  pageSize?: number;
  pageSizeOptions?: number[];
  hideFooterPagination?: boolean;
  autoHeight?: boolean;
  loading?: boolean;
  getRowId?: (row: T) => string;
  slots?: DataGridProps<T>["slots"];
  slotProps?: DataGridProps<T>["slotProps"];
}

export default function StyledDataGrid<
  T extends GridValidRowModel = GridValidRowModel
>({
  columns,
  rows,
  onRowClick,
  customSx = {},
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  hideFooterPagination,
  loading = false,
  getRowId = (row: GridValidRowModel) => String(row.id),
  slots,
  slotProps,
  ...otherProps
}: StyledDataGridProps<T>) {
  const { palette } = useTheme();
  const language = useAppStateStore((state) => state.language);

  const defaultSx = {
    maxWidth: "100%",
    border: "none",
    "& .MuiDataGrid-footerContainer": {
      borderTop: "none",
      borderBottom: "none",
    },
    "& .MuiDataGrid-row:nth-of-type(even)": {
      backgroundColor: palette.mode === "dark" ? "#1e1e1e" : "#fbfbfb",
    },
    "& .MuiDataGrid-row:nth-of-type(odd)": {
      backgroundColor: palette.mode === "dark" ? "#292929" : "#f7f7f7",
    },
    "& .MuiDataGrid-row:hover": {
      backgroundColor: palette.action.hover,
      cursor: onRowClick ? "pointer" : "default",
    },
    "& .MuiDataGrid-columnHeaderTitle": {
      fontSize: "1.3rem",
      letterSpacing: "0.02em",
      color: palette.text.primary,
    },
    "& .MuiDataGrid-columnSeparator": {
      display: "none",
    },
    "& .MuiDataGrid-row--borderBottom .MuiDataGrid-columnHeader": {
      borderTop: "none",
      borderBottom: "none",
    },
    "& .MuiDataGrid-row.Mui-selected": {
      backgroundColor: "inherit",
    },
    "& .MuiDataGrid-cell": {
      border: "none",
    },
    "& .MuiDataGrid-cell:focus": {
      outline: "none",
    },
    "& .MuiDataGrid-cell.Mui-selected": {
      backgroundColor: "inherit",
    },
    ...customSx,
  };

  const handleCellClick = (params: { field: string; row: T }) => {
    if (params.field === "actions") {
      return;
    }
    if (onRowClick) {
      onRowClick({ row: params.row });
    }
  };

  return (
    <DataGrid<T>
      {...otherProps}
      density="comfortable"
      disableColumnMenu
      onCellClick={handleCellClick}
      sx={defaultSx}
      rows={rows}
      getRowId={getRowId}
      columns={columns}
      localeText={language === "sv" ? GRID_SWEDISH_LOCALE_TEXT : undefined}
      initialState={{
        pagination: {
          paginationModel: {
            pageSize,
          },
        },
      }}
      hideFooterPagination={
        hideFooterPagination ?? (rows && rows.length < pageSize)
      }
      pageSizeOptions={pageSizeOptions}
      loading={loading}
      slots={slots}
      slotProps={slotProps}
      disableRowSelectionOnClick
    />
  );
}
