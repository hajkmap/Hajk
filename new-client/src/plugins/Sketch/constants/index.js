import AddIcon from "@material-ui/icons/Add";
import EditIcon from "@material-ui/icons/Edit";
import ImportExportIcon from "@material-ui/icons/ImportExport";
import SettingsIcon from "@material-ui/icons/Settings";

export const TABS = [
  {
    tooltip: "Skapa nya objekt",
    label: "Lägg till",
    icon: <AddIcon />,
  },
  {
    tooltip: "Editera existerande objekt",
    label: "Editera",
    icon: <EditIcon />,
  },
  {
    tooltip: "Importera och exportera till/från en .kml fil.",
    label: "Spara",
    icon: <ImportExportIcon />,
  },
  {
    tooltip: "Inställningar",
    label: "Inställningar",
    icon: <SettingsIcon />,
  },
];

export const PLUGIN_MARGIN = 10;
