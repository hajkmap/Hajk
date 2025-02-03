import { useState, useMemo } from "react";
import Grid from "@mui/material/Grid2";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";
import { useGroups } from "../../api/groups";

export default function GroupsPage() {
  const { t } = useTranslation();
  const { data: groups, isLoading } = useGroups();
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  console.log(groups);

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    return groups.filter((group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [groups, searchTerm]);

  return (
    <Page title={t("common.layerGroups")}>
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
              rows={filteredGroups}
              getRowId={(row) => row.id}
              columns={[
                {
                  field: "name",
                  headerName: "Visningsnamn",
                  flex: 0.4,
                },
                {
                  field: "locked",
                  headerName: "Typ av grupp",
                  flex: 0.5,
                },
                {
                  field: "id",
                  headerName: "Intern namn",
                  flex: 0.3,
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
              hideFooterPagination={groups && groups.length < 5}
              pageSizeOptions={[5, 10, 25, 50]}
              slots={{ toolbar: GridToolbar }}
            />
          </Grid>
        </>
      )}
    </Page>
  );
}
