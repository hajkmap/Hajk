import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import DirectionsIcon from "@material-ui/icons/Directions";
import CreateIcon from "@material-ui/icons/Create";
import ImportExportIcon from "@material-ui/icons/ImportExport";
import SettingsIcon from "@material-ui/icons/Settings";

export const ACTIVITIES = [
  { id: "ADD", tooltip: "Lägg till nya objekt.", icon: <AddIcon /> },
  { id: "EDIT", tooltip: "Redigera existerande objekt.", icon: <CreateIcon /> },
  {
    id: "MOVE",
    tooltip: "Flytta existerande objekt.",
    icon: <DirectionsIcon />,
  },
  { id: "DELETE", tooltip: "Ta bort objekt.", icon: <DeleteIcon /> },
  {
    id: "SAVE",
    tooltip: "Spara eller ladda upp ritade objekt.",
    icon: <ImportExportIcon />,
  },
  {
    id: "SETTINGS",
    tooltip: "Ändra färg, linjebredd, etc.",
    icon: <SettingsIcon />,
  },
];
export const PLUGIN_MARGIN = 10;
