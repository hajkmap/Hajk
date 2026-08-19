import { useMemo, useState } from "react";
import { Link, TextField, Typography, useTheme } from "@mui/material";
import { DataGrid, GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import SearchIcon from "@mui/icons-material/Search";
import FormPanel from "./form-components/form-panel";
import { GRID_SWEDISH_LOCALE_TEXT } from "../i18n/translations/datagrid/sv";
import useAppStateStore from "../store/use-app-state-store";

export interface UsedInMapsRow {
  id: string;
  map: string;
  mapId?: string | number;
  group?: string;
  usage?: string;
}

interface UsedInMapsPanelProps {
  rows: UsedInMapsRow[];
  isLoading?: boolean;
  emptyMessage: string;
  showGroupColumn?: boolean;
  showUsageColumn?: boolean;
}

export default function UsedInMapsPanel({
  rows,
  isLoading = false,
  emptyMessage,
  showGroupColumn = false,
  showUsageColumn = false,
}: UsedInMapsPanelProps) {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const navigate = useNavigate();
  const language = useAppStateStore((state) => state.language);
  const isDarkMode = palette.mode === "dark";
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((row) => {
      const values = [row.map, row.group, row.usage].filter(Boolean);
      return values.some((value) => value!.toLowerCase().includes(term));
    });
  }, [rows, searchTerm]);

  const columns = useMemo(() => {
    const cols: GridColDef[] = [
      {
        field: "map",
        headerName: t("common.map"),
        flex: 1,
        minWidth: 160,
        renderCell: (params: GridRenderCellParams<UsedInMapsRow>) =>
          params.row.mapId != null ? (
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={(event) => {
                event.stopPropagation();
                void navigate(`/maps/${params.row.mapId}?tab=tools`);
              }}
              color="inherit"
              sx={{ textAlign: "left" }}
            >
              {params.row.map}
            </Link>
          ) : (
            params.row.map
          ),
      },
    ];

    if (showGroupColumn) {
      cols.push({
        field: "group",
        headerName: t("common.group"),
        flex: 1,
        minWidth: 140,
      });
    }

    if (showUsageColumn) {
      cols.push({
        field: "usage",
        headerName: t("common.usage"),
        flex: 0.5,
        minWidth: 120,
      });
    }

    return cols;
  }, [navigate, showGroupColumn, showUsageColumn, t]);

  const showSearch = isLoading || rows.length > 0;

  return (
    <FormPanel title={t("common.usedInMaps")}>
      {showSearch && (
        <TextField
          sx={{
            mb: 2,
            width: "100%",
            maxWidth: 400,
            backgroundColor: isDarkMode ? "#3b3b3b" : "#fbfbfb",
          }}
          label={t("common.search")}
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          slotProps={{ input: { endAdornment: <SearchIcon /> } }}
        />
      )}

      {!isLoading && filteredRows.length === 0 ? (
        <Typography color="text.secondary">{emptyMessage}</Typography>
      ) : (
        <DataGrid
          sx={{
            maxWidth: "100%",
            backgroundColor: isDarkMode ? "#3b3b3b" : "#fbfbfb",
          }}
          rows={filteredRows}
          columns={columns}
          loading={isLoading}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          slotProps={{
            loadingOverlay: { variant: "skeleton", noRowsVariant: "skeleton" },
          }}
          hideFooter={filteredRows.length <= 10}
          pageSizeOptions={[10, 25, 50, 100]}
          pagination
          localeText={language === "sv" ? GRID_SWEDISH_LOCALE_TEXT : undefined}
          disableRowSelectionOnClick
          autoHeight
        />
      )}
    </FormPanel>
  );
}
