import { Typography, Button, Box, Tooltip } from "@mui/material";
import { useLayers } from "../../api/layers";
import { useTranslation } from "react-i18next";
import HajkDataGrid from "../../components/hajk-data-grid";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { grey } from "@mui/material/colors";

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
      minWidth: 150,
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
    <Box sx={{ m: 3 }}>
      <Typography variant="h3" textAlign="left">
        {t("common.layers")}
      </Typography>
      <HajkDataGrid
        rows={rows}
        columns={columns}
        localeText={GRID_SWEDISH_LOCALE_TEXT}
        searchPlaceholder="Search for layers..."
      />
    </Box>
  );
}
