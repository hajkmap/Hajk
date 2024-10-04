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
import dataGridLocaleText from "../../i18n/translations/datagrid-sv.json";

export default function LayersPage() {
  const { t } = useTranslation();
  const { data: layers, isLoading, error } = useLayers();

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography>Error loading data</Typography>;
  }

  const columns = [
    {
      field: "serviceType",
      headerName:
        (dataGridLocaleText?.translation
          ?.layersColumnHeaderService as string) ?? "",
      minWidth: 120,
      flex: 0.1,
    },
    {
      field: "name",
      headerName:
        (dataGridLocaleText?.translation?.layersColumnHeaderName as string) ??
        "",
      minWidth: 150,
      flex: 0.2,
    },
    {
      field: "url",
      headerName:
        (dataGridLocaleText?.translation?.layersColumnHeaderURL as string) ??
        "",
      minWidth: 300,
      flex: 0.4,
    },
    {
      field: "usedBy",
      headerName:
        (dataGridLocaleText?.translation?.layersColumnHeaderUsedBy as string) ??
        "",
      minWidth: 150,
      flex: 0.1,
    },
    {
      field: "isBroken",
      headerName:
        (dataGridLocaleText?.translation
          ?.layersColumnHeaderIsBroken as string) ?? "",
      minWidth: 110,
      flex: 0.1,

      renderCell: () => (
        <Tooltip
          title={
            (dataGridLocaleText?.translation
              ?.layersColumnBrokenLayerWarning as string) ?? ""
          }
        >
          <WarningAmberIcon sx={{ color: "black", maxWidth: "fit-content" }} />
        </Tooltip>
      ),
    },
    {
      field: "actions",
      headerName:
        (dataGridLocaleText?.translation
          ?.layersColumnHeaderActions as string) ?? "",
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
        localeText={dataGridLocaleText.translation}
        searchPlaceholder="Sök på lager..."
      />
      <Grid container gap={2} size={12} sx={{ mt: 2 }}>
        <ThemeSwitcher />
        <LanguageSwitcher />
      </Grid>
    </Grid>
  );
}
