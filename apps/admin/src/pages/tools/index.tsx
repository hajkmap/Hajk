import { useState, useMemo } from "react";
import Grid from "@mui/material/Grid2";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { TextField, Typography, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";
import { useTools } from "../../api/tools";

export default function ToolsPage() {
  const { t } = useTranslation();
  const { data: tools, isLoading } = useTools();
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredTools = useMemo(() => {
    if (!tools) return [];
    return tools.filter((tool) =>
      tool.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tools, searchTerm]);

  return (
    <Page title={t("common.tools")}>
      {isLoading ? (
        <Typography variant="h6">{t("common.loading")}</Typography>
      ) : (
        <>
          <Grid size={12} container sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label={t("common.search")}
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Grid>

          <Grid size={12}>
            <DataGrid
              rows={filteredTools}
              getRowId={(row) => row.id}
              columns={[
                {
                  field: "options",
                  headerName: "Titel",
                  flex: 0.3,
                  valueGetter: (params: { title: string }) => {
                    // console.log(params);
                    return params ? params.title : null;
                  },
                },
                {
                  field: "type",
                  headerName: "Beskrivning",
                  flex: 0.4,
                },
                {
                  field: "usedInHajk",
                  headerName: "Används i HAJK",
                  flex: 0.4,
                },
                {
                  field: "actions",
                  headerName: t("common.actions"),
                  flex: 0.2,
                  // renderCell: (params: { row: { id: string } }) => (
                  //   <RowMenu {...params} />
                  // ),
                },
              ]}
              sx={{
                // maxWidth: "100%",
                "& .MuiDataGrid-row:hover": {
                  cursor: "pointer",
                },
                "& .MuiDataGrid-row.Mui-selected": {
                  backgroundColor: "inherit",
                },
                "& .MuiDataGrid-cell:focus": {
                  outline: "none",
                },
                "& .MuiDataGrid-cell.Mui-selected": {
                  backgroundColor: "inherit",
                },
              }}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 5 },
                },
              }}
              hideFooterPagination={tools && tools.length < 5}
              pageSizeOptions={[5, 10, 25, 50]}
              slots={{ toolbar: GridToolbar }}
            />
          </Grid>
        </>
      )}
    </Page>
  );
}
