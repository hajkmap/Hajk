import { Typography, Button, Tooltip } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useLayers } from "../../api/layers";
import { useTranslation } from "react-i18next";
import HajkDataGrid from "../../components/hajk-data-grid";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { grey } from "@mui/material/colors";
import LanguageSwitcher from "../../components/language-switcher";
import ThemeSwitcher from "../../components/theme-switcher";

export default function LayersPage() {
  const { t } = useTranslation();
  const { data: layers, isLoading, error } = useLayers();

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography>Error loading data</Typography>;
  }

  const GRID_SWEDISH_LOCALE_TEXT = {
    columnMenuUnsort: "Ingen sortering",
    columnMenuSortAsc: "Sortera på ordning stigande",
    columnMenuSortDesc: "Sortera på ordning fallande",
    columnMenuFilter: "Filtrera",
    columnMenuHideColumn: "Göm kolumner",
    columnMenuShowColumns: "Visa kolumner",
    columnHeaderService: "Tjänstetyp",
    columnHeaderName: "Internt namn",
    columnHeaderURL: "URL",
    columnHeaderUsedBy: "Används i kartor",
    columnHeaderIsBroken: "Trasigt lager",
    columnHeaderActions: "Åtgärder",
    brokenLayerWarning: "Lagret är fucking trasigt bror, fixa",
  };

  const columns = [
    {
      field: "serviceType",
      headerName: GRID_SWEDISH_LOCALE_TEXT.columnHeaderService,
      minWidth: 120,
      flex: 0.1,
    },
    {
      field: "name",
      headerName: GRID_SWEDISH_LOCALE_TEXT.columnHeaderName,
      minWidth: 150,
      flex: 0.2,
    },
    {
      field: "url",
      headerName: GRID_SWEDISH_LOCALE_TEXT.columnHeaderURL,
      minWidth: 300,
      flex: 0.4,
    },
    {
      field: "usedBy",
      headerName: GRID_SWEDISH_LOCALE_TEXT.columnHeaderUsedBy,
      minWidth: 150,
      flex: 0.1,
    },
    {
      field: "isBroken",
      headerName: GRID_SWEDISH_LOCALE_TEXT.columnHeaderIsBroken,
      minWidth: 110,
      flex: 0.1,
      renderCell: () => (
        <Tooltip title={GRID_SWEDISH_LOCALE_TEXT.brokenLayerWarning}>
          <WarningAmberIcon sx={{ color: "black", maxWidth: "fit-content" }} />
        </Tooltip>
      ),
    },
    {
      field: "actions",
      headerName: GRID_SWEDISH_LOCALE_TEXT.columnHeaderActions,
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
            Lägg till {t("common.layers")}
          </Button>
        </Grid>
      </Grid>
      <HajkDataGrid
        rows={rows}
        columns={columns}
        localeText={GRID_SWEDISH_LOCALE_TEXT}
        searchPlaceholder="Sök på lager..."
      />
      <Grid container gap={2} size={12} sx={{ mt: 2 }}>
        <ThemeSwitcher />
        <LanguageSwitcher />
      </Grid>
    </Grid>
  );
}
