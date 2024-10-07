import { Typography, Button, Tooltip } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useLayers } from "../../api/layers";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";
import HajkDataGrid from "../../components/hajk-data-grid";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { grey } from "@mui/material/colors";
import dataGridLocaleTextSV from "../../i18n/translations/datagrid-sv.json";
import dataGridLocaleTextEN from "../../i18n/translations/datagrid-en.json";
import useAppStateStore from "../../store/use-app-state-store";
import ThemeSwitcher from "../../components/theme-switcher";
import LanguageSwitcher from "../../components/language-switcher";

export default function LayersPage() {
  const { t } = useTranslation();
  const { data: layers, isLoading, error } = useLayers();
  const language = useAppStateStore((state) => state.language);

  type GRID_LOCALE_TEXT = Record<string, string>;

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
      field: "serviceType",
      headerName: GRID_LOCALE_TEXT!.layersColumnHeaderService,
      minWidth: 120,
      flex: 0.1,
      searchable: true,
    },
    {
      field: "name",
      headerName: GRID_LOCALE_TEXT!.layersColumnHeaderName,
      minWidth: 150,
      flex: 0.2,
      searchable: true,
    },
    {
      field: "url",
      headerName: GRID_LOCALE_TEXT!.layersColumnHeaderURL,
      minWidth: 300,
      flex: 0.4,
      searchable: true,
    },
    {
      field: "usedBy",
      headerName: GRID_LOCALE_TEXT!.layersColumnHeaderUsedBy,
      minWidth: 150,
      flex: 0.1,
    },
    {
      field: "isBroken",
      headerName: GRID_LOCALE_TEXT!.layersColumnHeaderIsBroken,
      minWidth: 110,
      flex: 0.1,
      renderCell: () => (
        <Tooltip title={GRID_LOCALE_TEXT!.layersColumnBrokenLayerWarning}>
          <WarningAmberIcon sx={{ color: "black", maxWidth: "fit-content" }} />
        </Tooltip>
      ),
    },
    {
      field: "actions",
      headerName: GRID_LOCALE_TEXT!.layersColumnHeaderActions,
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
    layers?.map((layer) => ({
      id: layer.id,
      serviceType: layer.options.content,
      name: layer.options.caption,
      url: layer.options.infoUrl,
      usedBy: layer.options.opacity,
      isBroken: layer.options.opacity,
      actions: "",
    })) ?? [];

  return (
    <Page title={t("common.layers")}>
      <Grid size={12} sx={{ m: 3 }}>
        <Grid size={12} container justifyContent={"space-between"}>
          <Grid size={6}>
            <Typography variant="h3" textAlign="left">
              {t("common.layers")}
            </Typography>
          </Grid>
          <Grid
            size={6}
            display={"flex"}
            justifyContent={"flex-end"}
            alignItems={"end"}
          >
            <Button
              variant="contained"
              sx={{ backgroundColor: "black", height: "35px", width: "180px" }}
            >
              {t("common.layers")}
            </Button>
          </Grid>
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
