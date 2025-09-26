import { useState, useMemo } from "react";
import Grid from "@mui/material/Grid2";
import { TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";
import { useTools } from "../../api/tools";
import StyledDataGrid from "../../components/data-grid";

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
              label={t("tools.searchTitle")}
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Grid>

          <Grid size={12}>
            <StyledDataGrid
              rows={filteredTools}
              columns={[
                {
                  field: "options",
                  headerName: "Titel",
                  flex: 0.3,
                  valueGetter: (params: { title: string }) => {
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
                },
              ]}
            />
          </Grid>
        </>
      )}
    </Page>
  );
}
