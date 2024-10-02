import Grid from "@mui/material/Grid2";
import { Button, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

import useAppStateStore from "../store/use-app-state-store";

export default function ThemeSwitcher() {
  const { t } = useTranslation();
  const themeMode = useAppStateStore((state) => state.themeMode);
  const setThemeMode = useAppStateStore((state) => state.setThemeMode);

  return (
    <Paper elevation={4} sx={{ height: 80, width: 150 }}>
      <Grid
        container
        sx={{ height: "100%", width: "100%" }}
        justifyContent="center"
        alignContent="center"
      >
        <Button
          startIcon={
            themeMode === "light" ? <DarkModeIcon /> : <LightModeIcon />
          }
          onClick={() => setThemeMode(themeMode === "light" ? "dark" : "light")}
          variant="contained"
        >
          {t(themeMode === "light" ? "dark" : "light")}
        </Button>
      </Grid>
    </Paper>
  );
}
