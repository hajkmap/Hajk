import Grid from "@mui/material/Grid2";
import { List, ListItem, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useTools } from "../../api/tools";
import LanguageSwitcher from "../../components/language-switcher";
import ThemeSwitcher from "../../components/theme-switcher";

export default function ToolsPage() {
  const { t } = useTranslation();
  const { data: tools, isLoading } = useTools();

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
      <Grid container gap={2} size={12}>
        <ThemeSwitcher />
        <LanguageSwitcher />
      </Grid>
    </Grid>
  );
}
