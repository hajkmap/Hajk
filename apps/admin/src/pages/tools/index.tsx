import Grid from "@mui/material/Grid2";
import { List, ListItem, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useTools } from "../../api/tools";
import Page from "../../layouts/root/components/page";

export default function ToolsPage() {
  const { t } = useTranslation();
  const { data: tools, isLoading } = useTools();

  return (
    <Page title={t("common.tools")}>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Grid size={12}>
          <p>tools.length = {tools && ` (${tools.length})`}</p>
          <List>
            {tools?.map((tool) => (
              <ListItem key={tool.id}>
                <Paper sx={{ width: "100%", p: 2 }} elevation={4}>
                  <Typography>{tool.type}</Typography>
                </Paper>
              </ListItem>
            ))}
          </List>
        </Grid>
      )}
    </Page>
  );
}
