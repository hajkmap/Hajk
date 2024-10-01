import Grid from "@mui/material/Grid2";
import { Button, List, ListItem, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useLayers } from "../../api/layers";
import useAppStateStore from "../../store/use-app-state-store";

export default function LayersPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useLayers();
  const { layers, count } = data ?? {};

  const themeMode = useAppStateStore((state) => state.themeMode);
  const setThemeMode = useAppStateStore((state) => state.setThemeMode);

  return isLoading ? (
    <div>Loading...</div>
  ) : (
    <Grid size={12}>
      <Typography variant="h2" textAlign="center">
        {t("common.layers")}
        {count && ` (${count})`}
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
