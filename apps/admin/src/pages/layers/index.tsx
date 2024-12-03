import { Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useLayers } from "../../api/layers";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";
import CustomDataGrid from "../../components/custom-data-grid";
import dataGridLocaleTextSV from "../../i18n/translations/datagrid-sv.json";
import dataGridLocaleTextEN from "../../i18n/translations/datagrid-en.json";
import useAppStateStore from "../../store/use-app-state-store";
import ThemeSwitcher from "../../components/theme-switcher";
import LanguageSwitcher from "../../components/language-switcher";
import mapLayerColumns, { mapLayerRows } from "./grid-data";

export default function LayersPage() {
  const { t } = useTranslation();
  const { data: layers, isLoading, error } = useLayers();
  // const [dialogOpen, setDialogOpen] = useState(false);
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

  const columns = mapLayerColumns(currentTranslation);
  const rows = layers ? mapLayerRows(layers) : [];

  return (
    <Page title={t("common.layers")}>
      <Grid size={12}>
        <CustomDataGrid
          rows={rows}
          columns={columns}
          localeText={currentTranslation}
          buttonText={t("common.layers")}
        />
        <Grid container gap={2} size={12} sx={{ mt: 2 }}>
          <ThemeSwitcher />
          <LanguageSwitcher />
        </Grid>
      </Grid>
    </Page>
  );
}
