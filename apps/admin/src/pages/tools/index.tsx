import Grid from "@mui/material/Grid2";
import { Typography, Button, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useTools } from "../../api/tools";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { grey } from "@mui/material/colors";
import HajkDataGrid from "../../components/hajk-data-grid";
import LanguageSwitcher from "../../components/language-switcher";
import ThemeSwitcher from "../../components/theme-switcher";

export default function ToolsPage() {
  const { t } = useTranslation();
  const { data: tools, isLoading, error } = useTools();

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
    columnHeaderName: "Titel",
    columnHeaderDescription: "Beskrivning",
    columnHeaderUsedBy: "Används i HAJK",
    columnHeaderIsBroken: "Trasigt lager",
    columnHeaderActions: "Åtgärder",
  };

  const columns = [
    {
      field: "title",
      headerName: GRID_SWEDISH_LOCALE_TEXT.columnHeaderName,
      minWidth: 120,
      flex: 0.1,
    },
    {
      field: "description",
      headerName: GRID_SWEDISH_LOCALE_TEXT.columnHeaderDescription,
      minWidth: 150,
      flex: 0.3,
    },
    {
      field: "usedInHajk",
      headerName: GRID_SWEDISH_LOCALE_TEXT.columnHeaderUsedBy,
      minWidth: 300,
      flex: 0.2,
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
    tools?.map((tool) => ({
      id: tool.id,
      title: tool.options.title || tool.type,
      description: tool.options.description || "Beskrivning saknas",
      usedInHajk: tool.options.visibleForGroups || "Ingen",
      actions: "",
    })) ?? [];

  return (
    <Grid size={12} sx={{ m: 3 }}>
      <Grid size={12} container justifyContent={"space-between"}>
        <Grid size={6}>
          <Typography variant="h3" textAlign="left">
            {t("common.tools")}
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
            Lägg till {t("common.tools")}
          </Button>
        </Grid>
      </Grid>
      <HajkDataGrid
        rows={rows}
        columns={columns}
        localeText={GRID_SWEDISH_LOCALE_TEXT}
        searchPlaceholder="Sök på verktyg..."
      />
      <Grid container gap={2} size={12} sx={{ mt: 2 }}>
        <ThemeSwitcher />
        <LanguageSwitcher />
      </Grid>
    </Grid>
  );
}
