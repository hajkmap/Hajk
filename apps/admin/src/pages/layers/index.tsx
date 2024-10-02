import Grid from "@mui/material/Grid2";
import { List, ListItem, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useLayers } from "../../api/layers";
import LanguageSwitcher from "../../components/language-switcher";
import ThemeSwitcher from "../../components/theme-switcher";

export default function LayersPage() {
  const { t } = useTranslation();
  const { data: layers, isLoading } = useLayers();

  return isLoading ? (
    <div>Loading...</div>
  ) : (
    <Grid size={12}>
      <Typography variant="h2" textAlign="center">
        {t("common.layers")}
        {layers && ` (${layers.length})`}
      </Typography>

      <List>
        {layers?.map((layer) => (
          <ListItem key={layer.id}>
            <Paper sx={{ width: "100%", p: 2 }} elevation={4}>
              <Typography>{layer.options.caption}</Typography>
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
