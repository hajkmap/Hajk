import Grid from "@mui/material/Grid2";
import { Button, List, ListItem, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useTools } from "../../api/tools";
import useAppStateStore from "../../store/use-app-state-store";

export default function ToolsPage() {
  const { t } = useTranslation();
  const { data: tools, isLoading } = useTools();

  const themeMode = useAppStateStore((state) => state.themeMode);
  const setThemeMode = useAppStateStore((state) => state.setThemeMode);

  return isLoading ? (
    <div>Loading...</div>
  ) : (
    <Grid size={12}>
      <Typography variant="h2" textAlign="center">
        {t("common.tools")}
        {tools && ` (${tools.length})`}
      </Typography>

      <List>
        {tools?.map((tool) => (
          <ListItem key={tool.id}>
            <Paper sx={{ width: "100%", p: 2 }} elevation={4}>
              <Typography>{tool.type}</Typography>
            </Paper>
          </ListItem>
        ))}
      </List>
      <Paper sx={{ p: 2, m: 2 }} elevation={4}>
        <Typography>{`Current theme: ${themeMode}`}</Typography>
        <Button
          onClick={() => setThemeMode(themeMode === "light" ? "dark" : "light")}
          variant="contained"
        >
          Toggle theme
        </Button>
      </Paper>
    </Grid>
  );
}
