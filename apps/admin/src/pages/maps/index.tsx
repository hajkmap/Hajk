import Grid from "@mui/material/Grid2";
import { Typography, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useMaps } from "../../api/maps";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { grey } from "@mui/material/colors";
import HajkDataGrid from "../../components/hajk-data-grid";
import Page from "../../layouts/root/components/page";
import dataGridLocaleTextSV from "../../i18n/translations/datagrid-sv.json";
import dataGridLocaleTextEN from "../../i18n/translations/datagrid-en.json";
import useAppStateStore from "../../store/use-app-state-store";
import ThemeSwitcher from "../../components/theme-switcher";
import LanguageSwitcher from "../../components/language-switcher";
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

  let currentTranslation;
  if (language === "sv") {
    currentTranslation = dataGridLocaleTextSV.translation;
  } else if (language === "en") {
    currentTranslation = dataGridLocaleTextEN.translation;
  }
  const GRID_LOCALE_TEXT = currentTranslation;

  const columns = [
    {
      field: "name",
      headerName: GRID_LOCALE_TEXT!.mapsColumnHeaderName,
      minWidth: 120,
      flex: 0.1,
      searchable: true,
    },
    {
      field: "description",
      headerName: GRID_LOCALE_TEXT!.mapsColumnHeaderDescription,
      minWidth: 150,
      flex: 0.2,
      searchable: true,
    },
    {
      field: "mapId",
      headerName: GRID_LOCALE_TEXT!.mapsColumnHeaderMapId,
      minWidth: 300,
      flex: 0.4,
    },
    {
      field: "actions",
      headerName: GRID_LOCALE_TEXT!.mapsColumnHeaderActions,
      renderCell: () => (
        <Button
          variant="contained"
          size="small"
          sx={{
            backgroundColor: grey[300],
            width: "24px",
            minWidth: "10px",
            height: "28px",
          }}
        >
          <MoreVertIcon sx={{ color: "black", maxWidth: "fit-content" }} />
        </Button>
      ),
    },
  ];

  const searchFields = columns
    .filter((column) => column.searchable)
    .map((column) => column.field);

  const rows =
    maps?.map((map) => ({
      id: map,
      description: map,
      name: map,
      mapId: map,
      actions: "",
    })) ?? [];

  return (
    <Page title={t("common.maps")}>
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
          localeText={GRID_LOCALE_TEXT}
          searchFields={searchFields}
        />
        <Grid container gap={2} size={12} sx={{ mt: 2 }}>
          <ThemeSwitcher />
          <LanguageSwitcher />
        </Grid>
      </Grid>
    </Page>
  );
}
