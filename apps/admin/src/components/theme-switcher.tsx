import Grid from "@mui/material/Grid2";
import { Box, Radio, Typography, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

import useAppStateStore from "../store/use-app-state-store";

export default function ThemeSwitcher() {
  const { t } = useTranslation();
  const themeMode = useAppStateStore((state) => state.themeMode);
  const setThemeMode = useAppStateStore((state) => state.setThemeMode);

  return (
    <Paper
      elevation={4}
      sx={{
        padding: 3,
        mb: 2,
      }}
    >
      <Typography variant="h6" gutterBottom>
        {t("common.theme")}
      </Typography>
      <Grid container justifyContent="center" alignContent="center">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            width: "100%",
            height: "100%",
            gap: 4,
            mt: 2,
          }}
        >
          <Grid size={6}>
            <Box
              sx={{
                border: "2px solid",
                borderColor:
                  themeMode === "light" ? "primary.main" : "grey.300",
                borderRadius: 2,
                padding: 2,
                textAlign: "center",
                width: 120,
              }}
            >
              <LightModeIcon
                fontSize="large"
                color={themeMode === "light" ? "primary" : "inherit"}
              />
              <Typography variant="body2" sx={{ marginTop: 1 }}>
                {t(themeMode === "dark" ? "light" : "light")}
              </Typography>
              <Radio
                value="light"
                checked={themeMode === "light"}
                onChange={() => setThemeMode("light")}
                sx={{ marginTop: 1 }}
              />
            </Box>
          </Grid>

          <Grid size={6}>
            <Box
              sx={{
                border: "2px solid",
                borderColor: themeMode === "dark" ? "primary.main" : "primary",
                borderRadius: 2,
                padding: 2,
                textAlign: "center",
                width: 120,
              }}
            >
              <DarkModeIcon
                fontSize="large"
                color={themeMode === "dark" ? "primary" : "inherit"}
              />
              <Typography variant="body2" sx={{ marginTop: 1 }}>
                {t(themeMode === "light" ? "dark" : "dark")}
              </Typography>
              <Radio
                value="dark"
                checked={themeMode === "dark"}
                onChange={() => setThemeMode("dark")}
                sx={{ marginTop: 1 }}
              />
            </Box>
          </Grid>
        </Box>
      </Grid>
    </Paper>
  );
}
