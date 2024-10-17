import Grid from "@mui/material/Grid2";
import { List, ListItem, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useMaps } from "../../api/maps";
import Page from "../../layouts/root/components/page";
import LanguageSwitcher from "../../components/language-switcher";
import ThemeSwitcher from "../../components/theme-switcher";

export default function MapsPage() {
  const { t } = useTranslation();
  const { data: maps, isLoading } = useMaps();

  return (
    <Page title={t("common.maps")}>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <Grid size={12}>
            <Typography variant="h2" textAlign="center">
              {t("common.maps")}
              {maps && ` (${maps.length})`}
            </Typography>

            <List>
              {maps?.map((map) => (
                <ListItem key={map} sx={{ padding: "10px 10px 10px 0" }}>
                  <Paper sx={{ width: "100%", p: 2 }} elevation={4}>
                    <Typography>{map}</Typography>
                  </Paper>
                </ListItem>
              ))}
            </List>
            <Grid container gap={2} size={12}>
              <ThemeSwitcher />
              <LanguageSwitcher />
            </Grid>
          </Grid>
        </>
      )}
    </Page>
  );
}
