import Grid from "@mui/material/Grid2";
import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useMaps } from "../../api/maps";
import CustomDataGrid from "../../components/custom-data-grid";
import Page from "../../layouts/root/components/page";
import dataGridLocaleTextSV from "../../i18n/translations/datagrid-sv.json";
import dataGridLocaleTextEN from "../../i18n/translations/datagrid-en.json";
import useAppStateStore from "../../store/use-app-state-store";
import ThemeSwitcher from "../../components/theme-switcher";
import LanguageSwitcher from "../../components/language-switcher";
import mapMapColumns from "./map-columns";
import mapMapRows from "./map-rows";
export default function MapsPage() {
  const { t } = useTranslation();
  const { data: maps, isLoading, error } = useMaps();
  const language = useAppStateStore((state) => state.language);

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography>Error loading data</Typography>;
  }

  const currentTranslation =
    language === "sv"
      ? dataGridLocaleTextSV.translation
      : dataGridLocaleTextEN.translation;

  const columns = mapMapColumns(currentTranslation);
  const rows = maps ? mapMapRows(maps) : [];

  return (
    <Page title={t("common.maps")}>
      <Grid size={12}>
        <Grid size={12} container justifyContent={"end"}></Grid>
        <CustomDataGrid
          rows={rows}
          columns={columns}
          localeText={currentTranslation}
          buttonText={t("common.maps")}
        />
        <Grid container gap={2} size={12} sx={{ mt: 2 }}>
          <ThemeSwitcher />
          <LanguageSwitcher />
        </Grid>
      </Grid>
    </Page>
  );
}
