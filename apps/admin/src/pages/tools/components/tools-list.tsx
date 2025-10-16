import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import Grid from "@mui/material/Grid2";
import { TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Page from "../../../layouts/root/components/page";
import { useTools, Tool } from "../../../api/tools";
import StyledDataGrid from "../../../components/data-grid";

interface ToolsListProps {
  filterTools: (tools: Tool[]) => Tool[];
  pageTitleKey: string;
  baseRoute: string;
}

export default function ToolsList({
  filterTools,
  pageTitleKey,
  baseRoute,
}: ToolsListProps) {
  const { t } = useTranslation();
  const { data: tools, isLoading } = useTools();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredTools = useMemo(() => {
    if (!tools) return [];

    // First apply the specific filter for this page type
    const typeFilteredTools = filterTools(tools);

    // Then apply search filter
    const searchFilter = (tool: Tool) => {
      const combinedText = `${tool.type} ${
        tool.options?.title || ""
      }`.toLowerCase();
      return combinedText.includes(searchTerm.toLowerCase());
    };

    return typeFilteredTools.filter(searchFilter);
  }, [tools, searchTerm, filterTools]);

  return (
    <Page title={t(pageTitleKey)}>
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
              onRowClick={({ row }) => {
                const toolName: string = row.type;
                if (toolName) {
                  void navigate(`${baseRoute}/${toolName}`);
                }
              }}
            />
          </Grid>
        </>
      )}
    </Page>
  );
}
