import { Typography, Button } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useLayers } from "../../api/layers";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";
import HajkDataGrid from "../../components/hajk-data-grid";
import dataGridLocaleTextSV from "../../i18n/translations/datagrid-sv.json";
import dataGridLocaleTextEN from "../../i18n/translations/datagrid-en.json";
import useAppStateStore from "../../store/use-app-state-store";
import ThemeSwitcher from "../../components/theme-switcher";
import LanguageSwitcher from "../../components/language-switcher";
import getLayerColumns from "./columns";
import { mapLayerRows } from "./columns";

export default function LayersPage() {
  const { t } = useTranslation();
  const { data: layers, isLoading, error } = useLayers();
  const language = useAppStateStore((state) => state.language);

  // type GRID_LOCALE_TEXT = Record<string, string>;

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
  const columns = getLayerColumns(currentTranslation);
  const rows = layers ? mapLayerRows(layers) : [];
  const searchFields = columns
    .filter((column) => column.searchable)
    .map((column) => column.field);

  return (
    <Page title={t("common.layers")}>
      <Grid size={12} sx={{ m: 3 }}>
        <Grid size={12} container justifyContent={"end"}>
          <Button
            variant="contained"
            sx={{ backgroundColor: "black", height: "35px", width: "180px" }}
          >
            {t("common.layers")}
          </Button>
        </Grid>
        <HajkDataGrid
          rows={rows}
          columns={columns}
          searchFields={searchFields}
          localeText={currentTranslation}
        />
        <Grid container gap={2} size={12} sx={{ mt: 2 }}>
          <ThemeSwitcher />
          <LanguageSwitcher />
        </Grid>
      </Grid>
    </Page>
  );
}
