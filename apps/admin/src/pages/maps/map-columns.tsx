import { IconButton } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

export default function mapMapColumns(localeText: Record<string, string>) {
  return [
    {
      field: "name",
      headerName: localeText.mapsColumnHeaderName,
      minWidth: 120,
      flex: 0.1,
      searchable: true,
    },
    {
      field: "description",
      headerName: localeText.mapsColumnHeaderDescription,
      minWidth: 150,
      flex: 0.2,
      searchable: true,
    },
    {
      field: "mapId",
      headerName: localeText.mapsColumnHeaderMapId,
      minWidth: 300,
      flex: 0.4,
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
