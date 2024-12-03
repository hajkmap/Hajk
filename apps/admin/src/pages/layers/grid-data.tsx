import { Tooltip, IconButton } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import MoreVertIcon from "@mui/icons-material/MoreVert";

export default function mapLayerColumns(localeText: Record<string, string>) {
  return [
    {
      field: "serviceType",
      headerName: localeText.layersColumnHeaderService,
      minWidth: 120,
      flex: 0.1,
      searchable: true,
    },
    {
      field: "name",
      headerName: localeText.layersColumnHeaderName,
      minWidth: 150,
      flex: 0.2,
      searchable: true,
    },
    {
      field: "url",
      headerName: localeText.layersColumnHeaderURL,
      minWidth: 250,
      flex: 0.3,
      searchable: true,
    },
    {
      field: "usedBy",
      headerName: localeText.layersColumnHeaderUsedBy,
      minWidth: 150,
      flex: 0.1,
      searchable: false,
    },
    {
      field: "isBroken",
      headerName: localeText.layersColumnHeaderIsBroken,
      minWidth: 110,
      flex: 0.1,
      searchable: false,
      renderCell: () => (
        <Tooltip title={localeText.layersColumnBrokenLayerWarning}>
          <WarningAmberIcon sx={{ color: "black", maxWidth: "fit-content" }} />
        </Tooltip>
      ),
    },
    {
      field: "actions",
      headerName: localeText.layersColumnHeaderActions,
      minWidth: 110,
      flex: 0.1,
      searchable: false,

      renderCell: () => (
        <IconButton size="small">
          <MoreVertIcon sx={{ color: "black", maxWidth: "fit-content" }} />
        </IconButton>
      ),
    },
  ];
}

interface LayerItem {
  id: string;
  options: {
    content: string;
    caption: string;
    infoUrl: string;
    opacity: string;
    isBroken: boolean;
  };
}

export function mapLayerRows(data: LayerItem[]) {
  return data.map((layer) => ({
    id: layer.id,
    serviceType: layer.options.content,
    name: layer.options.caption,
    url: layer.options.infoUrl,
    usedBy: layer.options.opacity,
    isBroken: layer.options.isBroken,
    actions: "",
  }));
}
